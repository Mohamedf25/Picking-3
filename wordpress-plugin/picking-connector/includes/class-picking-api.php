<?php
/**
 * Picking Connector API
 * 
 * Handles all REST API endpoints for the picking app.
 */

if (!defined('ABSPATH')) {
    exit;
}

class Picking_API {
    
    public function register_routes() {
        $namespace = 'picking/v1';
        
        register_rest_route($namespace, '/get-settings', array(
            'methods' => 'GET',
            'callback' => array($this, 'get_settings'),
            'permission_callback' => '__return_true',
        ));
        
        register_rest_route($namespace, '/get-order-products', array(
            'methods' => 'GET',
            'callback' => array($this, 'get_order_products'),
            'permission_callback' => '__return_true',
        ));
        
        register_rest_route($namespace, '/pickinglist', array(
            'methods' => 'GET',
            'callback' => array($this, 'get_picking_list'),
            'permission_callback' => '__return_true',
        ));
        
        register_rest_route($namespace, '/update-order-products', array(
            'methods' => 'POST',
            'callback' => array($this, 'update_order_products'),
            'permission_callback' => '__return_true',
        ));
        
        register_rest_route($namespace, '/reset-order-products', array(
            'methods' => 'GET',
            'callback' => array($this, 'reset_order_products'),
            'permission_callback' => '__return_true',
        ));
        
        register_rest_route($namespace, '/get-packing-orders', array(
            'methods' => 'GET',
            'callback' => array($this, 'get_packing_orders'),
            'permission_callback' => '__return_true',
        ));
        
        register_rest_route($namespace, '/update-order-status', array(
            'methods' => 'POST',
            'callback' => array($this, 'update_order_status'),
            'permission_callback' => '__return_true',
        ));
        
        register_rest_route($namespace, '/create-order-note', array(
            'methods' => 'POST',
            'callback' => array($this, 'create_order_note'),
            'permission_callback' => '__return_true',
        ));
        
        register_rest_route($namespace, '/get-categories', array(
            'methods' => 'GET',
            'callback' => array($this, 'get_categories'),
            'permission_callback' => '__return_true',
        ));
        
        register_rest_route($namespace, '/get-product', array(
            'methods' => 'GET',
            'callback' => array($this, 'get_product'),
            'permission_callback' => '__return_true',
        ));
        
        register_rest_route($namespace, '/update-product', array(
            'methods' => 'POST',
            'callback' => array($this, 'update_product'),
            'permission_callback' => '__return_true',
        ));
        
        register_rest_route($namespace, '/reset-picking-orders', array(
            'methods' => 'GET',
            'callback' => array($this, 'reset_picking_orders'),
            'permission_callback' => '__return_true',
        ));
        
        register_rest_route($namespace, '/get-customers', array(
            'methods' => 'GET',
            'callback' => array($this, 'get_customers'),
            'permission_callback' => '__return_true',
        ));
        
        register_rest_route($namespace, '/create-batch', array(
            'methods' => 'POST',
            'callback' => array($this, 'create_batch'),
            'permission_callback' => '__return_true',
        ));
        
        register_rest_route($namespace, '/unclaim-order', array(
            'methods' => 'POST',
            'callback' => array($this, 'unclaim_order'),
            'permission_callback' => '__return_true',
        ));
        
        register_rest_route($namespace, '/upload-photo', array(
            'methods' => 'POST',
            'callback' => array($this, 'upload_photo'),
            'permission_callback' => '__return_true',
        ));
        
        register_rest_route($namespace, '/config', array(
            'methods' => 'GET',
            'callback' => array($this, 'get_config'),
            'permission_callback' => '__return_true',
        ));
        
        register_rest_route($namespace, '/connect', array(
            'methods' => array('GET', 'POST', 'OPTIONS'),
            'callback' => array($this, 'handle_connection'),
            'permission_callback' => '__return_true',
        ));
        
        register_rest_route($namespace, '/debug-auth', array(
            'methods' => 'GET',
            'callback' => array($this, 'debug_auth'),
            'permission_callback' => '__return_true',
        ));
    }
    
    public function debug_auth($request) {
        $token_param = $request->get_param('token');
        $pk_key_param = $request->get_param('pk_key');
        $header_token = $request->get_header('X-Picking-Token');
        $stored = get_option('picking_api_key', '');
        
        return array(
            'token_param_prefix' => $token_param ? substr($token_param, 0, 8) : null,
            'pk_key_param_prefix' => $pk_key_param ? substr($pk_key_param, 0, 8) : null,
            'header_token_prefix' => $header_token ? substr($header_token, 0, 8) : null,
            'stored_prefix' => $stored ? substr($stored, 0, 8) : null,
            'all_headers' => array_keys($request->get_headers()),
        );
    }
    
    private function validate_token($request) {
        $token = $request->get_param('token');
        
        if (empty($token)) {
            $token = $request->get_header('X-Picking-Token');
        }
        
        $api_key = get_option('picking_api_key', '');
        
        if (empty($token) || $token !== $api_key) {
            return false;
        }
        
        return true;
    }
    
    private function unauthorized_response() {
        return new WP_Error('unauthorized', __('Token invalido o no proporcionado.', 'picking-connector'), array('status' => 401));
    }
    
    private function is_hpos_enabled() {
        if (class_exists('Automattic\WooCommerce\Internal\DataStores\Orders\CustomOrdersTableController')) {
            $controller = wc_get_container()->get('Automattic\WooCommerce\Internal\DataStores\Orders\CustomOrdersTableController');
            return $controller->custom_orders_table_usage_is_enabled();
        }
        return false;
    }
    
    public function get_settings($request) {
        if (!$this->validate_token($request)) {
            return $this->unauthorized_response();
        }
        
        if (!class_exists('WooCommerce')) {
            return new WP_Error('woocommerce_required', __('WooCommerce no esta instalado.', 'picking-connector'), array('status' => 500));
        }
        
        $order_status = get_option('picking_order_status', array('wc-processing'));
        if (!is_array($order_status)) {
            $order_status = array($order_status);
        }
        
        global $wpdb;
        
        if ($this->is_hpos_enabled()) {
            $status_placeholders = implode(',', array_fill(0, count($order_status), '%s'));
            $query = $wpdb->prepare(
                "SELECT id FROM {$wpdb->prefix}wc_orders WHERE type = 'shop_order' AND status IN ($status_placeholders) LIMIT 1000",
                ...$order_status
            );
        } else {
            $status_placeholders = implode(',', array_fill(0, count($order_status), '%s'));
            $query = $wpdb->prepare(
                "SELECT ID FROM {$wpdb->posts} WHERE post_type = 'shop_order' AND post_status IN ($status_placeholders) LIMIT 1000",
                ...$order_status
            );
        }
        
        $order_ids = $wpdb->get_col($query);
        
        $total_picking_orders = 0;
        $total_packing_orders = 0;
        $total_backorders = 0;
        $total_picking_products = 0;
        $user_orders = array();
        
        if (!empty($order_ids)) {
            $orders = wc_get_orders(array(
                'post__in' => $order_ids,
                'limit' => count($order_ids),
                'orderby' => 'date',
                'order' => 'ASC',
            ));
            
            foreach ($orders as $order) {
                $picking_status = $order->get_meta('picking_status');
                $user_claimed = $order->get_meta('user_claimed');
                
                switch ($picking_status) {
                    case 'picking':
                    case '':
                        if (!empty($user_claimed)) {
                            if (isset($user_orders[$user_claimed])) {
                                $user_orders[$user_claimed]++;
                            } else {
                                $user_orders[$user_claimed] = 1;
                            }
                        }
                        
                        $total_picking_products += count($order->get_items());
                        $total_picking_orders++;
                        break;
                        
                    case 'packing':
                        foreach ($order->get_items() as $item) {
                            $backorder = $item->get_meta('backorder');
                            if (!empty($backorder) && $backorder !== '0') {
                                $total_backorders++;
                                break;
                            }
                        }
                        $total_packing_orders++;
                        break;
                }
            }
        }
        
        return array(
            'total_picking_orders' => (int) $total_picking_orders,
            'total_packing_orders' => (int) $total_packing_orders,
            'total_backorders' => (int) $total_backorders,
            'total_picking_products' => (int) $total_picking_products,
            'plugin_version' => PICKING_VERSION,
            'user_orders' => $user_orders,
            'settings' => array(
                'batch_size' => (int) get_option('picking_batch_size', 1),
                'auto_complete' => get_option('picking_auto_complete', '1') === '1',
                'photo_required' => get_option('picking_photo_required', '1') === '1',
                'scanner_type' => get_option('picking_scanner_type', 'camera'),
                'order_status' => $order_status,
            )
        );
    }
    
    public function get_order_products($request) {
        if (!$this->validate_token($request)) {
            return $this->unauthorized_response();
        }
        
        $order_id = $request->get_param('order_id');
        $appuser = $request->get_param('appuser');
        
        if (empty($order_id)) {
            return new WP_Error('missing_order_id', __('ID de pedido requerido.', 'picking-connector'), array('status' => 400));
        }
        
        $order = wc_get_order($order_id);
        
        if (!$order) {
            return new WP_Error('order_not_found', __('Pedido no encontrado.', 'picking-connector'), array('status' => 404));
        }
        
        $user_claimed = $order->get_meta('user_claimed');
        if (!empty($user_claimed) && $user_claimed !== $appuser) {
            return new WP_Error('order_claimed', sprintf(__('Pedido reclamado por %s.', 'picking-connector'), $user_claimed), array('status' => 403));
        }
        
        if (!empty($appuser) && empty($user_claimed)) {
            $order->update_meta_data('user_claimed', $appuser);
            $order->update_meta_data('picking_status', 'picking');
            $order->update_meta_data('picking_started_at', current_time('mysql'));
            $order->save();
        }
        
        $products = array();
        
        foreach ($order->get_items() as $item_id => $item) {
            $product = $item->get_product();
            
            if (!$product) {
                continue;
            }
            
            $ean = '';
            $ean_meta_keys = array('_alg_ean', '_ean', '_gtin', '_barcode', 'ean', 'gtin', 'barcode');
            foreach ($ean_meta_keys as $meta_key) {
                $ean = $product->get_meta($meta_key);
                if (!empty($ean)) {
                    break;
                }
            }
            
            $image_url = '';
            $image_id = $product->get_image_id();
            if ($image_id) {
                $image_url = wp_get_attachment_image_url($image_id, 'thumbnail');
            }
            
            $picking_status = $item->get_meta('picking_status');
            $picked_qty = $item->get_meta('picked_qty');
            $backorder = $item->get_meta('backorder');
            
            $products[] = array(
                'item_id' => $item_id,
                'product_id' => $product->get_id(),
                'variation_id' => $item->get_variation_id(),
                'name' => $item->get_name(),
                'sku' => $product->get_sku(),
                'ean' => $ean,
                'quantity' => $item->get_quantity(),
                'picked_qty' => (int) ($picked_qty ?: 0),
                'backorder' => (int) ($backorder ?: 0),
                'picking_status' => $picking_status ?: 'pending',
                'price' => $item->get_total(),
                'image' => $image_url,
                'stock_quantity' => $product->get_stock_quantity(),
                'location' => $product->get_meta('_picking_location'),
                'weight' => $product->get_weight(),
            );
        }
        
        return array(
            'order_id' => $order->get_id(),
            'order_number' => $order->get_order_number(),
            'status' => $order->get_status(),
            'picking_status' => $order->get_meta('picking_status') ?: 'pending',
            'user_claimed' => $order->get_meta('user_claimed'),
            'date_created' => $order->get_date_created()->format('Y-m-d H:i:s'),
            'customer' => array(
                'name' => $order->get_formatted_billing_full_name(),
                'email' => $order->get_billing_email(),
                'phone' => $order->get_billing_phone(),
            ),
            'shipping' => array(
                'name' => $order->get_formatted_shipping_full_name(),
                'address_1' => $order->get_shipping_address_1(),
                'address_2' => $order->get_shipping_address_2(),
                'city' => $order->get_shipping_city(),
                'postcode' => $order->get_shipping_postcode(),
                'country' => $order->get_shipping_country(),
            ),
            'products' => $products,
            'total' => $order->get_total(),
            'currency' => $order->get_currency(),
            'notes' => $order->get_customer_note(),
        );
    }
    
    public function get_picking_list($request) {
        if (!$this->validate_token($request)) {
            return $this->unauthorized_response();
        }
        
        $appuser = $request->get_param('appuser');
        $batch_size = (int) get_option('picking_batch_size', 1);
        $order_status = get_option('picking_order_status', array('wc-processing'));
        
        if (!is_array($order_status)) {
            $order_status = array($order_status);
        }
        
        $args = array(
            'status' => $order_status,
            'limit' => $batch_size,
            'orderby' => 'date',
            'order' => 'ASC',
            'meta_query' => array(
                'relation' => 'OR',
                array(
                    'key' => 'picking_status',
                    'compare' => 'NOT EXISTS',
                ),
                array(
                    'key' => 'picking_status',
                    'value' => '',
                    'compare' => '=',
                ),
                array(
                    'key' => 'picking_status',
                    'value' => 'picking',
                    'compare' => '=',
                ),
            ),
        );
        
        if (!empty($appuser)) {
            $args['meta_query'][] = array(
                'relation' => 'OR',
                array(
                    'key' => 'user_claimed',
                    'compare' => 'NOT EXISTS',
                ),
                array(
                    'key' => 'user_claimed',
                    'value' => '',
                    'compare' => '=',
                ),
                array(
                    'key' => 'user_claimed',
                    'value' => $appuser,
                    'compare' => '=',
                ),
            );
        }
        
        $orders = wc_get_orders($args);
        
        $picking_list = array();
        $all_products = array();
        
        foreach ($orders as $order) {
            foreach ($order->get_items() as $item_id => $item) {
                $product = $item->get_product();
                
                if (!$product) {
                    continue;
                }
                
                $product_id = $product->get_id();
                $sku = $product->get_sku();
                
                $ean = '';
                $ean_meta_keys = array('_alg_ean', '_ean', '_gtin', '_barcode', 'ean', 'gtin', 'barcode');
                foreach ($ean_meta_keys as $meta_key) {
                    $ean = $product->get_meta($meta_key);
                    if (!empty($ean)) {
                        break;
                    }
                }
                
                $key = $product_id . '_' . $item->get_variation_id();
                
                if (!isset($all_products[$key])) {
                    $image_url = '';
                    $image_id = $product->get_image_id();
                    if ($image_id) {
                        $image_url = wp_get_attachment_image_url($image_id, 'thumbnail');
                    }
                    
                    $all_products[$key] = array(
                        'product_id' => $product_id,
                        'variation_id' => $item->get_variation_id(),
                        'name' => $item->get_name(),
                        'sku' => $sku,
                        'ean' => $ean,
                        'image' => $image_url,
                        'location' => $product->get_meta('_picking_location'),
                        'ordered' => 0,
                        'backorder' => 0,
                        'orders' => array(),
                    );
                }
                
                $all_products[$key]['ordered'] += $item->get_quantity();
                $all_products[$key]['orders'][] = array(
                    'order_id' => $order->get_id(),
                    'item_id' => $item_id,
                    'quantity' => $item->get_quantity(),
                );
            }
            
            $picking_list[] = array(
                'order_id' => $order->get_id(),
                'order_number' => $order->get_order_number(),
                'status' => $order->get_status(),
                'picking_status' => $order->get_meta('picking_status') ?: 'pending',
                'user_claimed' => $order->get_meta('user_claimed'),
                'date_created' => $order->get_date_created()->format('Y-m-d H:i:s'),
                'customer_name' => $order->get_formatted_billing_full_name(),
                'total' => $order->get_total(),
                'item_count' => $order->get_item_count(),
            );
        }
        
        return array(
            'orders' => $picking_list,
            'products' => array_values($all_products),
            'batch_size' => $batch_size,
            'total_orders' => count($picking_list),
            'total_products' => count($all_products),
        );
    }
    
    public function update_order_products($request) {
        if (!$this->validate_token($request)) {
            return $this->unauthorized_response();
        }
        
        $body = $request->get_body();
        $data = json_decode($body, true);
        
        if (isset($data[0]['orderid'])) {
            $data = $data[0];
        }
        
        $appuser = $request->get_param('appuser');
        
        if (empty($data['products'])) {
            return new WP_Error('missing_products', __('Productos requeridos.', 'picking-connector'), array('status' => 400));
        }
        
        $products = is_string($data['products']) ? json_decode($data['products'], true) : $data['products'];
        $status = isset($data['status']) ? $data['status'] : 'picking';
        
        $updated_orders = array();
        
        foreach ($products as $product) {
            $picked_amount = isset($product['ordered']) && isset($product['backorder']) 
                ? $product['ordered'] - $product['backorder'] 
                : 0;
            
            if (isset($product['orders'])) {
                foreach ($product['orders'] as $order_data) {
                    $order = wc_get_order($order_data['orderid']);
                    
                    if (!$order) {
                        continue;
                    }
                    
                    if (!in_array($order_data['orderid'], $updated_orders)) {
                        if ($status === 'completed') {
                            $order->add_order_note(sprintf(
                                __('Picking completado por %s.', 'picking-connector'),
                                $appuser
                            ));
                            
                            $auto_complete = get_option('picking_auto_complete', '1');
                            if ($auto_complete === '1') {
                                $completed_status = get_option('picking_completed_status', 'wc-completed');
                                $completed_status = str_replace('wc-', '', $completed_status);
                                $order->update_status($completed_status, __('Completado via Picking App.', 'picking-connector'));
                            }
                            
                            $order->update_meta_data('picking_status', 'completed');
                            $order->update_meta_data('picking_completed_at', current_time('mysql'));
                        } elseif ($status === 'packing') {
                            $order->update_meta_data('picking_status', 'packing');
                        }
                        
                        $updated_orders[] = $order_data['orderid'];
                    }
                    
                    foreach ($order->get_items() as $item_id => $item) {
                        if ($item_id == $order_data['item_id'] || 
                            $item->get_product_id() == $product['product_id']) {
                            
                            $item->update_meta_data('picking_status', $status);
                            $item->update_meta_data('picked_qty', $picked_amount);
                            $item->update_meta_data('backorder', isset($product['backorder']) ? $product['backorder'] : 0);
                            $item->save();
                        }
                    }
                    
                    $order->save();
                }
            }
        }
        
        return array(
            'success' => true,
            'message' => sprintf(__('%d pedidos actualizados.', 'picking-connector'), count($updated_orders)),
            'updated_orders' => $updated_orders,
        );
    }
    
    public function reset_order_products($request) {
        if (!$this->validate_token($request)) {
            return $this->unauthorized_response();
        }
        
        $order_id = $request->get_param('order_id');
        
        if (empty($order_id)) {
            return new WP_Error('missing_order_id', __('ID de pedido requerido.', 'picking-connector'), array('status' => 400));
        }
        
        $order = wc_get_order($order_id);
        
        if (!$order) {
            return new WP_Error('order_not_found', __('Pedido no encontrado.', 'picking-connector'), array('status' => 404));
        }
        
        $order->delete_meta_data('picking_status');
        $order->delete_meta_data('user_claimed');
        $order->delete_meta_data('picking_started_at');
        $order->delete_meta_data('picking_completed_at');
        
        foreach ($order->get_items() as $item) {
            $item->delete_meta_data('picking_status');
            $item->delete_meta_data('picked_qty');
            $item->delete_meta_data('backorder');
            $item->save();
        }
        
        $order->save();
        
        return array(
            'success' => true,
            'message' => __('Pedido reiniciado.', 'picking-connector'),
        );
    }
    
    public function get_packing_orders($request) {
        if (!$this->validate_token($request)) {
            return $this->unauthorized_response();
        }
        
        $order_status = get_option('picking_order_status', array('wc-processing'));
        if (!is_array($order_status)) {
            $order_status = array($order_status);
        }
        
        $orders = wc_get_orders(array(
            'status' => $order_status,
            'limit' => 100,
            'orderby' => 'date',
            'order' => 'ASC',
            'meta_query' => array(
                array(
                    'key' => 'picking_status',
                    'value' => 'packing',
                    'compare' => '=',
                ),
            ),
        ));
        
        $packing_list = array();
        
        foreach ($orders as $order) {
            $has_backorder = false;
            
            foreach ($order->get_items() as $item) {
                $backorder = $item->get_meta('backorder');
                if (!empty($backorder) && $backorder !== '0') {
                    $has_backorder = true;
                    break;
                }
            }
            
            $packing_list[] = array(
                'order_id' => $order->get_id(),
                'order_number' => $order->get_order_number(),
                'status' => $order->get_status(),
                'picking_status' => $order->get_meta('picking_status'),
                'user_claimed' => $order->get_meta('user_claimed'),
                'date_created' => $order->get_date_created()->format('Y-m-d H:i:s'),
                'customer_name' => $order->get_formatted_billing_full_name(),
                'total' => $order->get_total(),
                'item_count' => $order->get_item_count(),
                'has_backorder' => $has_backorder,
            );
        }
        
        return array(
            'orders' => $packing_list,
            'total' => count($packing_list),
        );
    }
    
    public function update_order_status($request) {
        if (!$this->validate_token($request)) {
            return $this->unauthorized_response();
        }
        
        $body = $request->get_body();
        $data = json_decode($body, true);
        
        $order_id = isset($data['order_id']) ? $data['order_id'] : $request->get_param('order_id');
        $status = isset($data['status']) ? $data['status'] : $request->get_param('status');
        
        if (empty($order_id) || empty($status)) {
            return new WP_Error('missing_params', __('ID de pedido y estado requeridos.', 'picking-connector'), array('status' => 400));
        }
        
        $order = wc_get_order($order_id);
        
        if (!$order) {
            return new WP_Error('order_not_found', __('Pedido no encontrado.', 'picking-connector'), array('status' => 404));
        }
        
        $status = str_replace('wc-', '', $status);
        $order->update_status($status, __('Estado actualizado via Picking App.', 'picking-connector'));
        
        return array(
            'success' => true,
            'message' => __('Estado actualizado.', 'picking-connector'),
            'order_id' => $order_id,
            'new_status' => $status,
        );
    }
    
    public function create_order_note($request) {
        if (!$this->validate_token($request)) {
            return $this->unauthorized_response();
        }
        
        $body = $request->get_body();
        $data = json_decode($body, true);
        
        $order_id = isset($data['order_id']) ? $data['order_id'] : $request->get_param('order_id');
        $note = isset($data['note']) ? $data['note'] : $request->get_param('note');
        
        if (empty($order_id) || empty($note)) {
            return new WP_Error('missing_params', __('ID de pedido y nota requeridos.', 'picking-connector'), array('status' => 400));
        }
        
        $order = wc_get_order($order_id);
        
        if (!$order) {
            return new WP_Error('order_not_found', __('Pedido no encontrado.', 'picking-connector'), array('status' => 404));
        }
        
        $order->add_order_note(sanitize_textarea_field($note));
        
        return array(
            'success' => true,
            'message' => __('Nota agregada.', 'picking-connector'),
        );
    }
    
    public function get_categories($request) {
        if (!$this->validate_token($request)) {
            return $this->unauthorized_response();
        }
        
        $categories = get_terms(array(
            'taxonomy' => 'product_cat',
            'hide_empty' => false,
        ));
        
        $result = array();
        
        foreach ($categories as $category) {
            $result[] = array(
                'id' => $category->term_id,
                'name' => $category->name,
                'slug' => $category->slug,
                'parent' => $category->parent,
                'count' => $category->count,
            );
        }
        
        return $result;
    }
    
    public function get_product($request) {
        if (!$this->validate_token($request)) {
            return $this->unauthorized_response();
        }
        
        $product_id = $request->get_param('product_id');
        $sku = $request->get_param('sku');
        $ean = $request->get_param('ean');
        
        $product = null;
        
        if (!empty($product_id)) {
            $product = wc_get_product($product_id);
        } elseif (!empty($sku)) {
            $product_id = wc_get_product_id_by_sku($sku);
            if ($product_id) {
                $product = wc_get_product($product_id);
            }
        } elseif (!empty($ean)) {
            $args = array(
                'post_type' => array('product', 'product_variation'),
                'posts_per_page' => 1,
                'meta_query' => array(
                    'relation' => 'OR',
                    array('key' => '_alg_ean', 'value' => $ean),
                    array('key' => '_ean', 'value' => $ean),
                    array('key' => '_gtin', 'value' => $ean),
                    array('key' => '_barcode', 'value' => $ean),
                    array('key' => 'ean', 'value' => $ean),
                    array('key' => 'gtin', 'value' => $ean),
                    array('key' => 'barcode', 'value' => $ean),
                ),
            );
            
            $query = new WP_Query($args);
            if ($query->have_posts()) {
                $product = wc_get_product($query->posts[0]->ID);
            }
        }
        
        if (!$product) {
            return new WP_Error('product_not_found', __('Producto no encontrado.', 'picking-connector'), array('status' => 404));
        }
        
        $ean_value = '';
        $ean_meta_keys = array('_alg_ean', '_ean', '_gtin', '_barcode', 'ean', 'gtin', 'barcode');
        foreach ($ean_meta_keys as $meta_key) {
            $ean_value = $product->get_meta($meta_key);
            if (!empty($ean_value)) {
                break;
            }
        }
        
        $image_url = '';
        $image_id = $product->get_image_id();
        if ($image_id) {
            $image_url = wp_get_attachment_image_url($image_id, 'medium');
        }
        
        return array(
            'id' => $product->get_id(),
            'name' => $product->get_name(),
            'sku' => $product->get_sku(),
            'ean' => $ean_value,
            'price' => $product->get_price(),
            'regular_price' => $product->get_regular_price(),
            'sale_price' => $product->get_sale_price(),
            'stock_quantity' => $product->get_stock_quantity(),
            'stock_status' => $product->get_stock_status(),
            'image' => $image_url,
            'weight' => $product->get_weight(),
            'location' => $product->get_meta('_picking_location'),
            'categories' => wp_get_post_terms($product->get_id(), 'product_cat', array('fields' => 'names')),
        );
    }
    
    public function update_product($request) {
        if (!$this->validate_token($request)) {
            return $this->unauthorized_response();
        }
        
        $body = $request->get_body();
        $data = json_decode($body, true);
        
        $product_id = isset($data['product_id']) ? $data['product_id'] : $request->get_param('product_id');
        
        if (empty($product_id)) {
            return new WP_Error('missing_product_id', __('ID de producto requerido.', 'picking-connector'), array('status' => 400));
        }
        
        $product = wc_get_product($product_id);
        
        if (!$product) {
            return new WP_Error('product_not_found', __('Producto no encontrado.', 'picking-connector'), array('status' => 404));
        }
        
        if (isset($data['stock_quantity'])) {
            $product->set_stock_quantity((int) $data['stock_quantity']);
        }
        
        if (isset($data['location'])) {
            $product->update_meta_data('_picking_location', sanitize_text_field($data['location']));
        }
        
        $product->save();
        
        return array(
            'success' => true,
            'message' => __('Producto actualizado.', 'picking-connector'),
        );
    }
    
    public function reset_picking_orders($request) {
        if (!$this->validate_token($request)) {
            return $this->unauthorized_response();
        }
        
        $order_status = get_option('picking_order_status', array('wc-processing'));
        if (!is_array($order_status)) {
            $order_status = array($order_status);
        }
        
        $orders = wc_get_orders(array(
            'status' => $order_status,
            'limit' => -1,
        ));
        
        $count = 0;
        
        foreach ($orders as $order) {
            $order->delete_meta_data('picking_status');
            $order->delete_meta_data('user_claimed');
            $order->delete_meta_data('picking_started_at');
            $order->delete_meta_data('picking_completed_at');
            
            foreach ($order->get_items() as $item) {
                $item->delete_meta_data('picking_status');
                $item->delete_meta_data('picked_qty');
                $item->delete_meta_data('backorder');
                $item->save();
            }
            
            $order->save();
            $count++;
        }
        
        return array(
            'success' => true,
            'message' => sprintf(__('%d pedidos reiniciados.', 'picking-connector'), $count),
            'count' => $count,
        );
    }
    
    public function get_customers($request) {
        if (!$this->validate_token($request)) {
            return $this->unauthorized_response();
        }
        
        $search = $request->get_param('search');
        
        $args = array(
            'role' => 'customer',
            'number' => 50,
        );
        
        if (!empty($search)) {
            $args['search'] = '*' . $search . '*';
            $args['search_columns'] = array('user_login', 'user_email', 'display_name');
        }
        
        $users = get_users($args);
        
        $customers = array();
        
        foreach ($users as $user) {
            $customers[] = array(
                'id' => $user->ID,
                'name' => $user->display_name,
                'email' => $user->user_email,
                'billing_address' => get_user_meta($user->ID, 'billing_address_1', true),
                'billing_city' => get_user_meta($user->ID, 'billing_city', true),
            );
        }
        
        return $customers;
    }
    
    public function create_batch($request) {
        if (!$this->validate_token($request)) {
            return $this->unauthorized_response();
        }
        
        $body = $request->get_body();
        $data = json_decode($body, true);
        
        $order_ids = isset($data['order_ids']) ? $data['order_ids'] : array();
        $appuser = $request->get_param('appuser');
        
        if (empty($order_ids)) {
            return new WP_Error('missing_orders', __('IDs de pedidos requeridos.', 'picking-connector'), array('status' => 400));
        }
        
        $batch_id = 'batch_' . time() . '_' . wp_generate_password(6, false);
        
        foreach ($order_ids as $order_id) {
            $order = wc_get_order($order_id);
            
            if ($order) {
                $order->update_meta_data('picking_batch_id', $batch_id);
                $order->update_meta_data('user_claimed', $appuser);
                $order->update_meta_data('picking_status', 'picking');
                $order->update_meta_data('picking_started_at', current_time('mysql'));
                $order->save();
            }
        }
        
        return array(
            'success' => true,
            'batch_id' => $batch_id,
            'order_count' => count($order_ids),
            'message' => sprintf(__('Lote creado con %d pedidos.', 'picking-connector'), count($order_ids)),
        );
    }
    
    public function unclaim_order($request) {
        if (!$this->validate_token($request)) {
            return $this->unauthorized_response();
        }
        
        $body = $request->get_body();
        $data = json_decode($body, true);
        
        $order_id = isset($data['order_id']) ? $data['order_id'] : $request->get_param('order_id');
        
        if (empty($order_id)) {
            return new WP_Error('missing_order_id', __('ID de pedido requerido.', 'picking-connector'), array('status' => 400));
        }
        
        $order = wc_get_order($order_id);
        
        if (!$order) {
            return new WP_Error('order_not_found', __('Pedido no encontrado.', 'picking-connector'), array('status' => 404));
        }
        
        $order->delete_meta_data('user_claimed');
        $order->delete_meta_data('picking_status');
        $order->delete_meta_data('picking_started_at');
        $order->save();
        
        return array(
            'success' => true,
            'message' => __('Pedido liberado.', 'picking-connector'),
        );
    }
    
    public function upload_photo($request) {
        if (!$this->validate_token($request)) {
            return $this->unauthorized_response();
        }
        
        $order_id = $request->get_param('order_id');
        
        if (empty($order_id)) {
            return new WP_Error('missing_order_id', __('ID de pedido requerido.', 'picking-connector'), array('status' => 400));
        }
        
        $files = $request->get_file_params();
        
        if (empty($files['photo'])) {
            return new WP_Error('missing_photo', __('Foto requerida.', 'picking-connector'), array('status' => 400));
        }
        
        $upload_dir = wp_upload_dir();
        $picking_dir = $upload_dir['basedir'] . '/picking-connector/photos/' . $order_id;
        
        if (!file_exists($picking_dir)) {
            wp_mkdir_p($picking_dir);
        }
        
        $file = $files['photo'];
        $filename = sanitize_file_name($file['name']);
        $new_filename = time() . '_' . $filename;
        $destination = $picking_dir . '/' . $new_filename;
        
        if (move_uploaded_file($file['tmp_name'], $destination)) {
            $photo_url = $upload_dir['baseurl'] . '/picking-connector/photos/' . $order_id . '/' . $new_filename;
            
            $order = wc_get_order($order_id);
            if ($order) {
                $photos = $order->get_meta('picking_photos');
                if (!is_array($photos)) {
                    $photos = array();
                }
                $photos[] = $photo_url;
                $order->update_meta_data('picking_photos', $photos);
                $order->save();
            }
            
            return array(
                'success' => true,
                'url' => $photo_url,
                'message' => __('Foto subida correctamente.', 'picking-connector'),
            );
        }
        
        return new WP_Error('upload_failed', __('Error al subir la foto.', 'picking-connector'), array('status' => 500));
    }
    
    public function get_config($request) {
        return array(
            'store_name' => get_bloginfo('name'),
            'store_url' => get_site_url(),
            'rest_url' => get_rest_url(null, 'picking/v1'),
            'version' => PICKING_VERSION,
            'settings' => array(
                'batch_size' => (int) get_option('picking_batch_size', 1),
                'auto_complete' => get_option('picking_auto_complete', '1') === '1',
                'photo_required' => get_option('picking_photo_required', '1') === '1',
                'scanner_type' => get_option('picking_scanner_type', 'camera'),
            ),
        );
    }
    
    public function handle_connection($request) {
        $token = $request->get_header('X-Picking-Token');
        
        if (empty($token)) {
            $body = $request->get_body();
            $data = json_decode($body, true);
            
            $connection_code = isset($data['connection_code']) ? $data['connection_code'] : '';
            
            if (!empty($connection_code)) {
                $decoded = json_decode(base64_decode($connection_code), true);
                if ($decoded && isset($decoded['api_key'])) {
                    $token = $decoded['api_key'];
                }
            }
        }
        
        if (empty($token)) {
            return new WP_Error('missing_token', __('Token de API requerido.', 'picking-connector'), array('status' => 400));
        }
        
        $api_key = get_option('picking_api_key', '');
        
        if ($token !== $api_key) {
            return new WP_Error('invalid_key', __('API Key invalida.', 'picking-connector'), array('status' => 401));
        }
        
        return array(
            'success' => true,
            'store_name' => get_bloginfo('name'),
            'store_url' => get_site_url(),
            'rest_url' => get_rest_url(null, 'picking/v1'),
            'version' => PICKING_VERSION,
        );
    }
}

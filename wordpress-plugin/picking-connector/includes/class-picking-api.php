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
        
        // Alias route for /pickinglist to bypass WAF blocking
        register_rest_route($namespace, '/orders-list', array(
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
        
        register_rest_route($namespace, '/scan-product', array(
            'methods' => 'POST',
            'callback' => array($this, 'scan_product'),
            'permission_callback' => '__return_true',
        ));
        
        register_rest_route($namespace, '/complete-order', array(
            'methods' => 'POST',
            'callback' => array($this, 'complete_order'),
            'permission_callback' => '__return_true',
        ));
        
        register_rest_route($namespace, '/get-qr-label', array(
            'methods' => 'GET',
            'callback' => array($this, 'get_qr_label'),
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
        
        // New endpoints for advanced picking management
        register_rest_route($namespace, '/search-products', array(
            'methods' => 'GET',
            'callback' => array($this, 'search_products'),
            'permission_callback' => '__return_true',
        ));
        
        register_rest_route($namespace, '/add-manual-item', array(
            'methods' => 'POST',
            'callback' => array($this, 'add_manual_item'),
            'permission_callback' => '__return_true',
        ));
        
        register_rest_route($namespace, '/update-line-picking', array(
            'methods' => 'POST',
            'callback' => array($this, 'update_line_picking'),
            'permission_callback' => '__return_true',
        ));
        
        register_rest_route($namespace, '/remove-manual-item', array(
            'methods' => 'POST',
            'callback' => array($this, 'remove_manual_item'),
            'permission_callback' => '__return_true',
        ));
        
        register_rest_route($namespace, '/debug-auth', array(
            'methods' => 'GET',
            'callback' => array($this, 'debug_auth'),
            'permission_callback' => '__return_true',
        ));
        
        // User authentication endpoints
        register_rest_route($namespace, '/user-login', array(
            'methods' => 'POST',
            'callback' => array($this, 'user_login'),
            'permission_callback' => '__return_true',
        ));
        
        register_rest_route($namespace, '/get-users', array(
            'methods' => 'GET',
            'callback' => array($this, 'get_users'),
            'permission_callback' => '__return_true',
        ));
        
        register_rest_route($namespace, '/get-dashboard-stats', array(
            'methods' => 'GET',
            'callback' => array($this, 'get_dashboard_stats'),
            'permission_callback' => '__return_true',
        ));
        
        // New endpoints for expanded functionality
        register_rest_route($namespace, '/get-all-orders', array(
            'methods' => 'GET',
            'callback' => array($this, 'get_all_orders'),
            'permission_callback' => '__return_true',
        ));
        
        register_rest_route($namespace, '/get-order-history', array(
            'methods' => 'GET',
            'callback' => array($this, 'get_order_history'),
            'permission_callback' => '__return_true',
        ));
        
        register_rest_route($namespace, '/get-order-photos', array(
            'methods' => 'GET',
            'callback' => array($this, 'get_order_photos'),
            'permission_callback' => '__return_true',
        ));
        
        register_rest_route($namespace, '/get-feature-settings', array(
            'methods' => 'GET',
            'callback' => array($this, 'get_feature_settings'),
            'permission_callback' => '__return_true',
        ));
        
        register_rest_route($namespace, '/update-order-line', array(
            'methods' => 'POST',
            'callback' => array($this, 'update_order_line'),
            'permission_callback' => '__return_true',
        ));
        
        register_rest_route($namespace, '/add-order-line', array(
            'methods' => 'POST',
            'callback' => array($this, 'add_order_line'),
            'permission_callback' => '__return_true',
        ));
        
        register_rest_route($namespace, '/remove-order-line', array(
            'methods' => 'POST',
            'callback' => array($this, 'remove_order_line'),
            'permission_callback' => '__return_true',
        ));
        
        register_rest_route($namespace, '/get-all-photos', array(
            'methods' => 'GET',
            'callback' => array($this, 'get_all_photos'),
            'permission_callback' => '__return_true',
        ));
        
        register_rest_route($namespace, '/restart-picking', array(
            'methods' => 'POST',
            'callback' => array($this, 'restart_picking'),
            'permission_callback' => '__return_true',
        ));
        
        register_rest_route($namespace, '/get-audit-orders', array(
            'methods' => 'GET',
            'callback' => array($this, 'get_audit_orders'),
            'permission_callback' => '__return_true',
        ));
    }
    
    public function debug_auth($request) {
        $token_param = $request->get_param('token');
        $pk_key_param = $request->get_param('pk_key');
        $header_token = $request->get_header('X-Picking-Token');
        $auth_header = $request->get_header('Authorization');
        $bearer_token = null;
        if ($auth_header && preg_match('/Bearer\s+(.+)/i', $auth_header, $m)) {
            $bearer_token = trim($m[1]);
        }
        $stored = get_option('picking_api_key', '');
        
        return array(
            'plugin_version' => '1.8',
            'token_param_prefix' => $token_param ? substr($token_param, 0, 8) : null,
            'pk_key_param_prefix' => $pk_key_param ? substr($pk_key_param, 0, 8) : null,
            'header_token_prefix' => $header_token ? substr($header_token, 0, 8) : null,
            'bearer_token_prefix' => $bearer_token ? substr($bearer_token, 0, 8) : null,
            'auth_header_raw' => $auth_header ? substr($auth_header, 0, 20) : null,
            'stored_prefix' => $stored ? substr($stored, 0, 8) : null,
            'validate_result' => $this->validate_token($request),
            'all_headers' => array_keys($request->get_headers()),
        );
    }
    
    private function validate_token($request) {
        $token = $request->get_param('token');
        
        if (empty($token)) {
            $auth = $request->get_header('Authorization');
            if ($auth && preg_match('/Bearer\s+(.+)/i', $auth, $m)) {
                $token = trim($m[1]);
            }
        }
        
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
    
    /**
     * Validate that the user (appuser) is active.
     * Returns true if user is active or if no appuser is provided.
     * Returns WP_Error if user is inactive or not found.
     * 
     * @param string $appuser The username to validate
     * @return true|WP_Error True if valid, WP_Error if invalid
     */
    private function validate_user_active($appuser) {
        // If no appuser provided, skip validation (some endpoints don't require user)
        if (empty($appuser)) {
            return true;
        }
        
        $users = get_option('picking_registered_users', array());
        
        foreach ($users as $user_id => $user) {
            if (strtolower($user['name']) === strtolower($appuser)) {
                // Check if user is active
                if (empty($user['active'])) {
                    return new WP_Error('user_inactive', __('Usuario inactivo. Contacta al administrador.', 'picking-connector'), array('status' => 403));
                }
                return true;
            }
        }
        
        // User not found - return error
        return new WP_Error('user_not_found', __('Usuario no encontrado.', 'picking-connector'), array('status' => 404));
    }
    
    /**
     * Helper to check user active status and return error response if invalid.
     * Use this at the start of endpoints that require an active user.
     * 
     * @param WP_REST_Request $request The request object
     * @return true|WP_Error True if valid, WP_Error if invalid
     */
    private function check_user_active($request) {
        $appuser = $request->get_param('appuser');
        
        // Also check in request body for POST requests
        if (empty($appuser)) {
            $body = $request->get_body();
            $data = json_decode($body, true);
            if (isset($data['appuser'])) {
                $appuser = $data['appuser'];
            }
        }
        
        return $this->validate_user_active($appuser);
    }
    
    private function is_hpos_enabled() {
        if (class_exists('Automattic\WooCommerce\Internal\DataStores\Orders\CustomOrdersTableController')) {
            $controller = wc_get_container()->get('Automattic\WooCommerce\Internal\DataStores\Orders\CustomOrdersTableController');
            return $controller->custom_orders_table_usage_is_enabled();
        }
        return false;
    }
    
    /**
     * Check if an order is available for picking.
     * Returns an array with 'available' (bool) and 'reason' (string).
     * Logs when an order is NOT available for debugging purposes.
     * 
     * @param WC_Order $order The WooCommerce order object
     * @param string|null $appuser The username attempting to pick (optional)
     * @return array Array with 'available' (bool) and 'reason' (string)
     */
    private function is_order_available_for_picking($order, $appuser = null) {
        $order_id = $order->get_id();
        $woo_status = 'wc-' . $order->get_status();
        $picking_status = $order->get_meta('picking_status') ?: 'pending';
        $user_claimed = $order->get_meta('user_claimed');
        
        // Check if WooCommerce status is in the allowed list
        $allowed_statuses = get_option('picking_order_status', array('wc-processing'));
        if (!is_array($allowed_statuses)) {
            $allowed_statuses = array($allowed_statuses);
        }
        
        if (!in_array($woo_status, $allowed_statuses, true)) {
            $reason = 'woo_status_not_allowed';
            error_log(sprintf(
                '[Picking][availability] order_id=%d appuser=%s reason=%s woo_status=%s allowed_statuses=%s picking_status=%s user_claimed=%s',
                $order_id,
                $appuser ?: '',
                $reason,
                $woo_status,
                implode(',', $allowed_statuses),
                $picking_status,
                $user_claimed ?: ''
            ));
            return array('available' => false, 'reason' => $reason, 'reason_text' => __('Estado del pedido no permite picking.', 'picking-connector'));
        }
        
        // Check if picking workflow is already completed or in packing
        if (in_array($picking_status, array('completed', 'packing'), true)) {
            $reason = 'picking_' . $picking_status;
            error_log(sprintf(
                '[Picking][availability] order_id=%d appuser=%s reason=%s woo_status=%s picking_status=%s user_claimed=%s',
                $order_id,
                $appuser ?: '',
                $reason,
                $woo_status,
                $picking_status,
                $user_claimed ?: ''
            ));
            $reason_text = $picking_status === 'completed' 
                ? __('El picking de este pedido ya fue completado.', 'picking-connector')
                : __('Este pedido está en proceso de empaque.', 'picking-connector');
            return array('available' => false, 'reason' => $reason, 'reason_text' => $reason_text);
        }
        
        // Check if order is claimed by another user
        if (!empty($user_claimed) && !empty($appuser) && $user_claimed !== $appuser) {
            $reason = 'claimed_by_other';
            error_log(sprintf(
                '[Picking][availability] order_id=%d appuser=%s reason=%s woo_status=%s picking_status=%s user_claimed=%s',
                $order_id,
                $appuser ?: '',
                $reason,
                $woo_status,
                $picking_status,
                $user_claimed
            ));
            return array(
                'available' => false, 
                'reason' => $reason, 
                'reason_text' => sprintf(__('Este pedido está siendo atendido por %s.', 'picking-connector'), $user_claimed)
            );
        }
        
        // Order is available for picking
        return array('available' => true, 'reason' => 'ok', 'reason_text' => '');
    }
    
    /**
     * Record a user as having worked on an order's picking session.
     * Maintains a list of all users who have performed any picking action.
     * 
     * @param WC_Order $order The WooCommerce order object
     * @param string $appuser The username who performed the action
     */
    private function record_picking_user($order, $appuser) {
        if (empty($appuser)) {
            return;
        }
        
        $users = $order->get_meta('picking_users');
        if (!is_array($users)) {
            $users = array();
        }
        
        if (!in_array($appuser, $users, true)) {
            $users[] = $appuser;
            $order->update_meta_data('picking_users', $users);
            $order->save();
        }
    }
    
    /**
     * Get all barcode fields for a product (EAN, IAN, CND, GTIN).
     * Searches multiple meta keys used by different barcode plugins.
     * 
     * @param WC_Product $product The WooCommerce product object
     * @return array Array with 'ean', 'ian', 'cnd', 'gtin' keys
     */
    private function get_product_barcodes($product) {
        $barcodes = array(
            'ean' => '',
            'ian' => '',
            'cnd' => '',
            'gtin' => '',
        );
        
        // EAN meta keys (European Article Number)
        $ean_meta_keys = array('_alg_ean', '_ean', 'ean', '_barcode', 'barcode');
        foreach ($ean_meta_keys as $meta_key) {
            $value = $product->get_meta($meta_key);
            if (!empty($value)) {
                $barcodes['ean'] = $value;
                break;
            }
        }
        
        // IAN meta keys (International Article Number - same as EAN but different naming)
        $ian_meta_keys = array('_ian', 'ian', '_alg_ian');
        foreach ($ian_meta_keys as $meta_key) {
            $value = $product->get_meta($meta_key);
            if (!empty($value)) {
                $barcodes['ian'] = $value;
                break;
            }
        }
        // If IAN is empty but EAN exists, use EAN as IAN (they're often the same)
        if (empty($barcodes['ian']) && !empty($barcodes['ean'])) {
            $barcodes['ian'] = $barcodes['ean'];
        }
        
        // CND meta keys (Codigo Nacional de Drogas - pharmaceutical code)
        $cnd_meta_keys = array('_cnd', 'cnd', '_codigo_nacional', 'codigo_nacional', '_cn', 'cn');
        foreach ($cnd_meta_keys as $meta_key) {
            $value = $product->get_meta($meta_key);
            if (!empty($value)) {
                $barcodes['cnd'] = $value;
                break;
            }
        }
        
        // GTIN meta keys (Global Trade Item Number)
        $gtin_meta_keys = array('_gtin', 'gtin', '_alg_gtin');
        foreach ($gtin_meta_keys as $meta_key) {
            $value = $product->get_meta($meta_key);
            if (!empty($value)) {
                $barcodes['gtin'] = $value;
                break;
            }
        }
        
        return $barcodes;
    }
    
    /**
     * Record an audit event for picking operations.
     * Stores events in order meta for complete audit trail.
     * 
     * @param WC_Order $order The WooCommerce order object
     * @param string $event_type Type of event (started, scanned, photo_uploaded, completed, edited, etc.)
     * @param string $appuser The username who performed the action
     * @param array $details Additional event details
     */
    private function record_audit_event($order, $event_type, $appuser, $details = array()) {
        $audit_log = $order->get_meta('picking_audit_log');
        if (!is_array($audit_log)) {
            $audit_log = array();
        }
        
        $event = array(
            'event_id' => 'evt_' . time() . '_' . wp_rand(1000, 9999),
            'event_type' => $event_type,
            'user' => $appuser,
            'timestamp' => current_time('mysql'),
            'timestamp_unix' => time(),
            'details' => $details,
        );
        
        $audit_log[] = $event;
        $order->update_meta_data('picking_audit_log', $audit_log);
        $order->save();
        
        return $event;
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
        
        // Validate user is active
        $user_check = $this->check_user_active($request);
        if (is_wp_error($user_check)) {
            return $user_check;
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
            $order->update_meta_data('picking_started_by', $appuser);
            
            // Change WooCommerce order status if configured
            $started_status = get_option('picking_started_status', '');
            if (!empty($started_status)) {
                $order->set_status(str_replace('wc-', '', $started_status), __('Picking iniciado por ', 'picking-connector') . $appuser);
            }
            
            $order->save();
        }
        
        // Record this user as having worked on the order
        if (!empty($appuser)) {
            $this->record_picking_user($order, $appuser);
        }
        
        $products = array();
        
        foreach ($order->get_items() as $item_id => $item) {
            $product = $item->get_product();
            
            if (!$product) {
                continue;
            }
            
            // Get all barcode fields (EAN/IAN, CND, etc.)
            $barcodes = $this->get_product_barcodes($product);
            
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
                'ean' => $barcodes['ean'],
                'ian' => $barcodes['ian'],
                'cnd' => $barcodes['cnd'],
                'gtin' => $barcodes['gtin'],
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
        
        // Get manual/extra items added during picking
        $extra_items = $order->get_meta('picking_extra_items');
        if (is_array($extra_items)) {
            foreach ($extra_items as $extra_item) {
                // Only include active items (not removed)
                if (isset($extra_item['status']) && $extra_item['status'] !== 'active') {
                    continue;
                }
                
                // Get product details for manual items (image, barcodes)
                $extra_product = wc_get_product($extra_item['product_id']);
                $extra_image = '';
                $extra_barcodes = array('ean' => '', 'ian' => '', 'cnd' => '', 'gtin' => '');
                
                if ($extra_product) {
                    $extra_image_id = $extra_product->get_image_id();
                    if ($extra_image_id) {
                        $extra_image = wp_get_attachment_image_url($extra_image_id, 'thumbnail');
                    }
                    $extra_barcodes = $this->get_product_barcodes($extra_product);
                }
                
                $products[] = array(
                    'item_id' => $extra_item['item_id'],
                    'product_id' => $extra_item['product_id'],
                    'variation_id' => 0,
                    'name' => $extra_item['name'],
                    'sku' => $extra_item['sku'],
                    'ean' => !empty($extra_barcodes['ean']) ? $extra_barcodes['ean'] : (isset($extra_item['ean']) ? $extra_item['ean'] : ''),
                    'ian' => $extra_barcodes['ian'],
                    'cnd' => $extra_barcodes['cnd'],
                    'gtin' => $extra_barcodes['gtin'],
                    'quantity' => $extra_item['qty'],
                    'picked_qty' => isset($extra_item['picked_qty']) ? (int) $extra_item['picked_qty'] : (int) $extra_item['qty'],
                    'backorder' => 0,
                    'picking_status' => 'completed',
                    'price' => 0,
                    'image' => $extra_image,
                    'stock_quantity' => $extra_product ? $extra_product->get_stock_quantity() : null,
                    'location' => $extra_product ? $extra_product->get_meta('_picking_location') : '',
                    'weight' => $extra_product ? $extra_product->get_weight() : '',
                    'is_manual' => true,
                    'added_by' => isset($extra_item['added_by']) ? $extra_item['added_by'] : '',
                    'added_at' => isset($extra_item['added_at']) ? $extra_item['added_at'] : '',
                    'reason' => isset($extra_item['reason']) ? $extra_item['reason'] : '',
                );
            }
        }
        
        // Check if order is available for picking
        $availability = $this->is_order_available_for_picking($order, $appuser);
        
        // Get user tracking info
        $picking_started_by = $order->get_meta('picking_started_by') ?: $order->get_meta('user_claimed');
        $picking_users = $order->get_meta('picking_users');
        if (!is_array($picking_users)) {
            $picking_users = array();
        }
        
        return array(
            'order_id' => $order->get_id(),
            'order_number' => $order->get_order_number(),
            'status' => $order->get_status(),
            'picking_status' => $order->get_meta('picking_status') ?: 'pending',
            'user_claimed' => $order->get_meta('user_claimed'),
            'picking_started_by' => $picking_started_by,
            'picking_users' => $picking_users,
            'picking_started_at' => $order->get_meta('picking_started_at'),
            'available_for_picking' => $availability['available'],
            'availability_reason' => $availability['reason'],
            'availability_reason_text' => $availability['reason_text'],
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
        $debug_step = $request->get_param('debug_step');
        
        // TEMP DEBUG: If debug_bypass param is set, return debug info instead of checking auth
        if ($request->get_param('debug_bypass') === 'v18') {
            return array(
                'debug' => 'pickinglist handler reached',
                'plugin_version' => '1.9',
                'validate_result' => $this->validate_token($request),
                'token_param' => $request->get_param('token') ? substr($request->get_param('token'), 0, 8) : null,
                'params' => array_keys($request->get_params()),
            );
        }
        
        if (!$this->validate_token($request)) {
            return $this->unauthorized_response();
        }
        
        // Validate user is active
        $user_check = $this->check_user_active($request);
        if (is_wp_error($user_check)) {
            return $user_check;
        }
        
        $appuser = $request->get_param('appuser');
        $batch_size = (int) get_option('picking_batch_size', 1);
        $order_status = get_option('picking_order_status', array('wc-processing'));
        
        if (!is_array($order_status)) {
            $order_status = array($order_status);
        }
        
        // Debug step: show args before query
        if ($debug_step === 'args') {
            return array(
                'step' => 'args',
                'batch_size' => $batch_size,
                'order_status' => $order_status,
            );
        }
        
        // Simple query test without meta_query
        if ($debug_step === 'simple') {
            $simple_orders = wc_get_orders(array(
                'status' => $order_status,
                'limit' => 3,
                'return' => 'ids',
            ));
            return array(
                'step' => 'simple',
                'count' => count($simple_orders),
                'order_ids' => $simple_orders,
            );
        }
        
        // Use simple query without meta_query for better performance
        // Filter by picking_status in PHP instead
        $args = array(
            'status' => $order_status,
            'limit' => 50, // Fetch more, then filter
            'orderby' => 'date',
            'order' => 'ASC',
        );
        
        // Debug step: after wc_get_orders
        if ($debug_step === 'after_wc') {
            $all_orders = wc_get_orders($args);
            return array(
                'step' => 'after_wc',
                'count' => count($all_orders),
            );
        }
        
        $all_orders = wc_get_orders($args);
        
        // Filter orders in PHP (faster than meta_query with NOT EXISTS)
        $orders = array();
        foreach ($all_orders as $order) {
            $picking_status = $order->get_meta('picking_status');
            $user_claimed = $order->get_meta('user_claimed');
            
            // Skip completed orders
            if ($picking_status === 'completed') {
                continue;
            }
            
            // Check if order is available for this user
            if (!empty($user_claimed) && $user_claimed !== $appuser) {
                continue;
            }
            
            $orders[] = $order;
            
            // Stop when we have enough orders
            if (count($orders) >= $batch_size) {
                break;
            }
        }
        
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
                
                // Get all barcode fields
                $barcodes = $this->get_product_barcodes($product);
                
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
                        'ean' => $barcodes['ean'],
                        'ian' => $barcodes['ian'],
                        'cnd' => $barcodes['cnd'],
                        'gtin' => $barcodes['gtin'],
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
        
        // Validate user is active
        $user_check = $this->check_user_active($request);
        if (is_wp_error($user_check)) {
            return $user_check;
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
        
        // Validate user is active
        $user_check = $this->check_user_active($request);
        if (is_wp_error($user_check)) {
            return $user_check;
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
        
        // Validate user is active
        $user_check = $this->check_user_active($request);
        if (is_wp_error($user_check)) {
            return $user_check;
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
        
        // Validate user is active
        $user_check = $this->check_user_active($request);
        if (is_wp_error($user_check)) {
            return $user_check;
        }
        
        $order_id = $request->get_param('order_id');
        
        if (empty($order_id)) {
            return new WP_Error('missing_order_id', __('ID de pedido requerido.', 'picking-connector'), array('status' => 400));
        }
        
        $files = $request->get_file_params();
        
        // Accept both 'photo' and 'file' field names for backward compatibility
        $photo_file = null;
        if (!empty($files['photo'])) {
            $photo_file = $files['photo'];
        } elseif (!empty($files['file'])) {
            $photo_file = $files['file'];
        }
        
        if (empty($photo_file)) {
            return new WP_Error('missing_photo', __('Foto requerida.', 'picking-connector'), array('status' => 400));
        }
        
        $upload_dir = wp_upload_dir();
        $picking_dir = $upload_dir['basedir'] . '/picking-connector/photos/' . $order_id;
        
        if (!file_exists($picking_dir)) {
            wp_mkdir_p($picking_dir);
        }
        
        $file = $photo_file;
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
        $token = $request->get_param('token');
        
        if (empty($token)) {
            $auth = $request->get_header('Authorization');
            if ($auth && preg_match('/Bearer\s+(.+)/i', $auth, $m)) {
                $token = trim($m[1]);
            }
        }
        
        if (empty($token)) {
            $token = $request->get_header('X-Picking-Token');
        }
        
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
    
    /**
     * User login with PIN
     */
    public function user_login($request) {
        if (!$this->validate_token($request)) {
            return $this->unauthorized_response();
        }
        
        $body = $request->get_body();
        $data = json_decode($body, true);
        
        $username = isset($data['username']) ? sanitize_text_field($data['username']) : '';
        $pin = isset($data['pin']) ? sanitize_text_field($data['pin']) : '';
        
        if (empty($username) || empty($pin)) {
            return new WP_Error('missing_credentials', __('Usuario y PIN son requeridos.', 'picking-connector'), array('status' => 400));
        }
        
        $users = get_option('picking_registered_users', array());
        
        foreach ($users as $user_id => $user) {
            if (strtolower($user['name']) === strtolower($username)) {
                // Check if user is active
                if (empty($user['active'])) {
                    return new WP_Error('user_inactive', __('Usuario inactivo. Contacta al administrador.', 'picking-connector'), array('status' => 403));
                }
                
                // Verify PIN
                if (wp_check_password($pin, $user['pin'])) {
                    // Update last activity
                    $users[$user_id]['last_activity'] = current_time('mysql');
                    update_option('picking_registered_users', $users);
                    
                    return array(
                        'success' => true,
                        'user' => array(
                            'id' => $user_id,
                            'name' => $user['name'],
                            'role' => $user['role'],
                            'orders_completed' => $user['orders_completed'] ?? 0,
                        ),
                        'permissions' => $this->get_role_permissions($user['role']),
                    );
                } else {
                    return new WP_Error('invalid_pin', __('PIN incorrecto.', 'picking-connector'), array('status' => 401));
                }
            }
        }
        
        return new WP_Error('user_not_found', __('Usuario no encontrado.', 'picking-connector'), array('status' => 404));
    }
    
    /**
     * Get role permissions
     * Now uses configurable permissions from plugin settings
     */
    private function get_role_permissions($role) {
        // Default permissions (backward compatible)
        $default_permissions = array(
            'admin' => array(
                'can_view_all_orders' => true,
                'can_process_orders' => true,
                'can_view_stats' => true,
                'can_manage_users' => true,
                'can_view_dashboard' => true,
                'can_view_orders' => true,
                'can_edit_picking' => true,
                'can_view_audit' => true,
                'can_view_photos' => true,
                'can_restart_picking' => true,
                'can_manage_settings' => true,
            ),
            'supervisor' => array(
                'can_view_all_orders' => true,
                'can_process_orders' => true,
                'can_view_stats' => true,
                'can_manage_users' => false,
                'can_view_dashboard' => true,
                'can_view_orders' => true,
                'can_edit_picking' => true,
                'can_view_audit' => true,
                'can_view_photos' => true,
                'can_restart_picking' => true,
                'can_manage_settings' => false,
            ),
            'picker' => array(
                'can_view_all_orders' => false,
                'can_process_orders' => true,
                'can_view_stats' => false,
                'can_manage_users' => false,
                'can_view_dashboard' => false,
                'can_view_orders' => true,
                'can_edit_picking' => true,
                'can_view_audit' => false,
                'can_view_photos' => false,
                'can_restart_picking' => false,
                'can_manage_settings' => false,
            ),
        );
        
        // Get configured permissions from database
        $configured_permissions = get_option('picking_role_permissions', array());
        
        // Merge configured permissions with defaults
        $permissions = $default_permissions;
        if (!empty($configured_permissions) && is_array($configured_permissions)) {
            foreach ($configured_permissions as $config_role => $config_perms) {
                if (isset($permissions[$config_role]) && is_array($config_perms)) {
                    $permissions[$config_role] = array_merge($permissions[$config_role], $config_perms);
                }
            }
        }
        
        return isset($permissions[$role]) ? $permissions[$role] : $permissions['picker'];
    }
    
    /**
     * Get users list (for admin/supervisor)
     */
    public function get_users($request) {
        if (!$this->validate_token($request)) {
            return $this->unauthorized_response();
        }
        
        $users = get_option('picking_registered_users', array());
        $result = array();
        
        foreach ($users as $user_id => $user) {
            $result[] = array(
                'id' => $user_id,
                'name' => $user['name'],
                'role' => $user['role'],
                'active' => $user['active'] ?? true,
                'orders_completed' => $user['orders_completed'] ?? 0,
                'last_activity' => $user['last_activity'] ?? null,
            );
        }
        
        return array(
            'success' => true,
            'users' => $result,
        );
    }
    
    /**
     * Get dashboard statistics
     */
    public function get_dashboard_stats($request) {
        if (!$this->validate_token($request)) {
            return $this->unauthorized_response();
        }
        
        $order_status = get_option('picking_order_status', array('wc-processing'));
        if (!is_array($order_status)) {
            $order_status = array($order_status);
        }
        
        // Get pending orders count
        $pending_orders = wc_get_orders(array(
            'status' => $order_status,
            'limit' => -1,
            'return' => 'ids',
        ));
        
        // Get orders in picking
        $picking_orders = wc_get_orders(array(
            'status' => $order_status,
            'limit' => -1,
            'return' => 'ids',
            'meta_query' => array(
                array(
                    'key' => 'picking_status',
                    'value' => 'picking',
                    'compare' => '='
                )
            )
        ));
        
        // Get completed today
        $completed_today = wc_get_orders(array(
            'status' => 'completed',
            'date_completed' => '>' . date('Y-m-d 00:00:00'),
            'limit' => -1,
            'return' => 'ids',
        ));
        
        // Get picker activity
        $users = get_option('picking_registered_users', array());
        $picker_stats = array();
        
        foreach ($users as $user_id => $user) {
            $picker_stats[] = array(
                'name' => $user['name'],
                'role' => $user['role'],
                'orders_completed' => $user['orders_completed'] ?? 0,
                'active' => $user['active'] ?? true,
            );
        }
        
        return array(
            'success' => true,
            'stats' => array(
                'pending_orders' => count($pending_orders),
                'picking_orders' => count($picking_orders),
                'completed_today' => count($completed_today),
                'total_users' => count($users),
            ),
            'pickers' => $picker_stats,
        );
    }
    
    /**
     * Scan a product during picking session.
     * Increments the picked quantity for the matching product in the order.
     */
    public function scan_product($request) {
        if (!$this->validate_token($request)) {
            return $this->unauthorized_response();
        }
        
        // Validate user is active
        $user_check = $this->check_user_active($request);
        if (is_wp_error($user_check)) {
            return $user_check;
        }
        
        $body = $request->get_body();
        $data = json_decode($body, true);
        
        $order_id = isset($data['order_id']) ? $data['order_id'] : $request->get_param('order_id');
        $ean = isset($data['ean']) ? $data['ean'] : $request->get_param('ean');
        $sku = isset($data['sku']) ? $data['sku'] : $request->get_param('sku');
        $appuser = isset($data['appuser']) ? $data['appuser'] : $request->get_param('appuser');
        
        // Treat scanned code generically: use whichever is provided (sku takes precedence)
        $code = trim($sku !== '' && $sku !== null ? $sku : ($ean !== '' && $ean !== null ? $ean : ''));
        
        if (empty($order_id)) {
            return new WP_Error('missing_order_id', __('ID de pedido requerido.', 'picking-connector'), array('status' => 400));
        }
        
        if ($code === '') {
            return new WP_Error('missing_code', __('EAN o SKU requerido.', 'picking-connector'), array('status' => 400));
        }
        
        $order = wc_get_order($order_id);
        
        if (!$order) {
            return new WP_Error('order_not_found', __('Pedido no encontrado.', 'picking-connector'), array('status' => 404));
        }
        
        // Find the product by checking both SKU and EAN fields against the scanned code
        $product_found = false;
        $product_name = '';
        
        foreach ($order->get_items() as $item_id => $item) {
            $product = $item->get_product();
            
            if (!$product) {
                continue;
            }
            
            // Check SKU match first (case-insensitive)
            $product_sku = trim((string) $product->get_sku());
            if ($product_sku !== '' && strcasecmp($product_sku, $code) === 0) {
                $product_found = true;
            }
            
            // Check EAN match (check various meta keys, case-insensitive)
            if (!$product_found) {
                $ean_meta_keys = array('_alg_ean', '_ean', '_gtin', '_barcode', 'ean', 'gtin', 'barcode');
                foreach ($ean_meta_keys as $meta_key) {
                    $product_ean = trim((string) $product->get_meta($meta_key));
                    if ($product_ean !== '' && strcasecmp($product_ean, $code) === 0) {
                        $product_found = true;
                        break;
                    }
                }
            }
            
            if ($product_found) {
                $product_name = $product->get_name();
                
                // Increment picked quantity
                $picked_qty = (int) $item->get_meta('picked_qty');
                $expected_qty = $item->get_quantity();
                
                if ($picked_qty < $expected_qty) {
                    $picked_qty++;
                    $item->update_meta_data('picked_qty', $picked_qty);
                    
                    // Update picking status
                    if ($picked_qty >= $expected_qty) {
                        $item->update_meta_data('picking_status', 'completed');
                    } else {
                        $item->update_meta_data('picking_status', 'partial');
                    }
                    
                    $item->save();
                    
                    return array(
                        'success' => true,
                        'message' => sprintf(__('Producto escaneado: %s (%d/%d)', 'picking-connector'), $product_name, $picked_qty, $expected_qty),
                        'product_name' => $product_name,
                        'picked_qty' => $picked_qty,
                        'expected_qty' => $expected_qty,
                    );
                } else {
                    return new WP_Error('already_picked', sprintf(__('Producto ya completado: %s', 'picking-connector'), $product_name), array('status' => 400));
                }
            }
        }
        
        // Log debug info when product is not found
        $order_skus = array();
        foreach ($order->get_items() as $item_id => $item) {
            $product = $item->get_product();
            if ($product) {
                $order_skus[] = $product->get_sku();
            }
        }
        error_log(sprintf(
            '[Picking][scan_product] Product not found: order_id=%d code=%s order_skus=%s',
            $order_id,
            $code,
            implode(',', $order_skus)
        ));
        
        return new WP_Error('product_not_found', __('Producto no encontrado en el pedido.', 'picking-connector'), array('status' => 404));
    }
    
    /**
     * Complete a picking session and update order status.
     */
    public function complete_order($request) {
        if (!$this->validate_token($request)) {
            return $this->unauthorized_response();
        }
        
        // Validate user is active
        $user_check = $this->check_user_active($request);
        if (is_wp_error($user_check)) {
            return $user_check;
        }
        
        $body = $request->get_body();
        $data = json_decode($body, true);
        
        $order_id = isset($data['order_id']) ? $data['order_id'] : $request->get_param('order_id');
        $appuser = isset($data['appuser']) ? $data['appuser'] : $request->get_param('appuser');
        $notes = isset($data['notes']) ? $data['notes'] : '';
        
        if (empty($order_id)) {
            return new WP_Error('missing_order_id', __('ID de pedido requerido.', 'picking-connector'), array('status' => 400));
        }
        
        $order = wc_get_order($order_id);
        
        if (!$order) {
            return new WP_Error('order_not_found', __('Pedido no encontrado.', 'picking-connector'), array('status' => 404));
        }
        
        // Update picking metadata
        $order->update_meta_data('picking_status', 'completed');
        $order->update_meta_data('picking_completed_at', current_time('mysql'));
        $order->update_meta_data('picking_completed_by', $appuser);
        
        // Add order note
        if (!empty($notes)) {
            $order->add_order_note(sprintf(__('Picking completado por %s: %s', 'picking-connector'), $appuser, $notes));
        } else {
            $order->add_order_note(sprintf(__('Picking completado por %s', 'picking-connector'), $appuser));
        }
        
        // Update order status to configured status if auto_complete is enabled
        $auto_complete = get_option('picking_auto_complete', '1') === '1';
        if ($auto_complete) {
            $completed_status = get_option('picking_completed_status', 'wc-completed');
            $status_to_set = str_replace('wc-', '', $completed_status);
            $order->update_status($status_to_set, __('Pedido completado via Picking App.', 'picking-connector'));
        }
        
        $order->save();
        
        // Update user's completed orders count
        if (!empty($appuser)) {
            $users = get_option('picking_registered_users', array());
            foreach ($users as $user_id => $user) {
                if (strtolower($user['name']) === strtolower($appuser)) {
                    $users[$user_id]['orders_completed'] = ($user['orders_completed'] ?? 0) + 1;
                    $users[$user_id]['last_activity'] = current_time('mysql');
                    update_option('picking_registered_users', $users);
                    break;
                }
            }
        }
        
        return array(
            'success' => true,
            'message' => __('Pedido completado.', 'picking-connector'),
            'order_id' => $order_id,
            'new_status' => $auto_complete ? 'completed' : $order->get_status(),
        );
    }
    
    /**
     * Get QR label data for an order.
     */
    public function get_qr_label($request) {
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
        
        return array(
            'success' => true,
            'order_id' => $order->get_id(),
            'order_number' => $order->get_order_number(),
            'customer_name' => $order->get_formatted_billing_full_name(),
            'total' => $order->get_total(),
            'woocommerce_url' => admin_url('post.php?post=' . $order->get_id() . '&action=edit'),
            'qr_data' => json_encode(array(
                'order_id' => $order->get_id(),
                'order_number' => $order->get_order_number(),
                'total' => $order->get_total(),
            )),
        );
    }
    
    /**
     * Search products by SKU, EAN, or name.
     * Returns a list of products matching the search query.
     */
    public function search_products($request) {
        if (!$this->validate_token($request)) {
            return $this->unauthorized_response();
        }
        
        $user_check = $this->check_user_active($request);
        if (is_wp_error($user_check)) {
            return $user_check;
        }
        
        $query = $request->get_param('query');
        $limit = $request->get_param('limit') ?: 20;
        
        if (empty($query) || strlen($query) < 2) {
            return new WP_Error('invalid_query', __('Ingrese al menos 2 caracteres para buscar.', 'picking-connector'), array('status' => 400));
        }
        
        $args = array(
            'post_type' => 'product',
            'post_status' => 'publish',
            'posts_per_page' => $limit,
            's' => $query,
        );
        
        $products_query = new WP_Query($args);
        $results = array();
        
        if ($products_query->have_posts()) {
            while ($products_query->have_posts()) {
                $products_query->the_post();
                $product = wc_get_product(get_the_ID());
                
                if ($product) {
                    $results[] = array(
                        'product_id' => $product->get_id(),
                        'name' => $product->get_name(),
                        'sku' => $product->get_sku(),
                        'ean' => $product->get_meta('_ean') ?: $product->get_meta('_gtin') ?: '',
                        'price' => $product->get_price(),
                        'stock_quantity' => $product->get_stock_quantity(),
                        'image' => wp_get_attachment_url($product->get_image_id()) ?: '',
                    );
                }
            }
            wp_reset_postdata();
        }
        
        // Also search by SKU and EAN if no results or few results
        if (count($results) < $limit) {
            global $wpdb;
            
            // Search by SKU
            $sku_products = $wpdb->get_col($wpdb->prepare(
                "SELECT post_id FROM {$wpdb->postmeta} 
                WHERE meta_key = '_sku' AND meta_value LIKE %s 
                LIMIT %d",
                '%' . $wpdb->esc_like($query) . '%',
                $limit - count($results)
            ));
            
            // Search by EAN/GTIN
            $ean_products = $wpdb->get_col($wpdb->prepare(
                "SELECT post_id FROM {$wpdb->postmeta} 
                WHERE meta_key IN ('_ean', '_gtin', '_barcode') AND meta_value LIKE %s 
                LIMIT %d",
                '%' . $wpdb->esc_like($query) . '%',
                $limit - count($results)
            ));
            
            $additional_ids = array_unique(array_merge($sku_products, $ean_products));
            $existing_ids = array_column($results, 'product_id');
            
            foreach ($additional_ids as $product_id) {
                if (in_array($product_id, $existing_ids)) {
                    continue;
                }
                
                $product = wc_get_product($product_id);
                if ($product && $product->get_status() === 'publish') {
                    $results[] = array(
                        'product_id' => $product->get_id(),
                        'name' => $product->get_name(),
                        'sku' => $product->get_sku(),
                        'ean' => $product->get_meta('_ean') ?: $product->get_meta('_gtin') ?: '',
                        'price' => $product->get_price(),
                        'stock_quantity' => $product->get_stock_quantity(),
                        'image' => wp_get_attachment_url($product->get_image_id()) ?: '',
                    );
                }
                
                if (count($results) >= $limit) {
                    break;
                }
            }
        }
        
        return array(
            'success' => true,
            'products' => $results,
            'count' => count($results),
        );
    }
    
    /**
     * Add a manual item to the picking session.
     * Stores extra items in order meta as picking_extra_items.
     */
    public function add_manual_item($request) {
        if (!$this->validate_token($request)) {
            return $this->unauthorized_response();
        }
        
        $user_check = $this->check_user_active($request);
        if (is_wp_error($user_check)) {
            return $user_check;
        }
        
        $body = $request->get_body();
        $data = json_decode($body, true);
        
        $order_id = isset($data['order_id']) ? intval($data['order_id']) : 0;
        $product_id = isset($data['product_id']) ? intval($data['product_id']) : 0;
        $qty = isset($data['qty']) ? intval($data['qty']) : 1;
        $appuser = isset($data['appuser']) ? sanitize_text_field($data['appuser']) : '';
        $reason = isset($data['reason']) ? sanitize_text_field($data['reason']) : '';
        
        if (empty($order_id)) {
            return new WP_Error('missing_order_id', __('ID de pedido requerido.', 'picking-connector'), array('status' => 400));
        }
        
        if (empty($product_id)) {
            return new WP_Error('missing_product_id', __('ID de producto requerido.', 'picking-connector'), array('status' => 400));
        }
        
        $order = wc_get_order($order_id);
        if (!$order) {
            return new WP_Error('order_not_found', __('Pedido no encontrado.', 'picking-connector'), array('status' => 404));
        }
        
        $product = wc_get_product($product_id);
        if (!$product) {
            return new WP_Error('product_not_found', __('Producto no encontrado.', 'picking-connector'), array('status' => 404));
        }
        
        // Get existing extra items
        $extra_items = $order->get_meta('picking_extra_items');
        if (!is_array($extra_items)) {
            $extra_items = array();
        }
        
        // Generate a unique ID for this manual item
        $item_id = 'manual_' . time() . '_' . $product_id;
        
        // Add the new item
        $new_item = array(
            'item_id' => $item_id,
            'product_id' => $product_id,
            'sku' => $product->get_sku(),
            'name' => $product->get_name(),
            'qty' => $qty,
            'picked_qty' => $qty,
            'added_by' => $appuser,
            'added_at' => current_time('mysql'),
            'status' => 'active',
            'reason' => $reason,
            'is_manual' => true,
        );
        
        $extra_items[] = $new_item;
        $order->update_meta_data('picking_extra_items', $extra_items);
        $order->save();
        
        // Record the user who added this item
        $this->record_picking_user($order, $appuser);
        
        // Add order note
        $order->add_order_note(sprintf(
            __('Producto agregado manualmente por %s: %s (SKU: %s), Cantidad: %d. Motivo: %s', 'picking-connector'),
            $appuser,
            $product->get_name(),
            $product->get_sku(),
            $qty,
            $reason ?: 'No especificado'
        ));
        
        return array(
            'success' => true,
            'message' => __('Producto agregado correctamente.', 'picking-connector'),
            'item' => $new_item,
        );
    }
    
    /**
     * Update the picked quantity for a line item.
     * Works for both regular order items and manual items.
     */
    public function update_line_picking($request) {
        if (!$this->validate_token($request)) {
            return $this->unauthorized_response();
        }
        
        $user_check = $this->check_user_active($request);
        if (is_wp_error($user_check)) {
            return $user_check;
        }
        
        $body = $request->get_body();
        $data = json_decode($body, true);
        
        $order_id = isset($data['order_id']) ? intval($data['order_id']) : 0;
        $item_id = isset($data['item_id']) ? $data['item_id'] : '';
        $picked_qty = isset($data['picked_qty']) ? intval($data['picked_qty']) : 0;
        $appuser = isset($data['appuser']) ? sanitize_text_field($data['appuser']) : '';
        
        if (empty($order_id)) {
            return new WP_Error('missing_order_id', __('ID de pedido requerido.', 'picking-connector'), array('status' => 400));
        }
        
        if (empty($item_id)) {
            return new WP_Error('missing_item_id', __('ID de item requerido.', 'picking-connector'), array('status' => 400));
        }
        
        $order = wc_get_order($order_id);
        if (!$order) {
            return new WP_Error('order_not_found', __('Pedido no encontrado.', 'picking-connector'), array('status' => 404));
        }
        
        // Check if it's a manual item
        if (strpos($item_id, 'manual_') === 0) {
            $extra_items = $order->get_meta('picking_extra_items');
            if (!is_array($extra_items)) {
                return new WP_Error('item_not_found', __('Item no encontrado.', 'picking-connector'), array('status' => 404));
            }
            
            $found = false;
            foreach ($extra_items as &$item) {
                if ($item['item_id'] === $item_id) {
                    // Validate that picked_qty does not exceed expected quantity for manual items
                    $expected_qty = isset($item['qty']) ? intval($item['qty']) : 1;
                    if ($picked_qty > $expected_qty) {
                        return new WP_Error(
                            'quantity_exceeded', 
                            sprintf(__('No puedes recoger más cantidad de la solicitada. Máximo permitido: %d', 'picking-connector'), $expected_qty), 
                            array('status' => 400)
                        );
                    }
                    
                    $item['picked_qty'] = $picked_qty;
                    $item['last_modified_by'] = $appuser;
                    $item['last_modified_at'] = current_time('mysql');
                    $found = true;
                    break;
                }
            }
            
            if (!$found) {
                return new WP_Error('item_not_found', __('Item no encontrado.', 'picking-connector'), array('status' => 404));
            }
            
            $order->update_meta_data('picking_extra_items', $extra_items);
            $order->save();
        } else {
            // Regular order item
            $item_id_int = intval($item_id);
            $items = $order->get_items();
            
            if (!isset($items[$item_id_int])) {
                return new WP_Error('item_not_found', __('Item no encontrado.', 'picking-connector'), array('status' => 404));
            }
            
            $item = $items[$item_id_int];
            
            // Validate that picked_qty does not exceed expected quantity
            $expected_qty = $item->get_quantity();
            if ($picked_qty > $expected_qty) {
                return new WP_Error(
                    'quantity_exceeded', 
                    sprintf(__('No puedes recoger más cantidad de la solicitada. Máximo permitido: %d', 'picking-connector'), $expected_qty), 
                    array('status' => 400)
                );
            }
            
            $item->update_meta_data('picked_qty', $picked_qty);
            
            // Update picking status based on quantity
            if ($picked_qty >= $expected_qty) {
                $item->update_meta_data('picking_status', 'completed');
            } elseif ($picked_qty > 0) {
                $item->update_meta_data('picking_status', 'partial');
            } else {
                $item->update_meta_data('picking_status', 'pending');
            }
            
            $item->save();
        }
        
        // Record the user who modified this item
        $this->record_picking_user($order, $appuser);
        
        return array(
            'success' => true,
            'message' => __('Cantidad actualizada correctamente.', 'picking-connector'),
            'item_id' => $item_id,
            'picked_qty' => $picked_qty,
        );
    }
    
    /**
     * Remove a manual item from the picking session.
     * Marks the item as removed rather than deleting it for audit purposes.
     */
    public function remove_manual_item($request) {
        if (!$this->validate_token($request)) {
            return $this->unauthorized_response();
        }
        
        $user_check = $this->check_user_active($request);
        if (is_wp_error($user_check)) {
            return $user_check;
        }
        
        $body = $request->get_body();
        $data = json_decode($body, true);
        
        $order_id = isset($data['order_id']) ? intval($data['order_id']) : 0;
        $item_id = isset($data['item_id']) ? $data['item_id'] : '';
        $appuser = isset($data['appuser']) ? sanitize_text_field($data['appuser']) : '';
        $reason = isset($data['reason']) ? sanitize_text_field($data['reason']) : '';
        
        if (empty($order_id)) {
            return new WP_Error('missing_order_id', __('ID de pedido requerido.', 'picking-connector'), array('status' => 400));
        }
        
        if (empty($item_id)) {
            return new WP_Error('missing_item_id', __('ID de item requerido.', 'picking-connector'), array('status' => 400));
        }
        
        $order = wc_get_order($order_id);
        if (!$order) {
            return new WP_Error('order_not_found', __('Pedido no encontrado.', 'picking-connector'), array('status' => 404));
        }
        
        // Check if it's a manual item
        if (strpos($item_id, 'manual_') === 0) {
            $extra_items = $order->get_meta('picking_extra_items');
            if (!is_array($extra_items)) {
                return new WP_Error('item_not_found', __('Item no encontrado.', 'picking-connector'), array('status' => 404));
            }
            
            $found = false;
            $removed_item = null;
            foreach ($extra_items as &$item) {
                if ($item['item_id'] === $item_id) {
                    $item['status'] = 'removed';
                    $item['removed_by'] = $appuser;
                    $item['removed_at'] = current_time('mysql');
                    $item['removal_reason'] = $reason;
                    $removed_item = $item;
                    $found = true;
                    break;
                }
            }
            
            if (!$found) {
                return new WP_Error('item_not_found', __('Item no encontrado.', 'picking-connector'), array('status' => 404));
            }
            
            $order->update_meta_data('picking_extra_items', $extra_items);
            $order->save();
            
            // Add order note
            $order->add_order_note(sprintf(
                __('Producto manual retirado por %s: %s. Motivo: %s', 'picking-connector'),
                $appuser,
                $removed_item['name'],
                $reason ?: 'No especificado'
            ));
        } else {
            // For regular items, we just reset the picked quantity to 0
            $item_id_int = intval($item_id);
            $items = $order->get_items();
            
            if (!isset($items[$item_id_int])) {
                return new WP_Error('item_not_found', __('Item no encontrado.', 'picking-connector'), array('status' => 404));
            }
            
            $item = $items[$item_id_int];
            $item->update_meta_data('picked_qty', 0);
            $item->update_meta_data('picking_status', 'pending');
            $item->save();
            
            // Add order note
            $order->add_order_note(sprintf(
                __('Picking de producto reiniciado por %s: %s. Motivo: %s', 'picking-connector'),
                $appuser,
                $item->get_name(),
                $reason ?: 'No especificado'
            ));
        }
        
        // Record the user who removed this item
        $this->record_picking_user($order, $appuser);
        
        return array(
            'success' => true,
            'message' => __('Item retirado correctamente.', 'picking-connector'),
            'item_id' => $item_id,
        );
    }
    
    /**
     * Get all orders with filters for the admin dashboard.
     * Supports filtering by status, date range, and picking status.
     */
    public function get_all_orders($request) {
        if (!$this->validate_token($request)) {
            return $this->unauthorized_response();
        }
        
        $status = $request->get_param('status');
        $picking_status = $request->get_param('picking_status');
        $date_from = $request->get_param('date_from');
        $date_to = $request->get_param('date_to');
        $page = $request->get_param('page') ?: 1;
        $per_page = $request->get_param('per_page') ?: 20;
        
        $args = array(
            'limit' => $per_page,
            'offset' => ($page - 1) * $per_page,
            'orderby' => 'date',
            'order' => 'DESC',
        );
        
        // Filter by WooCommerce status
        if (!empty($status)) {
            $args['status'] = $status;
        } else {
            // Get all statuses by default
            $args['status'] = array_keys(wc_get_order_statuses());
        }
        
        // Filter by date range
        if (!empty($date_from)) {
            $args['date_created'] = '>=' . $date_from;
        }
        if (!empty($date_to)) {
            if (isset($args['date_created'])) {
                $args['date_created'] = array($date_from, $date_to);
            } else {
                $args['date_created'] = '<=' . $date_to;
            }
        }
        
        $orders = wc_get_orders($args);
        
        // Filter by picking status in PHP if specified
        if (!empty($picking_status)) {
            $orders = array_filter($orders, function($order) use ($picking_status) {
                $order_picking_status = $order->get_meta('picking_status') ?: 'pending';
                return $order_picking_status === $picking_status;
            });
        }
        
        $result = array();
        foreach ($orders as $order) {
            $order_picking_status = $order->get_meta('picking_status') ?: 'pending';
            $photos = $order->get_meta('picking_photos');
            
            $result[] = array(
                'order_id' => $order->get_id(),
                'order_number' => $order->get_order_number(),
                'status' => $order->get_status(),
                'picking_status' => $order_picking_status,
                'user_claimed' => $order->get_meta('user_claimed'),
                'picking_started_at' => $order->get_meta('picking_started_at'),
                'picking_completed_at' => $order->get_meta('picking_completed_at'),
                'picking_completed_by' => $order->get_meta('picking_completed_by'),
                'picking_users' => $order->get_meta('picking_users') ?: array(),
                'date_created' => $order->get_date_created()->format('Y-m-d H:i:s'),
                'date_modified' => $order->get_date_modified()->format('Y-m-d H:i:s'),
                'customer_name' => $order->get_formatted_billing_full_name(),
                'customer_email' => $order->get_billing_email(),
                'total' => $order->get_total(),
                'currency' => $order->get_currency(),
                'item_count' => $order->get_item_count(),
                'has_photos' => is_array($photos) && count($photos) > 0,
                'photo_count' => is_array($photos) ? count($photos) : 0,
            );
        }
        
        // Get total count for pagination
        $count_args = $args;
        $count_args['limit'] = -1;
        $count_args['return'] = 'ids';
        unset($count_args['offset']);
        $total_orders = wc_get_orders($count_args);
        
        return array(
            'success' => true,
            'orders' => $result,
            'total' => count($total_orders),
            'page' => (int) $page,
            'per_page' => (int) $per_page,
            'total_pages' => ceil(count($total_orders) / $per_page),
        );
    }
    
    /**
     * Get complete history/audit trail for an order.
     * Returns all events, users, timestamps, and changes.
     */
    public function get_order_history($request) {
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
        
        // Get audit log
        $audit_log = $order->get_meta('picking_audit_log');
        if (!is_array($audit_log)) {
            $audit_log = array();
        }
        
        // Get order notes (WooCommerce built-in)
        $notes = wc_get_order_notes(array(
            'order_id' => $order_id,
            'type' => 'internal',
        ));
        
        $notes_data = array();
        foreach ($notes as $note) {
            $notes_data[] = array(
                'id' => $note->id,
                'content' => $note->content,
                'date' => $note->date_created->format('Y-m-d H:i:s'),
                'added_by' => $note->added_by,
            );
        }
        
        // Get picking metadata
        $picking_data = array(
            'status' => $order->get_meta('picking_status') ?: 'pending',
            'started_at' => $order->get_meta('picking_started_at'),
            'started_by' => $order->get_meta('picking_started_by'),
            'completed_at' => $order->get_meta('picking_completed_at'),
            'completed_by' => $order->get_meta('picking_completed_by'),
            'users' => $order->get_meta('picking_users') ?: array(),
            'user_claimed' => $order->get_meta('user_claimed'),
        );
        
        // Get photos
        $photos = $order->get_meta('picking_photos');
        if (!is_array($photos)) {
            $photos = array();
        }
        
        // Get extra items history
        $extra_items = $order->get_meta('picking_extra_items');
        if (!is_array($extra_items)) {
            $extra_items = array();
        }
        
        // Build timeline from all sources
        $timeline = array();
        
        // Add picking start event
        if (!empty($picking_data['started_at'])) {
            $timeline[] = array(
                'event_type' => 'picking_started',
                'timestamp' => $picking_data['started_at'],
                'user' => $picking_data['started_by'] ?: $picking_data['user_claimed'],
                'details' => array('message' => 'Picking iniciado'),
            );
        }
        
        // Add audit log events
        foreach ($audit_log as $event) {
            $timeline[] = $event;
        }
        
        // Add extra items events
        foreach ($extra_items as $item) {
            if (!empty($item['added_at'])) {
                $timeline[] = array(
                    'event_type' => 'item_added',
                    'timestamp' => $item['added_at'],
                    'user' => $item['added_by'],
                    'details' => array(
                        'product_name' => $item['name'],
                        'quantity' => $item['qty'],
                        'reason' => $item['reason'] ?? '',
                    ),
                );
            }
            if (!empty($item['removed_at'])) {
                $timeline[] = array(
                    'event_type' => 'item_removed',
                    'timestamp' => $item['removed_at'],
                    'user' => $item['removed_by'],
                    'details' => array(
                        'product_name' => $item['name'],
                        'reason' => $item['removal_reason'] ?? '',
                    ),
                );
            }
        }
        
        // Add picking complete event
        if (!empty($picking_data['completed_at'])) {
            $timeline[] = array(
                'event_type' => 'picking_completed',
                'timestamp' => $picking_data['completed_at'],
                'user' => $picking_data['completed_by'],
                'details' => array('message' => 'Picking completado'),
            );
        }
        
        // Sort timeline by timestamp
        usort($timeline, function($a, $b) {
            $time_a = strtotime($a['timestamp'] ?? '1970-01-01');
            $time_b = strtotime($b['timestamp'] ?? '1970-01-01');
            return $time_a - $time_b;
        });
        
        return array(
            'success' => true,
            'order_id' => $order_id,
            'order_number' => $order->get_order_number(),
            'picking' => $picking_data,
            'timeline' => $timeline,
            'notes' => $notes_data,
            'photos' => $photos,
            'extra_items' => $extra_items,
        );
    }
    
    /**
     * Get photos for a specific order.
     */
    public function get_order_photos($request) {
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
        
        $photos = $order->get_meta('picking_photos');
        if (!is_array($photos)) {
            $photos = array();
        }
        
        // Get photo details
        $photo_details = array();
        foreach ($photos as $photo_url) {
            // Extract filename and timestamp from URL
            $filename = basename($photo_url);
            $timestamp = null;
            if (preg_match('/^(\d+)_/', $filename, $matches)) {
                $timestamp = date('Y-m-d H:i:s', (int) $matches[1]);
            }
            
            $photo_details[] = array(
                'url' => $photo_url,
                'filename' => $filename,
                'uploaded_at' => $timestamp,
            );
        }
        
        return array(
            'success' => true,
            'order_id' => $order_id,
            'order_number' => $order->get_order_number(),
            'photos' => $photo_details,
            'count' => count($photo_details),
        );
    }
    
    /**
     * Get all photos from all orders (for photo gallery).
     */
    public function get_all_photos($request) {
        if (!$this->validate_token($request)) {
            return $this->unauthorized_response();
        }
        
        $page = $request->get_param('page') ?: 1;
        $per_page = $request->get_param('per_page') ?: 50;
        $date_from = $request->get_param('date_from');
        $date_to = $request->get_param('date_to');
        
        // Get orders with photos
        $args = array(
            'limit' => 100,
            'orderby' => 'date',
            'order' => 'DESC',
            'meta_query' => array(
                array(
                    'key' => 'picking_photos',
                    'compare' => 'EXISTS',
                ),
            ),
        );
        
        if (!empty($date_from)) {
            $args['date_created'] = '>=' . $date_from;
        }
        
        $orders = wc_get_orders($args);
        
        $all_photos = array();
        foreach ($orders as $order) {
            $photos = $order->get_meta('picking_photos');
            if (!is_array($photos) || empty($photos)) {
                continue;
            }
            
            foreach ($photos as $photo_url) {
                $filename = basename($photo_url);
                $timestamp = null;
                if (preg_match('/^(\d+)_/', $filename, $matches)) {
                    $timestamp = date('Y-m-d H:i:s', (int) $matches[1]);
                }
                
                $all_photos[] = array(
                    'url' => $photo_url,
                    'filename' => $filename,
                    'uploaded_at' => $timestamp,
                    'order_id' => $order->get_id(),
                    'order_number' => $order->get_order_number(),
                    'customer_name' => $order->get_formatted_billing_full_name(),
                );
            }
        }
        
        // Sort by upload time (newest first)
        usort($all_photos, function($a, $b) {
            $time_a = strtotime($a['uploaded_at'] ?? '1970-01-01');
            $time_b = strtotime($b['uploaded_at'] ?? '1970-01-01');
            return $time_b - $time_a;
        });
        
        // Paginate
        $total = count($all_photos);
        $offset = ($page - 1) * $per_page;
        $photos_page = array_slice($all_photos, $offset, $per_page);
        
        return array(
            'success' => true,
            'photos' => $photos_page,
            'total' => $total,
            'page' => (int) $page,
            'per_page' => (int) $per_page,
            'total_pages' => ceil($total / $per_page),
        );
    }
    
    /**
     * Get feature settings that control what's enabled in the web app.
     */
    public function get_feature_settings($request) {
        if (!$this->validate_token($request)) {
            return $this->unauthorized_response();
        }
        
        // Get user role if appuser is provided
        $appuser = $request->get_param('appuser') ? sanitize_text_field($request->get_param('appuser')) : '';
        $user_role = 'picker'; // Default role
        $user_permissions = array();
        
        if (!empty($appuser)) {
            $user_role = $this->get_user_role_by_name($appuser);
            $user_permissions = $this->get_role_permissions($user_role);
        }
        
        return array(
            'success' => true,
            'features' => array(
                'order_editing' => get_option('picking_enable_order_editing', '1') === '1',
                'photo_viewing' => get_option('picking_enable_photo_viewing', '1') === '1',
                'history_viewing' => get_option('picking_enable_history_viewing', '1') === '1',
                'manual_products' => get_option('picking_enable_manual_products', '1') === '1',
                'audit_viewing' => get_option('picking_enable_audit_viewing', '1') === '1',
                'order_management' => get_option('picking_enable_order_management', '1') === '1',
                'user_management' => get_option('picking_enable_user_management', '1') === '1',
                'restart_picking' => get_option('picking_enable_restart_picking', '0') === '1',
            ),
            'settings' => array(
                'batch_size' => (int) get_option('picking_batch_size', 1),
                'auto_complete' => get_option('picking_auto_complete', '1') === '1',
                'photo_required' => get_option('picking_photo_required', '1') === '1',
                'scanner_type' => get_option('picking_scanner_type', 'camera'),
                'photo_retention_days' => (int) get_option('picking_photo_retention_days', 0),
                'started_status' => get_option('picking_started_status', ''),
                'completed_status' => get_option('picking_completed_status', 'wc-completed'),
            ),
            'user_role' => $user_role,
            'user_permissions' => $user_permissions,
        );
    }
    
    /**
     * Update an order line item (quantity, etc.) - for order editing.
     */
    public function update_order_line($request) {
        if (!$this->validate_token($request)) {
            return $this->unauthorized_response();
        }
        
        // Check if order editing is enabled
        if (get_option('picking_enable_order_editing', '1') !== '1') {
            return new WP_Error('feature_disabled', __('La edicion de pedidos esta deshabilitada.', 'picking-connector'), array('status' => 403));
        }
        
        $user_check = $this->check_user_active($request);
        if (is_wp_error($user_check)) {
            return $user_check;
        }
        
        $body = $request->get_body();
        $data = json_decode($body, true);
        
        $order_id = isset($data['order_id']) ? intval($data['order_id']) : 0;
        $item_id = isset($data['item_id']) ? intval($data['item_id']) : 0;
        $quantity = isset($data['quantity']) ? intval($data['quantity']) : null;
        $appuser = isset($data['appuser']) ? sanitize_text_field($data['appuser']) : '';
        
        if (empty($order_id) || empty($item_id)) {
            return new WP_Error('missing_params', __('ID de pedido e item requeridos.', 'picking-connector'), array('status' => 400));
        }
        
        $order = wc_get_order($order_id);
        if (!$order) {
            return new WP_Error('order_not_found', __('Pedido no encontrado.', 'picking-connector'), array('status' => 404));
        }
        
        $items = $order->get_items();
        if (!isset($items[$item_id])) {
            return new WP_Error('item_not_found', __('Item no encontrado.', 'picking-connector'), array('status' => 404));
        }
        
        $item = $items[$item_id];
        $old_quantity = $item->get_quantity();
        
        if ($quantity !== null && $quantity !== $old_quantity) {
            $item->set_quantity($quantity);
            $item->save();
            
            // Record audit event
            $this->record_audit_event($order, 'quantity_changed', $appuser, array(
                'item_id' => $item_id,
                'product_name' => $item->get_name(),
                'old_quantity' => $old_quantity,
                'new_quantity' => $quantity,
            ));
            
            // Add order note
            $order->add_order_note(sprintf(
                __('Cantidad modificada por %s: %s de %d a %d', 'picking-connector'),
                $appuser,
                $item->get_name(),
                $old_quantity,
                $quantity
            ));
            
            $order->calculate_totals();
            $order->save();
        }
        
        return array(
            'success' => true,
            'message' => __('Item actualizado correctamente.', 'picking-connector'),
            'item_id' => $item_id,
            'new_quantity' => $quantity,
        );
    }
    
    /**
     * Add a new line item to an order - for order editing.
     */
    public function add_order_line($request) {
        if (!$this->validate_token($request)) {
            return $this->unauthorized_response();
        }
        
        // Check if order editing is enabled
        if (get_option('picking_enable_order_editing', '1') !== '1') {
            return new WP_Error('feature_disabled', __('La edicion de pedidos esta deshabilitada.', 'picking-connector'), array('status' => 403));
        }
        
        $user_check = $this->check_user_active($request);
        if (is_wp_error($user_check)) {
            return $user_check;
        }
        
        $body = $request->get_body();
        $data = json_decode($body, true);
        
        $order_id = isset($data['order_id']) ? intval($data['order_id']) : 0;
        $product_id = isset($data['product_id']) ? intval($data['product_id']) : 0;
        $quantity = isset($data['quantity']) ? intval($data['quantity']) : 1;
        $appuser = isset($data['appuser']) ? sanitize_text_field($data['appuser']) : '';
        
        if (empty($order_id) || empty($product_id)) {
            return new WP_Error('missing_params', __('ID de pedido y producto requeridos.', 'picking-connector'), array('status' => 400));
        }
        
        $order = wc_get_order($order_id);
        if (!$order) {
            return new WP_Error('order_not_found', __('Pedido no encontrado.', 'picking-connector'), array('status' => 404));
        }
        
        $product = wc_get_product($product_id);
        if (!$product) {
            return new WP_Error('product_not_found', __('Producto no encontrado.', 'picking-connector'), array('status' => 404));
        }
        
        // Add the product to the order
        $item_id = $order->add_product($product, $quantity);
        
        if (!$item_id) {
            return new WP_Error('add_failed', __('Error al agregar el producto.', 'picking-connector'), array('status' => 500));
        }
        
        // Record audit event
        $this->record_audit_event($order, 'item_added_to_order', $appuser, array(
            'item_id' => $item_id,
            'product_id' => $product_id,
            'product_name' => $product->get_name(),
            'quantity' => $quantity,
        ));
        
        // Add order note
        $order->add_order_note(sprintf(
            __('Producto agregado al pedido por %s: %s x%d', 'picking-connector'),
            $appuser,
            $product->get_name(),
            $quantity
        ));
        
        $order->calculate_totals();
        $order->save();
        
        return array(
            'success' => true,
            'message' => __('Producto agregado correctamente.', 'picking-connector'),
            'item_id' => $item_id,
            'product_name' => $product->get_name(),
        );
    }
    
    /**
     * Remove a line item from an order - for order editing.
     */
    public function remove_order_line($request) {
        if (!$this->validate_token($request)) {
            return $this->unauthorized_response();
        }
        
        // Check if order editing is enabled
        if (get_option('picking_enable_order_editing', '1') !== '1') {
            return new WP_Error('feature_disabled', __('La edicion de pedidos esta deshabilitada.', 'picking-connector'), array('status' => 403));
        }
        
        $user_check = $this->check_user_active($request);
        if (is_wp_error($user_check)) {
            return $user_check;
        }
        
        $body = $request->get_body();
        $data = json_decode($body, true);
        
        $order_id = isset($data['order_id']) ? intval($data['order_id']) : 0;
        $item_id = isset($data['item_id']) ? intval($data['item_id']) : 0;
        $appuser = isset($data['appuser']) ? sanitize_text_field($data['appuser']) : '';
        
        if (empty($order_id) || empty($item_id)) {
            return new WP_Error('missing_params', __('ID de pedido e item requeridos.', 'picking-connector'), array('status' => 400));
        }
        
        $order = wc_get_order($order_id);
        if (!$order) {
            return new WP_Error('order_not_found', __('Pedido no encontrado.', 'picking-connector'), array('status' => 404));
        }
        
        $items = $order->get_items();
        if (!isset($items[$item_id])) {
            return new WP_Error('item_not_found', __('Item no encontrado.', 'picking-connector'), array('status' => 404));
        }
        
        $item = $items[$item_id];
        $product_name = $item->get_name();
        $quantity = $item->get_quantity();
        
        // Record audit event before removing
        $this->record_audit_event($order, 'item_removed_from_order', $appuser, array(
            'item_id' => $item_id,
            'product_name' => $product_name,
            'quantity' => $quantity,
        ));
        
        // Remove the item
        $order->remove_item($item_id);
        
        // Add order note
        $order->add_order_note(sprintf(
            __('Producto eliminado del pedido por %s: %s x%d', 'picking-connector'),
            $appuser,
            $product_name,
            $quantity
        ));
        
        $order->calculate_totals();
        $order->save();
        
        return array(
            'success' => true,
            'message' => __('Producto eliminado correctamente.', 'picking-connector'),
            'item_id' => $item_id,
        );
    }
    
    /**
     * Restart picking for an order
     * Clears picking state but preserves audit history
     */
    public function restart_picking($request) {
        if (!$this->validate_token($request)) {
            return $this->unauthorized_response();
        }
        
        // Check if restart picking is enabled globally
        $restart_enabled = get_option('picking_enable_restart_picking', '0');
        if ($restart_enabled !== '1') {
            return new WP_Error('restart_disabled', __('La funcion de reiniciar picking esta deshabilitada.', 'picking-connector'), array('status' => 403));
        }
        
        // Validate user is active and has permission
        $user_check = $this->check_user_active($request);
        if (is_wp_error($user_check)) {
            return $user_check;
        }
        
        $body = $request->get_body();
        $data = json_decode($body, true);
        
        $order_id = isset($data['order_id']) ? absint($data['order_id']) : 0;
        $appuser = isset($data['appuser']) ? sanitize_text_field($data['appuser']) : '';
        $reason = isset($data['reason']) ? sanitize_text_field($data['reason']) : '';
        
        if (empty($order_id)) {
            return new WP_Error('missing_order_id', __('ID de pedido requerido.', 'picking-connector'), array('status' => 400));
        }
        
        $order = wc_get_order($order_id);
        if (!$order) {
            return new WP_Error('order_not_found', __('Pedido no encontrado.', 'picking-connector'), array('status' => 404));
        }
        
        // Check if order has been picked before (has picking history)
        $picking_status = $order->get_meta('picking_status');
        $picking_started_at = $order->get_meta('picking_started_at');
        
        if (empty($picking_status) && empty($picking_started_at)) {
            return new WP_Error('never_picked', __('Este pedido nunca ha sido trabajado por la app de picking.', 'picking-connector'), array('status' => 400));
        }
        
        // Check user permission for restart
        $user_role = $this->get_user_role_by_name($appuser);
        $permissions = $this->get_role_permissions($user_role);
        
        if (empty($permissions['can_restart_picking'])) {
            return new WP_Error('no_permission', __('No tienes permiso para reiniciar picking.', 'picking-connector'), array('status' => 403));
        }
        
        // Create snapshot of current state before reset
        $snapshot = array(
            'picking_status' => $picking_status,
            'user_claimed' => $order->get_meta('user_claimed'),
            'picking_started_at' => $picking_started_at,
            'picking_completed_at' => $order->get_meta('picking_completed_at'),
            'items_state' => array(),
        );
        
        // Capture item states
        foreach ($order->get_items() as $item_id => $item) {
            $snapshot['items_state'][$item_id] = array(
                'picked_qty' => $item->get_meta('picked_qty'),
                'picking_status' => $item->get_meta('picking_status'),
            );
        }
        
        // Record audit event for restart
        $this->record_audit_event($order, 'picking_restarted', $appuser, array(
            'reason' => $reason,
            'previous_state' => $snapshot,
        ));
        
        // Reset order picking state
        $order->update_meta_data('picking_status', '');
        $order->update_meta_data('user_claimed', '');
        $order->update_meta_data('picking_started_at', '');
        $order->update_meta_data('picking_completed_at', '');
        
        // Reset item picking states
        foreach ($order->get_items() as $item_id => $item) {
            $item->update_meta_data('picked_qty', 0);
            $item->update_meta_data('picking_status', '');
            $item->save();
        }
        
        // Update WooCommerce status to configured "start" status if set
        $started_status = get_option('picking_started_status', '');
        if (!empty($started_status)) {
            // Get eligible statuses
            $eligible_statuses = get_option('picking_order_status', array('wc-processing'));
            if (!is_array($eligible_statuses)) {
                $eligible_statuses = array($eligible_statuses);
            }
            
            // Only change if the target status is in eligible statuses
            if (in_array($started_status, $eligible_statuses)) {
                $order->set_status(str_replace('wc-', '', $started_status));
            }
        }
        
        // Add order note
        $order->add_order_note(sprintf(
            __('Picking reiniciado por %s. Razon: %s', 'picking-connector'),
            $appuser,
            $reason ?: __('No especificada', 'picking-connector')
        ));
        
        $order->save();
        
        return array(
            'success' => true,
            'message' => __('Picking reiniciado correctamente. El historial anterior se ha preservado en la auditoria.', 'picking-connector'),
            'order_id' => $order_id,
        );
    }
    
    /**
     * Get orders that have been worked by the picking app (for audit)
     * Only returns orders with picking activity
     */
    public function get_audit_orders($request) {
        if (!$this->validate_token($request)) {
            return $this->unauthorized_response();
        }
        
        $user_check = $this->check_user_active($request);
        if (is_wp_error($user_check)) {
            return $user_check;
        }
        
        $page = $request->get_param('page') ? absint($request->get_param('page')) : 1;
        $per_page = $request->get_param('per_page') ? absint($request->get_param('per_page')) : 20;
        $status = $request->get_param('status') ? sanitize_text_field($request->get_param('status')) : '';
        $search = $request->get_param('search') ? sanitize_text_field($request->get_param('search')) : '';
        $date_from = $request->get_param('date_from') ? sanitize_text_field($request->get_param('date_from')) : '';
        $date_to = $request->get_param('date_to') ? sanitize_text_field($request->get_param('date_to')) : '';
        
        // Build query args - only get orders that have been worked by the app
        $args = array(
            'limit' => $per_page,
            'offset' => ($page - 1) * $per_page,
            'orderby' => 'date',
            'order' => 'DESC',
            'meta_query' => array(
                'relation' => 'OR',
                array(
                    'key' => 'picking_status',
                    'value' => '',
                    'compare' => '!=',
                ),
                array(
                    'key' => 'picking_started_at',
                    'value' => '',
                    'compare' => '!=',
                ),
                array(
                    'key' => 'picking_audit_log',
                    'compare' => 'EXISTS',
                ),
                array(
                    'key' => 'picking_photos',
                    'compare' => 'EXISTS',
                ),
            ),
        );
        
        if (!empty($status)) {
            $args['status'] = $status;
        }
        
        if (!empty($search)) {
            $args['s'] = $search;
        }
        
        if (!empty($date_from)) {
            $args['date_created'] = '>=' . $date_from;
        }
        
        if (!empty($date_to)) {
            if (!empty($args['date_created'])) {
                $args['date_created'] = array($date_from . '...' . $date_to);
            } else {
                $args['date_created'] = '<=' . $date_to;
            }
        }
        
        $orders = wc_get_orders($args);
        
        // Get total count for pagination
        $count_args = $args;
        $count_args['limit'] = -1;
        $count_args['return'] = 'ids';
        unset($count_args['offset']);
        $total_orders = count(wc_get_orders($count_args));
        
        $result = array();
        foreach ($orders as $order) {
            $picking_status = $order->get_meta('picking_status');
            $user_claimed = $order->get_meta('user_claimed');
            $picking_started_at = $order->get_meta('picking_started_at');
            $picking_completed_at = $order->get_meta('picking_completed_at');
            $photos = $order->get_meta('picking_photos');
            $audit_log = $order->get_meta('picking_audit_log');
            $picking_users = $order->get_meta('picking_users');
            
            $result[] = array(
                'id' => $order->get_id(),
                'number' => $order->get_order_number(),
                'status' => $order->get_status(),
                'date_created' => $order->get_date_created() ? $order->get_date_created()->format('Y-m-d H:i:s') : null,
                'total' => $order->get_total(),
                'customer_name' => $order->get_formatted_billing_full_name(),
                'picking_status' => $picking_status,
                'user_claimed' => $user_claimed,
                'picking_started_at' => $picking_started_at,
                'picking_completed_at' => $picking_completed_at,
                'photos_count' => is_array($photos) ? count($photos) : 0,
                'audit_events_count' => is_array($audit_log) ? count($audit_log) : 0,
                'picking_users' => is_array($picking_users) ? $picking_users : array(),
            );
        }
        
        return array(
            'success' => true,
            'orders' => $result,
            'total' => $total_orders,
            'page' => $page,
            'per_page' => $per_page,
            'total_pages' => ceil($total_orders / $per_page),
        );
    }
    
    /**
     * Get user role by username
     */
    private function get_user_role_by_name($username) {
        $users = get_option('picking_registered_users', array());
        
        foreach ($users as $user) {
            if (strtolower($user['name']) === strtolower($username)) {
                return $user['role'];
            }
        }
        
        return 'picker'; // Default role
    }
}

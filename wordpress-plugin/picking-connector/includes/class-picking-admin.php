<?php
/**
 * Picking Connector Admin
 * 
 * Handles all admin functionality for the plugin.
 */

if (!defined('ABSPATH')) {
    exit;
}

class Picking_Admin {
    
    public function __construct() {
        add_filter('manage_edit-shop_order_columns', array($this, 'add_picking_order_column'), 10, 1);
        add_action('manage_shop_order_posts_custom_column', array($this, 'add_picking_order_column_value'), 10, 2);
        
        add_filter('manage_woocommerce_page_wc-orders_columns', array($this, 'add_picking_order_column'), 10, 1);
        add_action('manage_woocommerce_page_wc-orders_custom_column', array($this, 'add_picking_order_column_value'), 10, 2);
        
        add_filter('bulk_actions-edit-shop_order', array($this, 'register_bulk_actions'));
        add_filter('bulk_actions-woocommerce_page_wc-orders', array($this, 'register_bulk_actions'));
        add_filter('handle_bulk_actions-edit-shop_order', array($this, 'handle_bulk_actions'), 20, 3);
        add_filter('handle_bulk_actions-woocommerce_page_wc-orders', array($this, 'handle_bulk_actions'), 20, 3);
        
        add_action('wp_dashboard_setup', array($this, 'add_dashboard_widget'));
        
        // Add picking audit metabox to order edit page
        add_action('add_meta_boxes', array($this, 'add_picking_audit_metabox'));
    }
    
    public function enqueue_styles_scripts($hook) {
        if (strpos($hook, 'picking-connector') === false && strpos($hook, 'picking-app') === false) {
            return;
        }
        
        wp_enqueue_style(
            'picking-admin-css',
            PICKING_PLUGIN_URL . 'admin/css/admin.css',
            array(),
            PICKING_VERSION
        );
        
        wp_enqueue_script(
            'picking-admin-js',
            PICKING_PLUGIN_URL . 'admin/js/admin.js',
            array('jquery'),
            PICKING_VERSION,
            true
        );
        
        wp_enqueue_script(
            'qrcode-js',
            'https://cdn.jsdelivr.net/npm/qrcode@1.5.3/build/qrcode.min.js',
            array(),
            '1.5.3',
            true
        );
        
        wp_localize_script('picking-admin-js', 'pickingAdmin', array(
            'ajaxUrl' => admin_url('admin-ajax.php'),
            'nonce' => wp_create_nonce('picking_admin_nonce'),
            'siteUrl' => get_site_url(),
            'restUrl' => get_rest_url(),
            'apiKey' => get_option('picking_api_key', ''),
            'strings' => array(
                'generating' => __('Generando...', 'picking-connector'),
                'testing' => __('Probando...', 'picking-connector'),
                'success' => __('Exito', 'picking-connector'),
                'error' => __('Error', 'picking-connector'),
                'copied' => __('Copiado!', 'picking-connector'),
            )
        ));
    }
    
    public function add_admin_menu() {
        add_menu_page(
            __('Picking App', 'picking-connector'),
            __('Picking App', 'picking-connector'),
            'manage_woocommerce',
            'picking-connector',
            array($this, 'render_settings_page'),
            'dashicons-clipboard',
            56
        );
        
        add_submenu_page(
            'picking-connector',
            __('Configuracion', 'picking-connector'),
            __('Configuracion', 'picking-connector'),
            'manage_woocommerce',
            'picking-connector',
            array($this, 'render_settings_page')
        );
        
        add_submenu_page(
            'picking-connector',
            __('Conexion', 'picking-connector'),
            __('Conexion', 'picking-connector'),
            'manage_woocommerce',
            'picking-connector-connection',
            array($this, 'render_connection_page')
        );
        
        add_submenu_page(
            'picking-connector',
            __('Usuarios', 'picking-connector'),
            __('Usuarios', 'picking-connector'),
            'manage_woocommerce',
            'picking-connector-users',
            array($this, 'render_users_page')
        );
    }
    
    public function register_settings() {
        register_setting('picking_settings', 'picking_api_key');
        register_setting('picking_settings', 'picking_app_url');
        register_setting('picking_settings', 'picking_batch_size');
        register_setting('picking_settings', 'picking_auto_complete');
        register_setting('picking_settings', 'picking_photo_required');
        register_setting('picking_settings', 'picking_order_status');
        register_setting('picking_settings', 'picking_scanner_type');
        register_setting('picking_settings', 'picking_completed_status');
        register_setting('picking_settings', 'picking_logo_url');
    }
    
    public function display_notices() {
        $api_key = get_option('picking_api_key', '');
        
        if (empty($api_key)) {
            echo '<div class="notice notice-warning is-dismissible">';
            echo '<p>' . sprintf(
                __('Picking Connector: %s para comenzar a usar la aplicacion.', 'picking-connector'),
                '<a href="' . admin_url('admin.php?page=picking-connector') . '">' . __('Configura tu API Key', 'picking-connector') . '</a>'
            ) . '</p>';
            echo '</div>';
        }
    }
    
    public function render_settings_page() {
        $api_key = get_option('picking_api_key', '');
        $app_url = get_option('picking_app_url', '');
        $batch_size = get_option('picking_batch_size', '1');
        $auto_complete = get_option('picking_auto_complete', '1');
        $photo_required = get_option('picking_photo_required', '1');
        $order_status = get_option('picking_order_status', array('wc-processing'));
        $scanner_type = get_option('picking_scanner_type', 'camera');
        $completed_status = get_option('picking_completed_status', 'wc-completed');
        $logo_url = get_option('picking_logo_url', '');
        
        if (!is_array($order_status)) {
            $order_status = array($order_status);
        }
        
        $all_statuses = wc_get_order_statuses();
        
        include PICKING_PLUGIN_DIR . 'admin/partials/settings-page.php';
    }
    
    public function render_connection_page() {
        $api_key = get_option('picking_api_key', '');
        $app_url = get_option('picking_app_url', '');
        
        $connection_data = array(
            'store_url' => get_site_url(),
            'api_key' => $api_key,
            'store_name' => get_bloginfo('name'),
            'rest_url' => get_rest_url(null, 'picking/v1'),
        );
        
        $connection_string = base64_encode(json_encode($connection_data));
        
        include PICKING_PLUGIN_DIR . 'admin/partials/connection-page.php';
    }
    
    public function render_users_page() {
        $users = get_option('picking_users', array());
        include PICKING_PLUGIN_DIR . 'admin/partials/users-page.php';
    }
    
    public function ajax_save_settings() {
        check_ajax_referer('picking_admin_nonce', 'nonce');
        
        if (!current_user_can('manage_woocommerce')) {
            wp_send_json_error(array('message' => __('No tienes permisos.', 'picking-connector')));
        }
        
        $settings = array(
            'picking_batch_size' => isset($_POST['batch_size']) ? absint($_POST['batch_size']) : 1,
            'picking_auto_complete' => isset($_POST['auto_complete']) ? '1' : '0',
            'picking_photo_required' => isset($_POST['photo_required']) ? '1' : '0',
            'picking_order_status' => isset($_POST['order_status']) ? array_map('sanitize_text_field', (array)$_POST['order_status']) : array('wc-processing'),
            'picking_scanner_type' => isset($_POST['scanner_type']) ? sanitize_text_field($_POST['scanner_type']) : 'camera',
            'picking_completed_status' => isset($_POST['completed_status']) ? sanitize_text_field($_POST['completed_status']) : 'wc-completed',
            'picking_logo_url' => isset($_POST['logo_url']) ? esc_url_raw($_POST['logo_url']) : '',
            'picking_app_url' => isset($_POST['app_url']) ? esc_url_raw($_POST['app_url']) : '',
        );
        
        foreach ($settings as $key => $value) {
            update_option($key, $value);
        }
        
        wp_send_json_success(array('message' => __('Configuracion guardada.', 'picking-connector')));
    }
    
    public function ajax_generate_api_key() {
        check_ajax_referer('picking_admin_nonce', 'nonce');
        
        if (!current_user_can('manage_woocommerce')) {
            wp_send_json_error(array('message' => __('No tienes permisos.', 'picking-connector')));
        }
        
        $new_key = wp_generate_uuid4();
        update_option('picking_api_key', $new_key);
        
        wp_send_json_success(array(
            'api_key' => $new_key,
            'message' => __('Nueva API Key generada.', 'picking-connector')
        ));
    }
    
    public function ajax_test_connection() {
        check_ajax_referer('picking_admin_nonce', 'nonce');
        
        if (!current_user_can('manage_woocommerce')) {
            wp_send_json_error(array('message' => __('No tienes permisos.', 'picking-connector')));
        }
        
        $api_key = get_option('picking_api_key', '');
        
        if (empty($api_key)) {
            wp_send_json_error(array('message' => __('No hay API Key configurada.', 'picking-connector')));
        }
        
        $url = get_rest_url(null, 'picking/v1/get-settings');
        $response = wp_remote_get($url, array(
            'headers' => array(
                'X-Picking-Token' => $api_key,
            ),
        ));
        
        if (is_wp_error($response)) {
            wp_send_json_error(array('message' => $response->get_error_message()));
        }
        
        $code = wp_remote_retrieve_response_code($response);
        
        if ($code === 200) {
            wp_send_json_success(array('message' => __('Conexion exitosa. La API esta funcionando.', 'picking-connector')));
        } else {
            wp_send_json_error(array('message' => sprintf(__('Error de conexion. Codigo: %d', 'picking-connector'), $code)));
        }
    }
    
    public function ajax_reset_order_data() {
        check_ajax_referer('picking_admin_nonce', 'nonce');
        
        if (!current_user_can('manage_woocommerce')) {
            wp_send_json_error(array('message' => __('No tienes permisos.', 'picking-connector')));
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
            
            foreach ($order->get_items() as $item) {
                $item->delete_meta_data('picking_status');
                $item->delete_meta_data('backorder');
                $item->delete_meta_data('picked_qty');
                $item->save();
            }
            
            $order->save();
            $count++;
        }
        
        wp_send_json_success(array(
            'message' => sprintf(__('Se han reiniciado %d pedidos.', 'picking-connector'), $count)
        ));
    }
    
    public function add_picking_order_column($columns) {
        $new_columns = array();
        
        foreach ($columns as $key => $value) {
            $new_columns[$key] = $value;
            if ($key === 'order_status') {
                $new_columns['picking_status'] = __('Picking', 'picking-connector');
            }
        }
        
        return $new_columns;
    }
    
    public function add_picking_order_column_value($column, $order) {
        if ($column !== 'picking_status') {
            return;
        }
        
        if (is_numeric($order)) {
            $order = wc_get_order($order);
        }
        
        if (!$order) {
            echo '-';
            return;
        }
        
        $picking_status = $order->get_meta('picking_status');
        $user_claimed = $order->get_meta('user_claimed');
        
        if (!empty($picking_status)) {
            $status_class = '';
            $status_label = '';
            
            switch ($picking_status) {
                case 'picking':
                    $status_class = 'picking-status-picking';
                    $status_label = __('En Proceso', 'picking-connector');
                    break;
                case 'packing':
                    $status_class = 'picking-status-packing';
                    $status_label = __('Empacando', 'picking-connector');
                    break;
                case 'completed':
                    $status_class = 'picking-status-completed';
                    $status_label = __('Completado', 'picking-connector');
                    break;
                default:
                    $status_label = ucfirst($picking_status);
            }
            
            echo '<span class="picking-status ' . esc_attr($status_class) . '">' . esc_html($status_label) . '</span>';
            
            if (!empty($user_claimed)) {
                echo '<br><small>' . esc_html(ucfirst($user_claimed)) . '</small>';
            }
        } else {
            echo '<span class="picking-status picking-status-pending">' . esc_html__('Pendiente', 'picking-connector') . '</span>';
        }
    }
    
    public function register_bulk_actions($actions) {
        $actions['picking_reset'] = __('Reiniciar Picking', 'picking-connector');
        return $actions;
    }
    
    public function handle_bulk_actions($redirect_to, $action, $order_ids) {
        if ($action !== 'picking_reset') {
            return $redirect_to;
        }
        
        foreach ($order_ids as $order_id) {
            $order = wc_get_order($order_id);
            if ($order) {
                $order->delete_meta_data('picking_status');
                $order->delete_meta_data('user_claimed');
                $order->delete_meta_data('picking_started_at');
                
                foreach ($order->get_items() as $item) {
                    $item->delete_meta_data('picking_status');
                    $item->delete_meta_data('backorder');
                    $item->delete_meta_data('picked_qty');
                    $item->save();
                }
                
                $order->save();
            }
        }
        
        return add_query_arg('picking_reset', count($order_ids), $redirect_to);
    }
    
    public function add_dashboard_widget() {
        wp_add_dashboard_widget(
            'picking_dashboard_widget',
            __('Picking App', 'picking-connector'),
            array($this, 'render_dashboard_widget')
        );
    }
    
    public function render_dashboard_widget() {
        $order_status = get_option('picking_order_status', array('wc-processing'));
        if (!is_array($order_status)) {
            $order_status = array($order_status);
        }
        
        $pending_orders = wc_get_orders(array(
            'status' => $order_status,
            'limit' => -1,
            'return' => 'ids',
        ));
        
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
        
        $completed_today = wc_get_orders(array(
            'status' => 'completed',
            'date_completed' => '>' . date('Y-m-d 00:00:00'),
            'limit' => -1,
            'return' => 'ids',
        ));
        
        ?>
        <div class="picking-widget">
            <div class="picking-widget-stats">
                <div class="picking-widget-stat">
                    <span class="picking-widget-number"><?php echo count($pending_orders); ?></span>
                    <span class="picking-widget-label"><?php _e('Pendientes', 'picking-connector'); ?></span>
                </div>
                <div class="picking-widget-stat">
                    <span class="picking-widget-number"><?php echo count($picking_orders); ?></span>
                    <span class="picking-widget-label"><?php _e('En Proceso', 'picking-connector'); ?></span>
                </div>
                <div class="picking-widget-stat">
                    <span class="picking-widget-number"><?php echo count($completed_today); ?></span>
                    <span class="picking-widget-label"><?php _e('Completados Hoy', 'picking-connector'); ?></span>
                </div>
            </div>
            <p>
                <a href="<?php echo admin_url('admin.php?page=picking-connector'); ?>" class="button button-primary">
                    <?php _e('Configuracion', 'picking-connector'); ?>
                </a>
                <a href="<?php echo admin_url('admin.php?page=picking-connector-connection'); ?>" class="button">
                    <?php _e('Conectar App', 'picking-connector'); ?>
                </a>
            </p>
        </div>
        <?php
    }
    
    /**
     * AJAX: Add new user
     */
    public function ajax_add_user() {
        check_ajax_referer('picking_admin_nonce', 'nonce');
        
        if (!current_user_can('manage_woocommerce')) {
            wp_send_json_error(array('message' => __('No tienes permisos.', 'picking-connector')));
        }
        
        $user_name = isset($_POST['user_name']) ? sanitize_text_field($_POST['user_name']) : '';
        $user_pin = isset($_POST['user_pin']) ? sanitize_text_field($_POST['user_pin']) : '';
        $user_role = isset($_POST['user_role']) ? sanitize_text_field($_POST['user_role']) : 'picker';
        
        if (empty($user_name) || empty($user_pin)) {
            wp_send_json_error(array('message' => __('Nombre y PIN son requeridos.', 'picking-connector')));
        }
        
        if (!preg_match('/^[0-9]{4}$/', $user_pin)) {
            wp_send_json_error(array('message' => __('El PIN debe ser de 4 digitos.', 'picking-connector')));
        }
        
        $valid_roles = array('admin', 'supervisor', 'picker');
        if (!in_array($user_role, $valid_roles)) {
            $user_role = 'picker';
        }
        
        $users = get_option('picking_registered_users', array());
        
        // Check if user already exists
        foreach ($users as $user) {
            if (strtolower($user['name']) === strtolower($user_name)) {
                wp_send_json_error(array('message' => __('Ya existe un usuario con ese nombre.', 'picking-connector')));
            }
        }
        
        // Generate unique user ID (compatible with older WordPress versions)
        if (function_exists('wp_generate_uuid4')) {
            $user_id = wp_generate_uuid4();
        } else {
            $user_id = 'picking_' . md5(strtolower($user_name) . '|' . microtime(true) . '|' . wp_rand());
        }
        $users[$user_id] = array(
            'name' => $user_name,
            'pin' => wp_hash_password($user_pin),
            'role' => $user_role,
            'active' => true,
            'orders_completed' => 0,
            'last_activity' => null,
            'created_at' => current_time('mysql'),
        );
        
        update_option('picking_registered_users', $users);
        
        wp_send_json_success(array('message' => __('Usuario agregado correctamente.', 'picking-connector')));
    }
    
    /**
     * AJAX: Get user data
     */
    public function ajax_get_user() {
        check_ajax_referer('picking_admin_nonce', 'nonce');
        
        if (!current_user_can('manage_woocommerce')) {
            wp_send_json_error(array('message' => __('No tienes permisos.', 'picking-connector')));
        }
        
        $user_id = isset($_POST['user_id']) ? sanitize_text_field($_POST['user_id']) : '';
        $users = get_option('picking_registered_users', array());
        
        if (!isset($users[$user_id])) {
            wp_send_json_error(array('message' => __('Usuario no encontrado.', 'picking-connector')));
        }
        
        wp_send_json_success(array(
            'name' => $users[$user_id]['name'],
            'role' => $users[$user_id]['role'],
            'active' => $users[$user_id]['active'],
        ));
    }
    
    /**
     * AJAX: Update user
     */
    public function ajax_update_user() {
        check_ajax_referer('picking_admin_nonce', 'nonce');
        
        if (!current_user_can('manage_woocommerce')) {
            wp_send_json_error(array('message' => __('No tienes permisos.', 'picking-connector')));
        }
        
        $user_id = isset($_POST['user_id']) ? sanitize_text_field($_POST['user_id']) : '';
        $user_name = isset($_POST['user_name']) ? sanitize_text_field($_POST['user_name']) : '';
        $user_pin = isset($_POST['user_pin']) ? sanitize_text_field($_POST['user_pin']) : '';
        $user_role = isset($_POST['user_role']) ? sanitize_text_field($_POST['user_role']) : 'picker';
        
        $users = get_option('picking_registered_users', array());
        
        if (!isset($users[$user_id])) {
            wp_send_json_error(array('message' => __('Usuario no encontrado.', 'picking-connector')));
        }
        
        if (empty($user_name)) {
            wp_send_json_error(array('message' => __('El nombre es requerido.', 'picking-connector')));
        }
        
        // Check if name is taken by another user
        foreach ($users as $id => $user) {
            if ($id !== $user_id && strtolower($user['name']) === strtolower($user_name)) {
                wp_send_json_error(array('message' => __('Ya existe un usuario con ese nombre.', 'picking-connector')));
            }
        }
        
        $valid_roles = array('admin', 'supervisor', 'picker');
        if (!in_array($user_role, $valid_roles)) {
            $user_role = 'picker';
        }
        
        $users[$user_id]['name'] = $user_name;
        $users[$user_id]['role'] = $user_role;
        
        // Update PIN only if provided
        if (!empty($user_pin)) {
            if (!preg_match('/^[0-9]{4}$/', $user_pin)) {
                wp_send_json_error(array('message' => __('El PIN debe ser de 4 digitos.', 'picking-connector')));
            }
            $users[$user_id]['pin'] = wp_hash_password($user_pin);
        }
        
        update_option('picking_registered_users', $users);
        
        wp_send_json_success(array('message' => __('Usuario actualizado correctamente.', 'picking-connector')));
    }
    
    /**
     * AJAX: Toggle user active status
     */
    public function ajax_toggle_user() {
        check_ajax_referer('picking_admin_nonce', 'nonce');
        
        if (!current_user_can('manage_woocommerce')) {
            wp_send_json_error(array('message' => __('No tienes permisos.', 'picking-connector')));
        }
        
        $user_id = isset($_POST['user_id']) ? sanitize_text_field($_POST['user_id']) : '';
        $users = get_option('picking_registered_users', array());
        
        if (!isset($users[$user_id])) {
            wp_send_json_error(array('message' => __('Usuario no encontrado.', 'picking-connector')));
        }
        
        $users[$user_id]['active'] = !$users[$user_id]['active'];
        update_option('picking_registered_users', $users);
        
        wp_send_json_success(array('message' => __('Estado actualizado.', 'picking-connector')));
    }
    
    /**
     * AJAX: Delete user
     */
    public function ajax_delete_user() {
        check_ajax_referer('picking_admin_nonce', 'nonce');
        
        if (!current_user_can('manage_woocommerce')) {
            wp_send_json_error(array('message' => __('No tienes permisos.', 'picking-connector')));
        }
        
        $user_id = isset($_POST['user_id']) ? sanitize_text_field($_POST['user_id']) : '';
        $users = get_option('picking_registered_users', array());
        
        if (!isset($users[$user_id])) {
            wp_send_json_error(array('message' => __('Usuario no encontrado.', 'picking-connector')));
        }
        
        unset($users[$user_id]);
        update_option('picking_registered_users', $users);
        
        wp_send_json_success(array('message' => __('Usuario eliminado.', 'picking-connector')));
    }
    
    /**
     * Add picking audit metabox to order edit page
     */
    public function add_picking_audit_metabox() {
        $screen = wc_get_container()->get(\Automattic\WooCommerce\Internal\DataStores\Orders\CustomOrdersTableController::class)->custom_orders_table_usage_is_enabled()
            ? wc_get_page_screen_id('shop-order')
            : 'shop_order';
        
        add_meta_box(
            'picking_audit_metabox',
            __('Auditoria de Picking', 'picking-connector'),
            array($this, 'render_picking_audit_metabox'),
            $screen,
            'side',
            'default'
        );
        
        // Also add for legacy post type
        add_meta_box(
            'picking_audit_metabox',
            __('Auditoria de Picking', 'picking-connector'),
            array($this, 'render_picking_audit_metabox'),
            'shop_order',
            'side',
            'default'
        );
    }
    
    /**
     * Render picking audit metabox content
     */
    public function render_picking_audit_metabox($post_or_order) {
        // Handle both post object and order object (HPOS compatibility)
        if ($post_or_order instanceof WC_Order) {
            $order = $post_or_order;
        } elseif (is_a($post_or_order, 'WP_Post')) {
            $order = wc_get_order($post_or_order->ID);
        } else {
            $order = wc_get_order($post_or_order);
        }
        
        if (!$order) {
            echo '<p>' . __('No se pudo cargar el pedido.', 'picking-connector') . '</p>';
            return;
        }
        
        // Get picking data
        $picking_status = $order->get_meta('picking_status');
        $picking_started_by = $order->get_meta('picking_started_by') ?: $order->get_meta('user_claimed');
        $picking_started_at = $order->get_meta('picking_started_at');
        $picking_completed_at = $order->get_meta('picking_completed_at');
        $picking_users = $order->get_meta('picking_users');
        $picking_photos = $order->get_meta('picking_photos');
        
        if (!is_array($picking_users)) {
            $picking_users = array();
        }
        if (!is_array($picking_photos)) {
            $picking_photos = array();
        }
        
        // Display picking status
        echo '<div class="picking-audit-section">';
        echo '<p><strong>' . __('Estado:', 'picking-connector') . '</strong> ';
        if ($picking_status) {
            $status_labels = array(
                'pending' => __('Pendiente', 'picking-connector'),
                'picking' => __('En Proceso', 'picking-connector'),
                'packing' => __('Empacando', 'picking-connector'),
                'completed' => __('Completado', 'picking-connector'),
            );
            echo esc_html(isset($status_labels[$picking_status]) ? $status_labels[$picking_status] : ucfirst($picking_status));
        } else {
            echo __('Sin iniciar', 'picking-connector');
        }
        echo '</p>';
        
        // Display who started
        if ($picking_started_by) {
            echo '<p><strong>' . __('Iniciado por:', 'picking-connector') . '</strong> ' . esc_html($picking_started_by) . '</p>';
        }
        
        // Display start time
        if ($picking_started_at) {
            echo '<p><strong>' . __('Fecha inicio:', 'picking-connector') . '</strong> ' . esc_html($picking_started_at) . '</p>';
        }
        
        // Display completion time
        if ($picking_completed_at) {
            echo '<p><strong>' . __('Fecha fin:', 'picking-connector') . '</strong> ' . esc_html($picking_completed_at) . '</p>';
        }
        
        // Display all users who worked on this order
        if (!empty($picking_users)) {
            echo '<p><strong>' . __('Trabajado por:', 'picking-connector') . '</strong> ' . esc_html(implode(', ', $picking_users)) . '</p>';
        }
        echo '</div>';
        
        // Display photos
        if (!empty($picking_photos)) {
            echo '<div class="picking-audit-photos">';
            echo '<p><strong>' . __('Fotos de evidencia:', 'picking-connector') . '</strong> (' . count($picking_photos) . ')</p>';
            echo '<div style="display: flex; flex-wrap: wrap; gap: 5px; margin-top: 10px;">';
            foreach ($picking_photos as $photo_url) {
                echo '<a href="' . esc_url($photo_url) . '" target="_blank" style="display: block;">';
                echo '<img src="' . esc_url($photo_url) . '" style="width: 60px; height: 60px; object-fit: cover; border: 1px solid #ddd; border-radius: 4px;" />';
                echo '</a>';
            }
            echo '</div>';
            echo '</div>';
        } else {
            echo '<p><em>' . __('No hay fotos de evidencia.', 'picking-connector') . '</em></p>';
        }
        
        // Get manual items
        $extra_items = $order->get_meta('picking_extra_items');
        if (is_array($extra_items) && !empty($extra_items)) {
            $active_items = array_filter($extra_items, function($item) {
                return !isset($item['status']) || $item['status'] === 'active';
            });
            
            if (!empty($active_items)) {
                echo '<div class="picking-audit-manual-items" style="margin-top: 15px;">';
                echo '<p><strong>' . __('Productos agregados manualmente:', 'picking-connector') . '</strong></p>';
                echo '<ul style="margin: 5px 0; padding-left: 20px;">';
                foreach ($active_items as $item) {
                    echo '<li>';
                    echo esc_html($item['name']) . ' (x' . esc_html($item['qty']) . ')';
                    if (!empty($item['added_by'])) {
                        echo ' - <small>' . esc_html($item['added_by']) . '</small>';
                    }
                    echo '</li>';
                }
                echo '</ul>';
                echo '</div>';
            }
        }
    }
}

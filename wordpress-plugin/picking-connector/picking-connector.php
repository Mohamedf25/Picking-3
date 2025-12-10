<?php
/**
 * Plugin Name: Picking Connector
 * Plugin URI: https://github.com/Mohamedf25/Picking-3
 * Description: Conecta tu tienda WooCommerce con la aplicacion de Picking para gestionar pedidos de forma rapida y eficiente. Sistema de picking inteligente con escaneo de codigos de barras, picking individual y por lotes.
 * Version: 2.4.0
 * Author: Picking System
 * Author URI: https://github.com/Mohamedf25
 * Text Domain: picking-connector
 * Domain Path: /languages
 * Requires at least: 6.0
 * Requires PHP: 7.4
 * WC requires at least: 7.0
 * WC tested up to: 8.0
 */

if (!defined('ABSPATH')) {
    exit;
}

define('PICKING_VERSION', '2.4.0');
define('PICKING_PLUGIN_DIR', trailingslashit(plugin_dir_path(__FILE__)));
define('PICKING_PLUGIN_URL', trailingslashit(plugin_dir_url(__FILE__)));
define('PICKING_PLUGIN_BASENAME', plugin_basename(__FILE__));

class Picking_Connector {
    
    private static $instance = null;
    private $loader;
    
    public static function get_instance() {
        if (null === self::$instance) {
            self::$instance = new self();
        }
        return self::$instance;
    }
    
    private function __construct() {
        $this->load_dependencies();
        $this->define_hooks();
        
        add_filter('woocommerce_get_wp_query_args', array($this, 'filter_query_args'), 10, 2);
        add_filter('woocommerce_order_data_store_cpt_get_orders_query', array($this, 'filter_query_args'), 10, 2);
        
        add_action('woocommerce_admin_order_item_headers', array($this, 'add_picking_column_header'));
        add_action('woocommerce_admin_order_item_values', array($this, 'add_picking_column_value'), 10, 3);
    }
    
    private function load_dependencies() {
        require_once PICKING_PLUGIN_DIR . 'includes/class-picking-loader.php';
        require_once PICKING_PLUGIN_DIR . 'includes/class-picking-admin.php';
        require_once PICKING_PLUGIN_DIR . 'includes/class-picking-api.php';
        
        $this->loader = new Picking_Loader();
    }
    
    private function define_hooks() {
        $admin = new Picking_Admin();
        
        $this->loader->add_action('admin_enqueue_scripts', $admin, 'enqueue_styles_scripts');
        $this->loader->add_action('admin_menu', $admin, 'add_admin_menu');
        $this->loader->add_action('admin_init', $admin, 'register_settings');
        $this->loader->add_action('admin_notices', $admin, 'display_notices');
        
        $this->loader->add_action('wp_ajax_picking_save_settings', $admin, 'ajax_save_settings');
        $this->loader->add_action('wp_ajax_picking_generate_api_key', $admin, 'ajax_generate_api_key');
        $this->loader->add_action('wp_ajax_picking_test_connection', $admin, 'ajax_test_connection');
        $this->loader->add_action('wp_ajax_picking_reset_order_data', $admin, 'ajax_reset_order_data');
        $this->loader->add_action('wp_ajax_picking_save_features', $admin, 'ajax_save_features');
        $this->loader->add_action('wp_ajax_picking_save_permissions', $admin, 'ajax_save_permissions');
        $this->loader->add_action('wp_ajax_picking_save_retention', $admin, 'ajax_save_retention');
        $this->loader->add_action('wp_ajax_picking_cleanup_photos', $admin, 'ajax_cleanup_photos');
        $this->loader->add_action('wp_ajax_picking_save_status_config', $admin, 'ajax_save_status_config');
        
        // User management AJAX actions
        $this->loader->add_action('wp_ajax_picking_add_user', $admin, 'ajax_add_user');
        $this->loader->add_action('wp_ajax_picking_get_user', $admin, 'ajax_get_user');
        $this->loader->add_action('wp_ajax_picking_update_user', $admin, 'ajax_update_user');
        $this->loader->add_action('wp_ajax_picking_toggle_user', $admin, 'ajax_toggle_user');
        $this->loader->add_action('wp_ajax_picking_delete_user', $admin, 'ajax_delete_user');
        
        $api = new Picking_API();
        $this->loader->add_action('rest_api_init', $api, 'register_routes');
        $this->loader->add_action('rest_api_init', $this, 'add_cors_support');
        $this->loader->add_action('plugins_loaded', $this, 'load_textdomain');
    }
    
    public function run() {
        $this->loader->run();
    }
    
    public function load_textdomain() {
        load_plugin_textdomain('picking-connector', false, dirname(PICKING_PLUGIN_BASENAME) . '/languages');
    }
    
    public function add_cors_support() {
        add_filter('rest_allowed_cors_headers', function($headers) {
            $headers[] = 'X-Picking-Token';
            return array_values(array_unique($headers));
        });
        
        add_filter('rest_pre_serve_request', function($value) {
            header('Access-Control-Allow-Origin: *');
            header('Access-Control-Allow-Methods: GET, POST, OPTIONS, PUT, DELETE');
            return $value;
        });
    }
    
    public function filter_query_args($wp_query_args, $query_vars) {
        if (isset($query_vars['meta_query'])) {
            $meta_query = isset($wp_query_args['meta_query']) ? $wp_query_args['meta_query'] : array();
            $wp_query_args['meta_query'] = array_merge($meta_query, $query_vars['meta_query']);
        }
        return $wp_query_args;
    }
    
    public function add_picking_column_header() {
        echo '<th>' . esc_html__('Picking', 'picking-connector') . '</th>';
    }
    
    public function add_picking_column_value($_product, $item, $item_id = null) {
        $picking_status = $item->get_meta('picking_status');
        $backorder = $item->get_meta('backorder');
        
        $user_claimed = '-';
        if (method_exists($item, 'get_order_id')) {
            $order_id = $item->get_order_id();
            $order = wc_get_order($order_id);
            if ($order) {
                $user_claimed = $order->get_meta('user_claimed');
            }
        }
        
        if (!empty($picking_status)) {
            echo '<td>';
            echo 'Status: ' . esc_html($picking_status) . '<br/>';
            echo 'Backorders: ' . esc_html($backorder ?: '0') . '<br/>';
            echo 'Picker: ' . esc_html(ucfirst($user_claimed ?: '-'));
            echo '</td>';
        } else {
            echo '<td>-</td>';
        }
    }
    
    public function is_hpos_enabled() {
        if (class_exists('Automattic\WooCommerce\Internal\DataStores\Orders\CustomOrdersTableController')) {
            $controller = wc_get_container()->get('Automattic\WooCommerce\Internal\DataStores\Orders\CustomOrdersTableController');
            return $controller->custom_orders_table_usage_is_enabled();
        }
        return false;
    }
}

function picking_connector_init() {
    if (!class_exists('WooCommerce')) {
        add_action('admin_notices', function() {
            echo '<div class="notice notice-error"><p>';
            echo esc_html__('Picking Connector requiere WooCommerce para funcionar.', 'picking-connector');
            echo '</p></div>';
        });
        return;
    }
    
    $plugin = Picking_Connector::get_instance();
    $plugin->run();
}

add_action('plugins_loaded', 'picking_connector_init');

register_activation_hook(__FILE__, function() {
    if (!get_option('picking_api_key')) {
        update_option('picking_api_key', wp_generate_uuid4());
    }
    if (!get_option('picking_batch_size')) {
        update_option('picking_batch_size', '1');
    }
    if (!get_option('picking_auto_complete')) {
        update_option('picking_auto_complete', '1');
    }
    if (!get_option('picking_photo_required')) {
        update_option('picking_photo_required', '1');
    }
    if (!get_option('picking_order_status')) {
        update_option('picking_order_status', array('wc-processing'));
    }
    if (!get_option('picking_scanner_type')) {
        update_option('picking_scanner_type', 'camera');
    }
    
    $upload_dir = wp_upload_dir();
    $picking_dir = $upload_dir['basedir'] . '/picking-connector';
    if (!file_exists($picking_dir)) {
        wp_mkdir_p($picking_dir);
        wp_mkdir_p($picking_dir . '/logs');
        wp_mkdir_p($picking_dir . '/photos');
    }
});

register_deactivation_hook(__FILE__, function() {
    // Keep settings on deactivation for easy reactivation
});

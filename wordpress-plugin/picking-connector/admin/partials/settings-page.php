<?php
/**
 * Settings Page Template
 */

if (!defined('ABSPATH')) {
    exit;
}
?>

<div class="wrap picking-wrap">
    <h1>
        <span class="dashicons dashicons-clipboard"></span>
        <?php esc_html_e('Picking App - Configuracion', 'picking-connector'); ?>
    </h1>
    
    <div class="picking-header">
        <h2><?php esc_html_e('Conecta tu tienda con la App de Picking', 'picking-connector'); ?></h2>
        <p><?php esc_html_e('Gestiona tus pedidos de WooCommerce de forma rapida y eficiente con escaneo de codigos de barras, picking individual y por lotes.', 'picking-connector'); ?></p>
    </div>
    
    <div class="picking-grid">
        <!-- API Key Card -->
        <div class="picking-card">
            <h3>
                <span class="dashicons dashicons-admin-network"></span>
                <?php esc_html_e('API Key', 'picking-connector'); ?>
            </h3>
            
            <div class="picking-api-key">
                <p><?php esc_html_e('Esta es tu clave API para conectar la aplicacion movil con tu tienda.', 'picking-connector'); ?></p>
                
                <div class="picking-api-key-display">
                    <code id="picking-api-key"><?php echo esc_html($api_key); ?></code>
                    <button type="button" class="button picking-copy-btn" data-target="picking-api-key">
                        <span class="dashicons dashicons-clipboard"></span>
                        <?php esc_html_e('Copiar', 'picking-connector'); ?>
                    </button>
                </div>
                
                <div class="picking-actions">
                    <button type="button" id="picking-generate-api-key" class="button button-secondary">
                        <span class="dashicons dashicons-update"></span>
                        <?php esc_html_e('Generar Nueva API Key', 'picking-connector'); ?>
                    </button>
                    
                    <button type="button" id="picking-test-connection" class="button">
                        <span class="dashicons dashicons-yes-alt"></span>
                        <?php esc_html_e('Probar Conexion', 'picking-connector'); ?>
                    </button>
                </div>
                
                <div id="picking-status" class="picking-status"></div>
            </div>
        </div>
        
        <!-- Stats Card -->
        <div class="picking-card">
            <h3>
                <span class="dashicons dashicons-chart-bar"></span>
                <?php esc_html_e('Estadisticas Rapidas', 'picking-connector'); ?>
            </h3>
            
            <?php
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
            
            <div class="picking-stats-grid">
                <div class="picking-stat">
                    <span class="picking-stat-number"><?php echo count($pending_orders); ?></span>
                    <span class="picking-stat-label"><?php esc_html_e('Pendientes', 'picking-connector'); ?></span>
                </div>
                
                <div class="picking-stat">
                    <span class="picking-stat-number"><?php echo count($picking_orders); ?></span>
                    <span class="picking-stat-label"><?php esc_html_e('En Proceso', 'picking-connector'); ?></span>
                </div>
                
                <div class="picking-stat">
                    <span class="picking-stat-number"><?php echo count($completed_today); ?></span>
                    <span class="picking-stat-label"><?php esc_html_e('Completados Hoy', 'picking-connector'); ?></span>
                </div>
            </div>
        </div>
    </div>
    
    <!-- Settings Form -->
    <div class="picking-card">
        <h3>
            <span class="dashicons dashicons-admin-settings"></span>
            <?php esc_html_e('Configuracion General', 'picking-connector'); ?>
        </h3>
        
        <form id="picking-settings-form" class="picking-settings-form">
            <div class="picking-grid">
                <div>
                    <div class="form-group">
                        <label for="app_url"><?php esc_html_e('URL de la App de Picking', 'picking-connector'); ?></label>
                        <input type="url" id="app_url" name="app_url" value="<?php echo esc_attr($app_url); ?>" placeholder="https://tu-picking-app.com">
                        <p class="description"><?php esc_html_e('URL donde esta instalada tu aplicacion de Picking.', 'picking-connector'); ?></p>
                    </div>
                    
                    <div class="form-group">
                        <label for="batch_size"><?php esc_html_e('Cantidad de pedidos a pickear a la vez', 'picking-connector'); ?></label>
                        <select id="batch_size" name="batch_size">
                            <option value="1" <?php selected($batch_size, '1'); ?>><?php esc_html_e('Picking individual (1 pedido)', 'picking-connector'); ?></option>
                            <?php for ($i = 2; $i <= 20; $i++) : ?>
                                <option value="<?php echo $i; ?>" <?php selected($batch_size, (string)$i); ?>><?php echo $i; ?> <?php esc_html_e('pedidos', 'picking-connector'); ?></option>
                            <?php endfor; ?>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label for="order_status"><?php esc_html_e('Estados de pedido para picking', 'picking-connector'); ?></label>
                        <select id="order_status" name="order_status[]" multiple>
                            <?php foreach ($all_statuses as $status_key => $status_label) : ?>
                                <option value="<?php echo esc_attr($status_key); ?>" <?php echo in_array($status_key, $order_status) ? 'selected' : ''; ?>>
                                    <?php echo esc_html($status_label); ?>
                                </option>
                            <?php endforeach; ?>
                        </select>
                        <p class="description"><?php esc_html_e('Selecciona los estados de pedido que apareceran en la app.', 'picking-connector'); ?></p>
                    </div>
                    
                    <div class="form-group">
                        <label for="completed_status"><?php esc_html_e('Estado al completar picking', 'picking-connector'); ?></label>
                        <select id="completed_status" name="completed_status">
                            <?php foreach ($all_statuses as $status_key => $status_label) : ?>
                                <option value="<?php echo esc_attr($status_key); ?>" <?php selected($completed_status, $status_key); ?>>
                                    <?php echo esc_html($status_label); ?>
                                </option>
                            <?php endforeach; ?>
                        </select>
                    </div>
                </div>
                
                <div>
                    <div class="form-group">
                        <label><?php esc_html_e('Opciones', 'picking-connector'); ?></label>
                        <div class="checkbox-group">
                            <label>
                                <input type="checkbox" name="auto_complete" value="1" <?php checked($auto_complete, '1'); ?>>
                                <?php esc_html_e('Auto-completar pedidos al finalizar picking', 'picking-connector'); ?>
                            </label>
                            <label>
                                <input type="checkbox" name="photo_required" value="1" <?php checked($photo_required, '1'); ?>>
                                <?php esc_html_e('Requerir foto antes de completar pedido', 'picking-connector'); ?>
                            </label>
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label><?php esc_html_e('Tipo de escaner', 'picking-connector'); ?></label>
                        <div class="picking-scanner-options">
                            <label class="picking-scanner-option <?php echo $scanner_type === 'camera' ? 'selected' : ''; ?>">
                                <input type="radio" name="scanner_type" value="camera" <?php checked($scanner_type, 'camera'); ?>>
                                <div class="picking-scanner-option-text">
                                    <strong><?php esc_html_e('Camara del telefono', 'picking-connector'); ?></strong>
                                    <span><?php esc_html_e('Usa la camara del dispositivo para escanear codigos', 'picking-connector'); ?></span>
                                </div>
                            </label>
                            <label class="picking-scanner-option <?php echo $scanner_type === 'bluetooth' ? 'selected' : ''; ?>">
                                <input type="radio" name="scanner_type" value="bluetooth" <?php checked($scanner_type, 'bluetooth'); ?>>
                                <div class="picking-scanner-option-text">
                                    <strong><?php esc_html_e('Escaner Bluetooth', 'picking-connector'); ?></strong>
                                    <span><?php esc_html_e('Usa un escaner Bluetooth externo', 'picking-connector'); ?></span>
                                </div>
                            </label>
                            <label class="picking-scanner-option <?php echo $scanner_type === 'pda' ? 'selected' : ''; ?>">
                                <input type="radio" name="scanner_type" value="pda" <?php checked($scanner_type, 'pda'); ?>>
                                <div class="picking-scanner-option-text">
                                    <strong><?php esc_html_e('PDA / Terminal', 'picking-connector'); ?></strong>
                                    <span><?php esc_html_e('Usa un dispositivo PDA con escaner integrado', 'picking-connector'); ?></span>
                                </div>
                            </label>
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label for="logo_url"><?php esc_html_e('URL del Logo', 'picking-connector'); ?></label>
                        <input type="url" id="logo_url" name="logo_url" value="<?php echo esc_attr($logo_url); ?>" placeholder="https://tu-tienda.com/logo.png">
                        <p class="description"><?php esc_html_e('Logo que se mostrara en la aplicacion movil.', 'picking-connector'); ?></p>
                    </div>
                </div>
            </div>
            
            <div class="picking-actions">
                <button type="submit" class="button button-primary">
                    <span class="dashicons dashicons-saved"></span>
                    <?php esc_html_e('Guardar Configuracion', 'picking-connector'); ?>
                </button>
                
                <button type="button" id="picking-reset-orders" class="button button-secondary">
                    <span class="dashicons dashicons-image-rotate"></span>
                    <?php esc_html_e('Reiniciar Datos de Picking', 'picking-connector'); ?>
                </button>
            </div>
        </form>
    </div>
    
    <!-- Feature Toggles Card -->
    <div class="picking-card">
        <h3>
            <span class="dashicons dashicons-admin-plugins"></span>
            <?php esc_html_e('Control de Funciones Web', 'picking-connector'); ?>
        </h3>
        <p class="description"><?php esc_html_e('Controla que funciones estan disponibles en la aplicacion web de picking.', 'picking-connector'); ?></p>
        
        <form id="picking-features-form" class="picking-settings-form">
            <div class="picking-grid">
                <div>
                    <div class="form-group">
                        <label><?php esc_html_e('Funciones de Gestion', 'picking-connector'); ?></label>
                        <div class="checkbox-group">
                            <label>
                                <input type="checkbox" name="enable_order_editing" value="1" <?php checked(get_option('picking_enable_order_editing', '1'), '1'); ?>>
                                <?php esc_html_e('Permitir edicion de pedidos desde la web', 'picking-connector'); ?>
                            </label>
                            <label>
                                <input type="checkbox" name="enable_order_management" value="1" <?php checked(get_option('picking_enable_order_management', '1'), '1'); ?>>
                                <?php esc_html_e('Permitir gestion completa de pedidos', 'picking-connector'); ?>
                            </label>
                            <label>
                                <input type="checkbox" name="enable_manual_products" value="1" <?php checked(get_option('picking_enable_manual_products', '1'), '1'); ?>>
                                <?php esc_html_e('Permitir agregar productos manualmente', 'picking-connector'); ?>
                            </label>
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label><?php esc_html_e('Funciones de Visualizacion', 'picking-connector'); ?></label>
                        <div class="checkbox-group">
                            <label>
                                <input type="checkbox" name="enable_photo_viewing" value="1" <?php checked(get_option('picking_enable_photo_viewing', '1'), '1'); ?>>
                                <?php esc_html_e('Permitir ver fotos de picking', 'picking-connector'); ?>
                            </label>
                            <label>
                                <input type="checkbox" name="enable_history_viewing" value="1" <?php checked(get_option('picking_enable_history_viewing', '1'), '1'); ?>>
                                <?php esc_html_e('Permitir ver historial de pedidos', 'picking-connector'); ?>
                            </label>
                            <label>
                                <input type="checkbox" name="enable_audit_viewing" value="1" <?php checked(get_option('picking_enable_audit_viewing', '1'), '1'); ?>>
                                <?php esc_html_e('Permitir ver auditoria completa', 'picking-connector'); ?>
                            </label>
                        </div>
                    </div>
                </div>
                
                <div>
                    <div class="form-group">
                        <label><?php esc_html_e('Funciones de Administracion', 'picking-connector'); ?></label>
                        <div class="checkbox-group">
                            <label>
                                <input type="checkbox" name="enable_user_management" value="1" <?php checked(get_option('picking_enable_user_management', '1'), '1'); ?>>
                                <?php esc_html_e('Permitir gestion de usuarios', 'picking-connector'); ?>
                            </label>
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label><?php esc_html_e('Informacion', 'picking-connector'); ?></label>
                        <p class="description" style="background: #f0f0f1; padding: 10px; border-radius: 4px;">
                            <?php esc_html_e('Las funciones deshabilitadas aqui no estaran disponibles en la aplicacion web. Esto permite controlar que pueden hacer los pickers desde el panel central del plugin.', 'picking-connector'); ?>
                        </p>
                    </div>
                </div>
            </div>
            
            <div class="picking-actions">
                <button type="submit" class="button button-primary">
                    <span class="dashicons dashicons-saved"></span>
                    <?php esc_html_e('Guardar Funciones', 'picking-connector'); ?>
                </button>
            </div>
        </form>
    </div>
</div>

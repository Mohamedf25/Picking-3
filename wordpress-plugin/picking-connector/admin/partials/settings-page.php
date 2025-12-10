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
                            <label>
                                <input type="checkbox" name="enable_restart_picking" value="1" <?php checked(get_option('picking_enable_restart_picking', '0'), '1'); ?>>
                                <?php esc_html_e('Permitir reiniciar picking de pedidos', 'picking-connector'); ?>
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
    
    <!-- Role Permissions Card -->
    <div class="picking-card">
        <h3>
            <span class="dashicons dashicons-groups"></span>
            <?php esc_html_e('Permisos por Rol', 'picking-connector'); ?>
        </h3>
        <p class="description"><?php esc_html_e('Configura que puede hacer cada rol de usuario en la aplicacion web.', 'picking-connector'); ?></p>
        
        <?php
        $role_permissions = get_option('picking_role_permissions', array());
        $default_permissions = array(
            'admin' => array(
                'can_view_orders' => true,
                'can_edit_picking' => true,
                'can_view_audit' => true,
                'can_view_photos' => true,
                'can_restart_picking' => true,
                'can_manage_settings' => true,
            ),
            'supervisor' => array(
                'can_view_orders' => true,
                'can_edit_picking' => true,
                'can_view_audit' => true,
                'can_view_photos' => true,
                'can_restart_picking' => true,
                'can_manage_settings' => false,
            ),
            'picker' => array(
                'can_view_orders' => true,
                'can_edit_picking' => true,
                'can_view_audit' => false,
                'can_view_photos' => false,
                'can_restart_picking' => false,
                'can_manage_settings' => false,
            ),
        );
        $role_permissions = wp_parse_args($role_permissions, $default_permissions);
        ?>
        
        <form id="picking-permissions-form" class="picking-settings-form">
            <table class="widefat" style="margin-bottom: 20px;">
                <thead>
                    <tr>
                        <th><?php esc_html_e('Permiso', 'picking-connector'); ?></th>
                        <th style="text-align: center;"><?php esc_html_e('Admin', 'picking-connector'); ?></th>
                        <th style="text-align: center;"><?php esc_html_e('Supervisor', 'picking-connector'); ?></th>
                        <th style="text-align: center;"><?php esc_html_e('Picker', 'picking-connector'); ?></th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td><?php esc_html_e('Ver pedidos', 'picking-connector'); ?></td>
                        <td style="text-align: center;"><input type="checkbox" name="perm_admin_can_view_orders" value="1" <?php checked(!empty($role_permissions['admin']['can_view_orders'])); ?>></td>
                        <td style="text-align: center;"><input type="checkbox" name="perm_supervisor_can_view_orders" value="1" <?php checked(!empty($role_permissions['supervisor']['can_view_orders'])); ?>></td>
                        <td style="text-align: center;"><input type="checkbox" name="perm_picker_can_view_orders" value="1" <?php checked(!empty($role_permissions['picker']['can_view_orders'])); ?>></td>
                    </tr>
                    <tr>
                        <td><?php esc_html_e('Editar picking', 'picking-connector'); ?></td>
                        <td style="text-align: center;"><input type="checkbox" name="perm_admin_can_edit_picking" value="1" <?php checked(!empty($role_permissions['admin']['can_edit_picking'])); ?>></td>
                        <td style="text-align: center;"><input type="checkbox" name="perm_supervisor_can_edit_picking" value="1" <?php checked(!empty($role_permissions['supervisor']['can_edit_picking'])); ?>></td>
                        <td style="text-align: center;"><input type="checkbox" name="perm_picker_can_edit_picking" value="1" <?php checked(!empty($role_permissions['picker']['can_edit_picking'])); ?>></td>
                    </tr>
                    <tr>
                        <td><?php esc_html_e('Ver auditoria', 'picking-connector'); ?></td>
                        <td style="text-align: center;"><input type="checkbox" name="perm_admin_can_view_audit" value="1" <?php checked(!empty($role_permissions['admin']['can_view_audit'])); ?>></td>
                        <td style="text-align: center;"><input type="checkbox" name="perm_supervisor_can_view_audit" value="1" <?php checked(!empty($role_permissions['supervisor']['can_view_audit'])); ?>></td>
                        <td style="text-align: center;"><input type="checkbox" name="perm_picker_can_view_audit" value="1" <?php checked(!empty($role_permissions['picker']['can_view_audit'])); ?>></td>
                    </tr>
                    <tr>
                        <td><?php esc_html_e('Ver fotos', 'picking-connector'); ?></td>
                        <td style="text-align: center;"><input type="checkbox" name="perm_admin_can_view_photos" value="1" <?php checked(!empty($role_permissions['admin']['can_view_photos'])); ?>></td>
                        <td style="text-align: center;"><input type="checkbox" name="perm_supervisor_can_view_photos" value="1" <?php checked(!empty($role_permissions['supervisor']['can_view_photos'])); ?>></td>
                        <td style="text-align: center;"><input type="checkbox" name="perm_picker_can_view_photos" value="1" <?php checked(!empty($role_permissions['picker']['can_view_photos'])); ?>></td>
                    </tr>
                    <tr>
                        <td><?php esc_html_e('Reiniciar picking', 'picking-connector'); ?></td>
                        <td style="text-align: center;"><input type="checkbox" name="perm_admin_can_restart_picking" value="1" <?php checked(!empty($role_permissions['admin']['can_restart_picking'])); ?>></td>
                        <td style="text-align: center;"><input type="checkbox" name="perm_supervisor_can_restart_picking" value="1" <?php checked(!empty($role_permissions['supervisor']['can_restart_picking'])); ?>></td>
                        <td style="text-align: center;"><input type="checkbox" name="perm_picker_can_restart_picking" value="1" <?php checked(!empty($role_permissions['picker']['can_restart_picking'])); ?>></td>
                    </tr>
                    <tr>
                        <td><?php esc_html_e('Gestionar configuracion', 'picking-connector'); ?></td>
                        <td style="text-align: center;"><input type="checkbox" name="perm_admin_can_manage_settings" value="1" <?php checked(!empty($role_permissions['admin']['can_manage_settings'])); ?>></td>
                        <td style="text-align: center;"><input type="checkbox" name="perm_supervisor_can_manage_settings" value="1" <?php checked(!empty($role_permissions['supervisor']['can_manage_settings'])); ?>></td>
                        <td style="text-align: center;"><input type="checkbox" name="perm_picker_can_manage_settings" value="1" <?php checked(!empty($role_permissions['picker']['can_manage_settings'])); ?>></td>
                    </tr>
                </tbody>
            </table>
            
            <div class="picking-actions">
                <button type="submit" class="button button-primary">
                    <span class="dashicons dashicons-saved"></span>
                    <?php esc_html_e('Guardar Permisos', 'picking-connector'); ?>
                </button>
            </div>
        </form>
    </div>
    
    <!-- Image Retention Card -->
    <div class="picking-card">
        <h3>
            <span class="dashicons dashicons-images-alt2"></span>
            <?php esc_html_e('Retencion de Imagenes', 'picking-connector'); ?>
        </h3>
        <p class="description"><?php esc_html_e('Configura el borrado automatico de imagenes de evidencia antiguas.', 'picking-connector'); ?></p>
        
        <form id="picking-retention-form" class="picking-settings-form">
            <div class="form-group">
                <label for="photo_retention_days"><?php esc_html_e('Dias de retencion de fotos', 'picking-connector'); ?></label>
                <input type="number" id="photo_retention_days" name="photo_retention_days" value="<?php echo esc_attr(get_option('picking_photo_retention_days', '0')); ?>" min="0" max="365" style="width: 100px;">
                <p class="description"><?php esc_html_e('Las fotos mas antiguas que este numero de dias seran eliminadas automaticamente. Ingresa 0 para desactivar el borrado automatico.', 'picking-connector'); ?></p>
            </div>
            
            <div class="form-group">
                <label><?php esc_html_e('Estado actual', 'picking-connector'); ?></label>
                <?php
                $upload_dir = wp_upload_dir();
                $picking_photos_dir = $upload_dir['basedir'] . '/picking-connector/photos';
                $total_size = 0;
                $total_files = 0;
                if (is_dir($picking_photos_dir)) {
                    $iterator = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($picking_photos_dir));
                    foreach ($iterator as $file) {
                        if ($file->isFile()) {
                            $total_size += $file->getSize();
                            $total_files++;
                        }
                    }
                }
                $size_mb = round($total_size / 1024 / 1024, 2);
                ?>
                <p class="description" style="background: #f0f0f1; padding: 10px; border-radius: 4px;">
                    <?php printf(esc_html__('Total de fotos: %d archivos (%s MB)', 'picking-connector'), $total_files, $size_mb); ?>
                </p>
            </div>
            
            <div class="picking-actions">
                <button type="submit" class="button button-primary">
                    <span class="dashicons dashicons-saved"></span>
                    <?php esc_html_e('Guardar Configuracion', 'picking-connector'); ?>
                </button>
                <button type="button" id="picking-cleanup-photos" class="button button-secondary">
                    <span class="dashicons dashicons-trash"></span>
                    <?php esc_html_e('Ejecutar Limpieza Ahora', 'picking-connector'); ?>
                </button>
            </div>
        </form>
        
        <hr style="margin: 20px 0; border-top: 1px solid #ddd;">
        
        <div class="form-group">
            <label><?php esc_html_e('Eliminar TODAS las fotos', 'picking-connector'); ?></label>
            <p class="description" style="background: #ffebee; padding: 10px; border-radius: 4px; border-left: 4px solid #f44336; margin-bottom: 10px;">
                <?php esc_html_e('ADVERTENCIA: Esta accion eliminara TODAS las fotos de evidencia del servidor de forma permanente. Esta accion no se puede deshacer.', 'picking-connector'); ?>
            </p>
            <button type="button" id="picking-delete-all-photos" class="button button-secondary" style="background: #f44336; color: white; border-color: #d32f2f;">
                <span class="dashicons dashicons-warning"></span>
                <?php esc_html_e('Borrar TODAS las imagenes ahora', 'picking-connector'); ?>
            </button>
        </div>
    </div>
    
    <!-- Order Status Configuration Card -->
    <div class="picking-card">
        <h3>
            <span class="dashicons dashicons-flag"></span>
            <?php esc_html_e('Configuracion de Estados', 'picking-connector'); ?>
        </h3>
        <p class="description"><?php esc_html_e('Configura como cambian los estados de los pedidos durante el proceso de picking.', 'picking-connector'); ?></p>
        
        <form id="picking-status-config-form" class="picking-settings-form">
            <div class="picking-grid">
                <div>
                    <div class="form-group">
                        <label for="picking_started_status"><?php esc_html_e('Estado al iniciar picking', 'picking-connector'); ?></label>
                        <select id="picking_started_status" name="picking_started_status">
                            <option value=""><?php esc_html_e('-- No cambiar estado --', 'picking-connector'); ?></option>
                            <?php foreach ($all_statuses as $status_key => $status_label) : ?>
                                <option value="<?php echo esc_attr($status_key); ?>" <?php selected(get_option('picking_started_status', ''), $status_key); ?>>
                                    <?php echo esc_html($status_label); ?>
                                </option>
                            <?php endforeach; ?>
                        </select>
                        <p class="description"><?php esc_html_e('Estado de WooCommerce al que cambiara el pedido cuando un picker inicie el picking.', 'picking-connector'); ?></p>
                    </div>
                </div>
                <div>
                    <div class="form-group">
                        <label><?php esc_html_e('Nota', 'picking-connector'); ?></label>
                        <p class="description" style="background: #fff3cd; padding: 10px; border-radius: 4px; border-left: 4px solid #ffc107;">
                            <?php esc_html_e('El estado "al completar picking" ya esta configurado arriba en la seccion de Configuracion General.', 'picking-connector'); ?>
                        </p>
                    </div>
                </div>
            </div>
            
            <div class="picking-actions">
                <button type="submit" class="button button-primary">
                    <span class="dashicons dashicons-saved"></span>
                    <?php esc_html_e('Guardar Estados', 'picking-connector'); ?>
                </button>
            </div>
        </form>
    </div>
</div>

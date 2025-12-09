<?php
/**
 * Users Page Template - Enhanced with Role Management
 */

if (!defined('ABSPATH')) {
    exit;
}

// Get registered users from options (with defensive check)
$picking_users = get_option('picking_registered_users', array());
if (!is_array($picking_users)) {
    $picking_users = array();
}

// Define user roles
$user_roles = array(
    'admin' => array(
        'label' => __('Administrador', 'picking-connector'),
        'description' => __('Acceso completo: gestionar usuarios, ver estadisticas, procesar pedidos', 'picking-connector'),
        'color' => '#dc3545'
    ),
    'supervisor' => array(
        'label' => __('Supervisor', 'picking-connector'),
        'description' => __('Ver estadisticas y todos los pedidos, pero no gestionar usuarios', 'picking-connector'),
        'color' => '#fd7e14'
    ),
    'picker' => array(
        'label' => __('Picker', 'picking-connector'),
        'description' => __('Solo procesar pedidos asignados', 'picking-connector'),
        'color' => '#28a745'
    )
);
?>

<div class="wrap picking-wrap">
    <h1>
        <span class="dashicons dashicons-groups"></span>
        <?php esc_html_e('Gestion de Usuarios', 'picking-connector'); ?>
    </h1>
    
    <!-- Add New User Section -->
    <div class="picking-card">
        <h3>
            <span class="dashicons dashicons-plus-alt"></span>
            <?php esc_html_e('Agregar Nuevo Usuario', 'picking-connector'); ?>
        </h3>
        
        <form id="picking-add-user-form" class="picking-user-form">
            <div class="picking-form-row">
                <div class="picking-form-group">
                    <label for="new_user_name"><?php esc_html_e('Nombre de Usuario', 'picking-connector'); ?></label>
                    <input type="text" id="new_user_name" name="user_name" required placeholder="<?php esc_attr_e('Ej: Juan', 'picking-connector'); ?>">
                </div>
                
                <div class="picking-form-group">
                    <label for="new_user_pin"><?php esc_html_e('PIN (4 digitos)', 'picking-connector'); ?></label>
                    <input type="password" id="new_user_pin" name="user_pin" required pattern="[0-9]{4}" maxlength="4" placeholder="****">
                </div>
                
                <div class="picking-form-group">
                    <label for="new_user_role"><?php esc_html_e('Nivel de Usuario', 'picking-connector'); ?></label>
                    <select id="new_user_role" name="user_role" required>
                        <?php foreach ($user_roles as $role_key => $role_data) : ?>
                            <option value="<?php echo esc_attr($role_key); ?>" <?php selected($role_key, 'picker'); ?>>
                                <?php echo esc_html($role_data['label']); ?>
                            </option>
                        <?php endforeach; ?>
                    </select>
                </div>
                
                <div class="picking-form-group picking-form-button">
                    <button type="submit" class="button button-primary">
                        <span class="dashicons dashicons-plus"></span>
                        <?php esc_html_e('Agregar Usuario', 'picking-connector'); ?>
                    </button>
                </div>
            </div>
        </form>
        
        <div id="picking-user-message" class="picking-message" style="display: none;"></div>
    </div>
    
    <!-- User Roles Info -->
    <div class="picking-card">
        <h3>
            <span class="dashicons dashicons-shield"></span>
            <?php esc_html_e('Niveles de Usuario', 'picking-connector'); ?>
        </h3>
        
        <div class="picking-roles-grid">
            <?php foreach ($user_roles as $role_key => $role_data) : ?>
                <div class="picking-role-card" style="border-left: 4px solid <?php echo esc_attr($role_data['color']); ?>;">
                    <h4><?php echo esc_html($role_data['label']); ?></h4>
                    <p><?php echo esc_html($role_data['description']); ?></p>
                </div>
            <?php endforeach; ?>
        </div>
    </div>
    
    <!-- Registered Users List -->
    <div class="picking-card">
        <h3>
            <span class="dashicons dashicons-admin-users"></span>
            <?php esc_html_e('Usuarios Registrados', 'picking-connector'); ?>
        </h3>
        
        <?php if (!empty($picking_users)) : ?>
            <table class="picking-users-table" id="picking-users-table">
                <thead>
                    <tr>
                        <th><?php esc_html_e('Usuario', 'picking-connector'); ?></th>
                        <th><?php esc_html_e('Nivel', 'picking-connector'); ?></th>
                        <th><?php esc_html_e('Estado', 'picking-connector'); ?></th>
                        <th><?php esc_html_e('Pedidos Completados', 'picking-connector'); ?></th>
                        <th><?php esc_html_e('Ultima Actividad', 'picking-connector'); ?></th>
                        <th><?php esc_html_e('Acciones', 'picking-connector'); ?></th>
                    </tr>
                </thead>
                <tbody>
                    <?php foreach ($picking_users as $user_id => $user) : 
                        $role_info = isset($user_roles[$user['role']]) ? $user_roles[$user['role']] : $user_roles['picker'];
                    ?>
                        <tr data-user-id="<?php echo esc_attr($user_id); ?>">
                            <td>
                                <div style="display: flex; align-items: center; gap: 10px;">
                                    <div class="picking-user-avatar" style="background-color: <?php echo esc_attr($role_info['color']); ?>;">
                                        <?php echo esc_html(strtoupper(substr($user['name'], 0, 1))); ?>
                                    </div>
                                    <strong><?php echo esc_html(ucfirst($user['name'])); ?></strong>
                                </div>
                            </td>
                            <td>
                                <span class="picking-role-badge" style="background-color: <?php echo esc_attr($role_info['color']); ?>;">
                                    <?php echo esc_html($role_info['label']); ?>
                                </span>
                            </td>
                            <td>
                                <?php if (!empty($user['active'])) : ?>
                                    <span class="picking-status picking-status-completed"><?php esc_html_e('Activo', 'picking-connector'); ?></span>
                                <?php else : ?>
                                    <span class="picking-status picking-status-pending"><?php esc_html_e('Inactivo', 'picking-connector'); ?></span>
                                <?php endif; ?>
                            </td>
                            <td>
                                <span class="picking-stat-number"><?php echo esc_html($user['orders_completed'] ?? 0); ?></span>
                            </td>
                            <td>
                                <?php if (!empty($user['last_activity'])) : ?>
                                    <?php echo esc_html(date_i18n(get_option('date_format') . ' ' . get_option('time_format'), strtotime($user['last_activity']))); ?>
                                <?php else : ?>
                                    <span style="color: #999;">-</span>
                                <?php endif; ?>
                            </td>
                            <td>
                                <button type="button" class="button button-small picking-edit-user" data-user-id="<?php echo esc_attr($user_id); ?>">
                                    <span class="dashicons dashicons-edit"></span>
                                </button>
                                <button type="button" class="button button-small picking-toggle-user" data-user-id="<?php echo esc_attr($user_id); ?>" data-active="<?php echo esc_attr($user['active'] ? '1' : '0'); ?>">
                                    <span class="dashicons dashicons-<?php echo $user['active'] ? 'hidden' : 'visibility'; ?>"></span>
                                </button>
                                <button type="button" class="button button-small button-link-delete picking-delete-user" data-user-id="<?php echo esc_attr($user_id); ?>">
                                    <span class="dashicons dashicons-trash"></span>
                                </button>
                            </td>
                        </tr>
                    <?php endforeach; ?>
                </tbody>
            </table>
        <?php else : ?>
            <div class="picking-no-credentials">
                <span class="dashicons dashicons-admin-users" style="font-size: 48px; width: 48px; height: 48px; color: #ccc;"></span>
                <p><?php esc_html_e('No hay usuarios registrados. Agrega el primer usuario usando el formulario de arriba.', 'picking-connector'); ?></p>
            </div>
        <?php endif; ?>
    </div>
    
    <!-- Active Pickers (from orders) -->
    <div class="picking-card">
        <h3>
            <span class="dashicons dashicons-chart-bar"></span>
            <?php esc_html_e('Actividad de Picking', 'picking-connector'); ?>
        </h3>
        
        <?php
        $order_status = get_option('picking_order_status', array('wc-processing'));
        if (!is_array($order_status)) {
            $order_status = array($order_status);
        }
        
        // Get orders with pickers
        $orders_with_pickers = wc_get_orders(array(
            'status' => $order_status,
            'limit' => 100,
            'meta_query' => array(
                array(
                    'key' => 'user_claimed',
                    'compare' => 'EXISTS',
                ),
            ),
        ));
        
        $activity = array();
        foreach ($orders_with_pickers as $order) {
            $picker = $order->get_meta('user_claimed');
            if (!empty($picker)) {
                if (!isset($activity[$picker])) {
                    $activity[$picker] = array(
                        'name' => $picker,
                        'in_progress' => 0,
                        'completed' => 0,
                    );
                }
                
                $picking_status = $order->get_meta('picking_status');
                if ($picking_status === 'completed') {
                    $activity[$picker]['completed']++;
                } else {
                    $activity[$picker]['in_progress']++;
                }
            }
        }
        ?>
        
        <?php if (!empty($activity)) : ?>
            <table class="picking-users-table">
                <thead>
                    <tr>
                        <th><?php esc_html_e('Picker', 'picking-connector'); ?></th>
                        <th><?php esc_html_e('En Proceso', 'picking-connector'); ?></th>
                        <th><?php esc_html_e('Completados', 'picking-connector'); ?></th>
                    </tr>
                </thead>
                <tbody>
                    <?php foreach ($activity as $picker) : ?>
                        <tr>
                            <td><strong><?php echo esc_html(ucfirst($picker['name'])); ?></strong></td>
                            <td>
                                <?php if ($picker['in_progress'] > 0) : ?>
                                    <span class="picking-status picking-status-picking"><?php echo esc_html($picker['in_progress']); ?></span>
                                <?php else : ?>
                                    <span style="color: #999;">0</span>
                                <?php endif; ?>
                            </td>
                            <td>
                                <span class="picking-status picking-status-completed"><?php echo esc_html($picker['completed']); ?></span>
                            </td>
                        </tr>
                    <?php endforeach; ?>
                </tbody>
            </table>
        <?php else : ?>
            <p style="color: #666;"><?php esc_html_e('No hay actividad de picking reciente.', 'picking-connector'); ?></p>
        <?php endif; ?>
    </div>
</div>

<!-- Edit User Modal -->
<div id="picking-edit-user-modal" class="picking-modal" style="display: none;">
    <div class="picking-modal-content">
        <span class="picking-modal-close">&times;</span>
        <h3><?php esc_html_e('Editar Usuario', 'picking-connector'); ?></h3>
        
        <form id="picking-edit-user-form">
            <input type="hidden" id="edit_user_id" name="user_id">
            
            <div class="picking-form-group">
                <label for="edit_user_name"><?php esc_html_e('Nombre de Usuario', 'picking-connector'); ?></label>
                <input type="text" id="edit_user_name" name="user_name" required>
            </div>
            
            <div class="picking-form-group">
                <label for="edit_user_pin"><?php esc_html_e('Nuevo PIN (dejar vacio para mantener)', 'picking-connector'); ?></label>
                <input type="password" id="edit_user_pin" name="user_pin" pattern="[0-9]{4}" maxlength="4" placeholder="****">
            </div>
            
            <div class="picking-form-group">
                <label for="edit_user_role"><?php esc_html_e('Nivel de Usuario', 'picking-connector'); ?></label>
                <select id="edit_user_role" name="user_role" required>
                    <?php foreach ($user_roles as $role_key => $role_data) : ?>
                        <option value="<?php echo esc_attr($role_key); ?>">
                            <?php echo esc_html($role_data['label']); ?>
                        </option>
                    <?php endforeach; ?>
                </select>
            </div>
            
            <div class="picking-form-actions">
                <button type="button" class="button picking-modal-cancel"><?php esc_html_e('Cancelar', 'picking-connector'); ?></button>
                <button type="submit" class="button button-primary"><?php esc_html_e('Guardar Cambios', 'picking-connector'); ?></button>
            </div>
        </form>
    </div>
</div>

<?php
/**
 * Users Page Template
 */

if (!defined('ABSPATH')) {
    exit;
}
?>

<div class="wrap picking-wrap">
    <h1>
        <span class="dashicons dashicons-groups"></span>
        <?php esc_html_e('Usuarios de Picking', 'picking-connector'); ?>
    </h1>
    
    <div class="picking-card">
        <h3>
            <span class="dashicons dashicons-admin-users"></span>
            <?php esc_html_e('Pickers Activos', 'picking-connector'); ?>
        </h3>
        
        <p><?php esc_html_e('Los usuarios de picking se crean automaticamente cuando se conectan desde la aplicacion movil. Aqui puedes ver la actividad de cada picker.', 'picking-connector'); ?></p>
        
        <?php
        $order_status = get_option('picking_order_status', array('wc-processing'));
        if (!is_array($order_status)) {
            $order_status = array($order_status);
        }
        
        $orders_with_pickers = wc_get_orders(array(
            'status' => $order_status,
            'limit' => -1,
            'meta_query' => array(
                array(
                    'key' => 'user_claimed',
                    'compare' => 'EXISTS',
                ),
            ),
        ));
        
        $pickers = array();
        foreach ($orders_with_pickers as $order) {
            $picker = $order->get_meta('user_claimed');
            if (!empty($picker)) {
                if (!isset($pickers[$picker])) {
                    $pickers[$picker] = array(
                        'name' => $picker,
                        'orders_in_progress' => 0,
                        'orders_completed' => 0,
                        'last_activity' => null,
                    );
                }
                
                $picking_status = $order->get_meta('picking_status');
                if ($picking_status === 'completed') {
                    $pickers[$picker]['orders_completed']++;
                } else {
                    $pickers[$picker]['orders_in_progress']++;
                }
                
                $started_at = $order->get_meta('picking_started_at');
                if ($started_at && (!$pickers[$picker]['last_activity'] || $started_at > $pickers[$picker]['last_activity'])) {
                    $pickers[$picker]['last_activity'] = $started_at;
                }
            }
        }
        
        $completed_orders = wc_get_orders(array(
            'status' => 'completed',
            'limit' => -1,
            'meta_query' => array(
                array(
                    'key' => 'user_claimed',
                    'compare' => 'EXISTS',
                ),
            ),
        ));
        
        foreach ($completed_orders as $order) {
            $picker = $order->get_meta('user_claimed');
            if (!empty($picker)) {
                if (!isset($pickers[$picker])) {
                    $pickers[$picker] = array(
                        'name' => $picker,
                        'orders_in_progress' => 0,
                        'orders_completed' => 0,
                        'last_activity' => null,
                    );
                }
                $pickers[$picker]['orders_completed']++;
                
                $completed_at = $order->get_meta('picking_completed_at');
                if ($completed_at && (!$pickers[$picker]['last_activity'] || $completed_at > $pickers[$picker]['last_activity'])) {
                    $pickers[$picker]['last_activity'] = $completed_at;
                }
            }
        }
        ?>
        
        <?php if (!empty($pickers)) : ?>
            <table class="picking-users-table">
                <thead>
                    <tr>
                        <th><?php esc_html_e('Picker', 'picking-connector'); ?></th>
                        <th><?php esc_html_e('En Proceso', 'picking-connector'); ?></th>
                        <th><?php esc_html_e('Completados', 'picking-connector'); ?></th>
                        <th><?php esc_html_e('Ultima Actividad', 'picking-connector'); ?></th>
                    </tr>
                </thead>
                <tbody>
                    <?php foreach ($pickers as $picker) : ?>
                        <tr>
                            <td>
                                <div style="display: flex; align-items: center; gap: 10px;">
                                    <div class="picking-user-avatar">
                                        <?php echo esc_html(strtoupper(substr($picker['name'], 0, 1))); ?>
                                    </div>
                                    <strong><?php echo esc_html(ucfirst($picker['name'])); ?></strong>
                                </div>
                            </td>
                            <td>
                                <?php if ($picker['orders_in_progress'] > 0) : ?>
                                    <span class="picking-status picking-status-picking"><?php echo esc_html($picker['orders_in_progress']); ?></span>
                                <?php else : ?>
                                    <span style="color: #999;">0</span>
                                <?php endif; ?>
                            </td>
                            <td>
                                <span class="picking-status picking-status-completed"><?php echo esc_html($picker['orders_completed']); ?></span>
                            </td>
                            <td>
                                <?php if ($picker['last_activity']) : ?>
                                    <?php echo esc_html(date_i18n(get_option('date_format') . ' ' . get_option('time_format'), strtotime($picker['last_activity']))); ?>
                                <?php else : ?>
                                    <span style="color: #999;">-</span>
                                <?php endif; ?>
                            </td>
                        </tr>
                    <?php endforeach; ?>
                </tbody>
            </table>
        <?php else : ?>
            <div class="picking-no-credentials">
                <p><?php esc_html_e('No hay pickers activos todavia. Los usuarios apareceran aqui cuando comiencen a usar la aplicacion.', 'picking-connector'); ?></p>
            </div>
        <?php endif; ?>
    </div>
    
    <div class="picking-card">
        <h3>
            <span class="dashicons dashicons-info"></span>
            <?php esc_html_e('Informacion', 'picking-connector'); ?>
        </h3>
        
        <p><?php esc_html_e('Los pickers pueden identificarse con cualquier nombre al iniciar sesion en la aplicacion movil. No es necesario crear cuentas de WordPress para ellos.', 'picking-connector'); ?></p>
        
        <p><?php esc_html_e('Cada picker puede reclamar pedidos para evitar que otros trabajen en el mismo pedido simultaneamente.', 'picking-connector'); ?></p>
    </div>
</div>

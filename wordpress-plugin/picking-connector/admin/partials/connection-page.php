<?php
/**
 * Connection Page Template
 */

if (!defined('ABSPATH')) {
    exit;
}
?>

<div class="wrap picking-wrap">
    <h1>
        <span class="dashicons dashicons-smartphone"></span>
        <?php esc_html_e('Conectar con la App', 'picking-connector'); ?>
    </h1>
    
    <div class="picking-connection-page">
        <div class="picking-card picking-qr-card">
            <h3><?php esc_html_e('Escanea el Codigo QR', 'picking-connector'); ?></h3>
            <p><?php esc_html_e('Abre la aplicacion de Picking en tu dispositivo movil y escanea este codigo QR para conectar automaticamente.', 'picking-connector'); ?></p>
            
            <?php if (!empty($api_key)) : ?>
                <div class="picking-qr-container">
                    <canvas id="qr-code"></canvas>
                </div>
                
                <div class="picking-manual-connection">
                    <h4><?php esc_html_e('O conecta manualmente:', 'picking-connector'); ?></h4>
                    
                    <div class="picking-credential-item">
                        <label><?php esc_html_e('API Key:', 'picking-connector'); ?></label>
                        <code id="manual-api-key"><?php echo esc_html($api_key); ?></code>
                        <button type="button" class="button button-small picking-copy-btn" data-target="manual-api-key">
                            <span class="dashicons dashicons-clipboard"></span>
                        </button>
                    </div>
                    
                    <div class="picking-credential-item">
                        <label><?php esc_html_e('URL de la Tienda:', 'picking-connector'); ?></label>
                        <code id="manual-store-url"><?php echo esc_url(get_site_url()); ?></code>
                        <button type="button" class="button button-small picking-copy-btn" data-target="manual-store-url">
                            <span class="dashicons dashicons-clipboard"></span>
                        </button>
                    </div>
                    
                    <div class="picking-credential-item">
                        <label><?php esc_html_e('API REST URL:', 'picking-connector'); ?></label>
                        <code id="manual-rest-url"><?php echo esc_url(get_rest_url(null, 'picking/v1')); ?></code>
                        <button type="button" class="button button-small picking-copy-btn" data-target="manual-rest-url">
                            <span class="dashicons dashicons-clipboard"></span>
                        </button>
                    </div>
                    
                    <div class="picking-connection-code" style="margin-top: 15px;">
                        <label><?php esc_html_e('Codigo de Conexion:', 'picking-connector'); ?></label>
                        <code id="connection-code" style="font-size: 10px; max-height: 60px; overflow-y: auto; display: block; margin-top: 5px;"><?php echo esc_html($connection_string); ?></code>
                        <button type="button" class="button button-small picking-copy-btn" data-target="connection-code" style="margin-top: 5px;">
                            <span class="dashicons dashicons-clipboard"></span>
                            <?php esc_html_e('Copiar Codigo', 'picking-connector'); ?>
                        </button>
                    </div>
                </div>
            <?php else : ?>
                <div class="picking-no-credentials">
                    <p><?php esc_html_e('Primero debes generar una API Key en la pagina de Configuracion.', 'picking-connector'); ?></p>
                    <a href="<?php echo esc_url(admin_url('admin.php?page=picking-connector')); ?>" class="button button-primary">
                        <?php esc_html_e('Ir a Configuracion', 'picking-connector'); ?>
                    </a>
                </div>
            <?php endif; ?>
        </div>
        
        <div class="picking-card">
            <h3><?php esc_html_e('Instrucciones', 'picking-connector'); ?></h3>
            <ol class="picking-instructions">
                <li><?php esc_html_e('Abre la aplicacion de Picking en tu dispositivo movil o tablet.', 'picking-connector'); ?></li>
                <li><?php esc_html_e('Selecciona "Conectar Tienda" o "Agregar Tienda".', 'picking-connector'); ?></li>
                <li><?php esc_html_e('Escanea el codigo QR mostrado arriba con la camara de tu dispositivo.', 'picking-connector'); ?></li>
                <li><?php esc_html_e('La aplicacion se conectara automaticamente con tu tienda WooCommerce.', 'picking-connector'); ?></li>
                <li><?php esc_html_e('Comienza a gestionar tus pedidos de forma rapida y eficiente.', 'picking-connector'); ?></li>
            </ol>
            
            <div class="picking-app-links">
                <h4><?php esc_html_e('Acceder a la App:', 'picking-connector'); ?></h4>
                <?php if (!empty($app_url)) : ?>
                    <a href="<?php echo esc_url($app_url); ?>" target="_blank" class="button button-primary">
                        <span class="dashicons dashicons-external"></span>
                        <?php esc_html_e('Abrir App Web', 'picking-connector'); ?>
                    </a>
                <?php else : ?>
                    <p class="description"><?php esc_html_e('Configura la URL de la app en la pagina de Configuracion para mostrar el enlace aqui.', 'picking-connector'); ?></p>
                <?php endif; ?>
            </div>
            
            <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #eee;">
                <h4><?php esc_html_e('Caracteristicas de la App:', 'picking-connector'); ?></h4>
                <ul style="list-style: disc; padding-left: 20px;">
                    <li><?php esc_html_e('Picking individual o por lotes', 'picking-connector'); ?></li>
                    <li><?php esc_html_e('Escaneo de codigos de barras con camara o escaner Bluetooth', 'picking-connector'); ?></li>
                    <li><?php esc_html_e('Fotos de evidencia para cada pedido', 'picking-connector'); ?></li>
                    <li><?php esc_html_e('Sincronizacion en tiempo real con WooCommerce', 'picking-connector'); ?></li>
                    <li><?php esc_html_e('Interfaz optimizada para dispositivos moviles y PDAs', 'picking-connector'); ?></li>
                    <li><?php esc_html_e('Gestion de backorders y excepciones', 'picking-connector'); ?></li>
                </ul>
            </div>
        </div>
    </div>
</div>

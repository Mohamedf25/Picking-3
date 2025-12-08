/**
 * Picking Connector Admin JavaScript
 */

(function($) {
    'use strict';

    var PickingAdmin = {
        init: function() {
            this.bindEvents();
            this.initTabs();
        },

        bindEvents: function() {
            $(document).on('click', '#picking-generate-api-key', this.generateApiKey);
            $(document).on('click', '#picking-test-connection', this.testConnection);
            $(document).on('click', '#picking-reset-orders', this.resetOrders);
            $(document).on('click', '.picking-copy-btn', this.copyToClipboard);
            $(document).on('submit', '#picking-settings-form', this.saveSettings);
            $(document).on('change', 'input[name="scanner_type"]', this.updateScannerSelection);
        },

        initTabs: function() {
            $('.picking-tab').on('click', function(e) {
                e.preventDefault();
                var target = $(this).data('tab');
                
                $('.picking-tab').removeClass('active');
                $(this).addClass('active');
                
                $('.picking-tab-content').removeClass('active');
                $('#' + target).addClass('active');
            });
        },

        generateApiKey: function(e) {
            e.preventDefault();
            
            var $button = $(this);
            var originalText = $button.html();
            
            $button.prop('disabled', true).html('<span class="dashicons dashicons-update spinning"></span> ' + pickingAdmin.strings.generating);
            
            $.ajax({
                url: pickingAdmin.ajaxUrl,
                type: 'POST',
                data: {
                    action: 'picking_generate_api_key',
                    nonce: pickingAdmin.nonce
                },
                success: function(response) {
                    if (response.success) {
                        $('#picking-api-key').text(response.data.api_key);
                        PickingAdmin.showStatus('success', response.data.message);
                        
                        // Update QR code if on connection page
                        if (typeof QRCode !== 'undefined' && $('#qr-code').length) {
                            PickingAdmin.updateQRCode(response.data.api_key);
                        }
                        
                        // Reload page to update all displays
                        setTimeout(function() {
                            location.reload();
                        }, 1500);
                    } else {
                        PickingAdmin.showStatus('error', response.data.message);
                    }
                },
                error: function() {
                    PickingAdmin.showStatus('error', 'Error de conexion');
                },
                complete: function() {
                    $button.prop('disabled', false).html(originalText);
                }
            });
        },

        testConnection: function(e) {
            e.preventDefault();
            
            var $button = $(this);
            var originalText = $button.html();
            
            $button.prop('disabled', true).html('<span class="dashicons dashicons-update spinning"></span> ' + pickingAdmin.strings.testing);
            
            $.ajax({
                url: pickingAdmin.ajaxUrl,
                type: 'POST',
                data: {
                    action: 'picking_test_connection',
                    nonce: pickingAdmin.nonce
                },
                success: function(response) {
                    if (response.success) {
                        PickingAdmin.showStatus('success', response.data.message);
                    } else {
                        PickingAdmin.showStatus('error', response.data.message);
                    }
                },
                error: function() {
                    PickingAdmin.showStatus('error', 'Error de conexion');
                },
                complete: function() {
                    $button.prop('disabled', false).html(originalText);
                }
            });
        },

        resetOrders: function(e) {
            e.preventDefault();
            
            if (!confirm('Esta seguro de que desea reiniciar todos los datos de picking? Esta accion no se puede deshacer.')) {
                return;
            }
            
            var $button = $(this);
            var originalText = $button.html();
            
            $button.prop('disabled', true).html('<span class="dashicons dashicons-update spinning"></span> Reiniciando...');
            
            $.ajax({
                url: pickingAdmin.ajaxUrl,
                type: 'POST',
                data: {
                    action: 'picking_reset_order_data',
                    nonce: pickingAdmin.nonce
                },
                success: function(response) {
                    if (response.success) {
                        PickingAdmin.showStatus('success', response.data.message);
                    } else {
                        PickingAdmin.showStatus('error', response.data.message);
                    }
                },
                error: function() {
                    PickingAdmin.showStatus('error', 'Error de conexion');
                },
                complete: function() {
                    $button.prop('disabled', false).html(originalText);
                }
            });
        },

        saveSettings: function(e) {
            e.preventDefault();
            
            var $form = $(this);
            var $button = $form.find('button[type="submit"]');
            var originalText = $button.html();
            
            $button.prop('disabled', true).html('<span class="dashicons dashicons-update spinning"></span> Guardando...');
            
            var formData = $form.serialize();
            formData += '&action=picking_save_settings&nonce=' + pickingAdmin.nonce;
            
            $.ajax({
                url: pickingAdmin.ajaxUrl,
                type: 'POST',
                data: formData,
                success: function(response) {
                    if (response.success) {
                        PickingAdmin.showStatus('success', response.data.message);
                    } else {
                        PickingAdmin.showStatus('error', response.data.message);
                    }
                },
                error: function() {
                    PickingAdmin.showStatus('error', 'Error de conexion');
                },
                complete: function() {
                    $button.prop('disabled', false).html(originalText);
                }
            });
        },

        copyToClipboard: function(e) {
            e.preventDefault();
            
            var $button = $(this);
            var targetId = $button.data('target');
            var $target = $('#' + targetId);
            var text = $target.text() || $target.val();
            
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(text).then(function() {
                    PickingAdmin.showCopyFeedback($button);
                });
            } else {
                // Fallback for older browsers
                var $temp = $('<textarea>');
                $('body').append($temp);
                $temp.val(text).select();
                document.execCommand('copy');
                $temp.remove();
                PickingAdmin.showCopyFeedback($button);
            }
        },

        showCopyFeedback: function($button) {
            var originalHtml = $button.html();
            $button.html('<span class="dashicons dashicons-yes"></span> ' + pickingAdmin.strings.copied);
            
            setTimeout(function() {
                $button.html(originalHtml);
            }, 2000);
        },

        updateScannerSelection: function() {
            $('.picking-scanner-option').removeClass('selected');
            $(this).closest('.picking-scanner-option').addClass('selected');
        },

        showStatus: function(type, message) {
            var $status = $('#picking-status');
            
            if (!$status.length) {
                $status = $('<div id="picking-status" class="picking-status"></div>');
                $('.picking-card').first().append($status);
            }
            
            $status.removeClass('success error loading').addClass(type).text(message).show();
            
            if (type !== 'loading') {
                setTimeout(function() {
                    $status.fadeOut();
                }, 5000);
            }
        },

        updateQRCode: function(apiKey) {
            var connectionData = {
                store_url: pickingAdmin.siteUrl,
                api_key: apiKey,
                store_name: document.title.split(' - ')[0] || 'Store',
                rest_url: pickingAdmin.restUrl + 'picking/v1'
            };
            
            var connectionString = btoa(JSON.stringify(connectionData));
            
            var canvas = document.getElementById('qr-code');
            if (canvas && typeof QRCode !== 'undefined') {
                QRCode.toCanvas(canvas, connectionString, {
                    width: 256,
                    margin: 2,
                    color: {
                        dark: '#1e3a5f',
                        light: '#ffffff'
                    }
                });
            }
        }
    };

    // Initialize on document ready
    $(document).ready(function() {
        PickingAdmin.init();
        
        // Initialize QR code on connection page
        if (typeof QRCode !== 'undefined' && $('#qr-code').length && pickingAdmin.apiKey) {
            PickingAdmin.updateQRCode(pickingAdmin.apiKey);
        }
    });

    // Add spinning animation
    $('<style>')
        .prop('type', 'text/css')
        .html('.spinning { animation: spin 1s linear infinite; } @keyframes spin { 100% { transform: rotate(360deg); } }')
        .appendTo('head');

})(jQuery);

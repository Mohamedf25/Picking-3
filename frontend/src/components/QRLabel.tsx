import { QRCodeSVG } from 'qrcode.react'
import { Box, Paper, Typography, Button } from '@mui/material'
import { Print } from '@mui/icons-material'

interface QRLabelProps {
  orderId: string
  orderNumber: string
  customerName: string
  total: string
  woocommerceUrl?: string
}

function QRLabel({ orderId, orderNumber, customerName, total, woocommerceUrl }: QRLabelProps) {
  const qrValue = woocommerceUrl 
    ? `${woocommerceUrl}/wp-admin/post.php?post=${orderId}&action=edit`
    : `https://productosmagnate.com/pa/wp-admin/post.php?post=${orderId}&action=edit`

  const handlePrint = () => {
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      const labelContent = document.getElementById(`qr-label-${orderId}`)?.innerHTML
      printWindow.document.write(`
        <html>
          <head>
            <title>Etiqueta QR - Pedido ${orderNumber}</title>
            <style>
              body { 
                font-family: Arial, sans-serif; 
                margin: 20px;
                display: flex;
                justify-content: center;
                align-items: center;
                min-height: 100vh;
              }
              .label-container {
                border: 2px solid #000;
                padding: 20px;
                text-align: center;
                max-width: 300px;
                background: white;
              }
              .qr-code { margin: 10px 0; }
              .order-info { margin: 10px 0; }
              h2 { margin: 10px 0; font-size: 18px; }
              p { margin: 5px 0; font-size: 14px; }
              @media print {
                body { margin: 0; }
                .label-container { border: 1px solid #000; }
              }
            </style>
          </head>
          <body>
            <div class="label-container">
              ${labelContent}
            </div>
          </body>
        </html>
      `)
      printWindow.document.close()
      printWindow.print()
    }
  }

  return (
    <Paper 
      elevation={3} 
      sx={{ 
        p: 3, 
        textAlign: 'center', 
        maxWidth: 300, 
        margin: '20px auto',
        border: '2px solid #ddd'
      }}
    >
      <div id={`qr-label-${orderId}`}>
        <Typography variant="h6" gutterBottom>
          Pedido #{orderNumber}
        </Typography>
        
        <Box className="qr-code" sx={{ my: 2 }}>
          <QRCodeSVG 
            value={qrValue}
            size={120}
            level="M"
            includeMargin={true}
          />
        </Box>
        
        <div className="order-info">
          <Typography variant="body2" gutterBottom>
            <strong>Cliente:</strong> {customerName}
          </Typography>
          <Typography variant="body2" gutterBottom>
            <strong>Total:</strong> €{total}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Escanea para ver en WooCommerce
          </Typography>
        </div>
      </div>
      
      <Button
        variant="contained"
        startIcon={<Print />}
        onClick={handlePrint}
        sx={{ mt: 2 }}
        fullWidth
      >
        Imprimir Etiqueta
      </Button>
    </Paper>
  )
}

export default QRLabel

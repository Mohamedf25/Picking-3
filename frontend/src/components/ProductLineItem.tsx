import {
  Card,
  CardContent,
  Typography,
  Box,
  LinearProgress,
  Avatar
} from '@mui/material'
import { CheckCircle, RadioButtonUnchecked } from '@mui/icons-material'

interface ProductLine {
  item_id: number
  product_id: number
  ean: string
  sku: string
  name: string
  quantity: number
  picked_qty: number
  backorder: number
  picking_status: string
  image?: string
}

interface ProductLineItemProps {
  line: ProductLine
}

function ProductLineItem({ line }: ProductLineItemProps) {
  const progress = (line.picked_qty / line.quantity) * 100
  const isCompleted = line.picked_qty >= line.quantity

  return (
    <Card sx={{ mb: 2, border: isCompleted ? '2px solid #4caf50' : '1px solid #e0e0e0' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar
            src={line.image}
            alt={line.name}
            sx={{ width: 60, height: 60 }}
            variant="rounded"
          >
            {line.name?.charAt(0)}
          </Avatar>
          
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h6" gutterBottom>
              {line.name || `Producto ${line.product_id}`}
            </Typography>
            
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {line.sku ? `SKU: ${line.sku}` : ''}{line.sku && line.ean ? ' | ' : ''}{line.ean ? `EAN: ${line.ean}` : ''}
            </Typography>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Typography variant="body2">
                Recogido: {line.picked_qty} / {line.quantity}
              </Typography>
              {isCompleted ? (
                <CheckCircle color="success" fontSize="small" />
              ) : (
                <RadioButtonUnchecked color="action" fontSize="small" />
              )}
            </Box>
            
            <LinearProgress
              variant="determinate"
              value={progress}
              sx={{
                height: 8,
                borderRadius: 4,
                backgroundColor: '#e0e0e0',
                '& .MuiLinearProgress-bar': {
                  backgroundColor: isCompleted ? '#4caf50' : '#2196f3'
                }
              }}
            />
          </Box>
        </Box>
      </CardContent>
    </Card>
  )
}

export default ProductLineItem

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
  id: string
  product_id: number
  ean: string
  expected_qty: number
  picked_qty: number
  status: string
  product_name: string
  image_url?: string
}

interface ProductLineItemProps {
  line: ProductLine
}

function ProductLineItem({ line }: ProductLineItemProps) {
  const progress = (line.picked_qty / line.expected_qty) * 100
  const isCompleted = line.picked_qty >= line.expected_qty

  return (
    <Card sx={{ mb: 2, border: isCompleted ? '2px solid #4caf50' : '1px solid #e0e0e0' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar
            src={line.image_url}
            alt={line.product_name}
            sx={{ width: 60, height: 60 }}
            variant="rounded"
          >
            {line.product_name?.charAt(0)}
          </Avatar>
          
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h6" gutterBottom>
              {line.product_name || `Producto ${line.product_id}`}
            </Typography>
            
            <Typography variant="body2" color="text.secondary" gutterBottom>
              EAN: {line.ean}
            </Typography>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Typography variant="body2">
                Recogido: {line.picked_qty} / {line.expected_qty}
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

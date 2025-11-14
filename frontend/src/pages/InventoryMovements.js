import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  TextField,
  Grid,
} from '@mui/material';
import { jewelryAPI } from '../services/api';

function InventoryMovements() {
  const [movements, setMovements] = useState([]);
  const [limit, setLimit] = useState(100);

  useEffect(() => {
    loadMovements();
  }, [limit]);

  const loadMovements = async () => {
    try {
      const response = await jewelryAPI.getMovements(null, limit);
      setMovements(response.data.data);
    } catch (error) {
      console.error('Error cargando movimientos:', error);
    }
  };

  const getMovementColor = (type) => {
    switch (type) {
      case 'entrada':
        return 'success';
      case 'salida':
        return 'error';
      case 'ajuste':
        return 'warning';
      default:
        return 'default';
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Historial de Movimientos
      </Typography>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                type="number"
                label="Cantidad de registros"
                value={limit}
                onChange={(e) => setLimit(e.target.value)}
                inputProps={{ min: 10, max: 1000 }}
              />
            </Grid>
            <Grid item xs={12} md={9}>
              <Typography variant="body2" color="textSecondary">
                Mostrando los últimos {movements.length} movimientos
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: 'primary.main' }}>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Fecha</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Código</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Joya</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Tipo</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Cantidad</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Stock Anterior</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Stock Nuevo</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Razón</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Usuario</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {movements.map((movement) => (
              <TableRow key={movement.id} hover>
                <TableCell>
                  {new Date(movement.created_at).toLocaleString('es-MX')}
                </TableCell>
                <TableCell>{movement.jewelry_code}</TableCell>
                <TableCell>{movement.jewelry_name}</TableCell>
                <TableCell>
                  <Chip
                    label={movement.type.toUpperCase()}
                    color={getMovementColor(movement.type)}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Typography 
                    fontWeight="bold"
                    color={
                      movement.type === 'entrada' ? 'success.main' :
                      movement.type === 'salida' ? 'error.main' : 'warning.main'
                    }
                  >
                    {movement.type === 'salida' ? '-' : '+'}{movement.quantity}
                  </Typography>
                </TableCell>
                <TableCell>{movement.previous_stock}</TableCell>
                <TableCell>{movement.new_stock}</TableCell>
                <TableCell>{movement.reason || '-'}</TableCell>
                <TableCell>{movement.created_by || '-'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {movements.length === 0 && (
        <Box textAlign="center" py={4}>
          <Typography color="textSecondary">
            No hay movimientos registrados
          </Typography>
        </Box>
      )}
    </Box>
  );
}

export default InventoryMovements;

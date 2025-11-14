import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Alert,
  AlertTitle,
  List,
  ListItem,
  ListItemText,
  Chip,
  Button,
} from '@mui/material';
import DiamondIcon from '@mui/icons-material/Diamond';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import WarningIcon from '@mui/icons-material/Warning';
import InventoryIcon from '@mui/icons-material/Inventory';
import AssessmentIcon from '@mui/icons-material/Assessment';
import { jewelryAPI } from '../services/api';

function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalJewelry: 0,
    totalValue: 0,
    lowStockCount: 0,
    totalStock: 0,
  });
  const [lowStockItems, setLowStockItems] = useState([]);
  const [recentMovements, setRecentMovements] = useState([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [statsRes, lowStockRes, movementsRes] = await Promise.all([
        jewelryAPI.getStats(),
        jewelryAPI.getLowStock(),
        jewelryAPI.getMovements(null, 5),
      ]);

      setStats(statsRes.data.data);
      setLowStockItems(lowStockRes.data.data);
      setRecentMovements(movementsRes.data.data);
    } catch (error) {
      console.error('Error cargando datos del dashboard:', error);
    }
  };

  const StatCard = ({ title, value, icon, color }) => (
    <Card>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography color="textSecondary" gutterBottom>
              {title}
            </Typography>
            <Typography variant="h4" component="div">
              {value}
            </Typography>
          </Box>
          <Box
            sx={{
              backgroundColor: `${color}.lighter`,
              borderRadius: '50%',
              p: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>
        Dashboard
      </Typography>

      <Grid container spacing={3}>
        {/* Estadísticas */}
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total de Joyas"
            value={stats.totalJewelry}
            icon={<DiamondIcon sx={{ fontSize: 40, color: 'primary.main' }} />}
            color="primary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Valor Total Inventario"
            value={`$${stats.totalValue.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`}
            icon={<AttachMoneyIcon sx={{ fontSize: 40, color: 'secondary.main' }} />}
            color="secondary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Stock Bajo"
            value={stats.lowStockCount}
            icon={<WarningIcon sx={{ fontSize: 40, color: 'error.main' }} />}
            color="error"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Unidades Totales"
            value={stats.totalStock}
            icon={<InventoryIcon sx={{ fontSize: 40, color: 'info.main' }} />}
            color="info"
          />
        </Grid>

        {/* Alertas de Stock Bajo */}
        {lowStockItems.length > 0 && (
          <Grid item xs={12}>
            <Alert severity="warning" icon={<WarningIcon />}>
              <AlertTitle>Alertas de Stock Bajo</AlertTitle>
              <Typography variant="body2" gutterBottom>
                Las siguientes joyas tienen stock por debajo del mínimo:
              </Typography>
              <List dense>
                {lowStockItems.slice(0, 5).map((item) => (
                  <ListItem key={item.id}>
                    <ListItemText
                      primary={`${item.code} - ${item.name}`}
                      secondary={`Stock actual: ${item.current_stock} | Mínimo: ${item.minimum_stock}`}
                    />
                  </ListItem>
                ))}
              </List>
              {lowStockItems.length > 5 && (
                <Button 
                  size="small" 
                  onClick={() => navigate('/jewelry?filter=low_stock')}
                  sx={{ mt: 1 }}
                >
                  Ver todos ({lowStockItems.length})
                </Button>
              )}
            </Alert>
          </Grid>
        )}

        {/* Movimientos Recientes */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Movimientos Recientes
              </Typography>
              <List>
                {recentMovements.length > 0 ? (
                  recentMovements.map((movement) => (
                    <ListItem key={movement.id} divider>
                      <ListItemText
                        primary={`${movement.jewelry_code} - ${movement.jewelry_name}`}
                        secondary={
                          <React.Fragment>
                            <Typography component="span" variant="body2" color="text.primary">
                              {movement.type.toUpperCase()}
                            </Typography>
                            {` — Cantidad: ${movement.quantity} | ${new Date(movement.created_at).toLocaleDateString('es-MX')}`}
                          </React.Fragment>
                        }
                      />
                      <Chip
                        label={movement.type}
                        color={
                          movement.type === 'entrada' ? 'success' :
                          movement.type === 'salida' ? 'error' : 'warning'
                        }
                        size="small"
                      />
                    </ListItem>
                  ))
                ) : (
                  <ListItem>
                    <ListItemText primary="No hay movimientos recientes" />
                  </ListItem>
                )}
              </List>
              <Button 
                fullWidth 
                onClick={() => navigate('/movements')}
                sx={{ mt: 2 }}
              >
                Ver todos los movimientos
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* Acciones Rápidas */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Acciones Rápidas
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
                <Button
                  variant="contained"
                  startIcon={<DiamondIcon />}
                  onClick={() => navigate('/jewelry/new')}
                  fullWidth
                >
                  Agregar Nueva Joya
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<InventoryIcon />}
                  onClick={() => navigate('/jewelry')}
                  fullWidth
                >
                  Ver Inventario Completo
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<AssessmentIcon />}
                  onClick={() => navigate('/reports')}
                  fullWidth
                >
                  Generar Reporte
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}

export default Dashboard;

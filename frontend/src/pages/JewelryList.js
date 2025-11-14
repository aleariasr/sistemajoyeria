import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardContent,
  TextField,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip,
  Typography,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import InventoryIcon from '@mui/icons-material/Inventory';
import { jewelryAPI, categoriesAPI, metalsAPI } from '../services/api';

function JewelryList() {
  const navigate = useNavigate();
  const [jewelry, setJewelry] = useState([]);
  const [categories, setCategories] = useState([]);
  const [metals, setMetals] = useState([]);
  const [filters, setFilters] = useState({
    search: '',
    category_id: '',
    metal_id: '',
    status: '',
    low_stock: '',
  });
  const [deleteDialog, setDeleteDialog] = useState({ open: false, id: null });
  const [stockDialog, setStockDialog] = useState({ 
    open: false, 
    jewelry: null,
    type: 'entrada',
    quantity: 0,
    reason: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    loadJewelry();
  }, [filters]);

  const loadData = async () => {
    try {
      const [categoriesRes, metalsRes] = await Promise.all([
        categoriesAPI.getAll(),
        metalsAPI.getAll(),
      ]);
      setCategories(categoriesRes.data.data);
      setMetals(metalsRes.data.data);
    } catch (error) {
      console.error('Error cargando datos:', error);
    }
  };

  const loadJewelry = async () => {
    try {
      const response = await jewelryAPI.getAll(filters);
      setJewelry(response.data.data);
    } catch (error) {
      console.error('Error cargando joyas:', error);
    }
  };

  const handleDelete = async () => {
    try {
      await jewelryAPI.delete(deleteDialog.id);
      setDeleteDialog({ open: false, id: null });
      loadJewelry();
    } catch (error) {
      console.error('Error eliminando joya:', error);
    }
  };

  const handleStockAdjustment = async () => {
    try {
      await jewelryAPI.adjustStock(stockDialog.jewelry.id, {
        type: stockDialog.type,
        quantity: parseInt(stockDialog.quantity),
        reason: stockDialog.reason,
        created_by: 'usuario',
      });
      setStockDialog({ open: false, jewelry: null, type: 'entrada', quantity: 0, reason: '' });
      loadJewelry();
    } catch (error) {
      console.error('Error ajustando stock:', error);
    }
  };

  const getStockStatus = (item) => {
    if (item.current_stock === 0) return { label: 'Sin stock', color: 'error' };
    if (item.current_stock <= item.minimum_stock) return { label: 'Stock bajo', color: 'warning' };
    return { label: 'Stock OK', color: 'success' };
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Inventario de Joyas</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate('/jewelry/new')}
        >
          Nueva Joya
        </Button>
      </Box>

      {/* Filtros */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="Buscar"
                placeholder="Código, nombre o descripción"
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                InputProps={{
                  startAdornment: <SearchIcon sx={{ mr: 1, color: 'action.active' }} />,
                }}
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>Categoría</InputLabel>
                <Select
                  value={filters.category_id}
                  label="Categoría"
                  onChange={(e) => setFilters({ ...filters, category_id: e.target.value })}
                >
                  <MenuItem value="">Todas</MenuItem>
                  {categories.map((cat) => (
                    <MenuItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>Metal</InputLabel>
                <Select
                  value={filters.metal_id}
                  label="Metal"
                  onChange={(e) => setFilters({ ...filters, metal_id: e.target.value })}
                >
                  <MenuItem value="">Todos</MenuItem>
                  {metals.map((metal) => (
                    <MenuItem key={metal.id} value={metal.id}>
                      {metal.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>Estado</InputLabel>
                <Select
                  value={filters.status}
                  label="Estado"
                  onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                >
                  <MenuItem value="">Todos</MenuItem>
                  <MenuItem value="active">Activo</MenuItem>
                  <MenuItem value="inactive">Inactivo</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Stock</InputLabel>
                <Select
                  value={filters.low_stock}
                  label="Stock"
                  onChange={(e) => setFilters({ ...filters, low_stock: e.target.value })}
                >
                  <MenuItem value="">Todos</MenuItem>
                  <MenuItem value="true">Solo stock bajo</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Tabla */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: 'primary.main' }}>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Código</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Nombre</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Categoría</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Metal</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Precio Venta</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Stock</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Estado</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {jewelry.map((item) => {
              const stockStatus = getStockStatus(item);
              return (
                <TableRow key={item.id} hover>
                  <TableCell>{item.code}</TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight={500}>
                      {item.name}
                    </Typography>
                    {item.description && (
                      <Typography variant="caption" color="textSecondary">
                        {item.description.substring(0, 50)}
                        {item.description.length > 50 ? '...' : ''}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>{item.category_name || '-'}</TableCell>
                  <TableCell>{item.metal_name || '-'}</TableCell>
                  <TableCell>${item.sale_price.toLocaleString('es-MX')}</TableCell>
                  <TableCell>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Typography>{item.current_stock}</Typography>
                      <Chip
                        label={stockStatus.label}
                        color={stockStatus.color}
                        size="small"
                      />
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={item.status}
                      color={item.status === 'active' ? 'success' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <IconButton
                      size="small"
                      color="primary"
                      onClick={() => navigate(`/jewelry/edit/${item.id}`)}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      color="secondary"
                      onClick={() => setStockDialog({ 
                        open: true, 
                        jewelry: item,
                        type: 'entrada',
                        quantity: 0,
                        reason: '',
                      })}
                    >
                      <InventoryIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => setDeleteDialog({ open: true, id: item.id })}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Diálogo de eliminación */}
      <Dialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, id: null })}
      >
        <DialogTitle>Confirmar Eliminación</DialogTitle>
        <DialogContent>
          ¿Está seguro que desea eliminar esta joya?
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false, id: null })}>
            Cancelar
          </Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo de ajuste de stock */}
      <Dialog
        open={stockDialog.open}
        onClose={() => setStockDialog({ open: false, jewelry: null, type: 'entrada', quantity: 0, reason: '' })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Ajustar Stock</DialogTitle>
        <DialogContent>
          {stockDialog.jewelry && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" gutterBottom>
                {stockDialog.jewelry.code} - {stockDialog.jewelry.name}
              </Typography>
              <Typography variant="caption" color="textSecondary" gutterBottom>
                Stock actual: {stockDialog.jewelry.current_stock}
              </Typography>
              <FormControl fullWidth sx={{ mt: 2 }}>
                <InputLabel>Tipo de Movimiento</InputLabel>
                <Select
                  value={stockDialog.type}
                  label="Tipo de Movimiento"
                  onChange={(e) => setStockDialog({ ...stockDialog, type: e.target.value })}
                >
                  <MenuItem value="entrada">Entrada</MenuItem>
                  <MenuItem value="salida">Salida</MenuItem>
                  <MenuItem value="ajuste">Ajuste</MenuItem>
                </Select>
              </FormControl>
              <TextField
                fullWidth
                type="number"
                label="Cantidad"
                value={stockDialog.quantity}
                onChange={(e) => setStockDialog({ ...stockDialog, quantity: e.target.value })}
                sx={{ mt: 2 }}
              />
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Razón"
                value={stockDialog.reason}
                onChange={(e) => setStockDialog({ ...stockDialog, reason: e.target.value })}
                sx={{ mt: 2 }}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStockDialog({ open: false, jewelry: null, type: 'entrada', quantity: 0, reason: '' })}>
            Cancelar
          </Button>
          <Button onClick={handleStockAdjustment} color="primary" variant="contained">
            Guardar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default JewelryList;

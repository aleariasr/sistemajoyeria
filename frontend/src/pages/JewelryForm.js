import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardContent,
  TextField,
  Grid,
  Typography,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Chip,
  IconButton,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SaveIcon from '@mui/icons-material/Save';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import { jewelryAPI, categoriesAPI, metalsAPI, stonesAPI } from '../services/api';

function JewelryForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const [categories, setCategories] = useState([]);
  const [metals, setMetals] = useState([]);
  const [availableStones, setAvailableStones] = useState([]);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    category_id: '',
    metal_id: '',
    size: '',
    sale_price: '',
    cost: '',
    current_stock: '0',
    minimum_stock: '0',
    location: '',
    status: 'active',
    stones: [],
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (id) {
      loadJewelry();
    }
  }, [id]);

  const loadData = async () => {
    try {
      const [categoriesRes, metalsRes, stonesRes] = await Promise.all([
        categoriesAPI.getAll(),
        metalsAPI.getAll(),
        stonesAPI.getAll(),
      ]);
      setCategories(categoriesRes.data.data);
      setMetals(metalsRes.data.data);
      setAvailableStones(stonesRes.data.data);
    } catch (error) {
      console.error('Error cargando datos:', error);
    }
  };

  const loadJewelry = async () => {
    try {
      const response = await jewelryAPI.getById(id);
      const jewelry = response.data.data;
      setFormData({
        code: jewelry.code,
        name: jewelry.name,
        description: jewelry.description || '',
        category_id: jewelry.category_id || '',
        metal_id: jewelry.metal_id || '',
        size: jewelry.size || '',
        sale_price: jewelry.sale_price,
        cost: jewelry.cost,
        current_stock: jewelry.current_stock,
        minimum_stock: jewelry.minimum_stock,
        location: jewelry.location || '',
        status: jewelry.status,
        stones: jewelry.stones.map(s => ({ stone_id: s.id, quantity: s.quantity })),
      });
    } catch (error) {
      console.error('Error cargando joya:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleAddStone = () => {
    setFormData({
      ...formData,
      stones: [...formData.stones, { stone_id: '', quantity: 1 }],
    });
  };

  const handleRemoveStone = (index) => {
    setFormData({
      ...formData,
      stones: formData.stones.filter((_, i) => i !== index),
    });
  };

  const handleStoneChange = (index, field, value) => {
    const newStones = [...formData.stones];
    newStones[index][field] = value;
    setFormData({ ...formData, stones: newStones });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const submitData = {
        ...formData,
        sale_price: parseFloat(formData.sale_price),
        cost: parseFloat(formData.cost),
        current_stock: parseInt(formData.current_stock),
        minimum_stock: parseInt(formData.minimum_stock),
      };

      if (isEdit) {
        await jewelryAPI.update(id, submitData);
      } else {
        await jewelryAPI.create(submitData);
      }
      navigate('/jewelry');
    } catch (error) {
      console.error('Error guardando joya:', error);
      alert('Error al guardar la joya');
    }
  };

  return (
    <Box>
      <Box display="flex" alignItems="center" mb={3}>
        <IconButton onClick={() => navigate('/jewelry')} sx={{ mr: 2 }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4">
          {isEdit ? 'Editar Joya' : 'Nueva Joya'}
        </Typography>
      </Box>

      <form onSubmit={handleSubmit}>
        <Grid container spacing={3}>
          {/* Información Básica */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Información Básica
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      required
                      label="Código"
                      name="code"
                      value={formData.code}
                      onChange={handleChange}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      required
                      label="Nombre"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      multiline
                      rows={3}
                      label="Descripción"
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <FormControl fullWidth required>
                      <InputLabel>Categoría</InputLabel>
                      <Select
                        name="category_id"
                        value={formData.category_id}
                        label="Categoría"
                        onChange={handleChange}
                      >
                        {categories.map((cat) => (
                          <MenuItem key={cat.id} value={cat.id}>
                            {cat.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <FormControl fullWidth required>
                      <InputLabel>Metal</InputLabel>
                      <Select
                        name="metal_id"
                        value={formData.metal_id}
                        label="Metal"
                        onChange={handleChange}
                      >
                        {metals.map((metal) => (
                          <MenuItem key={metal.id} value={metal.id}>
                            {metal.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      label="Talla"
                      name="size"
                      value={formData.size}
                      onChange={handleChange}
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Piedras */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="h6">
                    Piedras
                  </Typography>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<AddIcon />}
                    onClick={handleAddStone}
                  >
                    Agregar Piedra
                  </Button>
                </Box>
                {formData.stones.map((stone, index) => (
                  <Grid container spacing={2} key={index} sx={{ mb: 2 }}>
                    <Grid item xs={12} md={6}>
                      <FormControl fullWidth>
                        <InputLabel>Piedra</InputLabel>
                        <Select
                          value={stone.stone_id}
                          label="Piedra"
                          onChange={(e) => handleStoneChange(index, 'stone_id', e.target.value)}
                        >
                          {availableStones.map((s) => (
                            <MenuItem key={s.id} value={s.id}>
                              {s.name} - {s.type}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} md={5}>
                      <TextField
                        fullWidth
                        type="number"
                        label="Cantidad"
                        value={stone.quantity}
                        onChange={(e) => handleStoneChange(index, 'quantity', e.target.value)}
                      />
                    </Grid>
                    <Grid item xs={12} md={1}>
                      <IconButton
                        color="error"
                        onClick={() => handleRemoveStone(index)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Grid>
                  </Grid>
                ))}
              </CardContent>
            </Card>
          </Grid>

          {/* Precios y Stock */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Precios y Stock
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={3}>
                    <TextField
                      fullWidth
                      required
                      type="number"
                      label="Precio de Venta"
                      name="sale_price"
                      value={formData.sale_price}
                      onChange={handleChange}
                      inputProps={{ step: '0.01', min: '0' }}
                    />
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <TextField
                      fullWidth
                      required
                      type="number"
                      label="Costo"
                      name="cost"
                      value={formData.cost}
                      onChange={handleChange}
                      inputProps={{ step: '0.01', min: '0' }}
                    />
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <TextField
                      fullWidth
                      required
                      type="number"
                      label="Stock Actual"
                      name="current_stock"
                      value={formData.current_stock}
                      onChange={handleChange}
                      inputProps={{ min: '0' }}
                      disabled={isEdit}
                      helperText={isEdit ? 'Use ajuste de stock para modificar' : ''}
                    />
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <TextField
                      fullWidth
                      required
                      type="number"
                      label="Stock Mínimo"
                      name="minimum_stock"
                      value={formData.minimum_stock}
                      onChange={handleChange}
                      inputProps={{ min: '0' }}
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Ubicación y Estado */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Ubicación y Estado
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Ubicación"
                      name="location"
                      value={formData.location}
                      onChange={handleChange}
                      placeholder="Ej: Vitrina 1, Estante A"
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth required>
                      <InputLabel>Estado</InputLabel>
                      <Select
                        name="status"
                        value={formData.status}
                        label="Estado"
                        onChange={handleChange}
                      >
                        <MenuItem value="active">Activo</MenuItem>
                        <MenuItem value="inactive">Inactivo</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Botones */}
          <Grid item xs={12}>
            <Box display="flex" gap={2} justifyContent="flex-end">
              <Button
                variant="outlined"
                onClick={() => navigate('/jewelry')}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                variant="contained"
                startIcon={<SaveIcon />}
              >
                {isEdit ? 'Actualizar' : 'Guardar'}
              </Button>
            </Box>
          </Grid>
        </Grid>
      </form>
    </Box>
  );
}

export default JewelryForm;

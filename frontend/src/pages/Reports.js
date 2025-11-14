import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import TableChartIcon from '@mui/icons-material/TableChart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { jewelryAPI, categoriesAPI } from '../services/api';

const COLORS = ['#8B4513', '#DAA520', '#CD853F', '#DEB887', '#F4A460', '#D2691E'];

function Reports() {
  const [reportType, setReportType] = useState('inventory');
  const [jewelry, setJewelry] = useState([]);
  const [categories, setCategories] = useState([]);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [jewelryRes, categoriesRes, statsRes] = await Promise.all([
        jewelryAPI.getAll(),
        categoriesAPI.getAll(),
        jewelryAPI.getStats(),
      ]);
      setJewelry(jewelryRes.data.data);
      setCategories(categoriesRes.data.data);
      setStats(statsRes.data.data);
    } catch (error) {
      console.error('Error cargando datos:', error);
    }
  };

  const getCategoryData = () => {
    const categoryCount = {};
    jewelry.forEach(item => {
      const catName = item.category_name || 'Sin categoría';
      categoryCount[catName] = (categoryCount[catName] || 0) + 1;
    });
    return Object.keys(categoryCount).map(key => ({
      name: key,
      value: categoryCount[key],
    }));
  };

  const getStockValueByCategory = () => {
    const categoryValue = {};
    jewelry.forEach(item => {
      const catName = item.category_name || 'Sin categoría';
      const value = item.current_stock * item.sale_price;
      categoryValue[catName] = (categoryValue[catName] || 0) + value;
    });
    return Object.keys(categoryValue).map(key => ({
      name: key,
      value: categoryValue[key],
    }));
  };

  const handleExportPDF = () => {
    alert('Funcionalidad de exportación a PDF en desarrollo');
  };

  const handleExportExcel = () => {
    alert('Funcionalidad de exportación a Excel en desarrollo');
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Reportes e Informes
      </Typography>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Tipo de Reporte</InputLabel>
                <Select
                  value={reportType}
                  label="Tipo de Reporte"
                  onChange={(e) => setReportType(e.target.value)}
                >
                  <MenuItem value="inventory">Resumen de Inventario</MenuItem>
                  <MenuItem value="categories">Por Categorías</MenuItem>
                  <MenuItem value="lowstock">Stock Bajo</MenuItem>
                  <MenuItem value="value">Valor del Inventario</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={8}>
              <Box display="flex" gap={2} justifyContent="flex-end">
                <Button
                  variant="outlined"
                  startIcon={<PictureAsPdfIcon />}
                  onClick={handleExportPDF}
                >
                  Exportar PDF
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<TableChartIcon />}
                  onClick={handleExportExcel}
                >
                  Exportar Excel
                </Button>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Estadísticas Generales */}
      {stats && (
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Total Joyas
                </Typography>
                <Typography variant="h3">{stats.totalJewelry}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Valor Total
                </Typography>
                <Typography variant="h3">
                  ${stats.totalValue.toLocaleString('es-MX', { minimumFractionDigits: 0 })}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Stock Total
                </Typography>
                <Typography variant="h3">{stats.totalStock}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Alertas Stock Bajo
                </Typography>
                <Typography variant="h3" color="error">
                  {stats.lowStockCount}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Gráficos */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Distribución por Categoría
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={getCategoryData()}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {getCategoryData().map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Valor por Categoría
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={getStockValueByCategory()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value) => `$${value.toLocaleString('es-MX')}`} />
                  <Legend />
                  <Bar dataKey="value" fill="#8B4513" name="Valor ($)" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Tabla detallada */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Detalle del Inventario
              </Typography>
              <TableContainer component={Paper} sx={{ mt: 2 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ backgroundColor: 'primary.main' }}>
                      <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Código</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Nombre</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Categoría</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Stock</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Precio</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Valor Total</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {jewelry.map((item) => (
                      <TableRow key={item.id} hover>
                        <TableCell>{item.code}</TableCell>
                        <TableCell>{item.name}</TableCell>
                        <TableCell>{item.category_name || '-'}</TableCell>
                        <TableCell>{item.current_stock}</TableCell>
                        <TableCell>${item.sale_price.toLocaleString('es-MX')}</TableCell>
                        <TableCell>
                          ${(item.current_stock * item.sale_price).toLocaleString('es-MX')}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}

export default Reports;

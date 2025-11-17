const express = require('express');
const router = express.Router();
const Joya = require('../models/Joya');

// GET /api/reportes/inventario - Reporte de inventario actual
router.get('/inventario', async (req, res) => {
  try {
    const resultado = await Joya.obtenerTodas({ por_pagina: 10000 });
    
    const reporte = resultado.joyas.map(joya => ({
      codigo: joya.codigo,
      nombre: joya.nombre,
      categoria: joya.categoria,
      stock_actual: joya.stock_actual,
      costo: joya.costo,
      precio_venta: joya.precio_venta,
      moneda: joya.moneda,
      valor_total_costo: joya.stock_actual * joya.costo,
      valor_total_venta: joya.stock_actual * joya.precio_venta,
      estado: joya.estado
    }));

    res.json(reporte);
  } catch (error) {
    console.error('Error al generar reporte de inventario:', error);
    res.status(500).json({ error: 'Error al generar reporte' });
  }
});

// GET /api/reportes/stock-bajo - Reporte de stock bajo
router.get('/stock-bajo', async (req, res) => {
  try {
    const joyas = await Joya.obtenerStockBajo();
    
    const reporte = joyas.map(joya => ({
      codigo: joya.codigo,
      nombre: joya.nombre,
      categoria: joya.categoria,
      stock_actual: joya.stock_actual,
      stock_minimo: joya.stock_minimo,
      diferencia: joya.stock_minimo - joya.stock_actual,
      precio_venta: joya.precio_venta,
      moneda: joya.moneda
    }));

    res.json(reporte);
  } catch (error) {
    console.error('Error al generar reporte de stock bajo:', error);
    res.status(500).json({ error: 'Error al generar reporte' });
  }
});

module.exports = router;

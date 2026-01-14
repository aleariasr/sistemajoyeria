const express = require('express');
const router = express.Router();
const { obtenerFechaCostaRica, formatearFechaSQL, TIMEZONE } = require('../utils/timezone');

/**
 * GET /api/system/time
 * Devuelve la hora actual del servidor
 * Esta es la misma hora que se usa en facturas, reportes, cierres de caja, etc.
 * 
 * No requiere autenticación para permitir que el reloj del sistema funcione
 * incluso en la página de login
 */
router.get('/time', (req, res) => {
  try {
    const fechaActual = obtenerFechaCostaRica();
    const fechaSQL = formatearFechaSQL();
    
    res.json({
      timestamp: fechaActual.toISOString(),
      formatted: fechaSQL,
      timezone: TIMEZONE,
      // Componentes para facilitar el uso en el frontend
      date: {
        year: fechaActual.getFullYear(),
        month: fechaActual.getMonth() + 1,
        day: fechaActual.getDate()
      },
      time: {
        hours: fechaActual.getHours(),
        minutes: fechaActual.getMinutes(),
        seconds: fechaActual.getSeconds()
      }
    });
  } catch (error) {
    console.error('Error obteniendo hora del sistema:', error);
    res.status(500).json({ error: 'Error obteniendo hora del sistema' });
  }
});

module.exports = router;

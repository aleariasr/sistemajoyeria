const express = require('express');
const router = express.Router();
const { formatInTimeZone } = require('date-fns-tz');

const COSTA_RICA = 'America/Costa_Rica';

/**
 * GET /api/system/time
 * Devuelve la hora actual del servidor en UTC y hora local de Costa Rica.
 * Esta es la misma hora que se usa en facturas, reportes, cierres de caja, etc.
 *
 * No requiere autenticación para permitir que el reloj del sistema funcione
 * incluso en la página de login.
 */
router.get('/time', (req, res) => {
  try {
    const now = new Date();

    // True UTC ISO timestamp
    const timestamp_utc = now.toISOString();

    // Format local time in Costa Rica - this is NOT a shifted UTC, but the real local hour
    const local_iso = formatInTimeZone(now, COSTA_RICA, "yyyy-MM-dd'T'HH:mm:ss");
    const local_date = formatInTimeZone(now, COSTA_RICA, 'yyyy-MM-dd');
    const local_time = formatInTimeZone(now, COSTA_RICA, 'HH:mm:ss');

    res.json({
      timezone: COSTA_RICA,
      timestamp_utc,
      local_iso,
      local_date,
      local_time
    });
  } catch (error) {
    console.error('Error obteniendo hora del sistema:', error);
    res.status(500).json({ error: 'Error obteniendo hora del sistema' });
  }
});

module.exports = router;

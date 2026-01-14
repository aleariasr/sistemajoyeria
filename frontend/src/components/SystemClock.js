import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../styles/SystemClock.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

/**
 * SystemClock Component
 * Displays current system date and time from the server in real-time
 * This is the EXACT same timestamp used in invoices, closures, reports, and all transactions
 * 
 * The clock syncs with the server every 30 seconds to prevent drift
 */
function SystemClock() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [serverOffset, setServerOffset] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch server time and calculate offset
  const syncWithServer = async () => {
    try {
      const beforeRequest = Date.now();
      const response = await axios.get(`${API_URL}/api/system/time`);
      const afterRequest = Date.now();
      
      // Calculate network latency and adjust
      const networkLatency = (afterRequest - beforeRequest) / 2;
      const serverTime = new Date(response.data.timestamp);
      const adjustedServerTime = serverTime.getTime() + networkLatency;
      
      // Calculate offset between server and client
      const clientTime = Date.now();
      const offset = adjustedServerTime - clientTime;
      
      setServerOffset(offset);
      setError(null);
      setIsLoading(false);
      
      if (process.env.NODE_ENV === 'development') {
        console.log('🕐 Server time synced:', {
          serverTime: response.data.formatted,
          timezone: response.data.timezone,
          offset: `${(offset / 1000).toFixed(1)}s`,
          latency: `${networkLatency.toFixed(0)}ms`
        });
      }
    } catch (err) {
      console.error('Error syncing with server time:', err);
      setError('Error de sincronización');
      setIsLoading(false);
      // Fall back to client time if server sync fails
      setServerOffset(0);
    }
  };

  // Sync with server on mount and every 30 seconds
  useEffect(() => {
    syncWithServer();
    
    // Re-sync every 30 seconds to prevent drift
    const syncInterval = setInterval(syncWithServer, 30000);
    
    return () => clearInterval(syncInterval);
  }, []);

  // Update display time every second
  useEffect(() => {
    const timer = setInterval(() => {
      // Use client time + server offset for smooth updates
      const adjustedTime = new Date(Date.now() + serverOffset);
      setCurrentTime(adjustedTime);
    }, 1000);

    return () => clearInterval(timer);
  }, [serverOffset]);

  // Format date as DD/MM/YYYY
  const formatDate = (date) => {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // Format time as HH:MM:SS
  const formatTime = (date) => {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
  };

  if (isLoading) {
    return (
      <div className="system-clock loading">
        <div className="clock-time">⏳ Cargando...</div>
      </div>
    );
  }

  return (
    <div className="system-clock" title={error ? error : "Hora del sistema (Costa Rica, UTC-6)"}>
      <div className="clock-date">{formatDate(currentTime)}</div>
      <div className="clock-time">{formatTime(currentTime)}</div>
      {error && <div className="clock-error">⚠️</div>}
    </div>
  );
}

export default SystemClock;

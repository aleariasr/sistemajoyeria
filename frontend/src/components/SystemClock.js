import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import '../styles/SystemClock.css';

/**
 * Detectar URL del backend (misma lógica que api.js)
 */
function getApiUrl() {
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }
  
  if (typeof window !== 'undefined') {
    const protocol = window.location.protocol;
    const hostname = window.location.hostname;
    
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return `${protocol}//${hostname}:3001`;
    }
    
    const localIpPattern = /^(192\.168\.\d{1,3}\.\d{1,3}|10\.\d{1,3}\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2[0-9]|3[0-1])\.\d{1,3}\.\d{1,3})$/;
    if (localIpPattern.test(hostname)) {
      return `${protocol}//${hostname}:3001`;
    }
    
    return `${protocol}//${hostname}:3001`;
  }
  
  return 'http://localhost:3001';
}

const API_URL = getApiUrl();

/**
 * SystemClock Component
 * Displays current system date and time from the server in real-time
 * This is the EXACT same timestamp used in invoices, closures, reports, and all transactions
 * 
 * Optimized for minimal backend load:
 * - Syncs with server ONCE on mount to calculate time offset
 * - Uses client's clock with the calculated offset for continuous display
 * - No recurring backend requests (reduces server load and Railway costs)
 */
function SystemClock() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [serverOffset, setServerOffset] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch server time and calculate offset (only once on mount)
  // useCallback with empty deps is safe here because:
  // - API_URL is a constant determined at module load time
  // - All state setters (setServerOffset, setError, setIsLoading) are stable
  // - axios.get and Date are external APIs that don't change
  const syncWithServer = useCallback(async () => {
    try {
      const beforeRequest = Date.now();
      const response = await axios.get(`${API_URL}/api/system/time`, {
        withCredentials: true, // Include cookies for authenticated requests
        timeout: 5000 // 5 second timeout
      });
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
      console.error('Error syncing with server time:', err.message);
      setError('Error de sincronización');
      setIsLoading(false);
      // Fall back to client time if server sync fails
      setServerOffset(0);
    }
  }, []); // Empty deps: API_URL is constant, setters are stable

  // Sync with server only once on mount
  useEffect(() => {
    // Track if component is mounted to prevent state updates after unmount
    let isMounted = true;
    
    const syncWithServerSafe = async () => {
      if (!isMounted) return;
      await syncWithServer();
    };
    
    // Perform single sync on mount to calculate offset
    syncWithServerSafe();
    
    // No recurring sync - clock uses client time + calculated offset
    return () => {
      isMounted = false;
    };
  }, [syncWithServer]); // Now properly includes syncWithServer in dependencies

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

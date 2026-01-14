import React, { useState, useEffect } from 'react';
import '../styles/SystemClock.css';

/**
 * SystemClock Component
 * Displays current system date and time in real-time
 * This is the same timestamp used in invoices, closures, reports, and all transactions
 */
function SystemClock() {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    // Update time every second
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    // Cleanup interval on component unmount
    return () => clearInterval(timer);
  }, []);

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

  return (
    <div className="system-clock">
      <div className="clock-date">{formatDate(currentTime)}</div>
      <div className="clock-time">{formatTime(currentTime)}</div>
    </div>
  );
}

export default SystemClock;

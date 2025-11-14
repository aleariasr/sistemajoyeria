import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import './styles/App.css';

// Components
import ListadoJoyas from './components/ListadoJoyas';
import FormularioJoya from './components/FormularioJoya';
import DetalleJoya from './components/DetalleJoya';
import Movimientos from './components/Movimientos';
import Reportes from './components/Reportes';
import StockBajo from './components/StockBajo';

function Sidebar() {
  const location = useLocation();

  const isActive = (path) => {
    return location.pathname === path ? 'active' : '';
  };

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h1>
          <span>💎</span>
          <span>Inventario Joyería</span>
        </h1>
      </div>
      <ul className="sidebar-nav">
        <li>
          <Link to="/" className={isActive('/')}>
            <span className="icon">📋</span>
            <span>Inventario</span>
          </Link>
        </li>
        <li>
          <Link to="/nueva-joya" className={isActive('/nueva-joya')}>
            <span className="icon">➕</span>
            <span>Nueva Joya</span>
          </Link>
        </li>
        <li>
          <Link to="/movimientos" className={isActive('/movimientos')}>
            <span className="icon">📦</span>
            <span>Movimientos</span>
          </Link>
        </li>
        <li>
          <Link to="/stock-bajo" className={isActive('/stock-bajo')}>
            <span className="icon">⚠️</span>
            <span>Stock Bajo</span>
          </Link>
        </li>
        <li>
          <Link to="/reportes" className={isActive('/reportes')}>
            <span className="icon">📊</span>
            <span>Reportes</span>
          </Link>
        </li>
      </ul>
    </div>
  );
}

function App() {
  return (
    <Router>
      <div className="app">
        <Sidebar />
        <div className="main-content">
          <Routes>
            <Route path="/" element={<ListadoJoyas />} />
            <Route path="/nueva-joya" element={<FormularioJoya />} />
            <Route path="/editar-joya/:id" element={<FormularioJoya />} />
            <Route path="/joya/:id" element={<DetalleJoya />} />
            <Route path="/movimientos" element={<Movimientos />} />
            <Route path="/stock-bajo" element={<StockBajo />} />
            <Route path="/reportes" element={<Reportes />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;

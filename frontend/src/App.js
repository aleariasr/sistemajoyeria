import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import './styles/App.css';

// Context
import { AuthProvider, useAuth } from './context/AuthContext';
import { SelectionProvider } from './context/SelectionContext';

// Components
import Login from './components/Login';
import ListadoJoyas from './components/ListadoJoyas';
import FormularioJoya from './components/FormularioJoya';
import DetalleJoya from './components/DetalleJoya';
import Movimientos from './components/Movimientos';
import Reportes from './components/Reportes';
import StockBajo from './components/StockBajo';
import CierreCaja from './components/CierreCaja';
import HistorialCierres from './components/HistorialCierres';
import Ventas from './components/Ventas';
import HistorialVentas from './components/HistorialVentas';
import DetalleVenta from './components/DetalleVenta';
import Usuarios from './components/Usuarios';
import FormularioUsuario from './components/FormularioUsuario';
import Clientes from './components/Clientes';
import FormularioCliente from './components/FormularioCliente';
import CuentasPorCobrar from './components/CuentasPorCobrar';
import DetalleCuentaPorCobrar from './components/DetalleCuentaPorCobrar';
import IngresosExtras from './components/IngresosExtras';
import Devoluciones from './components/Devoluciones';
import PedidosOnline from './components/PedidosOnline';

function Sidebar() {
  const location = useLocation();
  const { user, isAdmin, logout } = useAuth();

  const isActive = (path) => {
    return location.pathname === path ? 'active' : '';
  };

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h1>
          <span>💎</span>
          <span>Cuero & Perla</span>
        </h1>
        <div className="user-info">
          <p>{user?.full_name}</p>
          <small>{user?.role === 'administrador' ? '👨‍💼 Administrador' : '👤 Dependiente'}</small>
        </div>
      </div>
      <ul className="sidebar-nav">
        {/* Módulo de Ventas - Todos los usuarios */}
        <li>
          <Link to="/ventas" className={isActive('/ventas')}>
            <span className="icon">💰</span>
            <span>Nueva Venta</span>
          </Link>
        </li>
        <li>
          <Link to="/historial-ventas" className={isActive('/historial-ventas')}>
            <span className="icon">📊</span>
            <span>Historial Ventas</span>
          </Link>
        </li>

        <li>
          <Link to="/cuentas-por-cobrar" className={isActive('/cuentas-por-cobrar')}>
            <span className="icon">💳</span>
            <span>Cuentas por Cobrar</span>
          </Link>
        </li>

        <li>
          <Link to="/clientes" className={isActive('/clientes')}>
            <span className="icon">👥</span>
            <span>Clientes</span>
          </Link>
        </li>

        <li>
          <Link to="/ingresos-extras" className={isActive('/ingresos-extras')}>
            <span className="icon">💵</span>
            <span>Ingresos Extras</span>
          </Link>
        </li>

        <li>
          <Link to="/devoluciones" className={isActive('/devoluciones')}>
            <span className="icon">🔄</span>
            <span>Devoluciones</span>
          </Link>
        </li>

        <li>
          <Link to="/cierre-caja" className={isActive('/cierre-caja')}>
            <span className="icon">💰</span>
            <span>Cierre de Caja</span>
          </Link>
        </li>
        <li>
          <Link to="/historial-cierres" className={isActive('/historial-cierres')}>
            <span className="icon">🧾</span>
            <span>Histórico de Cierres</span>
          </Link>
        </li>

        {/* Separador */}
        {isAdmin() && <li className="separator"></li>}

        {/* Pedidos Online - Solo administradores */}
        {isAdmin() && (
          <li>
            <Link to="/pedidos-online" className={isActive('/pedidos-online')}>
              <span className="icon">📦</span>
              <span>Pedidos Online</span>
            </Link>
          </li>
        )}

        {/* Separador */}
        {isAdmin() && <li className="separator"></li>}

        {/* Módulos administrativos - Solo administradores */}
        {isAdmin() && (
          <>
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
              <Link to="/reportes" className={isActive('/reportes')}>
                <span className="icon">📈</span>
                <span>Reportes</span>
              </Link>
            </li>
            <li>
              <Link to="/usuarios" className={isActive('/usuarios')}>
                <span className="icon">👤</span>
                <span>Usuarios</span>
              </Link>
            </li>
          </>
        )}

        <li className="separator"></li>
        <li>
          <button onClick={handleLogout} className="logout-btn">
            <span className="icon">🚪</span>
            <span>Cerrar Sesión</span>
          </button>
        </li>
      </ul>
    </div>
  );
}

function ProtectedRoute({ children, adminOnly = false }) {
  const { user, loading, isAdmin } = useAuth();

  if (loading) {
    return <div className="loading">Cargando...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && !isAdmin()) {
    return <Navigate to="/ventas" replace />;
  }

  return children;
}

function AppContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="loading">Cargando...</div>;
  }

  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <div className="app">
      <Sidebar />
      <div className="main-content">
        <Routes>
          {/* Rutas de ventas - Accesibles para todos */}
          <Route path="/ventas" element={<ProtectedRoute><Ventas /></ProtectedRoute>} />
          <Route path="/historial-ventas" element={<ProtectedRoute><HistorialVentas /></ProtectedRoute>} />
          <Route path="/venta/:id" element={<ProtectedRoute><DetalleVenta /></ProtectedRoute>} />
          <Route path="/cuentas-por-cobrar" element={<ProtectedRoute><CuentasPorCobrar /></ProtectedRoute>} />
          <Route path="/cuenta-por-cobrar/:id" element={<ProtectedRoute><DetalleCuentaPorCobrar /></ProtectedRoute>} />
          <Route path="/cierre-caja" element={<ProtectedRoute><CierreCaja /></ProtectedRoute>} />
          <Route path="/historial-cierres" element={<ProtectedRoute><HistorialCierres /></ProtectedRoute>} />
          <Route path="/clientes" element={<ProtectedRoute><Clientes /></ProtectedRoute>} />
          <Route path="/nuevo-cliente" element={<ProtectedRoute><FormularioCliente /></ProtectedRoute>} />
          <Route path="/editar-cliente/:id" element={<ProtectedRoute><FormularioCliente /></ProtectedRoute>} />
          <Route path="/ingresos-extras" element={<ProtectedRoute><IngresosExtras /></ProtectedRoute>} />
          <Route path="/devoluciones" element={<ProtectedRoute><Devoluciones /></ProtectedRoute>} />

          {/* Rutas administrativas - Solo administradores */}
          <Route path="/pedidos-online" element={<ProtectedRoute adminOnly={true}><PedidosOnline /></ProtectedRoute>} />
          <Route path="/" element={<ProtectedRoute adminOnly={true}><ListadoJoyas /></ProtectedRoute>} />
          <Route path="/nueva-joya" element={<ProtectedRoute adminOnly={true}><FormularioJoya /></ProtectedRoute>} />
          <Route path="/editar-joya/:id" element={<ProtectedRoute adminOnly={true}><FormularioJoya /></ProtectedRoute>} />
          <Route path="/joya/:id" element={<ProtectedRoute adminOnly={true}><DetalleJoya /></ProtectedRoute>} />
          <Route path="/movimientos" element={<ProtectedRoute adminOnly={true}><Movimientos /></ProtectedRoute>} />
          <Route path="/stock-bajo" element={<ProtectedRoute adminOnly={true}><StockBajo /></ProtectedRoute>} />
          <Route path="/reportes" element={<ProtectedRoute adminOnly={true}><Reportes /></ProtectedRoute>} />
          <Route path="/usuarios" element={<ProtectedRoute adminOnly={true}><Usuarios /></ProtectedRoute>} />
          <Route path="/nuevo-usuario" element={<ProtectedRoute adminOnly={true}><FormularioUsuario /></ProtectedRoute>} />
          <Route path="/editar-usuario/:id" element={<ProtectedRoute adminOnly={true}><FormularioUsuario /></ProtectedRoute>} />

          {/* Redirección por defecto */}
          <Route path="*" element={<Navigate to="/ventas" replace />} />
        </Routes>
      </div>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <SelectionProvider>
        <Router>
          <AppContent />
        </Router>
      </SelectionProvider>
    </AuthProvider>
  );
}

export default App;

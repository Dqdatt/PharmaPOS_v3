import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Login from './views/Login';
import POS from './views/POS';
import Inventory from './views/Inventory';
import Reports from './views/Reports';
import Imports from './views/Imports';
import Employees from './views/Employees';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        <Route element={<Layout />}>
          <Route path="/pos" element={<POS />} />
          <Route path="/inventory" element={<Inventory />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/imports" element={<Imports />} />
          <Route path="/employees" element={<Employees />} />
          
          {/* Default redirect to POS if logged in */}
          <Route path="/" element={<Navigate to="/pos" replace />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

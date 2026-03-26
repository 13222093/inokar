import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Dashboard } from './pages/Dashboard';
import { Portfolio } from './pages/Portfolio';
import { RiskAnalytics } from './pages/RiskAnalytics';
import { PropertyDetail } from './pages/PropertyDetail';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/portfolio" element={<Portfolio />} />
        <Route path="/portfolio/:id" element={<PropertyDetail />} />
        <Route path="/analytics" element={<RiskAnalytics />} />
        <Route path="/settings" element={<Dashboard />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;

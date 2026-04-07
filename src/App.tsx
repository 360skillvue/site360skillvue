import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import CertificationPage from './pages/CertificationPage';
import EntreprisesPage from './pages/EntreprisesPage';
import AssureursPage from './pages/AssureursPage';
import SPSTIPage from './pages/SPSTIPage';
import PartenairesPage from './pages/PartenairesPage';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/certification-periodique-sante" element={<CertificationPage />} />
        <Route path="/entreprises-drh" element={<EntreprisesPage />} />
        <Route path="/assureurs-mutuelles" element={<AssureursPage />} />
        <Route path="/spsti" element={<SPSTIPage />} />
        <Route path="/partenaires" element={<PartenairesPage />} />
      </Routes>
    </Router>
  );
}

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { App } from './App';
import { PropertiesProvider } from './hooks/useProperties';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PropertiesProvider>
      <App />
    </PropertiesProvider>
  </StrictMode>,
);

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { App } from './App';
import { PropertiesProvider } from './hooks/useProperties';
import { ToastProvider } from './hooks/useToast';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ToastProvider>
      <PropertiesProvider>
        <App />
      </PropertiesProvider>
    </ToastProvider>
  </StrictMode>,
);

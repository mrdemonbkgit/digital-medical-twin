import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { CorrelationProvider } from '@/context/CorrelationContext';
import { initSentry } from '@/lib/sentry';
import './styles/globals.css';

// Initialize Sentry before rendering
initSentry();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <CorrelationProvider>
      <App />
    </CorrelationProvider>
  </StrictMode>
);

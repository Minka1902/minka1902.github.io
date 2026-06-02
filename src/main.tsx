import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';
import { AuthProvider } from '@/contexts/AuthContext';
import { SessionModeProvider } from '@/contexts/SessionModeContext';
import { BusinessProvider } from '@/contexts/BusinessContext';
import { DogProvider } from '@/contexts/DogContext';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <SessionModeProvider>
        <BusinessProvider>
          <DogProvider>
            <App />
          </DogProvider>
        </BusinessProvider>
      </SessionModeProvider>
    </AuthProvider>
  </StrictMode>
);

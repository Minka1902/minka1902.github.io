import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';
import { AuthProvider } from '@/contexts/AuthContext';
import { OrgProvider } from '@/contexts/OrgContext';
import { DogProvider } from '@/contexts/DogContext';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <OrgProvider>
        <DogProvider>
          <App />
        </DogProvider>
      </OrgProvider>
    </AuthProvider>
  </StrictMode>
);

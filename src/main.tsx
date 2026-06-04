import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { AuthProvider } from './context/AuthContext.tsx';
import { PermissionProvider } from './context/PermissionContext.tsx';
import ErrorBoundary from './components/ErrorBoundary.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <AuthProvider>
        <PermissionProvider>
          <App />
        </PermissionProvider>
      </AuthProvider>
    </ErrorBoundary>
  </StrictMode>,
);

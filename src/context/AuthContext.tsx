import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, UserRole, Subscriber } from '../types';

interface LoginCredentials {
  email?: string;
  password?: string;
  subscriberId?: string;
  phone?: string;
  otp?: string;
  authMethod: 'email' | 'id' | 'phone';
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  login: (credentials: LoginCredentials, subscribers: Subscriber[]) => Promise<boolean>;
  logout: () => void;
  hasRole: (role: UserRole | UserRole[]) => boolean;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper to decode JWT payloads in client-side robustly without external dependencies
function decodeJwtPayload(token: string): any {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = parts[1];
    const decoded = window.atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(decoded);
  } catch (e) {
    console.error('Error decoding JWT Token client-side', e);
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize and verify session on load
  useEffect(() => {
    async function initSession() {
      const persistedToken = localStorage.getItem('akpbf_erp_token') || sessionStorage.getItem('akpbf_erp_token');
      if (!persistedToken) {
        setLoading(false);
        return;
      }

      try {
        // Attempt to verify with Server first
        const response = await fetch('/api/auth/me', {
          headers: {
            'Authorization': `Bearer ${persistedToken}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
          setToken(persistedToken);
        } else {
          // Fallback to local JWT parsing if server is booting or unreactive (resilience constraint)
          const payload = decodeJwtPayload(persistedToken);
          // Check if expired
          const nowSeconds = Math.floor(Date.now() / 1000);
          if (payload && (!payload.exp || payload.exp > nowSeconds)) {
            setUser({
              id: payload.id,
              name: payload.name,
              email: payload.email,
              role: payload.role as UserRole,
              phone: payload.phone,
              subscriberId: payload.subscriberId
            });
            setToken(persistedToken);
          } else {
            // Expired or corrupt token
            localStorage.removeItem('akpbf_erp_token');
            sessionStorage.removeItem('akpbf_erp_token');
          }
        }
      } catch (err) {
        console.warn('Backend server auth verification skipped/temporarily offline, parsing token locally', err);
        const payload = decodeJwtPayload(persistedToken);
        const nowSeconds = Math.floor(Date.now() / 1000);
        if (payload && (!payload.exp || payload.exp > nowSeconds)) {
          setUser({
            id: payload.id,
            name: payload.name,
            email: payload.email,
            role: payload.role as UserRole,
            phone: payload.phone,
            subscriberId: payload.subscriberId
          });
          setToken(persistedToken);
        }
      } finally {
        setLoading(false);
      }
    }

    initSession();
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const login = useCallback(async (credentials: LoginCredentials, subscribers: Subscriber[]): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      // 1. Attempt server-side login with password hashing and real JWT generation
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials)
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        setToken(data.token);
        // Persist token
        localStorage.setItem('akpbf_erp_token', data.token);
        localStorage.setItem('akpbf_user_role', data.user.role);
        setLoading(false);
        return true;
      } else {
        const errData = await response.json();
        throw new Error(errData.error || 'Identifiants ou méthode incorrecte.');
      }
    } catch (err: any) {
      console.error('Authentication attempt failed:', err);
      setError(err.message || "Erreur de connexion. Le serveur est injoignable ou l'authentification a échoué.");
      setLoading(false);
      return false;
    }
  }, []);

  const logout = useCallback(() => {
    // Secure selective and complete sanitization
    localStorage.removeItem('akpbf_erp_token');
    localStorage.removeItem('akpbf_user_role');
    sessionStorage.clear();
    
    try {
      window.history.replaceState(null, '', window.location.pathname + '#/login');
    } catch (e) {
      console.log('Browser history rewrite bypassed during secure logout', e);
    }

    setUser(null);
    setToken(null);
  }, []);

  const hasRole = useCallback((role: UserRole | UserRole[]): boolean => {
    if (!user) return false;
    if (Array.isArray(role)) {
      return role.includes(user.role);
    }
    return user.role === role;
  }, [user]);

  return (
    <AuthContext.Provider value={{
      user,
      token,
      isAuthenticated: !!user,
      loading,
      error,
      login,
      logout,
      hasRole,
      clearError
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

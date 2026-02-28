import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { adminService } from '@services/index';
import { AuthContextType } from '@app-types/index';
import { useApp } from '@context/AppContext';

// Crear el contexto
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Props del provider
interface AuthProviderProps {
  children: ReactNode;
}

/**
 * Provider de autenticación para el panel de administración.
 * IMPORTANTE: Debe estar anidado dentro de AppProvider para acceder a dbReady.
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const { dbReady } = useApp();
  
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isConfigured, setIsConfigured] = useState(false);
  const [loading, setLoading] = useState(true);

  /**
   * Verifica si el admin ya está configurado.
   */
  const checkIsConfigured = useCallback(async (): Promise<boolean> => {
    try {
      const configured = await adminService.isConfigured();
      setIsConfigured(configured);
      return configured;
    } catch (error) {
      console.error('[AuthContext] Error checking configuration:', error);
      return false;
    }
  }, []);

  /**
   * Inicializa el estado de autenticación cuando la DB está lista.
   */
  useEffect(() => {
    const init = async () => {
      if (!dbReady) {
        // Esperar a que la base de datos esté lista
        return;
      }
      
      setLoading(true);
      await checkIsConfigured();
      setLoading(false);
    };
    init();
  }, [dbReady, checkIsConfigured]);

  /**
   * Configura las credenciales del admin por primera vez.
   */
  const setupAdmin = async (username: string, password: string): Promise<boolean> => {
    const result = await adminService.setupAdmin(username, password);
    
    if (result.success) {
      setIsConfigured(true);
      setIsAuthenticated(true); // Auto-login después de setup
      return true;
    }
    
    return false;
  };

  /**
   * Inicia sesión con las credenciales proporcionadas.
   */
  const login = async (username: string, password: string): Promise<boolean> => {
    const result = await adminService.login(username, password);
    
    if (result.success) {
      setIsAuthenticated(true);
      return true;
    }
    
    return false;
  };

  /**
   * Cierra la sesión del administrador.
   */
  const logout = () => {
    setIsAuthenticated(false);
  };

  const value: AuthContextType = {
    isAuthenticated,
    isConfigured,
    loading: loading || !dbReady, // También mostrar loading si la DB no está lista
    login,
    logout,
    setupAdmin,
    checkIsConfigured,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook para usar el contexto de autenticación.
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }
  
  return context;
}

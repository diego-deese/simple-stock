import React, { createContext, useContext, useReducer, useEffect, useState, ReactNode } from 'react';
import { Product, Report, ReportDetail, TempCount, AppContextType, AppState, AppAction } from '@app-types/index';
import { initializeDatabase } from '@database/index';
import { productService, reportService, exportService } from '@services/index';

// Estado inicial
const initialState: AppState = {
  products: [],
  reports: [],
  tempCounts: [],
  loading: true,
  error: null,
};

// Reducer
function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };

    case 'SET_ERROR':
      return { ...state, error: action.payload };

    case 'SET_PRODUCTS':
      return { ...state, products: action.payload };

    case 'SET_REPORTS':
      return { ...state, reports: action.payload };

    case 'SET_TEMP_COUNTS':
      return { ...state, tempCounts: action.payload };

    case 'UPDATE_TEMP_COUNT':
      const existingIndex = state.tempCounts.findIndex(
        count => count.product_name === action.payload.product_name
      );

      if (existingIndex >= 0) {
        const updatedTempCounts = [...state.tempCounts];
        updatedTempCounts[existingIndex] = action.payload;
        return { ...state, tempCounts: updatedTempCounts };
      } else {
        return {
          ...state,
          tempCounts: [...state.tempCounts, action.payload],
        };
      }

    case 'CLEAR_TEMP_COUNTS':
      return { ...state, tempCounts: [] };

    case 'RESET_STATE':
      return initialState;

    default:
      return state;
  }
}

// Crear el contexto
const AppContext = createContext<AppContextType | undefined>(undefined);

// Provider del contexto
interface AppProviderProps {
  children: ReactNode;
}

export function AppProvider({ children }: AppProviderProps) {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const [dbReady, setDbReady] = useState(false);

  // Inicializar la base de datos al cargar la app
  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });

      // Inicializar base de datos (conexión + migraciones + seeds)
      await initializeDatabase();
      
      // Marcar la base de datos como lista
      setDbReady(true);

      // Cargar datos iniciales en paralelo
      await Promise.all([loadProducts(), loadReports(), loadTempCounts()]);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al inicializar la aplicación';
      console.error('[AppContext] Error de inicialización:', message);
      dispatch({ type: 'SET_ERROR', payload: message });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // ===========================================
  // FUNCIONES PARA PRODUCTOS
  // ===========================================

  const loadProducts = async () => {
    try {
      const products = await productService.getActiveProducts();
      dispatch({ type: 'SET_PRODUCTS', payload: products });
    } catch (error) {
      console.error('[AppContext] Error al cargar productos:', error);
    }
  };

  const addProduct = async (name: string, unit: string) => {
    try {
      await productService.createProduct(name, unit);
      await loadProducts(); // Recargar la lista
    } catch (error) {
      console.error('[AppContext] Error al agregar producto:', error);
      throw error;
    }
  };

  const updateProduct = async (id: number, name: string, unit: string) => {
    try {
      await productService.updateProduct(id, name, unit);
      await loadProducts(); // Recargar la lista
    } catch (error) {
      console.error('[AppContext] Error al actualizar producto:', error);
      throw error;
    }
  };

  const deleteProduct = async (id: number) => {
    try {
      await productService.deactivateProduct(id);
      await loadProducts(); // Recargar la lista
    } catch (error) {
      console.error('[AppContext] Error al eliminar producto:', error);
      throw error;
    }
  };

  // ===========================================
  // FUNCIONES PARA REPORTES
  // ===========================================

  const loadReports = async () => {
    try {
      const reports = await reportService.getAllReports();
      dispatch({ type: 'SET_REPORTS', payload: reports });
    } catch (error) {
      console.error('[AppContext] Error al cargar reportes:', error);
    }
  };

  const saveReport = async (tempCounts: TempCount[]) => {
    try {
      await reportService.saveReport(tempCounts);

      // Recargar reportes y limpiar conteos temporales
      await loadReports();
      dispatch({ type: 'CLEAR_TEMP_COUNTS' });
    } catch (error) {
      console.error('[AppContext] Error al guardar reporte:', error);
      throw error;
    }
  };

  const getReportDetails = async (reportId: number): Promise<ReportDetail[]> => {
    try {
      return await reportService.getReportDetails(reportId);
    } catch (error) {
      console.error('[AppContext] Error al obtener detalles del reporte:', error);
      throw error;
    }
  };

  // ===========================================
  // FUNCIONES PARA CONTEOS TEMPORALES
  // ===========================================

  const updateTempCount = (productName: string, quantity: number) => {
    const tempCount: TempCount = { product_name: productName, quantity };
    dispatch({ type: 'UPDATE_TEMP_COUNT', payload: tempCount });

    // Guardar en la base de datos de forma asíncrona
    reportService.saveTempCount(productName, quantity).catch((error: unknown) => {
      console.error('[AppContext] Error al guardar conteo temporal:', error);
    });
  };

  const clearTempCounts = () => {
    dispatch({ type: 'CLEAR_TEMP_COUNTS' });

    // Limpiar de la base de datos de forma asíncrona
    reportService.clearTempCounts().catch((error: unknown) => {
      console.error('[AppContext] Error al limpiar conteos temporales:', error);
    });
  };

  const loadTempCounts = async () => {
    try {
      const tempCounts = await reportService.getTempCounts();
      dispatch({ type: 'SET_TEMP_COUNTS', payload: tempCounts });
    } catch (error) {
      console.error('[AppContext] Error al cargar conteos temporales:', error);
    }
  };

  const saveTempCounts = async () => {
    try {
      await reportService.saveTempCounts(state.tempCounts);
    } catch (error) {
      console.error('[AppContext] Error al guardar conteos temporales:', error);
    }
  };

  // ===========================================
  // FUNCIONES DE EXPORTACIÓN
  // ===========================================

  const exportReport = async (reportId: number): Promise<string> => {
    try {
      return await exportService.exportReportToFile(reportId);
    } catch (error) {
      console.error('[AppContext] Error al exportar reporte:', error);
      throw error;
    }
  };

  const shareReport = async (reportId: number): Promise<void> => {
    try {
      await exportService.exportAndShareReport(reportId);
    } catch (error) {
      console.error('[AppContext] Error al compartir reporte:', error);
      throw error;
    }
  };

  // ===========================================
  // VALOR DEL CONTEXTO
  // ===========================================

  const contextValue: AppContextType = {
    // Estado
    products: state.products,
    reports: state.reports,
    tempCounts: state.tempCounts,
    loading: state.loading,
    error: state.error,
    dbReady,

    // Funciones para productos
    addProduct,
    updateProduct,
    deleteProduct,
    loadProducts,

    // Funciones para reportes
    saveReport,
    loadReports,
    getReportDetails,

    // Funciones para conteos temporales
    updateTempCount,
    clearTempCounts,
    loadTempCounts,
    saveTempCounts,

    // Funciones de exportación
    exportReport,
    shareReport,
  };

  return <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>;
}

// Hook personalizado para usar el contexto
export function useApp(): AppContextType {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp debe ser usado dentro de un AppProvider');
  }
  return context;
}

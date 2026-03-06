import React, { createContext, useContext, useReducer, useEffect, useState, useRef, ReactNode } from 'react';
import { Product, Category, Report, ReportDetail, TempCount, TempPedido, TempDesperdicio, InventoryWithProduct, BalanceMensual, MonthWithData, PedidosLoadSource, AppContextType, AppState, AppAction } from '@app-types/index';
import { initializeDatabase } from '@database/index';
import { productService, categoryService, inventoryService, reportService } from '@services/index';

// Estado inicial
const initialState: AppState = {
  products: [],
  categories: [],
  reports: [],
  tempCounts: [],
  tempPedidos: [],
  tempDesperdicio: [],
  inventory: [],
  loading: false,
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
    case 'SET_CATEGORIES':
      return { ...state, categories: action.payload };
    case 'SET_REPORTS':
      return { ...state, reports: action.payload };
    case 'SET_TEMP_COUNTS':
      return { ...state, tempCounts: action.payload };
    case 'UPDATE_TEMP_COUNT': {
      const updated = action.payload;
      const list = state.tempCounts.filter(c => c.product_name !== updated.product_name).concat(updated);
      return { ...state, tempCounts: list };
    }
    case 'CLEAR_TEMP_COUNTS':
      return { ...state, tempCounts: [] };
    case 'SET_TEMP_PEDIDOS':
      return { ...state, tempPedidos: action.payload };
    case 'UPDATE_TEMP_PEDIDO': {
      const updated = action.payload;
      const list = state.tempPedidos.filter(p => p.product_name !== updated.product_name).concat(updated);
      return { ...state, tempPedidos: list };
    }
    case 'CLEAR_TEMP_PEDIDOS':
      return { ...state, tempPedidos: [] };
    case 'SET_TEMP_DESPERDICIO':
      return { ...state, tempDesperdicio: action.payload };
    case 'UPDATE_TEMP_DESPERDICIO': {
      const updated = action.payload;
      const list = state.tempDesperdicio.filter(d => d.product_name !== updated.product_name).concat(updated);
      return { ...state, tempDesperdicio: list };
    }
    case 'CLEAR_TEMP_DESPERDICIO':
      return { ...state, tempDesperdicio: [] };
    case 'SET_INVENTORY':
      return { ...state, inventory: action.payload };
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
  const initStarted = useRef(false);

  // Función de ejemplo: Guardar desperdicio
  const saveDesperdicioReport = async (entries: TempDesperdicio[]): Promise<void> => {
    try {
      // Guardar reporte definitivo de desperdicio (valida contra entregas)
      await reportService.saveDesperdicioReport(entries);

      // Recargar listados de reportes para reflejar el nuevo reporte
      await contextValue.loadReports();

      // Después de guardar, limpiar temporales en estado
      dispatch({ type: 'CLEAR_TEMP_DESPERDICIO' });
    } catch (error) {
      console.error('[AppContext] Error al guardar el reporte de desperdicio:', error);
      throw error;
    }
  };

  // Inicializar la base de datos una sola vez y cargar datos iniciales
  useEffect(() => {
    if (initStarted.current) return;
    initStarted.current = true;

    (async () => {
      try {
        dispatch({ type: 'SET_LOADING', payload: true });
        await initializeDatabase();
        setDbReady(true);

        // Cargar datos iniciales en background
        await contextValue.loadProducts();
        await contextValue.loadCategories();
        await contextValue.loadTempCounts();
        await contextValue.loadTempPedidos();
        await contextValue.loadTempDesperdicio();
        await contextValue.loadInventory();
        await contextValue.loadReports();
      } catch (error) {
        console.error('[AppContext] Error initializing DB:', error);
        dispatch({ type: 'SET_ERROR', payload: String(error) });
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    })();
  }, []);

  const contextValue: AppContextType = {
    // Desperdicio management
    updateTempDesperdicio: (productName: string, quantity: number) => {
      dispatch({ type: 'UPDATE_TEMP_DESPERDICIO', payload: { product_name: productName, quantity } });
    },
    clearTempDesperdicio: () => {
      dispatch({ type: 'CLEAR_TEMP_DESPERDICIO' });
    },
    loadTempDesperdicio: async () => {
      const list = await reportService.getTempDesperdicio();
      dispatch({ type: 'SET_TEMP_DESPERDICIO', payload: list });
    },
    saveDesperdicioReport: saveDesperdicioReport,

    // Estado
    products: state.products,
    categories: state.categories,
    reports: state.reports,
    tempCounts: state.tempCounts,
    tempPedidos: state.tempPedidos,
    tempDesperdicio: state.tempDesperdicio,
    inventory: state.inventory,
    loading: state.loading,
    error: state.error,
    dbReady,

    // Productos
    addProduct: async (name: string, unit: string, categoryId?: number | null) => {
      await productService.createProduct(name, unit, categoryId);
      // reload products
      const products = await productService.getActiveProducts();
      dispatch({ type: 'SET_PRODUCTS', payload: products });

      // Recargar temporales desde la tabla de temporales para preservar
      // pedidos no guardados (si existían).
      let tempPedidosList: TempPedido[] = [];
      try {
        tempPedidosList = await reportService.getTempPedidos();
        dispatch({ type: 'SET_TEMP_PEDIDOS', payload: tempPedidosList });
      } catch (e) {
        // ignorar errores no críticos
      }

      // Si el producto creado/reativado tiene un pedido histórico pero no
      // existe en temporales, intentar recuperar la última cantidad registrada
      // en reportes (último detalle de tipo 'pedidos') para restaurar la cifra.
      try {
        const product = products.find(p => p.name === name);
        if (product) {
          const existingTemp = tempPedidosList.find(t => t.product_name === name);
          if (!existingTemp || existingTemp.quantity === 0) {
            const latest = await reportService.getLatestPedidoDetail(name);
            if (latest && latest.quantity > 0) {
              // Guardar como temporal y recargar lista
              await reportService.saveTempPedido(name, latest.quantity);
              const refreshed = await reportService.getTempPedidos();
              dispatch({ type: 'SET_TEMP_PEDIDOS', payload: refreshed });
            }
          }
        }
      } catch (e) {
        // ignorar errores no críticos
      }
    },
    updateProduct: async (id: number, name: string, unit: string, categoryId?: number | null) => {
      await productService.updateProduct(id, name, unit, categoryId);
    },
    deleteProduct: async (id: number) => {
      // Desactivar producto
      const product = await productService.getProductById(id);
      await productService.deactivateProduct(id);

      // Recargar productos activos para actualizar UI
      const products = await productService.getActiveProducts();
      dispatch({ type: 'SET_PRODUCTS', payload: products });

      // Nota: no borramos temporales (temp_pedidos/temp_counts) para preservar
      // cantidades si el producto se reactiva más tarde. Las pantallas omiten
      // automáticamente productos inactivos al renderizar.
    },
    loadProducts: async () => {
      const products = await productService.getActiveProducts();
      dispatch({ type: 'SET_PRODUCTS', payload: products });
    },

    // Categorías
    loadCategories: async () => {
      const categories = await categoryService.getAllCategories();
      dispatch({ type: 'SET_CATEGORIES', payload: categories });
    },
    addCategory: async (name: string) => {
      await categoryService.createCategory(name);
    },
    updateCategory: async (id: number, name: string) => {
      await categoryService.updateCategory(id, name);
    },
    deleteCategory: async (id: number) => {
      await categoryService.deactivateCategory(id);
    },

    // Reportes (entregas)
    saveEntregasReport: async (tempCounts: TempCount[]) => {
      await reportService.saveEntregasReport(tempCounts);
    },
    loadReports: async () => {
      const reports = await reportService.getAllReports();
      dispatch({ type: 'SET_REPORTS', payload: reports });
    },
    getReportDetails: async (reportId: number) => {
      return reportService.getReportDetails(reportId);
    },

    // Pedidos
    savePedidosReport: async (tempPedidos: TempPedido[]) => {
      await reportService.savePedidosReport(tempPedidos);
    },
    loadCurrentMonthPedidos: async () => {
      try {
        // Intentar cargar reporte de pedidos del mes actual
        const current = await reportService.getCurrentMonthPedidosReport();
        if (current) {
          const temp = current.details.map(d => ({ product_name: d.product_name, quantity: d.quantity }));
          // Actualizar estado y persistir temporales para recuperación si la app se cierra
          dispatch({ type: 'SET_TEMP_PEDIDOS', payload: temp });
          await reportService.saveTempPedidos(temp);
          return 'current' as const;
        }

        // Si no existe, intentar cargar del mes anterior y copiarlo como temporales
        const previous = await reportService.getPreviousMonthPedidosReport();
        if (previous) {
          const tempPrev = previous.details.map(d => ({ product_name: d.product_name, quantity: d.quantity }));
          dispatch({ type: 'SET_TEMP_PEDIDOS', payload: tempPrev });
          await reportService.saveTempPedidos(tempPrev);
          return 'previous' as const;
        }

        // No hay datos
        dispatch({ type: 'SET_TEMP_PEDIDOS', payload: [] });
        return 'none' as const;
      } catch (error) {
        console.error('[AppContext] Error cargando pedidos del mes actual:', error);
        // En caso de error, no derribar la app; devolver 'none'
        return 'none' as const;
      }
    },

    // Temp counts
    updateTempCount: (productName: string, quantity: number) => {
      dispatch({ type: 'UPDATE_TEMP_COUNT', payload: { product_name: productName, quantity } as TempCount });
    },
    clearTempCounts: () => dispatch({ type: 'CLEAR_TEMP_COUNTS' }),
    loadTempCounts: async () => {
      const list = await reportService.getTempCounts();
      dispatch({ type: 'SET_TEMP_COUNTS', payload: list });
    },
    saveTempCounts: async () => {
      // Intentionally left as noop; use saveEntregasReport
    },

    // Temp pedidos
    updateTempPedido: (productName: string, quantity: number) => {
      dispatch({ type: 'UPDATE_TEMP_PEDIDO', payload: { product_name: productName, quantity } as TempPedido });
    },
    clearTempPedidos: () => dispatch({ type: 'CLEAR_TEMP_PEDIDOS' }),
    loadTempPedidos: async () => {
      const list = await reportService.getTempPedidos();
      dispatch({ type: 'SET_TEMP_PEDIDOS', payload: list });
    },
    saveTempPedidos: async () => {
      // noop
    },

    // Balance mensual
    loadInventory: async () => {
      const inv = await inventoryService.getAllInventory();
      dispatch({ type: 'SET_INVENTORY', payload: inv });
    },
    getBalanceMensual: async (year: number, month: number) => {
      return inventoryService.getBalanceMensual(year, month);
    },
    getMonthsWithData: async () => {
      return inventoryService.getMonthsWithData();
    },

    // Export
    exportReport: async (reportId: number) => {
      // fallback placeholder
      return 'report.csv';
    },
    shareReport: async () => {},
  };

  return <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextType {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp debe ser usado dentro de un AppProvider');
  }
  return context;
}

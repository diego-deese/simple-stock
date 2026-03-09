import React, { createContext, useContext, useReducer, useEffect, useState, useRef, useCallback, ReactNode } from 'react';
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

  // Helper: patch products in memory when a category changes so UI updates
  const patchProductsForCategoryChange = (categoryId: number, categoryName: string | null) => {
    try {
      const updated = state.products.map((p: Product) => {
        if (p.category_id === categoryId) {
          return { ...p, category_id: categoryName ? categoryId : null, category_name: categoryName ?? null } as Product;
        }
        return p;
      });
      dispatch({ type: 'SET_PRODUCTS', payload: updated });
    } catch (e) {
      console.error('[AppContext] patchProductsForCategoryChange failed', e);
    }
  };

  // Helper: patch a single product in state (useful after product edit)
  const patchSingleProductInState = (product: Product) => {
    try {
      const updated = state.products.map((p: Product) => (p.id === product.id ? product : p));
      dispatch({ type: 'SET_PRODUCTS', payload: updated });
    } catch (e) {
      console.error('[AppContext] patchSingleProductInState failed', e);
    }
  };

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

  // memoized helpers to avoid changing identity on every render
  const loadCurrentMonthPedidos = useCallback(async (): Promise<PedidosLoadSource> => {
    try {
      const current = await reportService.getCurrentMonthPedidosReport();
      if (current) {
        const temp = current.details.map(d => ({ product_name: d.product_name, quantity: d.quantity }));
        dispatch({ type: 'SET_TEMP_PEDIDOS', payload: temp });
        await reportService.saveTempPedidos(temp);
        return 'current';
      }

      const previous = await reportService.getPreviousMonthPedidosReport();
      if (previous) {
        const tempPrev = previous.details.map(d => ({ product_name: d.product_name, quantity: d.quantity }));
        dispatch({ type: 'SET_TEMP_PEDIDOS', payload: tempPrev });
        await reportService.saveTempPedidos(tempPrev);
        return 'previous';
      }

      dispatch({ type: 'SET_TEMP_PEDIDOS', payload: [] });
      return 'none';
    } catch (error) {
      console.error('[AppContext] Error cargando pedidos del mes actual:', error);
      return 'none';
    }
  }, []);

  const updateTempPedido = useCallback(async (productName: string, quantity: number) => {
    dispatch({ type: 'UPDATE_TEMP_PEDIDO', payload: { product_name: productName, quantity } as TempPedido });
    try {
      if (quantity <= 0) {
        await reportService.removeTempPedido(productName);
      } else {
        await reportService.saveTempPedido(productName, quantity);
      }
    } catch (e) {
      console.error('[AppContext] failed to persist temp pedido', e);
    }
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

      // Update the product in memory to reflect category changes immediately.
      try {
        // Find existing product in state
        const existing = state.products.find(p => p.id === id);
        const categoryObj = state.categories.find(c => c.id === categoryId) || null;

        if (existing) {
          const updatedProduct: Product = {
            ...existing,
            name,
            unit,
            category_id: categoryId ?? null,
            category_name: categoryObj ? categoryObj.name : undefined,
          };
          patchSingleProductInState(updatedProduct);
        } else {
          // If we don't have it in state, fallback to reloading products
          const products = await productService.getActiveProducts();
          dispatch({ type: 'SET_PRODUCTS', payload: products });
        }
      } catch (e) {
        console.error('[AppContext] updateProduct: failed to patch product in state', e);
      }
    },
    deleteProduct: async (id: number) => {
      // Desactivar producto
      const product = await productService.getProductById(id);
      await productService.deactivateProduct(id);

      // Recargar productos activos para actualizar UI
      const products = await productService.getActiveProducts();
      dispatch({ type: 'SET_PRODUCTS', payload: products });

      // Nota: no borramos temporales (temp_pedidos/temp_entregas) para preservar
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
      // Debug: log loaded categories to help trace UI reload issues
      dispatch({ type: 'SET_CATEGORIES', payload: categories });
      // Also refresh products so views that include category_name react to changes
      try {
        const products = await productService.getActiveProducts();
        dispatch({ type: 'SET_PRODUCTS', payload: products });
      } catch (e) {
        console.error('[AppContext] loadCategories: failed to reload products after categories changed', e);
      }
    },
    addCategory: async (name: string) => {
      // createCategory may reactivate an existing inactive category; it returns id
      const createdId = await categoryService.createCategory(name);

      // reload categories in state
      const categories = await categoryService.getAllCategories();
      dispatch({ type: 'SET_CATEGORIES', payload: categories });

      // If a category was reactivated or created with id, and there are products
      // that belonged to it, patch them in memory instead of reloading everything.
      try {
        // find the resulting category object
        const resulting = categories.find(c => c.id === createdId);
        if (resulting) {
          patchProductsForCategoryChange(resulting.id, resulting.name);
        } else {
          // fallback: reload products
          const products = await productService.getActiveProducts();
          dispatch({ type: 'SET_PRODUCTS', payload: products });
        }
      } catch (e) {
        console.error('[AppContext] addCategory: patch/reactivation failed, reloading products', e);
        const products = await productService.getActiveProducts();
        dispatch({ type: 'SET_PRODUCTS', payload: products });
      }
    },
    updateCategory: async (id: number, name: string) => {
      await categoryService.updateCategory(id, name);
      const categories = await categoryService.getAllCategories();
      dispatch({ type: 'SET_CATEGORIES', payload: categories });

      // patch products in memory to update category_name for products with this category
      patchProductsForCategoryChange(id, name);
    },
    deleteCategory: async (id: number) => {
      await categoryService.deactivateCategory(id);
      // Reload categories into state
      const categories = await categoryService.getAllCategories();
      dispatch({ type: 'SET_CATEGORIES', payload: categories });

      // patch products in memory: remove category_name for products that had this id
      patchProductsForCategoryChange(id, null);

      // Debug: verify the category active flag in DB after soft-delete
      try {
        const cat = await categoryService.getCategoryById(id);
        console.debug('[AppContext] deleteCategory: post-delete category row:', id, cat);
      } catch (e) {
        console.error('[AppContext] deleteCategory: failed to fetch category after delete', e);
      }
    },

    // Reportes (entregas)
    saveEntregasReport: async (tempCounts: TempCount[], relatedReportId?: number | null) => {
      await reportService.saveEntregasReport(tempCounts, relatedReportId ?? null);
      // refresh global report list so history UI updates immediately
      const reports = await reportService.getAllReports();
      dispatch({ type: 'SET_REPORTS', payload: reports });
    },
    loadReports: async () => {
      const reports = await reportService.getAllReports();
      dispatch({ type: 'SET_REPORTS', payload: reports });
    },
    getReportDetails: async (reportId: number) => {
      return reportService.getReportDetails(reportId);
    },

    // Pedidos
    savePedidosReport: async (tempPedidos: TempPedido[], reportIdToEdit?: number | null) => {
      const id = await reportService.savePedidosReport(tempPedidos, reportIdToEdit ?? null);
      // reload reports after saving so history screen sees the new entry
      const reports = await reportService.getAllReports();
      dispatch({ type: 'SET_REPORTS', payload: reports });
      return id;
    },
    setTempPedidos: (tempPedidos: TempPedido[]) => {
      dispatch({ type: 'SET_TEMP_PEDIDOS', payload: tempPedidos });
    },
    // placeholder, replaced by stable callbacks defined below
    loadCurrentMonthPedidos: async () => 'none' as const,

    // Temp counts
    updateTempCount: async (productName: string, quantity: number) => {
      // Optimistically update state so UI stays snappy
      dispatch({ type: 'UPDATE_TEMP_COUNT', payload: { product_name: productName, quantity } as TempCount });
      try {
        if (quantity <= 0) {
          await reportService.removeTempCount(productName);
        } else {
          await reportService.saveTempCount(productName, quantity);
        }
      } catch (e) {
        console.error('[AppContext] failed to persist temp count', e);
      }
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
    updateTempPedido,
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
    shareReport: async () => { },
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

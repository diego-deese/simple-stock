// ===========================================
// MODELOS DE ENTIDADES (Entities)
// ===========================================

/**
 * Categoría de productos.
 * Permite agrupar productos en la pantalla de entregas.
 */
export interface Category {
  id: number;
  name: string;
  sort_order: number;
  active: boolean;
  created_at?: string;
  updated_at?: string;
}

/**
 * Producto del inventario.
 * Los productos pueden ser desactivados (borrado lógico) para mantener
 * la integridad de los reportes históricos.
 */
export interface Product {
  id: number;
  name: string;
  unit: string;
  active: boolean;
  category_id: number | null;
  category_name?: string; // Incluido en queries con JOIN
  created_at?: string;
  updated_at?: string;
}

/**
 * Reporte mensual de inventario.
 */
export interface Report {
  id: number;
  date: string; // ISO string format
  type: MovementType; // 'entregas' o 'pedidos'
  related_report_id?: number | null; // opcional: para vincular entregas a un pedido
  synced?: boolean; // marcado cuando el reporte ha sido enviado al servidor
  created_at?: string;
}

/**
 * Detalle de un reporte (línea de producto).
 */
export interface ReportDetail {
  id: number;
  report_id: number;
  product_name: string;
  quantity: number;
  created_at?: string;
}

/**
 * Conteo temporal durante el uso de la app.
 * Se persiste para recuperar datos si la app se cierra antes de guardar.
 */
export interface TempCount {
  product_name: string;
  quantity: number;
  updated_at?: string;
}

// ===========================================
// TIPOS DE MOVIMIENTOS (PEDIDOS VS ENTREGAS)
// ===========================================

/**
 * Tipo de movimiento en el sistema.
 * - pedidos: Lo que cocina necesita/pide al proveedor
 * - entregas: Cargamentos que el proveedor entrega
 */
export type MovementType = 'pedidos' | 'entregas' | 'desperdicio';

/**
 * Registro de inventario actual de un producto.
 */
export interface Inventory {
  id: number;
  product_id: number;
  product_name: string;
  current_quantity: number;
  last_entry_date: string | null;
  last_output_date: string | null;
  updated_at?: string;
}

/**
 * Inventario con información extendida del producto.
 */
export interface InventoryWithProduct extends Inventory {
  unit: string;
  category_id: number | null;
  category_name?: string;
  product_active: boolean;
}

/**
 * Pedido temporal durante las entregas (similar a TempCount).
 */

/**
 * Desperdicio temporal durante las entregas (similar a TempPedido).
 */
export interface TempDesperdicio {
  product_name: string;
  quantity: number;
  updated_at?: string;
}
export interface TempPedido {
  product_name: string;
  quantity: number;
  updated_at?: string;
}

/**
 * Balance mensual de un producto (pedido vs entregas).
 */
export interface BalanceMensual {
  product_id: number;
  product_name: string;
  unit: string;
  category_name?: string;
  total_pedidos: number;   // Lo que se pidió
  total_entregas: number;  // Lo que llegó
  total_desperdicio: number; // Lo que se desperdició
  diferencia: number;      // Entregas - Pedidos - Desperdicio
  diferencia_sin_desperdicio: number; // Entregas - Pedidos
}

/**
 * Mes con datos registrados (para el selector de meses).
 */
export interface MonthWithData {
  year: number;
  month: number;
}

/**
 * Indica de dónde se cargaron los pedidos al iniciar el mes.
 */
export type PedidosLoadSource = 'current' | 'previous' | 'none';

// ===========================================
// DTOs (Data Transfer Objects)
// ===========================================

/**
 * DTO para crear un nuevo producto.
 */
export interface CreateProductDTO {
  name: string;
  unit: string;
  category_id?: number | null;
}

/**
 * DTO para actualizar un producto.
 */
export interface UpdateProductDTO {
  name?: string;
  unit?: string;
  active?: boolean;
  category_id?: number | null;
}

/**
 * DTO para crear una categoría.
 */
export interface CreateCategoryDTO {
  name: string;
  sort_order?: number;
}

/**
 * DTO para actualizar una categoría.
 */
export interface UpdateCategoryDTO {
  name?: string;
  sort_order?: number;
  active?: boolean;
}

/**
 * Sección de productos agrupados por categoría.
 * Usado para renderizar SectionList en la pantalla de entregas.
 */
export interface ProductSection {
  title: string;
  categoryId: number | null;
  data: Product[];
}

/**
 * DTO para crear un reporte con sus detalles.
 */
export interface CreateReportDTO {
  counts: TempCount[];
  type?: MovementType; // Por defecto 'entregas'
}

/**
 * Reporte con todos sus detalles incluidos.
 */
export interface ReportWithDetails {
  report: Report;
  details: ReportDetail[];
}

/**
 * Resumen de un reporte (para listados).
 */
export interface ReportSummary {
  id: number;
  date: string;
  type: MovementType;
  totalItems: number;
  totalQuantity: number;
}

// ===========================================
// TIPOS DE RESPUESTA DE SERVICIOS
// ===========================================

/**
 * Resultado de operación genérico.
 */
export interface ServiceResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Resultado de operación con ID generado.
 */
export interface CreateResult {
  success: boolean;
  id?: number;
  error?: string;
}

// ===========================================
// TIPOS DE NAVEGACIÓN
// ===========================================

export type RootStackParamList = {
  MonthlyReport: undefined;
  CatalogManagement: undefined;
  ReportHistory: undefined;
  ReportDetails: { reportId: number };
};

// ===========================================
// TIPOS DEL CONTEXTO DE LA APLICACIÓN
// ===========================================

/**
 * Estado del contexto de la aplicación.
 */
export interface AppState {
  products: Product[];
  categories: Category[];
  reports: Report[];
  tempCounts: TempCount[];
  tempPedidos: TempPedido[];
  tempDesperdicio: TempDesperdicio[];
  inventory: InventoryWithProduct[];
  loading: boolean;
  error: string | null;
}

/**
 * Acciones disponibles en el contexto.
 */
export type AppAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_PRODUCTS'; payload: Product[] }
  | { type: 'SET_CATEGORIES'; payload: Category[] }
  | { type: 'SET_REPORTS'; payload: Report[] }
  | { type: 'SET_TEMP_COUNTS'; payload: TempCount[] }
  | { type: 'UPDATE_TEMP_COUNT'; payload: TempCount }
  | { type: 'CLEAR_TEMP_COUNTS' }
  | { type: 'SET_TEMP_PEDIDOS'; payload: TempPedido[] } 
  | { type: 'UPDATE_TEMP_PEDIDO'; payload: TempPedido } 
  | { type: 'CLEAR_TEMP_PEDIDOS' }
  | { type: 'SET_TEMP_DESPERDICIO'; payload: TempDesperdicio[] }
  | { type: 'UPDATE_TEMP_DESPERDICIO'; payload: TempDesperdicio }
  | { type: 'CLEAR_TEMP_DESPERDICIO' }
  | { type: 'SET_INVENTORY'; payload: InventoryWithProduct[] }
  | { type: 'RESET_STATE' };

/**
 * Interfaz del contexto de la aplicación.
 */
export interface AppContextType {
  // Desperdicio management
  updateTempDesperdicio: (productName: string, quantity: number) => void;
  clearTempDesperdicio: () => void;
  loadTempDesperdicio: () => Promise<void>;
  saveDesperdicioReport: (entries: TempDesperdicio[]) => Promise<void>;
  // Estado
  products: Product[];
  categories: Category[];
  reports: Report[];
  tempCounts: TempCount[];
  tempPedidos: TempPedido[];
  tempDesperdicio: TempDesperdicio[];
  inventory: InventoryWithProduct[];
  loading: boolean;
  error: string | null;
  dbReady: boolean; // Indica si la base de datos está inicializada
  
  // Funciones para productos
  addProduct: (name: string, unit: string, categoryId?: number | null) => Promise<void>;
  updateProduct: (id: number, name: string, unit: string, categoryId?: number | null) => Promise<void>;
  deleteProduct: (id: number) => Promise<void>;
  loadProducts: () => Promise<void>;
  
  // Funciones para categorías
  loadCategories: () => Promise<void>;
  addCategory: (name: string) => Promise<void>;
  updateCategory: (id: number, name: string) => Promise<void>;
  deleteCategory: (id: number) => Promise<void>;
  
  // Funciones para reportes (entregas)
  saveEntregasReport: (tempCounts: TempCount[], relatedReportId?: number | null) => Promise<void>;
  loadReports: () => Promise<void>;
  getReportDetails: (reportId: number) => Promise<ReportDetail[]>;
  
  // Funciones para pedidos
  savePedidosReport: (tempPedidos: TempPedido[], reportIdToEdit?: number | null) => Promise<number>;
  loadCurrentMonthPedidos: () => Promise<PedidosLoadSource>;
  
  // Funciones para conteo temporal (entregas)
  updateTempCount: (productName: string, quantity: number) => Promise<void>;
  clearTempCounts: () => void;
  loadTempCounts: () => Promise<void>;
  saveTempCounts: () => Promise<void>;
  
  // Funciones para pedidos temporales
  updateTempPedido: (productName: string, quantity: number) => Promise<void>;
  clearTempPedidos: () => void;
  loadTempPedidos: () => Promise<void>;
  saveTempPedidos: () => Promise<void>;
  // Reemplaza la lista de pedidos temporales en el estado (útil para editar un reporte específico)
  setTempPedidos: (tempPedidos: TempPedido[]) => void;
  
  // Funciones para balance mensual
  loadInventory: () => Promise<void>;
  getBalanceMensual: (year: number, month: number) => Promise<BalanceMensual[]>;
  getMonthsWithData: () => Promise<MonthWithData[]>;
  
  // Funciones de exportación
  exportReport: (reportId: number) => Promise<string>;
  shareReport: (reportId: number) => Promise<void>;
}

// ===========================================
// TIPOS PARA BASE DE DATOS
// ===========================================

/**
 * Estado de migración.
 */
export interface MigrationStatus {
  current: number;
  latest: number;
  pending: number;
}

/**
 * Registro de migración aplicada.
 */
export interface MigrationRecord {
  version: number;
  name: string;
  applied_at: string;
}

// ===========================================
// TIPOS DE AUTENTICACIÓN ADMIN
// ===========================================

/**
 * Credenciales de administrador almacenadas en la base de datos.
 */
export interface AdminCredentials {
  id: number;
  username: string;
  password_hash: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * DTO para crear/actualizar credenciales de admin.
 */
export interface SetupAdminDTO {
  username: string;
  password: string;
}

/**
 * DTO para login de admin.
 */
export interface LoginAdminDTO {
  username: string;
  password: string;
}

/**
 * Estado de autenticación.
 */
export interface AuthState {
  isAuthenticated: boolean;
  isConfigured: boolean; // Si ya se configuraron las credenciales
  loading: boolean;
}

/**
 * Interfaz del contexto de autenticación.
 */
export interface AuthContextType {
  isAuthenticated: boolean;
  isConfigured: boolean;
  loading: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  setupAdmin: (username: string, password: string) => Promise<boolean>;
  checkIsConfigured: () => Promise<boolean>;
}

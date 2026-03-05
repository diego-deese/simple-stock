import { inventoryRepository } from '@repositories/InventoryRepository';
import { InventoryWithProduct, BalanceMensual, MonthWithData } from '@app-types/index';

/**
 * Servicio para la lógica de negocio del balance mensual.
 * 
 * Modelo "Pedidos vs Entregas":
 * - Pedidos: Lo que cocina necesita del proveedor
 * - Entregas: Lo que el proveedor entrega
 * - Balance: Entregas - Pedidos (positivo = completo, negativo = faltante)
 * 
 * Cada mes es independiente - no hay acumulación de stock entre meses.
 */
class InventoryService {
  /**
   * Obtiene todo el inventario con información de productos.
   */
  async getAllInventory(): Promise<InventoryWithProduct[]> {
    return inventoryRepository.getAllWithProducts();
  }

  /**
   * Obtiene solo productos con stock disponible.
   */
  async getInventoryWithStock(): Promise<InventoryWithProduct[]> {
    return inventoryRepository.getWithStock();
  }

   /**
    * Obtiene el balance mensual (pedidos vs entregas).
    * @param year Año del balance
    * @param month Mes del balance (1-12)
    */
  async getBalanceMensual(year: number, month: number): Promise<BalanceMensual[]> {
    return inventoryRepository.getBalanceMensual(year, month);
  }

  /**
   * Obtiene la lista de meses que tienen datos registrados.
   */
  async getMonthsWithData(): Promise<MonthWithData[]> {
    return inventoryRepository.getMonthsWithData();
  }

  /**
   * Obtiene la cantidad actual de un producto.
   */
  async getProductQuantity(productId: number): Promise<number> {
    return inventoryRepository.getCurrentQuantity(productId);
  }

  /**
   * Verifica si hay stock suficiente para una salida.
   * Nota: En el modelo Pedidos vs Entregas, esto podría no ser necesario
   * ya que no se rastrea stock acumulado.
   */
  async hasEnoughStock(productId: number, requestedAmount: number): Promise<boolean> {
    return inventoryRepository.hasEnoughStock(productId, requestedAmount);
  }

  /**
   * Sincroniza el inventario recalculando desde los reportes.
   * Útil si hay inconsistencias.
   */
  async syncInventory(): Promise<void> {
    await inventoryRepository.syncFromReports();
  }

  /**
   * Obtiene productos con stock bajo (menos del umbral).
   */
  async getLowStockProducts(threshold: number = 5): Promise<InventoryWithProduct[]> {
    const inventory = await inventoryRepository.getAllWithProducts();
    return inventory.filter(item => 
      item.current_quantity > 0 && item.current_quantity <= threshold
    );
  }

  /**
   * Obtiene productos sin stock.
   */
  async getOutOfStockProducts(): Promise<InventoryWithProduct[]> {
    const inventory = await inventoryRepository.getAllWithProducts();
    return inventory.filter(item => item.current_quantity <= 0);
  }
}

// Exportar instancia singleton
export const inventoryService = new InventoryService();

import { BaseRepository } from './BaseRepository';
import { Inventory, InventoryWithProduct, BalanceMensual, MonthWithData } from '@app-types/index';

/**
 * Repositorio para el inventario y balance mensual.
 * Maneja la comparación entre pedidos y entregas.
 */
class InventoryRepository extends BaseRepository<Inventory> {
  constructor() {
    super('inventory', 'id');
  }

  /**
   * Obtiene o crea un registro de inventario para un producto.
   */
  async getOrCreate(productId: number, productName: string): Promise<Inventory> {
    const existing = await this.findOneWhere({ product_id: productId } as Partial<Record<keyof Inventory, unknown>>);
    
    if (existing) {
      return existing;
    }
    
    // Crear nuevo registro con cantidad inicial 0
    const id = await this.insert({
      product_id: productId,
      product_name: productName,
      current_quantity: 0,
      last_entry_date: null,
      last_output_date: null,
    } as Omit<Inventory, 'id'>);
    
    return {
      id,
      product_id: productId,
      product_name: productName,
      current_quantity: 0,
      last_entry_date: null,
      last_output_date: null,
    };
  }

  /**
   * Obtiene el inventario por ID de producto.
   */
  async getByProductId(productId: number): Promise<Inventory | null> {
    return this.findOneWhere({ product_id: productId } as Partial<Record<keyof Inventory, unknown>>);
  }

   /**
    * Incrementa la cantidad de un producto (entregas).
    */
  async addQuantity(productId: number, productName: string, amount: number): Promise<void> {
    const inventory = await this.getOrCreate(productId, productName);
    const newQuantity = inventory.current_quantity + amount;
    
    await this.update(inventory.id, {
      current_quantity: newQuantity,
      last_entry_date: new Date().toISOString(),
    } as Partial<Inventory>);
  }

   /**
    * Decrementa la cantidad de un producto (pedido registrado).
    * No permite cantidades negativas.
    */
  async subtractQuantity(productId: number, productName: string, amount: number): Promise<{ success: boolean; newQuantity: number }> {
    const inventory = await this.getOrCreate(productId, productName);
    const newQuantity = Math.max(0, inventory.current_quantity - amount);
    
    await this.update(inventory.id, {
      current_quantity: newQuantity,
      last_output_date: new Date().toISOString(),
    } as Partial<Inventory>);
    
    return { 
      success: true, 
      newQuantity 
    };
  }

  /**
   * Obtiene todo el inventario con información de productos.
   */
  async getAllWithProducts(): Promise<InventoryWithProduct[]> {
    const sql = `
      SELECT 
        i.*,
        p.unit,
        p.category_id,
        c.name as category_name,
        p.active as product_active
      FROM inventory i
      INNER JOIN products p ON i.product_id = p.id
      LEFT JOIN categories c ON p.category_id = c.id
      ORDER BY c.sort_order, p.name
    `;
    
    return this.rawQuery<InventoryWithProduct>(sql);
  }

  /**
   * Obtiene solo productos con stock mayor a cero.
   */
  async getWithStock(): Promise<InventoryWithProduct[]> {
    const sql = `
      SELECT 
        i.*,
        p.unit,
        p.category_id,
        c.name as category_name,
        p.active as product_active
      FROM inventory i
      INNER JOIN products p ON i.product_id = p.id
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE i.current_quantity > 0
      ORDER BY c.sort_order, p.name
    `;
    
    return this.rawQuery<InventoryWithProduct>(sql);
  }

   /**
    * Obtiene el balance mensual calculado desde los reportes.
    * Compara pedidos vs entregas para un mes específico.
    * @param year - Año (ej: 2026)
    * @param month - Mes (1-12)
    */
  async getBalanceMensual(year: number, month: number): Promise<BalanceMensual[]> {
    // Calcular rango de fechas del mes
    const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
    const endDate = month === 12 
      ? `${year + 1}-01-01`
      : `${year}-${(month + 1).toString().padStart(2, '0')}-01`;
    
    const sql = `
      SELECT 
        p.id as product_id,
        p.name as product_name,
        p.unit,
        c.name as category_name,
        COALESCE(pedidos.total, 0) as total_pedidos,
        COALESCE(entregas.total, 0) as total_entregas,
         COALESCE(entregas.total, 0) - COALESCE(pedidos.total, 0) as diferencia_sin_desperdicio,
         COALESCE(entregas.total, 0) - COALESCE(pedidos.total, 0) - COALESCE(desperdicios.total, 0) as diferencia,
         COALESCE(desperdicios.total, 0) as total_desperdicio

       FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN (
        SELECT rd.product_name, SUM(rd.quantity) as total
        FROM report_details rd
        INNER JOIN reports r ON rd.report_id = r.id
        WHERE r.type = 'pedidos'
          AND r.date >= ?
          AND r.date < ?
        GROUP BY rd.product_name
      ) pedidos ON pedidos.product_name = p.name
      LEFT JOIN (
        SELECT rd.product_name, SUM(rd.quantity) as total
        FROM report_details rd
        INNER JOIN reports r ON rd.report_id = r.id
        WHERE r.type = 'entregas'
          AND r.date >= ?
          AND r.date < ?
        GROUP BY rd.product_name
      ) entregas ON entregas.product_name = p.name
      LEFT JOIN (
        SELECT rd.product_name, SUM(rd.quantity) as total
        FROM report_details rd
        INNER JOIN reports r ON rd.report_id = r.id
        WHERE r.type = 'desperdicio'
          AND r.date >= ?
          AND r.date < ?
        GROUP BY rd.product_name
      ) desperdicios ON desperdicios.product_name = p.name
      WHERE p.active = 1
        AND (pedidos.total > 0 OR entregas.total > 0 OR desperdicios.total > 0)
      ORDER BY c.sort_order, p.name
    `;

    const results = await this.rawQuery<BalanceMensual>(
      sql,
      [startDate, endDate, startDate, endDate, startDate, endDate]
    );


    return results;
  }

  /**
   * Obtiene los meses que tienen datos registrados.
   * Retorna lista de {year, month} ordenados descendentemente.
   */
  async getMonthsWithData(): Promise<MonthWithData[]> {
    const sql = `
      SELECT DISTINCT 
        CAST(strftime('%Y', date) AS INTEGER) as year,
        CAST(strftime('%m', date) AS INTEGER) as month
      FROM reports
      ORDER BY year DESC, month DESC
    `;
    
    return this.rawQuery<MonthWithData>(sql);
  }

  /**
   * Sincroniza la tabla inventory con los datos calculados de los reportes.
   * Útil para reconstruir el inventario si hay inconsistencias.
   */
  async syncFromReports(): Promise<void> {
    // Obtener todos los meses con datos
    const months = await this.getMonthsWithData();
    
    // Calcular balance acumulado (todos los meses)
    const sql = `
      SELECT 
        p.id as product_id,
        p.name as product_name,
         COALESCE(entregas.total, 0) - COALESCE(pedidos.total, 0) - COALESCE(desperdicios.total, 0) as balance,
         COALESCE(desperdicios.total, 0) as total_desperdicio

       FROM products p
      LEFT JOIN (
        SELECT rd.product_name, SUM(rd.quantity) as total
        FROM report_details rd
        INNER JOIN reports r ON rd.report_id = r.id
        WHERE r.type = 'pedidos'
        GROUP BY rd.product_name
      ) pedidos ON pedidos.product_name = p.name
      LEFT JOIN (
        SELECT rd.product_name, SUM(rd.quantity) as total
        FROM report_details rd
        INNER JOIN reports r ON rd.report_id = r.id
        WHERE r.type = 'entregas'
        GROUP BY rd.product_name
      ) entregas ON entregas.product_name = p.name
      LEFT JOIN (
        SELECT rd.product_name, SUM(rd.quantity) as total
        FROM report_details rd
        INNER JOIN reports r ON rd.report_id = r.id
        WHERE r.type = 'desperdicio'
        GROUP BY rd.product_name
      ) desperdicios ON desperdicios.product_name = p.name
      WHERE p.active = 1
    `;
    
    const balances = await this.rawQuery<{ product_id: number; product_name: string; balance: number }>(sql);
    
    for (const balance of balances) {
      const existing = await this.getByProductId(balance.product_id);
      
      if (existing) {
        await this.update(existing.id, {
          current_quantity: balance.balance,
          product_name: balance.product_name,
        } as Partial<Inventory>);
      } else if (balance.balance !== 0) {
        await this.insert({
          product_id: balance.product_id,
          product_name: balance.product_name,
          current_quantity: balance.balance,
          last_entry_date: null,
          last_output_date: null,
        } as Omit<Inventory, 'id'>);
      }
    }
  }

  /**
   * Obtiene la cantidad actual de un producto.
   */
  async getCurrentQuantity(productId: number): Promise<number> {
    const inventory = await this.getByProductId(productId);
    return inventory?.current_quantity || 0;
  }

  /**
   * Verifica si hay stock suficiente.
   */
  async hasEnoughStock(productId: number, requestedAmount: number): Promise<boolean> {
    const currentQuantity = await this.getCurrentQuantity(productId);
    return currentQuantity >= requestedAmount;
  }
}

// Exportar instancia singleton
export const inventoryRepository = new InventoryRepository();

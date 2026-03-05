import { BaseRepository } from './BaseRepository';
import { TempPedido } from '@app-types/index';

/**
 * Repositorio para pedidos temporales.
 * Maneja la persistencia de pedidos durante el uso de la app
 * para recuperar datos si el usuario cierra antes de guardar.
 */
class TempPedidosRepository extends BaseRepository<TempPedido> {
  constructor() {
    super('temp_pedidos', 'product_name');
  }

  /**
   * Guarda o actualiza un pedido temporal.
   * Usa INSERT OR REPLACE para upsert.
   */
  async upsert(productName: string, quantity: number): Promise<void> {
    const db = this.getDb();
    await db.runAsync(
      'INSERT OR REPLACE INTO temp_pedidos (product_name, quantity) VALUES (?, ?)',
      [productName, quantity]
    );
  }

  /**
   * Guarda múltiples pedidos de una vez.
   */
  async upsertMany(pedidos: TempPedido[]): Promise<void> {
    const db = this.getDb();
    
    for (const pedido of pedidos) {
      await db.runAsync(
        'INSERT OR REPLACE INTO temp_pedidos (product_name, quantity) VALUES (?, ?)',
        [pedido.product_name, pedido.quantity]
      );
    }
  }

  /**
   * Obtiene todos los pedidos temporales.
   */
  async getAll(): Promise<TempPedido[]> {
    return this.findAll('product_name');
  }

  /**
   * Obtiene el pedido de un producto específico.
   */
  async getByProductName(productName: string): Promise<TempPedido | null> {
    return this.findById(productName);
  }

  /**
   * Limpia todos los pedidos temporales.
   * Se usa después de guardar un reporte de pedido exitosamente.
   */
  async clearAll(): Promise<void> {
    await this.deleteAll();
  }

  /**
   * Elimina el pedido de un producto específico.
   */
  async removeByProductName(productName: string): Promise<void> {
    await this.delete(productName);
  }

  /**
   * Verifica si hay pedidos temporales guardados.
   */
  async hasPendingPedidos(): Promise<boolean> {
    const count = await this.count();
    return count > 0;
  }

  /**
   * Obtiene la suma total de todos los pedidos.
   */
  async getTotalQuantity(): Promise<number> {
    const result = await this.rawQueryOne<{ total: number }>(
      'SELECT SUM(quantity) as total FROM temp_pedidos'
    );
    return result?.total || 0;
  }
}

// Exportar instancia singleton
export const tempPedidosRepository = new TempPedidosRepository();

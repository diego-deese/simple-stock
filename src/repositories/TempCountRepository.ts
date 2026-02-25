import { BaseRepository } from './BaseRepository';
import { TempCount } from '../types';

/**
 * Repositorio para conteos temporales.
 * Maneja la persistencia de conteos durante el uso de la app
 * para recuperar datos si el usuario cierra antes de guardar.
 */
class TempCountRepository extends BaseRepository<TempCount> {
  constructor() {
    super('temp_counts', 'product_name');
  }

  /**
   * Guarda o actualiza un conteo temporal.
   * Usa INSERT OR REPLACE para upsert.
   */
  async upsert(productName: string, quantity: number): Promise<void> {
    const db = this.getDb();
    // Solo usar columnas que sabemos que existen (product_name, quantity)
    await db.runAsync(
      'INSERT OR REPLACE INTO temp_counts (product_name, quantity) VALUES (?, ?)',
      [productName, quantity]
    );
  }

  /**
   * Guarda múltiples conteos de una vez.
   */
  async upsertMany(counts: TempCount[]): Promise<void> {
    const db = this.getDb();
    
    for (const count of counts) {
      await db.runAsync(
        'INSERT OR REPLACE INTO temp_counts (product_name, quantity) VALUES (?, ?)',
        [count.product_name, count.quantity]
      );
    }
  }

  /**
   * Obtiene todos los conteos temporales.
   */
  async getAll(): Promise<TempCount[]> {
    return this.findAll('product_name');
  }

  /**
   * Obtiene el conteo de un producto específico.
   */
  async getByProductName(productName: string): Promise<TempCount | null> {
    return this.findById(productName);
  }

  /**
   * Limpia todos los conteos temporales.
   * Se usa después de guardar un reporte exitosamente.
   */
  async clearAll(): Promise<void> {
    await this.deleteAll();
  }

  /**
   * Elimina el conteo de un producto específico.
   */
  async removeByProductName(productName: string): Promise<void> {
    await this.delete(productName);
  }

  /**
   * Verifica si hay conteos temporales guardados.
   */
  async hasPendingCounts(): Promise<boolean> {
    const count = await this.count();
    return count > 0;
  }

  /**
   * Obtiene la suma total de todos los conteos.
   */
  async getTotalQuantity(): Promise<number> {
    const result = await this.rawQueryOne<{ total: number }>(
      'SELECT SUM(quantity) as total FROM temp_counts'
    );
    return result?.total || 0;
  }
}

// Exportar instancia singleton
export const tempCountRepository = new TempCountRepository();

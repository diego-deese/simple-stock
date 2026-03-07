import { BaseRepository } from './BaseRepository';
import { TempCount } from '@app-types/index';

/**
 * Repositorio para entregas temporales (renombrado desde TempCount)
 */
class TempEntregasRepository extends BaseRepository<TempCount> {
  constructor() {
    super('temp_entregas', 'product_name');
  }

  async upsert(productName: string, quantity: number): Promise<void> {
    const db = this.getDb();
    await db.runAsync(
      'INSERT OR REPLACE INTO temp_entregas (product_name, quantity) VALUES (?, ?)',
      [productName, quantity]
    );
  }

  async upsertMany(counts: TempCount[]): Promise<void> {
    const db = this.getDb();
    for (const count of counts) {
      await db.runAsync(
        'INSERT OR REPLACE INTO temp_entregas (product_name, quantity) VALUES (?, ?)',
        [count.product_name, count.quantity]
      );
    }
  }

  async getAll(): Promise<TempCount[]> {
    return this.findAll('product_name');
  }

  async getByProductName(productName: string): Promise<TempCount | null> {
    return this.findById(productName);
  }

  async clearAll(): Promise<void> {
    await this.deleteAll();
  }

  async removeByProductName(productName: string): Promise<void> {
    await this.delete(productName);
  }

  async hasPendingCounts(): Promise<boolean> {
    const count = await this.count();
    return count > 0;
  }

  async getTotalQuantity(): Promise<number> {
    const result = await this.rawQueryOne<{ total: number }>(
      'SELECT SUM(quantity) as total FROM temp_entregas'
    );
    return result?.total || 0;
  }
}

export const tempEntregasRepository = new TempEntregasRepository();

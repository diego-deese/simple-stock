import { BaseRepository } from './BaseRepository';
import { TempDesperdicio } from '@app-types/index';

/**
 * Repository for managing temporary desperdicio (spoilage) data.
 */
class TempDesperdicioRepository extends BaseRepository<TempDesperdicio> {
  constructor() {
    super('temp_desperdicio', 'product_name');
  }

  /**
   * Upserts a temporary desperdicio entry.
   */
  async upsert(productName: string, quantity: number): Promise<void> {
    const db = this.getDb();
    await db.runAsync(
      'INSERT OR REPLACE INTO temp_desperdicio (product_name, quantity) VALUES (?, ?)',
      [productName, quantity]
    );
  }

  /**
   * Upserts multiple desperdicio entries at once.
   */
  async upsertMany(desperdicioItems: TempDesperdicio[]): Promise<void> {
    const db = this.getDb();

    for (const item of desperdicioItems) {
      await db.runAsync(
        'INSERT OR REPLACE INTO temp_desperdicio (product_name, quantity) VALUES (?, ?)',
        [item.product_name, item.quantity]
      );
    }
  }

  /**
   * Retrieves all saved desperdicio entries.
   */
  async getAll(): Promise<TempDesperdicio[]> {
    return this.findAll('product_name');
  }

  /**
   * Retrieves a specific desperdicio entry by product name.
   */
  async getByProductName(productName: string): Promise<TempDesperdicio | null> {
    return this.findById(productName);
  }

  /**
   * Clears all temporary desperdicio entries.
   */
  async clearAll(): Promise<void> {
    await this.deleteAll();
  }

  /**
   * Removes a specific desperdicio entry by product name.
   */
  async removeByProductName(productName: string): Promise<void> {
    await this.delete(productName);
  }

  /**
   * Checks if there are pending desperdicio items.
   */
  async hasPendingDesperdicio(): Promise<boolean> {
    const count = await this.count();
    return count > 0;
  }

  /**
   * Retrieves the total quantity of all desperdicio entries.
   */
  async getTotalQuantity(): Promise<number> {
    const result = await this.rawQueryOne<{ total: number }>(
      'SELECT SUM(quantity) as total FROM temp_desperdicio'
    );
    return result?.total || 0;
  }
}

// Export singleton instance
export const tempDesperdicioRepository = new TempDesperdicioRepository();
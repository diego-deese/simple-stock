import { dbConnection } from './connection';

/**
 * Datos iniciales (seeds) para poblar la base de datos.
 * Solo se ejecutan si las tablas están vacías.
 */

interface ProductSeed {
  name: string;
  unit: string;
}

// Productos iniciales de demostración
const initialProducts: ProductSeed[] = [
  { name: 'Arroz', unit: 'kg' },
  { name: 'Frijoles', unit: 'kg' },
  { name: 'Aceite', unit: 'litros' },
  { name: 'Azúcar', unit: 'kg' },
  { name: 'Sal', unit: 'kg' },
  { name: 'Harina', unit: 'bultos' },
  { name: 'Pasta', unit: 'kg' },
  { name: 'Leche en polvo', unit: 'kg' },
];

/**
 * Clase para gestionar los datos iniciales de la aplicación.
 */
class SeederManager {
  /**
   * Verifica si una tabla tiene datos.
   */
  private async tableHasData(tableName: string): Promise<boolean> {
    const db = dbConnection.getDatabase();
    
    try {
      const result = await db.getFirstAsync<{ count: number }>(
        `SELECT COUNT(*) as count FROM ${tableName}`
      );
      return (result?.count || 0) > 0;
    } catch {
      return false;
    }
  }

  /**
   * Siembra los productos iniciales.
   */
  async seedProducts(): Promise<void> {
    const db = dbConnection.getDatabase();
    
    const hasProducts = await this.tableHasData('products');
    if (hasProducts) {
      console.log('[Seeds] Productos ya existen, omitiendo seed');
      return;
    }

    console.log('[Seeds] Insertando productos iniciales...');

    for (const product of initialProducts) {
      await db.runAsync(
        'INSERT INTO products (name, unit, active) VALUES (?, ?, 1)',
        [product.name, product.unit]
      );
    }

    console.log(`[Seeds] ${initialProducts.length} productos insertados`);
  }

  /**
   * Ejecuta todos los seeds.
   */
  async runAllSeeds(): Promise<void> {
    console.log('[Seeds] Ejecutando seeds...');
    
    await this.seedProducts();
    // Agregar más seeds aquí si es necesario
    
    console.log('[Seeds] Seeds completados');
  }

  /**
   * Limpia todos los datos (útil para testing/desarrollo).
   * PRECAUCIÓN: Esto elimina TODOS los datos.
   */
  async clearAllData(): Promise<void> {
    const db = dbConnection.getDatabase();
    
    console.log('[Seeds] ADVERTENCIA: Limpiando todos los datos...');
    
    await db.execAsync(`
      DELETE FROM report_details;
      DELETE FROM reports;
      DELETE FROM temp_counts;
      DELETE FROM products;
    `);
    
    console.log('[Seeds] Todos los datos eliminados');
  }

  /**
   * Reinicia la base de datos (limpia y vuelve a sembrar).
   * PRECAUCIÓN: Esto elimina TODOS los datos.
   */
  async resetDatabase(): Promise<void> {
    await this.clearAllData();
    await this.runAllSeeds();
    console.log('[Seeds] Base de datos reiniciada');
  }
}

// Exportar instancia singleton
export const seederManager = new SeederManager();

// Exportar datos iniciales para referencia
export { initialProducts };

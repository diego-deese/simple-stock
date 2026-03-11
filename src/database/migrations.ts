import { dbConnection } from './connection';

/**
 * Sistema de migraciones para la base de datos.
 * Permite versionar y ejecutar cambios en el esquema de forma ordenada.
 */

interface Migration {
  version: number;
  name: string;
  up: string; // SQL para aplicar la migración
}

// Definición de todas las migraciones
const migrations: Migration[] = [
  {
    version: 1,
    name: 'create_initial_tables',
    up: `
      -- Tabla de productos
      CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        unit TEXT NOT NULL,
        active INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      -- Tabla de reportes
       CREATE TABLE IF NOT EXISTS reports (
         id INTEGER PRIMARY KEY AUTOINCREMENT,
         date DATETIME DEFAULT CURRENT_TIMESTAMP,
         type TEXT DEFAULT 'entregas' CHECK (type IN ('entregas', 'pedidos', 'desperdicio')),
         related_report_id INTEGER DEFAULT NULL,
         created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
         FOREIGN KEY (related_report_id) REFERENCES reports(id) ON DELETE SET NULL
       );

      -- Tabla de detalles de reportes
      CREATE TABLE IF NOT EXISTS report_details (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        report_id INTEGER NOT NULL,
        product_name TEXT NOT NULL,
        quantity REAL NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (report_id) REFERENCES reports (id) ON DELETE CASCADE
      );

      -- Tabla temporal para persistir conteos durante el uso (renombrada a temp_entregas)
      CREATE TABLE IF NOT EXISTS temp_entregas (
        product_name TEXT PRIMARY KEY,
        quantity REAL NOT NULL,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      -- Tabla de control de migraciones
      CREATE TABLE IF NOT EXISTS migrations (
        version INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      -- Índices para mejorar rendimiento
      CREATE INDEX IF NOT EXISTS idx_products_active ON products(active);
      CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);
      CREATE INDEX IF NOT EXISTS idx_reports_date ON reports(date);
      CREATE INDEX IF NOT EXISTS idx_report_details_report_id ON report_details(report_id);
    `,
  },
  
  // Migración para agregar tabla de credenciales de administrador
  {
    version: 3,
    name: 'create_admin_credentials',
    up: `
      -- Tabla de credenciales de administrador (solo 1 registro)
      CREATE TABLE IF NOT EXISTS admin_credentials (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        username TEXT NOT NULL,
        password_hash TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `,
  },
  // Migración para agregar categorías de productos
  {
    version: 4,
    name: 'create_categories_table',
    up: `
      -- Tabla de categorías de productos
      CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        sort_order INTEGER DEFAULT 0,
        active INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      -- Agregar campo category_id a productos (nullable para "Otros")
      ALTER TABLE products ADD COLUMN category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL;

      -- Índice para mejorar consultas por categoría
      CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
      CREATE INDEX IF NOT EXISTS idx_categories_active ON categories(active);
      CREATE INDEX IF NOT EXISTS idx_categories_sort ON categories(sort_order);
    `,
  },
  // Migración para agregar sistema de movimientos de inventario (entradas/salidas)
  {
    version: 5,
    name: 'add_inventory_movements',
    up: `
      -- Agregar tipo de movimiento a reportes (entrada/salida)
      -- 'entrada' = productos que llegan al centro
      -- 'salida' = productos que salen hacia cocina
      ALTER TABLE reports ADD COLUMN type TEXT DEFAULT 'entrada' CHECK (type IN ('entrada', 'salida'));

      -- Índice para filtrar reportes por tipo
      CREATE INDEX IF NOT EXISTS idx_reports_type ON reports(type);

      -- Tabla de inventario actual (balance calculado)
      -- Almacena el stock actual de cada producto
      CREATE TABLE IF NOT EXISTS inventory (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        product_id INTEGER NOT NULL,
        product_name TEXT NOT NULL,
        current_quantity REAL DEFAULT 0,
        last_entry_date DATETIME,
        last_output_date DATETIME,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
      );

      -- Índice único por producto para evitar duplicados
      CREATE UNIQUE INDEX IF NOT EXISTS idx_inventory_product ON inventory(product_id);

      -- Tabla temporal para pedidos (similar a temp_entregas)
      CREATE TABLE IF NOT EXISTS temp_pedidos (
        product_name TEXT PRIMARY KEY,
        quantity REAL NOT NULL,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `,
  },
  {
    version: 7,
    name: 'add_desperdicio_movement_type',
    up: `
      -- Add desperdicio as a movement type in reports
      -- This migration introduces a new type to the reports table for registering spoilage

       -- Limpiar auxiliares residuales e crear tabla temporal para la migración
       DROP TABLE IF EXISTS reports_new;
        CREATE TABLE reports_new (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          date DATETIME DEFAULT CURRENT_TIMESTAMP,
          type TEXT DEFAULT 'entregas' CHECK (type IN ('entregas', 'pedidos', 'desperdicio')),
          related_report_id INTEGER DEFAULT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (related_report_id) REFERENCES reports(id) ON DELETE SET NULL
        );

      -- Copy existing data into reports_new
      INSERT INTO reports_new (id, date, type, related_report_id, created_at)
      SELECT id, date, type, NULL as related_report_id, created_at FROM reports;

      -- Replace the existing reports table
      DROP TABLE reports;
      ALTER TABLE reports_new RENAME TO reports;

      -- Readd indexes for new schema
      CREATE INDEX IF NOT EXISTS idx_reports_date ON reports(date);
      CREATE INDEX IF NOT EXISTS idx_reports_type ON reports(type);
    `,
  },
  {
    version: 8,
    name: 'create_temp_desperdicio_table',
    up: `
      -- Create temp_desperdicio table for temporary storage of spoilage data

      CREATE TABLE IF NOT EXISTS temp_desperdicio (
        product_name TEXT PRIMARY KEY,
        quantity REAL NOT NULL,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `,
  },
  // Add synced flag to reports for synchronization queue
  {
    version: 9,
    name: 'add_synced_flag_to_reports',
    up: `
      ALTER TABLE reports ADD COLUMN synced INTEGER DEFAULT 0;
      CREATE INDEX IF NOT EXISTS idx_reports_synced ON reports(synced);
    `,
  },
];

/**
 * Clase para gestionar las migraciones de la base de datos.
 */
class MigrationManager {
  /**
   * Obtiene la versión actual de la base de datos.
   */
  private async getCurrentVersion(): Promise<number> {
    const db = dbConnection.getDatabase();
    
    try {
      // Verificar si existe la tabla de migraciones
      const tableExists = await db.getFirstAsync<{ name: string }>(
        `SELECT name FROM sqlite_master WHERE type='table' AND name='migrations'`
      );
      
      if (!tableExists) {
        return 0;
      }
      
      const result = await db.getFirstAsync<{ max_version: number }>(
        'SELECT MAX(version) as max_version FROM migrations'
      );
      
      return result?.max_version || 0;
    } catch {
      return 0;
    }
  }

  /**
   * Registra una migración como aplicada.
   */
  private async recordMigration(migration: Migration): Promise<void> {
    const db = dbConnection.getDatabase();
    await db.runAsync(
      'INSERT INTO migrations (version, name) VALUES (?, ?)',
      [migration.version, migration.name]
    );
  }

  /**
   * Ejecuta todas las migraciones pendientes.
   */
  async runMigrations(): Promise<void> {
    const db = dbConnection.getDatabase();
    const currentVersion = await this.getCurrentVersion();
    
    const pendingMigrations = migrations.filter(m => m.version > currentVersion);
    
    if (pendingMigrations.length === 0) {
      console.log('[Migrations] Base de datos actualizada, no hay migraciones pendientes');
      return;
    }

    console.log(`[Migrations] Ejecutando ${pendingMigrations.length} migración(es) pendiente(s)...`);

    for (const migration of pendingMigrations) {
      console.log(`[Migrations] Aplicando v${migration.version}: ${migration.name}`);

      // Ejecutar cada sentencia SQL por separado para que errores en una sentencia
      // no impidan la ejecución de las posteriores (por ejemplo ALTER TABLE que
      // falla porque la columna ya existe). Se limpian comentarios (`--` y `/* */`)
      // antes de partir por `;` para evitar errores de sintaxis por fragmentos
      // que contengan texto no-SQL.
      const cleaned = migration.up
        .replace(/\/\*[\s\S]*?\*\//g, '') // quitar comentarios en bloque
        .replace(/--.*$/gm, ''); // quitar comentarios de línea

      const statements = cleaned
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0);

      try {
        for (const stmt of statements) {
          try {
            await db.execAsync(stmt + ';');
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);

            // Errores benignos conocidos: columnas/índices que ya existen, tablas temporales ausentes, etc.
            if (
              errorMessage.includes('duplicate column name') ||
              errorMessage.includes('no such table: temp_pedidos') ||
              errorMessage.includes('already exists') ||
              errorMessage.includes('duplicate index')
            ) {
              console.log(`[Migrations] v${migration.version}: Sentencia ignorada (${errorMessage})`);
              continue;
            }

            // Si no es un error esperado, volver a lanzar para abortar la migración.
            console.error(`[Migrations] Error en v${migration.version} al ejecutar sentencia:`, error);
            throw error;
          }
        }

        // Si llegamos aquí, todas las sentencias de la migración fueron procesadas (o ignoradas si era benigno)
        await this.recordMigration(migration);
        console.log(`[Migrations] v${migration.version} aplicada correctamente`);
      } catch (error) {
        // Propagar el error para que el proceso de inicialización lo capture y no marque la DB como inicializada
        throw error;
      }
    }

    console.log('[Migrations] Todas las migraciones aplicadas correctamente');
  }

  /**
   * Obtiene el estado actual de las migraciones.
   */
  async getStatus(): Promise<{ current: number; latest: number; pending: number }> {
    const current = await this.getCurrentVersion();
    const latest = migrations.length > 0 ? Math.max(...migrations.map(m => m.version)) : 0;
    
    return {
      current,
      latest,
      pending: latest - current,
    };
  }
}

// Exportar instancia singleton
export const migrationManager = new MigrationManager();

// Exportar lista de migraciones para referencia
export { migrations };

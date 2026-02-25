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
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
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

      -- Tabla temporal para persistir conteos durante el uso
      CREATE TABLE IF NOT EXISTS temp_counts (
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
  // Migración para agregar columnas de timestamp faltantes
  // (necesaria si la app ya existía con el schema antiguo)
  {
    version: 2,
    name: 'add_timestamp_columns',
    up: `
      -- Agregar updated_at a temp_counts si no existe
      ALTER TABLE temp_counts ADD COLUMN updated_at DATETIME DEFAULT CURRENT_TIMESTAMP;
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
      try {
        console.log(`[Migrations] Aplicando v${migration.version}: ${migration.name}`);
        
        await db.execAsync(migration.up);
        await this.recordMigration(migration);
        
        console.log(`[Migrations] v${migration.version} aplicada correctamente`);
      } catch (error) {
        // Manejar errores esperados (ej: columna ya existe)
        const errorMessage = error instanceof Error ? error.message : String(error);
        
        if (errorMessage.includes('duplicate column name')) {
          console.log(`[Migrations] v${migration.version}: Columna ya existe, continuando...`);
          await this.recordMigration(migration);
        } else {
          console.error(`[Migrations] Error en v${migration.version}:`, error);
          throw error;
        }
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

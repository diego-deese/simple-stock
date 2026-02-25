import * as SQLite from 'expo-sqlite';

const DB_NAME = 'simplestock.db';

/**
 * Singleton para manejar la conexión a la base de datos SQLite.
 * Garantiza una única instancia de conexión en toda la aplicación.
 */
class DatabaseConnection {
  private static instance: DatabaseConnection;
  private db: SQLite.SQLiteDatabase | null = null;
  private isInitialized: boolean = false;

  private constructor() {}

  /**
   * Obtiene la instancia singleton de la conexión.
   */
  static getInstance(): DatabaseConnection {
    if (!DatabaseConnection.instance) {
      DatabaseConnection.instance = new DatabaseConnection();
    }
    return DatabaseConnection.instance;
  }

  /**
   * Abre la conexión a la base de datos.
   */
  async connect(): Promise<SQLite.SQLiteDatabase> {
    if (this.db && this.isInitialized) {
      return this.db;
    }

    try {
      this.db = await SQLite.openDatabaseAsync(DB_NAME);
      this.isInitialized = true;
      console.log('[DatabaseConnection] Conexión establecida');
      return this.db;
    } catch (error) {
      console.error('[DatabaseConnection] Error al conectar:', error);
      throw error;
    }
  }

  /**
   * Obtiene la instancia de la base de datos.
   * Lanza error si no está inicializada.
   */
  getDatabase(): SQLite.SQLiteDatabase {
    if (!this.db || !this.isInitialized) {
      throw new Error('Base de datos no inicializada. Llama a connect() primero.');
    }
    return this.db;
  }

  /**
   * Verifica si la base de datos está conectada.
   */
  isConnected(): boolean {
    return this.isInitialized && this.db !== null;
  }

  /**
   * Cierra la conexión a la base de datos.
   */
  async disconnect(): Promise<void> {
    if (this.db) {
      await this.db.closeAsync();
      this.db = null;
      this.isInitialized = false;
      console.log('[DatabaseConnection] Conexión cerrada');
    }
  }

  /**
   * Ejecuta una transacción con rollback automático en caso de error.
   */
  async transaction<T>(callback: (db: SQLite.SQLiteDatabase) => Promise<T>): Promise<T> {
    const db = this.getDatabase();
    
    try {
      await db.execAsync('BEGIN TRANSACTION');
      const result = await callback(db);
      await db.execAsync('COMMIT');
      return result;
    } catch (error) {
      await db.execAsync('ROLLBACK');
      console.error('[DatabaseConnection] Transacción fallida, rollback ejecutado:', error);
      throw error;
    }
  }
}

// Exportar instancia singleton
export const dbConnection = DatabaseConnection.getInstance();

// Exportar tipo para uso en repositorios
export type { SQLite };

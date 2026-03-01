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
  private connectionPromise: Promise<SQLite.SQLiteDatabase> | null = null;

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
   * Usa un lock para evitar múltiples conexiones simultáneas.
   * Configura WAL mode para evitar bloqueos durante operaciones concurrentes.
   */
  async connect(): Promise<SQLite.SQLiteDatabase> {
    // Si ya está inicializada, retornar la conexión existente
    if (this.db && this.isInitialized) {
      return this.db;
    }

    // Si hay una conexión en progreso, esperar a que termine
    if (this.connectionPromise) {
      console.log('[DatabaseConnection] Conexión en progreso, esperando...');
      return this.connectionPromise;
    }

    // Iniciar nueva conexión con lock
    this.connectionPromise = this.initConnection();
    
    try {
      const db = await this.connectionPromise;
      return db;
    } finally {
      // Limpiar el promise después de completar (éxito o error)
      this.connectionPromise = null;
    }
  }

  /**
   * Inicializa la conexión internamente.
   */
  private async initConnection(): Promise<SQLite.SQLiteDatabase> {
    try {
      console.log('[DatabaseConnection] Abriendo base de datos...');
      this.db = await SQLite.openDatabaseAsync(DB_NAME);
      
      // Habilitar WAL mode para mejor rendimiento y evitar bloqueos
      await this.db.execAsync('PRAGMA journal_mode = WAL;');
      console.log('[DatabaseConnection] WAL mode habilitado');
      
      this.isInitialized = true;
      console.log('[DatabaseConnection] Conexión establecida');
      return this.db;
    } catch (error) {
      // Resetear estado en caso de error
      this.db = null;
      this.isInitialized = false;
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

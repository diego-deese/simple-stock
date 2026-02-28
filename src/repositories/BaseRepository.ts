import * as SQLite from 'expo-sqlite';
import { dbConnection } from '@database/connection';

// Tipo para valores que SQLite acepta como parámetros
type SQLiteBindValue = string | number | null | boolean | Uint8Array;

/**
 * Repositorio base con operaciones CRUD genéricas.
 * Los repositorios específicos heredan de esta clase.
 */
export abstract class BaseRepository<T> {
  protected tableName: string;
  protected primaryKey: string;

  constructor(tableName: string, primaryKey: string = 'id') {
    this.tableName = tableName;
    this.primaryKey = primaryKey;
  }

  /**
   * Obtiene la instancia de la base de datos.
   */
  protected getDb(): SQLite.SQLiteDatabase {
    return dbConnection.getDatabase();
  }

  /**
   * Convierte valores a tipos aceptados por SQLite.
   */
  private toBindValues(values: unknown[]): SQLiteBindValue[] {
    return values.map(v => {
      if (v === null || v === undefined) return null;
      if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') return v;
      if (v instanceof Uint8Array) return v;
      return String(v);
    });
  }

  /**
   * Obtiene todos los registros.
   */
  async findAll(orderBy?: string): Promise<T[]> {
    const db = this.getDb();
    const order = orderBy ? ` ORDER BY ${orderBy}` : '';
    const result = await db.getAllAsync<T>(`SELECT * FROM ${this.tableName}${order}`);
    return result;
  }

  /**
   * Obtiene un registro por su ID.
   */
  async findById(id: number | string): Promise<T | null> {
    const db = this.getDb();
    const result = await db.getFirstAsync<T>(
      `SELECT * FROM ${this.tableName} WHERE ${this.primaryKey} = ?`,
      [id]
    );
    return result || null;
  }

  /**
   * Busca registros que coincidan con una condición.
   */
  async findWhere(
    conditions: Partial<Record<keyof T, unknown>>,
    orderBy?: string
  ): Promise<T[]> {
    const db = this.getDb();
    const keys = Object.keys(conditions);
    const values = this.toBindValues(Object.values(conditions));
    
    const whereClause = keys.map(key => `${key} = ?`).join(' AND ');
    const order = orderBy ? ` ORDER BY ${orderBy}` : '';
    
    const result = await db.getAllAsync<T>(
      `SELECT * FROM ${this.tableName} WHERE ${whereClause}${order}`,
      values
    );
    return result;
  }

  /**
   * Obtiene el primer registro que coincida con una condición.
   */
  async findOneWhere(conditions: Partial<Record<keyof T, unknown>>): Promise<T | null> {
    const db = this.getDb();
    const keys = Object.keys(conditions);
    const values = this.toBindValues(Object.values(conditions));
    
    const whereClause = keys.map(key => `${key} = ?`).join(' AND ');
    
    const result = await db.getFirstAsync<T>(
      `SELECT * FROM ${this.tableName} WHERE ${whereClause}`,
      values
    );
    return result || null;
  }

  /**
   * Inserta un nuevo registro.
   * Retorna el ID del registro insertado.
   */
  async insert(data: Omit<T, 'id'>): Promise<number> {
    const db = this.getDb();
    const keys = Object.keys(data);
    const values = this.toBindValues(Object.values(data));
    const placeholders = keys.map(() => '?').join(', ');
    
    const result = await db.runAsync(
      `INSERT INTO ${this.tableName} (${keys.join(', ')}) VALUES (${placeholders})`,
      values
    );
    
    return result.lastInsertRowId;
  }

  /**
   * Actualiza un registro por su ID.
   */
  async update(id: number | string, data: Partial<T>): Promise<void> {
    const db = this.getDb();
    const keys = Object.keys(data);
    const values = this.toBindValues([...Object.values(data), id]);
    
    const setClause = keys.map(key => `${key} = ?`).join(', ');
    
    await db.runAsync(
      `UPDATE ${this.tableName} SET ${setClause} WHERE ${this.primaryKey} = ?`,
      values
    );
  }

  /**
   * Elimina un registro por su ID (eliminación física).
   */
  async delete(id: number | string): Promise<void> {
    const db = this.getDb();
    await db.runAsync(
      `DELETE FROM ${this.tableName} WHERE ${this.primaryKey} = ?`,
      [id]
    );
  }

  /**
   * Cuenta el total de registros.
   */
  async count(conditions?: Partial<Record<keyof T, unknown>>): Promise<number> {
    const db = this.getDb();
    
    let query = `SELECT COUNT(*) as count FROM ${this.tableName}`;
    let values: SQLiteBindValue[] = [];
    
    if (conditions && Object.keys(conditions).length > 0) {
      const keys = Object.keys(conditions);
      values = this.toBindValues(Object.values(conditions));
      const whereClause = keys.map(key => `${key} = ?`).join(' AND ');
      query += ` WHERE ${whereClause}`;
    }
    
    const result = await db.getFirstAsync<{ count: number }>(query, values);
    return result?.count || 0;
  }

  /**
   * Verifica si existe un registro con las condiciones dadas.
   */
  async exists(conditions: Partial<Record<keyof T, unknown>>): Promise<boolean> {
    const count = await this.count(conditions);
    return count > 0;
  }

  /**
   * Elimina todos los registros de la tabla.
   */
  async deleteAll(): Promise<void> {
    const db = this.getDb();
    await db.runAsync(`DELETE FROM ${this.tableName}`);
  }

  /**
   * Ejecuta una consulta SQL personalizada.
   */
  async rawQuery<R>(sql: string, params: SQLiteBindValue[] = []): Promise<R[]> {
    const db = this.getDb();
    return await db.getAllAsync<R>(sql, params);
  }

  /**
   * Ejecuta una consulta SQL que retorna un solo resultado.
   */
  async rawQueryOne<R>(sql: string, params: SQLiteBindValue[] = []): Promise<R | null> {
    const db = this.getDb();
    const result = await db.getFirstAsync<R>(sql, params);
    return result || null;
  }
}

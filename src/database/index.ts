// Capa de Base de Datos
// Exportaciones centralizadas para la gestión de la base de datos

export { dbConnection } from './connection';
export { migrationManager, migrations } from './migrations';
export { seederManager, initialProducts } from './seeds';

/**
 * Inicializa la base de datos completa.
 * Conecta, ejecuta migraciones y siembra datos iniciales.
 */
export async function initializeDatabase(): Promise<void> {
  const { dbConnection } = await import('./connection');
  const { migrationManager } = await import('./migrations');
  const { seederManager } = await import('./seeds');

  // 1. Conectar a la base de datos
  await dbConnection.connect();
  console.log('[Database] Conexión establecida');

  // 2. Ejecutar migraciones pendientes
  await migrationManager.runMigrations();

  // 3. Sembrar datos iniciales si es necesario
  await seederManager.runAllSeeds();

  console.log('[Database] Inicialización completada');
}

/**
 * Cierra la conexión a la base de datos.
 */
export async function closeDatabase(): Promise<void> {
  const { dbConnection } = await import('./connection');
  await dbConnection.disconnect();
}

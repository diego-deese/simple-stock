// Capa de Base de Datos
// Exportaciones centralizadas para la gestión de la base de datos

export { dbConnection } from './connection';
export { migrationManager, migrations } from './migrations';
export { seederManager, initialProducts } from './seeds';

// Lock para evitar inicializaciones concurrentes
let initializationPromise: Promise<void> | null = null;
let isInitialized = false;

/**
 * Inicializa la base de datos completa.
 * Conecta, ejecuta migraciones y siembra datos iniciales.
 * Usa un lock para evitar múltiples inicializaciones simultáneas.
 */
export async function initializeDatabase(): Promise<void> {
  // Si ya está inicializada, no hacer nada
  if (isInitialized) {
    console.log('[Database] Ya inicializada, omitiendo...');
    return;
  }

  // Si hay una inicialización en progreso, esperar a que termine
  if (initializationPromise) {
    console.log('[Database] Inicialización en progreso, esperando...');
    return initializationPromise;
  }

  // Iniciar nueva inicialización con lock
  initializationPromise = performInitialization();
  
  try {
    await initializationPromise;
  } finally {
    initializationPromise = null;
  }
}

/**
 * Realiza la inicialización interna de la base de datos.
 */
async function performInitialization(): Promise<void> {
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

  isInitialized = true;
  console.log('[Database] Inicialización completada');
}

/**
 * Cierra la conexión a la base de datos.
 */
export async function closeDatabase(): Promise<void> {
  const { dbConnection } = await import('./connection');
  await dbConnection.disconnect();
}

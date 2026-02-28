import { BaseRepository } from './BaseRepository';
import { AdminCredentials } from '@app-types/index';

/**
 * Repositorio para gestionar las credenciales de administrador.
 * Solo puede existir un registro de admin (id = 1).
 */
class AdminRepositoryClass extends BaseRepository<AdminCredentials> {
  constructor() {
    super('admin_credentials', 'id');
  }

  /**
   * Verifica si ya existen credenciales de admin configuradas.
   */
  async isConfigured(): Promise<boolean> {
    const count = await this.count();
    return count > 0;
  }

  /**
   * Obtiene las credenciales del admin (solo puede haber 1).
   */
  async getCredentials(): Promise<AdminCredentials | null> {
    return this.findById(1);
  }

  /**
   * Crea las credenciales de admin por primera vez.
   * Solo funciona si no hay credenciales existentes.
   */
  async createCredentials(username: string, passwordHash: string): Promise<boolean> {
    const exists = await this.isConfigured();
    if (exists) {
      console.log('[AdminRepository] Ya existen credenciales configuradas');
      return false;
    }

    const db = this.getDb();
    await db.runAsync(
      `INSERT INTO admin_credentials (id, username, password_hash) VALUES (1, ?, ?)`,
      [username, passwordHash]
    );
    
    console.log('[AdminRepository] Credenciales de admin creadas');
    return true;
  }

  /**
   * Actualiza las credenciales de admin existentes.
   */
  async updateCredentials(username: string, passwordHash: string): Promise<boolean> {
    const exists = await this.isConfigured();
    if (!exists) {
      console.log('[AdminRepository] No hay credenciales para actualizar');
      return false;
    }

    await this.update(1, {
      username,
      password_hash: passwordHash,
      updated_at: new Date().toISOString(),
    } as Partial<AdminCredentials>);

    console.log('[AdminRepository] Credenciales de admin actualizadas');
    return true;
  }

  /**
   * Verifica si las credenciales proporcionadas son válidas.
   * @param username Nombre de usuario
   * @param passwordHash Hash de la contraseña a verificar
   */
  async verifyCredentials(username: string, passwordHash: string): Promise<boolean> {
    const credentials = await this.getCredentials();
    
    if (!credentials) {
      return false;
    }

    return credentials.username === username && credentials.password_hash === passwordHash;
  }
}

// Exportar instancia singleton
export const adminRepository = new AdminRepositoryClass();

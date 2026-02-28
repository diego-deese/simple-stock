import { adminRepository } from '@repositories/AdminRepository';

/**
 * Función simple de hash para contraseñas.
 * NOTA: Para una app de producción real, usar una librería como bcrypt.
 * Esta implementación es suficiente para una app offline local.
 */
function simpleHash(password: string): string {
  let hash = 0;
  const salt = 'simplestock_salt_2024';
  const saltedPassword = salt + password + salt;
  
  for (let i = 0; i < saltedPassword.length; i++) {
    const char = saltedPassword.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convertir a entero de 32 bits
  }
  
  // Convertir a string hexadecimal y añadir más caracteres para hacerlo más largo
  const hashStr = Math.abs(hash).toString(16);
  return `sh_${hashStr}_${password.length}_${saltedPassword.length}`;
}

/**
 * Servicio para manejar la autenticación de administrador.
 */
class AdminServiceClass {
  /**
   * Verifica si ya se configuraron las credenciales de admin.
   */
  async isConfigured(): Promise<boolean> {
    return adminRepository.isConfigured();
  }

  /**
   * Configura las credenciales de admin por primera vez.
   * Solo funciona si no hay credenciales existentes.
   */
  async setupAdmin(username: string, password: string): Promise<{ success: boolean; error?: string }> {
    // Validaciones
    if (!username || username.trim().length < 3) {
      return { success: false, error: 'El usuario debe tener al menos 3 caracteres' };
    }

    if (!password || password.length < 4) {
      return { success: false, error: 'La contraseña debe tener al menos 4 caracteres' };
    }

    const alreadyConfigured = await this.isConfigured();
    if (alreadyConfigured) {
      return { success: false, error: 'Ya existe un administrador configurado' };
    }

    try {
      const passwordHash = simpleHash(password);
      const success = await adminRepository.createCredentials(username.trim(), passwordHash);
      
      if (success) {
        console.log('[AdminService] Admin configurado correctamente');
        return { success: true };
      } else {
        return { success: false, error: 'Error al crear las credenciales' };
      }
    } catch (error) {
      console.error('[AdminService] Error en setupAdmin:', error);
      return { success: false, error: 'Error interno al configurar admin' };
    }
  }

  /**
   * Intenta iniciar sesión con las credenciales proporcionadas.
   */
  async login(username: string, password: string): Promise<{ success: boolean; error?: string }> {
    if (!username || !password) {
      return { success: false, error: 'Usuario y contraseña son requeridos' };
    }

    try {
      const passwordHash = simpleHash(password);
      const isValid = await adminRepository.verifyCredentials(username.trim(), passwordHash);

      if (isValid) {
        console.log('[AdminService] Login exitoso');
        return { success: true };
      } else {
        console.log('[AdminService] Credenciales inválidas');
        return { success: false, error: 'Usuario o contraseña incorrectos' };
      }
    } catch (error) {
      console.error('[AdminService] Error en login:', error);
      return { success: false, error: 'Error interno al iniciar sesión' };
    }
  }

  /**
   * Actualiza las credenciales de admin (requiere contraseña actual).
   */
  async updateCredentials(
    currentPassword: string,
    newUsername: string,
    newPassword: string
  ): Promise<{ success: boolean; error?: string }> {
    // Validar nueva info
    if (!newUsername || newUsername.trim().length < 3) {
      return { success: false, error: 'El nuevo usuario debe tener al menos 3 caracteres' };
    }

    if (!newPassword || newPassword.length < 4) {
      return { success: false, error: 'La nueva contraseña debe tener al menos 4 caracteres' };
    }

    try {
      // Verificar contraseña actual
      const credentials = await adminRepository.getCredentials();
      if (!credentials) {
        return { success: false, error: 'No hay credenciales configuradas' };
      }

      const currentHash = simpleHash(currentPassword);
      if (credentials.password_hash !== currentHash) {
        return { success: false, error: 'Contraseña actual incorrecta' };
      }

      // Actualizar
      const newHash = simpleHash(newPassword);
      const success = await adminRepository.updateCredentials(newUsername.trim(), newHash);

      if (success) {
        console.log('[AdminService] Credenciales actualizadas');
        return { success: true };
      } else {
        return { success: false, error: 'Error al actualizar credenciales' };
      }
    } catch (error) {
      console.error('[AdminService] Error en updateCredentials:', error);
      return { success: false, error: 'Error interno al actualizar' };
    }
  }
}

// Exportar instancia singleton
export const adminService = new AdminServiceClass();

import { categoryRepository } from '@repositories/CategoryRepository';
import { Category } from '@app-types/index';

/**
 * Servicio para la lógica de negocio de categorías.
 * Encapsula las reglas de negocio y validaciones.
 */
class CategoryService {
  /**
   * Obtiene todas las categorías activas ordenadas.
   */
  async getActiveCategories(): Promise<Category[]> {
    return categoryRepository.findActive();
  }

  /**
   * Obtiene todas las categorías (incluyendo inactivas) para administración.
   */
  async getAllCategories(): Promise<Category[]> {
    return categoryRepository.findAllOrdered();
  }

  /**
   * Obtiene una categoría por su ID.
   */
  async getCategoryById(id: number): Promise<Category | null> {
    return categoryRepository.findById(id);
  }

  /**
   * Crea una nueva categoría con validaciones.
   * @throws Error si el nombre ya existe o está vacío.
   */
  async createCategory(name: string): Promise<number> {
    const trimmedName = name.trim();

    if (!trimmedName) {
      throw new Error('El nombre de la categoría es requerido');
    }

    // Verificar duplicados
    const exists = await categoryRepository.existsByName(trimmedName);
    if (exists) {
      throw new Error(`Ya existe una categoría con el nombre "${trimmedName}"`);
    }

    return categoryRepository.create(trimmedName);
  }

  /**
   * Actualiza el nombre de una categoría existente.
   * @throws Error si la categoría no existe o el nuevo nombre ya está en uso.
   */
  async updateCategory(id: number, name: string): Promise<void> {
    const trimmedName = name.trim();

    if (!trimmedName) {
      throw new Error('El nombre de la categoría es requerido');
    }

    // Verificar que la categoría existe
    const existing = await categoryRepository.findById(id);
    if (!existing) {
      throw new Error('Categoría no encontrada');
    }

    // Verificar duplicados (excluyendo la categoría actual)
    if (existing.name !== trimmedName) {
      const duplicate = await categoryRepository.findByName(trimmedName);
      if (duplicate && duplicate.id !== id) {
        throw new Error(`Ya existe una categoría con el nombre "${trimmedName}"`);
      }
    }

    await categoryRepository.updateCategory(id, trimmedName);
  }

  /**
   * Desactiva una categoría (borrado lógico).
   * Los productos de esta categoría pasarán a mostrarse en "Otros".
   */
  async deactivateCategory(id: number): Promise<void> {
    const existing = await categoryRepository.findById(id);
    if (!existing) {
      throw new Error('Categoría no encontrada');
    }

    await categoryRepository.softDelete(id);
  }

  /**
   * Reactiva una categoría previamente desactivada.
   */
  async reactivateCategory(id: number): Promise<void> {
    const existing = await categoryRepository.findById(id);
    if (!existing) {
      throw new Error('Categoría no encontrada');
    }

    await categoryRepository.restore(id);
  }

  /**
   * Obtiene el conteo de categorías activas.
   */
  async getActiveCount(): Promise<number> {
    return categoryRepository.countActive();
  }

  /**
   * Actualiza el orden de las categorías.
   */
  async reorderCategories(orderedIds: number[]): Promise<void> {
    await categoryRepository.reorder(orderedIds);
  }
}

// Exportar instancia singleton
export const categoryService = new CategoryService();

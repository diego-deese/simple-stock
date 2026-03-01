import { BaseRepository } from './BaseRepository';
import { Category } from '@app-types/index';

/**
 * Repositorio para operaciones con categorías de productos.
 * Implementa borrado lógico para mantener productos asignados.
 */
class CategoryRepository extends BaseRepository<Category> {
  constructor() {
    super('categories', 'id');
  }

  /**
   * Obtiene solo las categorías activas ordenadas por sort_order.
   */
  async findActive(): Promise<Category[]> {
    return this.rawQuery<Category>(
      'SELECT * FROM categories WHERE active = 1 ORDER BY sort_order, name'
    );
  }

  /**
   * Obtiene todas las categorías ordenadas por sort_order.
   */
  async findAllOrdered(): Promise<Category[]> {
    return this.findAll('sort_order, name');
  }

  /**
   * Crea una nueva categoría.
   * El sort_order se asigna automáticamente al final.
   */
  async create(name: string): Promise<number> {
    // Obtener el máximo sort_order actual
    const maxOrder = await this.rawQueryOne<{ max_order: number }>(
      'SELECT MAX(sort_order) as max_order FROM categories'
    );
    const newOrder = (maxOrder?.max_order || 0) + 1;

    return this.insert({
      name,
      sort_order: newOrder,
      active: true,
    } as Omit<Category, 'id'>);
  }

  /**
   * Actualiza el nombre de una categoría.
   */
  async updateCategory(id: number, name: string): Promise<void> {
    await this.update(id, { name });
  }

  /**
   * Borrado lógico: desactiva la categoría.
   * Los productos de esta categoría pasarán a "Otros".
   */
  async softDelete(id: number): Promise<void> {
    await this.update(id, { active: false });
  }

  /**
   * Reactiva una categoría previamente desactivada.
   */
  async restore(id: number): Promise<void> {
    await this.update(id, { active: true });
  }

  /**
   * Busca una categoría por nombre.
   */
  async findByName(name: string): Promise<Category | null> {
    return this.findOneWhere({ name } as Partial<Record<keyof Category, unknown>>);
  }

  /**
   * Verifica si existe una categoría con el nombre dado.
   */
  async existsByName(name: string): Promise<boolean> {
    return this.exists({ name } as Partial<Record<keyof Category, unknown>>);
  }

  /**
   * Actualiza el orden de las categorías.
   * @param orderedIds Array de IDs en el nuevo orden
   */
  async reorder(orderedIds: number[]): Promise<void> {
    const db = this.getDb();
    for (let i = 0; i < orderedIds.length; i++) {
      await db.runAsync(
        'UPDATE categories SET sort_order = ? WHERE id = ?',
        [i + 1, orderedIds[i]]
      );
    }
  }

  /**
   * Cuenta las categorías activas.
   */
  async countActive(): Promise<number> {
    return this.count({ active: 1 } as Partial<Record<keyof Category, unknown>>);
  }
}

// Exportar instancia singleton
export const categoryRepository = new CategoryRepository();

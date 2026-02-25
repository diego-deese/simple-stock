import { BaseRepository } from './BaseRepository';
import { Product } from '../types';

/**
 * Repositorio para operaciones con productos.
 * Implementa borrado lógico para mantener integridad de reportes históricos.
 */
class ProductRepository extends BaseRepository<Product> {
  constructor() {
    super('products', 'id');
  }

  /**
   * Obtiene solo los productos activos.
   */
  async findActive(): Promise<Product[]> {
    return this.findWhere({ active: 1 } as Partial<Record<keyof Product, unknown>>, 'name');
  }

  /**
   * Obtiene todos los productos ordenados por nombre.
   */
  async findAllOrdered(): Promise<Product[]> {
    return this.findAll('name');
  }

  /**
   * Crea un nuevo producto.
   */
  async create(name: string, unit: string): Promise<number> {
    return this.insert({
      name,
      unit,
      active: true,
    } as Omit<Product, 'id'>);
  }

  /**
   * Actualiza nombre y unidad de un producto.
   */
  async updateProduct(id: number, name: string, unit: string): Promise<void> {
    await this.update(id, { name, unit });
  }

  /**
   * Borrado lógico: desactiva el producto.
   * No elimina físicamente para mantener integridad de reportes históricos.
   */
  async softDelete(id: number): Promise<void> {
    await this.update(id, { active: false });
  }

  /**
   * Reactiva un producto previamente desactivado.
   */
  async restore(id: number): Promise<void> {
    await this.update(id, { active: true });
  }

  /**
   * Busca un producto por nombre.
   */
  async findByName(name: string): Promise<Product | null> {
    return this.findOneWhere({ name } as Partial<Record<keyof Product, unknown>>);
  }

  /**
   * Verifica si existe un producto con el nombre dado.
   */
  async existsByName(name: string): Promise<boolean> {
    return this.exists({ name } as Partial<Record<keyof Product, unknown>>);
  }

  /**
   * Cuenta los productos activos.
   */
  async countActive(): Promise<number> {
    return this.count({ active: 1 } as Partial<Record<keyof Product, unknown>>);
  }
}

// Exportar instancia singleton
export const productRepository = new ProductRepository();

import { BaseRepository } from './BaseRepository';
import { Product, ProductSection } from '@app-types/index';

// Nombre de la sección para productos sin categoría
const UNCATEGORIZED_SECTION = 'Otros';

/**
 * Repositorio para operaciones con productos.
 * Implementa borrado lógico para mantener integridad de reportes históricos.
 */
class ProductRepository extends BaseRepository<Product> {
  constructor() {
    super('products', 'id');
  }

  /**
   * Obtiene solo los productos activos con información de categoría.
   */
  async findActive(): Promise<Product[]> {
    return this.rawQuery<Product>(`
      SELECT 
        p.*,
        c.name as category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id AND c.active = 1
      WHERE p.active = 1
      ORDER BY COALESCE(c.sort_order, 999), c.name, p.name
    `);
  }

  /**
   * Obtiene todos los productos ordenados con información de categoría.
   */
  async findAllOrdered(): Promise<Product[]> {
    return this.rawQuery<Product>(`
      SELECT 
        p.*,
        c.name as category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      ORDER BY p.name
    `);
  }

  /**
   * Obtiene productos activos agrupados por categoría para SectionList.
   */
  async findActiveGroupedByCategory(): Promise<ProductSection[]> {
    const products = await this.findActive();
    
    // Agrupar productos por categoría
    const groupedMap = new Map<string, { categoryId: number | null; products: Product[] }>();
    
    for (const product of products) {
      const categoryName = product.category_name || UNCATEGORIZED_SECTION;
      const categoryId = product.category_id;
      
      if (!groupedMap.has(categoryName)) {
        groupedMap.set(categoryName, { categoryId, products: [] });
      }
      groupedMap.get(categoryName)!.products.push(product);
    }
    
    // Convertir a formato de secciones
    const sections: ProductSection[] = [];
    
    for (const [title, { categoryId, products }] of groupedMap) {
      // "Otros" siempre va al final
      if (title === UNCATEGORIZED_SECTION) continue;
      sections.push({ title, categoryId, data: products });
    }
    
    // Agregar "Otros" al final si existe
    if (groupedMap.has(UNCATEGORIZED_SECTION)) {
      const uncategorized = groupedMap.get(UNCATEGORIZED_SECTION)!;
      sections.push({
        title: UNCATEGORIZED_SECTION,
        categoryId: null,
        data: uncategorized.products,
      });
    }
    
    return sections;
  }

  /**
   * Crea un nuevo producto.
   */
  async create(name: string, unit: string, categoryId?: number | null): Promise<number> {
    return this.insert({
      name,
      unit,
      active: true,
      category_id: categoryId ?? null,
    } as Omit<Product, 'id'>);
  }

  /**
   * Actualiza nombre, unidad y categoría de un producto.
   */
  async updateProduct(
    id: number,
    name: string,
    unit: string,
    categoryId?: number | null
  ): Promise<void> {
    await this.update(id, {
      name,
      unit,
      category_id: categoryId ?? null,
    });
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

  /**
   * Obtiene productos por categoría.
   */
  async findByCategory(categoryId: number | null): Promise<Product[]> {
    if (categoryId === null) {
      return this.rawQuery<Product>(
        'SELECT * FROM products WHERE category_id IS NULL AND active = 1 ORDER BY name'
      );
    }
    return this.rawQuery<Product>(
      'SELECT * FROM products WHERE category_id = ? AND active = 1 ORDER BY name',
      [categoryId]
    );
  }
}

// Exportar instancia singleton
export const productRepository = new ProductRepository();

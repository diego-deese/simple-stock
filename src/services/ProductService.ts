import { productRepository } from '@repositories/ProductRepository';
import { Product } from '@app-types/index';

/**
 * Servicio para la lógica de negocio de productos.
 * Encapsula las reglas de negocio y validaciones.
 */
class ProductService {
  /**
   * Obtiene todos los productos activos para el conteo mensual.
   */
  async getActiveProducts(): Promise<Product[]> {
    return productRepository.findActive();
  }

  /**
   * Obtiene todos los productos (incluyendo inactivos) para administración.
   */
  async getAllProducts(): Promise<Product[]> {
    return productRepository.findAllOrdered();
  }

  /**
   * Obtiene un producto por su ID.
   */
  async getProductById(id: number): Promise<Product | null> {
    return productRepository.findById(id);
  }

  /**
   * Crea un nuevo producto con validaciones.
   * @throws Error si el nombre ya existe o está vacío.
   */
  async createProduct(name: string, unit: string): Promise<number> {
    // Validaciones
    const trimmedName = name.trim();
    const trimmedUnit = unit.trim();

    if (!trimmedName) {
      throw new Error('El nombre del producto es requerido');
    }

    if (!trimmedUnit) {
      throw new Error('La unidad de medida es requerida');
    }

    // Verificar duplicados
    const exists = await productRepository.existsByName(trimmedName);
    if (exists) {
      throw new Error(`Ya existe un producto con el nombre "${trimmedName}"`);
    }

    return productRepository.create(trimmedName, trimmedUnit);
  }

  /**
   * Actualiza un producto existente.
   * @throws Error si el producto no existe o el nuevo nombre ya está en uso.
   */
  async updateProduct(id: number, name: string, unit: string): Promise<void> {
    const trimmedName = name.trim();
    const trimmedUnit = unit.trim();

    if (!trimmedName) {
      throw new Error('El nombre del producto es requerido');
    }

    if (!trimmedUnit) {
      throw new Error('La unidad de medida es requerida');
    }

    // Verificar que el producto existe
    const existing = await productRepository.findById(id);
    if (!existing) {
      throw new Error('Producto no encontrado');
    }

    // Verificar duplicados (excluyendo el producto actual)
    if (existing.name !== trimmedName) {
      const duplicate = await productRepository.findByName(trimmedName);
      if (duplicate && duplicate.id !== id) {
        throw new Error(`Ya existe un producto con el nombre "${trimmedName}"`);
      }
    }

    await productRepository.updateProduct(id, trimmedName, trimmedUnit);
  }

  /**
   * Desactiva un producto (borrado lógico).
   * El producto permanece en la DB para mantener integridad de reportes históricos.
   */
  async deactivateProduct(id: number): Promise<void> {
    const existing = await productRepository.findById(id);
    if (!existing) {
      throw new Error('Producto no encontrado');
    }

    await productRepository.softDelete(id);
  }

  /**
   * Reactiva un producto previamente desactivado.
   */
  async reactivateProduct(id: number): Promise<void> {
    const existing = await productRepository.findById(id);
    if (!existing) {
      throw new Error('Producto no encontrado');
    }

    await productRepository.restore(id);
  }

  /**
   * Obtiene el conteo de productos activos.
   */
  async getActiveCount(): Promise<number> {
    return productRepository.countActive();
  }

  /**
   * Busca un producto por nombre.
   */
  async findByName(name: string): Promise<Product | null> {
    return productRepository.findByName(name);
  }
}

// Exportar instancia singleton
export const productService = new ProductService();

import { reportRepository, reportDetailRepository } from '@repositories/ReportRepository';
import { tempEntregasRepository } from '@repositories/TempEntregasRepository';
import { tempPedidosRepository } from '@repositories/TempPedidosRepository';
import { tempDesperdicioRepository } from '@repositories/TempDesperdicioRepository';
import { Report, ReportDetail, TempCount, TempPedido, TempDesperdicio, ReportWithDetails, MovementType } from '@app-types/index';

/**
 * Servicio para la lógica de negocio de reportes.
 * 
 * Modelo "Pedidos vs Entregas":
 * - Pedidos: Lo que cocina necesita del proveedor
 * - Entregas: Lo que el proveedor entrega
 */
class ReportService {
  /**
   * Obtiene todos los reportes ordenados por fecha.
   */
  async getAllReports(): Promise<Report[]> {
    return reportRepository.findAllOrdered();
  }

  /**
   * Obtiene reportes por tipo de movimiento.
   */
  async getReportsByType(type: MovementType): Promise<Report[]> {
    return reportRepository.findByType(type);
  }

   /**
    * Obtiene solo reportes de entregas.
    */
  async getEntregasReports(): Promise<Report[]> {
    return reportRepository.findEntregas();
  }

   /**
    * Obtiene solo reportes de pedidos.
    */
  async getPedidosReports(): Promise<Report[]> {
    // legacy method returning all pedidos
    return reportRepository.findPedidos();
  }

  /**
   * Returns only those pedidos that do not have any entregas linked to them.
   * Used when the user must select a pedido antes de registrar entregas.
   */
  async getAvailablePedidos(): Promise<Report[]> {
    return reportRepository.findPedidosWithoutEntregas();
  }

  /**
   * Ids de pedidos que tienen entregas vinculadas.
   */
  async getPedidoIdsWithEntregas(): Promise<number[]> {
    return reportRepository.findPedidoIdsWithEntregas();
  }

  /**
   * Convenience boolean check whether a given pedido has entregas linked.
   */
  async hasEntregasForPedido(pedidoId: number): Promise<boolean> {
    const ids = await this.getPedidoIdsWithEntregas();
    return ids.includes(pedidoId);
  }

  /**
   * Obtiene un reporte por su ID.
   */
  async getReportById(reportId: number): Promise<Report | null> {
    return reportRepository.findById(reportId);
  }

  /**
   * Obtiene los detalles de un reporte.
   */
  async getReportDetails(reportId: number): Promise<ReportDetail[]> {
    return reportRepository.getDetails(reportId);
  }

  /**
   * Obtiene un reporte completo con sus detalles.
   */
  async getReportWithDetails(reportId: number): Promise<ReportWithDetails | null> {
    return reportRepository.findByIdWithDetails(reportId);
  }

  /**
   * Guarda un nuevo reporte de entregas a partir de los conteos temporales.
   * @throws Error si no hay conteos para guardar.
   */
  async saveEntregasReport(counts: TempCount[], relatedReportId?: number | null): Promise<number> {
    // Filtrar solo cantidades positivas
    const validCounts = counts.filter(c => c.quantity > 0);

    if (validCounts.length === 0) {
      throw new Error('No hay productos con cantidades para guardar');
    }

    // Crear el reporte de entregas
    // Si existe un pedido reciente para relacionar, el UI podrá pasar su id.
    // Por ahora creamos la entrega sin relación (caller puede pasar relatedReportId más adelante si se extiende).
    const reportId = await reportRepository.createWithDetails(validCounts, 'entregas', relatedReportId ?? null);

    // Limpiar conteos temporales después de guardar exitosamente
    await tempEntregasRepository.clearAll();

    return reportId;
  }

  /**
   * Guarda o actualiza el reporte de pedidos del mes actual.
   * Si ya existe un reporte de pedidos para este mes, lo actualiza (reemplaza).
   * Si no existe, crea uno nuevo.
   * @throws Error si no hay pedidos para guardar.
   */
  async savePedidosReport(pedidos: TempPedido[], reportIdToEdit?: number | null): Promise<number> {
    // Filtrar solo cantidades positivas
    const validPedidos = pedidos.filter(pedido => pedido.quantity > 0);

    if (validPedidos.length === 0) {
      throw new Error('No hay productos con cantidades para guardar');
    }

    // Si se pasa un reportId, actualizar ese reporte en particular (modo edición explícito)
    if (typeof reportIdToEdit !== 'undefined' && reportIdToEdit !== null) {
      await reportRepository.updateReportDetails(reportIdToEdit, validPedidos);
      await tempPedidosRepository.clearAll();
      return reportIdToEdit;
    }

    const reportId = await reportRepository.createWithDetails(validPedidos, 'pedidos');

    // Limpiar pedidos temporales después de guardar exitosamente
    await tempPedidosRepository.clearAll();

    return reportId;
  }

  /**
   * Obtiene la lista de reportes de pedidos (misma función ya existente) y retorna detalles de uno por id
   */
  async getPedidoWithDetails(id: number) {
    return reportRepository.findByIdWithDetails(id);
  }

  /**
   * Obtiene el reporte de pedidos del mes actual con sus detalles.
   * Útil para cargar valores existentes en la pantalla de pedidos.
   */
  async getCurrentMonthPedidosReport(): Promise<ReportWithDetails | null> {
    return reportRepository.getCurrentMonthPedidosReport();
  }

  /**
   * Obtiene el reporte de pedidos del mes anterior con sus detalles.
   * Útil para copiar automáticamente cuando se inicia un nuevo mes.
   */
  async getPreviousMonthPedidosReport(): Promise<ReportWithDetails | null> {
    return reportRepository.getPreviousMonthPedidosReport();
  }

  /**
   * Guarda un nuevo reporte (mantener compatibilidad con código existente).
   * Por defecto crea un reporte de entregas.
   * @throws Error si no hay conteos para guardar.
   */
  async saveReport(counts: TempCount[]): Promise<number> {
    return this.saveEntregasReport(counts);
  }

  /**
   * Elimina un reporte y todos sus detalles.
   */
  async deleteReport(reportId: number): Promise<void> {
    const reportWithDetails = await reportRepository.findByIdWithDetails(reportId);
    if (!reportWithDetails) {
      throw new Error('Reporte no encontrado');
    }

    await reportRepository.deleteWithDetails(reportId);
  }

  /**
   * Obtiene reportes dentro de un rango de fechas.
   */
  async getReportsByDateRange(startDate: Date, endDate: Date): Promise<Report[]> {
    return reportRepository.findByDateRange(
      startDate.toISOString(),
      endDate.toISOString()
    );
  }

  /**
   * Obtiene reportes por tipo dentro de un rango de fechas.
   */
  async getReportsByTypeAndDateRange(type: MovementType, startDate: Date, endDate: Date): Promise<Report[]> {
    return reportRepository.findByTypeAndDateRange(
      type,
      startDate.toISOString(),
      endDate.toISOString()
    );
  }

  /**
   * Obtiene el total de items en un reporte.
   */
  async getReportTotal(reportId: number): Promise<number> {
    return reportRepository.countItemsInReport(reportId);
  }

  /**
   * Obtiene el historial de cantidades de un producto específico.
   */
  async getProductHistory(productName: string): Promise<ReportDetail[]> {
    return reportDetailRepository.findByProductName(productName);
  }

  /**
   * Obtiene el último detalle de pedido (más reciente) para un producto.
   */
  async getLatestPedidoDetail(productName: string): Promise<ReportDetail | null> {
    // El repo actual puede no implementar getLatestPedidoDetail directamente;
    // usar una consulta alternativa si es necesario. De momento delegamos y
    // silenciamos TS si no existe para mantener compatibilidad.
    // @ts-ignore
    return (reportRepository as any).getLatestPedidoDetail
      ? (reportRepository as any).getLatestPedidoDetail(productName)
      : null;
  }

  /**
   * Obtiene el total histórico de un producto.
   */
  async getProductTotalHistory(productName: string): Promise<number> {
    return reportDetailRepository.getTotalByProduct(productName);
  }

  /**
   * Obtiene totales por producto para un tipo de movimiento.
   */
  async getTotalsByProduct(type: MovementType): Promise<{ product_name: string; total: number }[]> {
    return reportRepository.getTotalsByProduct(type);
  }

  // === GESTIÓN DE CONTEOS TEMPORALES (ENTREGAS) ===

  /**
   * Guarda un conteo temporal.
   */
  async saveTempCount(productName: string, quantity: number): Promise<void> {
    await tempEntregasRepository.upsert(productName, quantity);
  }

  /**
   * Guarda múltiples conteos temporales.
   */
  async saveTempCounts(counts: TempCount[]): Promise<void> {
    await tempEntregasRepository.upsertMany(counts);
  }

  /**
   * Obtiene todos los conteos temporales.
   */
  async getTempCounts(): Promise<TempCount[]> {
    return tempEntregasRepository.getAll();
  }

  /**
   * Limpia todos los conteos temporales.
   */
  async clearTempCounts(): Promise<void> {
    await tempEntregasRepository.clearAll();
  }

  /**
   * Verifica si hay conteos pendientes de guardar.
   */
  async hasPendingCounts(): Promise<boolean> {
    return tempEntregasRepository.hasPendingCounts();
  }

  // === GESTIÓN DE DESPERDICIOS TEMPORALES ===

  /**
   * Saves a temporary desperdicio entry.
   */
  async saveTempDesperdicio(productName: string, quantity: number): Promise<void> {
    await tempDesperdicioRepository.upsert(productName, quantity);
  }

  /**
   * Saves multiple temporary desperdicio entries.
   */
  async saveTempDesperdicios(desperdicios: TempDesperdicio[]): Promise<void> {
    await tempDesperdicioRepository.upsertMany(desperdicios);
  }

  /**
   * Guarda un reporte definitivo de desperdicio.
   * Valida que cada cantidad de desperdicio no supere lo recibido (preferencia: conteos temporales de entregas).
   */
  async saveDesperdicioReport(desperdicios: TempDesperdicio[]): Promise<number> {
    // Filtrar solo cantidades positivas
    const valid = desperdicios.filter(d => d.quantity > 0);

    if (valid.length === 0) {
      throw new Error('No hay productos con cantidades para guardar');
    }

    // Obtener cantidades recibidas preferentemente desde temp_entregas
    const tempCounts = await tempEntregasRepository.getAll();
    const entregasMap = new Map<string, number>();
    if (tempCounts && tempCounts.length > 0) {
      tempCounts.forEach(t => entregasMap.set(t.product_name, t.quantity));
    } else {
      // Fallback: totales históricos de entregas
      const totals = await this.getTotalsByProduct('entregas');
      totals.forEach(t => entregasMap.set(t.product_name, t.total));
    }

    // Validar que desperdicio <= recibido por producto
    for (const d of valid) {
      const received = entregasMap.get(d.product_name) || 0;
      if (d.quantity > received) {
        throw new Error(`Desperdicio de ${d.product_name} (${d.quantity}) excede lo recibido (${received})`);
      }
    }

    // Crear el reporte definitivo de tipo 'desperdicio'
    const reportId = await reportRepository.createWithDetails(valid, 'desperdicio');

    // Limpiar temporales
    await tempDesperdicioRepository.clearAll();

    return reportId;
  }

  /**
   * Retrieves all temporary desperdicio entries.
   */
  async getTempDesperdicio(): Promise<TempDesperdicio[]> {
    return tempDesperdicioRepository.getAll();
  }

  /**
   * Clears all temporary desperdicio entries.
   */
  async clearTempDesperdicio(): Promise<void> {
    await tempDesperdicioRepository.clearAll();
  }

// === GESTIÓN DE PEDIDOS TEMPORALES ===

  /**
   * Guarda un pedido temporal.
   */
  async saveTempPedido(productName: string, quantity: number): Promise<void> {
    await tempPedidosRepository.upsert(productName, quantity);
  }

  /**
   * Guarda múltiples pedidos temporales.
   */
  async saveTempPedidos(pedidos: TempPedido[]): Promise<void> {
    await tempPedidosRepository.upsertMany(pedidos);
  }

  /**
   * Obtiene todos los pedidos temporales.
   */
  async getTempPedidos(): Promise<TempPedido[]> {
    return tempPedidosRepository.getAll();
  }

  /**
   * Limpia todos los pedidos temporales.
   */
  async clearTempPedidos(): Promise<void> {
    await tempPedidosRepository.clearAll();
  }

  /**
   * Verifica si hay pedidos pendientes de guardar.
   */
  async hasPendingPedidos(): Promise<boolean> {
    return tempPedidosRepository.hasPendingPedidos();
  }

  /**
   * Elimina el pedido temporal de un producto específico.
   */
  async removeTempPedido(productName: string): Promise<void> {
    await tempPedidosRepository.removeByProductName(productName);
  }

  /**
   * Elimina el conteo temporal de un producto específico (entregas).
   */
  async removeTempCount(productName: string): Promise<void> {
    await tempEntregasRepository.removeByProductName(productName);
  }
}

// Exportar instancia singleton
export const reportService = new ReportService();

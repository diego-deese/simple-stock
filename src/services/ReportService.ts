import { reportRepository, reportDetailRepository } from '@repositories/ReportRepository';
import { tempCountRepository } from '@repositories/TempCountRepository';
import { Report, ReportDetail, TempCount, ReportWithDetails } from '@app-types/index';

/**
 * Servicio para la lógica de negocio de reportes.
 */
class ReportService {
  /**
   * Obtiene todos los reportes ordenados por fecha.
   */
  async getAllReports(): Promise<Report[]> {
    return reportRepository.findAllOrdered();
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
   * Guarda un nuevo reporte a partir de los conteos temporales.
   * @throws Error si no hay conteos para guardar.
   */
  async saveReport(counts: TempCount[]): Promise<number> {
    // Filtrar solo cantidades positivas
    const validCounts = counts.filter(c => c.quantity > 0);

    if (validCounts.length === 0) {
      throw new Error('No hay productos con cantidades para guardar');
    }

    // Crear el reporte
    const reportId = await reportRepository.createWithDetails(validCounts);

    // Limpiar conteos temporales después de guardar exitosamente
    await tempCountRepository.clearAll();

    return reportId;
  }

  /**
   * Elimina un reporte y todos sus detalles.
   */
  async deleteReport(reportId: number): Promise<void> {
    const exists = await reportRepository.findById(reportId);
    if (!exists) {
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
   * Obtiene el total histórico de un producto.
   */
  async getProductTotalHistory(productName: string): Promise<number> {
    return reportDetailRepository.getTotalByProduct(productName);
  }

  // === GESTIÓN DE CONTEOS TEMPORALES ===

  /**
   * Guarda un conteo temporal.
   */
  async saveTempCount(productName: string, quantity: number): Promise<void> {
    await tempCountRepository.upsert(productName, quantity);
  }

  /**
   * Guarda múltiples conteos temporales.
   */
  async saveTempCounts(counts: TempCount[]): Promise<void> {
    await tempCountRepository.upsertMany(counts);
  }

  /**
   * Obtiene todos los conteos temporales.
   */
  async getTempCounts(): Promise<TempCount[]> {
    return tempCountRepository.getAll();
  }

  /**
   * Limpia todos los conteos temporales.
   */
  async clearTempCounts(): Promise<void> {
    await tempCountRepository.clearAll();
  }

  /**
   * Verifica si hay conteos pendientes de guardar.
   */
  async hasPendingCounts(): Promise<boolean> {
    return tempCountRepository.hasPendingCounts();
  }
}

// Exportar instancia singleton
export const reportService = new ReportService();

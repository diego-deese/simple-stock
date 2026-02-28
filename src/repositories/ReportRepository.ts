import { BaseRepository } from './BaseRepository';
import { Report, ReportDetail, TempCount, ReportWithDetails } from '@app-types/index';
import { dbConnection } from '@database/connection';

/**
 * Repositorio para operaciones con reportes.
 */
class ReportRepository extends BaseRepository<Report> {
  constructor() {
    super('reports', 'id');
  }

  /**
   * Obtiene todos los reportes ordenados por fecha (más reciente primero).
   */
  async findAllOrdered(): Promise<Report[]> {
    return this.findAll('date DESC');
  }

  /**
   * Crea un nuevo reporte con sus detalles.
   * Usa transacción para garantizar consistencia.
   */
  async createWithDetails(counts: TempCount[]): Promise<number> {
    const db = this.getDb();
    
    // Crear el reporte
    const reportResult = await db.runAsync(
      'INSERT INTO reports (date) VALUES (CURRENT_TIMESTAMP)'
    );
    const reportId = reportResult.lastInsertRowId;

    // Insertar los detalles (solo cantidades > 0)
    for (const count of counts) {
      if (count.quantity > 0) {
        await db.runAsync(
          'INSERT INTO report_details (report_id, product_name, quantity) VALUES (?, ?, ?)',
          [reportId, count.product_name, count.quantity]
        );
      }
    }

    return reportId;
  }

  /**
   * Obtiene los detalles de un reporte.
   */
  async getDetails(reportId: number): Promise<ReportDetail[]> {
    const db = this.getDb();
    const result = await db.getAllAsync<ReportDetail>(
      'SELECT id, report_id, product_name, quantity FROM report_details WHERE report_id = ? ORDER BY product_name',
      [reportId]
    );
    return result;
  }

  /**
   * Obtiene un reporte con todos sus detalles.
   */
  async findByIdWithDetails(reportId: number): Promise<ReportWithDetails | null> {
    const report = await this.findById(reportId);
    if (!report) return null;

    const details = await this.getDetails(reportId);
    return { report, details };
  }

  /**
   * Elimina un reporte y todos sus detalles (cascade).
   */
  async deleteWithDetails(reportId: number): Promise<void> {
    const db = this.getDb();
    
    // Los detalles se eliminan automáticamente por ON DELETE CASCADE
    // Pero por seguridad, eliminamos explícitamente
    await db.runAsync('DELETE FROM report_details WHERE report_id = ?', [reportId]);
    await this.delete(reportId);
  }

  /**
   * Obtiene reportes en un rango de fechas.
   */
  async findByDateRange(startDate: string, endDate: string): Promise<Report[]> {
    return this.rawQuery<Report>(
      'SELECT * FROM reports WHERE date >= ? AND date <= ? ORDER BY date DESC',
      [startDate, endDate]
    );
  }

  /**
   * Cuenta el total de items registrados en un reporte.
   */
  async countItemsInReport(reportId: number): Promise<number> {
    const result = await this.rawQueryOne<{ total: number }>(
      'SELECT SUM(quantity) as total FROM report_details WHERE report_id = ?',
      [reportId]
    );
    return result?.total || 0;
  }
}

/**
 * Repositorio para detalles de reportes.
 * Útil para consultas específicas sobre detalles.
 */
class ReportDetailRepository extends BaseRepository<ReportDetail> {
  constructor() {
    super('report_details', 'id');
  }

  /**
   * Obtiene todos los detalles de un reporte.
   */
  async findByReportId(reportId: number): Promise<ReportDetail[]> {
    return this.findWhere(
      { report_id: reportId } as Partial<Record<keyof ReportDetail, unknown>>,
      'product_name'
    );
  }

  /**
   * Busca detalles por nombre de producto (histórico).
   */
  async findByProductName(productName: string): Promise<ReportDetail[]> {
    return this.findWhere(
      { product_name: productName } as Partial<Record<keyof ReportDetail, unknown>>
    );
  }

  /**
   * Obtiene el total histórico de un producto.
   */
  async getTotalByProduct(productName: string): Promise<number> {
    const result = await this.rawQueryOne<{ total: number }>(
      'SELECT SUM(quantity) as total FROM report_details WHERE product_name = ?',
      [productName]
    );
    return result?.total || 0;
  }
}

// Exportar instancias singleton
export const reportRepository = new ReportRepository();
export const reportDetailRepository = new ReportDetailRepository();

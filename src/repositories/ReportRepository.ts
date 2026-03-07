import { BaseRepository } from './BaseRepository';
import { Report, ReportDetail, TempCount, ReportWithDetails, MovementType, TempPedido } from '@app-types/index';
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
   * Obtiene reportes por tipo de movimiento.
   */
  async findByType(type: MovementType): Promise<Report[]> {
    return this.rawQuery<Report>(
      'SELECT * FROM reports WHERE type = ? ORDER BY date DESC',
      [type]
    );
  }

   /**
    * Obtiene reportes de entregas.
    */
  async findEntregas(): Promise<Report[]> {
    return this.findByType('entregas');
  }

   /**
    * Obtiene reportes de pedidos de cocina.
    */
  async findPedidos(): Promise<Report[]> {
    return this.findByType('pedidos');
  }

  /**
   * Crea un nuevo reporte con sus detalles.
   * Usa transacción para garantizar consistencia.
   * @param counts - Conteos de productos
    * @param type - Tipo de movimiento ('entregas' | 'pedidos')
    */
  async createWithDetails(counts: TempCount[] | TempPedido[], type: MovementType = 'entregas', relatedReportId?: number | null): Promise<number> {
    const db = this.getDb();
    
    // Crear el reporte con tipo
    let reportResult: any;
    if (typeof relatedReportId !== 'undefined' && relatedReportId !== null) {
      reportResult = await db.runAsync(
        'INSERT INTO reports (date, type, related_report_id) VALUES (CURRENT_TIMESTAMP, ?, ?)',
        [type, relatedReportId]
      );
    } else {
      reportResult = await db.runAsync(
        'INSERT INTO reports (date, type) VALUES (CURRENT_TIMESTAMP, ?)',
        [type]
      );
    }
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
   * Obtiene el último detalle de pedido (por fecha del reporte) para un producto.
   * Devuelve null si no existe.
   */
  async getLatestPedidoDetail(productName: string): Promise<ReportDetail | null> {
    const db = this.getDb();
    const row = await db.getFirstAsync<ReportDetail>(
      `SELECT rd.id, rd.report_id, rd.product_name, rd.quantity, rd.created_at
       FROM report_details rd
       JOIN reports r ON rd.report_id = r.id
       WHERE rd.product_name = ? AND r.type = 'pedidos'
       ORDER BY r.date DESC
       LIMIT 1`,
      [productName]
    );

    return row || null;
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
   * Obtiene reportes por tipo en un rango de fechas.
   */
  async findByTypeAndDateRange(type: MovementType, startDate: string, endDate: string): Promise<Report[]> {
    return this.rawQuery<Report>(
      'SELECT * FROM reports WHERE type = ? AND date >= ? AND date <= ? ORDER BY date DESC',
      [type, startDate, endDate]
    );
  }

  /**
   * Obtiene el reporte de un tipo específico para un mes dado.
   * Retorna el primero si hay múltiples (no debería haber).
   * @param type - Tipo de movimiento
   * @param year - Año (ej: 2026)
   * @param month - Mes (1-12)
   */
  async findByTypeAndMonth(type: MovementType, year: number, month: number): Promise<Report | null> {
    const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
    const endDate = month === 12
      ? `${year + 1}-01-01`
      : `${year}-${(month + 1).toString().padStart(2, '0')}-01`;

    const results = await this.rawQuery<Report>(
      'SELECT * FROM reports WHERE type = ? AND date >= ? AND date < ? ORDER BY date DESC LIMIT 1',
      [type, startDate, endDate]
    );
    
    return results.length > 0 ? results[0] : null;
  }

   /**
    * Obtiene el reporte de pedidos del mes actual con sus detalles.
    */
  async getCurrentMonthPedidosReport(): Promise<ReportWithDetails | null> {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    
    const report = await this.findByTypeAndMonth('pedidos', year, month);
    if (!report) return null;
    
    const details = await this.getDetails(report.id);
    return { report, details };
  }

  /**
   * Calcula el año y mes anterior, manejando el cambio de año.
   * @param year - Año actual
   * @param month - Mes actual (1-12)
   * @returns Objeto con año y mes anterior
   */
  private getPreviousMonth(year: number, month: number): { year: number, month: number } {
    if (month === 1) {
      return { year: year - 1, month: 12 };
    } else {
      return { year, month: month - 1 };
    }
  }

   /**
    * Obtiene el reporte de pedidos del mes anterior con sus detalles.
    * Útil para copiar automáticamente al iniciar un nuevo mes.
    * @param currentYear - Año actual
    * @param currentMonth - Mes actual (1-12)
    */
  async getPreviousMonthPedidosReport(currentYear?: number, currentMonth?: number): Promise<ReportWithDetails | null> {
    // Si no se especifican, usar fecha actual
    const now = new Date();
    const year = currentYear ?? now.getFullYear();
    const month = currentMonth ?? (now.getMonth() + 1);
    
    const { year: prevYear, month: prevMonth } = this.getPreviousMonth(year, month);
    
    const report = await this.findByTypeAndMonth('pedidos', prevYear, prevMonth);
    if (!report) return null;
    
    const details = await this.getDetails(report.id);
    return { report, details };
  }

  /**
   * Actualiza los detalles de un reporte existente.
   * Reemplaza todos los detalles con los nuevos valores.
   * @param reportId - ID del reporte a actualizar
   * @param counts - Nuevos conteos de productos
   */
  async updateReportDetails(reportId: number, counts: TempCount[] | TempPedido[]): Promise<void> {
    const db = this.getDb();
    
    // Eliminar detalles existentes
    await db.runAsync('DELETE FROM report_details WHERE report_id = ?', [reportId]);
    
    // Insertar nuevos detalles (solo cantidades > 0)
    for (const count of counts) {
      if (count.quantity > 0) {
        await db.runAsync(
          'INSERT INTO report_details (report_id, product_name, quantity) VALUES (?, ?, ?)',
          [reportId, count.product_name, count.quantity]
        );
      }
    }
    
    // Actualizar la fecha del reporte
    await db.runAsync(
      'UPDATE reports SET date = CURRENT_TIMESTAMP WHERE id = ?',
      [reportId]
    );
  }

   /**
    * Crea o actualiza el reporte de pedidos del mes actual.
    * Si ya existe un reporte de pedidos para este mes, lo actualiza.
    * Si no existe, crea uno nuevo.
    * @param counts - Conteos de productos
    * @returns ID del reporte (nuevo o existente)
    */
  async upsertPedidosReport(counts: TempPedido[]): Promise<number> {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    
    // Buscar si ya existe un reporte de pedidos para este mes
    const existingReport = await this.findByTypeAndMonth('pedidos', year, month);
    
    if (existingReport) {
      // Actualizar el reporte existente
      await this.updateReportDetails(existingReport.id, counts);
      return existingReport.id;
    } else {
      // Crear nuevo reporte
      return this.createWithDetails(counts, 'pedidos');
    }
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

  /**
   * Obtiene el total de entradas/salidas por producto.
   */
  async getTotalsByProduct(type: MovementType): Promise<{ product_name: string; total: number }[]> {
    return this.rawQuery<{ product_name: string; total: number }>(
      `SELECT rd.product_name, SUM(rd.quantity) as total
       FROM report_details rd
       INNER JOIN reports r ON rd.report_id = r.id
       WHERE r.type = ?
       GROUP BY rd.product_name
       ORDER BY rd.product_name`,
      [type]
    );
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

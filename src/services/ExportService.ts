import { File, Directory, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { reportRepository } from '@repositories/ReportRepository';
import { productRepository } from '@repositories/ProductRepository';
import { inventoryRepository } from '@repositories/InventoryRepository';
import { MovementType } from '@app-types/index';

/**
 * Servicio para exportación de datos.
 * Maneja la generación y guardado de archivos CSV.
 * 
 * Modelo "Pedidos vs Entregas":
 * - Pedidos: Lo que cocina necesita del proveedor
 * - Entregas: Lo que el proveedor entrega
 * - Balance: Entregas - Pedidos (positivo = completo, negativo = faltante)
 */
class ExportService {
  /**
   * Genera el contenido CSV de un reporte.
   */
  async generateReportCSV(reportId: number): Promise<string> {
    const reportData = await reportRepository.findByIdWithDetails(reportId);
    
    if (!reportData) {
      throw new Error('Reporte no encontrado');
    }

    const { report, details } = reportData;
    const reportDate = new Date(report.date).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    
    const typeLabel = report.type === 'entregas' ? 'Entregas del Proveedor' : 'Pedidos de Cocina';

    // Generar CSV
    let csv = `Reporte de ${typeLabel}\n`;
    csv += `Fecha: ${reportDate}\n`;
    csv += `Tipo: ${typeLabel}\n`;
    csv += `ID Reporte: ${report.id}\n\n`;
    csv += 'Producto,Cantidad,Unidad\n';

    for (const detail of details) {
      // Buscar la unidad del producto
      const product = await productRepository.findByName(detail.product_name);
      const unit = product?.unit || 'unidad';
      
      // Escapar comas en nombres de productos
      const productName = detail.product_name.includes(',') 
        ? `"${detail.product_name}"` 
        : detail.product_name;
      
      csv += `${productName},${detail.quantity},${unit}\n`;
    }

    return csv;
  }

  /**
   * Genera CSV con todos los reportes en un rango de fechas.
   */
  async generateMultipleReportsCSV(reportIds: number[]): Promise<string> {
    let csv = 'Exportación de Múltiples Reportes\n';
    csv += `Fecha de exportación: ${new Date().toLocaleDateString('es-ES')}\n`;
    csv += `Total de reportes: ${reportIds.length}\n\n`;

    for (const reportId of reportIds) {
      const reportData = await reportRepository.findByIdWithDetails(reportId);
      if (!reportData) continue;

      const { report, details } = reportData;
      const reportDate = new Date(report.date).toLocaleDateString('es-ES');
      const typeLabel = report.type === 'entregas' ? 'ENTREGAS' : 'PEDIDOS';

      csv += `--- ${typeLabel} del ${reportDate} (ID: ${report.id}) ---\n`;
      csv += 'Producto,Cantidad,Unidad\n';

      for (const detail of details) {
        const product = await productRepository.findByName(detail.product_name);
        const unit = product?.unit || 'unidad';
        csv += `${detail.product_name},${detail.quantity},${unit}\n`;
      }

      csv += '\n';
    }

    return csv;
  }

  /**
   * Genera CSV con el historial completo de un producto.
   */
  async generateProductHistoryCSV(productName: string): Promise<string> {
    const history = await reportRepository.rawQuery<{
      date: string;
      quantity: number;
      type: MovementType;
    }>(
      `SELECT r.date, rd.quantity, r.type 
       FROM report_details rd 
       JOIN reports r ON r.id = rd.report_id 
       WHERE rd.product_name = ? 
       ORDER BY r.date DESC`,
      [productName]
    );

    const product = await productRepository.findByName(productName);
    const unit = product?.unit || 'unidad';

    let csv = `Historial de ${productName}\n`;
    csv += `Unidad: ${unit}\n`;
    csv += `Fecha de exportación: ${new Date().toLocaleDateString('es-ES')}\n\n`;
    csv += 'Fecha,Tipo,Cantidad\n';

    let totalEntregas = 0;
    let totalPedidos = 0;

    for (const record of history) {
      const date = new Date(record.date).toLocaleDateString('es-ES');
      const typeLabel = record.type === 'entregas' ? 'Entregas' : 'Pedidos';
      csv += `${date},${typeLabel},${record.quantity}\n`;
      
      if (record.type === 'entregas') {
        totalEntregas += record.quantity;
      } else {
        totalPedidos += record.quantity;
      }
    }

    // Calcular totales
    csv += `\nTotal Entregas,,${totalEntregas}\n`;
    csv += `Total Pedidos,,${totalPedidos}\n`;
    csv += `Diferencia,,${totalEntregas - totalPedidos}\n`;

    return csv;
  }

  /**
   * Genera CSV con el balance mensual.
   */
  async generateBalanceMensualCSV(year: number, month: number): Promise<string> {
    const balance = await inventoryRepository.getBalanceMensual(year, month);
    const monthNames = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    
    let csv = `Balance Mensual - ${monthNames[month - 1]} ${year}\n`;
    csv += `Fecha de exportación: ${new Date().toLocaleDateString('es-ES')}\n\n`;
    csv += 'Producto,Unidad,Categoría,Pedidos,Entregas,Desperdicio,Diferencia,Estado\n';

    let grandTotalPedidos = 0;
    let grandTotalEntregas = 0;
    let grandTotalDiferencia = 0;

    for (const item of balance) {
      const productName = item.product_name.includes(',') 
        ? `"${item.product_name}"` 
        : item.product_name;
      const category = item.category_name || 'Sin categoría';
      const estado = item.diferencia >= 0 ? 'Completo' : 'Faltante';
      
      csv += `${productName},${item.unit},${category},${item.total_pedidos},${item.total_entregas},${item.total_desperdicio || 0},${item.diferencia},${estado}\n`;
      
      grandTotalPedidos += item.total_pedidos;
      grandTotalEntregas += item.total_entregas;
      grandTotalDiferencia += item.diferencia;
    }

    csv += `\nTOTALES,,,${grandTotalPedidos},${grandTotalEntregas},${grandTotalDiferencia},\n`;

    return csv;
  }

   /**
    * Genera CSV consolidado con pedidos y entregas por producto.
    */
  async generateConsolidatedReportCSV(startDate?: Date, endDate?: Date): Promise<string> {
    let dateFilter = '';
    const params: (string | number)[] = [];
    
    if (startDate && endDate) {
      dateFilter = 'WHERE r.date >= ? AND r.date <= ?';
      params.push(startDate.toISOString(), endDate.toISOString());
    }

    // Query para obtener totales por producto y tipo
    const sql = `
      SELECT 
        rd.product_name,
        r.type,
        SUM(rd.quantity) as total
      FROM report_details rd
      INNER JOIN reports r ON rd.report_id = r.id
      ${dateFilter}
      GROUP BY rd.product_name, r.type
      ORDER BY rd.product_name, r.type
    `;

    const results = await reportRepository.rawQuery<{
      product_name: string;
      type: MovementType;
      total: number;
    }>(sql, params);

    // Agrupar por producto
    const productMap = new Map<string, { entregas: number; pedidos: number }>();
    
    for (const row of results) {
      const existing = productMap.get(row.product_name) || { entregas: 0, pedidos: 0 };
      if (row.type === 'entregas') {
        existing.entregas = row.total;
      } else {
        existing.pedidos = row.total;
      }
      productMap.set(row.product_name, existing);
    }

    // Generar CSV
    let csv = 'Reporte Consolidado: Pedidos vs Entregas\n';
    csv += `Fecha de exportación: ${new Date().toLocaleDateString('es-ES')}\n`;
    
    if (startDate && endDate) {
      csv += `Período: ${startDate.toLocaleDateString('es-ES')} - ${endDate.toLocaleDateString('es-ES')}\n`;
    } else {
      csv += 'Período: Todo el historial\n';
    }
    
    csv += '\nProducto,Unidad,Pedidos,Entregas,Diferencia,Estado\n';

    let totalPedidos = 0;
    let totalEntregas = 0;

    for (const [productName, totals] of productMap) {
      const product = await productRepository.findByName(productName);
      const unit = product?.unit || 'unidad';
      const diferencia = totals.entregas - totals.pedidos;
      const estado = diferencia >= 0 ? 'Completo' : 'Faltante';
      
      const escapedName = productName.includes(',') 
        ? `"${productName}"` 
        : productName;
      
      csv += `${escapedName},${unit},${totals.pedidos},${totals.entregas},${diferencia},${estado}\n`;
      
      totalPedidos += totals.pedidos;
      totalEntregas += totals.entregas;
    }

    csv += `\nTOTALES,,${totalPedidos},${totalEntregas},${totalEntregas - totalPedidos},\n`;

    return csv;
  }

  /**
   * Exporta y comparte el balance mensual.
   */
  async exportAndShareBalanceMensual(year: number, month: number): Promise<void> {
    const csv = await this.generateBalanceMensualCSV(year, month);
    const fileName = `balance_${year}_${month.toString().padStart(2, '0')}_${Date.now()}.csv`;
    const filePath = await this.saveCSVToFile(csv, fileName);
    await this.shareFile(filePath);
  }

  /**
   * Exporta y comparte el reporte consolidado.
   */
  async exportAndShareConsolidatedReport(startDate?: Date, endDate?: Date): Promise<void> {
    const csv = await this.generateConsolidatedReportCSV(startDate, endDate);
    const fileName = `reporte_consolidado_${Date.now()}.csv`;
    const filePath = await this.saveCSVToFile(csv, fileName);
    await this.shareFile(filePath);
  }

  /**
   * Guarda un archivo CSV en el directorio de documentos.
   * Usa la nueva API de expo-file-system (Paths, File, Directory).
   */
  async saveCSVToFile(content: string, fileName: string): Promise<string> {
    const documentsDir = Paths.document;
    const file = new File(documentsDir, fileName);
    
    // Escribir contenido al archivo
    await file.write(content);

    return file.uri;
  }

  /**
   * Exporta un reporte y lo guarda como archivo CSV.
   */
  async exportReportToFile(reportId: number): Promise<string> {
    const csv = await this.generateReportCSV(reportId);
    const fileName = `reporte_${reportId}_${Date.now()}.csv`;
    return this.saveCSVToFile(csv, fileName);
  }

  /**
   * Comparte un archivo usando el sistema de compartir del dispositivo.
   */
  async shareFile(filePath: string): Promise<void> {
    const isAvailable = await Sharing.isAvailableAsync();
    
    if (!isAvailable) {
      throw new Error('La función de compartir no está disponible en este dispositivo');
    }

    await Sharing.shareAsync(filePath, {
      mimeType: 'text/csv',
      dialogTitle: 'Compartir reporte',
    });
  }

  /**
   * Exporta y comparte un reporte en un solo paso.
   */
  async exportAndShareReport(reportId: number): Promise<void> {
    const filePath = await this.exportReportToFile(reportId);
    await this.shareFile(filePath);
  }

  /**
   * Lista archivos CSV exportados previamente.
   */
  listExportedFiles(): string[] {
    try {
      const documentsDir = Paths.document;
      const contents = documentsDir.list();
      
      return contents
        .filter((item): item is File => item instanceof File)
        .filter(file => file.name.endsWith('.csv'))
        .map(file => file.name);
    } catch {
      return [];
    }
  }

  /**
   * Elimina un archivo exportado.
   */
  async deleteExportedFile(fileName: string): Promise<void> {
    const documentsDir = Paths.document;
    const file = new File(documentsDir, fileName);
    
    if (file.exists) {
      await file.delete();
    }
  }

  /**
   * Obtiene la URI de un archivo exportado.
   */
  getExportedFileUri(fileName: string): string {
    const documentsDir = Paths.document;
    const file = new File(documentsDir, fileName);
    return file.uri;
  }
}

// Exportar instancia singleton
export const exportService = new ExportService();

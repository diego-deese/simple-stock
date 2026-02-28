import { File, Directory, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { reportRepository } from '@repositories/ReportRepository';
import { productRepository } from '@repositories/ProductRepository';

/**
 * Servicio para exportación de datos.
 * Maneja la generación y guardado de archivos CSV.
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

    // Generar CSV
    let csv = 'Reporte de Inventario\n';
    csv += `Fecha: ${reportDate}\n`;
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

      csv += `--- Reporte del ${reportDate} (ID: ${report.id}) ---\n`;
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
    }>(
      `SELECT r.date, rd.quantity 
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
    csv += 'Fecha,Cantidad\n';

    for (const record of history) {
      const date = new Date(record.date).toLocaleDateString('es-ES');
      csv += `${date},${record.quantity}\n`;
    }

    // Calcular total
    const total = history.reduce((sum, r) => sum + r.quantity, 0);
    csv += `\nTotal histórico,${total}\n`;

    return csv;
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

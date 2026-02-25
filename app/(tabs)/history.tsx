import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';

import { useApp } from '../../src/context/AppContext';
import { useAuth } from '../../src/context/AuthContext';
import { reportService, exportService } from '../../src/services';
import { Report, ReportDetail } from '../../src/types';
import { colors } from '../../src/theme/colors';

export default function HistoryScreen() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { reports, loading } = useApp();
  
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [reportDetails, setReportDetails] = useState<ReportDetail[]>([]);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Proteger la ruta - redirigir si no está autenticado
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.navigate('/admin');
    }
  }, [isAuthenticated, authLoading]);

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleReportPress = async (report: Report) => {
    try {
      setLoadingDetails(true);
      setSelectedReport(report);
      
      const details = await reportService.getReportDetails(report.id);
      setReportDetails(details);
      setShowDetailsModal(true);
    } catch (error) {
      Alert.alert('Error', 'No se pudieron cargar los detalles del reporte');
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleExportReport = async (report: Report) => {
    try {
      setExporting(true);
      
      // Exportar y compartir el reporte usando el servicio
      await exportService.exportAndShareReport(report.id);
      
    } catch (error) {
      console.error('Error al exportar:', error);
      
      // Fallback: mostrar el contenido CSV en un alert
      try {
        const csvContent = await exportService.generateReportCSV(report.id);
        const date = new Date(report.date);
        const fileName = `reporte_${date.getFullYear()}_${(date.getMonth() + 1)
          .toString().padStart(2, '0')}_${date.getDate()
          .toString().padStart(2, '0')}.csv`;
        
        Alert.alert(
          'Contenido del Reporte',
          `Archivo: ${fileName}\n\n${csvContent.substring(0, 200)}${csvContent.length > 200 ? '...' : ''}`,
          [{ text: 'OK' }]
        );
      } catch {
        Alert.alert('Error', 'No se pudo exportar el reporte');
      }
    } finally {
      setExporting(false);
    }
  };

  const ReportDetailsModal = () => (
    <Modal
      visible={showDetailsModal}
      transparent={true}
      animationType="slide"
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {loadingDetails ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.loadingText}>Cargando detalles...</Text>
            </View>
          ) : (
            <>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Detalles del Reporte</Text>
                <Text style={styles.modalDate}>
                  {selectedReport ? formatDate(selectedReport.date) : ''}
                </Text>
              </View>

              <FlatList
                data={reportDetails}
                keyExtractor={(item) => item.id.toString()}
                style={styles.detailsList}
                renderItem={({ item }) => (
                  <View style={styles.detailItem}>
                    <Text style={styles.detailProductName}>{item.product_name}</Text>
                    <Text style={styles.detailQuantity}>{item.quantity}</Text>
                  </View>
                )}
                ListEmptyComponent={
                  <View style={styles.emptyDetails}>
                    <Text style={styles.emptyDetailsText}>
                      No hay productos en este reporte
                    </Text>
                  </View>
                }
              />

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.exportButton]}
                  onPress={() => {
                    if (selectedReport) {
                      setShowDetailsModal(false);
                      handleExportReport(selectedReport);
                    }
                  }}
                  disabled={exporting}
                >
                  <Text style={styles.exportButtonText}>Exportar CSV</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.modalButton, styles.closeButton]}
                  onPress={() => setShowDetailsModal(false)}
                >
                  <Text style={styles.closeButtonText}>Cerrar</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </View>
    </Modal>
  );

  const ReportItem = ({ item }: { item: Report }) => (
    <TouchableOpacity
      style={styles.reportItem}
      onPress={() => handleReportPress(item)}
    >
      <View style={styles.reportInfo}>
        <Text style={styles.reportDate}>{formatDate(item.date)}</Text>
        <Text style={styles.reportSubtitle}>Toca para ver detalles</Text>
      </View>
      
      <View style={styles.reportActions}>
        <TouchableOpacity
          style={styles.exportIconButton}
          onPress={(e) => {
            e.stopPropagation();
            handleExportReport(item);
          }}
          disabled={exporting}
        >
          {exporting ? (
            <ActivityIndicator size="small" color="#007AFF" />
          ) : (
            <Text style={styles.exportIcon}>📤</Text>
          )}
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  if (loading || authLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Cargando reportes...</Text>
      </View>
    );
  }

  // No renderizar si no está autenticado (mientras redirige)
  if (!isAuthenticated) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.navigate('/admin')}
        >
          <Text style={styles.backButtonText}>← Volver</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Historial de Reportes</Text>
        <Text style={styles.headerSubtitle}>
          {reports.length} reporte{reports.length !== 1 ? 's' : ''} guardado{reports.length !== 1 ? 's' : ''}
        </Text>
      </View>

      <FlatList
        data={reports}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => <ReportItem item={item} />}
        style={styles.reportList}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No hay reportes guardados</Text>
            <Text style={styles.emptySubtext}>
              Los reportes aparecerán aquí después de guardarlos
            </Text>
          </View>
        }
      />

      <ReportDetailsModal />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 18,
    color: colors.textSecondary,
  },
  header: {
    backgroundColor: colors.primaryDark,
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  backButton: {
    marginBottom: 12,
  },
  backButtonText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 16,
    fontWeight: '500',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.textLight,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  reportList: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  reportItem: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 20,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  reportInfo: {
    flex: 1,
  },
  reportDate: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  reportSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  reportActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  exportIconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.backgroundDark,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  exportIcon: {
    fontSize: 20,
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 60,
  },
  emptyText: {
    fontSize: 18,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 24,
    width: '90%',
    maxHeight: '80%',
  },
  modalHeader: {
    marginBottom: 20,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  modalDate: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  detailsList: {
    maxHeight: 300,
    marginBottom: 20,
  },
  detailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  detailProductName: {
    fontSize: 16,
    color: colors.textPrimary,
    flex: 1,
  },
  detailQuantity: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primary,
    marginLeft: 16,
  },
  emptyDetails: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyDetailsText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 6,
  },
  exportButton: {
    backgroundColor: colors.primary,
  },
  closeButton: {
    backgroundColor: colors.backgroundDark,
    borderWidth: 1,
    borderColor: colors.border,
  },
  exportButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textLight,
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textSecondary,
  },
});

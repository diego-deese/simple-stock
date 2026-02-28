import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { useApp } from '@context/AppContext';
import { useAuth } from '@context/AuthContext';
import { reportService, exportService } from '@services/index';
import { Report, ReportDetail } from '@app-types/index';
import { colors } from '@theme/colors';
import { ReportItem } from './report-item';
import { ReportDetailsModal } from './report-details-modal';

export function History() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { reports, loading } = useApp();
  
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [reportDetails, setReportDetails] = useState<ReportDetail[]>([]);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [exporting, setExporting] = useState(false);

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
      await exportService.exportAndShareReport(report.id);
    } catch (error) {
      console.error('Error al exportar:', error);
      
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

  const handleExportFromModal = () => {
    if (selectedReport) {
      setShowDetailsModal(false);
      handleExportReport(selectedReport);
    }
  };

  if (loading || authLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Cargando reportes...</Text>
      </View>
    );
  }

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
        renderItem={({ item }) => (
          <ReportItem
            item={item}
            exporting={exporting}
            onPress={handleReportPress}
            onExport={handleExportReport}
            formatDate={formatDate}
          />
        )}
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

      <ReportDetailsModal
        visible={showDetailsModal}
        selectedReport={selectedReport}
        reportDetails={reportDetails}
        loadingDetails={loadingDetails}
        exporting={exporting}
        onExport={handleExportFromModal}
        onClose={() => setShowDetailsModal(false)}
        formatDate={formatDate}
      />
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
});

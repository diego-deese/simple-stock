import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { router } from 'expo-router';
import { useApp } from '@context/AppContext';
import { useAuth } from '@context/AuthContext';
import { reportService, exportService } from '@services/index';
import { Report, ReportDetail, MovementType } from '@app-types/index';
import { colors } from '@theme/colors';
import { ReportItem } from './report-item';
import { ReportDetailsModal } from './report-details-modal';
import LoadingScreen from '@components/LoadingScreen';
import ScreenHeader from '@components/ScreenHeader';
import EmptyState from '@components/EmptyState';

// Colores para los tipos de movimiento
const ENTREGAS_COLOR = colors.success;
const PEDIDOS_COLOR = colors.warning;

type FilterType = 'all' | MovementType;

export function History() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { reports, loading } = useApp();
  
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [reportDetails, setReportDetails] = useState<ReportDetail[]>([]);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');

  // Filtrar reportes según el filtro activo
  const filteredReports = useMemo(() => {
    if (activeFilter === 'all') {
      return reports;
    }
    return reports.filter(report => report.type === activeFilter);
  }, [reports, activeFilter]);

  // Contar reportes por tipo
  const counts = useMemo(() => ({
    all: reports.length,
    entregas: reports.filter(r => r.type === 'entregas').length,
    pedidos: reports.filter(r => r.type === 'pedidos').length,
  }), [reports]);

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
    return <LoadingScreen message="Cargando reportes..." />;
  }

  if (!isAuthenticated) {
    return <LoadingScreen />;
  }

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="Historial de Reportes"
        subtitle={`${filteredReports.length} reporte${filteredReports.length !== 1 ? 's' : ''} guardado${filteredReports.length !== 1 ? 's' : ''}`}
        backgroundColor={colors.primaryDark}
        showBackButton
        backRoute="/admin"
      />

      {/* Filtros de tipo */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[
            styles.filterButton,
            activeFilter === 'all' && styles.filterButtonActive,
          ]}
          onPress={() => setActiveFilter('all')}
        >
          <Text style={[
            styles.filterText,
            activeFilter === 'all' && styles.filterTextActive,
          ]}>
            Todos ({counts.all})
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.filterButton,
            activeFilter === 'entregas' && styles.filterButtonEntregas,
          ]}
          onPress={() => setActiveFilter('entregas')}
        >
          <Text style={[
            styles.filterText,
            activeFilter === 'entregas' && styles.filterTextActive,
          ]}>
            📦 Entregas ({counts.entregas})
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.filterButton,
            activeFilter === 'pedidos' && styles.filterButtonPedidos,
          ]}
          onPress={() => setActiveFilter('pedidos')}
        >
          <Text style={[
            styles.filterText,
            activeFilter === 'pedidos' && styles.filterTextActive,
          ]}>
            📋 Pedidos ({counts.pedidos})
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredReports}
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
          <EmptyState
            message={activeFilter === 'all' 
              ? "No hay reportes guardados"
              : `No hay ${activeFilter === 'entregas' ? 'entregas' : 'pedidos'} registrados`
            }
            hint={activeFilter === 'all'
              ? "Los reportes aparecerán aquí después de guardarlos"
              : "Cambia el filtro o registra movimientos"
            }
            style={styles.emptyContainer}
          />
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
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: colors.backgroundDark,
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: colors.primary,
  },
  filterButtonEntregas: {
    backgroundColor: ENTREGAS_COLOR,
  },
  filterButtonPedidos: {
    backgroundColor: PEDIDOS_COLOR,
  },
  filterText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  filterTextActive: {
    color: colors.white,
  },
  reportList: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  emptyContainer: {
    marginTop: 60,
  },
});

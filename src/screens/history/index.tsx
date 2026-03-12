import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Alert,
  TouchableOpacity,
  ScrollView,
  useWindowDimensions,
} from 'react-native';
import { router } from 'expo-router';
import { useApp } from '@context/AppContext';
import AccessibleButton from '@components/AccessibleButton';
import { useAuth } from '@context/AuthContext';
import { reportService, exportService } from '@services/index';
import { Report, ReportDetail, MovementType } from '@app-types/index';
import { colors } from '@theme/colors';
import { formatLocalFromSqlite, parseSqliteUtc } from '@helpers/date';
import { ReportItem } from './report-item';
import { ReportDetailsModal } from './report-details-modal';
import LoadingScreen from '@components/LoadingScreen';
import ScreenHeader from '@components/ScreenHeader';
import EmptyState from '@components/EmptyState';

// Colores para los tipos de movimiento
const ENTREGAS_COLOR = colors.success;
const PEDIDOS_COLOR = colors.warning;
const DESPERDICIO_COLOR = colors.warning; // usamos warning para desperdicio

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
  const { width } = useWindowDimensions();
  const isSmallDevice = width < 380; // adjust threshold as needed

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
    desperdicio: reports.filter(r => r.type === 'desperdicio').length,
  }), [reports]);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.navigate('/admin');
    }
  }, [isAuthenticated, authLoading]);

  const formatDate = (dateString: string): string => {
    return formatLocalFromSqlite(dateString, 'es-ES', {
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
        const date = parseSqliteUtc(report.date);
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

  const handleExportFullReport = async () => {
    try {
      setExporting(true);
      await exportService.exportAndShareFullReport();
    } catch (error) {
      console.error('Error al exportar reporte general:', error);
      Alert.alert('Error', 'No se pudo exportar el reporte general');
    } finally {
      setExporting(false);
    }
  };

  const handleExportPedidosComparison = async () => {
    try {
      setExporting(true);
      await exportService.exportAndShareAllPedidosComparison();
    } catch (error) {
      console.error('Error al exportar comparación:', error);
      Alert.alert('Error', 'No se pudo exportar la comparación de pedidos');
    } finally {
      setExporting(false);
    }
  };

  const handleExportByPedido = async (report: Report) => {
    try {
      setExporting(true);
      await exportService.exportAndShareReportByPedido(report.id);
    } catch (error) {
      console.error('Error al exportar pedido:', error);
      Alert.alert('Error', 'No se pudo exportar el reporte del pedido');
    } finally {
      setExporting(false);
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
      {isSmallDevice ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScrollContent}
          nestedScrollEnabled
          directionalLockEnabled
        >
          <AccessibleButton
            title={`Todos (${counts.all})`}
            onPress={() => setActiveFilter('all')}
            style={[
              styles.filterButtonSmall,
              styles.filterButtonHorizontal,
              activeFilter === 'all' && styles.filterButtonActive,
            ]}
            textStyle={[styles.filterText, activeFilter === 'all' && styles.filterTextActive]}
            responsiveText
          />

          <AccessibleButton
            title={`📦 Entregas (${counts.entregas})`}
            onPress={() => setActiveFilter('entregas')}
            style={[
              styles.filterButtonSmall,
              styles.filterButtonHorizontal,
              activeFilter === 'entregas' && styles.filterButtonEntregas,
            ]}
            textStyle={[styles.filterText, activeFilter === 'entregas' && styles.filterTextActive]}
            responsiveText
          />

          <AccessibleButton
            title={`📋 Pedidos (${counts.pedidos})`}
            onPress={() => setActiveFilter('pedidos')}
            style={[
              styles.filterButtonSmall,
              styles.filterButtonHorizontal,
              activeFilter === 'pedidos' && styles.filterButtonPedidos,
            ]}
            textStyle={[styles.filterText, activeFilter === 'pedidos' && styles.filterTextActive]}
            responsiveText
          />

          <AccessibleButton
            title={`♻️ Desperdicio (${counts.desperdicio})`}
            onPress={() => setActiveFilter('desperdicio')}
            style={[
              styles.filterButtonSmall,
              styles.filterButtonHorizontal,
              activeFilter === 'desperdicio' && styles.filterButtonDesperdicio,
            ]}
            textStyle={[styles.filterText, activeFilter === 'desperdicio' && styles.filterTextActive]}
            responsiveText
          />
        </ScrollView>
      ) : (
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

          <TouchableOpacity
            style={[
              styles.filterButton,
              activeFilter === 'desperdicio' && styles.filterButtonDesperdicio,
            ]}
            onPress={() => setActiveFilter('desperdicio')}
          >
            <Text style={[
              styles.filterText,
              activeFilter === 'desperdicio' && styles.filterTextActive,
            ]}>
              ♻️ Desperdicio ({counts.desperdicio})
            </Text>
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        data={filteredReports}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <ReportItem
            item={item}
            exporting={exporting}
            onPress={handleReportPress}
            onExport={handleExportReport}
            onExportByPedido={item.type === 'pedidos' ? handleExportByPedido : undefined}
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

      {/* Botones de exportación general */}
      {reports.length > 0 && (
        <View style={styles.exportBar}>
          <TouchableOpacity
            style={[styles.exportButton, styles.exportButtonFull]}
            onPress={handleExportFullReport}
            disabled={exporting}
          >
            <Text style={styles.exportButtonText}>
              📊 Exportar Todo
            </Text>
          </TouchableOpacity>

          {counts.pedidos > 0 && (
            <TouchableOpacity
              style={[styles.exportButton, styles.exportButtonPedidos]}
              onPress={handleExportPedidosComparison}
              disabled={exporting}
            >
              <Text style={styles.exportButtonText}>
                📋 Pedidos vs Entregas
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}

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
  filterScrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    alignItems: 'center',
  },
  filterButtonHorizontal: {
    marginRight: 8,
  },
  filterButtonSmall: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: colors.backgroundDark,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 120,
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
  filterButtonDesperdicio: {
    backgroundColor: DESPERDICIO_COLOR,
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
  exportBar: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  exportButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  exportButtonFull: {
    backgroundColor: colors.primaryDark,
  },
  exportButtonPedidos: {
    backgroundColor: colors.secondary,
  },
  exportButtonText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 14,
  },
});

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { Report, ReportDetail } from '@app-types/index';
import { colors } from '@theme/colors';

interface ReportDetailsModalProps {
  visible: boolean;
  selectedReport: Report | null;
  reportDetails: ReportDetail[];
  loadingDetails: boolean;
  exporting: boolean;
  onExport: () => void;
  onClose: () => void;
  formatDate: (date: string) => string;
}

export function ReportDetailsModal({
  visible,
  selectedReport,
  reportDetails,
  loadingDetails,
  exporting,
  onExport,
  onClose,
  formatDate,
}: ReportDetailsModalProps) {
  return (
    <Modal
      visible={visible}
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
                  onPress={onExport}
                  disabled={exporting}
                >
                  <Text style={styles.exportButtonText}>Exportar CSV</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.modalButton, styles.closeButton]}
                  onPress={onClose}
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
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 18,
    color: colors.textSecondary,
  },
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

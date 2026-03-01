import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
} from 'react-native';
import { Report, ReportDetail } from '@app-types/index';
import { colors } from '@theme/colors';
import AccessibleButton from '@components/AccessibleButton';
import LoadingScreen from '@components/LoadingScreen';
import ModalWrapper from '@components/ModalWrapper';
import EmptyState from '@components/EmptyState';

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
    <ModalWrapper visible={visible} width="90%">
      {loadingDetails ? (
        <LoadingScreen message="Cargando detalles..." fullScreen={false} />
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
              <EmptyState 
                message="No hay productos en este reporte"
                style={styles.emptyDetails}
              />
            }
          />

          <View style={styles.modalButtons}>
            <AccessibleButton
              title="Exportar"
              onPress={onExport}
              disabled={exporting}
              variant="primary"
              style={styles.modalButton}
            />
            
            <AccessibleButton
              title="Cerrar"
              onPress={onClose}
              variant="secondary"
              style={styles.modalButton}
            />
          </View>
        </>
      )}
    </ModalWrapper>
  );
}

const styles = StyleSheet.create({
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
    paddingVertical: 40,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  modalButton: {
    flex: 1,
  },
});

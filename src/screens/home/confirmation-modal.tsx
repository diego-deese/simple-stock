import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
} from 'react-native';
import { TempCount } from '@app-types/index';
import { colors } from '@theme/colors';
import AccessibleButton from '@components/AccessibleButton';
import ModalWrapper from '@components/ModalWrapper';

interface ConfirmationModalProps {
  visible: boolean;
  tempCounts: TempCount[];
  saving: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export function ConfirmationModal({ 
  visible, 
  tempCounts, 
  saving, 
  onCancel, 
  onConfirm 
}: ConfirmationModalProps) {
  const countsToShow = tempCounts.filter(count => count.quantity > 0);

  return (
    <ModalWrapper visible={visible} maxHeight="70%">
      <Text style={styles.modalTitle}>Confirmar Reporte</Text>
      
      <Text style={styles.modalSubtitle}>
        Se registrarán los siguientes productos:
      </Text>
      
      <FlatList
        data={countsToShow}
        keyExtractor={(item) => item.product_name}
        style={styles.modalList}
        renderItem={({ item }) => (
          <View style={styles.modalItem}>
            <Text style={styles.modalItemName}>{item.product_name}</Text>
            <Text style={styles.modalItemQuantity}>{item.quantity}</Text>
          </View>
        )}
      />
      
      <View style={styles.modalButtons}>
        <AccessibleButton
          title="Cancelar"
          onPress={onCancel}
          disabled={saving}
          variant="secondary"
          style={styles.modalButton}
        />
        
        <AccessibleButton
          title="Guardar"
          onPress={onConfirm}
          loading={saving}
          variant="primary"
          style={styles.modalButton}
        />
      </View>
    </ModalWrapper>
  );
}

const styles = StyleSheet.create({
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: 16,
  },
  modalSubtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
  },
  modalList: {
    maxHeight: 200,
  },
  modalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  modalItemName: {
    fontSize: 16,
    color: colors.textPrimary,
  },
  modalItemQuantity: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primary,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
    gap: 12,
  },
  modalButton: {
    flex: 1,
  },
});

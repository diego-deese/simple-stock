import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { Product } from '@app-types/index';
import { colors } from '@theme/colors';
import AccessibleButton from '@components/AccessibleButton';
import ModalWrapper from '@components/ModalWrapper';

const COMMON_UNITS = ['kg', 'litros', 'bultos', 'cajas', 'latas', 'paquetes', 'unidades'];

interface ProductModalProps {
  visible: boolean;
  editingProduct: Product | null;
  productName: string;
  productUnit: string;
  saving: boolean;
  onNameChange: (name: string) => void;
  onUnitChange: (unit: string) => void;
  onCancel: () => void;
  onSave: () => void;
}

export function ProductModal({
  visible,
  editingProduct,
  productName,
  productUnit,
  saving,
  onNameChange,
  onUnitChange,
  onCancel,
  onSave,
}: ProductModalProps) {
  return (
    <ModalWrapper visible={visible} width="90%">
      <Text style={styles.modalTitle}>
        {editingProduct ? 'Editar Producto' : 'Nuevo Producto'}
      </Text>
      
      <View style={styles.formGroup}>
        <Text style={styles.label}>Nombre del producto *</Text>
        <TextInput
          style={styles.textInput}
          value={productName}
          onChangeText={onNameChange}
          placeholder="Ej: Arroz, Frijoles, etc."
          placeholderTextColor="#999"
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Unidad de medida *</Text>
        <TextInput
          style={styles.textInput}
          value={productUnit}
          onChangeText={onUnitChange}
          placeholder="Ej: kg, litros, bultos"
          placeholderTextColor="#999"
        />
        
        <Text style={styles.unitsLabel}>Unidades comunes:</Text>
        <View style={styles.unitsContainer}>
          {COMMON_UNITS.map((unit) => (
            <TouchableOpacity
              key={unit}
              style={[
                styles.unitButton,
                productUnit === unit && styles.unitButtonSelected
              ]}
              onPress={() => onUnitChange(unit)}
            >
              <Text style={[
                styles.unitButtonText,
                productUnit === unit && styles.unitButtonTextSelected
              ]}>
                {unit}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
      
      <View style={styles.modalButtons}>
        <AccessibleButton
          title="Cancelar"
          onPress={onCancel}
          variant="secondary"
          disabled={saving}
          style={styles.modalButton}
          responsiveText
        />
        
        <AccessibleButton
          title={editingProduct ? 'Actualizar' : 'Agregar'}
          onPress={onSave}
          variant="primary"
          disabled={saving}
          loading={saving}
          style={styles.modalButton}
          responsiveText
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
    marginBottom: 24,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    backgroundColor: colors.backgroundDark,
  },
  unitsLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 12,
    marginBottom: 8,
  },
  unitsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  unitButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: colors.backgroundDark,
    borderWidth: 1,
    borderColor: colors.border,
  },
  unitButtonSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  unitButtonText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  unitButtonTextSelected: {
    color: colors.textLight,
    fontWeight: '600',
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

import React, { useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
} from 'react-native';
import { Product, Category } from '@app-types/index';
import { colors } from '@theme/colors';
import AccessibleButton from '@components/AccessibleButton';
import ModalWrapper from '@components/ModalWrapper';
import FormInput from '@components/FormInput';

const COMMON_UNITS = ['kg', 'litros', 'bultos', 'cajas', 'latas', 'paquetes', 'unidades'];

interface ProductModalProps {
  visible: boolean;
  editingProduct: Product | null;
  productName: string;
  productUnit: string;
  selectedCategoryId: number | null;
  categories: Category[];
  saving: boolean;
  onNameChange: (name: string) => void;
  onUnitChange: (unit: string) => void;
  onCategoryChange: (categoryId: number | null) => void;
  onCancel: () => void;
  onSave: () => void;
}

export function ProductModal({
  visible,
  editingProduct,
  productName,
  productUnit,
  selectedCategoryId,
  categories,
  saving,
  onNameChange,
  onUnitChange,
  onCategoryChange,
  onCancel,
  onSave,
}: ProductModalProps) {
  const unitRef = useRef<TextInput>(null);

  return (
    <ModalWrapper visible={visible} width="90%" avoidKeyboard>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={styles.modalTitle}>
          {editingProduct ? 'Editar Producto' : 'Nuevo Producto'}
        </Text>
        
        <FormInput
          label="Nombre del producto"
          required
          value={productName}
          onChangeText={onNameChange}
          placeholder="Ej: Arroz, Frijoles, etc."
          style={styles.textInput}
          returnKeyType="next"
          onSubmitEditing={() => unitRef.current?.focus()}
          blurOnSubmit={false}
        />

        <View style={styles.formGroup}>
          <FormInput
            ref={unitRef}
            label="Unidad de medida"
            required
            value={productUnit}
            onChangeText={onUnitChange}
            placeholder="Ej: kg, litros, bultos"
            style={styles.textInput}
            containerStyle={styles.unitInputContainer}
            returnKeyType="done"
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

        <View style={styles.formGroup}>
          <Text style={styles.label}>Categoría</Text>
          <View style={styles.categoriesContainer}>
            <TouchableOpacity
              style={[
                styles.categoryButton,
                selectedCategoryId === null && styles.categoryButtonSelected
              ]}
              onPress={() => onCategoryChange(null)}
            >
              <Text style={[
                styles.categoryButtonText,
                selectedCategoryId === null && styles.categoryButtonTextSelected
              ]}>
                Sin categoría
              </Text>
            </TouchableOpacity>
            
            {categories.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.categoryButton,
                  selectedCategoryId === category.id && styles.categoryButtonSelected
                ]}
                onPress={() => onCategoryChange(category.id)}
              >
                <Text style={[
                  styles.categoryButtonText,
                  selectedCategoryId === category.id && styles.categoryButtonTextSelected
                ]}>
                  {category.name}
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
      </ScrollView>
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
  unitInputContainer: {
    marginBottom: 0,
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
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 8,
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
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: colors.backgroundDark,
    borderWidth: 2,
    borderColor: colors.border,
  },
  categoryButtonSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primaryDark,
  },
  categoryButtonText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  categoryButtonTextSelected: {
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

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import { Category } from '@app-types/index';
import { colors } from '@theme/colors';
import AccessibleButton from '@components/AccessibleButton';
import ModalWrapper from '@components/ModalWrapper';
import FormInput from '@components/FormInput';

interface CategoryModalProps {
  visible: boolean;
  editingCategory: Category | null;
  categoryName: string;
  saving: boolean;
  onNameChange: (name: string) => void;
  onCancel: () => void;
  onSave: () => void;
}

export function CategoryModal({
  visible,
  editingCategory,
  categoryName,
  saving,
  onNameChange,
  onCancel,
  onSave,
}: CategoryModalProps) {
  return (
    <ModalWrapper visible={visible} width="90%" avoidKeyboard>
      <Text style={styles.modalTitle}>
        {editingCategory ? 'Editar Categoría' : 'Nueva Categoría'}
      </Text>
      
      <FormInput
        label="Nombre de la categoría"
        required
        value={categoryName}
        onChangeText={onNameChange}
        placeholder="Ej: Frutas y Verduras, Carnes, etc."
        style={styles.textInput}
        returnKeyType="done"
        onSubmitEditing={onSave}
        autoFocus
      />

      <View style={styles.hint}>
        <Text style={styles.hintText}>
          Las categorías ayudan a organizar los productos en el registro mensual.
        </Text>
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
          title={editingCategory ? 'Actualizar' : 'Agregar'}
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
  textInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    backgroundColor: colors.backgroundDark,
  },
  hint: {
    marginTop: 12,
    padding: 12,
    backgroundColor: colors.backgroundDark,
    borderRadius: 8,
  },
  hintText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
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

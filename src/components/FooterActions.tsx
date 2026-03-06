import React from 'react';
import { View, StyleSheet } from 'react-native';
import AccessibleButton from '@components/AccessibleButton';
import { colors } from '@theme/colors';

interface FooterActionsProps {
  isEditMode: boolean;
  onToggleEdit: () => void;
  onSave: () => void;
  saveDisabled?: boolean;
  saveColor?: string;
}

export default function FooterActions({ isEditMode, onToggleEdit, onSave, saveDisabled, saveColor }: FooterActionsProps) {
  return (
    <View style={styles.footer}>
      <View style={styles.footerButtons}>
        <AccessibleButton
          title={isEditMode ? 'CANCELAR' : 'EDITAR'}
          onPress={onToggleEdit}
          variant={isEditMode ? 'danger' : 'secondary'}
          style={styles.editButton}
          responsiveText
        />

        <AccessibleButton
          title="GUARDAR"
          onPress={onSave}
          disabled={!!saveDisabled}
          variant="primary"
          style={[styles.saveButton, saveColor ? { backgroundColor: saveColor } : {}]}
          responsiveText
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  footer: {
    padding: 20,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  footerButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  editButton: { flex: 1 },
  saveButton: { flex: 2 },
});

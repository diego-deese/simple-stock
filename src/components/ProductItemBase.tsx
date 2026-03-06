import React, { useState, useEffect, memo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { Product } from '@app-types/index';
import { colors } from '@theme/colors';

export interface ProductItemBaseProps {
  item: Product;
  quantity: number;
  isEditMode: boolean;
  receivedQuantity?: number;
  onDecrement: () => void;
  onIncrement: () => void;
  onQuantityChange: (value: number) => void;
  variantColor?: string; // optional color override for increase button
  showStock?: boolean;
}

export const ProductItemBase = memo(function ProductItemBase(props: ProductItemBaseProps) {
  const {
    item,
    quantity,
    isEditMode,
    receivedQuantity,
    onDecrement,
    onIncrement,
    onQuantityChange,
    variantColor,
    showStock,
  } = props;
  const [inputText, setInputText] = useState(String(quantity));

  useEffect(() => {
    setInputText(String(quantity));
  }, [quantity]);

  const handleChangeText = (text: string) => {
    const clean = text.replace(/[^0-9]/g, '');
    setInputText(clean);
  };

  const commitValue = () => {
    const parsed = parseInt(inputText, 10);
    const newValue = isNaN(parsed) ? 0 : Math.max(0, parsed);
    setInputText(String(newValue));
    onQuantityChange(newValue);
  };

  const remaining = (receivedQuantity ?? 0) - quantity;

  return (
    <View style={styles.productItem}>
      <View style={styles.rowTop}>
        <View style={styles.productInfo}>
          <Text style={styles.productName}>{item.name}</Text>
          <Text style={styles.productUnit}>({item.unit})</Text>
        </View>

        <View style={styles.quantityContainer}>
          <TouchableOpacity
            style={[styles.quantityButton, styles.decreaseButton, !isEditMode && styles.buttonDisabled]}
            onPress={onDecrement}
            disabled={!isEditMode}
            accessibilityLabel={`Disminuir ${item.name}`}
          >
            <Text style={[styles.buttonText, !isEditMode && styles.buttonTextDisabled]}>−</Text>
          </TouchableOpacity>

          <TextInput
            style={[styles.quantityInput, !isEditMode && styles.inputDisabled]}
            value={inputText}
            onChangeText={handleChangeText}
            onEndEditing={commitValue}
            onBlur={commitValue}
            keyboardType="numeric"
            returnKeyType="done"
            selectTextOnFocus
            maxLength={6}
            textAlign="center"
            editable={isEditMode}
          />

          <TouchableOpacity
            style={[styles.quantityButton, { backgroundColor: variantColor ?? colors.success }, !isEditMode && styles.buttonDisabled]}
            onPress={onIncrement}
            disabled={!isEditMode}
            accessibilityLabel={`Aumentar ${item.name}`}
          >
            <Text style={[styles.buttonText, !isEditMode && styles.buttonTextDisabled]}>+</Text>
          </TouchableOpacity>
        </View>
      </View>

      {(showStock !== false) && (
        <View style={styles.stockInfoContainer}>
          <Text style={styles.stockText}>En inventario: {receivedQuantity ?? 0}</Text>
          <Text style={styles.stockSeparator}> · </Text>
          <Text style={styles.wasteText}>Desperdicio: {quantity}</Text>
        </View>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  productItem: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 20,
    marginBottom: 12,
    flexDirection: 'column',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  rowTop: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  productInfo: { flex: 1 },
  productName: { fontSize: 20, fontWeight: 'bold', color: colors.textPrimary, marginBottom: 4 },
  productUnit: { fontSize: 16, color: colors.textSecondary },
  quantityContainer: { flexDirection: 'row', alignItems: 'center' },
  quantityButton: { width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center' },
  decreaseButton: { backgroundColor: colors.error },
  buttonText: { fontSize: 28, fontWeight: 'bold', color: colors.textLight },
  buttonDisabled: { backgroundColor: colors.border, opacity: 0.5 },
  buttonTextDisabled: { color: colors.textSecondary },
  quantityInput: {
    minWidth: 80,
    height: 60,
    backgroundColor: colors.backgroundDark,
    borderRadius: 8,
    marginHorizontal: 12,
    borderWidth: 2,
    borderColor: colors.border,
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.textPrimary,
    paddingHorizontal: 4,
    textAlignVertical: 'center',
  },
  inputDisabled: { opacity: 0.6 },
  stockInfoContainer: { width: '100%', marginTop: 12, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  stockText: { fontSize: 16, color: colors.textPrimary, fontWeight: '600' },
  wasteText: { fontSize: 16, color: colors.error, fontWeight: '600' },
  stockSeparator: { marginHorizontal: 8, fontSize: 16, color: colors.textSecondary },
});

export default ProductItemBase;

import React, { useState, useEffect, memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { Product } from '@app-types/index';
import { colors } from '@theme/colors';

export interface ProductItemProps {
  item: Product;
  quantity: number;
  onDecrement: () => void;
  onIncrement: () => void;
  onQuantityChange: (value: number) => void;
}

// Usar memo para evitar re-renders innecesarios cuando las props no cambian
export const ProductItem = memo(function ProductItem({ 
  item, 
  quantity, 
  onDecrement, 
  onIncrement, 
  onQuantityChange 
}: ProductItemProps) {
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

  return (
    <View style={styles.productItem}>
      <View style={styles.productInfo}>
        <Text style={styles.productName}>{item.name}</Text>
        <Text style={styles.productUnit}>({item.unit})</Text>
      </View>

      <View style={styles.quantityContainer}>
        <TouchableOpacity
          style={[styles.quantityButton, styles.decreaseButton]}
          onPress={onDecrement}
        >
          <Text style={styles.buttonText}>−</Text>
        </TouchableOpacity>

        <TextInput
          style={styles.quantityInput}
          value={inputText}
          onChangeText={handleChangeText}
          onEndEditing={commitValue}
          onBlur={commitValue}
          keyboardType="numeric"
          returnKeyType="done"
          selectTextOnFocus
          maxLength={6}
          textAlign="center"
        />

        <TouchableOpacity
          style={[styles.quantityButton, styles.increaseButton]}
          onPress={onIncrement}
        >
          <Text style={styles.buttonText}>+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  productItem: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 20,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  productUnit: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  decreaseButton: {
    backgroundColor: colors.error,
  },
  increaseButton: {
    backgroundColor: colors.success,
  },
  buttonText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.textLight,
  },
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
});

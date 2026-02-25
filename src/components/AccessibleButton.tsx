import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';

interface AccessibleButtonProps {
  title: string;
  onPress: () => void;
  style?: ViewStyle;
  textStyle?: TextStyle;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'danger' | 'success';
}

export default function AccessibleButton({
  title,
  onPress,
  style,
  textStyle,
  disabled = false,
  variant = 'primary'
}: AccessibleButtonProps) {
  const getVariantStyle = () => {
    switch (variant) {
      case 'secondary':
        return styles.secondaryButton;
      case 'danger':
        return styles.dangerButton;
      case 'success':
        return styles.successButton;
      default:
        return styles.primaryButton;
    }
  };

  const getVariantTextStyle = () => {
    switch (variant) {
      case 'secondary':
        return styles.secondaryButtonText;
      case 'danger':
      case 'success':
      case 'primary':
      default:
        return styles.primaryButtonText;
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.baseButton,
        getVariantStyle(),
        disabled && styles.disabledButton,
        style
      ]}
      onPress={onPress}
      disabled={disabled}
      accessible={true}
      accessibilityLabel={title}
      accessibilityRole="button"
    >
      <Text style={[
        styles.baseText,
        getVariantTextStyle(),
        disabled && styles.disabledText,
        textStyle
      ]}>
        {title}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  baseButton: {
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56, // Altura mínima para accesibilidad
  },
  baseText: {
    fontSize: 18, // Fuente > 18px según especificaciones
    fontWeight: 'bold',
    textAlign: 'center',
  },
  primaryButton: {
    backgroundColor: '#007AFF',
  },
  secondaryButton: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#dee2e6',
  },
  dangerButton: {
    backgroundColor: '#FF6B6B',
  },
  successButton: {
    backgroundColor: '#28a745',
  },
  primaryButtonText: {
    color: 'white',
  },
  secondaryButtonText: {
    color: '#6c757d',
  },
  disabledButton: {
    opacity: 0.5,
  },
  disabledText: {
    opacity: 0.7,
  },
});
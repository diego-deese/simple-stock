import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle, useWindowDimensions, ActivityIndicator } from 'react-native';
import { colors } from '@theme/colors';

interface AccessibleButtonProps {
  title: string;
  onPress: () => void;
  style?: ViewStyle;
  textStyle?: TextStyle;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'danger' | 'success';
  responsiveText?: boolean;
  loading?: boolean;
}

export default function AccessibleButton({
  title,
  onPress,
  style,
  textStyle,
  disabled = false,
  variant = 'primary',
  responsiveText = false,
  loading = false
}: AccessibleButtonProps) {
  const { width } = useWindowDimensions();
  const fontSize = responsiveText && width < 420 ? 16 : 18;
  const isDisabled = disabled || loading;

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

  const getLoadingColor = () => {
    return variant === 'secondary' ? colors.textSecondary : colors.textLight;
  };

  return (
    <TouchableOpacity
      style={[
        styles.baseButton,
        getVariantStyle(),
        isDisabled && styles.disabledButton,
        style
      ]}
      onPress={onPress}
      disabled={isDisabled}
      accessible={true}
      accessibilityLabel={title}
      accessibilityRole="button"
    >
      {loading ? (
        <ActivityIndicator color={getLoadingColor()} />
      ) : (
        <Text style={[
          styles.baseText,
          getVariantTextStyle(),
          isDisabled && styles.disabledText,
          { fontSize },
          textStyle
        ]}>
          {title}
        </Text>
      )}
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
    backgroundColor: colors.primary,
  },
  secondaryButton: {
    backgroundColor: colors.backgroundDark,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dangerButton: {
    backgroundColor: colors.error,
  },
  successButton: {
    backgroundColor: colors.success,
  },
  primaryButtonText: {
    color: colors.textLight,
  },
  secondaryButtonText: {
    color: colors.textSecondary,
  },
  disabledButton: {
    opacity: 0.5,
  },
  disabledText: {
    opacity: 0.7,
  },
});
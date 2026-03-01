import React, { forwardRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TextInputProps,
  ViewStyle,
  StyleProp,
  TouchableOpacity,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors } from '@theme/colors';

interface FormInputProps extends TextInputProps {
  /** Label text displayed above the input */
  label: string;
  /** Whether the field is required (adds * to label) */
  required?: boolean;
  /** Custom style for the container */
  containerStyle?: StyleProp<ViewStyle>;
}

/**
 * Accessible form input with label.
 * Combines a label Text and TextInput for consistent form styling.
 * When secureTextEntry is true, shows a toggle to show/hide password.
 * Supports ref forwarding to enable focus management between inputs.
 */
const FormInput = forwardRef<TextInput, FormInputProps>(({
  label,
  required = false,
  containerStyle,
  style,
  placeholderTextColor = colors.textMuted,
  secureTextEntry,
  ...textInputProps
}, ref) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPasswordField = secureTextEntry === true;

  return (
    <View style={[styles.container, containerStyle]}>
      <Text style={styles.label}>
        {label}
        {required && <Text style={styles.requiredAsterisk}> *</Text>}
      </Text>
      <View style={styles.inputContainer}>
        <TextInput
          ref={ref}
          style={[styles.input, isPasswordField && styles.inputWithIcon, style]}
          placeholderTextColor={placeholderTextColor}
          secureTextEntry={isPasswordField && !showPassword}
          {...textInputProps}
        />
        {isPasswordField && (
          <TouchableOpacity
            style={styles.eyeButton}
            onPress={() => setShowPassword(!showPassword)}
            accessibilityLabel={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          >
            <MaterialIcons 
              name={showPassword ? 'visibility-off' : 'visibility'} 
              size={24} 
              color={colors.textSecondary} 
            />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
});

FormInput.displayName = 'FormInput';

export default FormInput;

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  requiredAsterisk: {
    color: colors.error,
  },
  inputContainer: {
    position: 'relative',
    justifyContent: 'center',
  },
  input: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    fontSize: 18,
    borderWidth: 1,
    borderColor: colors.border,
  },
  inputWithIcon: {
    paddingRight: 50,
  },
  eyeButton: {
    position: 'absolute',
    right: 12,
    padding: 4,
  },
});

import React, { useRef } from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TextInput,
} from 'react-native';
import { colors } from '@theme/colors';
import AccessibleButton from '@components/AccessibleButton';
import ScreenHeader from '@components/ScreenHeader';
import FormInput from '@components/FormInput';

interface SetupFormProps {
  username: string;
  password: string;
  confirmPassword: string;
  submitting: boolean;
  onUsernameChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onConfirmPasswordChange: (value: string) => void;
  onSubmit: () => void;
}

export function SetupForm({
  username,
  password,
  confirmPassword,
  submitting,
  onUsernameChange,
  onPasswordChange,
  onConfirmPasswordChange,
  onSubmit,
}: SetupFormProps) {
  const passwordRef = useRef<TextInput>(null);
  const confirmPasswordRef = useRef<TextInput>(null);

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <ScreenHeader
          title="Configurar Admin"
          subtitle="Primera vez: crea tus credenciales"
          backgroundColor={colors.secondary}
        />

        <View style={styles.formContainer}>
          <FormInput
            label="Usuario"
            value={username}
            onChangeText={onUsernameChange}
            placeholder="Ej: admin"
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="next"
            onSubmitEditing={() => passwordRef.current?.focus()}
            blurOnSubmit={false}
          />

          <FormInput
            ref={passwordRef}
            label="Contraseña"
            value={password}
            onChangeText={onPasswordChange}
            placeholder="Mínimo 4 caracteres"
            secureTextEntry
            returnKeyType="next"
            onSubmitEditing={() => confirmPasswordRef.current?.focus()}
            blurOnSubmit={false}
          />

          <FormInput
            ref={confirmPasswordRef}
            label="Confirmar Contraseña"
            value={confirmPassword}
            onChangeText={onConfirmPasswordChange}
            placeholder="Repite la contraseña"
            secureTextEntry
            returnKeyType="done"
            onSubmitEditing={onSubmit}
          />

          <AccessibleButton
            title="CREAR ADMINISTRADOR"
            onPress={onSubmit}
            variant="primary"
            disabled={submitting}
            loading={submitting}
            style={styles.submitButton}
            responsiveText
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
  },
  formContainer: {
    padding: 20,
  },
  submitButton: {
    marginTop: 16,
  },
});

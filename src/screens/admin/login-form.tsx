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

interface LoginFormProps {
  username: string;
  password: string;
  submitting: boolean;
  onUsernameChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onSubmit: () => void;
}

export function LoginForm({
  username,
  password,
  submitting,
  onUsernameChange,
  onPasswordChange,
  onSubmit,
}: LoginFormProps) {
  const passwordRef = useRef<TextInput>(null);

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <ScreenHeader
          title="Acceso Admin"
          subtitle="Ingresa tus credenciales"
          backgroundColor={colors.secondary}
        />

        <View style={styles.formContainer}>
          <FormInput
            label="Usuario"
            value={username}
            onChangeText={onUsernameChange}
            placeholder="Tu usuario"
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
            placeholder="Tu contraseña"
            secureTextEntry
            returnKeyType="done"
            onSubmitEditing={onSubmit}
          />

          <AccessibleButton
            title="ENTRAR"
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

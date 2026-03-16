import React, { useEffect, useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Alert, Keyboard } from 'react-native';
import { useRouter } from 'expo-router';
import { colors } from '@theme/colors';
import ScreenHeader from '@components/ScreenHeader';
import AccessibleButton from '@components/AccessibleButton';
import FormInput from '@components/FormInput';
import {
  getStoredBackupEndpoint,
  getEffectiveBackupEndpoint,
  setStoredBackupEndpoint,
  clearStoredBackupEndpoint,
} from '@services/EndpointConfig';

export function EndpointSettingsScreen() {
  const router = useRouter();
  const [endpoint, setEndpoint] = useState('');
  const [storedEndpoint, setStoredEndpoint] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const stored = await getStoredBackupEndpoint();
      setStoredEndpoint(stored);
      setEndpoint(stored ?? (await getEffectiveBackupEndpoint()));
    })();
  }, []);

  const saveEndpoint = async () => {
    setSaving(true);
    try {
      await setStoredBackupEndpoint(endpoint);
      setStoredEndpoint(endpoint);
      Alert.alert('Guardado', 'La dirección de envío se guardó correctamente.');
      Keyboard.dismiss();
    } catch (e) {
      console.error('failed to save endpoint', e);
      Alert.alert('Error', 'No se pudo guardar la dirección. Intenta nuevamente.');
    } finally {
      setSaving(false);
    }
  };

  const resetEndpoint = async () => {
    await clearStoredBackupEndpoint();
    setStoredEndpoint(null);
    const defaultEndpoint = await getEffectiveBackupEndpoint();
    setEndpoint(defaultEndpoint);
    Alert.alert('Restaurado', 'Se ha vuelto al valor predeterminado.');
  };

  const label = storedEndpoint ? 'Dirección guardada' : 'Dirección predeterminada';

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <ScreenHeader
          title="Dónde guardar la copia"
          subtitle="Elige a dónde enviar la copia de seguridad"
          backgroundColor={colors.secondary}
          showBackButton
          backRoute="/admin"
        />

        <View style={styles.formContainer}>
          <FormInput
            label={label}
            value={endpoint}
            onChangeText={setEndpoint}
            placeholder="https://script.google.com/macros/s/.../exec"
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="done"
            onSubmitEditing={Keyboard.dismiss}
            multiline
            numberOfLines={3}
          />

          <AccessibleButton
            title={saving ? 'Guardando…' : 'Guardar endpoint'}
            onPress={saveEndpoint}
            disabled={saving}
            variant="primary"
            responsiveText
            style={styles.button}
          />

          <AccessibleButton
            title="Usar valor predeterminado"
            onPress={resetEndpoint}
            variant="secondary"
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
  button: {
    marginBottom: 12,
  },
});

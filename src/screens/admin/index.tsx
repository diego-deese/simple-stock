import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@context/AuthContext';
import { colors } from '@theme/colors';
import { MenuItem } from './menu-item';
import AccessibleButton from '@components/AccessibleButton';
import LoadingScreen from '@components/LoadingScreen';
import ScreenHeader from '@components/ScreenHeader';

export function Admin() {
  const router = useRouter();
  const { isAuthenticated, isConfigured, loading, login, logout, setupAdmin, checkIsConfigured } = useAuth();
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    checkIsConfigured();
  }, [checkIsConfigured]);

  const handleSetup = async () => {
    if (!username.trim()) {
      Alert.alert('Error', 'Ingresa un nombre de usuario');
      return;
    }
    if (password.length < 4) {
      Alert.alert('Error', 'La contraseña debe tener al menos 4 caracteres');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Las contraseñas no coinciden');
      return;
    }

    setSubmitting(true);
    const success = await setupAdmin(username.trim(), password);
    setSubmitting(false);

    if (success) {
      Alert.alert('Éxito', 'Administrador configurado correctamente');
      setUsername('');
      setPassword('');
      setConfirmPassword('');
    } else {
      Alert.alert('Error', 'No se pudo configurar el administrador');
    }
  };

  const handleLogin = async () => {
    if (!username.trim() || !password) {
      Alert.alert('Error', 'Ingresa usuario y contraseña');
      return;
    }

    setSubmitting(true);
    const success = await login(username.trim(), password);
    setSubmitting(false);

    if (!success) {
      Alert.alert('Error', 'Usuario o contraseña incorrectos');
    } else {
      setUsername('');
      setPassword('');
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Cerrar Sesión',
      '¿Estás seguro de que quieres salir del panel de administración?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Salir', style: 'destructive', onPress: logout },
      ]
    );
  };

  if (loading) {
    return <LoadingScreen message="Cargando..." />;
  }

  // Si está autenticado, mostrar el panel de admin
  if (isAuthenticated) {
    return (
      <View style={styles.container}>
        <ScreenHeader
          title="Panel de Admin"
          backgroundColor={colors.secondary}
          rightComponent={
            <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
              <Text style={styles.logoutButtonText}>Salir</Text>
            </TouchableOpacity>
          }
        />

        <View style={styles.menuContainer}>
          <MenuItem
            icon="📦"
            title="Catálogo de Productos"
            description="Agregar, editar o eliminar productos"
            onPress={() => router.navigate('/catalog')}
          />
          <MenuItem
            icon="📊"
            title="Historial de Reportes"
            description="Ver y exportar reportes guardados"
            onPress={() => router.navigate('/history')}
          />
        </View>
      </View>
    );
  }

  // Si no está configurado, mostrar formulario de setup
  if (!isConfigured) {
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
            <Text style={styles.label}>Usuario</Text>
            <TextInput
              style={styles.input}
              value={username}
              onChangeText={setUsername}
              placeholder="Ej: admin"
              autoCapitalize="none"
              autoCorrect={false}
            />

            <Text style={styles.label}>Contraseña</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="Mínimo 4 caracteres"
              secureTextEntry
            />

            <Text style={styles.label}>Confirmar Contraseña</Text>
            <TextInput
              style={styles.input}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Repite la contraseña"
              secureTextEntry
            />

            <AccessibleButton
              title="CREAR ADMINISTRADOR"
              onPress={handleSetup}
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

  // Si está configurado pero no autenticado, mostrar login
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
          <Text style={styles.label}>Usuario</Text>
          <TextInput
            style={styles.input}
            value={username}
            onChangeText={setUsername}
            placeholder="Tu usuario"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <Text style={styles.label}>Contraseña</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder="Tu contraseña"
            secureTextEntry
          />

          <AccessibleButton
            title="ENTRAR"
            onPress={handleLogin}
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
  logoutButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  logoutButtonText: {
    color: colors.textLight,
    fontWeight: '600',
    fontSize: 14,
  },
  formContainer: {
    padding: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    fontSize: 18,
    borderWidth: 1,
    borderColor: colors.border,
  },
  submitButton: {
    marginTop: 32,
  },
  menuContainer: {
    padding: 20,
  },
});

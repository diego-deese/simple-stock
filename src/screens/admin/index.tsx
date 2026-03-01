import React, { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import { useAuth } from '@context/AuthContext';
import LoadingScreen from '@components/LoadingScreen';
import { AdminPanel } from './admin-panel';
import { SetupForm } from './setup-form';
import { LoginForm } from './login-form';

export function Admin() {
  const { isAuthenticated, isConfigured, loading, login, logout, setupAdmin, checkIsConfigured } = useAuth();
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    checkIsConfigured();
  }, [checkIsConfigured]);

  const clearForm = () => {
    setUsername('');
    setPassword('');
    setConfirmPassword('');
  };

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
      clearForm();
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
      clearForm();
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

  if (isAuthenticated) {
    return <AdminPanel onLogout={handleLogout} />;
  }

  if (!isConfigured) {
    return (
      <SetupForm
        username={username}
        password={password}
        confirmPassword={confirmPassword}
        submitting={submitting}
        onUsernameChange={setUsername}
        onPasswordChange={setPassword}
        onConfirmPasswordChange={setConfirmPassword}
        onSubmit={handleSetup}
      />
    );
  }

  return (
    <LoginForm
      username={username}
      password={password}
      submitting={submitting}
      onUsernameChange={setUsername}
      onPasswordChange={setPassword}
      onSubmit={handleLogin}
    />
  );
}

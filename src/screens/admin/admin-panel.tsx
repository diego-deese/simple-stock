import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { colors } from '@theme/colors';
import { MenuItem } from './menu-item';
import ScreenHeader from '@components/ScreenHeader';
import { backupNow, reportService } from '@services/index';

interface AdminPanelProps {
  onLogout: () => void;
}

export function AdminPanel({ onLogout }: AdminPanelProps) {
  const router = useRouter();

  const menuItems = [
    {
      key: 'catalog',
      icon: '📦',
      title: 'Catálogo de Productos',
      description: 'Agregar, editar o eliminar productos',
      onPress: () => router.navigate('/catalog'),
    },
    {
      key: 'categories',
      icon: '🏷️',
      title: 'Categorías',
      description: 'Organizar productos por tipo',
      onPress: () => router.navigate('/categories'),
    },
    {
      key: 'history',
      icon: '📊',
      title: 'Historial de Reportes',
      description: 'Ver y exportar reportes guardados',
      onPress: () => router.navigate('/history'),
    },
    {
      key: 'backup',
      icon: '💾',
      title: 'Exportar copia',
      description: 'Genera y sube una copia de seguridad a Drive',
      onPress: async () => {
        try {
          await backupNow();
        } catch (e) {
          console.error('manual backup failed', e);
        }
      },
    },
    {
      key: 'endpoint',
      icon: '⚙️',
      title: 'Destino de copia',
      description: 'Configurar a dónde se sube la copia de seguridad',
      onPress: () => router.navigate('/endpoint'),
    },
  ];

  if (__DEV__) {
    menuItems.push({
      key: 'reset-sync',
      icon: '🔄',
      title: 'Reiniciar sincronización',
      description: 'Marcar todos los reportes como no sincronizados',
      onPress: async () => {
        try {
          await reportService.clearAllSynced();
          Alert.alert('Sincronización', 'Todas las marcas de sincronización han sido reiniciadas');
        } catch (e) {
          console.error('reset sync failed', e);
          Alert.alert('Error', 'No se pudo reiniciar la sincronización');
        }
      },
    });
  }

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="Panel de Admin"
        backgroundColor={colors.secondary}
        rightComponent={
          <TouchableOpacity onPress={onLogout} style={styles.logoutButton}>
            <Text style={styles.logoutButtonText}>Salir</Text>
          </TouchableOpacity>
        }
      />

      <FlatList
        data={menuItems}
        keyExtractor={item => item.key}
        contentContainerStyle={styles.menuContainer}
        renderItem={({ item }) => (
          <MenuItem
            icon={item.icon}
            title={item.title}
            description={item.description}
            onPress={item.onPress}
          />
        )}
      />

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
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
  menuContainer: {
    padding: 20,
  },
  devSection: {
    marginTop: 20,
    paddingHorizontal: 20,
  },
});

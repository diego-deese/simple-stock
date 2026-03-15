import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
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

      <View style={styles.menuContainer}>
        <MenuItem
          icon="📦"
          title="Catálogo de Productos"
          description="Agregar, editar o eliminar productos"
          onPress={() => router.navigate('/catalog')}
        />
        <MenuItem
          icon="🏷️"
          title="Categorías"
          description="Organizar productos por tipo"
          onPress={() => router.navigate('/categories')}
        />
        <MenuItem
          icon="📊"
          title="Historial de Reportes"
          description="Ver y exportar reportes guardados"
          onPress={() => router.navigate('/history')}
        />
        <MenuItem
          icon="💾"
          title="Exportar copia"
          description="Genera y sube una copia de seguridad a Drive"
          onPress={async () => {
            try {
              await backupNow();
            } catch (e) {
              console.error('manual backup failed', e);
            }
          }}
        />
        {__DEV__ && (
          <MenuItem
            icon="🔄"
            title="Reiniciar sincronización"
            description="Marcar todos los reportes como no sincronizados"
            onPress={async () => {
              try {
                await reportService.clearAllSynced();
                Alert.alert('Sincronización', 'Todas las marcas de sincronización han sido reiniciadas');
              } catch (e) {
                console.error('reset sync failed', e);
                Alert.alert('Error', 'No se pudo reiniciar la sincronización');
              }
            }}
          />
        )}
      </View>
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
});

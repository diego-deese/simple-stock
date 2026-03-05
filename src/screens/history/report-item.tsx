import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Report, MovementType } from '@app-types/index';
import { colors } from '@theme/colors';

// Colores para los tipos de movimiento
const ENTREGAS_COLOR = '#4CAF50';
const PEDIDOS_COLOR = '#FF9800';

interface ReportItemProps {
  item: Report;
  exporting: boolean;
  onPress: (report: Report) => void;
  onExport: (report: Report) => void;
  formatDate: (date: string) => string;
}

const getTypeConfig = (type: MovementType) => {
  if (type === 'entregas') {
    return {
      label: 'Entregas del Proveedor',
      emoji: '📦',
      color: ENTREGAS_COLOR,
    };
  }
  return {
    label: 'Pedidos de Cocina',
    emoji: '📋',
    color: PEDIDOS_COLOR,
  };
};

export function ReportItem({ item, exporting, onPress, onExport, formatDate }: ReportItemProps) {
  const typeConfig = getTypeConfig(item.type || 'entregas');
  
  return (
    <TouchableOpacity
      style={[styles.reportItem, { borderLeftColor: typeConfig.color }]}
      onPress={() => onPress(item)}
    >
      <View style={styles.reportInfo}>
        <View style={styles.typeRow}>
          <Text style={styles.typeEmoji}>{typeConfig.emoji}</Text>
          <Text style={[styles.typeLabel, { color: typeConfig.color }]}>
            {typeConfig.label}
          </Text>
        </View>
        <Text style={styles.reportDate}>{formatDate(item.date)}</Text>
        <Text style={styles.reportSubtitle}>Toca para ver detalles</Text>
      </View>
      
      <View style={styles.reportActions}>
        <TouchableOpacity
          style={styles.exportIconButton}
          onPress={(e) => {
            e.stopPropagation();
            onExport(item);
          }}
          disabled={exporting}
        >
          {exporting ? (
            <ActivityIndicator size="small" color="#007AFF" />
          ) : (
            <Text style={styles.exportIcon}>📤</Text>
          )}
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  reportItem: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 20,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderLeftWidth: 4,
  },
  reportInfo: {
    flex: 1,
  },
  typeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  typeEmoji: {
    fontSize: 16,
    marginRight: 6,
  },
  typeLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  reportDate: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  reportSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  reportActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  exportIconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.backgroundDark,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  exportIcon: {
    fontSize: 20,
  },
});

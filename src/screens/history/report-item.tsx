import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Report } from '@app-types/index';
import { colors } from '@theme/colors';

interface ReportItemProps {
  item: Report;
  exporting: boolean;
  onPress: (report: Report) => void;
  onExport: (report: Report) => void;
  formatDate: (date: string) => string;
}

export function ReportItem({ item, exporting, onPress, onExport, formatDate }: ReportItemProps) {
  return (
    <TouchableOpacity
      style={styles.reportItem}
      onPress={() => onPress(item)}
    >
      <View style={styles.reportInfo}>
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
  },
  reportInfo: {
    flex: 1,
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

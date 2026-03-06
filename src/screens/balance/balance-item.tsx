import React, { memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import { BalanceMensual } from '@app-types/index';
import { colors } from '@theme/colors';

interface BalanceItemProps {
  item: BalanceMensual;
}

// Colores para los indicadores
const PEDIDOS_COLOR = colors.warning;  // Naranja para pedidos
const ENTREGAS_COLOR = colors.success; // Verde para entregas

export const BalanceItem = memo(function BalanceItem({ item }: BalanceItemProps) {
  const isCompleto = item.diferencia >= 0;
  const isFaltante = item.diferencia < 0;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.productName}>{item.product_name}</Text>
        <Text style={styles.unit}>({item.unit})</Text>
        {item.category_name && (
          <Text style={styles.category}>{item.category_name}</Text>
        )}
      </View>

      <View style={styles.details}>
        <View style={styles.detailRow}>
          <View style={[styles.indicator, { backgroundColor: PEDIDOS_COLOR }]} />
          <Text style={styles.detailLabel}>Pedidos:</Text>
          <Text style={[styles.detailValue, { color: PEDIDOS_COLOR }]}>
            {item.total_pedidos.toFixed(1)}
          </Text>
        </View>

        <View style={styles.detailRow}>
          <View style={[styles.indicator, { backgroundColor: ENTREGAS_COLOR }]} />
          <Text style={styles.detailLabel}>Entregas:</Text>
          <Text style={[styles.detailValue, { color: ENTREGAS_COLOR }]}>
            {item.total_entregas.toFixed(1)}
          </Text>
        </View>
      </View>

      <View style={styles.balanceContainer}>
        <Text style={styles.balanceLabel}>Diferencia:</Text>
        <Text style={[
          styles.balanceValue,
          isCompleto && styles.balanceCompleto,
          isFaltante && styles.balanceFaltante,
        ]}>
          {item.diferencia >= 0 ? '+' : ''}{item.diferencia.toFixed(1)}
        </Text>
        {isFaltante && <Text style={styles.statusBadgeFaltante}>Faltante</Text>}
        {isCompleto && item.diferencia > 0 && <Text style={styles.statusBadgeCompleto}>Completo</Text>}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    flexWrap: 'wrap',
    gap: 8,
  },
  productName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  unit: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  category: {
    fontSize: 12,
    color: colors.textMuted,
    backgroundColor: colors.backgroundDark,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  details: {
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    flex: 1,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  balanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  balanceLabel: {
    fontSize: 16,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  balanceValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  balanceCompleto: {
    color: ENTREGAS_COLOR,
  },
  balanceFaltante: {
    color: colors.error,
  },
  statusBadgeFaltante: {
    fontSize: 12,
    color: colors.white,
    backgroundColor: colors.error,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    fontWeight: '600',
    marginLeft: 8,
  },
  statusBadgeCompleto: {
    fontSize: 12,
    color: colors.white,
    backgroundColor: ENTREGAS_COLOR,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    fontWeight: '600',
    marginLeft: 8,
  },
});

import React, { memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '@theme/colors';

interface BalanceSummaryProps {
  totalPedidos: number;
  totalEntregas: number;
  totalDiferencia: number;
  productsFaltantes: number;
}

// Colores
const PEDIDOS_COLOR = '#FF9800';
const ENTREGAS_COLOR = '#4CAF50';

/**
 * Componente que muestra el resumen general del balance mensual.
 */
export const BalanceSummary = memo(function BalanceSummary({
  totalPedidos,
  totalEntregas,
  totalDiferencia,
  productsFaltantes,
}: BalanceSummaryProps) {
  const isCompleto = totalDiferencia >= 0;

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <View style={[styles.card, styles.pedidosCard]}>
          <Text style={styles.cardLabel}>Pedidos</Text>
          <Text style={[styles.cardValue, styles.pedidosValue]}>
            {totalPedidos.toFixed(1)}
          </Text>
        </View>

        <View style={[styles.card, styles.entregasCard]}>
          <Text style={styles.cardLabel}>Entregas</Text>
          <Text style={[styles.cardValue, styles.entregasValue]}>
            {totalEntregas.toFixed(1)}
          </Text>
        </View>
      </View>

      <View style={[styles.card, styles.balanceCard]}>
        <Text style={styles.balanceLabel}>Diferencia Total</Text>
        <Text
          style={[
            styles.balanceValue,
            !isCompleto && styles.negativeBalance,
          ]}
        >
          {totalDiferencia >= 0 ? '+' : ''}{totalDiferencia.toFixed(1)}
        </Text>
        {productsFaltantes > 0 && (
          <Text style={styles.warningText}>
            ⚠️ {productsFaltantes} producto{productsFaltantes !== 1 ? 's' : ''} con faltante
          </Text>
        )}
        {isCompleto && productsFaltantes === 0 && (
          <Text style={styles.successText}>
            ✓ Todos los productos completos
          </Text>
        )}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 12,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  card: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  pedidosCard: {
    borderLeftWidth: 4,
    borderLeftColor: PEDIDOS_COLOR,
  },
  entregasCard: {
    borderLeftWidth: 4,
    borderLeftColor: ENTREGAS_COLOR,
  },
  balanceCard: {
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  cardLabel: {
    fontSize: 14,
    color: colors.textMuted,
    fontWeight: '500',
    marginBottom: 4,
  },
  cardValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  pedidosValue: {
    color: PEDIDOS_COLOR,
  },
  entregasValue: {
    color: ENTREGAS_COLOR,
  },
  balanceLabel: {
    fontSize: 16,
    color: colors.textMuted,
    fontWeight: '600',
    marginBottom: 8,
  },
  balanceValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: ENTREGAS_COLOR,
  },
  negativeBalance: {
    color: colors.error,
  },
  warningText: {
    fontSize: 12,
    color: colors.error,
    marginTop: 8,
    textAlign: 'center',
  },
  successText: {
    fontSize: 12,
    color: ENTREGAS_COLOR,
    marginTop: 8,
    textAlign: 'center',
  },
});

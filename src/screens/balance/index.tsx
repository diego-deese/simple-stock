import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { useApp } from '@context/AppContext';
import { BalanceMensual, MonthWithData } from '@app-types/index';
import { colors } from '@theme/colors';
import LoadingScreen from '@components/LoadingScreen';
import ScreenHeader from '@components/ScreenHeader';
import EmptyState from '@components/EmptyState';
import { BalanceItem } from './balance-item';
import { MonthSelector } from './month-selector';

// Color para la pantalla de balance
const BALANCE_COLOR = colors.success; // Verde para balance

export function BalanceScreen() {
  const { dbReady, getBalanceMensual, getMonthsWithData, loadInventory } = useApp();
  const [balanceMensual, setBalanceMensual] = useState<BalanceMensual[]>([]);
  const [monthsWithData, setMonthsWithData] = useState<MonthWithData[]>([]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (dbReady) {
      loadMonthsAndData();
    }
  }, [dbReady]);

  useEffect(() => {
    if (dbReady && selectedYear && selectedMonth) {
      loadBalanceData();
    }
  }, [dbReady, selectedYear, selectedMonth]);

  const loadMonthsAndData = async () => {
    try {
      const months = await getMonthsWithData();
      setMonthsWithData(months);
    } catch (error) {
      console.error('[BalanceScreen] Error al cargar meses:', error);
    }
  };

  const loadBalanceData = async () => {
    try {
      setLoading(true);
      const balance = await getBalanceMensual(selectedYear, selectedMonth);
      setBalanceMensual(balance);
    } catch (error) {
      console.error('[BalanceScreen] Error al cargar balance:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = useCallback(async () => {
    try {
      setRefreshing(true);
      await loadInventory();
      await loadMonthsAndData();
      await loadBalanceData();
    } catch (error) {
      console.error('[BalanceScreen] Error al refrescar:', error);
    } finally {
      setRefreshing(false);
    }
  }, [loadInventory, selectedYear, selectedMonth]);

  const handleMonthChange = (year: number, month: number) => {
    setSelectedYear(year);
    setSelectedMonth(month);
  };

  // Filtrar productos con actividad
  const activeProducts = balanceMensual.filter(
    item => item.total_pedidos > 0 || item.total_entregas > 0
  );

  if (loading && !refreshing) {
    return <LoadingScreen message="Cargando balance..." />;
  }

  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="Balance Mensual"
        subtitle={`${monthNames[selectedMonth - 1]} ${selectedYear}`}
        backgroundColor={BALANCE_COLOR}
      />

      <MonthSelector
        selectedYear={selectedYear}
        selectedMonth={selectedMonth}
        monthsWithData={monthsWithData}
        onMonthChange={handleMonthChange}
      />

      {activeProducts.length > 0 ? (
        <FlatList
          data={activeProducts}
          keyExtractor={(item) => item.product_id.toString()}
          renderItem={({ item }) => <BalanceItem item={item} />}
          style={styles.list}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[BALANCE_COLOR]}
              tintColor={BALANCE_COLOR}
            />
          }
        />
      ) : (
        <EmptyState
          message={`No hay datos para ${monthNames[selectedMonth - 1]} ${selectedYear}`}
          hint="Registra pedidos o entregas para ver el balance"
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  list: {
    flex: 1,
    paddingHorizontal: 16,
  },
  listContent: {
    paddingBottom: 20,
  },
});

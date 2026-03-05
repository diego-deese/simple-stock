import React, { memo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList,
} from 'react-native';
import { MonthWithData } from '@app-types/index';
import { colors } from '@theme/colors';

interface MonthSelectorProps {
  selectedYear: number;
  selectedMonth: number;
  monthsWithData: MonthWithData[];
  onMonthChange: (year: number, month: number) => void;
}

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const SHORT_MONTH_NAMES = [
  'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
  'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
];

export const MonthSelector = memo(function MonthSelector({
  selectedYear,
  selectedMonth,
  monthsWithData,
  onMonthChange,
}: MonthSelectorProps) {
  const [showPicker, setShowPicker] = useState(false);

  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  // Crear lista de opciones: mes actual + meses con datos
  const getOptions = () => {
    const options: { year: number; month: number; isCurrent: boolean }[] = [];
    
    // Agregar mes actual si no está en los datos
    const hasCurrentMonth = monthsWithData.some(
      m => m.year === currentYear && m.month === currentMonth
    );
    
    if (!hasCurrentMonth) {
      options.push({ year: currentYear, month: currentMonth, isCurrent: true });
    }

    // Agregar meses con datos
    monthsWithData.forEach(m => {
      options.push({
        year: m.year,
        month: m.month,
        isCurrent: m.year === currentYear && m.month === currentMonth,
      });
    });

    // Ordenar descendentemente
    options.sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year;
      return b.month - a.month;
    });

    // Eliminar duplicados
    const seen = new Set<string>();
    return options.filter(o => {
      const key = `${o.year}-${o.month}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  };

  const options = getOptions();

  const handleSelect = (year: number, month: number) => {
    onMonthChange(year, month);
    setShowPicker(false);
  };

  const isSelected = (year: number, month: number) =>
    year === selectedYear && month === selectedMonth;

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.selectorButton}
        onPress={() => setShowPicker(true)}
      >
        <Text style={styles.selectorIcon}>📅</Text>
        <Text style={styles.selectorText}>
          {MONTH_NAMES[selectedMonth - 1]} {selectedYear}
        </Text>
        <Text style={styles.selectorArrow}>▼</Text>
      </TouchableOpacity>

      <Modal
        visible={showPicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPicker(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowPicker(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Seleccionar Mes</Text>
            
            <FlatList
              data={options}
              keyExtractor={(item) => `${item.year}-${item.month}`}
              style={styles.optionsList}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.optionItem,
                    isSelected(item.year, item.month) && styles.optionItemSelected,
                  ]}
                  onPress={() => handleSelect(item.year, item.month)}
                >
                  <Text
                    style={[
                      styles.optionText,
                      isSelected(item.year, item.month) && styles.optionTextSelected,
                    ]}
                  >
                    {MONTH_NAMES[item.month - 1]} {item.year}
                  </Text>
                  {item.isCurrent && (
                    <Text style={styles.currentBadge}>Actual</Text>
                  )}
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <Text style={styles.emptyText}>
                  No hay meses con datos registrados
                </Text>
              }
            />

            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowPicker(false)}
            >
              <Text style={styles.closeButtonText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  selectorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: colors.backgroundDark,
    borderRadius: 8,
    gap: 8,
  },
  selectorIcon: {
    fontSize: 18,
  },
  selectorText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  selectorArrow: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 340,
    maxHeight: '70%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: 16,
  },
  optionsList: {
    maxHeight: 300,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: colors.backgroundDark,
  },
  optionItemSelected: {
    backgroundColor: colors.primary,
  },
  optionText: {
    fontSize: 16,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  optionTextSelected: {
    color: colors.white,
  },
  currentBadge: {
    fontSize: 12,
    color: colors.primary,
    backgroundColor: colors.white,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    fontWeight: '600',
  },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingVertical: 20,
  },
  closeButton: {
    marginTop: 16,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: colors.backgroundDark,
    borderRadius: 8,
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
});

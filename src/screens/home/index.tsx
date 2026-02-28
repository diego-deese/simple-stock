import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useApp } from '@context/AppContext';
import { Product } from '@app-types/index';
import { colors } from '@theme/colors';
import { ProductItem } from './product-item';
import { ConfirmationModal } from './confirmation-modal';

export function Home() {
  const { products, tempCounts, updateTempCount, saveReport, loading } = useApp();
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [savingReport, setSavingReport] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  // Memoizar el mapa de cantidades para evitar recálculos innecesarios
  const quantityMap = useMemo(() => {
    const map = new Map<string, number>();
    tempCounts.forEach(count => map.set(count.product_name, count.quantity));
    return map;
  }, [tempCounts]);

  const handleSaveReport = async () => {
    try {
      setSavingReport(true);
      
      const countsToSave = tempCounts.filter(count => count.quantity > 0);
      
      if (countsToSave.length === 0) {
        Alert.alert(
          'Sin datos',
          'No hay cantidades registradas para guardar.',
          [{ text: 'OK' }]
        );
        return;
      }

      await saveReport(countsToSave);
      
      Alert.alert(
        'Reporte Guardado',
        `Se ha guardado el reporte con ${countsToSave.length} productos.`,
        [{ text: 'OK' }]
      );
      
      setShowConfirmModal(false);
    } catch (error) {
      Alert.alert(
        'Error',
        'No se pudo guardar el reporte. Intenta de nuevo.',
        [{ text: 'OK' }]
      );
    } finally {
      setSavingReport(false);
    }
  };

  // Usar useCallback para evitar recrear la función en cada render
  const renderProductItem = useCallback(({ item }: { item: Product }) => {
    const quantity = quantityMap.get(item.name) || 0;
    return (
      <ProductItem
        item={item}
        quantity={quantity}
        isEditMode={isEditMode}
        onDecrement={() => updateTempCount(item.name, Math.max(0, quantity - 1))}
        onIncrement={() => updateTempCount(item.name, quantity + 1)}
        onQuantityChange={(value) => updateTempCount(item.name, value)}
      />
    );
  }, [quantityMap, updateTempCount, isEditMode]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Cargando productos...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Registro Mensual</Text>
        <Text style={styles.headerSubtitle}>
          Registra las cantidades recibidas
        </Text>
      </View>

      <FlatList
        data={products}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderProductItem}
        style={styles.productList}
        showsVerticalScrollIndicator={false}
        extraData={quantityMap}
      />

      <View style={styles.footer}>
        <View style={styles.footerButtons}>
          <TouchableOpacity
            style={[
              styles.editButton,
              isEditMode && styles.editButtonActive
            ]}
            onPress={() => setIsEditMode(!isEditMode)}
          >
            <Text style={[
              styles.editButtonText,
              isEditMode && styles.editButtonTextActive
            ]}>
              {isEditMode ? 'CANCELAR' : 'EDITAR'}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.saveButton,
              !isEditMode && styles.saveButtonDisabled
            ]}
            onPress={() => setShowConfirmModal(true)}
            disabled={!isEditMode}
          >
            <Text style={[
              styles.saveButtonText,
              !isEditMode && styles.saveButtonTextDisabled
            ]}>GUARDAR REPORTE</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ConfirmationModal
        visible={showConfirmModal}
        tempCounts={tempCounts}
        saving={savingReport}
        onCancel={() => setShowConfirmModal(false)}
        onConfirm={handleSaveReport}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 18,
    color: colors.textSecondary,
  },
  header: {
    backgroundColor: colors.primary,
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.textLight,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  productList: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  footer: {
    padding: 20,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  footerButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  editButton: {
    flex: 1,
    backgroundColor: colors.backgroundDark,
    borderRadius: 12,
    paddingVertical: 18,
    paddingHorizontal: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.border,
  },
  editButtonActive: {
    backgroundColor: colors.warning,
    borderColor: colors.warning,
  },
  editButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textSecondary,
  },
  editButtonTextActive: {
    color: colors.textLight,
  },
  saveButton: {
    flex: 2,
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 18,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: colors.border,
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textLight,
  },
  saveButtonTextDisabled: {
    color: colors.textSecondary,
  },
});

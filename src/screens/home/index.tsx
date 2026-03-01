import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  Alert,
} from 'react-native';
import { useApp } from '@context/AppContext';
import { Product } from '@app-types/index';
import { colors } from '@theme/colors';
import { ProductItem } from './product-item';
import { ConfirmationModal } from './confirmation-modal';
import AccessibleButton from '@components/AccessibleButton';
import LoadingScreen from '@components/LoadingScreen';
import ScreenHeader from '@components/ScreenHeader';

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
    return <LoadingScreen message="Cargando productos..." />;
  }

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="Registro Mensual"
        subtitle="Registra las cantidades recibidas"
        backgroundColor={colors.primary}
      />

      <FlatList
        data={products}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderProductItem}
        style={styles.productList}
        contentContainerStyle={styles.productListContent}
        showsVerticalScrollIndicator={false}
        extraData={quantityMap}
      />

      <View style={styles.footer}>
        <View style={styles.footerButtons}>
          <AccessibleButton
            title={isEditMode ? 'CANCELAR' : 'EDITAR'}
            onPress={() => setIsEditMode(!isEditMode)}
            variant={isEditMode ? 'danger' : 'secondary'}
            style={styles.editButton}
            responsiveText
          />
          
          <AccessibleButton
            title="GUARDAR REPORTE"
            onPress={() => setShowConfirmModal(true)}
            disabled={!isEditMode}
            variant="primary"
            style={styles.saveButton}
            responsiveText
          />
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
  productList: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  productListContent: {
    paddingBottom: 20,
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
  },
  saveButton: {
    flex: 2,
  },
});

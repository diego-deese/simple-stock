import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  View,
  StyleSheet,
  SectionList,
  Alert,
} from 'react-native';
import { useApp } from '@context/AppContext';
import { Product, ProductSection } from '@app-types/index';
import { colors } from '@theme/colors';
import { ProductItem } from './product-item';
import { CategoryHeader } from './category-header';
import { ConfirmationModal } from './confirmation-modal';
import AccessibleButton from '@components/AccessibleButton';
import LoadingScreen from '@components/LoadingScreen';
import ScreenHeader from '@components/ScreenHeader';
import EmptyState from '@components/EmptyState';
import { productService } from '@services/index';

export function Home() {
  const { tempCounts, updateTempCount, saveReport, loading, dbReady, products } = useApp();
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [savingReport, setSavingReport] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [sections, setSections] = useState<ProductSection[]>([]);
  const [loadingSections, setLoadingSections] = useState(true);

  // Cargar productos agrupados por categoría cuando la DB esté lista o los productos cambien
  useEffect(() => {
    if (dbReady) {
      loadGroupedProducts();
    }
  }, [dbReady, products]);

  const loadGroupedProducts = async () => {
    try {
      setLoadingSections(true);
      const groupedProducts = await productService.getActiveProductsGrouped();
      setSections(groupedProducts);
    } catch (error) {
      console.error('[Home] Error al cargar productos agrupados:', error);
    } finally {
      setLoadingSections(false);
    }
  };

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

  // Renderizar cada producto
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

  // Renderizar header de categoría
  const renderSectionHeader = useCallback(({ section }: { section: ProductSection }) => (
    <CategoryHeader title={section.title} />
  ), []);

  if (loading || loadingSections) {
    return <LoadingScreen message="Cargando productos..." />;
  }

  const hasProducts = sections.some(section => section.data.length > 0);

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="Registro Mensual"
        subtitle="Registra las cantidades recibidas"
        backgroundColor={colors.primary}
      />

      {hasProducts ? (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderProductItem}
          renderSectionHeader={renderSectionHeader}
          style={styles.productList}
          contentContainerStyle={styles.productListContent}
          showsVerticalScrollIndicator={false}
          extraData={quantityMap}
          stickySectionHeadersEnabled={false}
        />
      ) : (
        <EmptyState
          message="No hay productos registrados. Agrega productos desde el catálogo."
        />
      )}

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
    paddingTop: 8,
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

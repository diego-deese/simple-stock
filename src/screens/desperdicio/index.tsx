import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  StyleSheet,
  SectionList,
  Text,
  Alert,
} from 'react-native';
import { useApp } from '@context/AppContext';
import { Product, ProductSection, TempDesperdicio } from '@app-types/index';
import { colors } from '@theme/colors';
import ScreenHeader from '@components/ScreenHeader';
import LoadingScreen from '@components/LoadingScreen';
import EmptyState from '@components/EmptyState';
import AccessibleButton from '@components/AccessibleButton';
import { productService } from '@services/index';
import { CategoryHeader } from '@screens/home/category-header';
import { ProductItem } from '@screens/home/product-item';
import { ConfirmationModal } from '@screens/home/confirmation-modal';

export function DesperdicioScreen() {
  const {
    tempDesperdicio,
    updateTempDesperdicio,
    saveDesperdicioReport,
    dbReady,
    products,
  } = useApp();

  const [sections, setSections] = useState<ProductSection[]>([]);
  const [loadingSections, setLoadingSections] = useState(true);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [savingReport, setSavingReport] = useState(false);

  // Load products grouped by category when the DB is ready
  useEffect(() => {
    if (dbReady) {
      loadGroupedProducts();
    }
  }, [dbReady, products]);

  const loadGroupedProducts = async () => {
    try {
      setLoadingSections(true);
      // Fetch grouped products for the current month from ProductService
      const groupedProducts = await productService.getCurrentMonthDeliveryProductsGrouped();
      setSections(groupedProducts);
    } catch (error) {
      console.error('[DesperdicioScreen] Error loading grouped products:', error);
    } finally {
      setLoadingSections(false);
    }
  };

  const quantityMap = useMemo(() => {
    const map = new Map<string, number>();
    tempDesperdicio.forEach((item: TempDesperdicio) => map.set(item.product_name, item.quantity));
    return map;
  }, [tempDesperdicio]);

  const handleSaveReport = async () => {
    try {
      setSavingReport(true);
      const entries = tempDesperdicio.filter(entry => entry.quantity > 0);

      if (entries.length === 0) {
        Alert.alert(
          'No Data',
          'No quantities recorded to save.',
          [{ text: 'OK' }]
        );
        return;
      }

      await saveDesperdicioReport(entries);
      Alert.alert(
        'Desperdicio Saved',
        `Recorded ${entries.length} products in desperdicio report.`,
        [{ text: 'OK' }]
      );
      setShowConfirmModal(false);
    } catch (error) {
      Alert.alert(
        'Error',
        'Failed to save desperdicio report. Try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setSavingReport(false);
    }
  };

  const renderProductItem = useCallback(({ item }: { item: Product }) => {
    const quantity = quantityMap.get(item.name) || 0;
    return (
      <ProductItem
        item={item}
        quantity={quantity}
        isEditMode={true}
        onDecrement={() => updateTempDesperdicio(item.name, Math.max(0, quantity - 1))}
        onIncrement={() => updateTempDesperdicio(item.name, quantity + 1)}
        onQuantityChange={(value) => updateTempDesperdicio(item.name, value)}
      />
    );
  }, [quantityMap, updateTempDesperdicio]);

  const renderSectionHeader = useCallback(({ section }: { section: ProductSection }) => (
    <CategoryHeader title={section.title} />
  ), []);

  if (loadingSections) {
    return <LoadingScreen message="Cargando productos..." />;
  }

  const hasProducts = sections.some(section => section.data.length > 0);

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="Desperdicio"
        subtitle="Registrar productos desperdiciados del mes"
        backgroundColor={colors.warning}
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
        />
      ) : (
        <EmptyState
          message="No se encontraron productos. Agrega productos desde el catálogo."
        />
      )}

      <View style={styles.footer}>
        <AccessibleButton
          title="GUARDAR"
          onPress={() => setShowConfirmModal(true)}
          variant="primary"
          style={styles.saveButton}
        />
      </View>

      <ConfirmationModal
        visible={showConfirmModal}
        tempCounts={tempDesperdicio}
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
  saveButton: {
    flex: 1,
  },
});

export default DesperdicioScreen;

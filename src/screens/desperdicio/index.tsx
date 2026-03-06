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
import { productService, reportService } from '@services/index';
import { CategoryHeader } from '@components/CategoryHeader';
import ProductItemDesperdicio from '@screens/desperdicio/ProductItemDesperdicio';
import { ConfirmationModal } from '@components/ConfirmationModal';
import FooterActions from '@components/FooterActions';

export function DesperdicioScreen() {
  const {
    tempDesperdicio,
    updateTempDesperdicio,
    saveDesperdicioReport,
    dbReady,
    products,
    tempCounts,
  } = useApp();

  const [sections, setSections] = useState<ProductSection[]>([]);
  const [loadingSections, setLoadingSections] = useState(true);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [savingReport, setSavingReport] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  // safe-area insets not used here anymore (FooterActions handles footer)

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

  // Mapa de cantidades recibidas (entregas) por producto
  const [receivedMap, setReceivedMap] = useState<Map<string, number>>(new Map());

  useEffect(() => {
    const loadReceived = async () => {
      try {
        // Preferir conteos temporales de entregas (sesión actual)
        if (tempCounts && tempCounts.length > 0) {
          const map = new Map<string, number>();
          tempCounts.forEach(t => map.set(t.product_name, t.quantity));
          setReceivedMap(map);
          return;
        }

        // Fallback: totales históricos de entregas
        const totals = await reportService.getTotalsByProduct('entregas');
        const map = new Map<string, number>();
        totals.forEach(t => map.set(t.product_name, t.total));
        setReceivedMap(map);
      } catch (error) {
        console.error('[DesperdicioScreen] Error loading received totals:', error);
      }
    };

    loadReceived();
  }, [tempCounts]);

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
    const received = receivedMap.get(item.name) || 0;
    return (
      <ProductItemDesperdicio
        item={item}
        quantity={quantity}
        receivedQuantity={received}
        isEditMode={isEditMode}
        onDecrement={() => updateTempDesperdicio(item.name, Math.max(0, quantity - 1))}
        onIncrement={() => {
          if (received > 0 && quantity + 1 > received) {
            Alert.alert('Límite', 'No puedes registrar más desperdicio que lo recibido');
            return;
          }
          updateTempDesperdicio(item.name, quantity + 1);
        }}
        onQuantityChange={(value) => {
          const clamped = received > 0 ? Math.min(value, received) : Math.max(0, value);
          if (value !== clamped) {
            Alert.alert('Límite', 'El valor se ha limitado a la cantidad recibida');
          }
          updateTempDesperdicio(item.name, clamped);
        }}
      />
    );
  }, [quantityMap, updateTempDesperdicio, receivedMap]);

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

      <FooterActions
        isEditMode={isEditMode}
        onToggleEdit={() => setIsEditMode(!isEditMode)}
        onSave={() => setShowConfirmModal(true)}
        saveDisabled={!isEditMode}
      />

      <ConfirmationModal
        visible={showConfirmModal}
        tempCounts={tempDesperdicio}
        saving={savingReport}
        onCancel={() => setShowConfirmModal(false)}
        onConfirm={handleSaveReport}
        title="Confirmar reporte de desperdicio"
        subtitle="Se registrarán los siguientes productos como desperdicio:"
        confirmButtonTitle="Guardar reporte"
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
});

export default DesperdicioScreen;

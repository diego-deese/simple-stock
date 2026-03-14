import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  StyleSheet,
  SectionList,
  Text,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useApp } from '@context/AppContext';
import { Product, ProductSection, TempDesperdicio } from '@app-types/index';
import { colors } from '@theme/colors';
import ScreenHeader from '@components/ScreenHeader';
import LoadingScreen from '@components/LoadingScreen';
import EmptyState from '@components/EmptyState';
import AccessibleButton from '@components/AccessibleButton';
import SearchBar from '@components/SearchBar';
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
    reports,
  } = useApp();

  const [sections, setSections] = useState<ProductSection[]>([]);
  const [loadingSections, setLoadingSections] = useState(true);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [savingReport, setSavingReport] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  // safe-area insets not used here anymore (FooterActions handles footer)
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  // Load products grouped by category when the DB is ready
  useEffect(() => {
    // Reload grouped products when DB is ready, products list changes or
    // when reports change (new entregas may add products to current month grouping).
    if (dbReady) {
      loadGroupedProducts();
    }
  }, [dbReady, products, reports]);

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

  const filteredSections = useMemo(() => {
    if (!searchTerm.trim()) return sections;
    const term = searchTerm.toLowerCase().trim();
    return sections
      .map(section => ({
        ...section,
        data: section.data.filter(product => product.name.toLowerCase().includes(term)),
      }))
      .filter(section => section.data.length > 0);
  }, [sections, searchTerm]);

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
          'Sin datos',
          'No hay cantidades registradas para guardar.',
          [{ text: 'OK' }]
        );
        return;
      }

      await saveDesperdicioReport(entries);
      Alert.alert(
        'Desperdicio guardado',
        `Se registraron ${entries.length} productos en el reporte de desperdicio.`,
        [{ text: 'OK' }]
      );
      setShowConfirmModal(false);
    } catch (error) {
      Alert.alert(
        'Error',
        'No se pudo guardar el reporte de desperdicio. Intenta de nuevo.',
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
  }, [quantityMap, updateTempDesperdicio, receivedMap, isEditMode]);

  const renderSectionHeader = useCallback(({ section }: { section: ProductSection }) => (
    <CategoryHeader title={section.title} />
  ), []);

  if (loadingSections) {
    return <LoadingScreen message="Cargando productos..." />;
  }

  const hasProducts = filteredSections.some(section => section.data.length > 0);

  return (
    <View style={styles.container}>
      {/* header with conditional search bar */}
      <ScreenHeader
        title="Desperdicio"
        subtitle="Productos desperdiciados del mes"
        backgroundColor={colors.warning}
        rightComponent={
          isSearching ? (
            <TouchableOpacity onPress={() => { setIsSearching(false); setSearchTerm(''); }} style={{ padding: 8 }}>
              <MaterialIcons name="close" size={28} color="white" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={() => setIsSearching(true)} style={{ padding: 8 }}>
              <MaterialIcons name="search" size={28} color="white" />
            </TouchableOpacity>
          )
        }
        customTitle={isSearching ? <SearchBar value={searchTerm} onChangeText={setSearchTerm} placeholder="Buscar producto..." /> : undefined}
      />

      <View style={styles.content}>
        {/* show term indicator below header */}
        {searchTerm.trim().length > 0 && (
          <View style={styles.searchInfo}>
            <Text style={styles.searchInfoText}>Buscando: {searchTerm}</Text>
          </View>
        )}

        {hasProducts && filteredSections.length > 0 ? (
          <SectionList
            sections={filteredSections}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderProductItem}
            renderSectionHeader={renderSectionHeader}
            style={styles.productList}
            contentContainerStyle={styles.productListContent}
            extraData={{ isEditMode, quantityMap, receivedMap }}
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <EmptyState
            message={searchTerm.trim()
              ? 'No se encontraron productos con ese nombre.'
              : 'No se encontraron productos. Agrega productos desde el catálogo.'}
          />
        )}
      </View>

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
        confirmButtonTitle="Guardar"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
  },
  productList: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  productListContent: {
    paddingBottom: 20,
  },
  searchInfo: {
    marginTop: 8,
  },
  searchInfoText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontStyle: 'italic',
    paddingHorizontal: 16,
  },
});

export default DesperdicioScreen;

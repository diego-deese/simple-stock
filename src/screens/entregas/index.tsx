import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  View,
  StyleSheet,
  SectionList,
  Alert,
  Text,
  TouchableOpacity,
} from 'react-native';
import { useApp } from '@context/AppContext';
import { Product, ProductSection, TempCount } from '@app-types/index';
import { fuzzyMatch } from '@helpers/fuzzy';
import { colors } from '@theme/colors';
import FooterActions from '@components/FooterActions';
import LoadingScreen from '@components/LoadingScreen';
import EmptyState from '@components/EmptyState';
import { productService } from '@services/index';
import { reportService } from '@services/index';
import { CategoryHeader } from '@components/CategoryHeader';
import EntregaItem from '@screens/entregas/entrega-item';
import { ConfirmationModal } from '@components/ConfirmationModal';
import PedidoSelector from '@components/PedidoSelector';
import ProductItemBase from '@/components/ProductItemBase';

const ENTREGAS_COLOR = colors.success;

interface EntregasScreenProps {
  searchTerm?: string;
}

export default function EntregasScreen({ searchTerm = '' }: EntregasScreenProps) {
  const {
    tempCounts,
    updateTempCount,
    saveEntregasReport,
    loading,
    dbReady,
    products,
  } = useApp();

  const [sections, setSections] = useState<ProductSection[]>([]);
  const [loadingSections, setLoadingSections] = useState(true);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [savingReport, setSavingReport] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedPedidoId, setSelectedPedidoId] = useState<number | null>(null);
  const [selectedPedidoDetails, setSelectedPedidoDetails] = useState<Map<string, number>>(new Map());

  useEffect(() => {
    if (dbReady) {
      loadGroupedProducts();
    }
  }, [dbReady, products]);

  useEffect(() => {
    setShowConfirmModal(false);
    setSavingReport(false);
  }, []);

  const loadGroupedProducts = async () => {
    try {
      setLoadingSections(true);
      const groupedProducts = await productService.getActiveProductsGrouped();
      setSections(groupedProducts);
    } catch (error) {
      console.error('[EntregasScreen] Error al cargar productos agrupados:', error);
    } finally {
      setLoadingSections(false);
    }
  };

  const handlePedidoSelected = async (id: number) => {
    try {
      const res = await reportService.getReportWithDetails(id);
      if (res) {
        const map = new Map<string, number>();
        res.details.forEach(d => map.set(d.product_name, d.quantity));
        setSelectedPedidoDetails(map);
        setSelectedPedidoId(id);
      }
    } catch (err) {
      console.error('Error loading pedido details', err);
    }
  };

  const quantityMap = useMemo(() => {
    const map = new Map<string, number>();
    tempCounts.forEach((item: TempCount) => map.set(item.product_name, item.quantity));
    return map;
  }, [tempCounts]);
  const handleToggleEditMode = () => setIsEditMode(prev => !prev);
  const setEditMode = (value: boolean) => setIsEditMode(value);

  const handleSaveReport = async () => {
    try {
      setSavingReport(true);
      const entries = tempCounts.filter(entry => entry.quantity > 0);

      if (entries.length === 0) {
        Alert.alert('Sin datos', 'No hay cantidades registradas para guardar.', [{ text: 'OK' }]);
        return;
      }

      await saveEntregasReport(entries, selectedPedidoId ?? null);
      Alert.alert('Entregas Guardadas', `Se registraron ${entries.length} productos en las entregas.`, [{ text: 'OK' }]);

      setShowConfirmModal(false);
      setEditMode(false);
    } catch (error) {
      Alert.alert('Error', 'No se pudo guardar la información. Intenta de nuevo.', [{ text: 'OK' }]);
    } finally {
      setSavingReport(false);
    }
  };

  const renderProductItem = useCallback(({ item }: { item: Product }) => {
    const quantity = quantityMap.get(item.name) || 0;
    return (
      <ProductItemBase
        item={item}
        quantity={quantity}
        isEditMode={isEditMode}
        onDecrement={() => {
          const current = quantityMap.get(item.name) || 0;
          const next = Math.max(0, Math.round((current - 1) * 10) / 10);
          void updateTempCount(item.name, next);
        }}
        onIncrement={() => {
          const current = quantityMap.get(item.name) || 0;
          const next = Math.round((current + 1) * 10) / 10;
          void updateTempCount(item.name, next);
        }}
        onQuantityChange={(value: number) => { void updateTempCount(item.name, value); }}
        pedidoQuantity={selectedPedidoDetails.get(item.name) || 0}
      />
    )
  }, [quantityMap, isEditMode, updateTempCount, selectedPedidoDetails]);

  const renderSectionHeader = useCallback(({ section }: { section: ProductSection }) => (
    <CategoryHeader title={section.title} />
  ), []);

  // derive visible sections based on selected pedido
  const filteredSections = useMemo(() => {
    if (!selectedPedidoId) return [];

    // start with sections limited to products from the selected pedido
    let base = sections
      .map(s => ({ ...s, data: s.data.filter(p => selectedPedidoDetails.has(p.name)) }))
      .filter(s => s.data.length > 0);

    // apply search fuzzy filter if term provided
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      base = base
        .map(s => ({
          ...s,
          data: s.data.filter(p => fuzzyMatch(p.name, term)),
        }))
        .filter(s => s.data.length > 0);
    }

    return base;
  }, [sections, selectedPedidoDetails, selectedPedidoId, searchTerm]);

  const hasProducts = filteredSections.some(section => section.data.length > 0);

  if (loading || loadingSections) {
    return <LoadingScreen message="Cargando productos..." />;
  }

  return (
    <View style={styles.container}>
      <View style={{ flex: 1 }}><View style={{ paddingHorizontal: 16, marginTop: 8 }}>
        <PedidoSelector
          onSelect={handlePedidoSelected}
          selectedPedidoId={selectedPedidoId}
          availableOnly={true}
        />
        {searchTerm.trim().length > 0 && (
          <View style={styles.searchInfo}>
            <Text style={styles.searchInfoText}>Buscando: {searchTerm}</Text>
          </View>
        )}
      </View>
        {selectedPedidoId == null ? (
          <EmptyState message="Selecciona un pedido para ver sus productos" />
        ) : hasProducts ? (
          <SectionList
            sections={filteredSections}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderProductItem}
            renderSectionHeader={renderSectionHeader}
            style={styles.productList}
            contentContainerStyle={styles.productListContent}
            showsVerticalScrollIndicator={false}
            extraData={{ isEditMode, quantityMap, selectedPedidoDetails }}
            stickySectionHeadersEnabled={false}
          />
        ) : (
          <EmptyState
            message={searchTerm.trim()
              ? 'No se encontraron productos con ese nombre.'
              : 'No hay productos registrados. Agrega productos desde el catálogo.'}
          />
        )}
      </View>

      {selectedPedidoId != null && (
        <FooterActions
          isEditMode={isEditMode}
          onToggleEdit={handleToggleEditMode}
          onSave={() => setShowConfirmModal(true)}
          saveDisabled={!isEditMode}
          saveColor={ENTREGAS_COLOR}
        />
      )}

      <ConfirmationModal
        visible={showConfirmModal}
        items={tempCounts}
        saving={savingReport}
        onCancel={() => setShowConfirmModal(false)}
        onConfirm={handleSaveReport}
        title="Confirmar reporte de entregas"
        subtitle="Se registrarán los siguientes productos como entregas:"
        confirmButtonTitle="Guardar"
        quantityColor={ENTREGAS_COLOR}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'space-between',
  },
  toggleContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginTop: 8,
    marginBottom: 8
  },
  toggleButton: {
    flex: 1,
    borderRadius: 16,
    paddingVertical: 14,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  searchInfo: {
    marginTop: 8,
  },
  searchInfoText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  toggleTextActive: {
    color: colors.white,
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

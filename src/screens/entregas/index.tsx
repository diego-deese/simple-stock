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
import { colors } from '@theme/colors';
import FooterActions from '@components/FooterActions';
import LoadingScreen from '@components/LoadingScreen';
import EmptyState from '@components/EmptyState';
import { productService } from '@services/index';
import { reportService } from '@services/index';
import { CategoryHeader } from '@components/CategoryHeader';
import EntregaItem from '@screens/entregas/entrega-item';
import { ConfirmationModal } from '@components/ConfirmationModal';
import PedidoSelectorModal from '@screens/entregas/PedidoSelectorModal';

const ENTREGAS_COLOR = colors.success;

export default function EntregasScreen() {
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
  const [pedidoModalVisible, setPedidoModalVisible] = useState(false);
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
      <EntregaItem
        item={item}
        quantity={quantity}
        isEditMode={isEditMode}
        onDecrement={() => updateTempCount(item.name, Math.max(0, quantity - 1))}
        onIncrement={() => updateTempCount(item.name, quantity + 1)}
        onQuantityChange={(value: number) => updateTempCount(item.name, value)}
        pedidoQuantity={selectedPedidoDetails.get(item.name) || 0}
      />
    );
  }, [quantityMap, isEditMode, updateTempCount, selectedPedidoDetails]);

  const renderSectionHeader = useCallback(({ section }: { section: ProductSection }) => (
    <CategoryHeader title={section.title} />
  ), []);

  if (loading || loadingSections) {
    return <LoadingScreen message="Cargando productos..." />;
  }

  const hasProducts = sections.some(section => section.data.length > 0);
  // month display handled by parent `registro` header
  return (
    <View style={styles.container}>
      <View style={{ paddingHorizontal: 16, marginTop: 8 }}>
        <TouchableOpacity onPress={() => setPedidoModalVisible(true)} style={{ padding: 12, backgroundColor: '#FFF3E0', borderRadius: 10, alignItems: 'center' }}>
          <Text style={{ fontWeight: '700' }}>{selectedPedidoId ? `Pedido seleccionado #${selectedPedidoId}` : 'Relacionar pedido'}</Text>
        </TouchableOpacity>
      </View>

      {hasProducts ? (
        <SectionList
          sections={sections}
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
          message="No hay productos registrados. Agrega productos desde el catálogo."
        />
      )}

      <FooterActions
        isEditMode={isEditMode}
        onToggleEdit={handleToggleEditMode}
        onSave={() => setShowConfirmModal(true)}
        saveDisabled={!isEditMode}
        saveColor={ENTREGAS_COLOR}
      />

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
      <PedidoSelectorModal visible={pedidoModalVisible} onClose={() => setPedidoModalVisible(false)} onSelect={handlePedidoSelected} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
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

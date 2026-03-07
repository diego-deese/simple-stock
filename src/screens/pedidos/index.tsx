import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  SectionList,
  Alert,
  Text,
} from 'react-native';
import { useApp } from '@context/AppContext';
import { Product, ProductSection, TempPedido } from '@app-types/index';
import { colors } from '@theme/colors';
import { PedidoItem } from './pedido-item';
import { CategoryHeader } from '@components/CategoryHeader';
import { PedidoConfirmationModal } from './pedido-confirmation-modal';
import LoadingScreen from '@components/LoadingScreen';
import ScreenHeader from '@components/ScreenHeader';
import EmptyState from '@components/EmptyState';
import { productService } from '@services/index';
import FooterActions from '@components/FooterActions';
import PedidoSelectorModal from '@screens/entregas/PedidoSelectorModal';
import { reportService } from '@services/index';
import AccessibleButton from '@/components/AccessibleButton';

// Color para la pantalla de pedidos
const PEDIDOS_COLOR = colors.warning;

export function PedidosScreen() {
  const { tempPedidos, updateTempPedido, savePedidosReport, loadCurrentMonthPedidos, loading, dbReady, products, setTempPedidos } = useApp();
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [savingReport, setSavingReport] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [sections, setSections] = useState<ProductSection[]>([]);
  const [loadingSections, setLoadingSections] = useState(true);
  const [copiedFromPrevious, setCopiedFromPrevious] = useState(false);
  const [pedidoModalVisible, setPedidoModalVisible] = useState(false);
  const [editingPedidoId, setEditingPedidoId] = useState<number | null>(null);

  const openPedidoSelector = () => setPedidoModalVisible(true);
  // Debug helper: trace when selector is opened
  const debugOpenPedidoSelector = () => {
    console.log('[Pedidos] openPedidoSelector called');
    openPedidoSelector();
  };

  const handlePedidoSelected = async (id: number) => {
    try {
      const res = await reportService.getReportWithDetails(id);
      if (res) {
        const temp = res.details.map(d => ({ product_name: d.product_name, quantity: d.quantity }));
        setTempPedidos(temp);
        setEditingPedidoId(id);
        setPedidoModalVisible(false);
        setIsEditMode(true);
      }
    } catch (err) {
      console.error('Error loading pedido details', err);
    }
  };
  const initialLoadDone = useRef(false);
  // safe-area insets not used here anymore (FooterActions handles footer)

  // Cargar productos agrupados por categoría cuando la DB esté lista o los productos cambien
  // Se reconstruyen las secciones según temporales de pedidos o catálogo
  useEffect(() => {
    if (!dbReady) return;

    const positivePedidos = tempPedidos.filter((p: TempPedido) => p.quantity > 0);

    if (positivePedidos.length > 0) {
      // Mostrar solo los productos incluidos en los pedidos del mes (lista de la compra)
      const byCategory = new Map<number | null, Product[]>();

      positivePedidos.forEach(p => {
        const prod = products.find(pr => pr.name === p.product_name);
        if (prod) {
          const key = prod.category_id ?? null;
          const arr = byCategory.get(key) || [];
          arr.push(prod);
          byCategory.set(key, arr);
        } else {
          // Producto no encontrado en catálogo (posible desactivado): crear un placeholder
          const placeholder: Product = {
            id: -1,
            name: p.product_name,
            unit: '',
            active: false,
            category_id: null,
          };
          const arr = byCategory.get(null) || [];
          arr.push(placeholder);
          byCategory.set(null, arr);
        }
      });

      const grouped = Array.from(byCategory.entries()).map(([catId, list]) => ({
        title: list[0].category_name || 'Sin categoría',
        categoryId: catId,
        data: list,
      }));

      setSections(grouped);
      setLoadingSections(false);
    } else {
      // Si no hay pedidos temporales, mostrar todo el catálogo activo
      loadGroupedProducts();
    }
  }, [dbReady, products, tempPedidos]);

  // Cargar pedidos existentes del mes actual al montar el componente
  useEffect(() => {
    if (dbReady && !initialLoadDone.current) {
      initialLoadDone.current = true;
      loadExistingPedidos();
    }
  }, [dbReady]);

  const loadExistingPedidos = async () => {
    try {
      const source = await loadCurrentMonthPedidos();
      if (source === 'previous') {
        setCopiedFromPrevious(true);
        setTimeout(() => setCopiedFromPrevious(false), 5000);
      }
    } catch (error) {
      console.error('[Pedidos] Error al cargar pedidos del mes:', error);
    }
  };

  const loadGroupedProducts = async () => {
    try {
      setLoadingSections(true);
      const groupedProducts = await productService.getActiveProductsGrouped();
      setSections(groupedProducts);
    } catch (error) {
      console.error('[Pedidos] Error al cargar productos agrupados:', error);
    } finally {
      setLoadingSections(false);
    }
  };

  // Memoizar el mapa de cantidades para evitar recálculos innecesarios
  const quantityMap = useMemo(() => {
    const map = new Map<string, number>();
    tempPedidos.forEach((pedido: TempPedido) => map.set(pedido.product_name, pedido.quantity));
    return map;
  }, [tempPedidos]);

  const handleSaveReport = async () => {
    try {
      setSavingReport(true);
      
      const pedidosToSave = tempPedidos.filter((pedido: TempPedido) => pedido.quantity > 0);
      
      if (pedidosToSave.length === 0) {
        Alert.alert(
          'Sin datos',
          'No hay cantidades registradas para guardar.',
          [{ text: 'OK' }]
        );
        return;
      }

      // Si estamos editando un pedido concreto, pasar su id para actualizar
      if (editingPedidoId) {
        await savePedidosReport(pedidosToSave, editingPedidoId);
      } else {
        await savePedidosReport(pedidosToSave);
      }
      
      Alert.alert(
        'Pedidos Guardados',
        `Se han guardado los pedidos con ${pedidosToSave.length} productos.`,
        [{ text: 'OK' }]
      );
      
      setShowConfirmModal(false);
      setIsEditMode(false);
      setEditingPedidoId(null);
    } catch (error) {
      Alert.alert(
        'Error',
        'No se pudieron guardar los pedidos. Intenta de nuevo.',
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
      <PedidoItem
        item={item}
        quantity={quantity}
        isEditMode={isEditMode}
        onDecrement={() => updateTempPedido(item.name, Math.max(0, quantity - 1))}
        onIncrement={() => updateTempPedido(item.name, quantity + 1)}
        onQuantityChange={(value: number) => updateTempPedido(item.name, value)}
      />
    );
  }, [quantityMap, updateTempPedido, isEditMode]);

  // Renderizar header de categoría
  const renderSectionHeader = useCallback(({ section }: { section: ProductSection }) => (
    <CategoryHeader title={section.title} />
  ), []);

  if (loading || loadingSections) {
    return <LoadingScreen message="Cargando productos..." />;
  }

  const hasProducts = sections.some(section => section.data.length > 0);

  // Obtener nombre del mes actual
  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];
  const currentMonth = monthNames[new Date().getMonth()];
  const currentYear = new Date().getFullYear();

  // Determinar subtítulo del header
  let subtitle = `${currentMonth} ${currentYear}`;
  if (copiedFromPrevious) {
    subtitle += ' - Copiado del mes anterior';
  }

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="Pedidos de Cocina"
        subtitle={subtitle}
        backgroundColor={PEDIDOS_COLOR}
      />

      <View style={{ paddingHorizontal: 16, marginTop: 8 }}>
        {editingPedidoId ? (
              <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center', justifyContent: 'space-between' }}>
                <Text style={{ fontWeight: '700' }}>Editando pedido #{editingPedidoId}</Text>
                <View style={{ flexDirection: 'row', gap: 8 }}>
              <AccessibleButton title="Salir edición" onPress={() => { setEditingPedidoId(null); setTempPedidos([]); setIsEditMode(false); }} variant="danger" />
              <AccessibleButton title="Seleccionar otro" onPress={debugOpenPedidoSelector} variant="secondary" style={{ backgroundColor: '#F47C1F' }} />
                </View>
              </View>
            ) : (
          // Make selector button visually prominent while debugging layout/visibility issues
          <AccessibleButton title="Seleccionar Pedido" onPress={debugOpenPedidoSelector} variant="secondary" style={{ backgroundColor: '#F47C1F' }} />
        )}
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
          extraData={quantityMap}
          stickySectionHeadersEnabled={false}
        />
      ) : (
        <EmptyState
          message="No hay productos registrados. Agrega productos desde el catálogo."
        />
      )}

      <FooterActions
        isEditMode={isEditMode}
        onToggleEdit={() => setIsEditMode(!isEditMode)}
        onSave={() => setShowConfirmModal(true)}
        saveDisabled={!isEditMode}
        saveColor={PEDIDOS_COLOR}
      />

      <PedidoConfirmationModal
        visible={showConfirmModal}
        tempPedidos={tempPedidos}
        saving={savingReport}
        onCancel={() => setShowConfirmModal(false)}
        onConfirm={handleSaveReport}
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
  productList: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  productListContent: {
    paddingBottom: 20,
  },
});

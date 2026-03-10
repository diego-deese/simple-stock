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
import { fuzzyMatch } from '@helpers/fuzzy';
import { colors } from '@theme/colors';
import { PedidoItem } from './pedido-item';
import { CategoryHeader } from '@components/CategoryHeader';
import { PedidoConfirmationModal } from './pedido-confirmation-modal';
import LoadingScreen from '@components/LoadingScreen';
// Header is rendered by the parent `registro` screen
import EmptyState from '@components/EmptyState';
import { productService } from '@services/index';
import FooterActions from '@components/FooterActions';
import PedidoSelector from '@components/PedidoSelector';
import { reportService } from '@services/index';
import AccessibleButton from '@/components/AccessibleButton';
import ProductItemBase from '@/components/ProductItemBase';

// Color para la pantalla de pedidos
const PEDIDOS_COLOR = colors.warning;

interface PedidosScreenProps {
  searchTerm?: string;
}

export function PedidosScreen({ searchTerm = '' }: PedidosScreenProps) {
  const { tempPedidos, updateTempPedido, savePedidosReport, loadCurrentMonthPedidos, dbReady, products, setTempPedidos } = useApp();
  // search term passed from parent
  // it may be empty string by default
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [savingReport, setSavingReport] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [sections, setSections] = useState<ProductSection[]>([]);
  const [loadingSections, setLoadingSections] = useState(true);
  const [copiedFromPrevious, setCopiedFromPrevious] = useState(false);
  const [editingPedidoId, setEditingPedidoId] = useState<number | null>(null);
  const [pedidoHasEntregas, setPedidoHasEntregas] = useState(false);


  const handlePedidoSelected = async (id: number) => {
    try {
      const res = await reportService.getReportWithDetails(id);
      const hasEnt = await reportService.hasEntregasForPedido(id);
      setPedidoHasEntregas(hasEnt);

      if (res) {
        const temp = res.details.map(d => ({ product_name: d.product_name, quantity: d.quantity }));
        setTempPedidos(temp);
        setEditingPedidoId(id);
      }
    } catch (err) {
      console.error('Error loading pedido details', err);
    }
  };

  const initialLoadDone = useRef(false);

  useEffect(() => {
    if (!dbReady) return;

    if (sections.length === 0) {
      loadGroupedProducts();
    }
  }, [dbReady, products]);

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
        Alert.alert(
          'Pedidos Actualizados',
          `Se actualizó el pedido #${editingPedidoId} con ${pedidosToSave.length} productos.`,
          [{ text: 'OK' }]
        );
      } else {
        const newId = await savePedidosReport(pedidosToSave);
        Alert.alert(
          'Pedidos Guardados',
          `Se creó el pedido #${newId} con ${pedidosToSave.length} productos.`,
          [{ text: 'OK' }]
        );
      }

      setShowConfirmModal(false);
      setIsEditMode(false);
      setEditingPedidoId(null);
      setTempPedidos([]);
      setPedidoHasEntregas(false); // reset warning after save
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
      <ProductItemBase
        item={item}
        quantity={quantity}
        isEditMode={isEditMode}
        onDecrement={() => {
          const current = quantityMap.get(item.name) || 0;
          void updateTempPedido(item.name, Math.max(0, current - 1));
        }}
        onIncrement={() => {
          const current = quantityMap.get(item.name) || 0;
          void updateTempPedido(item.name, current + 1);
        }}
        onQuantityChange={(value: number) => { void updateTempPedido(item.name, value); }}
        showStock={false}
      />
    )
  }, [quantityMap, updateTempPedido, isEditMode]);

  // Renderizar header de categoría
  const renderSectionHeader = useCallback(({ section }: { section: ProductSection }) => (
    <CategoryHeader title={section.title} />
  ), []);

  // apply search filter using fuzzy matching if a term is provided
  const filteredSections = useMemo(() => {
    if (!searchTerm.trim()) return sections;
    const term = searchTerm.toLowerCase().trim();
    return sections
      .map(section => ({
        ...section,
        data: section.data.filter(p => fuzzyMatch(p.name, term)),
      }))
      .filter(section => section.data.length > 0);
  }, [sections, searchTerm]);

  const hasProducts = filteredSections.some(section => section.data.length > 0);

  // Mostrar pantalla de carga hasta que la DB esté lista y las secciones cargadas
  if (!dbReady) {
    return <LoadingScreen message="Inicializando base de datos..." />;
  }

  if (loadingSections) {
    return <LoadingScreen message="Cargando productos..." />;
  }

  return (
    <View style={styles.container}>
      <View style={{ flex: 1 }}>
        <View style={{ paddingHorizontal: 16, marginVertical: 8 }}>
          {editingPedidoId ? (
            <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
              <View style={{ flex: 3 }}>
                <PedidoSelector onSelect={handlePedidoSelected} selectedPedidoId={editingPedidoId} editing={!!editingPedidoId} buttonVariant="success" allowSelectDisabled />
              </View>
              <AccessibleButton
                title="Cancelar"
                onPress={() => {
                  setEditingPedidoId(null);
                  setTempPedidos([]);
                  setIsEditMode(false);
                  setPedidoHasEntregas(false);
                }}
                variant="danger"
                style={{ flex: 1 }}
              />
            </View>
          ) : (
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <View style={{ flex: 1 }}>
                <PedidoSelector
                  onSelect={handlePedidoSelected}
                  selectedPedidoId={editingPedidoId}
                  editing={!!editingPedidoId}
                  buttonVariant="success"
                  allowSelectDisabled
                />
              </View>
            </View>
          )}

          {searchTerm.trim().length > 0 && (
            <View style={styles.searchInfo}>
              <Text style={styles.searchInfoText}>Buscando: {searchTerm}</Text>
            </View>
          )}
        </View>

        {hasProducts ? (
          <SectionList
            sections={filteredSections}
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
            message={searchTerm.trim()
              ? 'No se encontraron productos con ese nombre.'
              : 'No hay productos registrados. Agrega productos desde el catálogo.'}
          />
        )}

        {pedidoHasEntregas && (
          <View style={styles.containerWarningEntregas}>
            <Text style={styles.textWarningEntregas}>
              Este pedido no puede editarse, ya tiene entregas asociadas.
            </Text>
          </View>
        )}
      </View>

      <FooterActions
        isEditMode={isEditMode}
        disableEdit={pedidoHasEntregas}
        onToggleEdit={() => {
          if (!pedidoHasEntregas) {
            setIsEditMode(!isEditMode);
          }
        }}
        onSave={() => setShowConfirmModal(true)}
        saveDisabled={!isEditMode || pedidoHasEntregas}
        saveColor={PEDIDOS_COLOR}
      />

      <PedidoConfirmationModal
        visible={showConfirmModal}
        tempPedidos={tempPedidos}
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
    justifyContent: 'space-between',
  },
  productList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  productListContent: {
    paddingBottom: 20,
  },
  containerWarningEntregas: {
    margin: 4,
    borderColor: colors.error,
    borderBottomWidth: 2,
  },
  textWarningEntregas: {
    textAlign: 'center',
    color: colors.error,
    padding: 2
  },
  searchInfo: {
    marginTop: 12,
  },
  searchInfoText: {
    fontSize: 16,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
});

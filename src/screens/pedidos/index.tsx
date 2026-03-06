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
import AccessibleButton from '@components/AccessibleButton';
import LoadingScreen from '@components/LoadingScreen';
import ScreenHeader from '@components/ScreenHeader';
import EmptyState from '@components/EmptyState';
import { productService } from '@services/index';

// Color para la pantalla de pedidos
const PEDIDOS_COLOR = '#FF9800'; // Naranja para pedidos

export function PedidosScreen() {
  const { tempPedidos, updateTempPedido, savePedidosReport, loadCurrentMonthPedidos, loading, dbReady, products } = useApp();
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [savingReport, setSavingReport] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [sections, setSections] = useState<ProductSection[]>([]);
  const [loadingSections, setLoadingSections] = useState(true);
  const [copiedFromPrevious, setCopiedFromPrevious] = useState(false);
  const initialLoadDone = useRef(false);

  // Cargar productos agrupados por categoría cuando la DB esté lista o los productos cambien
  useEffect(() => {
    if (dbReady) {
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
      const countBefore = tempPedidos.filter((pedido: TempPedido) => pedido.quantity > 0).length;
      await loadCurrentMonthPedidos();
      
      // Detectar si se cargaron valores (asumimos que si hay más valores después, se copiaron del mes anterior)
      setTimeout(() => {
        const countAfter = tempPedidos.filter((pedido: TempPedido) => pedido.quantity > 0).length;
        if (countAfter > countBefore && countBefore === 0) {
          setCopiedFromPrevious(true);
          // Ocultar mensaje después de 5 segundos
          setTimeout(() => setCopiedFromPrevious(false), 5000);
        }
      }, 100);
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

      await savePedidosReport(pedidosToSave);
      
      Alert.alert(
        'Pedidos Guardados',
        `Se han guardado los pedidos con ${pedidosToSave.length} productos.`,
        [{ text: 'OK' }]
      );
      
      setShowConfirmModal(false);
      setIsEditMode(false);
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
            title="GUARDAR"
            onPress={() => setShowConfirmModal(true)}
            disabled={!isEditMode}
            variant="primary"
            style={styles.saveButton}
            responsiveText
          />
        </View>
      </View>

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
    backgroundColor: PEDIDOS_COLOR,
  },
});

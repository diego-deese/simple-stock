import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  View,
  StyleSheet,
  SectionList,
  Alert,
  Text,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '@context/AppContext';
import { Product, ProductSection, TempPedido, TempCount } from '@app-types/index';
import { colors } from '@theme/colors';
import ScreenHeader from '@components/ScreenHeader';
import LoadingScreen from '@components/LoadingScreen';
import EmptyState from '@components/EmptyState';
import AccessibleButton from '@components/AccessibleButton';
import { productService } from '@services/index';
import { CategoryHeader } from '@components/CategoryHeader';
import EntregaItem from '@screens/entregas/entrega-item';
import { PedidoItem } from '@screens/pedidos/pedido-item';
  import { ConfirmationModal } from '@components/ConfirmationModal';
import { PedidoConfirmationModal } from '@screens/pedidos/pedido-confirmation-modal';

type RegistroMode = 'pedidos' | 'entregas';

const PEDIDOS_COLOR = '#FF9800';
const ENTREGAS_COLOR = '#4CAF50';

const MODE_CONFIG: Record<RegistroMode, {
  label: string;
  emoji: string;
  color: string;
  headerTitle: string;
  subtitle?: string;
}> = {
  pedidos: {
    label: 'Pedidos',
    emoji: '📋',
    color: PEDIDOS_COLOR,
    headerTitle: 'Pedidos de Cocina',
  },
  entregas: {
    label: 'Entregas',
    emoji: '📦',
    color: ENTREGAS_COLOR,
    headerTitle: 'Entregas del Proveedor',
    subtitle: 'Registra cada entrega del proveedor',
  },
};

export default function EntregasScreen() {
  const {
    tempPedidos,
    updateTempPedido,
    savePedidosReport,
    tempCounts,
    updateTempCount,
    saveEntregasReport,
    loadCurrentMonthPedidos,
    loading,
    dbReady,
    products,
  } = useApp();

  const [mode, setMode] = useState<RegistroMode>('pedidos');
  const [sections, setSections] = useState<ProductSection[]>([]);
  const [loadingSections, setLoadingSections] = useState(true);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [savingReport, setSavingReport] = useState(false);
  const [copiedFromPrevious, setCopiedFromPrevious] = useState(false);
  const [editModes, setEditModes] = useState({ pedidos: false, entregas: false });
  const initialPedidosLoad = useRef(false);
  const insets = useSafeAreaInsets();
  const bottomInset = insets.bottom || 0;

  useEffect(() => {
    if (dbReady) {
      loadGroupedProducts();
    }
  }, [dbReady, products]);

  useEffect(() => {
    if (dbReady && !initialPedidosLoad.current) {
      initialPedidosLoad.current = true;
      loadPedidosData();
    }
  }, [dbReady]);

  useEffect(() => {
    setShowConfirmModal(false);
    setSavingReport(false);
  }, [mode]);

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

  const loadPedidosData = async () => {
    try {
      const source = await loadCurrentMonthPedidos();
      setCopiedFromPrevious(source === 'previous');
    } catch (error) {
      console.error('[EntregasScreen] Error al cargar pedidos del mes:', error);
      setCopiedFromPrevious(false);
    }
  };

  const quantityMap = useMemo(() => {
    const map = new Map<string, number>();
    const source = mode === 'pedidos' ? tempPedidos : tempCounts;
    source.forEach((item: TempPedido | TempCount) => map.set(item.product_name, item.quantity));
    return map;
  }, [mode, tempPedidos, tempCounts]);

  const isEditMode = editModes[mode];

  const handleToggleEditMode = () => {
    setEditModes(prev => ({
      ...prev,
      [mode]: !prev[mode],
    }));
  };

  const setEditMode = (value: boolean) => {
    setEditModes(prev => ({
      ...prev,
      [mode]: value,
    }));
  };

  const handleSaveReport = async () => {
    try {
      setSavingReport(true);
      const entries = (mode === 'pedidos' ? tempPedidos : tempCounts)
        .filter(entry => entry.quantity > 0);

      if (entries.length === 0) {
        Alert.alert('Sin datos', 'No hay cantidades registradas para guardar.', [{ text: 'OK' }]);
        return;
      }

      if (mode === 'pedidos') {
        await savePedidosReport(entries);
        setCopiedFromPrevious(false);
        Alert.alert('Pedido Guardado', `Se registraron ${entries.length} productos en el pedido del mes.`, [{ text: 'OK' }]);
      } else {
        await saveEntregasReport(entries);
        Alert.alert('Entregas Guardadas', `Se registraron ${entries.length} productos en las entregas.`, [{ text: 'OK' }]);
      }

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

    if (mode === 'pedidos') {
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
    }

    // entregas
    return (
      <EntregaItem
        item={item}
        quantity={quantity}
        isEditMode={isEditMode}
        onDecrement={() => updateTempCount(item.name, Math.max(0, quantity - 1))}
        onIncrement={() => updateTempCount(item.name, quantity + 1)}
        onQuantityChange={(value: number) => updateTempCount(item.name, value)}
      />
    );
  }, [mode, quantityMap, isEditMode, updateTempPedido, updateTempCount]);

  const renderSectionHeader = useCallback(({ section }: { section: ProductSection }) => (
    <CategoryHeader title={section.title} />
  ), []);

  if (loading || loadingSections) {
    return <LoadingScreen message="Cargando productos..." />;
  }

  const hasProducts = sections.some(section => section.data.length > 0);
  const headerConfig = MODE_CONFIG[mode];
  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];
  const currentMonthName = monthNames[new Date().getMonth()];
  const currentYear = new Date().getFullYear();
  const headerSubtitle = mode === 'pedidos'
    ? copiedFromPrevious
      ? `${currentMonthName} ${currentYear} - Copiado del mes anterior`
      : `${currentMonthName} ${currentYear}`
    : headerConfig.subtitle || '';

  return (
    <View style={styles.container}>
      <ScreenHeader
        title={headerConfig.headerTitle}
        subtitle={headerSubtitle}
        backgroundColor={headerConfig.color}
      />

      <ModeToggle mode={mode} onChange={setMode} />

      {hasProducts ? (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderProductItem}
          renderSectionHeader={renderSectionHeader}
          style={styles.productList}
          contentContainerStyle={[styles.productListContent, { paddingBottom: 20 + bottomInset }]}
          showsVerticalScrollIndicator={false}
          extraData={{ mode, isEditMode, quantityMap }}
          stickySectionHeadersEnabled={false}
        />
      ) : (
        <EmptyState
          message="No hay productos registrados. Agrega productos desde el catálogo."
        />
      )}

      <View style={[styles.footer, { paddingTop: 20 + Math.round(bottomInset / 2), paddingBottom: 20 + Math.round(bottomInset / 2) }]}> 
        <View style={[styles.footerButtons, { paddingTop: 0 }]}> 
          <AccessibleButton
            title={isEditMode ? 'CANCELAR' : 'EDITAR'}
            onPress={handleToggleEditMode}
            variant={isEditMode ? 'danger' : 'secondary'}
            style={styles.editButton}
            responsiveText
          />

          <AccessibleButton
            title="GUARDAR"
            onPress={() => setShowConfirmModal(true)}
            disabled={!isEditMode}
            variant="primary"
            style={[styles.saveButton, { backgroundColor: headerConfig.color }]}
            responsiveText
          />
        </View>
      </View>

      {mode === 'pedidos' ? (
        <PedidoConfirmationModal
          visible={showConfirmModal}
          tempPedidos={tempPedidos}
          saving={savingReport}
          onCancel={() => setShowConfirmModal(false)}
          onConfirm={handleSaveReport}
        />
      ) : (
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
      )}
    </View>
  );
}

interface ModeToggleProps {
  mode: RegistroMode;
  onChange: (mode: RegistroMode) => void;
}

function ModeToggle({ mode, onChange }: ModeToggleProps) {
  return (
    <View style={styles.toggleContainer}>
      {(Object.keys(MODE_CONFIG) as RegistroMode[]).map(option => {
        const config = MODE_CONFIG[option];
        const isActive = mode === option;
        return (
          <TouchableOpacity
            key={option}
            activeOpacity={0.9}
            style={[
              styles.toggleButton,
              isActive && { backgroundColor: config.color, borderColor: config.color },
            ]}
            onPress={() => onChange(option)}
          >
            <Text
              style={[
                styles.toggleText,
                isActive && styles.toggleTextActive,
              ]}
            >
              {`${config.emoji} ${config.label}`}
            </Text>
          </TouchableOpacity>
        );
      })}
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
    gap: 12,
    paddingHorizontal: 16,
    marginTop: 16,
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

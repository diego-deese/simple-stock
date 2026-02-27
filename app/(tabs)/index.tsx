import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  Alert,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { useApp } from '../../src/context/AppContext';
import { Product } from '../../src/types';
import { colors } from '../../src/theme/colors';

// ─── ProductItem extraído para poder usar hooks propios ───────────────────────
interface ProductItemProps {
  item: Product;
  quantity: number;
  onDecrement: () => void;
  onIncrement: () => void;
  onQuantityChange: (value: number) => void;
}

function ProductItem({ item, quantity, onDecrement, onIncrement, onQuantityChange }: ProductItemProps) {
  const [inputText, setInputText] = useState(String(quantity));

  // Sincronizar desde afuera (cuando +/- actualizan a través del contexto)
  useEffect(() => {
    setInputText(String(quantity));
  }, [quantity]);

  const handleChangeText = (text: string) => {
    // Permitir sólo dígitos
    const clean = text.replace(/[^0-9]/g, '');
    setInputText(clean);
  };

  const commitValue = () => {
    const parsed = parseInt(inputText, 10);
    const newValue = isNaN(parsed) ? 0 : Math.max(0, parsed);
    setInputText(String(newValue));
    onQuantityChange(newValue);
  };

  return (
    <View style={styles.productItem}>
      <View style={styles.productInfo}>
        <Text style={styles.productName}>{item.name}</Text>
        <Text style={styles.productUnit}>({item.unit})</Text>
      </View>

      <View style={styles.quantityContainer}>
        <TouchableOpacity
          style={[styles.quantityButton, styles.decreaseButton]}
          onPress={onDecrement}
        >
          <Text style={styles.buttonText}>−</Text>
        </TouchableOpacity>

        <TextInput
          style={styles.quantityDisplay}
          value={inputText}
          onChangeText={handleChangeText}
          onEndEditing={commitValue}
          onBlur={commitValue}
          keyboardType="numeric"
          returnKeyType="done"
          selectTextOnFocus
          maxLength={6}
          textAlign="center"
        />

        <TouchableOpacity
          style={[styles.quantityButton, styles.increaseButton]}
          onPress={onIncrement}
        >
          <Text style={styles.buttonText}>+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
// ─────────────────────────────────────────────────────────────────────────────

export default function MonthlyReportScreen() {
  const { products, tempCounts, updateTempCount, saveReport, loading } = useApp();
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [savingReport, setSavingReport] = useState(false);

  // Obtener la cantidad actual para un producto
  const getCurrentQuantity = (productName: string): number => {
    const tempCount = tempCounts.find(count => count.product_name === productName);
    return tempCount ? tempCount.quantity : 0;
  };

  // Actualizar cantidad de un producto
  const updateQuantity = (productName: string, change: number) => {
    const currentQuantity = getCurrentQuantity(productName);
    const newQuantity = Math.max(0, currentQuantity + change);
    updateTempCount(productName, newQuantity);
  };

  // Guardar el reporte
  const handleSaveReport = async () => {
    try {
      setSavingReport(true);
      
      // Filtrar solo los productos con cantidad > 0
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

  // Modal de confirmación
  const ConfirmationModal = () => {
    const countsToShow = tempCounts.filter(count => count.quantity > 0);
    
    return (
      <Modal
        visible={showConfirmModal}
        transparent={true}
        animationType="slide"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Confirmar Reporte</Text>
            
            <Text style={styles.modalSubtitle}>
              Se registrarán los siguientes productos:
            </Text>
            
            <FlatList
              data={countsToShow}
              keyExtractor={(item) => item.product_name}
              style={styles.modalList}
              renderItem={({ item }) => (
                <View style={styles.modalItem}>
                  <Text style={styles.modalItemName}>{item.product_name}</Text>
                  <Text style={styles.modalItemQuantity}>{item.quantity}</Text>
                </View>
              )}
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowConfirmModal(false)}
                disabled={savingReport}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={handleSaveReport}
                disabled={savingReport}
              >
                {savingReport ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text style={styles.confirmButtonText}>Guardar</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  // Item de producto en la lista — ahora renderizado con el componente externo
  const renderProductItem = ({ item }: { item: Product }) => {
    const quantity = getCurrentQuantity(item.name);
    return (
      <ProductItem
        item={item}
        quantity={quantity}
        onDecrement={() => updateQuantity(item.name, -1)}
        onIncrement={() => updateQuantity(item.name, 1)}
        onQuantityChange={(value) => updateTempCount(item.name, value)}
      />
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Cargando productos...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Registro Mensual</Text>
        <Text style={styles.headerSubtitle}>
          Registra las cantidades recibidas
        </Text>
      </View>

      <FlatList
        data={products}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderProductItem}
        style={styles.productList}
        showsVerticalScrollIndicator={false}
      />

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.saveButton}
          onPress={() => setShowConfirmModal(true)}
        >
          <Text style={styles.saveButtonText}>GUARDAR REPORTE</Text>
        </TouchableOpacity>
      </View>

      <ConfirmationModal />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 18,
    color: colors.textSecondary,
  },
  header: {
    backgroundColor: colors.primary,
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.textLight,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  productList: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  productItem: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 20,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  productUnit: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  decreaseButton: {
    backgroundColor: colors.error,
  },
  increaseButton: {
    backgroundColor: colors.success,
  },
  buttonText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.textLight,
  },
  quantityDisplay: {
    minWidth: 80,
    height: 60,
    backgroundColor: colors.backgroundDark,
    borderRadius: 8,
    marginHorizontal: 12,
    borderWidth: 2,
    borderColor: colors.border,
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.textPrimary,
    paddingHorizontal: 4,
    textAlignVertical: 'center',
  },
  footer: {
    padding: 20,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  saveButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 18,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textLight,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 24,
    width: '85%',
    maxHeight: '70%',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: 16,
  },
  modalSubtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
  },
  modalList: {
    maxHeight: 200,
  },
  modalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  modalItemName: {
    fontSize: 16,
    color: colors.textPrimary,
  },
  modalItemQuantity: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primary,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 6,
  },
  cancelButton: {
    backgroundColor: colors.backgroundDark,
    borderWidth: 1,
    borderColor: colors.border,
  },
  confirmButton: {
    backgroundColor: colors.primary,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textLight,
  },
});

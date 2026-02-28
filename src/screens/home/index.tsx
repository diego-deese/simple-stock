import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useApp } from '@context/AppContext';
import { Product } from '@app-types/index';
import { colors } from '@theme/colors';
import { ProductItem } from './product-item';
import { ConfirmationModal } from './confirmation-modal';

export function Home() {
  const { products, tempCounts, updateTempCount, saveReport, loading } = useApp();
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [savingReport, setSavingReport] = useState(false);

  const getCurrentQuantity = (productName: string): number => {
    const tempCount = tempCounts.find(count => count.product_name === productName);
    return tempCount ? tempCount.quantity : 0;
  };

  const updateQuantity = (productName: string, change: number) => {
    const currentQuantity = getCurrentQuantity(productName);
    const newQuantity = Math.max(0, currentQuantity + change);
    updateTempCount(productName, newQuantity);
  };

  const handleSaveReport = async () => {
    try {
      setSavingReport(true);
      
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

      <ConfirmationModal
        visible={showConfirmModal}
        tempCounts={tempCounts}
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
});

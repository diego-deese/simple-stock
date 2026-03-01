import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { useApp } from '@context/AppContext';
import { useAuth } from '@context/AuthContext';
import { Product } from '@app-types/index';
import { colors } from '@theme/colors';
import { CatalogItem } from './catalog-item';
import { ProductModal } from './product-modal';
import AccessibleButton from '@components/AccessibleButton';
import LoadingScreen from '@components/LoadingScreen';
import ScreenHeader from '@components/ScreenHeader';
import EmptyState from '@components/EmptyState';

export function Catalog() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { products, addProduct, updateProduct, deleteProduct, loading } = useApp();
  
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productName, setProductName] = useState('');
  const [productUnit, setProductUnit] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.navigate('/admin');
    }
  }, [isAuthenticated, authLoading]);

  const openAddModal = () => {
    setEditingProduct(null);
    setProductName('');
    setProductUnit('kg');
    setShowModal(true);
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setProductName(product.name);
    setProductUnit(product.unit);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingProduct(null);
    setProductName('');
    setProductUnit('');
  };

  const handleSave = async () => {
    if (!productName.trim()) {
      Alert.alert('Error', 'El nombre del producto es requerido');
      return;
    }

    if (!productUnit.trim()) {
      Alert.alert('Error', 'La unidad de medida es requerida');
      return;
    }

    try {
      setSaving(true);
      
      if (editingProduct) {
        await updateProduct(editingProduct.id, productName.trim(), productUnit.trim());
        Alert.alert('Éxito', 'Producto actualizado correctamente');
      } else {
        await addProduct(productName.trim(), productUnit.trim());
        Alert.alert('Éxito', 'Producto agregado correctamente');
      }
      
      closeModal();
    } catch (error) {
      Alert.alert('Error', 'No se pudo guardar el producto');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (product: Product) => {
    Alert.alert(
      'Confirmar eliminación',
      `¿Estás seguro de que quieres eliminar "${product.name}"? Esta acción no se puede deshacer.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteProduct(product.id);
              Alert.alert('Éxito', 'Producto eliminado correctamente');
            } catch (error) {
              Alert.alert('Error', 'No se pudo eliminar el producto');
            }
          }
        }
      ]
    );
  };

  if (loading || authLoading) {
    return <LoadingScreen message="Cargando catálogo..." />;
  }

  if (!isAuthenticated) {
    return <LoadingScreen />;
  }

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="Gestión de Catálogo"
        subtitle="Administra los productos del inventario"
        backgroundColor={colors.secondary}
        showBackButton
        backRoute="/admin"
      />

      <View style={styles.content}>
        <AccessibleButton
          title="+ AGREGAR PRODUCTO"
          onPress={openAddModal}
          variant="success"
          style={styles.addButton}
        />

        <FlatList
          data={products.filter(p => p.active)}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <CatalogItem
              item={item}
              onEdit={openEditModal}
              onDelete={handleDelete}
            />
          )}
          style={styles.productList}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <EmptyState
              message="No hay productos registrados"
              hint="Toca 'AGREGAR PRODUCTO' para comenzar"
              style={styles.emptyContainer}
            />
          }
        />
      </View>

      <ProductModal
        visible={showModal}
        editingProduct={editingProduct}
        productName={productName}
        productUnit={productUnit}
        saving={saving}
        onNameChange={setProductName}
        onUnitChange={setProductUnit}
        onCancel={closeModal}
        onSave={handleSave}
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
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  addButton: {
    marginBottom: 20,
  },
  productList: {
    flex: 1,
  },
  emptyContainer: {
    marginTop: 60,
  },
});

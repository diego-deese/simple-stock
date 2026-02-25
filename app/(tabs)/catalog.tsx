import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { useApp } from '../../src/context/AppContext';
import { useAuth } from '../../src/context/AuthContext';
import { Product } from '../../src/types';
import { colors } from '../../src/theme/colors';

export default function CatalogManagementScreen() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { products, addProduct, updateProduct, deleteProduct, loading } = useApp();
  
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productName, setProductName] = useState('');
  const [productUnit, setProductUnit] = useState('');
  const [saving, setSaving] = useState(false);

  // Proteger la ruta - redirigir si no está autenticado
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.navigate('/admin');
    }
  }, [isAuthenticated, authLoading]);

  // Unidades predefinidas comunes
  const commonUnits = ['kg', 'litros', 'bultos', 'cajas', 'latas', 'paquetes', 'unidades'];

  const openAddModal = () => {
    setEditingProduct(null);
    setProductName('');
    setProductUnit('kg'); // Unidad por defecto
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
      `¿Estás seguro de que quieres eliminar \"${product.name}\"? Esta acción no se puede deshacer.`,
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

  const ProductItem = ({ item }: { item: Product }) => (
    <View style={styles.productItem}>
      <View style={styles.productInfo}>
        <Text style={styles.productName}>{item.name}</Text>
        <Text style={styles.productUnit}>Unidad: {item.unit}</Text>
      </View>
      
      <View style={styles.productActions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.editButton]}
          onPress={() => openEditModal(item)}
        >
          <Text style={styles.editButtonText}>Editar</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => handleDelete(item)}
        >
          <Text style={styles.deleteButtonText}>Eliminar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading || authLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Cargando catálogo...</Text>
      </View>
    );
  }

  // No renderizar si no está autenticado (mientras redirige)
  if (!isAuthenticated) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.navigate('/admin')}
        >
          <Text style={styles.backButtonText}>← Volver</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Gestión de Catálogo</Text>
        <Text style={styles.headerSubtitle}>
          Administra los productos del inventario
        </Text>
      </View>

      <View style={styles.content}>
        <TouchableOpacity
          style={styles.addButton}
          onPress={openAddModal}
        >
          <Text style={styles.addButtonText}>+ AGREGAR PRODUCTO</Text>
        </TouchableOpacity>

        <FlatList
          data={products.filter(p => p.active)} // Solo mostrar productos activos
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => <ProductItem item={item} />}
          style={styles.productList}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No hay productos registrados</Text>
              <Text style={styles.emptySubtext}>
                Toca "AGREGAR PRODUCTO" para comenzar
              </Text>
            </View>
          }
        />
      </View>

      {/* Modal inline para evitar re-renders */}
      <Modal
        visible={showModal}
        transparent={true}
        animationType="slide"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editingProduct ? 'Editar Producto' : 'Nuevo Producto'}
            </Text>
            
            <View style={styles.formGroup}>
              <Text style={styles.label}>Nombre del producto *</Text>
              <TextInput
                style={styles.textInput}
                value={productName}
                onChangeText={setProductName}
                placeholder="Ej: Arroz, Frijoles, etc."
                placeholderTextColor="#999"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Unidad de medida *</Text>
              <TextInput
                style={styles.textInput}
                value={productUnit}
                onChangeText={setProductUnit}
                placeholder="Ej: kg, litros, bultos"
                placeholderTextColor="#999"
              />
              
              <Text style={styles.unitsLabel}>Unidades comunes:</Text>
              <View style={styles.unitsContainer}>
                {commonUnits.map((unit) => (
                  <TouchableOpacity
                    key={unit}
                    style={[
                      styles.unitButton,
                      productUnit === unit && styles.unitButtonSelected
                    ]}
                    onPress={() => setProductUnit(unit)}
                  >
                    <Text style={[
                      styles.unitButtonText,
                      productUnit === unit && styles.unitButtonTextSelected
                    ]}>
                      {unit}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={closeModal}
                disabled={saving}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleSave}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text style={styles.saveButtonText}>
                    {editingProduct ? 'Actualizar' : 'Agregar'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    backgroundColor: colors.secondary,
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  backButton: {
    marginBottom: 12,
  },
  backButtonText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 16,
    fontWeight: '500',
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
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  addButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    marginBottom: 20,
  },
  addButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textLight,
  },
  productList: {
    flex: 1,
  },
  productItem: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 20,
    marginBottom: 12,
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
    marginBottom: 16,
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
  productActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  actionButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginLeft: 12,
  },
  editButton: {
    backgroundColor: colors.primaryLight,
  },
  deleteButton: {
    backgroundColor: colors.error,
  },
  editButtonText: {
    color: colors.textLight,
    fontWeight: '600',
    fontSize: 16,
  },
  deleteButtonText: {
    color: colors.textLight,
    fontWeight: '600',
    fontSize: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 60,
  },
  emptyText: {
    fontSize: 18,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.textMuted,
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
    width: '90%',
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: 24,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    backgroundColor: colors.backgroundDark,
  },
  unitsLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 12,
    marginBottom: 8,
  },
  unitsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  unitButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: colors.backgroundDark,
    borderWidth: 1,
    borderColor: colors.border,
  },
  unitButtonSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  unitButtonText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  unitButtonTextSelected: {
    color: colors.textLight,
    fontWeight: '600',
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
  saveButton: {
    backgroundColor: colors.primary,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textLight,
  },
});

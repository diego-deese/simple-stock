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
import { Category } from '@app-types/index';
import { colors } from '@theme/colors';
import { CategoryItem } from './category-item';
import { CategoryModal } from './category-modal';
import AccessibleButton from '@components/AccessibleButton';
import LoadingScreen from '@components/LoadingScreen';
import ScreenHeader from '@components/ScreenHeader';
import EmptyState from '@components/EmptyState';

export function Categories() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { categories, addCategory, updateCategory, deleteCategory, loading } = useApp();
  
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryName, setCategoryName] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.navigate('/admin');
    }
  }, [isAuthenticated, authLoading]);

  const openAddModal = () => {
    setEditingCategory(null);
    setCategoryName('');
    setShowModal(true);
  };

  const openEditModal = (category: Category) => {
    setEditingCategory(category);
    setCategoryName(category.name);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingCategory(null);
    setCategoryName('');
  };

  const handleSave = async () => {
    if (!categoryName.trim()) {
      Alert.alert('Error', 'El nombre de la categoría es requerido');
      return;
    }

    try {
      setSaving(true);
      
      if (editingCategory) {
        await updateCategory(editingCategory.id, categoryName.trim());
        Alert.alert('Éxito', 'Categoría actualizada correctamente');
      } else {
        await addCategory(categoryName.trim());
        Alert.alert('Éxito', 'Categoría agregada correctamente');
      }
      
      closeModal();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo guardar la categoría';
      Alert.alert('Error', message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (category: Category) => {
    Alert.alert(
      'Confirmar eliminación',
      `¿Estás seguro de que quieres eliminar "${category.name}"?\n\nLos productos de esta categoría pasarán a "Otros".`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteCategory(category.id);
              Alert.alert('Éxito', 'Categoría eliminada correctamente');
            } catch (error) {
              Alert.alert('Error', 'No se pudo eliminar la categoría');
            }
          }
        }
      ]
    );
  };

  if (loading || authLoading) {
    return <LoadingScreen message="Cargando categorías..." />;
  }

  if (!isAuthenticated) {
    return <LoadingScreen />;
  }

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="Gestión de Categorías"
        subtitle="Organiza los productos por tipo"
        backgroundColor={colors.secondary}
        showBackButton
        backRoute="/admin"
      />

      <View style={styles.content}>
        <AccessibleButton
          title="+ AGREGAR CATEGORÍA"
          onPress={openAddModal}
          variant="success"
          style={styles.addButton}
        />

        <FlatList
          data={categories}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <CategoryItem
              item={item}
              onEdit={openEditModal}
              onDelete={handleDelete}
            />
          )}
          style={styles.categoryList}
          contentContainerStyle={styles.categoryListContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <EmptyState
              message="No hay categorías registradas"
              hint="Toca 'AGREGAR CATEGORÍA' para comenzar"
              style={styles.emptyContainer}
            />
          }
        />
      </View>

      <CategoryModal
        visible={showModal}
        editingCategory={editingCategory}
        categoryName={categoryName}
        saving={saving}
        onNameChange={setCategoryName}
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
  categoryList: {
    flex: 1,
  },
  categoryListContent: {
    paddingHorizontal: 4,
    paddingBottom: 20,
  },
  emptyContainer: {
    marginTop: 60,
  },
});

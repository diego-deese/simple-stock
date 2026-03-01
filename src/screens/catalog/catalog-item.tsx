import React from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import { Product } from '@app-types/index';
import { colors } from '@theme/colors';
import AccessibleButton from '@components/AccessibleButton';

interface CatalogItemProps {
  item: Product;
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
}

export function CatalogItem({ item, onEdit, onDelete }: CatalogItemProps) {
  return (
    <View style={styles.productItem}>
      <View style={styles.productInfo}>
        <Text style={styles.productName}>{item.name}</Text>
        <Text style={styles.productUnit}>Unidad: {item.unit}</Text>
      </View>
      
      <View style={styles.productActions}>
        <AccessibleButton
          title="Editar"
          onPress={() => onEdit(item)}
          variant="primary"
          style={styles.actionButton}
          responsiveText
        />
        
        <AccessibleButton
          title="Eliminar"
          onPress={() => onDelete(item)}
          variant="danger"
          style={styles.actionButton}
          responsiveText
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
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
    gap: 12,
  },
  actionButton: {
    minWidth: 100,
  },
});

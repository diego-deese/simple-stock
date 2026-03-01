import React, { memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '@theme/colors';

interface CategoryHeaderProps {
  title: string;
}

/**
 * Header de sección que muestra el nombre de la categoría.
 * Diseñado para ser accesible y visualmente distintivo.
 */
export const CategoryHeader = memo(function CategoryHeader({ title }: CategoryHeaderProps) {
  return (
    <View style={styles.container}>
      <View style={styles.line} />
      <Text style={styles.title}>{title}</Text>
      <View style={styles.line} />
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
    marginTop: 8,
    marginBottom: 4,
  },
  line: {
    flex: 1,
    height: 2,
    backgroundColor: colors.primaryLight,
    borderRadius: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary,
    paddingHorizontal: 16,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
});

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ViewStyle,
  StyleProp,
} from 'react-native';
import { colors } from '@theme/colors';

interface EmptyStateProps {
  /** Main message to display */
  message: string;
  /** Optional icon or emoji to display above the message */
  icon?: string;
  /** Optional secondary hint text */
  hint?: string;
  /** Custom style for the container */
  style?: StyleProp<ViewStyle>;
}

/**
 * Component to display when a list or section is empty.
 * Provides consistent styling for empty states across the app.
 */
export default function EmptyState({
  message,
  icon,
  hint,
  style,
}: EmptyStateProps) {
  return (
    <View style={[styles.container, style]}>
      {icon && <Text style={styles.icon}>{icon}</Text>}
      <Text style={styles.message}>{message}</Text>
      {hint && <Text style={styles.hint}>{hint}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  icon: {
    fontSize: 48,
    marginBottom: 16,
  },
  message: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 8,
  },
  hint: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
  },
});

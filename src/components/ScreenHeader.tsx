import React, { ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { colors } from '@theme/colors';

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  backgroundColor?: string;
  showBackButton?: boolean;
  backRoute?: string;
  rightComponent?: ReactNode;
  customTitle?: ReactNode;
}

export default function ScreenHeader({
  title,
  subtitle,
  backgroundColor = colors.primary,
  showBackButton = false,
  backRoute = '/admin',
  rightComponent,
  customTitle,
}: ScreenHeaderProps) {
  const router = useRouter();

  return (
    <View style={[styles.header, { backgroundColor }]}>
      {showBackButton && (
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.navigate(backRoute as any)}
        >
          <Text style={styles.backButtonText}>← Volver</Text>
        </TouchableOpacity>
      )}

      <View style={[
        styles.titleRow,
        customTitle ? styles.titleRowCentered : null,
      ]}>
        <View style={styles.titleContainer}>
          {customTitle ? (
            customTitle
          ) : (
            <>
              <Text style={styles.headerTitle}>{title}</Text>
              {subtitle && <Text style={styles.headerSubtitle}>{subtitle}</Text>}
            </>
          )}
        </View>

        {rightComponent && (
          <View style={styles.rightComponentContainer}>
            {rightComponent}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    minHeight: 150,
  },
  backButton: {
    marginBottom: 12,
  },
  backButtonText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 16,
    fontWeight: '500',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 70
  },
  titleRowCentered: {
    alignItems: 'center',
  },
  titleContainer: {
    flex: 1,
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
  rightComponentContainer: {
    marginStart: 16
  }
});

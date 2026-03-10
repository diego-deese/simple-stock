import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Modal } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import EntregasScreen from '@screens/entregas';
import { PedidosScreen } from '@screens/pedidos';
import SearchBar from '@components/SearchBar';
import { colors } from '@theme/colors';
import ScreenHeader from '@components/ScreenHeader';
import { useApp } from '@context/AppContext';

type RegistroMode = 'pedidos' | 'entregas';

const PEDIDOS_COLOR = colors.warning;
const ENTREGAS_COLOR = colors.success;

const MODE_CONFIG: Record<RegistroMode, { label: string; emoji: string; color: string }> = {
  pedidos: { label: 'Pedidos', emoji: '📋', color: PEDIDOS_COLOR },
  entregas: { label: 'Entregas', emoji: '📦', color: ENTREGAS_COLOR },
};

export default function RegistroScreen() {
  const { loadCurrentMonthPedidos, dbReady } = useApp();
  const [mode, setMode] = useState<RegistroMode>('pedidos');
  const [copiedFromPrevious, setCopiedFromPrevious] = useState(false);

  // search state
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  // only reload pedidos once when the database becomes ready
  // previously we depended on `loadCurrentMonthPedidos` which is recreated
  // on every context update; that caused the effect to fire on each state
  // change and reload the temp list from the database, wiping out any
  // in‑progress edits.  Removing it from the deps (and using a ref to guard
  // against updates) stops the unwanted resets.
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      if (!dbReady) return;
      try {
        const source = await loadCurrentMonthPedidos();
        if (mounted) setCopiedFromPrevious(source === 'previous');
      } catch (err) {
        if (mounted) setCopiedFromPrevious(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, [dbReady]);

  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];
  const currentMonthName = monthNames[new Date().getMonth()];
  const currentYear = new Date().getFullYear();

  const headerConfig = MODE_CONFIG[mode];
  const headerSubtitle = mode === 'pedidos'
    ? (copiedFromPrevious ? `${currentMonthName} ${currentYear} - Copiado del mes anterior` : `${currentMonthName} ${currentYear}`)
    : (headerConfig.label === 'Entregas' ? 'Registra cada entrega del proveedor' : '');

  const startSearch = () => setIsSearching(true);
  const cancelSearch = () => {
    setIsSearching(false);
    setSearchTerm('');
  };

  const renderHeaderRight = () => {
    if (isSearching) {
      return (
        <TouchableOpacity onPress={cancelSearch} style={{ padding: 8 }}>
          <MaterialIcons name="close" size={28} color="white" />
        </TouchableOpacity>
      );
    }
    return (
      <TouchableOpacity onPress={startSearch} style={{ padding: 8 }}>
        <MaterialIcons name="search" size={28} color="white" />
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <ScreenHeader
        title={headerConfig.label === 'Pedidos' ? 'Pedidos de Cocina' : headerConfig.label}
        subtitle={headerSubtitle}
        backgroundColor={headerConfig.color}
        rightComponent={renderHeaderRight()}
        customTitle={isSearching ? <SearchBar value={searchTerm} onChangeText={setSearchTerm} placeholder="Buscar producto..." /> : undefined}
      />

      <ModeToggle mode={mode} onChange={setMode} />


      {mode === 'pedidos' ? (
        <PedidosScreen searchTerm={searchTerm} />
      ) : (
        <EntregasScreen searchTerm={searchTerm} />
      )}
    </View>
  );
}

function ModeToggle({ mode, onChange }: { mode: RegistroMode; onChange: (m: RegistroMode) => void }) {
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
            <Text style={[styles.toggleText, isActive && styles.toggleTextActive]}>{`${config.emoji} ${config.label}`}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  toggleContainer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    marginTop: 8,
    marginBottom: 8,
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
  toggleTextActive: { color: colors.white },
});

import React, { useEffect, useState } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, Text } from 'react-native';
import ModalWrapper from './ModalWrapper';
import { reportService } from '@services/index';
import { Report } from '@app-types/index';
import { colors } from '@theme/colors';
import { formatLocalFromSqlite } from '@helpers/date';
import AccessibleButton from './AccessibleButton';

interface PedidoSelectorModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (id: number) => void;
  /**
   * When true, do not include pedidos that already have entregas; the
   * resulting list will be exactly the "available" pedidos.  Default: false.
   */
  availableOnly?: boolean;
  /**
   * When a pedido has entregas (and thus would normally be disabled), if
   * this flag is true the user may still tap it to select it.  Useful for
   * the pedidos screen where you want to view past orders but not edit them.
   */
  allowSelectDisabled?: boolean;
}

export default function PedidoSelectorModal({ visible, onClose, onSelect, availableOnly = false, allowSelectDisabled = false }: PedidoSelectorModalProps) {
  const [pedidos, setPedidos] = useState<Report[]>([]);
  const [disabledIds, setDisabledIds] = useState<Set<number>>(new Set());
  const [infoVisible, setInfoVisible] = useState(false);

  useEffect(() => {
    if (!visible) return;
    (async () => {
      if (availableOnly) {
        const list = await reportService.getAvailablePedidos();
        setPedidos(list);
        setDisabledIds(new Set());
      } else {
        const [list, idsWith] = await Promise.all([
          reportService.getPedidosReports(),
          reportService.getPedidoIdsWithEntregas(),
        ]);
        setPedidos(list);
        setDisabledIds(new Set(idsWith));
      }
    })();
  }, [visible, availableOnly]);

  return (
    <ModalWrapper visible={visible} maxHeight="70%">
      <Text style={styles.title}>Seleccionar Pedido</Text>

      <FlatList
        data={pedidos}
        keyExtractor={p => p.id.toString()}
        style={styles.modalList}
        renderItem={({ item }) => {
          const disabled = disabledIds.has(item.id);
          return (
            <TouchableOpacity
              style={[styles.item, disabled && styles.disabledItem]}
              onPress={() => {
                if (disabled && !allowSelectDisabled) {
                  // show modal instead of alert
                  setInfoVisible(true);
                  return;
                }
                onSelect(item.id);
                onClose();
              }}
              disabled={disabled && !allowSelectDisabled}
            >
              <Text style={[styles.itemDate, disabled && styles.disabledText]}>{formatLocalFromSqlite(item.date)}</Text>
              <Text style={[styles.itemType, disabled && styles.disabledText]}>Pedido #{item.id}</Text>
            </TouchableOpacity>
          );
        }}
        ItemSeparatorComponent={() => <View style={styles.sep} />}
      />

      <View style={styles.modalButtons}>
        <AccessibleButton title="Cerrar" onPress={onClose} variant="secondary" style={styles.modalButton} />
      </View>

      {/* informational modal for disabled pedido */}
      <ModalWrapper visible={infoVisible} maxHeight="40%">
        <Text style={styles.title}>Pedido no editable</Text>
        <Text style={{ textAlign: 'center', marginBottom: 16 }}>Este pedido ya tiene entregas asociadas.</Text>
        <AccessibleButton title="OK" onPress={() => setInfoVisible(false)} variant="primary" />
      </ModalWrapper>
    </ModalWrapper>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: 16,
  },
  modalList: {
    maxHeight: 200,
  },
  item: {
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderBottomWidth: 2,
    borderColor: colors.border
  },
  itemDate: {
    fontSize: 16,
    fontWeight: '600',
  },
  itemType: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  sep: {
    height: 1,
    backgroundColor: colors.borderLight,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 24,
  },
  modalButton: {
    flex: 1,
  },
  disabledItem: {
    opacity: 0.4,
  },
  disabledText: {
    color: colors.textSecondary,
  },
});
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
} from 'react-native';
import { TempPedido } from '@app-types/index';
import { colors } from '@theme/colors';
import AccessibleButton from '@components/AccessibleButton';
import ModalWrapper from '@components/ModalWrapper';
import { ConfirmationModal } from '@components/ConfirmationModal';

// Color para pedidos
const PEDIDOS_COLOR = '#FF9800';

interface PedidoConfirmationModalProps {
  visible: boolean;
  tempPedidos: TempPedido[];
  saving: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export function PedidoConfirmationModal({
  visible,
  tempPedidos,
  saving,
  onCancel,
  onConfirm,
}: PedidoConfirmationModalProps) {
  const pedidosToShow = tempPedidos.filter((pedido: TempPedido) => pedido.quantity > 0);

  return (
    <ConfirmationModal
      visible={visible}
      items={pedidosToShow}
      saving={saving}
      onCancel={onCancel}
      onConfirm={onConfirm}
      title="Confirmar Pedidos"
      subtitle="Se registrarán los siguientes pedidos para el proveedor:"
      confirmButtonTitle="Guardar"
      quantityColor={PEDIDOS_COLOR}
    />
  );
}

const styles = StyleSheet.create({
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: 16,
  },
  modalSubtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
  },
  modalList: {
    maxHeight: 200,
  },
  modalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  modalItemName: {
    fontSize: 16,
    color: colors.textPrimary,
  },
  modalItemQuantity: {
    fontSize: 16,
    fontWeight: 'bold',
    color: PEDIDOS_COLOR,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
    gap: 12,
  },
  modalButton: {
    flex: 1,
  },
  saveButton: {
    flex: 1,
    backgroundColor: PEDIDOS_COLOR,
  },
});

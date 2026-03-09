import React, { useState } from 'react';
import PedidoSelectorModal from './PedidoSelectorModal';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import AccessibleButton from './AccessibleButton';
import { ViewStyle, StyleProp } from 'react-native';

interface PedidoSelectorProps {
  onSelect: (id: number) => void;
  /**
   * ID currently selected, used to update the button label.
   * If null/undefined the default prompt text is shown.
   */
  selectedPedidoId?: number | null;
  /**
   * When true, the button indicates that an existing pedido is being edited
   */
  editing?: boolean;
  /**
   * Variant for the underlying AccessibleButton; allows coloring per screen
   */
  buttonVariant?: 'primary' | 'secondary' | 'danger' | 'success';
  /**
   * Optional style applied to the button wrapper
   */
  buttonStyle?: StyleProp<ViewStyle>;
  /**
   * Only show pedidos that have no entregas (hide those with entregas)
   */
  availableOnly?: boolean;
  /**
   * When true, disabled items may still be selected (used by Pedidos screen)
   */
  allowSelectDisabled?: boolean;
}

export default function PedidoSelector({ onSelect, selectedPedidoId, editing, buttonVariant = 'primary', buttonStyle, availableOnly = false, allowSelectDisabled = false }: PedidoSelectorProps) {
  const [visible, setVisible] = useState(false);
  const open = () => setVisible(true);
  const close = () => setVisible(false);

  const handleSelect = (id: number) => {
    onSelect(id);
    close();
  };

  let buttonLabel = 'Seleccionar pedido';
  if (selectedPedidoId) {
    buttonLabel = editing ? `Editando pedido #${selectedPedidoId}` : `Pedido #${selectedPedidoId} seleccionado`;
  }

  return (
    <>
      <AccessibleButton title={buttonLabel} onPress={open} style={[styles.button, buttonStyle]} variant={buttonVariant} />
      <PedidoSelectorModal visible={visible} onClose={close} onSelect={handleSelect} availableOnly={availableOnly} allowSelectDisabled={allowSelectDisabled} />
    </>
  );
}

const styles = StyleSheet.create({
  button: {
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    color: 'black'
  }
});

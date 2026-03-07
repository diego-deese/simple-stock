import React, { useEffect, useState } from 'react';
import { View, Modal, StyleSheet, FlatList, TouchableOpacity, Text } from 'react-native';
import { reportService } from '@services/index';
import { Report } from '@app-types/index';
import { colors } from '@theme/colors';

export default function PedidoSelectorModal({ visible, onClose, onSelect }: { visible: boolean; onClose: () => void; onSelect: (id: number) => void }) {
  const [pedidos, setPedidos] = useState<Report[]>([]);

  useEffect(() => {
    if (!visible) return;
    (async () => {
      const list = await reportService.getPedidosReports();
      setPedidos(list);
    })();
  }, [visible]);

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.backdrop}>
        <View style={styles.container}>
          <Text style={styles.title}>Seleccionar Pedido</Text>
          <FlatList
            data={pedidos}
            keyExtractor={p => p.id.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.item} onPress={() => { onSelect(item.id); onClose(); }}>
                <Text style={styles.itemDate}>{new Date(item.date).toLocaleString()}</Text>
                <Text style={styles.itemType}>Pedido #{item.id}</Text>
              </TouchableOpacity>
            )}
            ItemSeparatorComponent={() => <View style={styles.sep} />}
          />

          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeText}>Cerrar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  container: { width: '90%', maxHeight: '80%', backgroundColor: colors.white, borderRadius: 12, padding: 16 },
  title: { fontSize: 20, fontWeight: '700', marginBottom: 12 },
  item: { paddingVertical: 14, paddingHorizontal: 8 },
  itemDate: { fontSize: 16, fontWeight: '600' },
  itemType: { fontSize: 14, color: colors.textSecondary },
  sep: { height: 1, backgroundColor: colors.border },
  closeButton: { marginTop: 12, padding: 12, alignItems: 'center', backgroundColor: colors.background, borderRadius: 8 },
  closeText: { fontWeight: '700' },
});

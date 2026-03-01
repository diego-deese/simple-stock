import React from 'react';
import {
  View,
  Modal,
  StyleSheet,
  ViewStyle,
  StyleProp,
} from 'react-native';
import { colors } from '@theme/colors';

interface ModalWrapperProps {
  visible: boolean;
  animationType?: 'none' | 'slide' | 'fade';
  children: React.ReactNode;
  contentStyle?: StyleProp<ViewStyle>;
  /** Width of the modal content as percentage string, e.g. '85%' or '90%' */
  width?: string;
  /** Max height of the modal content as percentage string, e.g. '70%' or '80%' */
  maxHeight?: string;
}

/**
 * Wrapper component for modals that provides consistent overlay and content styling.
 * Use this to wrap any modal content for a unified look across the app.
 */
export default function ModalWrapper({
  visible,
  animationType = 'slide',
  children,
  contentStyle,
  width = '85%',
  maxHeight = '80%',
}: ModalWrapperProps) {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType={animationType}
    >
      <View style={styles.overlay}>
        <View 
          style={[
            styles.content, 
            { width, maxHeight } as ViewStyle,
            contentStyle,
          ]}
        >
          {children}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 24,
  },
});

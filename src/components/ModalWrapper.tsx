import React from 'react';
import {
  View,
  Modal,
  StyleSheet,
  ViewStyle,
  StyleProp,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
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
  /** Enable keyboard avoiding behavior for modals with text inputs */
  avoidKeyboard?: boolean;
}

/**
 * Wrapper component for modals that provides consistent overlay and content styling.
 * Use this to wrap any modal content for a unified look across the app.
 * Set avoidKeyboard={true} for modals with text inputs.
 */
export default function ModalWrapper({
  visible,
  animationType = 'slide',
  children,
  contentStyle,
  width = '85%',
  maxHeight = '80%',
  avoidKeyboard = false,
}: ModalWrapperProps) {
  const content = (
    <View 
      style={[
        styles.content, 
        { width, maxHeight } as ViewStyle,
        contentStyle,
      ]}
    >
      {avoidKeyboard ? (
        <ScrollView 
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.scrollContent}
        >
          {children}
        </ScrollView>
      ) : (
        children
      )}
    </View>
  );

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType={animationType}
    >
      {avoidKeyboard ? (
        <KeyboardAvoidingView 
          style={styles.overlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          {content}
        </KeyboardAvoidingView>
      ) : (
        <View style={styles.overlay}>
          {content}
        </View>
      )}
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
  scrollContent: {
    flexGrow: 1,
  },
});

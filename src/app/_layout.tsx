import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppProvider } from '@context/AppContext';
import { AuthProvider } from '@context/AuthContext';
import { colors } from '@theme/colors';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AppProvider>
        <AuthProvider>
          <StatusBar style="light" backgroundColor={colors.primary} />
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" />
          </Stack>
        </AuthProvider>
      </AppProvider>
    </SafeAreaProvider>
  );
}

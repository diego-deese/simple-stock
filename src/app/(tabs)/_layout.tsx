import { Tabs } from 'expo-router';
import { Text, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '@theme/colors';

// Iconos simples usando emojis para alta legibilidad
const TabIcon = ({ emoji, focused }: { emoji: string; focused: boolean }) => (
  <Text style={{ 
    fontSize: 20, 
    opacity: focused ? 1 : 0.4 
  }}>
    {emoji}
  </Text>
);

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  // En Android con navegación por gestos, insets.bottom puede ser 0
  // Usamos un mínimo de 16 para Android
  const bottomPadding = Platform.OS === 'android' 
    ? Math.max(insets.bottom, 16) 
    : insets.bottom;
  
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          marginBottom: bottomPadding,
          height: 80,
          paddingVertical: 4,
        },
        tabBarIconStyle: {
          marginVertical: 4,
        },
        tabBarLabelStyle: {
          fontSize: 14,
          fontWeight: '600',
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Registro',
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="📝" focused={focused} />
          ),
        }}
      />
<Tabs.Screen
         name="desperdicio"
         options={{
           title: 'Desperdicio',
           tabBarIcon: ({ focused }) => (
             <TabIcon emoji="♻️" focused={focused} />
           ),
         }}
       />
       <Tabs.Screen
         name="balance"
        options={{
          title: 'Balance',
          tabBarIcon: ({ focused }) => <TabIcon emoji="📊" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="admin"
        options={{
          title: 'Admin',
          tabBarIcon: ({ focused }) => <TabIcon emoji="⚙️" focused={focused} />,
        }}
      />
      {/* Ocultar catalog y history de los tabs - se acceden desde admin */}
      <Tabs.Screen
        name="catalog"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="categories"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}

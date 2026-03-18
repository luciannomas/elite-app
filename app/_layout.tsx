import { useEffect, useState } from 'react';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { getStoredUser } from '../lib/auth';

export default function RootLayout() {
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    getStoredUser().then(user => {
      if (!user) {
        router.replace('/(auth)/login');
      } else if (user.role === 'jefe_cuadrilla') {
        router.replace('/(jefe)/dashboard');
      } else {
        router.replace('/(auditor)/dashboard');
      }
      setChecked(true);
    });
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#0f1117' } }} />
    </SafeAreaProvider>
  );
}

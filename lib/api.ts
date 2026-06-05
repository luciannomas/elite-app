import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';


export const API_URL = Platform.OS === 'web'
  ? 'http://localhost:3000'
  : 'http://192.168.1.13:3000';

export async function getToken(): Promise<string | null> {
  if (Platform.OS === 'web') {
    return localStorage.getItem('elite_token');
  }
  return SecureStore.getItemAsync('elite_token');
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {}
): Promise<{ success: boolean; data?: T; error?: string }> {
  const token = await getToken();
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Cookie: `next-auth.session-token=${token}` } : {}),
      ...options.headers,
    },
  });
  return res.json();
}

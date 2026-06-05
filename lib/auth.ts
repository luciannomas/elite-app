import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { API_URL } from './api';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'jefe_cuadrilla' | 'auditor' | 'super_admin';
}

const USER_KEY = 'elite_user';
const TOKEN_KEY = 'elite_token';

// Fallback a localStorage en web
async function setItem(key: string, value: string) {
  if (Platform.OS === 'web') {
    localStorage.setItem(key, value);
  } else {
    await SecureStore.setItemAsync(key, value);
  }
}

async function getItem(key: string): Promise<string | null> {
  if (Platform.OS === 'web') {
    return localStorage.getItem(key);
  }
  return SecureStore.getItemAsync(key);
}

async function removeItem(key: string) {
  if (Platform.OS === 'web') {
    localStorage.removeItem(key);
  } else {
    await SecureStore.deleteItemAsync(key);
  }
}

export async function login(email: string, password: string): Promise<User> {
  const res = await fetch(`${API_URL}/api/mobile-auth`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: email.toLowerCase(), password }),
  });

  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'Credenciales incorrectas');

  const user: User = json.user;
  await setItem(TOKEN_KEY, json.token);
  await setItem(USER_KEY, JSON.stringify(user));
  return user;
}

export async function logout() {
  await removeItem(TOKEN_KEY);
  await removeItem(USER_KEY);
}

export async function getStoredUser(): Promise<User | null> {
  try {
    const raw = await getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export async function getStoredToken(): Promise<string | null> {
  return getItem(TOKEN_KEY);
}

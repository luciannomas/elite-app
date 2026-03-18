import * as SecureStore from 'expo-secure-store';
import { API_URL } from './api';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'jefe_cuadrilla' | 'auditor' | 'super_admin';
}

const USER_KEY = 'elite_user';
const TOKEN_KEY = 'elite_token';

export async function login(email: string, password: string): Promise<User> {
  // 1. Obtener CSRF token
  const csrfRes = await fetch(`${API_URL}/api/auth/csrf`);
  const { csrfToken } = await csrfRes.json();
  const cookies = csrfRes.headers.get('set-cookie') || '';

  // 2. Login con credentials
  const body = new URLSearchParams({
    csrfToken,
    email: email.toLowerCase(),
    password,
    callbackUrl: `${API_URL}/auditor`,
    json: 'true',
  });

  const loginRes = await fetch(`${API_URL}/api/auth/callback/credentials`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Cookie: cookies,
    },
    body: body.toString(),
    redirect: 'manual',
  });

  const loginCookies = loginRes.headers.get('set-cookie') || '';
  const tokenMatch = loginCookies.match(/next-auth\.session-token=([^;]+)/);
  const sessionToken = tokenMatch?.[1];

  if (!sessionToken) throw new Error('Credenciales incorrectas');

  // 3. Obtener datos de sesión
  const sessionRes = await fetch(`${API_URL}/api/auth/session`, {
    headers: { Cookie: `next-auth.session-token=${sessionToken}` },
  });
  const session = await sessionRes.json();

  if (!session?.user) throw new Error('No se pudo obtener la sesión');

  const user: User = {
    id: session.user.id,
    name: session.user.name,
    email: session.user.email,
    role: session.user.role,
  };

  await SecureStore.setItemAsync(TOKEN_KEY, sessionToken);
  await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
  return user;
}

export async function logout() {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
  await SecureStore.deleteItemAsync(USER_KEY);
}

export async function getStoredUser(): Promise<User | null> {
  const raw = await SecureStore.getItemAsync(USER_KEY);
  return raw ? JSON.parse(raw) : null;
}

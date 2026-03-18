import * as SecureStore from 'expo-secure-store';

export const API_URL = 'https://elite-demo-v1.vercel.app';

export async function getToken(): Promise<string | null> {
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

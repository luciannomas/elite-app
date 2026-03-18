import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { login } from '../../lib/auth';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleLogin() {
    if (!email || !password) { setError('Completá email y contraseña'); return; }
    setLoading(true);
    setError('');
    try {
      const user = await login(email.trim(), password);
      if (user.role === 'jefe_cuadrilla') router.replace('/(jefe)/dashboard');
      else router.replace('/(auditor)/dashboard');
    } catch (e: any) {
      setError(e.message || 'Credenciales incorrectas');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView style={s.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {/* Brand */}
      <View style={s.brand}>
        <View style={s.logo}><Text style={s.logoText}>E</Text></View>
        <Text style={s.title}>Elite</Text>
        <Text style={s.subtitle}>Seguimiento Operativo</Text>
      </View>

      {/* Form */}
      <View style={s.card}>
        <Text style={s.label}>Correo electrónico</Text>
        <TextInput
          style={s.input}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          placeholder="usuario@empresa.com"
          placeholderTextColor="#484f58"
        />
        <Text style={[s.label, { marginTop: 16 }]}>Contraseña</Text>
        <TextInput
          style={s.input}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholder="••••••••"
          placeholderTextColor="#484f58"
        />
        {!!error && <Text style={s.error}>{error}</Text>}
        <TouchableOpacity style={s.btn} onPress={handleLogin} disabled={loading}>
          {loading ? <ActivityIndicator color="white" /> : <Text style={s.btnText}>Ingresar</Text>}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f1117', justifyContent: 'center', padding: 24 },
  brand: { alignItems: 'center', marginBottom: 32 },
  logo: { width: 64, height: 64, borderRadius: 16, backgroundColor: '#1d6fb8', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  logoText: { color: 'white', fontSize: 28, fontWeight: 'bold' },
  title: { color: 'white', fontSize: 28, fontWeight: 'bold' },
  subtitle: { color: '#8b949e', fontSize: 14, marginTop: 4 },
  card: { backgroundColor: '#161b22', borderRadius: 16, padding: 20, borderWidth: 1, borderColor: '#21262d' },
  label: { color: '#8b949e', fontSize: 13, marginBottom: 6 },
  input: { backgroundColor: '#0f1117', borderWidth: 1, borderColor: '#30363d', borderRadius: 10, padding: 12, color: 'white', fontSize: 15 },
  error: { color: '#f85149', fontSize: 13, marginTop: 12, textAlign: 'center' },
  btn: { backgroundColor: '#1d6fb8', borderRadius: 10, padding: 14, alignItems: 'center', marginTop: 20 },
  btnText: { color: 'white', fontWeight: '700', fontSize: 15 },
});

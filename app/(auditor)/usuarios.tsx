import { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';

const MOCK_USUARIOS = [
  { id: 'u1', name: 'Amarilla Carlos', email: 'jefe@elite.com', role: 'jefe_cuadrilla', active: true },
  { id: 'u2', name: 'Surra Juan', email: 'jefe2@elite.com', role: 'jefe_cuadrilla', active: true },
  { id: 'u3', name: 'Auditora Demo', email: 'auditor@elite.com', role: 'auditor', active: true },
  { id: 'u4', name: 'Admin Sistema', email: 'admin@elite.com', role: 'super_admin', active: true },
];

const ROLE_LABEL: Record<string, string> = {
  jefe_cuadrilla: 'Jefe de Cuadrilla',
  auditor: 'Auditor',
  super_admin: 'Super Admin',
};

const ROLE_COLOR: Record<string, string> = {
  jefe_cuadrilla: '#1d6fb8',
  auditor: '#9e6a03',
  super_admin: '#8957e5',
};

function initials(name: string) {
  return name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
}

export default function UsuariosScreen() {
  const [usuarios] = useState(MOCK_USUARIOS);

  return (
    <View style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={s.back}>← Volver</Text>
        </TouchableOpacity>
        <Text style={s.title}>Usuarios</Text>
        <View style={{ width: 60 }} />
      </View>

      <Text style={s.count}>{usuarios.length} usuario{usuarios.length !== 1 ? 's' : ''}</Text>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        {usuarios.map(u => (
          <View key={u.id} style={s.item}>
            <View style={[s.avatar, { backgroundColor: `${ROLE_COLOR[u.role]}30` }]}>
              <Text style={[s.avatarText, { color: ROLE_COLOR[u.role] }]}>{initials(u.name)}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.name}>{u.name}</Text>
              <Text style={s.email}>{u.email}</Text>
            </View>
            <View style={[s.badge, { backgroundColor: `${ROLE_COLOR[u.role]}20` }]}>
              <Text style={[s.badgeText, { color: ROLE_COLOR[u.role] }]}>{ROLE_LABEL[u.role]}</Text>
            </View>
          </View>
        ))}

        <View style={s.note}>
          <Text style={s.noteText}>Gestión de usuarios disponible en la versión web</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f1117' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 56, backgroundColor: '#080b0f', borderBottomWidth: 1, borderBottomColor: '#21262d' },
  back: { color: '#1d6fb8', fontSize: 15, width: 60 },
  title: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  count: { color: '#8b949e', fontSize: 13, paddingHorizontal: 16, paddingTop: 12 },
  item: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#161b22', borderRadius: 12, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: '#21262d', gap: 12 },
  avatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 15, fontWeight: '700' },
  name: { color: 'white', fontSize: 14, fontWeight: '600' },
  email: { color: '#8b949e', fontSize: 12, marginTop: 2 },
  badge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  badgeText: { fontSize: 11, fontWeight: '600' },
  note: { backgroundColor: '#161b22', borderRadius: 12, padding: 20, alignItems: 'center', borderWidth: 1, borderColor: '#21262d', marginTop: 8 },
  noteText: { color: '#8b949e', fontSize: 13, textAlign: 'center' },
});

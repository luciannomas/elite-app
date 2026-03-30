import { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet, ActivityIndicator, Alert, Modal, RefreshControl } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { API_URL } from '../../lib/api';

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
const ROLES = ['jefe_cuadrilla', 'auditor', 'super_admin'] as const;

function initials(name: string) {
  return name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
}

const emptyForm = { name: '', email: '', password: '', role: 'jefe_cuadrilla' as string, active: true };

export default function UsuariosScreen() {
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editUser, setEditUser] = useState<any>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);

  async function getHeaders(extra?: object) {
    const token = await SecureStore.getItemAsync('elite_token');
    return {
      'Content-Type': 'application/json',
      ...(token ? { Cookie: `next-auth.session-token=${token}` } : {}),
      ...extra,
    };
  }

  async function loadUsuarios(isRefresh = false) {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    try {
      const headers = await getHeaders();
      const res = await fetch(`${API_URL}/api/usuarios`, { headers });
      const json = await res.json();
      if (json.success) setUsuarios(json.data ?? []);
    } catch {}
    finally { setLoading(false); setRefreshing(false); }
  }

  useFocusEffect(useCallback(() => { loadUsuarios(); }, []));

  function openCreate() {
    setEditUser(null);
    setForm({ ...emptyForm });
    setShowModal(true);
  }

  function openEdit(u: any) {
    setEditUser(u);
    setForm({ name: u.name, email: u.email, password: '', role: u.role, active: u.active });
    setShowModal(true);
  }

  async function handleSave() {
    if (!form.name.trim() || !form.email.trim()) {
      Alert.alert('Campos requeridos', 'Nombre y email son obligatorios');
      return;
    }
    if (!editUser && !form.password.trim()) {
      Alert.alert('Contraseña requerida', 'Ingresá una contraseña para el nuevo usuario');
      return;
    }
    setSaving(true);
    try {
      const headers = await getHeaders();
      const payload: any = { name: form.name, email: form.email, role: form.role, active: form.active };
      if (form.password) payload.password = form.password;
      const url = editUser ? `${API_URL}/api/usuarios/${editUser._id}` : `${API_URL}/api/usuarios`;
      const method = editUser ? 'PUT' : 'POST';
      const res = await fetch(url, { method, headers, body: JSON.stringify(payload) });
      const json = await res.json();
      if (json.success) {
        Alert.alert('Listo', editUser ? 'Usuario actualizado' : 'Usuario creado');
        setShowModal(false);
        loadUsuarios();
      } else {
        Alert.alert('Error', json.error || 'No se pudo guardar');
      }
    } catch {
      Alert.alert('Error', 'No se pudo conectar al servidor');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(u: any) {
    Alert.alert('Eliminar usuario', `¿Eliminar a ${u.name}?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar', style: 'destructive',
        onPress: async () => {
          const headers = await getHeaders();
          const res = await fetch(`${API_URL}/api/usuarios/${u._id}`, { method: 'DELETE', headers });
          const json = await res.json();
          if (json.success) loadUsuarios();
          else Alert.alert('Error', json.error);
        },
      },
    ]);
  }

  return (
    <View style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={s.back}>← Volver</Text>
        </TouchableOpacity>
        <Text style={s.title}>Usuarios</Text>
        <TouchableOpacity style={s.addBtn} onPress={openCreate}>
          <Text style={s.addBtnText}>+ Nuevo</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={s.center}><ActivityIndicator color="#1d6fb8" size="large" /></View>
      ) : (
        <>
          <Text style={s.count}>{usuarios.length} usuario{usuarios.length !== 1 ? 's' : ''}</Text>
          <ScrollView
            contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadUsuarios(true)} tintColor="#1d6fb8" />}
          >
            {usuarios.map((u: any) => {
              const color = ROLE_COLOR[u.role] ?? '#8b949e';
              return (
                <View key={u._id} style={s.item}>
                  <View style={[s.avatar, { backgroundColor: `${color}25` }]}>
                    <Text style={[s.avatarText, { color }]}>{initials(u.name)}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.name}>{u.name}</Text>
                    <Text style={s.email}>{u.email}</Text>
                    <View style={{ flexDirection: 'row', gap: 6, marginTop: 5 }}>
                      <View style={[s.badge, { backgroundColor: `${color}20` }]}>
                        <Text style={[s.badgeText, { color }]}>{ROLE_LABEL[u.role] ?? u.role}</Text>
                      </View>
                      <View style={[s.badge, { backgroundColor: u.active ? '#23863620' : '#da363320' }]}>
                        <Text style={[s.badgeText, { color: u.active ? '#3fb950' : '#f85149' }]}>
                          {u.active ? 'Activo' : 'Inactivo'}
                        </Text>
                      </View>
                    </View>
                  </View>
                  <View style={{ gap: 6 }}>
                    <TouchableOpacity style={s.actionBtn} onPress={() => openEdit(u)}>
                      <Text style={s.actionBtnText}>Editar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[s.actionBtn, { borderColor: '#da363360' }]} onPress={() => handleDelete(u)}>
                      <Text style={[s.actionBtnText, { color: '#f85149' }]}>Eliminar</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </ScrollView>
        </>
      )}

      {/* Modal crear/editar */}
      <Modal visible={showModal} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowModal(false)}>
        <View style={s.modal}>
          <View style={s.modalHeader}>
            <Text style={s.modalTitle}>{editUser ? 'Editar Usuario' : 'Nuevo Usuario'}</Text>
            <TouchableOpacity onPress={() => setShowModal(false)}>
              <Text style={s.modalClose}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
            <Text style={s.fieldLabel}>Nombre completo</Text>
            <TextInput style={s.input} value={form.name} onChangeText={v => setForm(f => ({ ...f, name: v }))} placeholder="Juan Pérez" placeholderTextColor="#484f58" />

            <Text style={s.fieldLabel}>Email</Text>
            <TextInput style={s.input} value={form.email} onChangeText={v => setForm(f => ({ ...f, email: v }))} placeholder="juan@elite.com" placeholderTextColor="#484f58" keyboardType="email-address" autoCapitalize="none" />

            <Text style={s.fieldLabel}>Contraseña {editUser ? '(dejar vacío para no cambiar)' : ''}</Text>
            <TextInput style={s.input} value={form.password} onChangeText={v => setForm(f => ({ ...f, password: v }))} placeholder={editUser ? '••••••••' : 'Contraseña'} placeholderTextColor="#484f58" secureTextEntry />

            <Text style={s.fieldLabel}>Rol</Text>
            <View style={s.chipWrap}>
              {ROLES.map(r => (
                <TouchableOpacity
                  key={r}
                  style={[s.chip, form.role === r && { backgroundColor: `${ROLE_COLOR[r]}20`, borderColor: ROLE_COLOR[r] }]}
                  onPress={() => setForm(f => ({ ...f, role: r }))}
                >
                  <Text style={[s.chipText, form.role === r && { color: ROLE_COLOR[r] }]}>{ROLE_LABEL[r]}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={s.fieldLabel}>Estado</Text>
            <View style={s.toggleRow}>
              {[true, false].map(val => (
                <TouchableOpacity
                  key={String(val)}
                  style={[s.toggle, form.active === val && { backgroundColor: val ? '#23863620' : '#da363620', borderColor: val ? '#238636' : '#da3633' }]}
                  onPress={() => setForm(f => ({ ...f, active: val }))}
                >
                  <Text style={[s.toggleText, form.active === val && { color: val ? '#3fb950' : '#f85149' }]}>
                    {val ? 'Activo' : 'Inactivo'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={s.btnRow}>
              <TouchableOpacity style={s.btnCancel} onPress={() => setShowModal(false)}>
                <Text style={s.btnCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.btnSave, saving && { opacity: 0.6 }]} onPress={handleSave} disabled={saving}>
                {saving ? <ActivityIndicator color="white" size="small" /> : <Text style={s.btnSaveText}>{editUser ? 'Guardar' : 'Crear usuario'}</Text>}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f1117' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 56, backgroundColor: '#080b0f', borderBottomWidth: 1, borderBottomColor: '#21262d' },
  back: { color: '#1d6fb8', fontSize: 15, width: 60 },
  title: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  addBtn: { backgroundColor: '#1d6fb8', paddingHorizontal: 14, paddingVertical: 7, borderRadius: 8 },
  addBtnText: { color: 'white', fontWeight: '700', fontSize: 13 },
  count: { color: '#8b949e', fontSize: 13, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4 },
  item: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#161b22', borderRadius: 12, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: '#21262d', gap: 12 },
  avatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 15, fontWeight: '700' },
  name: { color: 'white', fontSize: 14, fontWeight: '600' },
  email: { color: '#8b949e', fontSize: 12, marginTop: 2 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  badgeText: { fontSize: 10, fontWeight: '600' },
  actionBtn: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, borderWidth: 1, borderColor: '#30363d' },
  actionBtnText: { color: '#8b949e', fontSize: 11, fontWeight: '600' },
  // Modal
  modal: { flex: 1, backgroundColor: '#0f1117' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 60, backgroundColor: '#080b0f', borderBottomWidth: 1, borderBottomColor: '#21262d' },
  modalTitle: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  modalClose: { color: '#8b949e', fontSize: 20, padding: 4 },
  fieldLabel: { color: '#8b949e', fontSize: 12, fontWeight: '600', marginBottom: 6, marginTop: 16 },
  input: { backgroundColor: '#161b22', borderWidth: 1, borderColor: '#30363d', borderRadius: 10, padding: 12, color: 'white', fontSize: 15 },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, backgroundColor: '#161b22', borderWidth: 1, borderColor: '#30363d' },
  chipText: { color: '#8b949e', fontSize: 13 },
  toggleRow: { flexDirection: 'row', gap: 10 },
  toggle: { flex: 1, padding: 12, borderRadius: 10, backgroundColor: '#161b22', borderWidth: 1, borderColor: '#30363d', alignItems: 'center' },
  toggleText: { color: '#8b949e', fontWeight: '600' },
  btnRow: { flexDirection: 'row', gap: 12, marginTop: 32 },
  btnCancel: { flex: 1, padding: 14, borderRadius: 12, backgroundColor: '#21262d', alignItems: 'center' },
  btnCancelText: { color: '#e6edf3', fontWeight: '600' },
  btnSave: { flex: 1, padding: 14, borderRadius: 12, backgroundColor: '#1d6fb8', alignItems: 'center' },
  btnSaveText: { color: 'white', fontWeight: '700', fontSize: 15 },
});

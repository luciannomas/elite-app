import { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { logout, getStoredUser } from '../../lib/auth';
import { mockRegistros } from '../../lib/mock-data';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STATUS_COLOR: Record<string, string> = {
  pre_aprobado: '#9e6a03', aprobado: '#238636', rechazado: '#da3633',
};
const STATUS_LABEL: Record<string, string> = {
  pre_aprobado: 'Pendiente', aprobado: 'Aprobado', rechazado: 'Rechazado',
};

function KPI({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <View style={[s.kpi, { borderTopColor: color }]}>
      <Text style={s.kpiVal}>{value}</Text>
      <Text style={s.kpiLabel}>{label}</Text>
    </View>
  );
}

export default function JefeDashboard() {
  const [user, setUser] = useState<any>(null);
  const [registros, setRegistros] = useState<any[]>([]);

  useEffect(() => {
    getStoredUser().then(setUser);
    loadRegistros();
  }, []);

  async function loadRegistros() {
    const raw = await AsyncStorage.getItem('elite_mock_status');
    const stored: Record<string, any> = raw ? JSON.parse(raw) : {};
    const data = mockRegistros.map(r => {
      const override = stored[r._id];
      return override ? { ...r, status: override.status } : r;
    });
    setRegistros(data);
  }

  async function handleLogout() {
    await logout();
    router.replace('/(auth)/login');
  }

  const pendientes = registros.filter(r => r.status === 'pre_aprobado').length;
  const aprobados = registros.filter(r => r.status === 'aprobado').length;
  const rechazados = registros.filter(r => r.status === 'rechazado').length;
  const recientes = registros.slice(0, 4);

  return (
    <View style={s.container}>
      <View style={s.header}>
        <View>
          <Text style={s.headerTitle}>Mis Jornadas</Text>
          <Text style={s.headerSub}>{user?.name}</Text>
        </View>
        <TouchableOpacity onPress={handleLogout} style={s.logoutBtn}>
          <Text style={s.logoutText}>Salir</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        {/* KPIs */}
        <View style={s.kpiRow}>
          <KPI label="Pendientes" value={pendientes} color="#9e6a03" />
          <KPI label="Aprobados" value={aprobados} color="#238636" />
          <KPI label="Rechazados" value={rechazados} color="#da3633" />
        </View>

        {/* Nueva jornada CTA */}
        <TouchableOpacity style={s.ctaBtn} onPress={() => router.push('/(jefe)/nueva-jornada' as any)}>
          <Text style={s.ctaBtnText}>+ Nueva Jornada</Text>
        </TouchableOpacity>

        {/* Registros recientes */}
        <View style={s.section}>
          <View style={s.sectionHeader}>
            <Text style={s.sectionTitle}>Recientes</Text>
            <TouchableOpacity onPress={() => router.push('/(jefe)/mis-registros' as any)}>
              <Text style={s.linkText}>Ver todos →</Text>
            </TouchableOpacity>
          </View>
          {recientes.map(r => (
            <View key={r._id} style={s.registroItem}>
              <View style={{ flex: 1 }}>
                <Text style={s.registroTitle} numberOfLines={1}>{r.proyectoNombre} — {r.clienteNombre}</Text>
                <Text style={s.registroSub}>{r.fecha} · {r.tipoProyecto}</Text>
              </View>
              <View style={[s.badge, { backgroundColor: `${STATUS_COLOR[r.status]}20` }]}>
                <Text style={[s.badgeText, { color: STATUS_COLOR[r.status] }]}>{STATUS_LABEL[r.status]}</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Bottom nav */}
      <View style={s.bottomNav}>
        {[
          { label: 'Dashboard', path: '/(jefe)/dashboard' },
          { label: 'Mis Registros', path: '/(jefe)/mis-registros' },
        ].map(item => (
          <TouchableOpacity key={item.path} style={s.navItem} onPress={() => router.push(item.path as any)}>
            <Text style={[s.navLabel, item.path.includes('dashboard') && { color: '#1d6fb8' }]}>{item.label}</Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity style={s.navFab} onPress={() => router.push('/(jefe)/nueva-jornada' as any)}>
          <Text style={s.navFabText}>+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f1117' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 56, backgroundColor: '#080b0f', borderBottomWidth: 1, borderBottomColor: '#21262d' },
  headerTitle: { color: 'white', fontSize: 20, fontWeight: 'bold' },
  headerSub: { color: '#8b949e', fontSize: 13, marginTop: 2 },
  logoutBtn: { padding: 8 },
  logoutText: { color: '#8b949e', fontSize: 14 },
  kpiRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  kpi: { flex: 1, backgroundColor: '#161b22', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#21262d', borderTopWidth: 2 },
  kpiVal: { color: 'white', fontSize: 26, fontWeight: 'bold' },
  kpiLabel: { color: '#8b949e', fontSize: 11, marginTop: 2 },
  ctaBtn: { backgroundColor: '#1d6fb8', borderRadius: 12, padding: 16, alignItems: 'center', marginBottom: 16 },
  ctaBtnText: { color: 'white', fontWeight: '700', fontSize: 16 },
  section: { backgroundColor: '#161b22', borderRadius: 12, borderWidth: 1, borderColor: '#21262d' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14, borderBottomWidth: 1, borderBottomColor: '#21262d' },
  sectionTitle: { color: 'white', fontWeight: '600', fontSize: 15 },
  linkText: { color: '#1d6fb8', fontSize: 13 },
  registroItem: { flexDirection: 'row', alignItems: 'center', padding: 14, borderBottomWidth: 1, borderBottomColor: '#21262d' },
  registroTitle: { color: 'white', fontSize: 13, fontWeight: '600' },
  registroSub: { color: '#8b949e', fontSize: 11, marginTop: 2 },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20, marginLeft: 8 },
  badgeText: { fontSize: 11, fontWeight: '600' },
  bottomNav: { flexDirection: 'row', backgroundColor: '#080b0f', borderTopWidth: 1, borderTopColor: '#21262d', paddingBottom: 20, alignItems: 'center' },
  navItem: { flex: 1, alignItems: 'center', paddingVertical: 12 },
  navLabel: { color: '#8b949e', fontSize: 11, fontWeight: '500' },
  navFab: { width: 52, height: 52, borderRadius: 26, backgroundColor: '#1d6fb8', alignItems: 'center', justifyContent: 'center', marginTop: -20, marginHorizontal: 16, shadowColor: '#1d6fb8', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8, elevation: 8 },
  navFabText: { color: 'white', fontSize: 26, fontWeight: '300', lineHeight: 30 },
});

import { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { logout, getStoredUser } from '../../lib/auth';
import { mockKPIs, mockRegistros } from '../../lib/mock-data';

const STATUS_COLOR: Record<string, string> = {
  pre_aprobado: '#9e6a03', aprobado: '#238636', rechazado: '#da3633',
};
const STATUS_LABEL: Record<string, string> = {
  pre_aprobado: 'Pendiente', aprobado: 'Aprobado', rechazado: 'Rechazado',
};

function KPI({ label, value, unit, color }: { label: string; value: any; unit?: string; color: string }) {
  return (
    <View style={[s.kpi, { borderTopColor: color, borderTopWidth: 2 }]}>
      <Text style={s.kpiVal}>{value}<Text style={s.kpiUnit}> {unit}</Text></Text>
      <Text style={s.kpiLabel}>{label}</Text>
    </View>
  );
}

export default function AuditorDashboard() {
  const [user, setUser] = useState<any>(null);
  const [pendientes, setPendientes] = useState(mockRegistros.filter(r => r.status === 'pre_aprobado'));

  useEffect(() => {
    getStoredUser().then(setUser);
  }, []);

  async function handleLogout() {
    await logout();
    router.replace('/(auth)/login');
  }

  return (
    <View style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <View>
          <Text style={s.headerTitle}>Dashboard</Text>
          <Text style={s.headerSub}>{user?.name}</Text>
        </View>
        <TouchableOpacity onPress={handleLogout} style={s.logoutBtn}>
          <Text style={s.logoutText}>Salir</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        {/* KPIs */}
        <View style={s.kpiRow}>
          <KPI label="Pendientes" value={mockKPIs.pendientes} color="#9e6a03" />
          <KPI label="Aprobados" value={mockKPIs.aprobados} color="#238636" />
          <KPI label="Rechazados" value={mockKPIs.rechazados} color="#da3633" />
        </View>
        <View style={s.kpiRow}>
          <KPI label="HH Totales" value={mockKPIs.hhTotales} unit="h" color="#1d6fb8" />
          <KPI label="KM Totales" value={mockKPIs.kmTotales} unit="km" color="#8b949e" />
          <KPI label="Productividad" value="55" unit="%" color="#1d6fb8" />
        </View>

        {/* Pendientes */}
        <View style={s.section}>
          <View style={s.sectionHeader}>
            <Text style={s.sectionTitle}>Pendientes</Text>
            <TouchableOpacity onPress={() => router.push('/(auditor)/aprobaciones')}>
              <Text style={s.linkText}>Ver todos →</Text>
            </TouchableOpacity>
          </View>
          {pendientes.slice(0, 4).map(r => (
            <TouchableOpacity
              key={r._id}
              style={s.registroItem}
              onPress={() => router.push(`/(auditor)/aprobacion/${r._id}` as any)}
            >
              <View style={{ flex: 1 }}>
                <Text style={s.registroTitle} numberOfLines={1}>{r.proyectoNombre} — {r.clienteNombre}</Text>
                <Text style={s.registroSub}>{r.fecha} · {r.encargadoNombre}</Text>
              </View>
              <View style={[s.badge, { backgroundColor: `${STATUS_COLOR[r.status]}20` }]}>
                <Text style={[s.badgeText, { color: STATUS_COLOR[r.status] }]}>{STATUS_LABEL[r.status]}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Bottom nav */}
      <View style={s.bottomNav}>
        {[
          { label: 'Dashboard', path: '/(auditor)/dashboard' },
          { label: 'Aprobar', path: '/(auditor)/aprobaciones' },
          { label: 'Registros', path: '/(auditor)/registros' },
          { label: 'Usuarios', path: '/(auditor)/usuarios' },
        ].map(item => (
          <TouchableOpacity key={item.path} style={s.navItem} onPress={() => router.push(item.path as any)}>
            <Text style={[s.navLabel, item.path.includes('dashboard') && { color: '#1d6fb8' }]}>{item.label}</Text>
          </TouchableOpacity>
        ))}
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
  kpiRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  kpi: { flex: 1, backgroundColor: '#161b22', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#21262d' },
  kpiVal: { color: 'white', fontSize: 22, fontWeight: 'bold' },
  kpiUnit: { color: '#8b949e', fontSize: 13 },
  kpiLabel: { color: '#8b949e', fontSize: 11, marginTop: 2 },
  section: { backgroundColor: '#161b22', borderRadius: 12, borderWidth: 1, borderColor: '#21262d', marginTop: 8 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14, borderBottomWidth: 1, borderBottomColor: '#21262d' },
  sectionTitle: { color: 'white', fontWeight: '600', fontSize: 15 },
  linkText: { color: '#1d6fb8', fontSize: 13 },
  registroItem: { flexDirection: 'row', alignItems: 'center', padding: 14, borderBottomWidth: 1, borderBottomColor: '#21262d' },
  registroTitle: { color: 'white', fontSize: 13, fontWeight: '600' },
  registroSub: { color: '#8b949e', fontSize: 11, marginTop: 2 },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20 },
  badgeText: { fontSize: 11, fontWeight: '600' },
  bottomNav: { flexDirection: 'row', backgroundColor: '#080b0f', borderTopWidth: 1, borderTopColor: '#21262d', paddingBottom: 20 },
  navItem: { flex: 1, alignItems: 'center', paddingVertical: 12 },
  navLabel: { color: '#8b949e', fontSize: 11, fontWeight: '500' },
});

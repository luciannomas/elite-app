import { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { logout, getStoredUser } from '../../lib/auth';
import { API_URL, getToken } from '../../lib/api';

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
  const insets = useSafeAreaInsets();
  const [user, setUser] = useState<any>(null);
  const [pendientes, setPendientes] = useState<any[]>([]);
  const [kpis, setKpis] = useState({ pendientes: 0, aprobados: 0, rechazados: 0, hhTotales: 0, kmTotales: 0, productividad: 0 });
  const [loading, setLoading] = useState(true);

  async function loadData() {
    setLoading(true);
    try {
      const token = await getToken();
      const headers: Record<string, string> = token ? { Cookie: `next-auth.session-token=${token}` } : {};

      const [metricasRes, pendientesRes, userStored] = await Promise.all([
        fetch(`${API_URL}/api/metricas`, { headers }).then(r => r.json()).catch(() => null),
        fetch(`${API_URL}/api/registros?status=pre_aprobado&limit=4`, { headers }).then(r => r.json()).catch(() => null),
        getStoredUser(),
      ]);

      setUser(userStored);
      if (pendientesRes?.success) setPendientes(pendientesRes.data ?? []);
      if (metricasRes?.success) {
        const d = metricasRes.data;
        const prod = d.hhTotales > 0 ? Math.round((d.hhCampo / d.hhTotales) * 100) : 0;
        setKpis({
          pendientes: d.pendientes ?? 0,
          aprobados: d.aprobados ?? 0,
          rechazados: d.rechazados ?? 0,
          hhTotales: Math.round(d.hhTotales * 10) / 10,
          kmTotales: Math.round(d.kmTotales),
          productividad: prod,
        });
      }
    } catch {}
    finally { setLoading(false); }
  }

  // Recarga cada vez que la pantalla toma el foco
  useFocusEffect(useCallback(() => { loadData(); }, []));

  async function handleLogout() {
    await logout();
    router.replace('/(auth)/login');
  }

  return (
    <View style={s.container}>
      <View style={s.header}>
        <View>
          <Text style={s.headerTitle}>Dashboard</Text>
          <Text style={s.headerSub}>{user?.name}</Text>
        </View>
        <TouchableOpacity onPress={handleLogout} style={s.logoutBtn}>
          <Text style={s.logoutText}>Salir</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={s.center}>
          <ActivityIndicator color="#1d6fb8" size="large" />
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
          <View style={s.kpiRow}>
            <KPI label="Pendientes" value={kpis.pendientes} color="#9e6a03" />
            <KPI label="Aprobados" value={kpis.aprobados} color="#238636" />
            <KPI label="Rechazados" value={kpis.rechazados} color="#da3633" />
          </View>
          <View style={s.kpiRow}>
            <KPI label="HH Totales" value={kpis.hhTotales} unit="h" color="#1d6fb8" />
            <KPI label="KM Totales" value={kpis.kmTotales} unit="km" color="#8b949e" />
            <KPI label="Productividad" value={kpis.productividad} unit="%" color="#1d6fb8" />
          </View>

          <View style={s.section}>
            <View style={s.sectionHeader}>
              <Text style={s.sectionTitle}>Pendientes</Text>
              <TouchableOpacity onPress={() => router.push('/(auditor)/aprobaciones' as any)}>
                <Text style={s.linkText}>Ver todos →</Text>
              </TouchableOpacity>
            </View>
            {pendientes.length === 0 ? (
              <View style={{ padding: 20, alignItems: 'center' }}>
                <Text style={{ color: '#8b949e', fontSize: 13 }}>No hay registros pendientes</Text>
              </View>
            ) : (
              pendientes.map((r: any) => (
                <TouchableOpacity
                  key={r._id}
                  style={s.registroItem}
                  onPress={() => router.push(`/(auditor)/aprobacion/${r._id}` as any)}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={s.registroTitle} numberOfLines={1}>
                      {r.proyectoNombre || r.tipoProyecto || '—'}{r.clienteNombre ? ` — ${r.clienteNombre}` : ''}
                    </Text>
                    <Text style={s.registroSub}>
                      {r.fecha ? r.fecha.slice(0, 10) : '—'} · {r.encargadoNombre || '—'}
                    </Text>
                  </View>
                  <View style={[s.badge, { backgroundColor: `${STATUS_COLOR[r.status] ?? '#8b949e'}20` }]}>
                    <Text style={[s.badgeText, { color: STATUS_COLOR[r.status] ?? '#8b949e' }]}>
                      {STATUS_LABEL[r.status] ?? r.status}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </View>
        </ScrollView>
      )}

      <View style={[s.bottomNav, { paddingBottom: Math.max(insets.bottom, 12) }]}>
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
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
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
  bottomNav: { flexDirection: 'row', backgroundColor: '#080b0f', borderTopWidth: 1, borderTopColor: '#21262d' },
  navItem: { flex: 1, alignItems: 'center', paddingVertical: 12 },
  navLabel: { color: '#8b949e', fontSize: 11, fontWeight: '500' },
});

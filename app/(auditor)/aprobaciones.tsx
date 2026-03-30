import { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { API_URL } from '../../lib/api';

const STATUS_COLOR: Record<string, string> = { pre_aprobado: '#9e6a03', aprobado: '#238636', rechazado: '#da3633' };
const STATUS_LABEL: Record<string, string> = { pre_aprobado: 'Pendiente', aprobado: 'Aprobado', rechazado: 'Rechazado' };

export default function AprobacionesScreen() {
  const [pendientes, setPendientes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function loadPendientes(isRefresh = false) {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    try {
      const token = await SecureStore.getItemAsync('elite_token');
      const headers = token ? { Cookie: `next-auth.session-token=${token}` } : {};
      const res = await fetch(`${API_URL}/api/registros?status=pre_aprobado`, { headers });
      const json = await res.json();
      if (json.success) setPendientes(json.data ?? []);
    } catch {}
    finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  // Recarga al volver a esta pantalla (después de aprobar/rechazar)
  useFocusEffect(useCallback(() => { loadPendientes(); }, []));

  return (
    <View style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={s.back}>← Volver</Text>
        </TouchableOpacity>
        <Text style={s.title}>Aprobaciones</Text>
        <View style={{ width: 60 }} />
      </View>

      {loading ? (
        <View style={s.center}>
          <ActivityIndicator color="#1d6fb8" size="large" />
        </View>
      ) : (
        <>
          <Text style={s.count}>{pendientes.length} pendiente{pendientes.length !== 1 ? 's' : ''}</Text>
          <ScrollView
            contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadPendientes(true)} tintColor="#1d6fb8" />}
          >
            {pendientes.length === 0 ? (
              <View style={s.empty}>
                <Text style={s.emptyTitle}>Todo al día ✓</Text>
                <Text style={s.emptySub}>No hay registros pendientes de aprobación</Text>
              </View>
            ) : (
              pendientes.map((r: any) => (
                <TouchableOpacity
                  key={r._id}
                  style={s.item}
                  onPress={() => router.push(`/(auditor)/aprobacion/${r._id}` as any)}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={s.itemTitle} numberOfLines={1}>
                      {r.proyectoNombre || '—'}{r.clienteNombre ? ` — ${r.clienteNombre}` : ''}
                    </Text>
                    <Text style={s.itemSub}>
                      {r.fecha ? r.fecha.slice(0, 10) : '—'} · {r.tipoProyecto || r.estadoActividad || '—'}
                    </Text>
                    <Text style={s.itemSub}>
                      {r.encargadoNombre ? `Enc: ${r.encargadoNombre}` : ''}
                      {r.horasTotalesDec ? ` · ${r.horasTotalesDec}h` : ''}
                    </Text>
                  </View>
                  <View style={[s.badge, { backgroundColor: `${STATUS_COLOR[r.status] ?? '#8b949e'}25` }]}>
                    <Text style={[s.badgeText, { color: STATUS_COLOR[r.status] ?? '#8b949e' }]}>
                      {STATUS_LABEL[r.status] ?? r.status}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        </>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f1117' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 56, backgroundColor: '#080b0f', borderBottomWidth: 1, borderBottomColor: '#21262d' },
  back: { color: '#1d6fb8', fontSize: 15, width: 60 },
  title: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  count: { color: '#8b949e', fontSize: 13, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4 },
  item: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#161b22', borderRadius: 12, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: '#21262d' },
  itemTitle: { color: 'white', fontSize: 14, fontWeight: '600', marginBottom: 4 },
  itemSub: { color: '#8b949e', fontSize: 12, marginBottom: 2 },
  badge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, marginLeft: 8 },
  badgeText: { fontSize: 11, fontWeight: '600' },
  empty: { backgroundColor: '#161b22', borderRadius: 12, padding: 40, alignItems: 'center', borderWidth: 1, borderColor: '#21262d' },
  emptyTitle: { color: 'white', fontSize: 16, fontWeight: '600' },
  emptySub: { color: '#8b949e', fontSize: 13, marginTop: 4, textAlign: 'center' },
});

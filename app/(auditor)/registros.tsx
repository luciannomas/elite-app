import { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { API_URL } from '../../lib/api';

const STATUS_COLOR: Record<string, string> = { pre_aprobado: '#9e6a03', aprobado: '#238636', rechazado: '#da3633' };
const STATUS_LABEL: Record<string, string> = { pre_aprobado: 'Pendiente', aprobado: 'Aprobado', rechazado: 'Rechazado' };

const FILTERS = ['todos', 'pre_aprobado', 'aprobado', 'rechazado'] as const;
const FILTER_LABEL: Record<string, string> = { todos: 'Todos', pre_aprobado: 'Pendientes', aprobado: 'Aprobados', rechazado: 'Rechazados' };

export default function RegistrosScreen() {
  const [filter, setFilter] = useState<string>('todos');
  const [registros, setRegistros] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function loadRegistros(isRefresh = false) {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    try {
      const token = await SecureStore.getItemAsync('elite_token');
      const headers = token ? { Cookie: `next-auth.session-token=${token}` } : {};
      const url = filter !== 'todos'
        ? `${API_URL}/api/registros?status=${filter}`
        : `${API_URL}/api/registros`;
      const res = await fetch(url, { headers });
      const json = await res.json();
      if (json.success) setRegistros(json.data ?? []);
    } catch {}
    finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useFocusEffect(useCallback(() => { loadRegistros(); }, [filter]));

  return (
    <View style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={s.back}>← Volver</Text>
        </TouchableOpacity>
        <Text style={s.title}>Registros</Text>
        <View style={{ width: 60 }} />
      </View>

      {/* Filtros */}
      <View style={s.filterRow}>
        {FILTERS.map(f => (
          <TouchableOpacity
            key={f}
            style={[s.filterTab, filter === f && s.filterTabActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[s.filterText, filter === f && s.filterTextActive]}>
              {FILTER_LABEL[f]}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={s.center}>
          <ActivityIndicator color="#1d6fb8" size="large" />
        </View>
      ) : (
        <>
          <Text style={s.count}>{registros.length} registro{registros.length !== 1 ? 's' : ''}</Text>
          <ScrollView
            contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadRegistros(true)} tintColor="#1d6fb8" />}
          >
            {registros.length === 0 ? (
              <View style={s.empty}>
                <Text style={s.emptyTitle}>Sin resultados</Text>
                <Text style={s.emptySub}>No hay registros con este estado</Text>
              </View>
            ) : (
              registros.map((r: any) => {
                const statusColor = STATUS_COLOR[r.status] ?? '#8b949e';
                return (
                  <TouchableOpacity
                    key={r._id}
                    style={s.item}
                    onPress={() => router.push(`/(auditor)/aprobacion/${r._id}` as any)}
                    activeOpacity={0.7}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={s.itemTitle} numberOfLines={1}>
                        {r.proyectoNombre || r.trabajoRealizadoEn === 'taller' ? (r.proyectoNombre || 'Taller') : '—'}
                        {r.clienteNombre ? ` — ${r.clienteNombre}` : ''}
                      </Text>
                      <Text style={s.itemSub}>
                        {r.fecha ? r.fecha.slice(0, 10) : '—'} · {r.tipoProyecto || r.estadoActividad || '—'}
                      </Text>
                      <Text style={s.itemSub}>
                        {r.encargadoNombre ? `Enc: ${r.encargadoNombre}` : ''}
                        {r.horasTotalesDec ? ` · ${r.horasTotalesDec}h` : ''}
                        {r.kmRecorridos ? ` · ${r.kmRecorridos} km` : ''}
                      </Text>
                    </View>
                    <View style={{ alignItems: 'flex-end', gap: 6 }}>
                      <View style={[s.badge, { backgroundColor: `${statusColor}25` }]}>
                        <Text style={[s.badgeText, { color: statusColor }]}>
                          {STATUS_LABEL[r.status] ?? r.status}
                        </Text>
                      </View>
                      <Text style={s.arrow}>›</Text>
                    </View>
                  </TouchableOpacity>
                );
              })
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
  filterRow: { flexDirection: 'row', backgroundColor: '#080b0f', borderBottomWidth: 1, borderBottomColor: '#21262d' },
  filterTab: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  filterTabActive: { borderBottomWidth: 2, borderBottomColor: '#1d6fb8' },
  filterText: { color: '#8b949e', fontSize: 12, fontWeight: '500' },
  filterTextActive: { color: '#1d6fb8', fontWeight: '700' },
  count: { color: '#8b949e', fontSize: 13, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4 },
  item: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#161b22', borderRadius: 12, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: '#21262d' },
  itemTitle: { color: 'white', fontSize: 14, fontWeight: '600', marginBottom: 4 },
  itemSub: { color: '#8b949e', fontSize: 12, marginBottom: 2 },
  badge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  badgeText: { fontSize: 11, fontWeight: '600' },
  arrow: { color: '#8b949e', fontSize: 20, marginLeft: 4 },
  empty: { backgroundColor: '#161b22', borderRadius: 12, padding: 40, alignItems: 'center', borderWidth: 1, borderColor: '#21262d' },
  emptyTitle: { color: 'white', fontSize: 16, fontWeight: '600' },
  emptySub: { color: '#8b949e', fontSize: 13, marginTop: 4 },
});

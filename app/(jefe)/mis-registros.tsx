import { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { mockRegistros } from '../../lib/mock-data';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STATUS_COLOR: Record<string, string> = { pre_aprobado: '#9e6a03', aprobado: '#238636', rechazado: '#da3633' };
const STATUS_LABEL: Record<string, string> = { pre_aprobado: 'Pendiente', aprobado: 'Aprobado', rechazado: 'Rechazado' };

const FILTERS = ['todos', 'pre_aprobado', 'aprobado', 'rechazado'] as const;
const FILTER_LABEL: Record<string, string> = { todos: 'Todos', pre_aprobado: 'Pendientes', aprobado: 'Aprobados', rechazado: 'Rechazados' };

export default function MisRegistrosScreen() {
  const [filter, setFilter] = useState<string>('todos');
  const [registros, setRegistros] = useState<any[]>([]);

  useEffect(() => {
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

  const filtered = filter === 'todos' ? registros : registros.filter(r => r.status === filter);

  return (
    <View style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={s.back}>← Volver</Text>
        </TouchableOpacity>
        <Text style={s.title}>Mis Registros</Text>
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

      <Text style={s.count}>{filtered.length} registro{filtered.length !== 1 ? 's' : ''}</Text>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        {filtered.length === 0 ? (
          <View style={s.empty}>
            <Text style={s.emptyTitle}>Sin registros</Text>
            <Text style={s.emptySub}>No hay jornadas con este estado</Text>
          </View>
        ) : (
          filtered.map(r => (
            <View key={r._id} style={s.item}>
              <View style={{ flex: 1 }}>
                <Text style={s.itemTitle} numberOfLines={1}>{r.proyectoNombre} — {r.clienteNombre}</Text>
                <Text style={s.itemSub}>{r.fecha} · {r.tipoProyecto}</Text>
                <Text style={s.itemSub}>{r.horasTotalesDec}h · {r.kmRecorridos} km</Text>
              </View>
              <View style={[s.badge, { backgroundColor: `${STATUS_COLOR[r.status]}20` }]}>
                <Text style={[s.badgeText, { color: STATUS_COLOR[r.status] }]}>{STATUS_LABEL[r.status]}</Text>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f1117' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 56, backgroundColor: '#080b0f', borderBottomWidth: 1, borderBottomColor: '#21262d' },
  back: { color: '#1d6fb8', fontSize: 15, width: 60 },
  title: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  filterRow: { flexDirection: 'row', backgroundColor: '#080b0f', borderBottomWidth: 1, borderBottomColor: '#21262d' },
  filterTab: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  filterTabActive: { borderBottomWidth: 2, borderBottomColor: '#1d6fb8' },
  filterText: { color: '#8b949e', fontSize: 12, fontWeight: '500' },
  filterTextActive: { color: '#1d6fb8', fontWeight: '700' },
  count: { color: '#8b949e', fontSize: 13, paddingHorizontal: 16, paddingTop: 12 },
  item: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#161b22', borderRadius: 12, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: '#21262d' },
  itemTitle: { color: 'white', fontSize: 14, fontWeight: '600', marginBottom: 4 },
  itemSub: { color: '#8b949e', fontSize: 12 },
  badge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, marginLeft: 8 },
  badgeText: { fontSize: 11, fontWeight: '600' },
  empty: { backgroundColor: '#161b22', borderRadius: 12, padding: 40, alignItems: 'center', borderWidth: 1, borderColor: '#21262d' },
  emptyTitle: { color: 'white', fontSize: 16, fontWeight: '600' },
  emptySub: { color: '#8b949e', fontSize: 13, marginTop: 4 },
});

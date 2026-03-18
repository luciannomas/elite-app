import { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { mockRegistros } from '../../lib/mock-data';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STATUS_COLOR: Record<string, string> = { pre_aprobado: '#9e6a03', aprobado: '#238636', rechazado: '#da3633' };
const STATUS_LABEL: Record<string, string> = { pre_aprobado: 'Pendiente', aprobado: 'Aprobado', rechazado: 'Rechazado' };

export default function AprobacionesScreen() {
  const [pendientes, setPendientes] = useState<any[]>([]);

  useEffect(() => {
    loadPendientes();
  }, []);

  async function loadPendientes() {
    const raw = await AsyncStorage.getItem('elite_mock_status');
    const stored: Record<string, any> = raw ? JSON.parse(raw) : {};
    const data = mockRegistros.filter(r => r.status === 'pre_aprobado' && !stored[r._id]);
    setPendientes(data);
  }

  return (
    <View style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={s.back}>← Volver</Text>
        </TouchableOpacity>
        <Text style={s.title}>Aprobaciones</Text>
        <View style={{ width: 60 }} />
      </View>

      <Text style={s.count}>{pendientes.length} pendiente{pendientes.length !== 1 ? 's' : ''}</Text>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        {pendientes.length === 0 ? (
          <View style={s.empty}>
            <Text style={s.emptyTitle}>Todo al día ✓</Text>
            <Text style={s.emptySub}>No hay registros pendientes</Text>
          </View>
        ) : (
          pendientes.map(r => (
            <TouchableOpacity
              key={r._id}
              style={s.item}
              onPress={() => router.push(`/(auditor)/aprobacion/${r._id}` as any)}
            >
              <View style={{ flex: 1 }}>
                <Text style={s.itemTitle} numberOfLines={1}>{r.proyectoNombre} — {r.clienteNombre}</Text>
                <Text style={s.itemSub}>{r.fecha} · {r.tipoProyecto} · Enc: {r.encargadoNombre}</Text>
                <Text style={s.itemSub}>{r.horasTotalesDec}h · {r.kmRecorridos} km</Text>
              </View>
              <View style={[s.badge, { backgroundColor: `${STATUS_COLOR[r.status]}20` }]}>
                <Text style={[s.badgeText, { color: STATUS_COLOR[r.status] }]}>{STATUS_LABEL[r.status]}</Text>
              </View>
            </TouchableOpacity>
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

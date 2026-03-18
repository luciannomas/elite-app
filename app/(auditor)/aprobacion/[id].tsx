import { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, StyleSheet, Alert } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { mockRegistros } from '../../../lib/mock-data';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STATUS_COLOR: Record<string, string> = { pre_aprobado: '#9e6a03', aprobado: '#238636', rechazado: '#da3633' };
const STATUS_LABEL: Record<string, string> = { pre_aprobado: 'Pendiente', aprobado: 'Aprobado', rechazado: 'Rechazado' };

function Row({ label, value }: { label: string; value?: string | number }) {
  if (!value && value !== 0) return null;
  return (
    <View style={s.row}>
      <Text style={s.rowLabel}>{label}</Text>
      <Text style={s.rowValue}>{value}</Text>
    </View>
  );
}

export default function AprobacionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [registro, setRegistro] = useState<any>(null);
  const [motivo, setMotivo] = useState('');
  const [acting, setActing] = useState<'aprobar' | 'rechazar' | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    loadRegistro();
  }, [id]);

  async function loadRegistro() {
    const base = mockRegistros.find(r => r._id === id);
    if (!base) { router.back(); return; }

    const raw = await AsyncStorage.getItem('elite_mock_status');
    const stored: Record<string, any> = raw ? JSON.parse(raw) : {};
    const override = stored[id as string];

    setRegistro(override ? { ...base, status: override.status, rechazadoMotivo: override.motivo } : base);
  }

  async function handleAction(action: 'aprobar' | 'rechazar') {
    if (action === 'rechazar' && !motivo.trim()) {
      Alert.alert('Motivo requerido', 'Ingresá el motivo del rechazo');
      return;
    }
    setActing(action);
    try {
      const newStatus = action === 'aprobar' ? 'aprobado' : 'rechazado';

      // Persist in AsyncStorage
      const raw = await AsyncStorage.getItem('elite_mock_status');
      const stored: Record<string, any> = raw ? JSON.parse(raw) : {};
      stored[id as string] = { status: newStatus, motivo: motivo || undefined, at: new Date().toISOString() };
      await AsyncStorage.setItem('elite_mock_status', JSON.stringify(stored));

      setRegistro((prev: any) => prev ? { ...prev, status: newStatus, rechazadoMotivo: motivo || undefined } : null);
      setDone(true);
      setTimeout(() => router.push('/(auditor)/aprobaciones' as any), 1500);
    } catch (e) {
      Alert.alert('Error', 'No se pudo procesar la acción');
    } finally {
      setActing(null);
    }
  }

  if (!registro) {
    return (
      <View style={s.center}>
        <ActivityIndicator color="#1d6fb8" />
      </View>
    );
  }

  const isPending = registro.status === 'pre_aprobado';
  const statusColor = STATUS_COLOR[registro.status];

  return (
    <View style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={s.back}>← Volver</Text>
        </TouchableOpacity>
        <Text style={s.title}>Detalle</Text>
        <View style={[s.badge, { backgroundColor: `${statusColor}20` }]}>
          <Text style={[s.badgeText, { color: statusColor }]}>{STATUS_LABEL[registro.status]}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        {/* Proyecto */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Proyecto</Text>
          <Row label="Proyecto" value={registro.proyectoNombre} />
          <Row label="Cliente" value={registro.clienteNombre} />
          <Row label="Tipo" value={registro.tipoProyecto} />
          <Row label="Fecha" value={registro.fecha} />
          <Row label="Lugar" value={registro.trabajoRealizadoEn} />
        </View>

        {/* Personal */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Personal</Text>
          <Row label="Encargado" value={registro.encargadoNombre} />
        </View>

        {/* Tiempos */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Tiempos</Text>
          <Row label="HH Totales" value={`${registro.horasTotalesDec}h`} />
          <Row label="KM Recorridos" value={`${registro.kmRecorridos} km`} />
        </View>

        {/* Motivo rechazo si aplica */}
        {registro.status === 'rechazado' && registro.rechazadoMotivo && (
          <View style={[s.card, { borderColor: '#da363340' }]}>
            <Text style={[s.cardTitle, { color: '#da3633' }]}>Motivo de rechazo</Text>
            <Text style={s.motivoText}>{registro.rechazadoMotivo}</Text>
          </View>
        )}

        {/* Acciones */}
        {isPending && !done && (
          <View style={s.actionsCard}>
            <Text style={s.actionsTitle}>Acción</Text>
            <Text style={s.inputLabel}>Motivo de rechazo (opcional si aprueba)</Text>
            <TextInput
              style={s.input}
              value={motivo}
              onChangeText={setMotivo}
              placeholder="Ej: Falta documentación, horas incorrectas..."
              placeholderTextColor="#484f58"
              multiline
              numberOfLines={3}
            />
            <View style={s.btnRow}>
              <TouchableOpacity
                style={[s.btnReject, acting === 'rechazar' && s.btnDisabled]}
                onPress={() => handleAction('rechazar')}
                disabled={acting !== null}
              >
                {acting === 'rechazar'
                  ? <ActivityIndicator color="#da3633" size="small" />
                  : <Text style={s.btnRejectText}>Rechazar</Text>}
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.btnApprove, acting === 'aprobar' && s.btnDisabled]}
                onPress={() => handleAction('aprobar')}
                disabled={acting !== null}
              >
                {acting === 'aprobar'
                  ? <ActivityIndicator color="white" size="small" />
                  : <Text style={s.btnApproveText}>Aprobar</Text>}
              </TouchableOpacity>
            </View>
          </View>
        )}

        {done && (
          <View style={s.successCard}>
            <Text style={s.successText}>
              {registro.status === 'aprobado' ? '✓ Registro aprobado' : '✗ Registro rechazado'}
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f1117' },
  center: { flex: 1, backgroundColor: '#0f1117', justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 56, backgroundColor: '#080b0f', borderBottomWidth: 1, borderBottomColor: '#21262d' },
  back: { color: '#1d6fb8', fontSize: 15, width: 60 },
  title: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  badge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  badgeText: { fontSize: 11, fontWeight: '600' },
  card: { backgroundColor: '#161b22', borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#21262d' },
  cardTitle: { color: '#8b949e', fontSize: 12, fontWeight: '600', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#21262d' },
  rowLabel: { color: '#8b949e', fontSize: 13 },
  rowValue: { color: 'white', fontSize: 13, fontWeight: '500', flex: 1, textAlign: 'right' },
  motivoText: { color: '#f85149', fontSize: 14 },
  actionsCard: { backgroundColor: '#161b22', borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#21262d' },
  actionsTitle: { color: 'white', fontWeight: '600', fontSize: 15, marginBottom: 12 },
  inputLabel: { color: '#8b949e', fontSize: 12, marginBottom: 6 },
  input: { backgroundColor: '#0f1117', borderWidth: 1, borderColor: '#30363d', borderRadius: 10, padding: 12, color: 'white', fontSize: 14, minHeight: 80, textAlignVertical: 'top' },
  btnRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
  btnReject: { flex: 1, borderWidth: 1, borderColor: '#da3633', borderRadius: 10, padding: 14, alignItems: 'center' },
  btnRejectText: { color: '#da3633', fontWeight: '700', fontSize: 15 },
  btnApprove: { flex: 1, backgroundColor: '#238636', borderRadius: 10, padding: 14, alignItems: 'center' },
  btnApproveText: { color: 'white', fontWeight: '700', fontSize: 15 },
  btnDisabled: { opacity: 0.6 },
  successCard: { backgroundColor: '#238636' + '20', borderRadius: 12, padding: 20, alignItems: 'center', borderWidth: 1, borderColor: '#238636' + '40' },
  successText: { color: '#238636', fontSize: 16, fontWeight: '700' },
});

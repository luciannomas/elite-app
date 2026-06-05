import { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, StyleSheet, Alert } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { API_URL, getToken } from '../../../lib/api';

const STATUS_COLOR: Record<string, string> = { pre_aprobado: '#9e6a03', aprobado: '#238636', rechazado: '#da3633' };
const STATUS_LABEL: Record<string, string> = { pre_aprobado: 'Pendiente', aprobado: 'Aprobado', rechazado: 'Rechazado' };

function Row({ label, value }: { label: string; value?: string | number | null }) {
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
  const [loading, setLoading] = useState(true);
  const [motivo, setMotivo] = useState('');
  const [acting, setActing] = useState<'aprobar' | 'rechazar' | 'revertir' | null>(null);

  useEffect(() => {
    loadRegistro();
  }, [id]);

  async function getHeaders() {
    const token = await getToken();
    return token ? { Cookie: `next-auth.session-token=${token}` } : {};
  }

  async function loadRegistro() {
    setLoading(true);
    try {
      const headers = await getHeaders();
      const res = await fetch(`${API_URL}/api/registros/${id}`, { headers });
      const json = await res.json();
      if (json.success) setRegistro(json.data);
      else router.back();
    } catch {
      Alert.alert('Error', 'No se pudo cargar el registro');
      router.back();
    } finally {
      setLoading(false);
    }
  }

  async function handleAction(action: 'aprobar' | 'rechazar' | 'revertir') {
    if (action === 'rechazar' && !motivo.trim()) {
      Alert.alert('Motivo requerido', 'Ingresá el motivo del rechazo');
      return;
    }
    setActing(action);
    try {
      const headers = await getHeaders();
      const res = await fetch(`${API_URL}/api/registros/${id}/aprobar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify({ action, motivo }),
      });
      const json = await res.json();
      if (json.success) {
        const newStatus = action === 'aprobar' ? 'aprobado' : action === 'rechazar' ? 'rechazado' : 'pre_aprobado';
        setRegistro((prev: any) => prev ? {
          ...prev,
          status: newStatus,
          rechazadoMotivo: action === 'rechazar' ? motivo : null,
          approvedAt: action === 'aprobar' ? new Date().toISOString() : null,
        } : null);
        setMotivo('');
        const msgs: Record<string, string> = {
          aprobar: '✓ Registro aprobado',
          rechazar: '✗ Registro rechazado',
          revertir: 'Revertido a pendiente',
        };
        Alert.alert('Listo', msgs[action], action !== 'revertir'
          ? [{ text: 'OK', onPress: () => router.replace('/(auditor)/aprobaciones' as any) }]
          : [{ text: 'OK' }]
        );
      } else {
        Alert.alert('Error', json.error || 'No se pudo procesar');
      }
    } catch {
      Alert.alert('Error', 'No se pudo procesar la acción');
    } finally {
      setActing(null);
    }
  }

  if (loading) {
    return (
      <View style={s.center}>
        <ActivityIndicator color="#1d6fb8" size="large" />
      </View>
    );
  }

  if (!registro) return null;

  const statusColor = STATUS_COLOR[registro.status] ?? '#8b949e';
  const personalList: string[] = registro.personalACargo
    ? registro.personalACargo.split(',').map((p: string) => p.trim()).filter(Boolean)
    : [];

  return (
    <View style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={{ width: 60 }}>
          <Text style={s.back}>← Volver</Text>
        </TouchableOpacity>
        <Text style={s.title} numberOfLines={1}>Detalle</Text>
        <TouchableOpacity
          onPress={() => router.replace('/(auditor)/dashboard' as any)}
          style={s.homeBtn}
        >
          <Text style={s.homeBtnText}>Inicio</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>

        {/* Proyecto */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Proyecto</Text>
          <Row label="Proyecto" value={registro.proyectoNombre} />
          <Row label="Cliente" value={registro.clienteNombre} />
          <Row label="Tipo" value={registro.tipoProyecto} />
          <Row label="Fecha" value={registro.fecha ? registro.fecha.slice(0, 10) : undefined} />
          <Row label="Lugar" value={registro.trabajoRealizadoEn === 'campo' ? 'Campo' : 'Taller'} />
          <Row label="Estado actividad" value={registro.estadoActividad} />
          <Row label="OV Odoo" value={registro.ovOdoo} />
        </View>

        {/* Descripción de tareas */}
        {registro.tareaTexto ? (
          <View style={s.card}>
            <Text style={s.cardTitle}>Tareas realizadas</Text>
            <Text style={s.tareaText}>{registro.tareaTexto}</Text>
          </View>
        ) : null}

        {/* Personal */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Personal</Text>
          <Row label="Encargado" value={registro.encargadoNombre} />
          {personalList.length > 0 && (
            <View style={{ marginTop: 10 }}>
              <Text style={s.rowLabel}>Personal a cargo</Text>
              <View style={s.chipWrap}>
                {personalList.map(nombre => (
                  <View key={nombre} style={s.chip}>
                    <Text style={s.chipText}>{nombre}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
          <Row label="Nº personas" value={registro.nPersonas} />
        </View>

        {/* Vehículo y KM */}
        {(registro.vehiculoPatente || registro.kmRecorridos) ? (
          <View style={s.card}>
            <Text style={s.cardTitle}>Vehículo</Text>
            <Row label="Patente" value={registro.vehiculoPatente} />
            <Row label="KM inicial" value={registro.kmInicial} />
            <Row label="KM final" value={registro.kmFinal} />
            <Row label="KM recorridos" value={registro.kmRecorridos ? `${registro.kmRecorridos} km` : undefined} />
          </View>
        ) : null}

        {/* Tiempos */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Tiempos</Text>
          <Row label="Inicio (salida)" value={registro.horaInicio} />
          <Row label="Llegada campo" value={registro.horaInicioField} />
          <Row label="Salida campo" value={registro.horaFinField} />
          <Row label="Fin (llegada)" value={registro.horaFin} />
          <Row label="HH Totales" value={registro.horasTotalesDec ? `${registro.horasTotalesDec}h` : undefined} />
          <Row label="HH Campo" value={registro.horasSitioDec ? `${registro.horasSitioDec}h` : undefined} />
          <Row label="Hospedaje" value={registro.hospedaje} />
        </View>

        {/* Stand-by */}
        {registro.standByHoras > 0 && (
          <View style={[s.card, { borderColor: '#9e6a0340' }]}>
            <Text style={[s.cardTitle, { color: '#f0a500' }]}>Stand-By</Text>
            <Row label="Horas" value={registro.standByHoras} />
            <Row label="Categoría" value={registro.standByCategoria} />
            <Row label="Detalle" value={registro.standByDetalle} />
          </View>
        )}

        {/* Observaciones */}
        {registro.observaciones ? (
          <View style={s.card}>
            <Text style={s.cardTitle}>Observaciones</Text>
            <Text style={s.tareaText}>{registro.observaciones}</Text>
          </View>
        ) : null}

        {/* Motivo de rechazo actual */}
        {registro.status === 'rechazado' && registro.rechazadoMotivo && (
          <View style={[s.card, { borderColor: '#da363340' }]}>
            <Text style={[s.cardTitle, { color: '#da3633' }]}>Motivo de rechazo</Text>
            <Text style={{ color: '#f85149', fontSize: 14 }}>{registro.rechazadoMotivo}</Text>
          </View>
        )}

        {/* Acciones */}
        <View style={s.actionsCard}>
          <Text style={s.actionsTitle}>Acción de revisión</Text>

          {/* Aprobar — si no está aprobado */}
          {registro.status !== 'aprobado' && (
            <TouchableOpacity
              style={[s.btnApprove, acting !== null && s.btnDisabled]}
              onPress={() => handleAction('aprobar')}
              disabled={acting !== null}
            >
              {acting === 'aprobar'
                ? <ActivityIndicator color="white" size="small" />
                : <Text style={s.btnApproveText}>Aprobar registro</Text>}
            </TouchableOpacity>
          )}

          {/* Rechazar — si no está rechazado */}
          {registro.status !== 'rechazado' && (
            <View style={{ marginTop: 12 }}>
              <Text style={s.inputLabel}>Motivo de rechazo</Text>
              <TextInput
                style={s.input}
                value={motivo}
                onChangeText={setMotivo}
                placeholder="Ej: Falta documentación, horas incorrectas..."
                placeholderTextColor="#484f58"
                multiline
                numberOfLines={3}
              />
              <TouchableOpacity
                style={[s.btnReject, acting !== null && s.btnDisabled, { marginTop: 8 }]}
                onPress={() => handleAction('rechazar')}
                disabled={acting !== null}
              >
                {acting === 'rechazar'
                  ? <ActivityIndicator color="#da3633" size="small" />
                  : <Text style={s.btnRejectText}>Rechazar registro</Text>}
              </TouchableOpacity>
            </View>
          )}

          {/* Revertir — si ya fue procesado */}
          {registro.status !== 'pre_aprobado' && (
            <TouchableOpacity
              style={[s.btnRevert, acting !== null && s.btnDisabled, { marginTop: 12 }]}
              onPress={() => handleAction('revertir')}
              disabled={acting !== null}
            >
              {acting === 'revertir'
                ? <ActivityIndicator color="#8b949e" size="small" />
                : <Text style={s.btnRevertText}>↩ Revertir a pendiente</Text>}
            </TouchableOpacity>
          )}
        </View>

      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f1117' },
  center: { flex: 1, backgroundColor: '#0f1117', justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 56, backgroundColor: '#080b0f', borderBottomWidth: 1, borderBottomColor: '#21262d' },
  back: { color: '#1d6fb8', fontSize: 15 },
  title: { color: 'white', fontSize: 18, fontWeight: 'bold', flex: 1, textAlign: 'center' },
  homeBtn: { width: 60, alignItems: 'flex-end' },
  homeBtnText: { color: '#8b949e', fontSize: 14 },
  badge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  badgeText: { fontSize: 11, fontWeight: '600' },
  card: { backgroundColor: '#161b22', borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#21262d' },
  cardTitle: { color: '#8b949e', fontSize: 12, fontWeight: '600', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#21262d' },
  rowLabel: { color: '#8b949e', fontSize: 13, flex: 1 },
  rowValue: { color: 'white', fontSize: 13, fontWeight: '500', flex: 1, textAlign: 'right' },
  tareaText: { color: 'white', fontSize: 14, lineHeight: 20 },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  chip: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, backgroundColor: '#21262d', borderWidth: 1, borderColor: '#30363d' },
  chipText: { color: '#e6edf3', fontSize: 12 },
  actionsCard: { backgroundColor: '#161b22', borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#21262d' },
  actionsTitle: { color: 'white', fontWeight: '600', fontSize: 15, marginBottom: 12 },
  inputLabel: { color: '#8b949e', fontSize: 12, marginBottom: 6 },
  input: { backgroundColor: '#0f1117', borderWidth: 1, borderColor: '#30363d', borderRadius: 10, padding: 12, color: 'white', fontSize: 14, minHeight: 80, textAlignVertical: 'top' },
  btnApprove: { backgroundColor: '#238636', borderRadius: 10, padding: 14, alignItems: 'center' },
  btnApproveText: { color: 'white', fontWeight: '700', fontSize: 15 },
  btnReject: { borderWidth: 1, borderColor: '#da3633', borderRadius: 10, padding: 14, alignItems: 'center', backgroundColor: 'rgba(218,54,51,0.08)' },
  btnRejectText: { color: '#da3633', fontWeight: '700', fontSize: 15 },
  btnRevert: { borderWidth: 1, borderColor: '#30363d', borderRadius: 10, padding: 12, alignItems: 'center', backgroundColor: 'rgba(139,148,158,0.08)' },
  btnRevertText: { color: '#8b949e', fontWeight: '600', fontSize: 14 },
  btnDisabled: { opacity: 0.5 },
});

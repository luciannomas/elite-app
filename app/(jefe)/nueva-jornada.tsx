import { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { API_URL } from '../../lib/api';
import type { User } from '../../lib/auth';

type CatalogData = {
  clientes: { _id: string; nombre: string }[];
  proyectos: { _id: string; nombre: string; clienteNombre: string }[];
  personal: { _id: string; nombre: string }[];
  vehiculos: { _id: string; patente: string }[];
  tiposProyecto: string[];
  categoriasStandBy: string[];
};

interface FormData {
  fecha: string;
  campo: boolean;
  cliente: string;
  tipoProyecto: string;
  proyectoNombre: string;
  descripcion: string;
  encargado: string;
  personalACargo: string[];
  vehiculo: string;
  kmInicial: string;
  kmFinal: string;
  horaInicio: string;
  horaInicioField: string;
  horaFinField: string;
  horaFin: string;
  hospedaje: string;
  observaciones: string;
}

function today() {
  return new Date().toISOString().split('T')[0];
}

function calcHoras(inicio: string, fin: string): string {
  if (!inicio || !fin) return '';
  const [h1, m1] = inicio.split(':').map(Number);
  const [h2, m2] = fin.split(':').map(Number);
  const diff = (h2 * 60 + m2 - (h1 * 60 + m1)) / 60;
  return diff > 0 ? diff.toFixed(1) : '';
}

function StepDot({ n, current, total }: { n: number; current: number; total: number }) {
  const done = n < current;
  const active = n === current;
  return (
    <View style={[dot.base, done && dot.done, active && dot.active]}>
      <Text style={[dot.text, (done || active) && dot.textActive]}>{done ? '✓' : n}</Text>
    </View>
  );
}

const dot = StyleSheet.create({
  base: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#21262d', alignItems: 'center', justifyContent: 'center' },
  done: { backgroundColor: '#238636' },
  active: { backgroundColor: '#1d6fb8' },
  text: { color: '#8b949e', fontSize: 13, fontWeight: '700' },
  textActive: { color: 'white' },
});

function SelectOption({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity style={[s.option, selected && s.optionSelected]} onPress={onPress}>
      <Text style={[s.optionText, selected && s.optionTextSelected]}>{label}</Text>
    </TouchableOpacity>
  );
}

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <Text style={s.fieldError}>{msg}</Text>;
}

export default function NuevaJornadaScreen() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [catalog, setCatalog] = useState<CatalogData | null>(null);
  const [kmLoading, setKmLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [form, setForm] = useState<FormData>({
    fecha: today(),
    campo: true,
    cliente: '',
    tipoProyecto: '',
    proyectoNombre: '',
    descripcion: '',
    encargado: '',
    personalACargo: [],
    vehiculo: '',
    kmInicial: '',
    kmFinal: '',
    horaInicio: '08:00',
    horaInicioField: '09:00',
    horaFinField: '18:00',
    horaFin: '19:00',
    hospedaje: '',
    observaciones: '',
  });

  const esTaller = !form.campo;
  const TOTAL_STEPS = esTaller ? 2 : 3;
  const stepLabels = esTaller ? ['Taller', 'Horarios'] : ['Jornada', 'Personal', 'Tiempos'];

  useEffect(() => {
    SecureStore.getItemAsync('elite_user').then(raw => {
      if (raw) setCurrentUser(JSON.parse(raw));
    });
    fetch(`${API_URL}/api/catalogo`)
      .then(r => r.json())
      .then(res => { if (res.success) setCatalog(res.data); })
      .catch(() => {})
      .finally(() => setCatalogLoading(false));
  }, []);

  const filteredProyectos = catalog?.proyectos.filter(p =>
    !form.cliente || p.clienteNombre === form.cliente
  ) ?? [];

  function set(key: keyof FormData, val: any) {
    setForm(prev => ({ ...prev, [key]: val }));
    setErrors(prev => { const next = { ...prev }; delete next[key]; return next; });
  }

  function switchTipo(isCampo: boolean) {
    setForm(prev => ({ ...prev, campo: isCampo }));
    setStep(1);
    setErrors({});
  }

  async function selectVehiculo(patente: string) {
    set('vehiculo', patente);
    set('kmInicial', '');
    if (!patente) return;
    setKmLoading(true);
    try {
      const token = await SecureStore.getItemAsync('elite_token');
      const res = await fetch(`${API_URL}/api/registros/ultimo-km?patente=${encodeURIComponent(patente)}`, {
        headers: token ? { Cookie: `next-auth.session-token=${token}` } : {},
      });
      const json = await res.json();
      if (json.success && json.kmFinal) set('kmInicial', String(json.kmFinal));
    } catch {}
    finally { setKmLoading(false); }
  }

  function togglePersonal(name: string) {
    setForm(prev => ({
      ...prev,
      personalACargo: prev.personalACargo.includes(name)
        ? prev.personalACargo.filter(n => n !== name)
        : [...prev.personalACargo, name],
    }));
  }

  function validateCurrentStep(): Record<string, string> {
    const errs: Record<string, string> = {};
    if (esTaller) {
      if (step === 1) {
        if (!form.tipoProyecto) errs.tipoProyecto = 'Seleccioná el tipo de tarea';
        if (!form.descripcion.trim()) errs.descripcion = 'Describí las tareas realizadas';
      }
      if (step === 2) {
        if (!form.horaInicio) errs.horaInicio = 'Ingresá la hora de entrada';
        if (!form.horaFin) errs.horaFin = 'Ingresá la hora de salida';
      }
    } else {
      if (step === 1) {
        if (!form.cliente) errs.cliente = 'Seleccioná un cliente';
        if (!form.tipoProyecto) errs.tipoProyecto = 'Seleccioná el tipo de proyecto';
        if (!form.descripcion.trim()) errs.descripcion = 'Describí las tareas realizadas';
      }
      if (step === 2) {
        if (!form.encargado) errs.encargado = 'Seleccioná el encargado de cuadrilla';
      }
      if (step === 3) {
        if (!form.horaInicio) errs.horaInicio = 'Ingresá la hora de inicio';
        if (!form.horaFin) errs.horaFin = 'Ingresá la hora de finalización';
      }
    }
    return errs;
  }

  function next() {
    const errs = validateCurrentStep();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      Alert.alert('Campos incompletos', 'Completá los campos obligatorios antes de continuar.');
      return;
    }
    setErrors({});
    setStep(s => s + 1);
  }

  async function submit() {
    const errs = validateCurrentStep();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      Alert.alert('Campos incompletos', 'Completá los campos obligatorios.');
      return;
    }
    setLoading(true);
    try {
      const token = await SecureStore.getItemAsync('elite_token');
      const responsable = currentUser?.name || currentUser?.email || '';
      const payload = {
        fecha: form.fecha,
        trabajoRealizadoEn: form.campo ? 'campo' : 'taller',
        estadoActividad: 'Productivo',
        clienteNombre: form.campo ? form.cliente : '',
        proyectoNombre: form.campo ? form.proyectoNombre : '',
        tipoProyecto: form.tipoProyecto,
        tareaTexto: form.descripcion,
        encargadoNombre: form.campo ? form.encargado : responsable,
        personalACargo: form.campo ? form.personalACargo.join(', ') : '',
        nPersonas: form.campo ? form.personalACargo.length + 1 : 1,
        vehiculoPatente: form.campo ? form.vehiculo : '',
        kmInicial: form.kmInicial ? parseFloat(form.kmInicial) : undefined,
        kmFinal: form.kmFinal ? parseFloat(form.kmFinal) : undefined,
        horaInicio: form.horaInicio,
        horaInicioField: form.campo ? form.horaInicioField : '',
        horaFinField: form.campo ? form.horaFinField : '',
        horaFin: form.horaFin,
        hospedaje: form.hospedaje,
        observaciones: form.observaciones,
      };
      const res = await fetch(`${API_URL}/api/registros`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Cookie: `next-auth.session-token=${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Error al guardar');
      Alert.alert('¡Jornada enviada!', 'El registro fue enviado para aprobación.', [
        { text: 'OK', onPress: () => router.replace('/(jefe)/dashboard') },
      ]);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'No se pudo enviar la jornada');
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => { setErrors({}); step > 1 ? setStep(step - 1) : router.back(); }}>
          <Text style={s.back}>← {step > 1 ? 'Atrás' : 'Cancelar'}</Text>
        </TouchableOpacity>
        <Text style={s.title}>Nueva Jornada</Text>
        <View style={{ width: 70 }} />
      </View>

      {/* Steps */}
      <View style={s.steps}>
        {stepLabels.map((label, i) => (
          <View key={i} style={{ alignItems: 'center', flex: 1 }}>
            <StepDot n={i + 1} current={step} total={TOTAL_STEPS} />
            <Text style={s.stepLabel}>{label}</Text>
          </View>
        ))}
        {TOTAL_STEPS > 1 && (
          <View style={[s.stepLine, { left: '16%', right: TOTAL_STEPS === 3 ? '50%' : '16%' }]} />
        )}
        {TOTAL_STEPS === 3 && (
          <View style={[s.stepLine, { left: '50%', right: '16%' }]} />
        )}
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>

        {/* ── TALLER STEP 1 ── */}
        {step === 1 && esTaller && (
          <>
            <View style={s.card}>
              <Text style={s.label}>Fecha</Text>
              <TextInput style={s.input} value={form.fecha} onChangeText={v => set('fecha', v)} placeholderTextColor="#484f58" />
            </View>

            <View style={s.card}>
              <Text style={s.label}>Tipo de trabajo</Text>
              <View style={s.toggleRow}>
                <TouchableOpacity style={[s.toggle, !esTaller && s.toggleActive]} onPress={() => switchTipo(true)}>
                  <Text style={[s.toggleText, !esTaller && s.toggleTextActive]}>Campo</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[s.toggle, esTaller && s.toggleActive]} onPress={() => switchTipo(false)}>
                  <Text style={[s.toggleText, esTaller && s.toggleTextActive]}>Taller</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={[s.card, !!errors.tipoProyecto && s.cardError]}>
              <Text style={s.label}>Tipo de tarea <Text style={s.required}>*</Text></Text>
              {catalogLoading
                ? <ActivityIndicator color="#1d6fb8" style={{ marginVertical: 8 }} />
                : <View style={s.chipWrap}>
                    {(catalog?.tiposProyecto ?? []).map(t => (
                      <SelectOption key={t} label={t} selected={form.tipoProyecto === t} onPress={() => set('tipoProyecto', t)} />
                    ))}
                  </View>
              }
              <FieldError msg={errors.tipoProyecto} />
            </View>

            <View style={[s.card, !!errors.descripcion && s.cardError]}>
              <Text style={s.label}>Descripción de la tarea <Text style={s.required}>*</Text></Text>
              <TextInput
                style={[s.input, { minHeight: 80, textAlignVertical: 'top' }, !!errors.descripcion && s.inputError]}
                value={form.descripcion}
                onChangeText={v => set('descripcion', v)}
                placeholder="Describí las tareas realizadas en el taller..."
                placeholderTextColor="#484f58"
                multiline
              />
              <FieldError msg={errors.descripcion} />
            </View>

            <View style={s.card}>
              <Text style={s.label}>Persona responsable</Text>
              <View style={[s.input, { justifyContent: 'center' }]}>
                <Text style={{ color: 'white', fontSize: 15 }}>
                  {currentUser?.name || currentUser?.email || 'Usuario actual'}
                </Text>
              </View>
              <Text style={[s.selectedNote, { marginTop: 6 }]}>Se registra automáticamente con tu usuario</Text>
            </View>
          </>
        )}

        {/* ── TALLER STEP 2 — Horarios ── */}
        {step === 2 && esTaller && (
          <>
            <View style={s.card}>
              <Text style={s.cardTitle}>Horarios</Text>
              <View style={s.timeRow}>
                <Text style={s.timeLabel}>Hora de entrada <Text style={s.required}>*</Text></Text>
                <TextInput
                  style={[s.timeInput, !!errors.horaInicio && s.inputError]}
                  value={form.horaInicio}
                  onChangeText={v => set('horaInicio', v)}
                  placeholder="HH:MM"
                  placeholderTextColor="#484f58"
                  keyboardType="numbers-and-punctuation"
                  maxLength={5}
                />
              </View>
              {errors.horaInicio && <Text style={[s.fieldError, { marginBottom: 4 }]}>{errors.horaInicio}</Text>}
              <View style={s.timeRow}>
                <Text style={s.timeLabel}>Hora de salida <Text style={s.required}>*</Text></Text>
                <TextInput
                  style={[s.timeInput, !!errors.horaFin && s.inputError]}
                  value={form.horaFin}
                  onChangeText={v => set('horaFin', v)}
                  placeholder="HH:MM"
                  placeholderTextColor="#484f58"
                  keyboardType="numbers-and-punctuation"
                  maxLength={5}
                />
              </View>
              {errors.horaFin && <Text style={[s.fieldError, { marginBottom: 4 }]}>{errors.horaFin}</Text>}
              {form.horaInicio && form.horaFin && calcHoras(form.horaInicio, form.horaFin) && (
                <View style={[s.summaryBox, { marginTop: 12 }]}>
                  <Text style={s.summaryLabel}>Horas trabajadas</Text>
                  <Text style={s.summaryValue}>{calcHoras(form.horaInicio, form.horaFin)}h</Text>
                </View>
              )}
            </View>

            <View style={s.card}>
              <Text style={s.label}>Observaciones (opcional)</Text>
              <TextInput
                style={[s.input, { minHeight: 80, textAlignVertical: 'top' }]}
                value={form.observaciones}
                onChangeText={v => set('observaciones', v)}
                placeholder="Notas adicionales..."
                placeholderTextColor="#484f58"
                multiline
              />
            </View>

            {/* Resumen taller */}
            <View style={[s.card, { borderColor: '#1d6fb840' }]}>
              <Text style={[s.cardTitle, { color: '#1d6fb8' }]}>Resumen</Text>
              <Text style={s.summaryLine}>{form.fecha} · Taller</Text>
              <Text style={s.summaryLine}>{form.tipoProyecto}</Text>
              <Text style={s.summaryLine}>Responsable: {currentUser?.name || currentUser?.email || '—'}</Text>
            </View>
          </>
        )}

        {/* ── CAMPO STEP 1 ── */}
        {step === 1 && !esTaller && (
          <>
            <View style={s.card}>
              <Text style={s.label}>Fecha</Text>
              <TextInput style={s.input} value={form.fecha} onChangeText={v => set('fecha', v)} placeholderTextColor="#484f58" />
            </View>

            <View style={s.card}>
              <Text style={s.label}>Tipo de trabajo</Text>
              <View style={s.toggleRow}>
                <TouchableOpacity style={[s.toggle, !esTaller && s.toggleActive]} onPress={() => switchTipo(true)}>
                  <Text style={[s.toggleText, !esTaller && s.toggleTextActive]}>Campo</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[s.toggle, esTaller && s.toggleActive]} onPress={() => switchTipo(false)}>
                  <Text style={[s.toggleText, esTaller && s.toggleTextActive]}>Taller</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={[s.card, !!errors.cliente && s.cardError]}>
              <Text style={s.label}>Cliente <Text style={s.required}>*</Text></Text>
              {catalogLoading
                ? <ActivityIndicator color="#1d6fb8" style={{ marginVertical: 8 }} />
                : <View style={s.chipWrap}>
                    {(catalog?.clientes ?? []).map(c => (
                      <SelectOption key={c._id} label={c.nombre} selected={form.cliente === c.nombre} onPress={() => { set('cliente', c.nombre); set('proyectoNombre', ''); }} />
                    ))}
                  </View>
              }
              <FieldError msg={errors.cliente} />
            </View>

            <View style={[s.card, !!errors.tipoProyecto && s.cardError]}>
              <Text style={s.label}>Tipo de proyecto <Text style={s.required}>*</Text></Text>
              {catalogLoading
                ? <ActivityIndicator color="#1d6fb8" style={{ marginVertical: 8 }} />
                : <View style={s.chipWrap}>
                    {(catalog?.tiposProyecto ?? []).map(t => (
                      <SelectOption key={t} label={t} selected={form.tipoProyecto === t} onPress={() => set('tipoProyecto', t)} />
                    ))}
                  </View>
              }
              <FieldError msg={errors.tipoProyecto} />
            </View>

            <View style={s.card}>
              <Text style={s.label}>Nombre del proyecto / mástil</Text>
              {catalogLoading
                ? <ActivityIndicator color="#1d6fb8" style={{ marginVertical: 8 }} />
                : <View style={s.chipWrap}>
                    {filteredProyectos.map(p => (
                      <SelectOption key={p._id} label={p.nombre} selected={form.proyectoNombre === p.nombre} onPress={() => set('proyectoNombre', p.nombre)} />
                    ))}
                  </View>
              }
            </View>

            <View style={[s.card, !!errors.descripcion && s.cardError]}>
              <Text style={s.label}>Descripción de la tarea <Text style={s.required}>*</Text></Text>
              <TextInput
                style={[s.input, { minHeight: 80, textAlignVertical: 'top' }, !!errors.descripcion && s.inputError]}
                value={form.descripcion}
                onChangeText={v => set('descripcion', v)}
                placeholder="Descripción de los trabajos realizados..."
                placeholderTextColor="#484f58"
                multiline
              />
              <FieldError msg={errors.descripcion} />
            </View>
          </>
        )}

        {/* ── CAMPO STEP 2 — Personal y Vehículo ── */}
        {step === 2 && !esTaller && (
          <>
            <View style={[s.card, !!errors.encargado && s.cardError]}>
              <Text style={s.label}>Encargado <Text style={s.required}>*</Text></Text>
              {catalogLoading
                ? <ActivityIndicator color="#1d6fb8" style={{ marginVertical: 8 }} />
                : <View style={s.chipWrap}>
                    {(catalog?.personal ?? []).map(p => (
                      <SelectOption key={p._id} label={p.nombre} selected={form.encargado === p.nombre} onPress={() => set('encargado', p.nombre)} />
                    ))}
                  </View>
              }
              <FieldError msg={errors.encargado} />
            </View>

            <View style={s.card}>
              <Text style={s.label}>Personal a cargo</Text>
              <View style={s.chipWrap}>
                {(catalog?.personal ?? []).filter(p => p.nombre !== form.encargado).map(p => (
                  <SelectOption
                    key={p._id}
                    label={p.nombre}
                    selected={form.personalACargo.includes(p.nombre)}
                    onPress={() => togglePersonal(p.nombre)}
                  />
                ))}
              </View>
              {form.personalACargo.length > 0 && (
                <Text style={s.selectedNote}>{form.personalACargo.length} seleccionado{form.personalACargo.length !== 1 ? 's' : ''}</Text>
              )}
            </View>

            <View style={s.card}>
              <Text style={s.label}>Vehículo</Text>
              {catalogLoading
                ? <ActivityIndicator color="#1d6fb8" style={{ marginVertical: 8 }} />
                : <View style={s.chipWrap}>
                    {(catalog?.vehiculos ?? []).map(v => (
                      <SelectOption
                        key={v._id}
                        label={v.patente}
                        selected={form.vehiculo === v.patente}
                        onPress={() => selectVehiculo(v.patente)}
                      />
                    ))}
                  </View>
              }
            </View>

            <View style={s.card}>
              <Text style={s.label}>Odómetro inicial (km)</Text>
              <TextInput
                style={s.input}
                value={form.kmInicial}
                onChangeText={v => set('kmInicial', v)}
                placeholder={kmLoading ? 'Buscando...' : form.vehiculo ? 'Sin registros previos — ingresá el KM' : 'Seleccioná un vehículo'}
                placeholderTextColor="#484f58"
                keyboardType="numeric"
                editable={!kmLoading}
              />
              {kmLoading && <Text style={s.selectedNote}>Buscando último odómetro registrado...</Text>}
              {!kmLoading && !!form.kmInicial && <Text style={[s.selectedNote, { color: '#238636' }]}>✓ Tomado del último registro</Text>}
              {!kmLoading && !!form.vehiculo && !form.kmInicial && <Text style={s.selectedNote}>Sin registros previos — ingresá el valor</Text>}
            </View>

            <View style={s.card}>
              <Text style={s.label}>Odómetro final (km)</Text>
              <TextInput
                style={s.input}
                value={form.kmFinal}
                onChangeText={v => set('kmFinal', v)}
                placeholder="Ej: 45210"
                placeholderTextColor="#484f58"
                keyboardType="numeric"
              />
              {form.kmInicial && form.kmFinal && Number(form.kmFinal) > Number(form.kmInicial) && (
                <Text style={s.selectedNote}>KM recorridos: {Number(form.kmFinal) - Number(form.kmInicial)} km</Text>
              )}
            </View>
          </>
        )}

        {/* ── CAMPO STEP 3 — Tiempos ── */}
        {step === 3 && !esTaller && (
          <>
            <View style={s.card}>
              <Text style={s.cardTitle}>Horarios</Text>
              {[
                { key: 'horaInicio', label: 'Salida del hotel / base', required: true },
                { key: 'horaInicioField', label: 'Llegada al mástil / campo', required: false },
                { key: 'horaFinField', label: 'Salida del mástil / campo', required: false },
                { key: 'horaFin', label: 'Llegada al hotel / base', required: true },
              ].map(({ key, label, required }) => (
                <View key={key}>
                  <View style={s.timeRow}>
                    <Text style={s.timeLabel}>{label}{required && <Text style={s.required}> *</Text>}</Text>
                    <TextInput
                      style={[s.timeInput, !!errors[key] && s.inputError]}
                      value={(form as any)[key]}
                      onChangeText={v => set(key as keyof FormData, v)}
                      placeholder="HH:MM"
                      placeholderTextColor="#484f58"
                      keyboardType="numbers-and-punctuation"
                      maxLength={5}
                    />
                  </View>
                  {errors[key] && <Text style={[s.fieldError, { marginBottom: 4 }]}>{errors[key]}</Text>}
                </View>
              ))}
            </View>

            <View style={s.card}>
              <Text style={s.label}>Hospedaje</Text>
              <TextInput
                style={s.input}
                value={form.hospedaje}
                onChangeText={v => set('hospedaje', v)}
                placeholder="Nombre del hotel / alojamiento"
                placeholderTextColor="#484f58"
              />
            </View>

            <View style={s.card}>
              <Text style={s.label}>Observaciones</Text>
              <TextInput
                style={[s.input, { minHeight: 80, textAlignVertical: 'top' }]}
                value={form.observaciones}
                onChangeText={v => set('observaciones', v)}
                placeholder="Notas adicionales..."
                placeholderTextColor="#484f58"
                multiline
              />
            </View>

            {/* Resumen campo */}
            <View style={[s.card, { borderColor: '#1d6fb840' }]}>
              <Text style={[s.cardTitle, { color: '#1d6fb8' }]}>Resumen</Text>
              <Text style={s.summaryLine}>{form.fecha} · Campo</Text>
              <Text style={s.summaryLine}>{form.cliente} — {form.proyectoNombre || form.tipoProyecto}</Text>
              <Text style={s.summaryLine}>Enc: {form.encargado}</Text>
              {form.personalACargo.length > 0 && (
                <Text style={s.summaryLine}>Personal: {form.personalACargo.join(', ')}</Text>
              )}
            </View>
          </>
        )}
      </ScrollView>

      {/* Footer buttons */}
      <View style={s.footer}>
        {step < TOTAL_STEPS ? (
          <TouchableOpacity style={s.nextBtn} onPress={next}>
            <Text style={s.nextBtnText}>Siguiente →</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={[s.nextBtn, { backgroundColor: '#238636' }, loading && { opacity: 0.6 }]} onPress={submit} disabled={loading}>
            {loading
              ? <ActivityIndicator color="white" />
              : <Text style={s.nextBtnText}>Enviar Jornada</Text>}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f1117' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 56, backgroundColor: '#080b0f', borderBottomWidth: 1, borderBottomColor: '#21262d' },
  back: { color: '#1d6fb8', fontSize: 15 },
  title: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  steps: { flexDirection: 'row', backgroundColor: '#080b0f', paddingHorizontal: 40, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#21262d', position: 'relative' },
  stepLabel: { color: '#8b949e', fontSize: 10, marginTop: 4 },
  stepLine: { position: 'absolute', top: 30, height: 1, backgroundColor: '#21262d' },
  card: { backgroundColor: '#161b22', borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#21262d' },
  cardError: { borderColor: '#da3633' },
  cardTitle: { color: '#8b949e', fontSize: 12, fontWeight: '600', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
  label: { color: '#8b949e', fontSize: 13, marginBottom: 8 },
  required: { color: '#da3633' },
  input: { backgroundColor: '#0f1117', borderWidth: 1, borderColor: '#30363d', borderRadius: 10, padding: 12, color: 'white', fontSize: 15 },
  inputError: { borderColor: '#da3633' },
  fieldError: { color: '#da3633', fontSize: 12, marginTop: 6 },
  toggleRow: { flexDirection: 'row', gap: 10 },
  toggle: { flex: 1, padding: 12, borderRadius: 10, backgroundColor: '#0f1117', borderWidth: 1, borderColor: '#30363d', alignItems: 'center' },
  toggleActive: { backgroundColor: '#1d6fb820', borderColor: '#1d6fb8' },
  toggleText: { color: '#8b949e', fontWeight: '600' },
  toggleTextActive: { color: '#1d6fb8' },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  option: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, backgroundColor: '#0f1117', borderWidth: 1, borderColor: '#30363d' },
  optionSelected: { backgroundColor: '#1d6fb820', borderColor: '#1d6fb8' },
  optionText: { color: '#8b949e', fontSize: 13 },
  optionTextSelected: { color: '#1d6fb8', fontWeight: '600' },
  selectedNote: { color: '#8b949e', fontSize: 12, marginTop: 8 },
  timeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#21262d' },
  timeLabel: { color: '#8b949e', fontSize: 13, flex: 1 },
  timeInput: { backgroundColor: '#0f1117', borderWidth: 1, borderColor: '#30363d', borderRadius: 8, padding: 10, color: 'white', fontSize: 15, width: 80, textAlign: 'center' },
  summaryLine: { color: '#8b949e', fontSize: 13, marginBottom: 4 },
  summaryBox: { backgroundColor: 'rgba(29,111,184,0.1)', borderRadius: 10, padding: 12, borderWidth: 1, borderColor: 'rgba(29,111,184,0.3)' },
  summaryLabel: { color: '#8b949e', fontSize: 12 },
  summaryValue: { color: 'white', fontSize: 28, fontWeight: 'bold', marginTop: 2 },
  footer: { padding: 16, paddingBottom: 32, backgroundColor: '#080b0f', borderTopWidth: 1, borderTopColor: '#21262d' },
  nextBtn: { backgroundColor: '#1d6fb8', borderRadius: 12, padding: 16, alignItems: 'center' },
  nextBtnText: { color: 'white', fontWeight: '700', fontSize: 16 },
});

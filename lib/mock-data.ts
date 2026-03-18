export const mockRegistros = [
  { _id: 'm1', fecha: '2026-03-10', proyectoNombre: 'MM-ARG-017-CH', clienteNombre: 'Fortescue', tipoProyecto: 'M. Preventivo', encargadoNombre: 'Dodera William', horasTotalesDec: 11, kmRecorridos: 210, status: 'aprobado', trabajoRealizadoEn: 'campo' },
  { _id: 'm2', fecha: '2026-03-11', proyectoNombre: 'MM-ARG-005-CH', clienteNombre: 'Fortescue', tipoProyecto: 'M. Correctivo', encargadoNombre: 'Amarilla Carlos', horasTotalesDec: 10, kmRecorridos: 185, status: 'aprobado', trabajoRealizadoEn: 'campo' },
  { _id: 'm3', fecha: '2026-03-12', proyectoNombre: 'PE del Nuevo Sur', clienteNombre: 'Abo Energy', tipoProyecto: 'Relevamiento', encargadoNombre: 'Surra Juan', horasTotalesDec: 9, kmRecorridos: 320, status: 'aprobado', trabajoRealizadoEn: 'campo' },
  { _id: 'm4', fecha: '2026-03-14', proyectoNombre: 'MM-ARG-010-CH', clienteNombre: 'Fortescue', tipoProyecto: 'Puesta en Marcha', encargadoNombre: 'Dodera William', horasTotalesDec: 8, kmRecorridos: 170, status: 'pre_aprobado', trabajoRealizadoEn: 'campo' },
  { _id: 'm5', fecha: '2026-03-15', proyectoNombre: 'MM-ARG-003-CH', clienteNombre: 'Fortescue', tipoProyecto: 'Montaje estructura', encargadoNombre: 'Amarilla Carlos', horasTotalesDec: 10, kmRecorridos: 230, status: 'pre_aprobado', trabajoRealizadoEn: 'campo' },
  { _id: 'm6', fecha: '2026-03-16', proyectoNombre: 'LIDAR 1', clienteNombre: 'PCR', tipoProyecto: 'Visita preliminar', encargadoNombre: 'Surra Juan', horasTotalesDec: 7, kmRecorridos: 140, status: 'pre_aprobado', trabajoRealizadoEn: 'campo' },
  { _id: 'm7', fecha: '2026-03-08', proyectoNombre: 'Taller San José', clienteNombre: 'Fortescue', tipoProyecto: 'Adecuación', encargadoNombre: 'Maza Roman', horasTotalesDec: 8, kmRecorridos: 0, status: 'rechazado', trabajoRealizadoEn: 'taller' },
];

export const mockKPIs = {
  pendientes: mockRegistros.filter(r => r.status === 'pre_aprobado').length,
  aprobados: mockRegistros.filter(r => r.status === 'aprobado').length,
  rechazados: mockRegistros.filter(r => r.status === 'rechazado').length,
  hhTotales: mockRegistros.filter(r => r.status === 'aprobado').reduce((s, r) => s + r.horasTotalesDec, 0),
  kmTotales: mockRegistros.filter(r => r.status === 'aprobado').reduce((s, r) => s + r.kmRecorridos, 0),
};

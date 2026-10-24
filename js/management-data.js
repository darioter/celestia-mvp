// Celestia Management · los 8 módulos del diagnóstico (rueda) y precios de referencia en ARS.
// Lo usan la página /management y la API /api/management-lead (que recalcula el total).
export const USD_ARS = 1400;

export const MODULOS = [
  { n: 1, t: 'Concepción & Diagnóstico', k: 'Concepto', c: ['Concepto y público objetivo', 'Ubicación o zonas candidatas', 'Factibilidad (competencia y demografía)'], d: ['Validamos idea, público y ubicación antes de invertir', 'Análisis de competencia y demografía con datos reales'], r: '✓ Concepto validado antes de firmar contrato' },
  { n: 2, t: 'Marketing & Marca', k: 'Marca', c: ['Nombre, identidad y lineamientos', 'Plan de lanzamiento (4P) + calendario', 'FODA propio vs competidores'], d: ['Identidad, estrategia 4P y calendario de lanzamiento', 'Google Profile, pauta geolocalizada y fachada'], r: '✓ 1.200 clics y 4,6★ en 30 días' },
  { n: 3, t: 'Oferta & Costeo', k: 'Costeo', c: ['Diseño de carta', 'Recetas estándar con costo por ración', 'Precios y márgenes (food cost)'], d: ['Carta, recetas estándar y fichas técnicas', 'Food cost por plato con margen objetivo del 62%'], r: '✓ Rentabilidad por ticket +18%' },
  { n: 4, t: 'Diseño Operativo', k: 'Operación', c: ['Layout a escala de cocina y salón, con flujos', 'Equipos, vajilla y presupuestos', 'Optimización de circulación y tiempos'], d: ['Layout a escala, flujos y equipamiento', "De 7 min a 3'40'' por ticket en hora pico"], r: '✓ +32% tickets por hora sin ampliar el equipo' },
  { n: 5, t: 'RR.HH. & Operación', k: 'Equipo', c: ['Organigrama y descripción de puestos', 'Protocolos de limpieza y capacitación', 'Turnos, francos y menú staff'], d: ['Organigrama, roles y protocolos de operación', 'Capacitación inicial, turnos y checklists'], r: '✓ Rotación −40% · NPS interno +15 pts' },
  { n: 6, t: 'Legal & Finanzas', k: 'Finanzas', c: ['Societario, habilitaciones y seguros', 'Proyección de ventas y gastos (P&L)', 'Punto de equilibrio y recupero'], d: ['P&L mensual y punto de equilibrio proyectado', 'Recupero de inversión e hitos de habilitación'], r: '✓ Punto de equilibrio en 9 semanas' },
  { n: 7, t: 'Tecnología & Datos', k: 'Datos', c: ['Reservas online y delivery integrados', 'CRM y fidelización', 'Inventario y tableros'], d: ['Reservas online, CRM y sistema de inventario', 'Tableros: tickets, costo por ración y rotación'], r: '✓ Reactivación de clientes inactivos +12%' },
  { n: 8, t: 'Diseño & Arquitectura', k: 'Espacio', c: ['Proyecto de arquitectura e interiorismo', 'Planos, renders y dirección de obra', 'Coordinación de obra y proveedores'], d: ['Proyecto integral de arquitectura e interiorismo', 'Planos ejecutivos, renders 3D y dirección de obra'], r: '✓ Ingreso orgánico +22%' },
];

export const PRECIOS = {
  '1-0': 190000, '1-1': 180000, '1-2': 180000,
  '2-0': 200000, '2-1': 200000, '2-2': 200000,
  '3-0': 240000, '3-1': 230000, '3-2': 230000,
  '4-0': 190000, '4-1': 180000, '4-2': 180000,
  '5-0': 160000, '5-1': 160000, '5-2': 160000,
  '6-0': 260000, '6-1': 270000, '6-2': 270000,
  '7-0': 170000, '7-1': 165000, '7-2': 165000,
  '8-0': 450000, '8-1': 400000, '8-2': 350000,
};

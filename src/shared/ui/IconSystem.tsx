/**
 * UPB Planner — Icon System
 * 
 * Diseñado con principios Apple (SF Symbols approach):
 * - Optical weight balancing across sizes
 * - Consistent stroke widths (1.5px base, 2px at 24px, 1px at 16px)
 * - Rounded linecaps/linejoins for approachability
 * - Semantic naming, not decorative
 * - Works at 16, 20, 24, 28, 32px via viewBox scaling
 */

import React from 'react';

// ============================================
// TAMAÑOS ESTÁNDAR (viewBox 24x24, escala via width/height)
// ============================================

export const IconSizes = {
  xs: 12,   // chips, badges
  sm: 16,   // inline, buttons compactos
  md: 20,   // botones estándar, header actions
  lg: 24,   // botones principales, FABs
  xl: 28,   // modales, empty states
  xxl: 32,  // hero, onboarding
} as const;

export type IconSize = keyof typeof IconSizes;

// ============================================
// ESTILOS DE ICONOS
// ============================================

export type IconStyle = 'outline' | 'filled';

/**
 * OUTLINE — Estilo Apple SF Symbols / iOS
 * - Stroke-only, 1.5-2px
 * - Ligero, respirado, legible a tamaños pequeños
 * - Ideal para UI densa, toolbars, listas
 */
const outlineIcons: Record<string, React.ReactNode> = {
  // Navegación / Estructura
  chevronDown: <path d="M7 10l5 5 5-5" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />,
  chevronRight: <path d="M9 18l6-6-6-6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />,
  chevronLeft: <path d="M15 18l-6-6 6-6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />,
  chevronUp: <path d="M17 14l-5-5-5 5" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />,
  
  // Acciones principales
  plus: <><path d="M12 5v14" strokeWidth="1.5" strokeLinecap="round" /><path d="M5 12h14" strokeWidth="1.5" strokeLinecap="round" /></>,
  minus: <path d="M5 12h14" strokeWidth="1.5" strokeLinecap="round" />,
  check: <path d="M5 12l4 4 9-9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />,
  x: <><path d="M18 6L6 18" strokeWidth="1.5" strokeLinecap="round" /><path d="M6 6l12 12" strokeWidth="1.5" strokeLinecap="round" /></>,
  xCircle: (
    <>
      <circle cx="12" cy="12" r="10" strokeWidth="1.5" />
      <path d="M15 9l-6 6M9 9l6 6" strokeWidth="1.5" strokeLinecap="round" />
    </>
  ),
  
  // To-Do específicos
  task: <path d="M8.5 11.5l3.5 3.5L21.5 4.5" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />,
  taskCompleted: (
    <>
      <path d="M8.5 11.5l3.5 3.5L21.5 4.5" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" strokeWidth="1.5" strokeLinecap="round" />
    </>
  ),
  taskAdd: <><circle cx="12" cy="12" r="10" strokeWidth="1.5" /><path d="M12 8v8M8 12h8" strokeWidth="1.5" strokeLinecap="round" /></>,
  
  // Filtros / Organización
  filter: <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" strokeWidth="1.5" />,
  filterActive: (
    <>
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" strokeWidth="1.5" fill="currentColor" fillOpacity="0.15" />
    </>
  ),
  tag: (
    <>
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" strokeWidth="1.5" />
      <line x1="7" y1="7" x2="7.01" y2="7" strokeWidth="1.5" />
    </>
  ),
  tags: (
    <>
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" strokeWidth="1.5" />
      <line x1="7" y1="7" x2="7.01" y2="7" strokeWidth="1.5" />
      <path d="M17 17l-5-5a2 2 0 0 1 0-2.83l5.17-5.17" strokeWidth="1.5" opacity="0.5" />
    </>
  ),
  
  // Edición / Modificación
  edit: (
    <>
      <path d="M11.5 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7.5" strokeWidth="1.5" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" strokeWidth="1.5" />
    </>
  ),
  duplicate: (
    <>
      <rect x="8.5" y="8.5" width="14" height="14" rx="2" strokeWidth="1.5" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  
  // Eliminación / Destructivo
  trash: (
    <>
      <polyline points="4 6 5 6 20 6" strokeWidth="1.5" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  trashSimple: <path d="M4 6h16M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />,
  
  // Calendario / Fechas
  calendar: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" strokeWidth="1.5" />
      <line x1="16" y1="2" x2="16" y2="6" strokeWidth="1.5" />
      <line x1="8" y1="2" x2="8" y2="6" strokeWidth="1.5" />
      <line x1="3" y1="10" x2="21" y2="10" strokeWidth="1.5" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="10" strokeWidth="1.5" />
      <polyline points="12 6 12 12 16 14" strokeWidth="1.5" strokeLinecap="round" />
    </>
  ),
  
  // Prioridad
  flag: (
    <>
      <path d="M12 2L2.5 14h12l-1 10" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="13" y1="2" x2="13" y2="22" strokeWidth="1.5" />
    </>
  ),
  flagFilled: (
    <>
      <path d="M13 2L3 14h12l-1 10" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="currentColor" fillOpacity="0.15" />
      <line x1="13" y1="2" x2="13" y2="22" strokeWidth="1.5" />
    </>
  ),
  
  // UI States
  eye: (
    <>
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" strokeWidth="1.5" />
      <circle cx="12" cy="12" r="3" strokeWidth="1.5" />
    </>
  ),
  eyeOff: (
    <>
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" strokeWidth="1.5" />
      <path d="M9.9 9.9c-.5.5-.9 1.1-1.2 1.7" strokeWidth="1.5" />
      <path d="M14.1 14.1c.5.5.9 1.1 1.2 1.7" strokeWidth="1.5" />
      <line x1="1" y1="1" x2="23" y2="23" strokeWidth="1.5" strokeLinecap="round" />
    </>
  ),
  
  // Menú / Desplegables
  menu: <path d="M4 6h16M4 12h16M4 18h16" strokeWidth="2" strokeLinecap="round" />,
  grid: (
    <>
      <rect x="3" y="3" width="7" height="7" rx="1" strokeWidth="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1" strokeWidth="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1" strokeWidth="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1" strokeWidth="1.5" />
    </>
  ),

  // Selección múltiple / checklist - más explícito que grid
  selectMultiple: (
    <>
      <rect x="3" y="4" width="18" height="5" rx="1" strokeWidth="1.5" />
      <path d="M4 6.5l2 2 5-5" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="3" y="12" width="18" height="5" rx="1" strokeWidth="1.5" />
      <path d="M4 14.5l2 2 5-5" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="3" y="20" width="18" height="5" rx="1" strokeWidth="1.5" />
    </>
  ),
  
  // Selección / Checkbox
  checkbox: <rect x="3" y="3" width="18" height="18" rx="3" strokeWidth="1.5" />,
  checkboxChecked: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="3" strokeWidth="1.5" fill="currentColor" fillOpacity="0.15" />
      <path d="M6 12l3 3 6-6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  checkboxIndeterminate: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="3" strokeWidth="1.5" fill="currentColor" fillOpacity="0.15" />
      <line x1="6" y1="12" x2="18" y2="12" strokeWidth="2" strokeLinecap="round" />
    </>
  ),
  radio: <circle cx="12" cy="12" r="10" strokeWidth="1.5" />,
  radioChecked: (
    <>
      <circle cx="12" cy="12" r="10" strokeWidth="1.5" />
      <circle cx="12" cy="12" r="5" fill="currentColor" />
    </>
  ),
  
  // Notificaciones
  bell: (
    <>
      <path d="M17.5 8A5.5 5.5 0 0 0 6.5 8c0 6.5-2.5 8.5-2.5 8.5h17s-2.5-2-2.5-8.5" strokeWidth="1.5" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" strokeWidth="1.5" />
    </>
  ),
  bellRing: (
    <>
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" strokeWidth="1.5" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" strokeWidth="1.5" />
      <path d="M10.3 15a2 2 0 0 1 3.4 0" strokeWidth="1.5" opacity="0.5" />
    </>
  ),
  bellOff: (
    <>
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" strokeWidth="1.5" />
      <line x1="1" y1="1" x2="23" y2="23" strokeWidth="1.5" strokeLinecap="round" />
    </>
  ),
  
  // Usuario / Perfil
  user: (
    <>
      <path d="M20 21v-2a4 4 0 0 0-4-4H4a4 4 0 0 0-4 4v2" strokeWidth="1.5" />
      <circle cx="12" cy="7" r="4" strokeWidth="1.5" />
    </>
  ),
  userPlus: (
    <>
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" strokeWidth="1.5" />
      <circle cx="12" cy="7" r="4" strokeWidth="1.5" />
      <line x1="16" y1="11" x2="16" y2="11" strokeWidth="1.5" strokeLinecap="round" />
    </>
  ),
  
  // Configuración / Ajustes
  settings: <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" strokeWidth="1.5" />,
  
  // Apariencia / Tema
  sun: (
    <>
      <circle cx="12" cy="12" r="5" strokeWidth="1.5" />
      <line x1="12" y1="1" x2="12" y2="3" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="12" y1="21" x2="12" y2="23" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="1" y1="12" x2="3" y2="12" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="21" y1="12" x2="23" y2="12" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" strokeWidth="1.5" strokeLinecap="round" />
    </>
  ),
  moon: <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" strokeWidth="1.5" />,
  monitor: (
    <>
      <rect x="2" y="3" width="20" height="14" rx="2" ry="2" strokeWidth="1.5" />
      <line x1="8" y1="21" x2="16" y2="21" strokeWidth="1.5" />
      <line x1="12" y1="17" x2="12" y2="21" strokeWidth="1.5" />
    </>
  ),
  
  // Ordenamiento
  sort: (
    <>
      <path d="M3 16l5-5 5 5" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M3 8l5 5 5-5" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  sortAsc: (
    <>
      <path d="M3 16l5-5 5 5" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="currentColor" fillOpacity="0.2" />
      <path d="M3 8l5 5 5-5" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.4" />
    </>
  ),
  sortDesc: (
    <>
      <path d="M3 16l5-5 5 5" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.4" />
      <path d="M3 8l5 5 5-5" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="currentColor" fillOpacity="0.2" />
    </>
  ),
  
  // Archivo / Adjunto
  file: (
    <>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" strokeWidth="1.5" />
      <polyline points="14 2 14 8 20 8" strokeWidth="1.5" />
    </>
  ),
  filePlus: (
    <>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" strokeWidth="1.5" />
      <polyline points="14 2 14 8 20 8" strokeWidth="1.5" />
      <line x1="12" y1="18" x2="12" y2="12" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="9" y1="15" x2="15" y2="15" strokeWidth="1.5" strokeLinecap="round" />
    </>
  ),
  
  // Búsqueda
  search: (
    <>
      <circle cx="11" cy="11" r="8" strokeWidth="1.5" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" strokeWidth="1.5" strokeLinecap="round" />
    </>
  ),
  
  // Flechas direccionales
  arrowUp: <path d="M18 15l-6-6-6 6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />,
  arrowDown: <path d="M6 9l6 6 6-6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />,
  arrowLeft: <path d="M15 18l-6-6 6-6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />,
  arrowRight: <path d="M9 18l6-6-6-6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />,
  
  // Inicio / Home
  home: (
    <>
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" strokeWidth="1.5" />
      <polyline points="9 22 9 12 15 12 15 22" strokeWidth="1.5" />
    </>
  ),
  
  // Información / Ayuda
  info: (
    <>
      <circle cx="12" cy="12" r="10" strokeWidth="1.5" />
      <line x1="12" y1="16" x2="12" y2="12" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="12" y1="8" x2="12.01" y2="8" strokeWidth="1.5" strokeLinecap="round" />
    </>
  ),
  help: (
    <>
      <circle cx="12" cy="12" r="10" strokeWidth="1.5" />
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="12" y1="17" x2="12.01" y2="17" strokeWidth="1.5" strokeLinecap="round" />
    </>
  ),
  
  // Descarga / Subida
  download: (
    <>
      <path d="M21 15v4a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2v-4" strokeWidth="1.5" />
      <polyline points="7 10 12 15 17 10" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="12" y1="15" x2="12" y2="3" strokeWidth="1.5" />
    </>
  ),
  upload: (
    <>
      <path d="M21 15v4a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2v-4" strokeWidth="1.5" />
      <polyline points="17 8 12 3 7 8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="12" y1="3" x2="12" y2="15" strokeWidth="1.5" />
    </>
  ),
  
  // Sincronización / Refresh
  refreshCw: (
    <>
      <polyline points="23 4 23 10 17 10" strokeWidth="1.5" />
      <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" strokeWidth="1.5" />
    </>
  ),
  refreshCcw: (
    <>
      <polyline points="1 4 1 10 7 10" strokeWidth="1.5" />
      <path d="M3.51 9a9 9 0 1 1 2.12-9.36L1 10" strokeWidth="1.5" />
    </>
  ),
  
  // Compartir
  share: (
    <>
      <circle cx="18" cy="5" r="3" strokeWidth="1.5" />
      <circle cx="6" cy="12" r="3" strokeWidth="1.5" />
      <circle cx="18" cy="19" r="3" strokeWidth="1.5" />
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" strokeWidth="1.5" />
      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" strokeWidth="1.5" />
    </>
  ),
  
  // Duplicado específico para task
  copy: (
    <>
      <rect x="8.5" y="8.5" width="14" height="14" rx="2" ry="2" strokeWidth="1.5" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
};

/**
 * FILLED — Estilo Material Design / Android
 * - Shapes rellenos, peso visual mayor
 * - Mejor para estados activos, selected, énfasis
 * - Buen contraste en modo oscuro
 */
const filledIcons: Record<string, React.ReactNode> = {
  check: <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />,
  taskCompleted: <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />,
  checkboxChecked: <path d="M19 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.11 0 2-.9 2-2V5c0-1.1-.89-2-2-2zm-9 14l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />,
  trash: <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />,
  bell: <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2zm-4 3.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z" />,
  flag: <path d="M14.4 6L14 4H5v17h2v-7h5.6l.4 2h7V6z" />,
  star: <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />,
  radioChecked: <path d="M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zm0 8c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3z" />,
  chevronRight: <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" />,
  chevronLeft: <path d="M14 6l-6 6 6 6 1.41-1.41L10.83 12 14 8.59z" />,
  chevronDown: <path d="M7 10l5 5 5-5z" />,
  chevronUp: <path d="M7 14l5-5 5 5z" />,
  menu: <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z" />,
  close: <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />,
};

// ============================================
// COMPONENTE ICONO UNIFICADO
// ============================================

interface IconProps {
  name: keyof typeof outlineIcons;
  size?: IconSize;
  style?: IconStyle;
  className?: string;
  'aria-hidden'?: boolean;
  'aria-label'?: string;
}

const iconMap = {
  outline: outlineIcons,
  filled: filledIcons,
} as const;

export function Icon({ 
  name, 
  size = 'md', 
  style = 'outline',
  className = '',
  'aria-hidden': ariaHidden = true,
  'aria-label': ariaLabel,
  ...props
}: IconProps) {
  const iconSet = iconMap[style];
  const Path = iconSet[name];
  
  if (!Path) {
    console.warn(`Icon "${name}" not found in style "${style}"`);
    return null;
  }
  
  const dimensions = IconSizes[size];
  
  return (
    <svg
      width={dimensions}
      height={dimensions}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={style === 'outline' ? 1.5 : undefined}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`icon icon--${style} icon--${size} ${className}`}
      aria-hidden={ariaHidden}
      aria-label={ariaLabel}
      {...props}
    >
      {Path}
    </svg>
  );
}

// Exportar mapas para uso directo si se necesita
export { outlineIcons, filledIcons };
export type { IconProps, IconStyle, IconSize };
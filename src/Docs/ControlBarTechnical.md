# ControlBar - Documento Tecnico

## 1. Objetivo

Documentar el area de ControlBar del calendario, su composicion visual, la logica de interaccion y su relacion con el contrato compartido `DropdownBase`.

El alcance de este documento cubre:

- barra principal de control del calendario.
- botones de cambio de vista, adicion de actividad, selector de periodo academico, filtro y selector de tema.
- estilos propios del area.
- comportamiento de los dos controles que usan dropdown dentro de ControlBar.

## 2. Archivos del area

- `src/components/ControlBar/ControlBar.jsx`
- `src/components/ControlBar/ViewButton.jsx`
- `src/components/ControlBar/AddActivityButton.jsx`
- `src/components/ControlBar/AcademicPeriodSelect.jsx`
- `src/components/ControlBar/FilterButton.jsx`
- `src/components/ControlBar/ThemeSelector.jsx`
- `src/components/DropdownBase/DropdownBase.jsx`
- `src/styles/ControlBar/ControlBar.css`
- `src/styles/ControlBar/ViewButton.css`
- `src/styles/ControlBar/AddActivityButton.css`
- `src/styles/ControlBar/FilterButton.css`
- `src/styles/ControlBar/ThemeSelector.css`
- `src/services/academicPeriodsService.jsx`
- `src/services/categoriesService.jsx`

## 3. Librerias y APIs utilizadas

Librerias:

- React (`useState`, `useEffect`), principalmente para estado local y sincronizacion de UI.
- `react-icons`, usado por el filtro de actividades y el selector de temas.

APIs del navegador:

- `CustomEvent` y `window.dispatchEvent` para integracion con onboarding.
- `window.addEventListener` para cerrar UI cuando el flujo de onboarding abre otro panel.
- `fetch` indirecto a traves de los servicios de periodos y categorias.

## 4. Composicion funcional

`ControlBar` es un contenedor de layout. No resuelve negocio de calendario por si mismo, solo orquesta los controles hijos y recibe callbacks del padre.

### 4.1 Controles visibles

- `ViewButton`: alterna entre vista semanal y diaria.
- `AcademicPeriodSelect`: filtra el calendario por periodo academico.
- `AddActivityButton`: abre el modal de alta de actividad personal.
- `FilterButton`: filtra por etiqueta o categoria.
- `ThemeSelector`: abre un modal independiente para cambiar paleta.

### 4.2 Controles con dropdown en esta area

En ControlBar, los unicos componentes que usan dropdown son:

- `AcademicPeriodSelect`.
- `FilterButton`.

Ambos delegan apertura, cierre por click externo, cierre por Escape y cierre por seleccion a `DropdownBase`.

## 5. Contrato con DropdownBase

`DropdownBase` centraliza el comportamiento comun de los dropdowns de la aplicacion.

Responsabilidades:

- manejar estado controlado o no controlado.
- cerrar al hacer click fuera.
- cerrar con `Escape`.
- exponer `trigger` y `children` como render props.
- encapsular los roles ARIA y el id de relacion entre boton y panel.

Uso en ControlBar:

- `AcademicPeriodSelect` controla el estado abierto con `open` y `onOpenChange`.
- `FilterButton` hace lo mismo.
- en ambos casos el boton de apertura se renderiza desde `trigger`.
- el contenido del menu se renderiza desde `children`.

## 6. Flujo de logica

### 6.1 Periodos academicos

1. El componente consulta `fetchAcademicPeriods` al montar.
2. Normaliza la respuesta a una lista de periodos con `id` y `nombre`.
3. El estado inicial no fuerza seleccion, por lo que el texto visible es `Período Académico`.
4. Al abrirse el dropdown, se emite `onboarding:academic-period-opened`.
5. Al elegir una opcion:
   - se actualiza `selectedPeriod`.
   - se llama `onPeriodChange(period)` con el objeto completo o `null` para `Todos los períodos`.
   - el dropdown se cierra mediante el contrato de `DropdownBase`.

### 6.2 Filtro de actividades

1. El componente consulta `getCategories` al montar.
2. Inserta la opcion `Todos` como primer elemento.
3. El valor activo se recibe por props en `selectedTag`.
4. Al abrirse el dropdown, se emite `onboarding:calendar-filter-opened`.
5. Al elegir una categoria:
   - se emite `onboarding:calendar-filter-option-selected`.
   - se llama `setSelectedTag(category)`.
   - el dropdown se cierra automaticamente.

## 7. Estilos y skin

### 7.1 Principio de skin compartida

La base visual del area se mantiene en la identidad magenta existente, pero la piel de los dropdowns del ControlBar se modela con clases compartidas:

- `controlBarDropdownRoot`
- `controlBarDropdownTrigger`
- `controlBarDropdownMenu`
- `controlBarDropdownList`
- `controlBarDropdownOption`

### 7.2 Decisiones visuales

- se conserva el borde degradado en el trigger.
- se mantiene el menu flotante superior por estar en una barra fija inferior.
- las opciones conservan el estilo de boton, con estado seleccionado destacado.
- en mobile, ambos triggers se compactan a icono para no romper el layout.

### 7.3 Archivos de estilo implicados

- `src/styles/ControlBar/ControlBar.css` concentra el layout del shell y la skin comun de los dropdowns del area.
- `src/styles/ControlBar/FilterButton.css` queda solo para ajustes puntuales del icono del filtro.

## 8. Integracion con onboarding

Selectores que deben mantenerse:

- `academic-period-button`
- `academic-period-menu`
- `calendar-filter-button`
- `calendar-filter-menu`

Eventos relevantes:

- `onboarding:academic-period-opened`
- `onboarding:academic-period-selected`
- `onboarding:calendar-filter-opened`
- `onboarding:calendar-filter-option-selected`
- `onboarding:close-unrelated-ui`

## 9. Riesgos y observaciones

- Cambiar los `data-onboarding-id` rompe el tour de onboarding.
- `DropdownBase` es compartido por otras areas, asi que cualquier ajuste de contrato debe conservar compatibilidad.
- Si se agregan mas dropdowns al ControlBar, conviene seguir reutilizando `DropdownBase` y solo variar clases de skin.
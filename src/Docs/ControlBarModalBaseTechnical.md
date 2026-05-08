# ControlBar - Integracion con Modal Base

## 1. Objetivo

Documentar la integracion de los modales del area ControlBar con el componente `Modal` base del proyecto.

Alcance especifico de esta documentacion:

- modal de **Agregar actividad**.
- modal de **Paleta de colores**.

No incluye otras areas que usan `Modal` fuera de ControlBar.

## 2. Componentes involucrados

- `src/components/Account/Modal.jsx`
- `src/components/Account/Modal.css`
- `src/components/ControlBar/AddActivityButton.jsx`
- `src/components/ControlBar/ThemeSelector.jsx`
- `src/styles/ControlBar/AddActivityButton.css`
- `src/styles/ControlBar/ThemeSelector.css`
- `src/components/ControlBar/ThemeOptions.jsx`

## 3. Librerias y APIs utilizadas

Librerias:

- React (`useState`, `useEffect`, `useRef`).
- `react-icons` (`IoColorPalette`) en el selector de paleta.

Servicios y APIs:

- `addPersonalActivity` para guardar actividades personales.
- `getCategories` para poblar el preview de categorias en paleta.
- `getColorPalette` y `saveColorPalette` para persistencia de tema.
- `window.dispatchEvent` con `CustomEvent` para integracion con onboarding.

## 4. Contrato del Modal Base

`Modal` centraliza comportamiento transversal:

- apertura/cierre controlados por `isOpen` y `onClose`.
- cierre por overlay (`closeOnOverlayClick`) y tecla Escape (`closeOnEscape`).
- bloqueo de scroll del body mientras hay modales abiertos.
- manejo de foco: foco inicial (`initialFocusRef`), focus trap, restauracion de foco (`restoreFocusRef`).
- skin configurable por clases (`className`, `bodyClassName`, `footerClassName`).

## 5. Integracion en ControlBar

### 5.1 Add Activity

Archivo: `src/components/ControlBar/AddActivityButton.jsx`.

Se conserva la logica de negocio original:

- validacion de formulario (`validateForm`).
- guardado mediante `addPersonalActivity`.
- callback `onActivityAdd`.
- manejo de loading/error.

Se migra la capa modal al base:

- `Modal` recibe `title="Nueva Actividad"`.
- `closeOnOverlayClick` habilitado (cierra al click fuera).
- `showFooter={false}` para mantener acciones custom dentro del body.
- `initialFocusRef` al input de titulo y `restoreFocusRef` al boton trigger.

Onboarding preservado:

- `data-onboarding-id="add-activity-button"` en el trigger.
- `data-onboarding-id="add-activity-modal"` dentro del contenido modal.
- eventos `onboarding:add-activity-opened` y `onboarding:add-activity-saved`.

### 5.2 Theme Selector

Archivo: `src/components/ControlBar/ThemeSelector.jsx`.

Se conserva la logica de negocio original:

- lectura/escritura de cache local.
- carga y guardado de paleta via API.
- callback `onThemeChange`.
- animacion de feedback de guardado en el boton.

Se migra la capa modal al base:

- `Modal` con `title="Paleta de temas"`.
- `closeOnOverlayClick` habilitado.
- `showFooter={false}` porque el contenido es una grilla de seleccion.
- se normaliza cierre al comportamiento del modal base (sin animacion de cierre custom).

Onboarding preservado:

- `data-onboarding-id="theme-selector-button"` en trigger.
- `data-onboarding-id="theme-selector-modal"` en contenido modal.
- eventos `onboarding:theme-selector-opened` y `onboarding:theme-selected`.

## 6. Estilos y skin del area

La identidad visual de ControlBar se mantiene en su capa de skin:

- `controlBarModal controlBarModal--addActivity`
- `controlBarModalBody controlBarModalBody--addActivity`
- `controlBarModal controlBarModal--themeSelector`
- `controlBarModalBody controlBarModalBody--themeSelector`

El comportamiento del modal queda en `Modal` base; la apariencia se controla desde CSS de cada componente del ControlBar.

## 7. Comportamiento funcional esperado

1. Ambos modales cierran por:
   - boton de cerrar.
   - tecla Escape.
   - click sobre overlay.
2. Ambos modales mantienen cierre cruzado por `onboarding:close-unrelated-ui`.
3. El foco vuelve al boton trigger correspondiente al cerrar.
4. No se altera el contrato de negocio de guardar actividad o cambiar paleta.

## 8. Riesgos y consideraciones

- Cambiar `data-onboarding-id` rompe pasos del tour guiado.
- Ajustes visuales en `Modal.css` impactan consumidores globales de `Modal`.
- El orden de overlays depende de una politica de `z-index` compartida; se recomienda mantener una escala comun a nivel app.
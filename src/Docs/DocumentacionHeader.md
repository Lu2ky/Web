# Header Shell - Documento Tecnico

## 1. Objetivo

Documentar el funcionamiento tecnico del shell de Header, su relacion con los contratos base de Dropdown y Modal, y las consideraciones de estilo e integracion con onboarding.

## 2. Archivos del area

- src/components/Header/Header.jsx
- src/styles/Header/Header.css
- src/components/Header/NotificationBell.jsx
- src/components/Account/DropdownAcount.jsx
- src/components/Account/Modal.jsx
- src/components/DropdownBase/DropdownBase.jsx
- src/context/OnboardingContext.jsx

## 3. Librerias y APIs

Librerias:

- React (useState).
- Componentes feature internos de la app (NotificationBell, DropdownAcount, Modal).

APIs del navegador:

- Atributos ARIA para accesibilidad del boton de ayuda y su dialogo.

## 4. Arquitectura del shell

Header organiza dos zonas principales:

1. headerLeft:
   - Logo.
   - Titulo de aplicacion.

2. headerRight:
   - NotificationBell (dropdown de notificaciones).
   - Boton de ayuda (abre modal de instrucciones).
   - DropdownAcount (menu de cuenta y modales de perfil/preferencias/logout).

El shell no implementa logica de negocio de notificaciones ni de cuenta; solo orquesta composicion e interaccion de alto nivel.

## 5. Contrato con base shared

### 5.1 DropdownBase

El Header se apoya indirectamente en DropdownBase a traves de:

- NotificationBell.
- DropdownAcount.

Responsabilidad del shell:

- Garantizar coexistencia visual y de interaccion entre ambos dropdowns.
- Evitar overlays residuales que interfieran con cierres controlados por base.

### 5.2 Modal base

El shell usa Modal base para el dialogo de ayuda:

- isOpen controlado por estado local.
- onClose para cierre explicito.
- closeLabel para CTA del footer.
- closeOnOverlayClick habilitado para UX de ayuda.

El contenido del modal mantiene copy informativo y correo de contacto.

## 6. Flujo funcional del Header

1. Render inicial muestra logo/titulo y bloque de acciones derechas.
2. Click en boton de ayuda abre modal de instrucciones.
3. Modal de ayuda cierra por:
   - Boton de cerrar del modal.
   - Boton de accion Entendido.
   - Click en overlay (habilitado en este flujo).
4. NotificationBell y DropdownAcount mantienen su propio estado/control interno, conviviendo dentro de headerRight.

## 7. Estilos y skin

Archivo principal:

- src/styles/Header/Header.css

Decisiones:

- Se mantiene identidad visual existente (header limpio, boton circular de ayuda, hover magenta).
- Se agrego estado visual para boton ayuda cuando el dialogo esta abierto (aria-expanded=true).
- Se ajusto gap de headerRight en mobile para mejor compactacion sin alterar el look.

## 8. Integracion con onboarding

El shell no emite eventos de onboarding propios en esta iteracion.

Dependencias indirectas:

- NotificationBell y DropdownAcount emiten/consumen eventos onboarding.
- El Header debe preservar estructura y posicion para no romper target selectors del tour.

# Header - Perfil y Preferencias
## 1. Alcance

Incluye:

- Menu de cuenta (avatar, opciones y apertura de modales).
- Modal de Mi Perfil.
- Modal de Preferencias.
- Modal de confirmacion para silenciar notificaciones.
- Integracion con onboarding por eventos y selectores.

## 2. Archivos principales

- `src/components/Account/DropdownAcount.jsx`
- `src/components/Account/DropdownAcount.css`
- `src/components/Header/UserProfile.jsx`
- `src/components/Header/UserProfile.css`
- `src/components/Header/UserPreferences.jsx`
- `src/components/Header/UserPreferences.css`
- `src/components/Header/Header.jsx`
- `src/context/OnboardingContext.jsx`
- `src/services/userService.jsx`
- `src/services/notificationsSilenceService.jsx`

## 3. Librerias y APIs utilizadas

Librerias:

- React (hooks: `useState`, `useEffect`, `useRef`).
- `react-router-dom` (`useNavigate`) para cierre de sesion y redireccion.
- `react-icons` para iconografia de formularios en Perfil/Preferencias.

APIs web:

- `fetch` indirecto via servicios (`userService`, `notificationsSilenceService`).
- `localStorage` indirecto (mute status persistido por servicio de notificaciones).
- `CustomEvent` + `window.addEventListener` para onboarding.
- `setTimeout` para feedback transitorio de mensajes.

## 4. Contratos base aplicados

### 4.1 DropdownBase (menu de cuenta)

El menu de cuenta usa `DropdownBase` en modo controlado:

- `open`: estado `isDropdownOpen`.
- `onOpenChange`: sincroniza apertura/cierre desde el shell base.
- `trigger`: render del boton avatar.
- `children`: render del `<ul>` de opciones.

Esto centraliza comportamiento de cierre externo y Escape en el shell base, manteniendo la logica de negocio y onboarding en `DropdownAcount`.

### 4.2 Modal base (Perfil y Preferencias)

`DropdownAcount` usa `Modal` como contenedor de:

- Mi Perfil.
- Preferencias.
- Confirmacion de cierre de sesion.

`UserPreferences` usa adicionalmente `Modal` para confirmacion de silenciamiento.

## 5. Flujo funcional

### 5.1 Menu de cuenta

1. Usuario hace click en avatar.
2. `DropdownAcount` alterna `isDropdownOpen`.
3. Si abre, emite `onboarding:account-dropdown-opened`.
4. Si onboarding esta en paso `open-password-change`, se abre perfil directamente.
5. Al seleccionar opcion:
   - `acount` abre modal Mi Perfil.
   - `prefer` abre modal Preferencias.
   - `close` abre confirmacion de cierre de sesion.

### 5.2 Perfil

1. Al montar, carga datos de usuario.
2. Permite cambio de contrasena con validaciones de complejidad y confirmacion.
3. Verifica contrasena actual via LDAP antes de persistir.
4. Si el cambio es exitoso, emite `onboarding:password-changed`.

### 5.3 Preferencias

1. Al montar, carga datos del usuario y estado mute.
2. Permite editar correo con validacion de formato y persistencia.
3. Permite configurar anticipacion de recordatorios (minutos totales, max 24h).
4. Permite silenciar/reactivar notificaciones.
5. Para silenciar, requiere confirmacion en modal interno.

## 6. Onboarding y acoplamientos clave

Eventos emitidos relevantes:

- `onboarding:account-dropdown-opened`
- `onboarding:profile-opened`
- `onboarding:preferences-opened`
- `onboarding:preferences-email-edit-opened`
- `onboarding:preferences-email-typed`
- `onboarding:preferences-email-saved`
- `onboarding:password-changed`

Selectores/IDs que deben mantenerse:

- `account-dropdown`
- `avatar-button`
- `profile-menu-button`
- `open-preferences-button`
- `preferences-modal`
- `preferences-email-edit-button`
- `preferences-email-input`
- `preferences-email-save-button`
- `password-change-section`

Nota: cambiar nombres de eventos o `data-onboarding-id` rompe progresion de onboarding.

# Modulo de Notificaciones

## 1. Objetivo y alcance

Este modulo implementa la campana de notificaciones del header, su dropdown interactivo y las operaciones de marcado como leida. Tambien contempla la lectura del estado de silenciamiento (mute) gestionado por preferencias de usuario.

El alcance de esta implementacion cubre:

- UI de campana y dropdown.
- Polling periodico de notificaciones.
- Marcado individual y masivo como leida.
- Indicadores de no leidas y estado silenciado.
- Integracion con onboarding por eventos de ventana.

No cubre en este componente el toggle de silenciamiento (se realiza en preferencias de usuario).

## 2. Arquitectura del area

### 2.1 Componente principal

- `src/components/Header/NotificationBell.jsx`

Responsabilidades:

- Gestionar estado de apertura del dropdown.
- Cargar notificaciones al montar y cada 20 segundos.
- Ordenar no leidas primero.
- Ejecutar marcado individual/masivo como leida.
- Exponer feedback visual para estados de operacion.
- Integrarse con `DropdownBase` sin modificar su implementacion base.

### 2.2 Servicios

- `src/services/notificationService.jsx`

Responsabilidades:

- Obtener notificaciones del backend.
- Normalizar payloads heterogeneos (id, titulo, descripcion, fecha, estado read).
- Marcar notificaciones como leidas en lotes (`acknowledgeNotifications`).
- Manejar convenciones de endpoint via variables de entorno de Vite.

- `src/services/notificationsSilenceService.jsx`

Responsabilidades:

- Leer persistencia local del estado mute (`localStorage`).
- Gestionar endpoints de silencio/activacion usados por preferencias.

### 2.3 Integraciones de contexto

- `src/context/OnboardingContext.jsx`

Contrato utilizado por NotificationBell:

- Evento emitido al abrir: `onboarding:notifications-opened`.
- Evento escuchado para cierre cruzado: `onboarding:close-unrelated-ui`.
- Selectores de onboarding por `data-onboarding-id`:
  - `notification-bell`
  - `notification-dropdown`

## 3. Librerias y APIs utilizadas

### 3.1 Librerias

- React (hooks): `useState`, `useEffect`.
- Ecosistema build/runtime: Vite (variables `import.meta.env`).

### 3.2 APIs Web

- `fetch` para consumo de servicios HTTP.
- `localStorage` para estado mute persistido.
- `CustomEvent` y `window.addEventListener` para coordinacion con onboarding.
- `setInterval` para polling.

### 3.3 Componente compartido

- `src/components/DropdownBase/DropdownBase.jsx`

Uso en NotificationBell:

- Modo controlado (`open`, `onOpenChange`) para mantener la logica funcional en NotificationBell.
- `trigger` render-prop para dibujar la campana.
- `children` render-prop para dibujar el contenido del menu.
- Se evita modificar la base compartida; la personalizacion ocurre en la skin local.

## 4. Flujo de funcionamiento

### 4.1 Carga y polling

1. Al montar o cambiar `userId`, se invoca `refreshNotifications()`.
2. Se inicia intervalo de 20s para recargar.
3. `refreshNotifications()`:
   - Consulta `NotificationService.getNotifications(userId)`.
   - Normaliza y guarda en estado local.
   - Lee mute status con `NotificationsSilenceService.getMuteStatus()`.

### 4.2 Apertura y cierre de menu

1. La campana alterna `isOpen` desde el trigger de `DropdownBase`.
2. Al abrir, se emite `onboarding:notifications-opened`.
3. El cierre por click fuera se delega a `DropdownBase` (shell).
4. Adicionalmente, si onboarding emite `onboarding:close-unrelated-ui` y no autoriza `dropdown-notifications`, el menu se cierra.

### 4.3 Conteo y orden

- `unreadCount` se calcula filtrando `read === false`.
- El listado se ordena mostrando no leidas primero y luego leidas.

### 4.4 Marcado individual como leida

1. Se evita ejecutar si hay operacion masiva activa.
2. Se obtiene el id robusto via `getNotificationId`.
3. Optimistic UI: se marca `read: true` localmente.
4. Se llama `acknowledgeNotifications([id], userId)`.
5. Se refresca desde backend y se valida persistencia.

### 4.5 Marcado masivo como leidas

1. Solo aplica a no leidas.
2. Se deduplican ids validos.
3. Optimistic UI sobre items objetivo.
4. Se llama `acknowledgeNotifications(ids, userId)` en lotes.
5. Se refresca para confirmar persistencia final.

### 4.6 Estado muted

- Cuando existe mute activo:
  - Cambia iconografia de campana.
  - Se oculta badge numerico de no leidas.
  - Se muestra indicador visual y banner en dropdown.

## 5. Capa de estilos y skin

Archivo principal:

- `src/styles/Header/NotificationBell.css`

Estrategia:

- Se conserva la identidad visual del modulo en clases propias de NotificationBell.
- `DropdownBase` actua como shell de interaccion (estado y cierre), mientras la skin permanece local.
- Se utiliza un host de menu (`.notification-dropdown-host`) para posicionamiento absoluto sin tocar estilos base compartidos.

Estados visuales principales:

- Item no leido: `.notification-unread`.
- Item leido: `.notification-read`.
- Item en operacion: `.notification-deleting`.
- Bell silenciada: `.notification-bell-button.muted`.
- Indicador mute: `.notification-bell-muted-indicator`.
- Banner de estado mute: `.notification-status-muted`, `.muted-badge`.

## 6. Referencias de codigo

- `src/components/Header/NotificationBell.jsx`
- `src/styles/Header/NotificationBell.css`
- `src/components/DropdownBase/DropdownBase.jsx`
- `src/services/notificationService.jsx`
- `src/services/notificationsSilenceService.jsx`
- `src/context/OnboardingContext.jsx`
- `src/components/Header/UserPreferences.jsx`
# Propuesta de Diseño UX/UI: "Aura Chat" (React Native / Expo)

### Pantalla Login: Login Premium (AETHERA Style)
*   **Contenedor Principal:** Eliminar tarjetas tipo "caja fuerte" oscuras en el centro. El formulario debe flotar directamente sobre el fondo oscuro (`bg-[#0B0F19]`) para dar sensación de amplitud.
*   **Fondo (Auras):** Usar luces de fondo (BlurViews absolutos o vistas con opacity y colores de Tailwind como `bg-indigo-600/20` con blur alto) para generar profundidad.
*   **Logo/Icono Superior:** Reemplazar el texto simple por un ícono abstracto (ej. destello o diamante) dentro de un `<BlurView>` pequeño cuadrado con esquinas muy redondeadas. Título "AETHERA" con espaciado amplio (`tracking-widest`).
*   **Inputs (Estilo Cristal):** 
    *   No usar cajas sólidas. Usar contenedores con fondo `rgba(255, 255, 255, 0.03)` y borde `rgba(255, 255, 255, 0.08)`.
    *   Incluir un icono a la izquierda de cada input (ej. sobre y candado) usando `@expo/vector-icons` en color `slate-400`.
    *   Almacenar el estado de "focus". Cuando el input esté activo, el borde debe cambiar a un color índigo tenue (`border-indigo-500/50`).
*   **Botón "INGRESAR":**
    *   Usar un componente `LinearGradient` (de `expo-linear-gradient`) con colores índigo a azul (ej. `#6366f1` a `#4f46e5`).
    *   Estilizar con sombra suave del mismo color para simular brillo (`shadowColor: '#6366f1'`).
*   **Animaciones:** Los inputs y el botón deben aparecer en cascada desde abajo (SlideUp y FadeIn) usando `react-native-reanimated`.

## 1. Concepto Visual: Dark Glassmorphism
El diseño debe transmitir una sensación premium, inmersiva y moderna. Usaremos un fondo oscuro profundo y elementos superpuestos que simulen cristal esmerilado (Glassmorphism), iluminados por sutiles "auras" de colores en el fondo.

*   **Librerías Clave:**
    *   `nativewind` (Para usar clases de Tailwind CSS).
    *   `expo-blur` (Para el componente `<BlurView>` que crea el efecto cristal).
    *   `@expo/vector-icons` (Para iconografía consistente).
    *   `react-native-reanimated` o `LayoutAnimation` (Para transiciones fluidas).

## 2. Paleta de Colores Global (Tailwind)
*   **Fondo Principal de la App:** `bg-slate-900` (`#0F172A`)
*   **Auras de Fondo (Gradientes difuminados):**
    *   Aura 1: `bg-indigo-600/30`
    *   Aura 2: `bg-fuchsia-600/20`
*   **Texto Principal (Títulos, Nombres):** `text-white` o `text-slate-50`
*   **Texto Secundario (Descripciones, subtítulos):** `text-slate-400`
*   **Superficies de Cristal (Tarjetas, Inputs, Botones):**
    *   Fondo: `bg-slate-800/40`
    *   Bordes sutiles: `border border-white/10`
*   **Acentos Específicos por Rol:**
    *   Cliente: `text-emerald-400` / `bg-emerald-500/20`
    *   Vendedor: `text-blue-400` / `bg-blue-500/20`

## 3. Tipografía
*   Usar la fuente nativa del sistema, pero asegurando jerarquías claras.
*   **Títulos principales:** `text-3xl font-bold tracking-tight`
*   **Títulos de tarjetas:** `text-base font-semibold`
*   **Texto base:** `text-sm font-normal`

## 4. Componentes Globales a Construir por el Agente

### A. `<GlassCard>`
Un contenedor base para casi toda la UI.
*   Debe usar `<BlurView intensity={20} tint="dark">` de expo-blur.
*   Estilos Tailwind: `rounded-2xl border border-white/5 overflow-hidden`.
*   Si es interactivo (ej. seleccionar producto), debe estar envuelto en `<TouchableOpacity activeOpacity={0.8}>`.

### B. `<AuraBackground>`
Un componente que se coloca detrás de las vistas principales (`z-index: -1`).
*   Consta de círculos absolutos grandes (ej. `w-72 h-72 rounded-full absolute top-[-10%] left-[-20%]`) con colores `indigo-600/30` y `fuchsia-600/20`.

### C. Íconos con Fondo Degradado
Las tarjetas de categorías (Parlantes, iPhone, etc.) deben tener un ícono dentro de un cuadrado con bordes redondeados y un fondo degradado (ej. de azul a cian, de rojo a rosa) para dar un toque de color vibrante sobre el tema oscuro.

## 5. Especificaciones por Pantalla

### Pantalla 1: Login / Registro
*   **Layout:** Contenido centrado verticalmente. Fondo `AuraBackground`.
*   **Inputs:** Estilo `<GlassCard>` pero como `<TextInput>`. Sin fondo blanco opaco; texto blanco, placeholder gris (`placeholder-slate-500`).
*   **Botón Principal:** Gradiente índigo/púrpura o un azul vibrante, texto blanco, `rounded-xl`, sombra de color.
*   **Animación:** Los elementos deben aparecer suavemente usando `FadeInUp` (Reanimated).

### Pantalla 2: Dashboard (Selección de Producto / Salas)
*(Ref: Basado en el prototipo index.html previamente validado)*
*   **Header:** Saludo "Hola, [Nombre]" y un "badge" de rol con borde brillante.
*   **Lista de Salas:** Una columna de `<GlassCard>` interactivas.
*   **Contenido de Tarjeta:** Ícono degradado a la izquierda, Título y subtítulo en el centro, ícono "caret-right" a la derecha indicando acción.
*   **Feedbacks:** Al tocar la tarjeta, debe reducirse sutilmente la opacidad (comportamiento por defecto de TouchableOpacity).

### Pantalla 3: Información de Sala (Antes del Chat)
*   **Layout:** Imagen del producto grande (o un ícono ilustrativo enorme) en la parte superior.
*   **Detalles:** Debajo de la imagen, una superficie curva de cristal que se desliza hacia arriba cubriendo el resto de la pantalla.
*   **Información:** Título, características breves y un botón flotante (FAB) enorme y fijo en la parte inferior ("Iniciar Chat").

### Pantalla 4: Pantalla de Chat Realtime
*   **Header:** Minimalista, con botón de retroceso a la izquierda y el nombre de la sala/producto centrado.
*   **Lista de Mensajes (ScrollView/FlatList):**
    *   **Burbujas Propias (Derecha):** Fondo gradiente o un azul/índigo sólido pero vibrante. Esquinas redondeadas, excepto la inferior derecha (ej. `rounded-2xl rounded-br-sm`). Texto blanco.
    *   **Burbujas Otro Usuario (Izquierda):** Estilo `<GlassCard>` (fondo gris oscuro translúcido, borde sutil). Esquinas redondeadas excepto la inferior izquierda (ej. `rounded-2xl rounded-bl-sm`). Texto blanco.
*   **Input Box (Footer):** Fijo en la parte inferior. Efecto de cristal. El botón de enviar debe iluminarse solo cuando hay texto.
*   **Teclado:** Debe implementarse un `KeyboardAvoidingView` nativo de React Native para asegurar que el área de escritura nunca quede oculta por el teclado del dispositivo móvil.

## 6. Instrucción Especial (Clean Architecture & SOLID)
*Todos los componentes visuales de React Native descritos aquí deben ubicarse en la capa de **Presentación** (`/src/features/chat/presentation/` o `/src/features/auth/presentation/`). Los componentes de UI NO deben importar librerías de base de datos (Supabase/Appwrite) directamente. Deben recibir datos y disparar acciones a través de Custom Hooks que interactúen con la capa de Aplicación/Casos de Uso.*
```eof

### ¿Cómo usar este archivo con tu Agente de IA?

Cuando vayas a pedirle a tu agente que cree o modifique una pantalla, simplemente dile:

> *"Agente, por favor implementa la pantalla de [Nombre de Pantalla, ej: Chat] siguiendo estrictamente el diseño y las instrucciones definidas en el archivo `UI.md`."*

El agente leerá las directrices de Tailwind, los componentes que debe crear y los colores exactos, asegurando que toda tu aplicación se vea como una obra de arte unificada.
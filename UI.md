# INSTRUCCIONES ESTRICTAS DE REDISEÑO UI: TEMA "CYBERPUNK / GAMER AVANZADO"

## 1. Contexto y Límites (CRÍTICO)
Estás trabajando en un proyecto React Native con Expo (Clean Architecture). 
**REGLA DE ORO:** SOLO puedes modificar los estilos visuales (`StyleSheet` y estructura JSX) dentro de la carpeta `app/`. 
NO toques la lógica de estado, NO cambies las firmas de las funciones, NO modifiques hooks, repositorios ni dependencias de Supabase.

## 2. Objetivo Visual
El diseño actual (fondo azul/negro liso) es inaceptable. Debes implementar un diseño "Cyberpunk/Gamer" complejo, caracterizado por tarjetas con fondo, bordes asimétricos o de neón, sombras sólidas, tipografía futurista y estructura visual jerárquica.

## 3. Configuración del Tema Global (Navigation/Layout)
En `app/(app)/_layout.tsx` y `app/(auth)/_layout.tsx`:
*   Elimina la barra superior azul por defecto de React Navigation (`headerShown: false` o personalízala profundamente con fondo `#050505` y texto `#00f0ff`).

## 4. Instrucciones Específicas por Pantalla

### A. Pantalla de Salas (`app/(app)/index.tsx`)
1.  **Fondo:** Todo el contenedor principal debe tener `backgroundColor: '#050505'`.
2.  **Tarjetas de Sala (RoomCard):** 
    *   No uses simples bordes inferiores. Convierte cada sala en una tarjeta "aislada" (margin vertical).
    *   Fondo de la tarjeta: `#0f0f16` (Gris muy oscuro).
    *   Borde: `borderWidth: 1`, `borderColor: '#2a2a3d'`.
    *   `borderRadius: 8`.
    *   Añade un acento visual izquierdo: un borde izquierdo más grueso (`borderLeftWidth: 4`) de color `#00f0ff` (Cyan) o `#fcee0a` (Amarillo cyberpunk).
    *   Estructura interna: Usa Flexbox para poner un ícono representativo a la izquierda (usa `@expo/vector-icons`), el nombre de la sala al centro y la fecha a la derecha.
3.  **Botón Flotante (FAB):**
    *   Color de fondo: `#00f0ff` (Cyan).
    *   Sombra de neón: `shadowColor: '#00f0ff'`, `shadowOffset: { width: 0, height: 0 }`, `shadowOpacity: 0.8`, `shadowRadius: 10`, `elevation: 10`.
    *   Icono: Signo `+` en color negro (para contraste).

### B. Pantalla de Chat (`app/(app)/chat/[roomId].tsx`)
1.  **Fondo:** `backgroundColor: '#050505'`.
2.  **Burbujas de Mensajes:** ¡Hazlas dinámicas e interesantes!
    *   **Mensaje Propio (`isOwn = true`):**
        *   Alineación a la derecha.
        *   Fondo: `#002b33` (Verde oscuro/Cyan oscuro).
        *   Borde: `borderRightWidth: 3`, `borderColor: '#00f0ff'`.
        *   Color del texto: `#00f0ff`.
        *   Esquinas redondeadas excepto la inferior derecha (`borderBottomRightRadius: 0`).
    *   **Mensaje de Otro Usuario (`isOwn = false`):**
        *   Alineación a la izquierda.
        *   Añade un pequeño círculo o cuadrado junto a la burbuja con la inicial del usuario (`avatar`).
        *   Fondo de burbuja: `#1a1a26`.
        *   Borde: `borderLeftWidth: 3`, `borderColor: '#ff003c'` (Magenta).
        *   Color del texto: `#FFFFFF`.
        *   Nombre del autor arriba de la burbuja, en color `#ff003c` y mayúsculas, tamaño pequeño (`fontSize: 10`).
        *   Esquinas redondeadas excepto la inferior izquierda (`borderBottomLeftRadius: 0`).
3.  **Input Area (Footer):**
    *   Contenedor con fondo `#0f0f16` y borde superior.
    *   El `TextInput` debe verse integrado (sin bordes propios fuertes), rodeado por un contenedor con borde `#2a2a3d`. Al hacer focus (usa estado local si es necesario, o delega a la UI básica), el borde cambia a `#00f0ff`.
    *   Botón de enviar: Cuadrado, color `#00f0ff`, ícono negro.

### C. Tipografía
Si es posible, instruye importar y usar `Orbitron` para títulos (como "Salas", o el Header del Chat) y `Rajdhani` o `Inter` para los mensajes. Si prefieres no lidiar con instalación de fuentes, usa la configuración por defecto de fuentes del sistema pero en `fontWeight: 'bold'` o `'900'` para títulos, forzando `textTransform: 'uppercase'` donde aplique para darle un toque tecnológico.

## Ejecución
Re-escribe los componentes JSX y los objetos `StyleSheet.create` aplicando **estrictamente** esta paleta y estructura geométrica/tarjetas descrita.
```eof

Pasa este nuevo prompt a tu agente. Le he prohibido explícitamente usar estilos genéricos y le he detallado cómo construir los bordes asimétricos (`borderLeftWidth`, radios asimétricos) y las sombras brillantes para emular de la mejor forma posible el estilo del HTML en los componentes de React Native.
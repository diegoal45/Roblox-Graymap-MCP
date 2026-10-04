# 🧱 Roblox Studio Graybox MCP (for OpenCode)

<p align="center">
  <img src="https://img.shields.io/badge/Roblox_Studio-00A2FF?style=for-the-badge&logo=roblox&logoColor=white" alt="Roblox Studio" />
  <img src="https://img.shields.io/badge/OpenCode-MCP_Agent-black?style=for-the-badge" alt="OpenCode" />
  <img src="https://img.shields.io/badge/Node.js-20+-339933?style=for-the-badge&logo=node.js&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/Luau-00A2FF?style=for-the-badge&logo=lua&logoColor=white" alt="Luau" />
  <img src="https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge" alt="License" />
</p>

<p align="center">
  <b>Un servidor Model Context Protocol (MCP) especializado en Level Design, Prototipado y Grayboxing (Blockout) paramétrico en tiempo real para Roblox Studio con integración directa en OpenCode.</b>
</p>

---

## 📑 Tabla de Contenidos
- [✨ Características Principales](#-características-principales)
- [📐 Métricas Oficiales de Graybox (Avatar R15)](#-métricas-oficiales-de-graybox-avatar-r15)
- [🏗️ Arquitectura del Sistema](#️-arquitectura-del-sistema)
- [🛠️ Herramientas MCP (Tools Reference)](#️-herramientas-mcp-tools-reference)
- [🚀 Guía de Instalación Paso a Paso](#-guía-de-instalación-paso-a-paso)
  - [1. Configuración de Roblox Studio y Plugin](#1-configuración-de-roblox-studio-y-plugin)
  - [2. Configuración en OpenCode](#2-configuración-en-opencode)
- [💬 Ejemplos de Prompts y Flujos de Trabajo](#-ejemplos-de-prompts-y-flujos-de-trabajo)
- [↩️ Soporte Nativo para Deshacer/Rehacer (Ctrl + Z)](#️-soporte-nativo-para-deshacerrehacer-ctrl--z)
- [🔧 Solución de Problemas (Troubleshooting)](#-solución-de-problemas-troubleshooting)
- [📄 Licencia](#-licencia)

---

## ✨ Características Principales

- 🎮 **Geometría Calibrada para Avatares**: Todas las estructuras (escaleras, puertas, pasillos y coberturas) respetan la física de colisión, salto y visión de Roblox.
- 🚪 **Vanos de Puerta Transitables Automáticos**: Corta paredes en segmentos izquierdo, derecho y dintel superior para crear pasos libres para los jugadores sin requerir CSG/Booleanas complejas.
- 🪜 **Generador de Escaleras Funcionales**: Calcula la altura de paso ($\le 1.1\text{ studs}$) para que el avatar suba caminando de forma fluida sin atascarse.
- 🎯 **Coberturas Tácticas por Color**: Paleta visual clara de nivel (piso gris oscuro, paredes neutras, cobertura baja en naranja y cobertura alta en azul acero).
- 🔄 **Soporte `Ctrl + Z` (Undo / Redo)**: Cada comando ejecutado por OpenCode se encapsula en `ChangeHistoryService` de Roblox Studio. Si no te gusta el resultado, presionas `Ctrl + Z` y se deshace instantáneamente.
- ⚡ **Latencia Ultra Baja**: Comunicación local vía HTTP en `127.0.0.1:30250` sin necesidad de subir nada a la nube o publicar el juego.

---

## 📐 Métricas Oficiales de Graybox (Avatar R15)

El MCP utiliza las dimensiones estándar del motor de Roblox para garantizar que todo lo generado sea 100% jugable:

| Elemento | Dimensión | Justificación Mecánica |
| :--- | :--- | :--- |
| **Avatar R15 (Hitbox)** | `4 x 5 x 2 studs` | Ancho, Alto, Profundidad del personaje |
| **Paso de Escalón (Max)** | `1.2 studs` | Límite del motor de física para subir caminando sin saltar |
| **Peldaño Recomendado** | `Alto: 0.8 st, Huella: 2.0 st` | Subida fluida a velocidad normal (`16 studs/s`) |
| **Salto Estándar** | `7.2 studs` | Altura máxima con `JumpHeight` estándar |
| **Vano de Puerta** | `5 x 8.5 studs` | Permite el paso holgado incluso con sombreros y accesorios |
| **Pasillo Mínimo** | `8 studs` | 1 jugador con holgura para rotación de cámara |
| **Pasillo de Combate** | `12 - 16 studs` | Combate fluido entre dos o más jugadores |
| **Cobertura Baja** | `3.0 studs` | Permite disparar/asomarse agachado o de pie |
| **Cobertura Alta** | `6.5 studs` | Cobertura total de cuerpo completo |

---

## 🏗️ Arquitectura del Sistema

```
┌────────────────────────────────┐                 ┌────────────────────────────────────────┐
│     Terminal / IDE             │                 │   Servidor Local Node.js               │
│                                │      stdio      │   (roblox-graybox-mcp)                 │
│  ┌──────────────────────────┐  │ ──────────────► │  ┌──────────────────────────────────┐  │
│  │         OpenCode         │  │                 │  │   Servidor MCP (@modelcontext)   │  │
│  └──────────────────────────┘  │ ◄────────────── │  └─────────────────┬────────────────┘  │
└────────────────────────────────┘                 │                    │ Genera Luau       │
                                                   │                    ▼                   │
                                                   │  ┌──────────────────────────────────┐  │
                                                   │  │   Bridge HTTP (127.0.0.1:30250)   │  │
                                                   │  └─────────────────▲────────────────┘  │
                                                   └────────────────────┼───────────────────┘
                                                                        │ GET /poll
                                                                        │ POST /response
                                                   ┌────────────────────┴───────────────────┐
                                                   │   Roblox Studio (Sesión Activa)        │
                                                   │  ┌──────────────────────────────────┐  │
                                                   │  │   Plugin: GrayboxBridge          │  │
                                                   │  │   (ChangeHistoryService)         │  │
                                                   │  └─────────────────┬────────────────┘  │
                                                   │                    ▼                   │
                                                   │  ┌──────────────────────────────────┐  │
                                                   │  │   Workspace.Graybox (Ctrl + Z)   │  │
                                                   │  └──────────────────────────────────┘  │
                                                   └────────────────────────────────────────┘
```

---

## 🛠️ Herramientas MCP (Tools Reference)

### 1. `check_studio_connection`
Comprueba si Roblox Studio está abierto y si el plugin local está enviando latidos (*heartbeats*) al bridge.
- **Parámetros:** Ninguno.
- **Retorno:** Estado de la conexión (🟢 Conectado / 🔴 Desconectado) y segundos desde el último ping.

### 2. `create_room`
Construye una habitación paramétrica con suelo y 4 paredes, con soporte para puertas transitables.
- **Parámetros:**
  - `name` *(string)*: Nombre del modelo en `Workspace.Graybox`.
  - `x`, `y`, `z` *(number)*: Coordenadas centrales del suelo.
  - `width` *(number)*: Ancho sobre el eje X (studs, defecto: 30).
  - `length` *(number)*: Largo sobre el eje Z (studs, defecto: 30).
  - `height` *(number)*: Altura de las paredes (studs, defecto: 12).
  - `wallThickness` *(number)*: Grosor de paredes (defecto: 1).
  - `hasCeiling` *(boolean)*: Generar techo o dejar abierto (defecto: false).
  - `doors` *(array)*: Lista de vanos de puertas:
    - `wall`: `"North"`, `"South"`, `"East"`, o `"West"`.
    - `width`: Ancho del vano (defecto: 6 studs).
    - `height`: Alto del vano (defecto: 8.5 studs).
    - `offset`: Desplazamiento respecto al centro de la pared.

### 3. `create_stairs`
Genera una escalera con escalones sólidos transitables.
- **Parámetros:**
  - `startX`, `startY`, `startZ` *(number)*: Punto inicial en el suelo.
  - `width` *(number)*: Ancho de la escalera (defecto: 6).
  - `totalHeight` *(number)*: Altura vertical total a subir.
  - `stepDepth` *(number)*: Profundidad de cada huella (defecto: 2.0 studs).
  - `direction` *(string)*: `"+Z"`, `"-Z"`, `"+X"`, o `"-X"`.
  - `includeTopPlatform` *(boolean)*: Añadir plataforma de descanso en la cima.
  - `topPlatformLength` *(number)*: Largo de la plataforma superior.

### 4. `place_cover`
Coloca coberturas tácticas alineadas al sistema de combate.
- **Parámetros:**
  - `x`, `y`, `z` *(number)*: Coordenadas.
  - `type` *(enum)*:
    - `"low"`: 3 studs de alto (Naranja).
    - `"high"`: 6.5 studs de alto (Azul acero).
    - `"l_shape"`: Cobertura en ángulo para esquinas.
    - `"pillar"`: Columna $4 \times 4\text{ studs}$.
  - `length` *(number)*: Longitud de la cobertura recta.
  - `rotationY` *(number)*: Grados de rotación sobre el eje Y.

### 5. `generate_arena`
Genera una arena táctica simétrica completa de 3 carriles lista para jugar.
- **Componentes incluidos:** Perímetro cerrado, zona de Spawn Equipo A (Norte), Spawn Equipo B (Sur), plataforma central elevada con rampas y bandera de objetivo, pilares para romper líneas de visión directas (*Line-of-Sight*) y coberturas de flanqueo simétricas.
- **Parámetros:** `name`, `centerX`, `centerY`, `centerZ`, `sizeX`, `sizeZ`, `wallHeight`, `includeCentralPlatform`.

### 6. `clear_graybox`
Elimina la carpeta `Workspace.Graybox` en Studio para limpiar el mapa y reiniciar.

### 7. `execute_raw_luau`
Permite a OpenCode generar y ejecutar código Luau libre para geometrías complejas, rampas curvas o mecánicas específicas.

---

## 🚀 Guía de Instalación Paso a Paso

### 1. Configuración de Roblox Studio y Plugin

> [!IMPORTANT]
> Debes habilitar las peticiones HTTP en Roblox Studio para permitir la conexión local con el bridge.

1. Abre tu proyecto en **Roblox Studio** (o crea un nuevo mapa con la plantilla **Baseplate**).
2. Ve a la pestaña **Home** > botón **Game Settings** (si el juego no está guardado en la nube, guárdalo primero como archivo o en Roblox para habilitar el menú).
3. Selecciona **Security** > activa el interruptor **Allow HTTP Requests** y haz clic en **Save**.
4. En la barra superior, ve a la pestaña **Plugins** y haz clic en el botón **Plugins Folder**.
5. Copia el archivo `roblox-plugin/GrayboxBridge.server.luau` y pégalo dentro de la carpeta que se abrió (`%LOCALAPPDATA%\Roblox\Plugins`).
6. En la pestaña **Plugins** de Studio verás aparecer el grupo **Graybox MCP** con el botón activo en verde:
   ```text
   [Graybox MCP] 🟢 Bridge ACTIVO - Escuchando en http://127.0.0.1:30250
   ```

---

### 2. Configuración en OpenCode

En la raíz del proyecto ya cuentas con el archivo `opencode.json` configurado:

```jsonc
{
  "$schema": "https://opencode.ai/config.json",
  "mcp": {
    "roblox-graybox": {
      "type": "local",
      "command": [
        "node",
        "C:/Users/dtc59/Desktop/roblox-graybox-mcp/src/index.js"
      ],
      "enabled": true
    }
  }
}
```

> [!TIP]
> Si deseas usar este MCP globalmente desde cualquier carpeta donde abras OpenCode, añade ese mismo bloque dentro de tu archivo global `~/.config/opencode/opencode.json`.

Inicia OpenCode desde tu terminal en la carpeta del proyecto:

```bash
cd C:\Users\dtc59\Desktop\roblox-graybox-mcp
opencode
```

---

## 💬 Ejemplos de Prompts y Flujos de Trabajo

Una vez abierto OpenCode, puedes hablarle de forma natural para diseñar niveles:

### 1. Verificación inicial
> *"Comprueba si Roblox Studio está conectado al servidor MCP."*

### 2. Sala principal con puertas transitables
> *"Crea una habitación graybox de 40x40 studs llamada 'ControlRoom' en la posición (0, 0, 0) con una pared de 14 studs de alto y una puerta transitable en la pared Norte."*

### 3. Conexión vertical con escaleras
> *"Desde la puerta de la pared Norte, crea una escalera de 6 studs de ancho que suba 12 studs de altura en dirección +Z con una plataforma de descanso al final."*

### 4. Segundo piso conectado
> *"En la cima de las escaleras, crea una segunda habitación elevada de 30x30 studs con una puerta en la pared Sur que conecte con la escalera."*

### 5. Coberturas tácticas para combate
> *"Coloca 4 coberturas bajas dispuestas en cruz en el centro de la sala y dos columnas altas a los costados para romper las líneas de visión."*

### 6. Arena completa en un solo comando
> *"Genera una arena táctica de 80x80 studs centrada en (0, 0, 0) con plataforma central y zonas de spawn para dos equipos."*

---

## ↩️ Soporte Nativo para Deshacer/Rehacer (Ctrl + Z)

Cada operación enviada desde OpenCode se procesa a través de la API `ChangeHistoryService:TryBeginRecording()` de Roblox Studio:

- **Deshacer**: Presiona `Ctrl + Z` en Roblox Studio para revertir cualquier generación inmediatamente.
- **Rehacer**: Presiona `Ctrl + Y` para restaurarla.
- **Aislamiento**: Todo se crea bajo la carpeta `workspace.Graybox`, manteniendo tu jerarquía de `Workspace` limpia y organizada.

---

## 🔧 Solución de Problemas (Troubleshooting)

### Error: `Timeout: Roblox Studio no está conectado al bridge`
- **Causa**: El plugin de Roblox Studio no está corriendo o las peticiones HTTP están bloqueadas.
- **Solución**:
  1. Verifica que en Roblox Studio el botón de la barra de plugins **Graybox MCP** esté en verde.
  2. Confirma que en **Game Settings > Security** la opción **Allow HTTP Requests** esté en **ON**.
  3. Comprueba que el puerto local `30250` no esté bloqueado por un firewall local.

### El plugin no aparece en Roblox Studio
- Puedes ejecutarlo directamente como prueba: copia el código de `GrayboxBridge.server.luau`, crea un `Script` dentro de `ServerScriptService` en el Explorador de Studio y pega el código.

### Los escalones quedan demasiado altos
- El generador divide automáticamente cualquier altura para que ningún escalón supere los $1.1\text{ studs}$. Si deseas escalones aún más suaves, puedes especificar más peldaños o ajustar `stepDepth` en OpenCode.

---

## 📄 Licencia

Este proyecto está distribuido bajo la licencia MIT. Eres libre de usarlo, modificarlo y adaptarlo a cualquier juego o experiencia de Roblox Studio.
#   R o b l o x - G r a y m a p - M C P  
 
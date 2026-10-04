# Roblox Studio Graybox & Level Design MCP (para OpenCode)

Servidor Model Context Protocol (MCP) de nivel profesional para **Level Design**, **Prototipado Rápido** y **Grayboxing (Blockout)** paramétrico en tiempo real para **Roblox Studio**, diseñado para conectarse directamente con **OpenCode**.

Permite que una IA en OpenCode genere geometría modular, habitaciones huecas con vanos de puerta transitables, escaleras con peldaños calibrados, cuñas (rampas), escaleras técnicas (TrussPart) y estructuras completas de cualquier escala, con **soporte nativo de Deshacer/Rehacer (`Ctrl + Z`)**.

---

## 1. Arquitectura del Sistema

```text
 ┌──────────────┐         stdio          ┌────────────────────────────────────────┐
 │   OpenCode   │ ◄────────────────────► │          Servidor MCP Graybox          │
 │ (AI Client)  │                        │          (Node.js / Express)           │
 └──────────────┘                        └───────────────────┬────────────────────┘
                                                             │ Local HTTP (Port 30250)
                                                             │ • GET /poll (Batch Luau)
                                                             │ • POST /response (Feedback Loop)
                                                             ▼
                                         ┌────────────────────────────────────────┐
                                         │         Roblox Studio Plugin           │
                                         │         (ChangeHistoryService)         │
                                         └───────────────────┬────────────────────┘
                                                             │
                                     ┌───────────────────────┴───────────────────────┐
                                     ▼                                               ▼
                         ┌───────────────────────┐                       ┌───────────────────────┐
                         │   Workspace.Graybox   │                       │     Feedback Loop     │
                         │ (Jerarquías / Tags)   │                       │ (get_workspace_layout)│
                         └───────────────────────┘                       └───────────────────────┘
```

---

## 2. Pilares de Diseño del MCP

### 1. Sistema de Batching (Loteo Masivo)
Enviar una petición HTTP por cada ladrillo congela Roblox Studio. Este MCP implementa `build_structure(parts_list)`, permitiendo enviar **lotes de decenas o cientos de partes en un solo mensaje**, las cuales el plugin instancia en memoria de golpe en milisegundos.

### 2. Geometría Paramétrica Crítica
- **`spawn_wedge` (Cuñas / WedgePart):** Para rampas vehiculares, desniveles de terreno y cubiertas inclinadas.
- **`spawn_truss` (Escaleras técnicas / TrussPart):** Escaleras de cuadrícula escalables automáticamente por el avatar de Roblox.
- **`set_hollow_box`:** Crea habitaciones o edificios huecos completos (suelo, techo y 4 paredes con vanos de puerta) en una sola llamada.
- **`create_stairs`:** Escaleras peatonales fluidas calibradas a la altura de paso del personaje ($\le 1.1\text{ studs}$).

### 3. Organización Jerárquica Limpia (`parent`)
Evita que miles de partes inunden la raíz del Workspace. Cada herramienta incluye el parámetro `parent` (ej: `parent = "Level_1/Zone_A"` o `parent = "Interiors/Room_01"`). El plugin crea automáticamente las subcarpetas necesarias en el árbol de instancias.

### 4. Atributos de Juego y Etiquetas (CollectionService)
Permite asignar Tags de CollectionService y atributos de juego (`SetAttribute`) directamente desde OpenCode (ej: `"SpawnPoint"`, `"CaptureZone"`, `"Climbable"`, `"Cover_Low"`).

### 5. Snap to Grid (Ajuste a Rejilla)
Fuerza o redondea coordenadas X y Z a múltiplos de **4 u 8 studs** (el estándar de construcción modular de Roblox), garantizando que las piezas encajen sin huecos milimétricos.

### 6. Capacidad de Lectura en Vivo (Feedback Loop)
Mediante `get_workspace_layout()`, OpenCode puede inspeccionar las partes y modelos ya existentes en Studio (posiciones, bounding boxes y tags) para no construir encima de lo que ya modelaste manualmente.

---

## 3. Métricas Oficiales de Graybox (Avatar Roblox R15)

| Elemento | Dimensión | Justificación Mecánica |
| :--- | :--- | :--- |
| **Avatar R15 (Hitbox)** | `4 x 5 x 2 studs` | Ancho, Alto, Profundidad del personaje |
| **Salto Estándar** | `7.2 studs` de alto | Alcance vertical libre sin escalar |
| **Paso de Escalón (Max)** | `1.2 studs` de alto | Altura máxima que el avatar sube caminando sin saltar |
| **Peldaño Ideal** | Alto: `0.8 st`, Huella: `2.0 st` | Subida fluida a velocidad normal |
| **Vano de Puerta** | `5 x 8.5 studs` | Permite el paso holgado con accesorios y sombreros |
| **Pasillo Estándar** | `8 - 12 studs` | Espacio libre para 1 a 2 jugadores con cámara holgada |
| **Cobertura Baja** | `3.0 studs` | Permite asomarse o disparar agachado |
| **Cobertura Alta** | `6.5 studs` | Cobertura total de cuerpo completo de pie |

---

## 4. Herramientas Disponibles (Tools Reference)

| Herramienta | Parámetros Principales | Descripción |
| :--- | :--- | :--- |
| `check_studio_connection` | Ninguno | Comprueba si Roblox Studio y el plugin están conectados y activos. |
| `inspect_area` | `position`, `radius`, `max_results` | **Conciencia Espacial:** Consulta qué objetos existen alrededor de un punto para medir el espacio libre antes de construir. |
| `raycast_query` | `origin`, `direction`, `distance` | **Detección de Suelo (Raycast):** Mide la altura exacta del terreno, inclinación y material para asentar edificios sin que floten. |
| `get_workspace_layout` | `folder_path`, `max_depth` | **Feedback Loop:** Lee la jerarquía, bounding boxes, posiciones y tags de objetos existentes en Studio. |
| `create_street` | `start_position`, `end_position`, `road_width`, `has_lamps` | **Vía Urbana Completa:** Genera una calle con calzada de asfalto, aceras elevadas, líneas viales y farolas con luz real. |
| `spawn_prop` | `type`, `position`, `rotation_y`, `length`, `parent` | **Mobiliario Lowpoly:** Genera muebles y atrezzo táctico (`counter`, `desk`, `shelf`, `dumpster`, `barrier`, `street_lamp`, `dummy`). |
| `build_structure` | `parts_list`, `default_parent`, `snap_grid`, `auto_optimize` | **Batching Masivo + Shield:** Instancia decenas o cientos de objetos con poda de colisiones (`CanTouch = false`) y LOD `StreamingMesh`. |
| `set_hollow_box` | `name`, `position`, `size`, `doors`, `include_parapet`, `include_lighting` | **Estructura Hueca Pro:** Construye un edificio completo con cornisas de azotea (parapeto 1.5 st), luz interior en techo, zócalo y vanos. |
| `spawn_wedge` | `name`, `position`, `size`, `rotation`, `parent` | **Rampas / Cuñas:** Genera cuñas para rampas vehiculares, techos inclinados o pendientes de montaña. |
| `spawn_truss` | `name`, `position`, `height`, `parent` | **Escaleras Técnicas:** Genera escaleras verticales escalables por el avatar de Roblox. |
| `create_stairs` | `startX`, `startY`, `startZ`, `width`, `totalHeight`, `direction` | Construye escaleras peatonales fluidas ($\le 1.1\text{ studs}$ por peldaño). |
| `add_tags_and_attributes` | `target_path`, `tags`, `attributes`, `recursive` | Asigna tags de CollectionService y atributos a partes o modelos existentes en Studio. |
| `clear_folder` | `folder_path` | Elimina una carpeta específica en Workspace o todo `Graybox`. |
| `execute_raw_luau` | `code`, `actionName` | Ejecuta Luau arbitrario con soporte completo de Undo/Redo (`Ctrl + Z`). |

---

## 5. Configuración y Puesta en Marcha

### 1. Activar el Plugin en Roblox Studio
1. Abre tu proyecto o un *Baseplate* en **Roblox Studio**.
2. Ve a **Home > Game Settings > Security** y activa **Allow HTTP Requests**.
3. El plugin ya está instalado en tu carpeta `%LOCALAPPDATA%\Roblox\Plugins\`.
4. En la barra superior, pestaña **Plugins**, haz clic en el botón **Graybox MCP** para abrir la ventana acoplable lateral.

### 2. Configuración en OpenCode (`opencode.json`)
El archivo de configuración ya se encuentra en tu directorio global `~/.config/opencode/opencode.json`:

```json
{
  "$schema": "https://opencode.ai/config.json",
  "mcp": {
    "servers": {
      "roblox-graybox": {
        "type": "local",
        "command": [
          "node",
          "C:\\Users\\dtc59\\Desktop\\roblox-graybox-mcp\\src\\index.js"
        ]
      }
    }
  }
}
```

### 3. Telemetría y Análisis de Logs (`npm run logs:summary`)

Cada llamada a herramientas entre OpenCode y Roblox Studio se registra automáticamente de forma no bloqueante en formato estructurado JSON Lines (`logs/mcp-activity.jsonl`), capturando duración en milisegundos, tasa de éxito, partes creadas, carpetas afectadas y registro de errores.

Para inspeccionar las métricas de rendimiento y uso en cualquier momento desde tu terminal:
```bash
npm run logs:summary
```

Para reiniciar el historial de logs:
```bash
npm run logs:clear
```

---

## 6. Guía de Generación con OpenCode (Cómo Usarlo)

### ⚠️ Reglas de Oro al interactuar con OpenCode

1. **Abrir siempre una Nueva Sesión (`+`):**
   * En OpenCode Desktop, cada pestaña/chat fija las herramientas disponibles en el momento en que se crea.
   * Si OpenCode te responde: *"No dispongo de esa herramienta en esta sesión"*, significa que estás en un chat viejo creado antes de registrar el MCP. Simplemente haz clic en el botón **`+`** (arriba a la izquierda) para abrir un chat limpio.

2. **Habla en Lenguaje Natural (NO pegues código JSON crudo):**
   * OpenCode es un agente autónomo de IA. **No debes pegar el código JSON de la herramienta manualmente en el chat**, porque la IA pensará que es un mensaje de texto normal.
   * En su lugar, dale instrucciones en español claro describiendo lo que necesitas. La IA se encargará automáticamente de seleccionar la herramienta (`build_structure`, `set_hollow_box`, `spawn_wedge`, etc.), formatear los argumentos y enviarlos a Roblox Studio.

---

### 💬 Ejemplos de Prompts Listos para Copiar y Pegar

#### 1. Verificación Inicial de Conexión
> *"Comprueba si estás conectado a Roblox Studio usando check_studio_connection y dime qué herramientas tienes disponibles."*

#### 2. Terreno Base y Canal (Estructura Base)
> *"Usa build_structure para generar el terreno base de 4000x3600 studs en Y = 0 dentro de 'City/Terrain' y un canal central de 40 studs de ancho por 12 de profundidad con material Concrete."*

#### 3. Edificio Completo con Puerta Transitables y Tags
> *"Crea el edificio del Banco con set_hollow_box en la posición (0, 0, 0) de tamaño 40x16x40 studs guardado en 'City/Downtown/Bank', con una puerta al Norte de 8x10 studs etiquetada 'Heist_Target'."*

#### 4. Rampa de Autopista Elevada
> *"Genera una rampa con spawn_wedge de 20 studs de ancho, 12 studs de alto y 50 studs de largo en 'City/Highways/Ramp_1' con material Concrete orientada hacia el Este."*

#### 5. Escalera Técnica o Andamio
> *"Coloca una escalera técnica con spawn_truss de 24 studs de altura en la posición (30, 0, 30) dentro de 'City/Alleys/Ladder_1'."*

#### 6. Lote Masivo de Estructuras (Batching de Casas)
> *"Usa build_structure para generar en un solo lote 10 casas modulares de 20x12x20 studs escalonadas sobre el eje X a intervalos de 28 studs en 'City/Residential/Blocks'."*

#### 7. Feedback Loop (Leer lo que ya está en Studio antes de construir)
> *"Usa get_workspace_layout para inspeccionar la carpeta 'City' y dime qué edificios existen actualmente y en qué coordenadas están para no construir encima."*

#### 8. Deshacer Cambios Inmediatamente
> Si cualquier diseño generado no te convence, no tienes que pedirle a la IA que lo borre: presiona **`Ctrl + Z`** directamente en **Roblox Studio** y el último lote se deshará instantáneamente. Si presionas **`Ctrl + Y`**, se restaurará.

---

## 6. Documentación Adicional y Especificaciones Técnicas

- 📐 **[CITY_SPEC_AND_API.md](file:///C:/Users/dtc59/Desktop/roblox-graybox-mcp/CITY_SPEC_AND_API.md)**: Especificación urbana de la metrópoli de 5 distritos ($4000 \times 3600\text{ studs}$), zonificación, elevaciones y esquemas JSON.
- 🏛️ **[PROCEDURAL_ARCHITECTURE_SPEC.md](file:///C:/Users/dtc59/Desktop/roblox-graybox-mcp/PROCEDURAL_ARCHITECTURE_SPEC.md)**: Especificación técnica completa del motor de generación procedural: arquitectura híbrida, presets de estilo y materiales PBR, fachadas 3D paramétricas, macro-urbanismo (`generate_district`), iluminación cinemática y fallback de assets.
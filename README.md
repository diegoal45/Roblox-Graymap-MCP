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
| `generate_terrain` | `center`, `size`, `biome`, `base_height`, `height_amplitude`, `water_level`, `seed` | **Paisajes Procedurales Voxel:** Genera biomas de alta fidelidad (`mountains`, `hills`, `canyon`, `plains`, `dunes`, `island`, `river_valley`, `plateau`) con pendientes calculadas y cuerpos de agua nativos. |
| `flatten_terrain_area` | `position`, `size`, `material`, `foundation_depth`, `clear_height`, `blend_margin`, `retaining_wall` | **Nivelado de Parcelas:** Despeja montes con `Air` y rellena cimientos sólidos nivelados para asentar rascacielos, plazas o autopistas sin que floten ni se entierren. |
| `carve_terrain_path` | `start_point`, `end_point`, `waypoints`, `width`, `height`, `mode`, `surface_material` | **Trazado de Rutas en Terreno:** Excava carreteras a cielo abierto, túneles subterráneos abovedados (sin destruir la cima), canales fluviales navegables con agua o trincheras. |
| `shape_terrain` | `shape`, `operation`, `position`, `size`, `radius`, `rotation`, `material` | **Esculpido Paramétrico:** Inserta o sustrae primitivas de volumen (`Block`, `Ball`, `Cylinder`, `Wedge`) con adición de material o excavación con `Air`. |
| `paint_terrain_material` | `mode`, `center`, `size`, `target_material`, `source_material`, `region_bounds` | **Pintor de Materiales:** Pinta cajas/esferas o ejecuta sustitución nativa `Terrain:ReplaceMaterial` (ej: cambiar todo `Grass` por `Snow` o `Sandstone`). |
| `clear_terrain` | `all`, `region_bounds` | **Limpieza de Terreno:** Elimina todo el terreno del mundo (`workspace.Terrain:Clear()`) o un sector específico con soporte `Ctrl + Z`. |
| `generate_district` | `name`, `center`, `size`, `style`, `density`, `street_width`, `has_furniture`, `align_to_terrain` | **Generador Urbano Macro AAA:** Crea distritos completos con asfalto, bordillos de granito, pasos de cebra, parcelas densas (sin huecos vacíos), rascacielos/edificios 3D con toldos, farolas y árboles. |
| `build_detailed_structure` | `name`, `position`, `footprint`, `floors`, `style`, `seed`, `has_roof_props` | **Edificio Arquitectónico AAA:** Edificio multinivel con zócalo plinto, escaparates comerciales, toldos 45°, ventanas 3D con alféizar e iluminación interior realista, y azotea habitable con HVAC, tanque y antenas. |
| `setup_environment` | `preset`, `clock_time`, `enable_future_lighting`, `shadow_softness` | **Atmósfera Cinemática:** Configura iluminación Future, sombras suaves y post-procesado (Atmosphere volumétrica, Bloom, ColorCorrection, SunRays). |
| `populate_street_furniture` | `center`, `length`, `orientation`, `sidewalk_offset`, `interval`, `trees`, `lamps` | **Dressing de Aceras:** Puebla aceras con farolas con luz y sombra real, árboles en alcorques de fundición, bancos, papeleras y bocas de incendio. |
| `execute_raw_luau` | `code`, `actionName` | Ejecuta Luau arbitrario con soporte completo de Undo/Redo (`Ctrl + Z`). |

---

## 5. Motor de Terreno Nativo de Roblox (Smooth Terrain Engine)

El módulo de terrenos aprovecha al 100% el motor de voxeles a resolución de cuadrícula de 4 studs de Roblox (`workspace.Terrain`), ofreciendo:

### 1. Biomas Procedurales Disponibles (`generate_terrain`)
* **`mountains`:** Cumbres escarpadas con picos nevados (`Snow`), laderas empinadas de roca (`Rock`/`Slate`) y valles fértiles (`Grass`).
* **`hills`:** Colinas suaves onduladas con hierba continua, ideales para expansiones suburbanas o valles abiertos.
* **`canyon`:** Mesetas escalonadas y gargantas secas compuestas de estratos de arenisca (`Sandstone`) y roca.
* **`plains`:** Praderas con microondulaciones naturales, perfectas para colocar distritos urbanos masivos.
* **`dunes`:** Desierto con crestas sinuosas de arena cálida (`Sand`).
* **`island`:** Isla oceánica con máscara radial de caída, playas periféricas de arena suave (`Sand`) y océano (`Water`).
* **`river_valley`:** Valle atravesado por un cauce fluvial sinuoso relleno de agua y lecho arenoso.
* **`plateau`:** Meseta tabular de cumbre completamente plana para fortalezas o bases elevadas.

### 2. Nivelado de Parcelas Urbanas (`flatten_terrain_area`)
Soluciona el problema de asentar edificios en terrenos accidentados:
1. **Despeje aéreo:** Excava con `Air` cualquier monte o ladera que atraviese el volumen del edificio.
2. **Cimentación sólida:** Rellena las depresiones inferiores con una losa sólida de hormigón, adoquines o piedra hasta la cota `targetY`.
3. **Muros de contención opcionales:** Instancia muros perimetrales de hormigón si la excavación genera cortes de tierra verticales.

### 3. Trazado de Carreteras y Túneles Subterráneos (`carve_terrain_path`)
* En modo **`tunnel`**, utiliza perforación cilíndrica con `Air` en el subsuelo, **manteniendo intactos la montaña, vegetación y suelo superior**.
* En modo **`road`**, realiza desmonte a cielo abierto y asfalta la rasante.
* En modo **`river`**, excava una cuenca y la llena con `Water` y lecho de arena.

---

## 6. Motor Urbano y Arquitectónico AAA (Procedural City Engine)

Resuelve de raíz el problema de las ciudades planas, repetitivas y con edificios dispersos ("cajitas vacías flotando"):

### 1. Generación de Distritos Densos y Cohesivos (`generate_district`)
* **Manzanas compactas:** Subdivide cada manzana en parcelas adyacentes conectadas por callejones de servicio (4 a 6 studs), eliminando los huecos desiertos no urbanizados.
* **Calzadas y Aceras Reales:** Asfalto oscuro rebajado, bordillos perimetrales elevados de granito (+0.6 studs) y pasos de cebra blancos en las esquinas.
* **Nivelado de Terreno Automático:** Si `align_to_terrain = true`, el motor nivela y asienta una base sólida debajo del distrito para que ningún edificio flote sobre desniveles.
* **Mobiliario Integrado:** Instancia automáticamente farolas de luz cálida con sombras reales proyectadas, árboles en alcorques de fundición y bocas de incendio.

### 2. Edificios Arquitectónicos con Relieve 3D (`build_detailed_structure`)
* **Zócalo Plinto:** Sobresale 0.4 studs de la fachada y se clava 4 studs en el suelo para evitar que el edificio flote en pendientes.
* **Planta Baja Comercial:** Escaparates de suelo a techo con cristal reflectante, toldos de lona a 45° (`WedgePart`), portal remetido hacia el interior con doble puerta acristalada y rótulos comerciales con luz suave.
* **Pisos Superiores:** Cornisas divisorias horizontales, pilastras estructurales en las esquinas y ventanas modulares con alféizar y marco 3D.
* **Iluminación Interior Heterogénea:** Un porcentaje pseudoaleatorio de ventanas (~40%) emite luz cálida o fría simulando actividad humana real, logrando un skyline nocturno vivo y cinemático.
* **Azoteas Habitables:** Parapetos tácticos de 2.4 studs (cobertura para combate), caseta de acceso a escaleras, unidades de climatización HVAC con ventiladores, tanque de agua cilíndrico sobre zancos y antena de telecomunicaciones con baliza roja brillante.

### 3. Paletas de Estilo PBR (`modern_downtown`, `classic_brick`, `cyberpunk`, `industrial`, `favela`)
Cada estilo define materiales físicos nativos de Roblox (`Concrete`, `Brick`, `Metal`, `DiamondPlate`, `WoodPlanks`, `Glass`), reflectancias y contrastes cromáticos coherentes.

### 4. Iluminación y Post-Procesado Cinemático (`setup_environment`)
Inyecta `Technology = Future`, `Atmosphere` volumétrica, `BloomEffect`, `ColorCorrectionEffect` y `SunRaysEffect` con presets cinematográficos (`cyberpunk_night`, `golden_hour`, `overcast_fog`, `sunny_noon`, `rainy_noir`).

---

## 7. Configuración y Puesta en Marcha

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

## 8. Guía de Generación con OpenCode (Cómo Usarlo)

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
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
| `get_workspace_layout` | `folder_path`, `max_depth` | **Feedback Loop:** Lee la jerarquía, bounding boxes, posiciones y tags de objetos existentes en Studio. |
| `build_structure` | `parts_list`, `default_parent`, `snap_grid`, `action_name` | **Batching Masivo:** Instancia decenas o cientos de objetos (Bloques, Cuñas, Truss, Cilindros) en una sola llamada. |
| `set_hollow_box` | `name`, `position`, `size`, `parent`, `doors`, `tags`, `attributes` | **Estructura Hueca:** Construye una habitación o edificio completo con suelo, techo, 4 paredes y vanos de puerta transitables. |
| `spawn_wedge` | `name`, `position`, `size`, `rotation`, `parent`, `tags`, `attributes` | **Rampas / Cuñas:** Genera cuñas para rampas vehiculares, techos inclinados o pendientes. |
| `spawn_truss` | `name`, `position`, `height`, `parent`, `tags`, `attributes` | **Escaleras Técnicas:** Genera escaleras verticales escalables por el avatar. |
| `add_tags_and_attributes` | `target_path`, `tags`, `attributes`, `recursive` | Asigna tags de CollectionService y atributos a partes o modelos existentes en Studio. |
| `create_stairs` | `startX`, `startY`, `startZ`, `width`, `totalHeight`, `direction` | Construye escaleras peatonales transitables ($\le 1.1\text{ studs}$ por peldaño). |
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

---

## 6. Ejemplos de Prompts Universales para OpenCode

* **Verificación de Enlace:**
  > *"Comprueba si estás conectado a Roblox Studio."*

* **Estructura Modular con Puertas:**
  > *"Crea una estructura hueca con set_hollow_box de 40x16x40 studs llamada 'MainHall' en (0, 0, 0) dentro de 'Graybox/Building_A' con una puerta transitable en la pared Norte."*

* **Rampa y Plataforma Elevada:**
  > *"Crea una rampa spawn_wedge de 16 studs de ancho, 12 studs de alto y 48 studs de largo que suba hacia una plataforma en 'Graybox/Platforms'."*

* **Escaleras Técnicas para Avatar:**
  > *"Coloca una escalera spawn_truss de 20 studs de altura en la posición (20, 0, 20) guardada en 'Graybox/Ladders'."*

* **Inspección de lo Construido (Feedback Loop):**
  > *"Usa get_workspace_layout para leer la carpeta 'Graybox' y dime qué objetos existen y cuáles son sus coordenadas."*

* **Deshacer Cambios:**
  > Puedes presionar **`Ctrl + Z`** directamente en **Roblox Studio** en cualquier momento para revertir el último cambio generado por la IA.
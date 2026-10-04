# Roblox Studio City & Graybox MCP (para OpenCode)

Servidor Model Context Protocol (MCP) de nivel profesional para **Level Design**, **Prototipado de Ciudades a Gran Escala** y **Grayboxing** en **Roblox Studio**, integrado directamente con **OpenCode**.

Diseñado para mapas masivos (ciudades, distritos, favelas, autopistas y sistemas de territorios de pandillas) con **Batching de alto rendimiento**, **geometría avanzada (Cuñas y Truss)**, **ajuste a rejilla (Snap to Grid)**, **tags de juego (CollectionService)** y **capacidad de lectura en vivo (Feedback Loop)**, todo con soporte nativo de **Deshacer/Rehacer (`Ctrl + Z`)**.

---

## 1. Arquitectura del Sistema

```text
 ┌──────────────┐         stdio          ┌────────────────────────────────────────┐
 │   OpenCode   │ ◄────────────────────► │          Servidor MCP Graybox          │
 │ (AI Client)  │                        │          (Node.js / Express)           │
 └──────────────┘                        └───────────────────┬────────────────────┘
                                                             │ Local HTTP (Port 30250)
                                                             │ • POST /poll (Batch Luau)
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
                         │   Workspace.City      │                       │     Feedback Loop     │
                         │ (Jerarquías / Tags)   │                       │ (get_workspace_layout)│
                         └───────────────────────┘                       └───────────────────────┘
```

---

## 2. Los 6 Pilares de Diseño para Grandes Ciudades

### 1. Sistema de Batching (Loteo Masivo)
Enviar una petición HTTP por cada ladrillo congela Roblox Studio. Nuestro MCP utiliza `build_structure(parts_list)`, permitiendo que la IA envíe **50, 100 o 300 partes en un solo mensaje JSON**, y el plugin de Roblox las instancia en memoria de golpe en menos de 50 milisegundos.

### 2. Geometría Crítica para Ciudades
No solo cubos. Incluye generadores para:
- **`spawn_wedge` (Cuñas / WedgePart):** Indispensables para rampas de autopistas, calles empinadas de montaña y tejados de favela.
- **`spawn_truss` (Escaleras técnicas / TrussPart):** Escaleras de cuadrícula escalables por el avatar de Roblox, ideales para callejones estrechos, andamios y salidas de emergencia.
- **`set_hollow_box`:** Crea edificios o habitaciones huecas completas (4 paredes con vanos de puerta, suelo y techo) en una sola llamada para diseñar Bancos, Comisarías o Talleres sin escribir cada pared a mano.

### 3. Organización por Jerarquías (Folders y Distritos)
Evita que miles de partes inunden la raíz del Workspace. Cada herramienta incluye el parámetro `parent` (ejemplo: `parent = "City/Downtown/District_A/Bank"` o `parent = "Favela/Territory_B"`). El plugin crea automáticamente las subcarpetas necesarias. Esto permite pintar o modificar barrios enteros cuando una pandilla los captura.

### 4. Atributos de Juego y Etiquetas (CollectionService)
Permite asignar Tags de CollectionService y atributos de juego (`SetAttribute`) directamente desde OpenCode:
- **Tags soportados:** `"Spawn_Coche"`, `"Zona_Captura"`, `"Heist_Target"`, `"No_Escalable"`, `"Cover_Low"`.
- **Atributos de juego:** `Territory: "Ballas"`, `Health: 1000`, `Robbable: true`.

### 5. Snap to Grid (Ajuste a Rejilla)
Para que las avenidas, aceras y manzanas encajen con precisión milimétrica sin huecos donde los autos o jugadores se atasquen, el MCP fuerza o ajusta las coordenadas X y Z a múltiplos de **4 u 8 studs** (el estándar de construcción modular de Roblox).

### 6. Capacidad de Lectura en Vivo (Feedback Loop)
Mediante la herramienta `get_workspace_layout()`, OpenCode puede inspeccionar lo que ya está construido en Roblox Studio (posiciones, bounding boxes y tags). Así la IA sabe exactamente dónde está tu base o tus calles y no construye edificios encima de lo que ya modelaste.

---

## 3. Métricas Críticas en Studs (Avatar Roblox R15)

| Elemento | Dimensión | Justificación |
| :--- | :--- | :--- |
| **Avatar R15 (Hitbox)** | `4 x 5 x 2 studs` | Ancho, Alto, Profundidad del personaje |
| **Salto Estándar** | `7.2 studs` de alto | Alcance vertical libre |
| **Paso de Escalón (Max)** | `1.2 studs` de alto | Máximo que el avatar sube caminando sin saltar |
| **Peldaño Ideal** | Alto: `0.8 st`, Huella: `2.0 st` | Subida fluida a velocidad normal |
| **Vano de Puerta** | `5 x 8.5 studs` | Permite el paso holgado con sombreros y accesorios |
| **Carril de Calle (1 carril)** | `12 - 16 studs` | Ancho estándar para circulación de vehículos |
| **Avenida Principal** | `32 - 48 studs` | Dos carriles por sentido con mediana |
| **Cobertura Baja** | `3.0 studs` | Permite asomarse o disparar agachado |
| **Cobertura Alta** | `6.5 studs` | Cobertura total de cuerpo completo |

---

## 4. Herramientas MCP Disponibles (Tools Reference)

| Herramienta | Parámetros Principales | Descripción |
| :--- | :--- | :--- |
| `check_studio_connection` | Ninguno | Comprueba si Roblox Studio y el plugin están conectados y activos. |
| `get_workspace_layout` | `folder_path`, `max_depth` | **Feedback Loop:** Lee la jerarquía, bounding boxes, posiciones y tags de objetos existentes en Studio para evitar solapamientos. |
| `build_structure` | `parts_list`, `default_parent`, `snap_grid`, `action_name` | **Batching Masivo:** Instancia decenas o cientos de objetos (Bloques, Cuñas, Truss, Cilindros) en una sola llamada con tags y jerarquías. |
| `set_hollow_box` | `name`, `position`, `size`, `parent`, `doors`, `tags`, `attributes` | **Edificio Hueco:** Construye un edificio o habitación completa (suelo, techo y 4 paredes con vanos) para interiores de Bancos, Tiendas o Talleres. |
| `spawn_wedge` | `name`, `position`, `size`, `rotation`, `parent`, `tags`, `attributes` | **Rampas / Cuñas:** Genera cuñas para rampas de autopistas, calles empinadas de montaña y tejados. |
| `spawn_truss` | `name`, `position`, `height`, `parent`, `tags`, `attributes` | **Escaleras Técnicas:** Genera escaleras verticales escalables por el avatar para andamios y callejones. |
| `add_tags_and_attributes` | `target_path`, `tags`, `attributes`, `recursive` | Asigna tags de CollectionService y atributos a partes o modelos existentes en Studio. |
| `create_stairs` | `startX`, `startY`, `startZ`, `width`, `totalHeight`, `direction` | Construye escaleras calibradas para que el avatar las suba caminando ($\le 1.1\text{ studs}$ por escalón). |
| `clear_folder` | `folder_path` | Elimina una carpeta o distrito específico (ej: `Graybox/Favela`) o todo `Graybox`. |
| `execute_raw_luau` | `code`, `actionName` | Ejecuta cualquier Luau arbitrario con soporte completo de Undo/Redo (`Ctrl + Z`). |

---

## 5. Código del Plugin de Roblox Studio (`GrayboxBridge.server.luau`)

El script se encuentra en `roblox-plugin/GrayboxBridge.server.luau`. Cuenta con soporte bidireccional de lectura/escritura y registro en `ChangeHistoryService`:

```luau
local HttpService = game:GetService("HttpService")
local ChangeHistoryService = game:GetService("ChangeHistoryService")
local CollectionService = game:GetService("CollectionService")

local BRIDGE_URL = "http://127.0.0.1:30250"
local POLL_INTERVAL = 0.35
local isEnabled = true

local toolbar = plugin:CreateToolbar("Graybox City MCP")
local toggleButton = toolbar:CreateButton(
    "ToggleBridge",
    "Activa o desactiva la conexión con el servidor MCP de OpenCode",
    "rbxassetid://10631267425"
)
toggleButton.ClickableWhenViewportHidden = true

local function updateButtonState()
    if isEnabled then
        toggleButton:SetActive(true)
        print("[Graybox MCP] 🟢 Bridge ACTIVO - Escuchando en " .. BRIDGE_URL)
    else
        toggleButton:SetActive(false)
        print("[Graybox MCP] ⚪ Bridge EN PAUSA.")
    end
end

toggleButton.Click:Connect(function()
    isEnabled = not isEnabled
    updateButtonState()
end)

updateButtonState()

local function resolvePath(pathStr)
    if not pathStr or pathStr == "" or pathStr == "Workspace" or pathStr == "workspace" then
        return workspace
    end
    local current = workspace
    for _, part in ipairs(string.split(pathStr, "/")) do
        if part ~= "" then
            local nextObj = current:FindFirstChild(part)
            if not nextObj then return nil end
            current = nextObj
        end
    end
    return current
end

local function inspectHierarchy(obj, currentDepth, maxDepth)
    local info = {
        name = obj.Name,
        className = obj.ClassName,
        tags = CollectionService:GetTags(obj),
        attributes = obj:GetAttributes(),
    }

    if obj:IsA("Model") then
        local cf, size = obj:GetBoundingBox()
        info.position = { math.round(cf.Position.X * 10) / 10, math.round(cf.Position.Y * 10) / 10, math.round(cf.Position.Z * 10) / 10 }
        info.size = { math.round(size.X * 10) / 10, math.round(size.Y * 10) / 10, math.round(size.Z * 10) / 10 }
    elseif obj:IsA("BasePart") then
        info.position = { math.round(obj.Position.X * 10) / 10, math.round(obj.Position.Y * 10) / 10, math.round(obj.Position.Z * 10) / 10 }
        info.size = { math.round(obj.Size.X * 10) / 10, math.round(obj.Size.Y * 10) / 10, math.round(obj.Size.Z * 10) / 10 }
        info.material = obj.Material.Name
    end

    if currentDepth < maxDepth and (obj:IsA("Folder") or obj:IsA("Model")) then
        local children = {}
        for _, child in ipairs(obj:GetChildren()) do
            if child:IsA("Model") or child:IsA("Folder") or child:IsA("BasePart") then
                table.insert(children, inspectHierarchy(child, currentDepth + 1, maxDepth))
            end
        end
        info.children = children
    end

    return info
end

task.spawn(function()
    while true do
        if isEnabled then
            local success, response = pcall(function()
                return HttpService:RequestAsync({
                    Url = BRIDGE_URL .. "/poll",
                    Method = "GET",
                    Headers = { ["Cache-Control"] = "no-cache" },
                })
            end)

            if success and response.StatusCode == 200 and response.Body and response.Body ~= "" then
                local okDecode, cmd = pcall(function()
                    return HttpService:JSONDecode(response.Body)
                end)

                if okDecode and cmd and cmd.id then
                    -- 1. Feedback Loop (Lectura de Workspace)
                    if cmd.type == "get_layout" then
                        print("[Graybox MCP] 🔍 Leyendo layout de: " .. tostring(cmd.folder_path))
                        local target = resolvePath(cmd.folder_path)
                        local responseData = {}

                        if not target then
                            responseData = { exists = false, message = "Ruta no encontrada." }
                        else
                            responseData = { exists = true, root = cmd.folder_path, layout = inspectHierarchy(target, 1, cmd.max_depth or 3) }
                        end

                        pcall(function()
                            HttpService:RequestAsync({
                                Url = BRIDGE_URL .. "/response",
                                Method = "POST",
                                Headers = { ["Content-Type"] = "application/json" },
                                Body = HttpService:JSONEncode({ id = cmd.id, success = true, data = responseData }),
                            })
                        end)

                    -- 2. Construcción / Batching
                    elseif cmd.code then
                        local actionName = cmd.actionName or "Graybox MCP Action"
                        print("[Graybox MCP] 🔨 Ejecutando: " .. actionName)

                        local recording = ChangeHistoryService:TryBeginRecording(actionName)

                        local execOk, execErr = pcall(function()
                            local fn, compileErr = loadstring(cmd.code)
                            if not fn then error("Error Luau: " .. tostring(compileErr)) end
                            fn()
                        end)

                        if recording then
                            if execOk then
                                ChangeHistoryService:FinishRecording(recording, Enum.FinishRecordingOperation.Commit)
                                print("[Graybox MCP] ✅ Éxito: " .. actionName .. " (Ctrl+Z disponible)")
                            else
                                ChangeHistoryService:FinishRecording(recording, Enum.FinishRecordingOperation.Cancel)
                                warn("[Graybox MCP] ❌ Error en ejecución: " .. tostring(execErr))
                            end
                        end

                        pcall(function()
                            HttpService:RequestAsync({
                                Url = BRIDGE_URL .. "/response",
                                Method = "POST",
                                Headers = { ["Content-Type"] = "application/json" },
                                Body = HttpService:JSONEncode({
                                    id = cmd.id,
                                    success = execOk,
                                    error = execErr and tostring(execErr) or nil,
                                }),
                            })
                        end)
                    end
                end
            end
        end

        task.wait(POLL_INTERVAL)
    end
end)
```

---

## 6. Configuración de Roblox Studio

1. Abre tu proyecto en **Roblox Studio**.
2. Ve a **Home** > **Game Settings** > pestaña **Security**:
   - Activa **Allow HTTP Requests** y haz clic en **Save**.
3. Instala el plugin:
   - Ve a la pestaña **Plugins** > haz clic en **Plugins Folder**.
   - Se abrirá la carpeta de plugins en Windows (`%LOCALAPPDATA%\Roblox\Plugins`).
   - Copia allí el archivo `roblox-plugin/GrayboxBridge.server.luau`.
4. En la barra superior de Roblox Studio verás el botón **Graybox City MCP** en verde.

---

## 7. Configuración de OpenCode (`opencode.json`)

El archivo `opencode.json` en la raíz del proyecto ya contiene la configuración necesaria:

```json
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

---

## 8. Ejemplos de Prompts para Diseño de Ciudades en OpenCode

### 1. Lectura Previa (Feedback Loop)
> *"Usa get_workspace_layout para leer qué hay dentro de 'Graybox/Downtown'. Dime qué edificios ya existen y en qué coordenadas antes de construir nada nuevo."*

### 2. Edificio Principal con Tag de Atraco (Heist)
> *"Crea el Banco Central usando set_hollow_box en la posición (0, 0, 0) de tamaño 48x18x48 studs dentro de la carpeta 'City/Downtown/Bank'. Coloca una puerta principal en la pared Norte de 8x10 studs y etiquétala con el tag 'Heist_Target'."*

### 3. Rampa de Autopista Elevada
> *"Genera una rampa de autopista con spawn_wedge de 24 studs de ancho, 16 studs de alto y 64 studs de largo que suba hacia la autopista elevada, guardada en 'City/Highways/Ramp_West' con el tag 'Road_Ramp'."*

### 4. Sector de Favela en Lote Masivo (Batching)
> *"Genera en un solo lote con build_structure 15 casas modulares apiladas en la ladera de la montaña dentro de 'City/Favela/Sector_B', usando bloques de concreto, techos de cuña (Wedge) y 4 escaleras técnicas (TrussPart) conectando los niveles de callejón. Asigna a la carpeta el atributo Territory: 'Vagos'."*

### 5. Deshacer cualquier error
> Presiona **`Ctrl + Z`** directamente en **Roblox Studio** para revertir cualquier generación completa al instante.
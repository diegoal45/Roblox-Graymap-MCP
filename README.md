# Roblox Studio Graybox MCP con OpenCode

Servidor Model Context Protocol (MCP) especializado en **Level Design** y **Grayboxing (Blockout)** para **Roblox Studio**, diseñado para conectarse directamente con **OpenCode**.

Permite que una IA en OpenCode genere habitaciones, vanos de puertas, escaleras con peldaños transitables, coberturas tácticas y arenas completas en tiempo real directamente en tu sesión de Roblox Studio, con **soporte nativo de Deshacer/Rehacer (`Ctrl + Z`)**.

---

## 1. Arquitectura de la Solución

```text
 ┌──────────────┐         stdio          ┌────────────────────────┐
 │   OpenCode   │ ◄────────────────────► │  Servidor MCP Graybox  │
 └──────────────┘                        │  (Node.js / Express)   │
                                         └───────────┬────────────┘
                                                     │ Local HTTP
                                                     │ (127.0.0.1:30250)
                                                     ▼
                                         ┌────────────────────────┐
                                         │  Roblox Studio Plugin  │
                                         │  (ChangeHistoryService)│
                                         └───────────┬────────────┘
                                                     │ Instanciación directa
                                                     ▼
                                         ┌────────────────────────┐
                                         │   Workspace.Graybox    │
                                         │   (Soporta Ctrl + Z)   │
                                         └────────────────────────┘
```

### ¿Cómo interactúan los componentes?
1. **OpenCode (Cliente MCP):** Se comunica con el servidor MCP mediante el estándar `stdio`.
2. **Servidor MCP (`roblox-graybox-mcp`):** Contiene los generadores algorítmicos calibrados con las métricas oficiales de Roblox. Convierte los parámetros en Luau optimizado y los pone en cola en un servidor HTTP local en `127.0.0.1:30250`.
3. **Plugin de Roblox Studio (`GrayboxBridge`):** Un script de plugin que hace polling continuo. Cuando recibe una instrucción, la ejecuta en Studio encapsulada dentro de **`ChangeHistoryService`**, lo que permite presionar **`Ctrl + Z`** para revertir cualquier cambio.

---

## 2. Métricas Críticas de Graybox para Roblox

Para que el modelo de IA genere niveles jugables, el MCP respeta la física y proporciones estándar del avatar de Roblox:

| Elemento | Dimensión en Studs | Justificación Mecánica |
| :--- | :--- | :--- |
| **Altura Avatar (R15)** | `5 studs` (ancho: `4 studs`, prof: `2 studs`) | Caja de colisión del jugador |
| **Salto Estándar** | `7.2 studs` de alto | Máximo alcance vertical sin escalar |
| **Paso de Escalón (Max)** | `1.2 studs` de alto | Altura máxima que el avatar sube caminando sin saltar |
| **Escalones Ideales** | Alto: `0.8 studs`, Huella: `2.0 studs` | Subida fluida a velocidad normal |
| **Puertas** | Mínimo `4 x 8 studs` (Ideal: `5 x 8.5 studs`) | Evita atorarse con accesorios y sombreros |
| **Pasillo Mínimo** | `8 studs` | 1 jugador con espacio de cámara libre |
| **Pasillo de Combate** | `12 - 16 studs` | Combate fluido entre varios jugadores |
| **Cobertura Baja** | Alto: `3.0 studs` | Permite disparar/mirar por encima agachado |
| **Cobertura Alta** | Alto: `6.5 studs` | Cobertura total de cuerpo completo de pie |

---

## 3. Estructura del Proyecto

```text
roblox-graybox-mcp/
├── package.json                 # Dependencias (@modelcontextprotocol/sdk, express, zod)
├── opencode.json                # Configuración del MCP para OpenCode
├── README.md                    # Documentación y guía completa
├── src/
│   ├── index.js                 # Servidor MCP y registro de Tools
│   ├── bridge.js                # Servidor HTTP local (127.0.0.1:30250)
│   └── generators/
│       ├── palette.js           # Colores estándar Graybox y métricas en studs
│       ├── room.js              # Generador de habitaciones con vanos de puertas
│       ├── stairs.js            # Generador de escaleras transitables por el avatar
│       ├── cover.js             # Coberturas tácticas (baja, alta, esquinas, columnas)
│       └── arena.js             # Generador de arenas tácticas completas de 3 carriles
└── roblox-plugin/
    ├── GrayboxBridge.server.luau# Plugin de Roblox Studio con botón en la barra
    └── README_PLUGIN.md         # Instrucciones específicas del plugin
```

---

## 4. Herramientas Disponibles en el MCP (Tools)

| Herramienta | Parámetros Principales | Descripción |
| :--- | :--- | :--- |
| `check_studio_connection` | Ninguno | Comprueba si Roblox Studio está abierto y si el plugin está enlazado. |
| `create_room` | `name`, `x`, `y`, `z`, `width`, `length`, `height`, `doors`, `hasCeiling` | Crea una habitación con piso y 4 paredes. Soporta vanos de puertas transitables con dintel automático en paredes Norte, Sur, Este u Oeste. |
| `create_stairs` | `startX`, `startY`, `startZ`, `width`, `totalHeight`, `direction` | Construye tramos de escaleras transitables (`+Z`, `-Z`, `+X`, `-X`). La altura por escalón se autocalibra a $\le 1.1\text{ studs}$. |
| `place_cover` | `x`, `y`, `z`, `type`, `length`, `rotationY` | Coloca coberturas tácticas: `low` (3 studs, naranja), `high` (6.5 studs, azul), `l_shape` (esquinas) o `pillar` (columnas). |
| `generate_arena` | `name`, `centerX`, `centerY`, `centerZ`, `sizeX`, `sizeZ` | Genera una arena simétrica completa de 3 carriles con perímetro, zonas de spawn para 2 equipos, plataforma central con rampas y líneas de visión cubiertas. |
| `clear_graybox` | Ninguno | Elimina la carpeta `Workspace.Graybox` en Studio para reiniciar el mapa. |
| `execute_raw_luau` | `code`, `actionName` | Permite a OpenCode generar Luau a medida para geometrías o mecánicas avanzadas. |

---

## 5. Código del Plugin de Roblox Studio

Guarda este script en tu carpeta de plugins locales de Roblox Studio (`%LOCALAPPDATA%\Roblox\Plugins\GrayboxBridge.server.luau`):

```luau
local HttpService = game:GetService("HttpService")
local ChangeHistoryService = game:GetService("ChangeHistoryService")

local BRIDGE_URL = "http://127.0.0.1:30250"
local POLL_INTERVAL = 0.35
local isEnabled = true

-- Barra de herramientas de Studio
local toolbar = plugin:CreateToolbar("Graybox MCP")
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

-- Hilo principal de polling y ejecución con soporte Undo/Redo
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

                if okDecode and cmd and cmd.id and cmd.code then
                    local actionName = cmd.actionName or "Graybox MCP Action"
                    print("[Graybox MCP] 🔨 Ejecutando: " .. actionName)

                    -- Registrar para Deshacer (Ctrl + Z)
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

                    -- Responder al MCP
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

        task.wait(POLL_INTERVAL)
    end
end)
```

---

## 6. Configuración de Roblox Studio (Paso a Paso)

1. Abre **Roblox Studio** y carga un mapa base (ej. **Baseplate**).
2. Ve a la pestaña **Home** > **Game Settings** > pestaña **Security**:
   - Activa **Allow HTTP Requests** y haz clic en **Save** *(si el juego no está guardado, guárdalo primero para desbloquear la configuración)*.
3. Instala el plugin:
   - Ve a la pestaña **Plugins** > haz clic en **Plugins Folder**.
   - Se abrirá la carpeta de plugins en el Explorador de Windows (`%LOCALAPPDATA%\Roblox\Plugins`).
   - Copia allí el archivo `roblox-plugin/GrayboxBridge.server.luau`.
4. En la barra superior de Roblox Studio aparecerá el botón **Graybox MCP** en verde y la consola mostrará:
   ```text
   [Graybox MCP] 🟢 Bridge ACTIVO - Escuchando en http://127.0.0.1:30250
   ```

---

## 7. Configuración de OpenCode (`opencode.json`)

El archivo `opencode.json` ya se encuentra en la raíz del proyecto configurado de la siguiente manera:

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

> **Tip:** También puedes copiar este bloque en tu archivo global `~/.config/opencode/opencode.json` para que esté disponible en cualquier carpeta.

---

## 8. Flujo de Uso y Prompts de Prueba

Abre tu terminal en la carpeta del proyecto y arranca OpenCode:

```bash
cd C:\Users\dtc59\Desktop\roblox-graybox-mcp
opencode
```

Una vez dentro de OpenCode, puedes usar prompts como los siguientes:

### Comprobar conexión
> *"Comprueba si Roblox Studio está conectado al servidor MCP."*

### Arena completa de combate
> *"Genera una arena táctica de combate de 80x80 studs centrada en (0, 0, 0)."*

### Habitación con puertas transitables
> *"Crea una habitación graybox de 40x30 studs llamada 'ControlRoom' en (0, 0, 0) con paredes de 14 studs de alto y una puerta en la pared Norte."*

### Escaleras transitables
> *"Desde la puerta Norte, crea una escalera de 6 studs de ancho que suba 10 studs de altura en dirección +Z hacia una plataforma."*

### Coberturas tácticas
> *"Coloca 4 coberturas bajas dispuestas en cruz en el centro de la sala y dos columnas altas a los costados."*

### Limpieza o reinicio
> *"Limpia el graybox actual y vuelve a generar la arena con paredes de 18 studs de alto."*

### Deshacer cambios
> Si algún diseño generado no te convence, presiona **`Ctrl + Z`** directamente en **Roblox Studio** para deshacer la última acción de la IA de inmediato.
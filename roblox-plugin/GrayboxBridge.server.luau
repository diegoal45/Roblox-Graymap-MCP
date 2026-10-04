--[[
    GrayboxBridge.server.luau
    Plugin de enlace entre Roblox Studio y el Servidor MCP 'roblox-graybox-mcp'.
    
    Características:
    - Polling asíncrono no bloqueante vía HttpService.
    - Soporte nativo para Deshacer / Rehacer (Ctrl + Z / Ctrl + Y) con ChangeHistoryService.
    - Botón de alternancia en la barra de herramientas de Plugins.
]]

local HttpService = game:GetService("HttpService")
local ChangeHistoryService = game:GetService("ChangeHistoryService")

local BRIDGE_URL = "http://127.0.0.1:30250"
local POLL_INTERVAL = 0.35 -- segundos entre chequeos
local isEnabled = true

-- Crear interfaz en la barra de Plugins de Roblox Studio
local toolbar = plugin:CreateToolbar("Graybox MCP")
local toggleButton = toolbar:CreateButton(
    "ToggleBridge",
    "Activa o desactiva la conexión con el servidor MCP de OpenCode",
    "rbxassetid://10631267425" -- Icono neutral de Studio
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

-- Hilo principal de escucha y ejecución
task.spawn(function()
    while true do
        if isEnabled then
            local success, response = pcall(function()
                return HttpService:RequestAsync({
                    Url = BRIDGE_URL .. "/poll",
                    Method = "GET",
                    Headers = {
                        ["Cache-Control"] = "no-cache",
                    },
                })
            end)

            if success and response.StatusCode == 200 and response.Body and response.Body ~= "" then
                local okDecode, cmd = pcall(function()
                    return HttpService:JSONDecode(response.Body)
                end)

                if okDecode and cmd and cmd.id and cmd.code then
                    local actionName = cmd.actionName or "Graybox MCP Action"
                    print("[Graybox MCP] 🔨 Ejecutando: " .. actionName)

                    -- 1. Iniciar registro de Deshacer (Undo / Redo)
                    local recording = ChangeHistoryService:TryBeginRecording(actionName)

                    -- 2. Compilar y ejecutar Luau en el contexto de Studio
                    local execOk, execErr = pcall(function()
                        local fn, compileErr = loadstring(cmd.code)
                        if not fn then
                            error("Error de sintaxis Luau: " .. tostring(compileErr))
                        end
                        fn()
                    end)

                    -- 3. Confirmar o cancelar el registro según el resultado
                    if recording then
                        if execOk then
                            ChangeHistoryService:FinishRecording(recording, Enum.FinishRecordingOperation.Commit)
                            print("[Graybox MCP] ✅ Éxito: " .. actionName .. " (Ctrl+Z disponible)")
                        else
                            ChangeHistoryService:FinishRecording(recording, Enum.FinishRecordingOperation.Cancel)
                            warn("[Graybox MCP] ❌ Error en ejecución: " .. tostring(execErr))
                        end
                    end

                    -- 4. Notificar al servidor MCP
                    pcall(function()
                        HttpService:RequestAsync({
                            Url = BRIDGE_URL .. "/response",
                            Method = "POST",
                            Headers = {
                                ["Content-Type"] = "application/json",
                            },
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

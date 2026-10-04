--[[
    GrayboxBridge.server.luau
    Plugin de enlace bidireccional entre Roblox Studio y el Servidor MCP 'roblox-graybox-mcp'.
    
    Características Profesionales:
    - Batching de alto rendimiento para ciudades y grandes distritos.
    - Soporte nativo para Deshacer / Rehacer (Ctrl + Z / Ctrl + Y) con ChangeHistoryService.
    - Feedback Loop (Capacidad de lectura de Workspace mediante get_workspace_layout).
    - Asignación de Tags (CollectionService) y Atributos de Juego en tiempo real.
]]

local HttpService = game:GetService("HttpService")
local ChangeHistoryService = game:GetService("ChangeHistoryService")
local CollectionService = game:GetService("CollectionService")

local BRIDGE_URL = "http://127.0.0.1:30250"
local POLL_INTERVAL = 0.35 -- segundos entre chequeos
local isEnabled = true

-- Crear interfaz en la barra de Plugins de Roblox Studio
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

-- Utilidad para resolver rutas de jerarquía como "City/Downtown/District_A"
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

-- Función recursiva de inspección de objetos (Feedback Loop)
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
            -- Ignorar servicios y concentrarse en geometría/carpetas
            if child:IsA("Model") or child:IsA("Folder") or child:IsA("BasePart") then
                table.insert(children, inspectHierarchy(child, currentDepth + 1, maxDepth))
            end
        end
        info.children = children
    end

    return info
end

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

                if okDecode and cmd and cmd.id then
                    -- 1. CASO DE LECTURA (FEEDBACK LOOP)
                    if cmd.type == "get_layout" then
                        print("[Graybox MCP] 🔍 Leyendo layout de: " .. tostring(cmd.folder_path))
                        local target = resolvePath(cmd.folder_path)
                        local responseData = {}

                        if not target then
                            responseData = {
                                exists = false,
                                message = "La ruta '" .. tostring(cmd.folder_path) .. "' no existe en Workspace aún.",
                            }
                        else
                            local layoutData = inspectHierarchy(target, 1, cmd.max_depth or 3)
                            responseData = {
                                exists = true,
                                root = cmd.folder_path or "Workspace",
                                layout = layoutData,
                            }
                        end

                        pcall(function()
                            HttpService:RequestAsync({
                                Url = BRIDGE_URL .. "/response",
                                Method = "POST",
                                Headers = { ["Content-Type"] = "application/json" },
                                Body = HttpService:JSONEncode({
                                    id = cmd.id,
                                    success = true,
                                    data = responseData,
                                }),
                            })
                        end)

                    -- 2. CASO DE CONSTRUCCIÓN O MODIFICACIÓN (LUAU)
                    elseif cmd.code then
                        local actionName = cmd.actionName or "Graybox MCP Action"
                        print("[Graybox MCP] 🔨 Ejecutando: " .. actionName)

                        -- Iniciar registro de Deshacer (Undo / Redo)
                        local recording = ChangeHistoryService:TryBeginRecording(actionName)

                        local execOk, execErr = pcall(function()
                            local fn, compileErr = loadstring(cmd.code)
                            if not fn then
                                error("Error de sintaxis Luau: " .. tostring(compileErr))
                            end
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

                        -- Enviar confirmación al MCP
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
        end

        task.wait(POLL_INTERVAL)
    end
end)

# Instalación del Plugin en Roblox Studio

Este plugin conecta tu sesión de Roblox Studio con el servidor MCP de OpenCode a través del puerto local `30250`.

---

### Paso 1: Permitir peticiones HTTP en tu juego

Roblox Studio requiere permiso explícito para conectarse a servidores locales:
1. Abre tu proyecto o crea un **Baseplate** en Roblox Studio.
2. Ve a la pestaña **Home** > **Game Settings** (si el juego no está publicado, haz clic en *Save to Roblox* primero para desbloquear la configuración).
3. Selecciona la categoría **Security**.
4. Activa la casilla **Allow HTTP Requests**.
5. Haz clic en **Save**.

---

### Paso 2: Instalar el Plugin (2 Métodos)

#### Método A: Como Plugin Local (Recomendado - Activo en todos tus proyectos)
1. En la barra superior de Roblox Studio, ve a la pestaña **Plugins**.
2. Haz clic en el botón **Plugins Folder** (Abrirá una ventana del Explorador de Windows en `%LOCALAPPDATA%\Roblox\Plugins`).
3. Copia el archivo `GrayboxBridge.server.luau` de esta carpeta y pégalo dentro de la carpeta de Plugins de Roblox.
4. Reinicia Roblox Studio o haz clic en recargar. Verás una nueva sección en la pestaña de Plugins llamada **Graybox MCP** con el botón de alternancia.

#### Método B: Como Script de prueba en `ServerScriptService`
1. Abre el panel **Explorer** en Roblox Studio.
2. Haz clic derecho en **ServerScriptService** > **Insert Object** > **Script**.
3. Cambia el `RunContext` del script a `Legacy` o déjalo por defecto.
4. Pega todo el contenido de `GrayboxBridge.server.luau`.
5. Ejecuta el modo *Run* o *Play* (F5).

---

### Verificación
En la ventana de **Output** de Roblox Studio deberías ver:
```
[Graybox MCP] 🟢 Bridge ACTIVO - Escuchando en http://127.0.0.1:30250
```
Cuando envíes comandos desde OpenCode, verás:
```
[Graybox MCP] 🔨 Ejecutando: Create Room Arena
[Graybox MCP] ✅ Éxito: Create Room Arena (Ctrl+Z disponible)
```
Si deseas revertir cualquier cambio, simplemente presiona **Ctrl + Z** en Roblox Studio.

import fs from "fs";
import path from "path";

const pluginSource = fs.readFileSync(path.resolve("roblox-plugin/GrayboxBridge.lua"), "utf8");

// Crear el XML para el formato .rbxmx
const rbxmxContent = `<?xml version="1.0" encoding="utf-8"?>
<roblox xmlns:xmime="http://www.w3.org/2005/05/xmlmime" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:noNamespaceSchemaLocation="http://www.roblox.com/roblox.xsd" version="4">
	<Meta name="ExplicitAutoJoints">true</Meta>
	<Item class="Script" referent="RBX_GRAYBOX_MCP">
		<Properties>
			<string name="Name">GrayboxCityMCP</string>
			<ProtectedString name="Source"><![CDATA[${pluginSource}]]></ProtectedString>
			<bool name="Disabled">false</bool>
		</Properties>
	</Item>
</roblox>`;

// Guardar en la carpeta del proyecto
fs.writeFileSync("roblox-plugin/GrayboxBridge.rbxmx", rbxmxContent, "utf8");

// Guardar en la carpeta de plugins de Roblox Studio del usuario
const robloxPluginsDir = "C:/Users/dtc59/AppData/Local/Roblox/Plugins";
if (fs.existsSync(robloxPluginsDir)) {
  fs.writeFileSync(path.join(robloxPluginsDir, "GrayboxBridge.rbxmx"), rbxmxContent, "utf8");
  fs.writeFileSync(path.join(robloxPluginsDir, "GrayboxBridge.lua"), pluginSource, "utf8");
  console.log("Plugin instalado exitosamente en:", robloxPluginsDir);
} else {
  console.warn("No se encontró el directorio:", robloxPluginsDir);
}

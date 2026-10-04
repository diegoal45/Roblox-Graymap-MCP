# 🏙️ Especificación Técnica: Ciudad 4000x3600 & API Reference MCP

Guía técnica y de arquitectura para el diseño paramétrico de la ciudad a gran escala ($4,000 \times 3,600\text{ studs}$) con el servidor **Roblox Graybox MCP** y **OpenCode**.

---

## 1. Sistema de Coordenadas y Orientación del Mundo

El mundo se organiza con origen central absoluto en `(0, 0, 0)` en el Workspace de Roblox.

```text
                       NORTE (-Z)
             [ Zona 1: La Montaña y Favela ]
                    (Y = 20 a 160)
                           ▲
                           │
       OESTE (-X)          │          ESTE (+X)
 [ Zona 3: Barrio Bajo ]   │    [ Zona 4: Downtown ]
   [ Base Pandilla B ]     │      [ Banco Central ]
   [ Taller Mecánico ]     │    [ Rascacielos Graybox ]
                           │
  ─────────────────────────┼─────────────────────────
             [ Zona 2: Autopista Elevada ]
                       (Y = 50)
  ─────────────────────────┼─────────────────────────
                           │
       [ Zona 5: Barrio Intermedio y Mercado ]
                     (X ≈ 0, Y = 0)
                           │
                           ▼
              [ Canal Sur: Y = -12 a -15 ]
                       SUR (+Z)
```

### Tabla de Elevaciones (Eje Y)

| Nivel del Mundo | Altura Y (Studs) | Elementos Urbanos |
| :--- | :--- | :--- |
| **Fondo de Canal** | `Y = -12` a `-15` | Lecho del Canal Sur, aguas residuales y pilares de soporte |
| **Nivel Calle Base** | `Y = 0` | Suelo general, aceras, calzadas de Zona 3, 4 y 5 |
| **Ladera Baja Favela** | `Y = 20` a `45` | Primeros callejones peatonales y casas bajas |
| **Autopista Elevada** | `Y = 50` | Autopista horizontal que cruza el mapa de Este a Oeste |
| **Ladera Media Favela** | `Y = 50` a `90` | Casas apiladas, pasarelas de madera y escaleras técnicas |
| **Cima de la Montaña** | `Y = 120` a `160` | Base fortificada de la Pandilla A, helipuerto y mirador |

### Regla de Ajuste a Rejilla (Snap to Grid)
- **Vías y Manzanas:** Las coordenadas X y Z deben ser múltiplos de **8 studs** (calles de 16, 24, 32 o 48 studs).
- **Edificios y Puertas:** Posiciones y dimensiones deben ser múltiplos de **4 studs**.

---

## 2. API Reference de Herramientas MCP (Tools)

### 1. `build_structure` (Batching Masivo)
Instancia hasta cientos de partes en memoria en un solo mensaje de red, con soporte para carpetas jerárquicas y tags de juego.

```jsonc
{
  "action_name": "Build Favela Sector 1",
  "default_parent": "City/Favela/Sector_1",
  "snap_grid": 4,
  "parts_list": [
    {
      "shape": "Block",             // "Block" | "Wedge" | "Truss" | "Cylinder" | "Sphere"
      "name": "House_01_Base",
      "position": [-300, 20, -800], // [X, Y, Z]
      "size": [24, 12, 20],         // [ancho X, alto Y, largo Z]
      "rotation": [0, 15, 0],       // [RotX, RotY, RotZ] en grados
      "color": [170, 160, 150],     // [R, G, B]
      "material": "Concrete",       // "SmoothPlastic" | "Concrete" | "Brick" | "Metal" | "WoodPlanks"
      "parent": "City/Favela/Sector_1/House_01",
      "tags": ["Favela_House", "Climbable_Roof"],
      "attributes": { "Territory": "Ballas", "Destructible": false }
    }
  ]
}
```

---

### 2. `set_hollow_box` (Edificios e Interiores Huecos)
Crea una estructura completa con suelo, techo, 4 paredes y vanos de puerta transitables con dintel automático.

```jsonc
{
  "name": "Central_Bank",
  "position": [400, 0, -200],       // Centro del suelo
  "size": [48, 20, 60],             // Ancho X, Alto Y, Largo Z
  "wall_thickness": 2,
  "has_floor": true,
  "has_ceiling": true,
  "parent": "City/Downtown/Bank",
  "doors": [
    {
      "wall": "North",              // "North" | "South" | "East" | "West"
      "width": 8,
      "height": 10,
      "offset": 0,
      "tag": "Heist_Target"
    },
    {
      "wall": "South",
      "width": 6,
      "height": 9,
      "offset": 10,
      "tag": "Staff_Entrance"
    }
  ],
  "tags": ["Robbable_Building", "Downtown_Core"],
  "attributes": { "HeistDifficulty": "Hard", "MaxLoot": 50000 },
  "snap_grid": 4
}
```

---

### 3. `spawn_wedge` (Rampas y Calles Empinadas)
Genera piezas cuña (`WedgePart`) para rampas de autopista, desniveles de montaña y tejados inclinados.

```jsonc
{
  "name": "Highway_Ramp_East",
  "position": [600, 0, 0],
  "size": [24, 50, 120],            // Sube 50 studs en 120 studs de largo
  "rotation": [0, 90, 0],
  "color": [100, 100, 105],
  "material": "Concrete",
  "parent": "City/Highways/Ramps",
  "tags": ["Road_Ramp", "Vehicle_Path"],
  "attributes": { "MaxSpeed": 80 },
  "snap_grid": 4
}
```

---

### 4. `spawn_truss` (Escaleras Técnicas de Cuadrícula)
Genera escaleras de celosía (`TrussPart`) escalables por el avatar de Roblox de forma nativa.

```jsonc
{
  "name": "Fire_Escape_Ladder",
  "position": [-320, 20, -780],
  "height": 24,                     // Altura vertical (ajustada a múltiplos de 2)
  "rotation_y": 0,
  "parent": "City/Favela/Ladders",
  "tags": ["Climbable_Truss", "Shortcut"],
  "snap_grid": 4
}
```

---

### 5. `create_stairs` (Escaleras Peatonales Fluidas)
Crea escaleras de peldaños sólidos autocalibrados a $\le 1.1\text{ studs}$ por peldaño para subida fluida sin salto.

```jsonc
{
  "name": "Pedestrian_Overpass_Stairs",
  "startX": 120,
  "startY": 0,
  "startZ": -50,
  "width": 8,
  "totalHeight": 16,
  "stepDepth": 2.0,
  "direction": "+Z",                // "+Z" | "-Z" | "+X" | "-X"
  "includeTopPlatform": true,
  "topPlatformLength": 8
}
```

---

### 6. `get_workspace_layout` (Feedback Loop / Lectura en Vivo)
Permite a la IA inspeccionar lo que ya está modelado antes de generar nuevas partes para evitar solapamientos o colisiones.

```jsonc
// Consulta:
{
  "folder_path": "City/Downtown",
  "max_depth": 3
}

// Respuesta recibida por la IA:
{
  "exists": true,
  "root": "City/Downtown",
  "layout": {
    "name": "Downtown",
    "className": "Folder",
    "children": [
      {
        "name": "Central_Bank",
        "className": "Model",
        "position": [400, 10, -200],
        "size": [48, 20, 60],
        "tags": ["Robbable_Building"]
      }
    ]
  }
}
```

---

### 7. `add_tags_and_attributes` (Etiquetado en Masa)
Asigna tags y atributos a modelos o carpetas existentes en Studio.

```jsonc
{
  "target_path": "City/Favela/Sector_1",
  "tags": ["Gang_Territory", "Contested_Zone"],
  "attributes": {
    "ControllingGang": "Vagos",
    "IncomePerMinute": 250
  },
  "recursive": true
}
```

---

## 3. Catálogo Estándar de Tags (CollectionService)

| Tag | Uso Recomendado en Scripts de Juego |
| :--- | :--- |
| `"Heist_Target"` | Marcador de objetivo de robo (banco, caja fuerte, joyería). |
| `"Spawn_Coche"` | Puntos de spawn para vehículos en concesionarios o talleres. |
| `"Zona_Captura"` | Puntos de control para el sistema de guerra de pandillas. |
| `"No_Escalable"` | Paredes o vallas donde los scripts de parkour/climbing deben desactivarse. |
| `"Climbable_Truss"` | Escaleras técnicas rápidas o atajos verticales. |
| `"Cover_Low"` | Bloques tácticos de $3\text{ studs}$ de altura para disparar agachado. |
| `"Cover_High"` | Bloques tácticos de $6.5\text{ studs}$ de altura para cobertura completa. |

---

## 4. Plan de Construcción por Fases

Para mantener la jerarquía organizada y permitir el uso de `Ctrl + Z` de forma limpia:

1. **Fase 1 — Terreno Base y Canal:** Suelo general de $4,000 \times 3,600\text{ studs}$ en `Y = 0` y la trinchera del Canal Sur en `Y = -12`. Carpeta: `City/Terrain`.
2. **Fase 2 — Autopista Elevada:** Puente horizontal en `Y = 50` con pilares y rampas en cuña (`WedgePart`). Carpeta: `City/Highways`.
3. **Fase 3 — Zona 3 (Oeste - Barrio Bajo):** Taller mecánico, callejones y base de la Pandilla B. Carpeta: `City/West_District`.
4. **Fase 4 — Zona 5 (Centro - Barrio Intermedio):** Mercado central, avenidas intermedias y plazas públicas. Carpeta: `City/Midtown`.
5. **Fase 5 — Zona 4 (Este - Downtown):** Banco Central (`set_hollow_box`), rascacielos graybox y zona financiera. Carpeta: `City/Downtown`.
6. **Fase 6 — Zona 1 (Norte - Montaña y Favela):** Terrazas de montaña, zigzag de calles con cuñas, escaleras técnicas `TrussPart` y la base fortificada de la Pandilla A en `Y = 150`. Carpeta: `City/Favela`.

---

## 5. Instrucciones para Interactuar con OpenCode

> [!IMPORTANT]
> **No pegues los bloques JSON crudos en el chat de OpenCode.**
> OpenCode es el agente que se encarga de estructurar y enviar el JSON al motor. Para pedirle que construya cualquiera de las fases, dale la orden en lenguaje natural en un **nuevo chat (`+`)**:
>
> * *"Usa build_structure para generar la Fase 1: Terreno Base de 4000x3600 y el Canal Sur."*
> * *"Construye la Fase 2: Autopista horizontal en Y = 50 con rampas de acceso en cuña."*
> * *"Genera el Banco Central en City/Downtown/Bank con set_hollow_box y la puerta de atraco 'Heist_Target'."*

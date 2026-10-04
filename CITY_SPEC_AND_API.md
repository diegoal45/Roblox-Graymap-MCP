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

---

## 2. API Reference de Herramientas MCP (Tools)

### 1. `inspect_area` (Conciencia Espacial por Radio)
Consulta qué objetos o modelos existen alrededor de un punto para saber cuánto espacio libre queda antes de construir.

```jsonc
{
  "position": [400, 0, -200],       // [X, Y, Z] centro de búsqueda
  "radius": 60,                     // Radio en studs
  "max_results": 15
}
```

---

### 2. `raycast_query` (Detección de Suelo y Superficies)
Dispara un rayo hacia abajo para medir la altura exacta del suelo en terrenos irregulares o colinas de favela.

```jsonc
{
  "origin": [-300, 100, -800],      // Desde el cielo
  "direction": [0, -1, 0],          // Hacia abajo
  "distance": 150                   // Distancia máxima
}
```

---

### 3. `create_street` (Vías Urbanas con Aceras y Farolas)
Genera una calle completa con calzada de asfalto rebajada, dos aceras elevadas, líneas divisorias amarillas y farolas automáticas con luz real.

```jsonc
{
  "name": "Downtown_Main_Avenue",
  "start_position": [0, 0, -300],
  "end_position": [0, 0, 300],
  "road_width": 24,                 // 2 carriles
  "sidewalk_width": 6,              // Aceras a ambos lados
  "has_lanes": true,                // Líneas amarillas divisorias
  "has_sidewalks": true,
  "has_lamps": true,                // Farolas con luz PointLight real
  "lamp_interval": 48,
  "parent": "City/Streets"
}
```

---

### 4. `spawn_prop` (Mobiliario y Atrezzo Lowpoly para Interiores y Calles)
Genera mobiliario táctico calibrado para avatares de Roblox:

```jsonc
{
  "type": "counter",                // "counter" | "desk" | "shelf" | "dumpster" | "barrier" | "street_lamp" | "dummy"
  "name": "Bank_Reception_Counter",
  "position": [400, 0, -200],
  "rotation_y": 90,
  "length": 12,                     // Longitud para mostradores/estanterías
  "parent": "City/Downtown/Bank/Furniture",
  "tags": ["Cover_Low"]
}
```

* **`counter`**: Mostrador de $3\text{ studs}$ de alto (cobertura baja para tiroteos).
* **`desk`**: Escritorio de oficina con cajonera y superficie de madera.
* **`shelf`**: Estantería de almacén de $8\text{ studs}$ de altura.
* **`dumpster`**: Contenedor industrial de basura para callejones oscuros.
* **`barrier`**: Barrera de concreto tipo Jersey con reflectores amarillos.
* **`street_lamp`**: Poste con brazo y lámpara con luz real de noche.
* **`dummy`**: Maniquí de referencia de escala humana R15 ($5\text{ studs}$ de altura).

---

### 5. `set_hollow_box` (Edificios con Detalles Arquitectónicos)
Crea una estructura completa con suelo, techo, 4 paredes, **cornisas de tejado de $1.5\text{ studs}$** (parapeto para azoteas), **zócalos exteriores**, **iluminación PointLight suave en el techo** y vanos de puerta transitables.

```jsonc
{
  "name": "Central_Bank",
  "position": [400, 0, -200],
  "size": [48, 20, 60],
  "wall_thickness": 2,
  "include_parapet": true,          // Borde de tejado para cobertura
  "include_lighting": true,         // Luz interior en techo
  "include_baseboard": true,        // Zócalo inferior
  "parent": "City/Downtown/Bank",
  "doors": [
    {
      "wall": "North",
      "width": 8,
      "height": 10,
      "offset": 0,
      "tag": "Heist_Target"
    }
  ],
  "tags": ["Robbable_Building", "Downtown_Core"],
  "attributes": { "HeistDifficulty": "Hard", "MaxLoot": 50000 },
  "snap_grid": 4
}
```

---

### 6. `build_structure` (Batching Masivo + Performance Shield)
Instancia cientos de partes de golpe con **desactivación automática de `CanTouch = false`** y **LOD `StreamingMesh`** para garantizar 60 FPS en servidores de 50 jugadores.

```jsonc
{
  "action_name": "Build Favela Sector 1",
  "default_parent": "City/Favela/Sector_1",
  "snap_grid": 4,
  "auto_optimize": true,            // Performance Shield activo
  "parts_list": [
    {
      "shape": "Block",
      "name": "House_01_Base",
      "position": [-300, 20, -800],
      "size": [24, 12, 20],
      "color": [170, 160, 150],
      "material": "Concrete",
      "parent": "City/Favela/Sector_1/House_01",
      "tags": ["Favela_House"],
      "attributes": { "Territory": "Ballas" }
    }
  ]
}
```

---

### 7. `spawn_wedge` (Rampas y Calles Empinadas)
Genera piezas cuña (`WedgePart`) para rampas de autopista, desniveles de montaña y tejados inclinados.

```jsonc
{
  "name": "Highway_Ramp_East",
  "position": [600, 0, 0],
  "size": [24, 50, 120],            // Sube 50 studs en 120 studs de largo
  "rotation": [0, 90, 0],
  "material": "Concrete",
  "parent": "City/Highways/Ramps",
  "tags": ["Road_Ramp"]
}
```

---

### 8. `spawn_truss` (Escaleras Técnicas de Cuadrícula)
Genera escaleras de celosía (`TrussPart`) escalables por el avatar de Roblox de forma nativa para andamios y callejones.

```jsonc
{
  "name": "Fire_Escape_Ladder",
  "position": [-320, 20, -780],
  "height": 24,
  "parent": "City/Favela/Ladders",
  "tags": ["Climbable_Truss"]
}
```

---

### 9. `build_house` (Casas Unifamiliares Estilo GTA San Andreas)
Construye viviendas unifamiliares realistas con tejado a dos aguas en cuña (`WedgePart`), chimeneas de ladrillo, porche cubierto con barandilla y farol, ventanas con contraventanas de madera (*shutters*), garaje con camino de hormigón (*driveway*), buzón americano a pie de calle y patio trasero con barbacoa.

```jsonc
{
  "name": "Grove_Street_House_01",
  "position": [100, 0, 100],
  "lot_size": [56, 72],             // [ancho X, fondo Z]
  "style": "suburban_bungalow",     // "suburban_bungalow" | "victorian_rowhouse" | "vinewood_mansion" | "duplex_apartment"
  "has_garage": true,
  "has_porch": true,
  "has_fence": true,
  "has_yard_props": true,           // Buzón, camino de losas, barbacoa y cubos
  "parent": "City/Houses"
}
```

---

### 10. `build_landmark` (Hitos Urbanos y Servicios Comerciales)
Construye edificios emblemáticos funcionales:

```jsonc
{
  "type": "gas_station",            // "gas_station" | "fast_food_diner" | "police_station"
  "name": "Gas_Station_24_7",
  "position": [200, 0, 0],
  "rotation_y": 0,
  "parent": "City/Landmarks"
}
```
* **`gas_station`**: Marquesina iluminada, 4 surtidores con mangueras, tienda 24/7 con escaparates y rótulos iluminados, tótem de precios gigante a pie de calle y máquina de hielo.
* **`fast_food_diner`**: Burger Shot / Diner con carril *Drive-Thru* transitable, poste de menú con interfono, ventanilla de recogida de pedidos y gran tótem cartel elevado estilo autopista.
* **`police_station`**: Comisaría cívica de 2 plantas con 3 cocheras de patrullas con portones enrollables, helipuerto operativo en azotea con balizas de aterrizaje y torre de radio.

---

### 11. `place_traffic_signage` (Señalización Vial y Semáforos)
Despliega elementos oficiales de control de tráfico:

```jsonc
{
  "type": "intersection_traffic_light", // "intersection_traffic_light" | "stop_sign" | "street_name_sign" | "speed_limit" | "road_arrows"
  "position": [0, 0, 0],
  "rotation_y": 0,
  "street_a": "GROVE ST",
  "street_b": "GANTON AVE",
  "speed_limit": 35,
  "arrow_type": "straight_and_turn",
  "parent": "City/Signage"
}
```

---

### 12. `build_elevated_highway` (Autopista Elevada / Freeway)
Construye tramos de autopista elevada de 4 carriles (36 studs de ancho) a +22 studs de altura sostenida por pilares macizos en T (*hammerhead piers*), barreras laterales New Jersey, pórticos verdes interestatales y rampas de acceso al suelo:

```jsonc
{
  "name": "East_West_Freeway",
  "start_point": [-200, 22, 0],
  "end_point": [200, 22, 0],
  "road_width": 36,
  "elevation": 22,
  "include_piers": true,
  "include_gantry_sign": true,
  "include_ramp": true,
  "ramp_side": "Right",
  "parent": "City/Highways"
}
```

---

### 13. `build_parking_lot` (Estacionamientos Comerciales y Públicos)
Explanada de aparcamiento profesional con asfalto, bordillos, plazas delimitadas, plazas accesibles en azul, topes de rueda de hormigón (*wheel stops*), isletas con palmeras, torres de focos altos y barrera de acceso levadiza:

```jsonc
{
  "name": "Supermarket_Parking",
  "center": [0, 0, 0],
  "size": [90, 80],
  "include_landscaping": true,
  "include_light_poles": true,
  "include_pay_station": true,
  "include_barrier_gate": true,
  "parent": "City/Parking"
}
```

---

### 14. Herramientas Interactivas de Level Design en Studio

#### `get_selection` (Conciencia de Selección Viva)
Lee qué objetos tienes seleccionados con el ratón en Studio. No requiere parámetros:
```jsonc
// Retorna: [{ name: "House_01", className: "Model", position: [100, 0, 100], size: [56, 22, 72], partCount: 42, anchored: true, tags: ["House"] }]
```

#### `transform_object` (Manipulación 3D)
Mueve o rota un objeto en Workspace o la selección activa (`"selected"`):
```jsonc
{
  "target_path": "selected",
  "offset": [10, 0, 0],             // Mover 10 studs en X
  "rotation_offset": [0, 90, 0],     // Girar 90 grados
  "snap_grid": 4
}
```

#### `align_to_surface` (Imán al Suelo / Magnet Drop)
Asienta con raycast vertical hacia abajo cualquier objeto flotante o enterrado:
```jsonc
{
  "target_path": "selected",
  "align_normal": true              // Alinear rotación a la inclinación de la colina
}
```

#### `duplicate_and_repeat` (Clonación en Serie / Array)
Duplica un objeto $N$ veces a lo largo de un vector de desplazamiento:
```jsonc
{
  "target_path": "City/Props/Street_Lamp",
  "count": 5,
  "offset_step": [0, 0, 40],        // Una farola cada 40 studs
  "parent": "City/Props"
}
```

#### `measure_distance` (Métrica Espacial y Línea de Visión)
Mide distancias, pendiente y si hay línea de visión sin obstáculos:
```jsonc
{
  "point_a": [0, 0, 0],
  "point_b": [120, 15, 80],
  "check_line_of_sight": true
}
```

#### `audit_performance` & `optimize_workspace` (Escudo de Rendimiento)
Audita lag físico y optimiza en 1 clic:
```jsonc
// 1. Auditar:
{ "target_path": "Workspace" }

// 2. Optimizar:
{
  "target_path": "Workspace",
  "anchor_static": true,
  "enable_streaming_lod": true
}
```

#### `focus_camera` (Teletransporte de Cámara de Studio)
Centra y encuadra la cámara en el viewport de Studio sobre un objeto o coordenadas:
```jsonc
{
  "target_path": "City/Landmarks/Gas_Station_24_7",
  "view_mode": "perspective_overhead" // "perspective_overhead" | "front" | "top_down" | "orbit"
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

1. **Fase 1 — Terreno Base y Canal:** Suelo general de $4,000 \times 3,600\text{ studs}$ en `Y = 0` y la trinchera del Canal Sur en `Y = -12`. Carpeta: `City/Terrain`.
2. **Fase 2 — Autopista Elevada:** Puente horizontal en `Y = 50` con pilares y rampas en cuña (`WedgePart`). Carpeta: `City/Highways`.
3. **Fase 3 — Red de Calles:** Trazado de avenidas principales con `create_street` (asfalto, aceras y farolas). Carpeta: `City/Streets`.
4. **Fase 4 — Zona 3 (Oeste - Barrio Bajo):** Taller mecánico, callejones, contenedores (`dumpster`) y base de la Pandilla B. Carpeta: `City/West_District`.
5. **Fase 5 — Zona 5 (Centro - Barrio Intermedio):** Mercado central, plazas públicas y mostradores. Carpeta: `City/Midtown`.
6. **Fase 6 — Zona 4 (Este - Downtown):** Banco Central (`set_hollow_box`), rascacielos graybox y zona financiera. Carpeta: `City/Downtown`.
7. **Fase 7 — Zona 1 (Norte - Montaña y Favela):** Terrazas con `raycast_query`, zigzag de calles con cuñas, escaleras `TrussPart` y la base fortificada de la Pandilla A en `Y = 150`. Carpeta: `City/Favela`.

---

## 5. Instrucciones para Interactuar con OpenCode

> [!IMPORTANT]
> **No pegues los bloques JSON crudos en el chat de OpenCode.**
> OpenCode es el agente que se encarga de estructurar y enviar el JSON al motor. Para pedirle que construya cualquiera de las fases, dale la orden en lenguaje natural en un **nuevo chat (`+`)**:
>
> * *"Usa build_structure para generar la Fase 1: Terreno Base de 4000x3600 y el Canal Sur."*
> * *"Traza la avenida principal de 600 studs con create_street en X = 0."*
> * *"Coloca un mostrador de atención en el Banco con spawn_prop type='counter'."*
> * *"Usa inspect_area en (400, 0, -200) para ver cuánto espacio libre queda junto al banco."*

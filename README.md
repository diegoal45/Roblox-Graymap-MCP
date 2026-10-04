# Roblox Studio Graybox, Level Design & AAA Urban Engine MCP

Servidor **Model Context Protocol (MCP)** de nivel profesional que conecta asistentes de Inteligencia Artificial (OpenCode, Claude Desktop, Antigravity) bidireccionalmente con **Roblox Studio**.

Transforma el desarrollo de juegos en Roblox permitiendo:
1. **Level Design Interactivo en Vivo:** El asistente lee lo que seleccionas en Roblox Studio, mide distancias, comprueba líneas de visión, asienta objetos con raycast y mueve/duplica modelos en tiempo real.
2. **Generación Urbana Estilo GTA: San Andreas:** Construcción paramétrica de alta fidelidad: barrios residenciales unifamiliares con porches y chimeneas (tipo Grove St / Ganton / San Fierro), autopistas elevadas con pilares de hormigón en T, gasolineras 24/7, diners con *Drive-Thru*, estacionamientos con *wheel stops*, semáforos en mástil y palmeras californianas.
3. **Escudo de Rendimiento y Auditoría Forense:** Detección automática de lag físico (piezas desancladas), optimización de colisiones (`CanTouch = false`), activación de LOD `StreamingMesh` y soporte nativo de Deshacer/Rehacer (`Ctrl + Z`).
4. **Motor de Terreno Voxel Nativo:** Generación procedural de 8 biomas con cálculo de pendientes, cimentación de parcelas y excavación de carreteras y túneles subterráneos.

---

## 1. Arquitectura y Protocolo de Comunicación Bidireccional

El sistema opera mediante una conexión desacoplada y robusta que garantiza que Roblox Studio nunca se bloquee ni congele, independientemente de la complejidad de la geometría generada:

```text
 ┌────────────────────────┐         stdio         ┌───────────────────────────────────────┐
 │   Cliente MCP (IA)     │ ◄───────────────────► │        Servidor Node.js / Express     │
 │ (OpenCode / Antigravity│                       │          (roblox-graybox-mcp)         │
 └────────────────────────┘                       └──────────────────┬────────────────────┘
                                                                     │ HTTP Local (127.0.0.1:30250)
                                                                     │ • GET /poll (Cola de comandos)
                                                                     │ • POST /response (Retorno de datos)
                                                                     ▼
                                                  ┌───────────────────────────────────────┐
                                                  │       Plugin de Roblox Studio         │
                                                  │      (DockWidget UI Rojo + Luau)      │
                                                  └──────────────────┬────────────────────┘
                                                                     │
                                      ┌──────────────────────────────┴──────────────────────────────┐
                                      ▼                                                             ▼
                          ┌───────────────────────┐                                     ┌───────────────────────┐
                          │  ChangeHistoryService │                                     │   Servicios de Studio │
                          │ (Undo / Redo Atómico) │                                     │ Selection, Camera,    │
                          │   • Ctrl + Z nativo   │                                     │ CollectionService,    │
                          │   • Poda de colisiones│                                     │ Terrain, Raycast      │
                          └───────────────────────┘                                     └───────────────────────┘
```

### ¿Cómo Funciona el Enlace por Debajo?

1. **Cola de Polling No Bloqueante (`/poll`):** El plugin de Roblox Studio consulta cada `0.35s` al servidor local Node.js. Si no hay comandos pendientes, el servidor responde con `HTTP 204 No Content` para mantener el uso de CPU al 0%.
2. **Ejecución Protegida y Deshacer Atómico:** Cada lote de construcción o transformación se envuelve dentro de `ChangeHistoryService:TryBeginRecording(...)` y `pcall()`. Si algo falla, la transacción se cancela limpiamente sin dejar piezas corruptas. El desarrollador puede presionar `Ctrl + Z` en Studio en cualquier momento para deshacer un distrito o acción completa en 1 solo paso.
3. **Retorno de Datos Bidireccional (`/response`):** Gracias a la integración de `loadstring`, cualquier script Luau ejecutado puede retornar una tabla de datos (`return { ... }`). El plugin serializa el resultado en JSON y lo devuelve al servidor Node.js, permitiendo a la IA leer datos en tiempo real de la selección activa, diagnósticos de lag o mediciones espaciales.
4. **Poda Automática de Colisiones y Rendimiento (Performance Shield):** Toda pieza generada aplica por defecto `CanTouch = false` y `CanQuery = false` a menos que sea un suelo transitable o muro de colisión, reduciendo el overhead de detección de colisiones de Roblox en un 80%.

---

## 2. Pilares de Diseño y Buenas Prácticas Arquitectónicas

> [!IMPORTANT]
> **Más allá de la descripción:** A continuación se detallan los principios técnicos y las reglas de diseño implementadas en este MCP para evitar los errores comunes que hacen que las ciudades en Roblox se vean "planas, vacías y como bloques de juguete":

### 1. La Regla del Asentamiento (The Grounding Principle)
Uno de los problemas más graves en Roblox Studio es que los edificios generados procedimentalmente "flotan" sobre colinas o se entierran en desniveles.
* **Zócalo Plinto:** Todo edificio y casa generada incorpora un zócalo que sobresale entre `0.4` y `0.8 studs` hacia afuera y se clava entre `2` y `4 studs` en el suelo para absorber desniveles.
* **Imán al Suelo (`align_to_surface`):** Dispara un raycast vertical hacia abajo desde el centro del BoundingBox del modelo, calcula la cota exacta de contacto con el suelo o terreno y asienta la base a cota 0 con precisión milimétrica.
* **Nivelado de Parcelas (`flatten_terrain_area`):** Aplana la colina con `Air` y rellena las depresiones inferiores con cimientos macizos nivelados antes de construir.

### 2. Fidelidad de Materiales PBR vs `SmoothPlastic`
Roblox trata `SmoothPlastic` como una superficie sin rugosidad ni normales, luciendo como bloques de plástico brillante de juguete sin sombras difusas.
* Este MCP utiliza **materiales PBR nativos de Roblox**: `Brick` (ladrillos envejecidos con relieve), `Concrete` (hormigón poroso para aceras y pilares), `Granite` (bordillos de calzada), `Slate` (tejados y cornisas), `WoodPlanks` (tablas de porche y contraventanas), `Fabric` (toldos comerciales a 45°) y `Glass` reflectante con transparencia calibrada (`0.3` a `0.6`).

### 3. Fachadas Articuladas en 3D en las 4 Direcciones (No Muros Ciegos)
Muchos generadores solo decoran la fachada frontal y dejan las otras 3 caras como bloques planos grises.
* **Orientación Perimetral Dinámica:** En `generate_district`, cada una de las 4 manzanas perimetrales calcula su orientación hacia la calle exterior correspondiente (Norte, Sur, Este u Oeste).
* **Profundidad de Ventanas:** Las ventanas no son texturas planas; están formadas por alféizar saliente (`0.6 studs`), dintel superior, parteluces divisorios y marco exterior en relieve 3D.
* **Portales Monumentales Remetidos:** Las entradas de los edificios están rehundidas `2 studs` hacia el interior del edificio, con doble puerta acristalada, manillones metálicos, espejo y marquesina suspendida con focos LED.

### 4. Presupuesto de Rendimiento para 50+ Jugadores Simultáneos
* **LOD StreamingMesh:** Todo modelo arquitectónico de más de 8 partes tiene activado `LevelOfDetail = Enum.ModelLevelOfDetail.StreamingMesh`, permitiendo a Roblox simplificar la malla a la distancia.
* **Anclaje Obligatorio:** En Roblox, cualquier pieza con `Anchored = false` entra en el pipeline de simulación física de Havok/Roblox. Cientos de piezas decorativas desancladas causan caídas drásticas de FPS. La herramienta `audit_performance` detecta cualquier pieza desanclada y `optimize_workspace` la ancla en 1 clic.
* **Poda de Sombras en Detalles Minúsculos:** Desactiva `CastShadow` en piezas menores de 3 studs (pomos de puerta, parteluces, buzones) para no saturar el buffer de sombras de `Future Lighting`.

---

## 3. Métricas Oficiales de Nivel de Diseño (Avatar Roblox R15)

Dimensiones y ergonomía mecánica respetadas en todos los generadores y herramientas:

| Elemento | Dimensión | Justificación Mecánica |
| :--- | :--- | :--- |
| **Avatar R15 (Hitbox)** | `4 x 5 x 2 studs` | Ancho, Alto, Profundidad del personaje |
| **Salto Estándar** | `7.2 studs` de alto | Alcance vertical libre sin escalar |
| **Paso de Escalón (Max)** | `1.2 studs` de alto | Altura máxima que el avatar sube caminando sin saltar |
| **Peldaño Ideal** | Alto: `0.8 st`, Huella: `2.0 st` | Subida fluida a velocidad normal |
| **Vano de Puerta** | `5 x 8.5 studs` | Permite el paso holgado con accesorios y sombreros |
| **Pasillo Estándar** | `8 - 12 studs` | Espacio libre para 1 a 2 jugadores con cámara holgada |
| **Carril de Tráfico** | `12 studs` de ancho | Ancho estándar de carril para vehículos de Roblox |
| **Acera Peatonal** | `6 - 8 studs` de ancho, `+0.6 st` altura | Elevación respecto al asfalto con bordillo de granito |
| **Cobertura Baja (Crouch)** | `3.0 studs` de altura | Permite asomarse o disparar agachado |
| **Cobertura Alta (Stand)** | `6.5 studs` de altura | Cobertura total de cuerpo completo de pie |

---

## 4. Catálogo Completo de Herramientas (Tool Reference)

El MCP cuenta con **33 herramientas** agrupadas en 4 categorías:

### Grupo A: Herramientas de Estudio y Level Design (Interactivas)

| Herramienta | Parámetros Clave | Descripción y Capacidades |
| :--- | :--- | :--- |
| `get_selection` | Ninguno | **Conciencia de Selección Viva:** Lee qué tienes seleccionado con el ratón en Studio (`Selection:Get()`). Devuelve posiciones `[X, Y, Z]`, dimensiones, tags, número de piezas y estado de anclaje. |
| `set_selection` | `target_paths`, `target_path` | **Selección Programática:** Selecciona y resalta visualmente en la ventana de Studio instancias por ruta o tag. |
| `transform_object` | `target_path`, `position`, `offset`, `rotation`, `rotation_offset`, `snap_grid` | **Manipulación 3D:** Mueve o rota modelos o partes de forma absoluta o relativa con ajuste opcional a rejilla modular. Si `target_path = "selected"`, actúa sobre la selección activa. |
| `align_to_surface` | `target_path`, `offset_y`, `align_normal`, `raycast_distance` | **Imán al Suelo (Magnet Drop):** Asienta con raycast milimétrico modelos flotantes o enterrados contra el terreno, con opción de alineación normal a la pendiente. |
| `duplicate_and_repeat` | `target_path`, `count`, `offset_step`, `rotation_step`, `parent` | **Clonación en Serie (Array Tool):** Duplica un objeto $N$ veces a lo largo de un vector de desplazamiento y rotación incremental (hileras de farolas, árboles, vallas). |
| `measure_distance` | `point_a`, `point_b`, `object_a_path`, `object_b_path`, `check_line_of_sight` | **Métrica Espacial & Línea de Visión:** Mide distancia euclídea 3D, distancia horizontal XZ, desnivel Y, pendiente en grados y comprueba si hay línea de visión sin obstáculos. |
| `find_objects` | `query_name`, `class_name`, `material`, `tag`, `scope_path`, `max_results` | **Buscador Forense de Workspace:** Filtra y localiza instancias combinando nombre, clase (`Model`, `Part`, `Light`, `Seat`), material PBR o tag de CollectionService. |
| `audit_performance` | `target_path` | **Auditoría Forense de Rendimiento:** Analiza el mapa en busca de partes desancladas (lag de físicas), colisiones en piezas diminutas, modelos sin LOD y exceso de sombras. |
| `optimize_workspace` | `target_path`, `anchor_static`, `optimize_collisions`, `enable_streaming_lod`, `disable_small_shadows`, `clean_empty` | **Escudo de Rendimiento en 1 Clic:** Corrige automáticamente las deficiencias detectadas: ancla piezas estáticas, poda colisiones, activa StreamingMesh y limpia carpetas vacías. |
| `replace_material_or_color`| `target_path`, `source_material`, `target_material`, `source_color`, `target_color` | **Cambiador en Lote de Materiales/Paletas:** Sustituye en masa un material por otro (ej: todo `SmoothPlastic` a `Concrete`) o actualiza colores RGB en un distrito o modelo. |
| `focus_camera` | `target_path`, `position`, `view_mode`, `distance` | **Teletransporte y Enfoque de Cámara:** Orienta y posiciona la cámara de Studio (`workspace.CurrentCamera`) hacia un objeto o punto desde varios ángulos (`perspective_overhead`, `front`, `top_down`, `orbit`). |
| `adjust_lighting` | `clock_time`, `exposure`, `brightness`, `outdoor_ambient`, `fog_end`, `fog_color` | **Ajustes de Iluminación en Tiempo Real:** Modifica dinámicamente las propiedades del servicio `Lighting` de Roblox Studio. |
| `check_studio_connection` | Ninguno | Comprueba si Roblox Studio y el plugin están conectados y activos en `127.0.0.1:30250`. |
| `inspect_area` | `position`, `radius`, `max_results` | Consulta qué objetos o modelos existen alrededor de un punto para medir el espacio libre antes de construir. |
| `raycast_query` | `origin`, `direction`, `distance` | Dispara un raycast desde un punto para consultar altura del suelo, inclinación y material. |
| `get_workspace_layout` | `folder_path`, `max_depth` | Lee el árbol de jerarquía, bounding boxes, posiciones y tags de objetos existentes en Studio. |
| `clear_folder` | `folder_path` | Elimina una carpeta específica de Workspace o todo `City` / `Graybox`. |
| `execute_raw_luau` | `code`, `actionName` | Ejecuta cualquier código Luau arbitrario con registro en ChangeHistoryService (`Ctrl + Z`). |

---

### Grupo B: Motor Urbano y Residencial Estilo GTA San Andreas

| Herramienta | Parámetros Clave | Descripción y Capacidades |
| :--- | :--- | :--- |
| `build_house` | `name`, `position`, `lot_size`, `style`, `has_garage`, `has_porch`, `has_fence`, `has_yard_props` | **Casa Residencial Realista:** Construye viviendas unifamiliares detalladas (`suburban_bungalow` tipo Grove St / Ganton, `victorian_rowhouse` tipo San Fierro, `vinewood_mansion`, `duplex_apartment`). Tejado a dos aguas con aleros (`WedgePart`), chimenea de ladrillo, porche cubierto con barandilla y farol, ventanas con contraventanas de madera (*shutters*), garaje con portón y camino de hormigón (*driveway*), buzón americano y patio trasero con barbacoa. |
| `build_landmark` | `type`, `position`, `rotation_y`, `seed`, `parent` | **Hitos Urbanos y Servicios:**<br>• `gas_station`: Gran marquesina iluminada, 4 surtidores con mangueras, tienda de conveniencia 24/7 con rótulos luminosos, tótem de precios gigante y máquina de hielo.<br>• `fast_food_diner`: Restaurante tipo Burger Shot con carril *Drive-Thru* transitable, poste de menú con interfono, ventanilla de recogida y gran tótem elevado.<br>• `police_station`: Comisaría de 2 plantas con 3 cocheras para patrullas con portones enrollables, helipuerto operativo en azotea con balizas de aterrizaje y torre de radio. |
| `place_traffic_signage` | `type`, `position`, `rotation_y`, `street_a`, `street_b`, `speed_limit`, `arrow_type` | **Señalización Vial y Semáforos:**<br>• `intersection_traffic_light`: Semáforo en poste con brazo curvado (*mast-arm*) sobre la calzada con ópticas 3D (rojo, ámbar, verde con luces), señal peatonal y placas de calles.<br>• `stop_sign`: Señal octogonal de STOP en poste de aluminio.<br>• `street_name_sign`: Placas cruzadas con nombres de calles (ej: *"GROVE ST / GANTON AVE"*).<br>• `speed_limit`: Señal de límite de velocidad oficial (35 / 45 MPH).<br>• `road_arrows`: Flechas termoplásticas reflectantes en el asfalto (recto, giro, recto+giro). |
| `build_elevated_highway` | `name`, `start_point`, `end_point`, `road_width`, `elevation`, `include_piers`, `include_gantry_sign`, `include_ramp`, `ramp_side` | **Autopista Elevada (Freeway):** Calzada de 4 carriles (36 studs de ancho) a +22 studs de altura sostenida por pilares macizos de hormigón armado en T (*hammerhead piers*), barreras laterales New Jersey de hormigón, pórticos de señalización verde interestatal (*"LOS SANTOS / DOWNTOWN / AIRPORT"*) y rampas de incorporación/salida hasta cota 0. |
| `build_parking_lot` | `name`, `center`, `size`, `rows`, `include_landscaping`, `include_light_poles`, `include_pay_station`, `include_barrier_gate` | **Estacionamiento Comercial y Público (Sin Vehículos):** Explanada de asfalto con bordillos perimetrales, plazas delimitadas con líneas blancas/amarillas y plazas PMR accesibles (azul), topes de rueda de hormigón (*wheel stops*), isletas ajardinadas con palmeras, torres de focos altos, cajero automático techado y barrera levadiza. |
| `spawn_palm_tree` | `position`, `height`, `seed`, `parent` | **Palmera Californiana Gigante (Fan Palm):** Palmera icónica estilo Los Santos / Los Ángeles de 28 a 40 studs de altura con tronco curvado segmentado de madera fibrosa y copa de hojas de palma (*fronds*) inclinadas realistas. |
| `build_pocket_park` | `name`, `center`, `size`, `has_gazebo`, `has_fountain`, `parent` | **Parque Urbano de Bolsillo / Plaza Ajardinada:** Caminos cruzados de grava, pradera de césped, cenador/gazebo hexagonal de madera transitable con cúpula, fuente circular de agua reflectante, bancos victorianos, farolas y palmeras. |
| `generate_district` | `name`, `center`, `size`, `district_type`, `style`, `density`, `street_width`, `has_furniture`, `has_power_lines`, `has_plaza` | **Generador Urbano Macro AAA:** Crea distritos completos con calzadas de asfalto, bordillos de granito, pasos de cebra, postes de madera con cables eléctricos aéreos tendidos, callejones con dumpsters y plaza central con fuente. Soporta `district_type: "commercial_downtown"` y `"residential_suburb"`. |
| `build_detailed_structure` | `name`, `position`, `footprint`, `floors`, `style`, `seed`, `has_roof_props`, `has_balconies`, `has_setbacks` | **Edificio Arquitectónico AAA:** Edificio multinivel con articulación 3D en las 4 caras, portal monumental remetido con marquesina, escaparates comerciales con toldos a 45°, ventanas con alféizar e iluminación interior heterogénea, y azotea habitable con HVAC, tanque de agua cilíndrico y antena con baliza roja. |

---

### Grupo C: Motor de Terreno Voxel Nativo (Roblox Smooth Terrain)

| Herramienta | Parámetros Clave | Descripción y Capacidades |
| :--- | :--- | :--- |
| `generate_terrain` | `center`, `size`, `biome`, `base_height`, `height_amplitude`, `water_level`, `resolution`, `seed` | **Paisajes Procedurales Voxel:** Genera biomas de alta fidelidad (`mountains`, `hills`, `canyon`, `plains`, `dunes`, `island`, `river_valley`, `plateau`) calculando pendientes y estratos geológicos con el motor nativo de voxeles de Roblox. |
| `flatten_terrain_area` | `position`, `size`, `material`, `foundation_depth`, `clear_height`, `blend_margin`, `retaining_wall` | **Nivelado de Parcelas Urbanas:** Despeja montes con `Air` y rellena cimientos sólidos nivelados de hormigón para asentar distritos o autopistas sin que floten. |
| `carve_terrain_path` | `start_point`, `end_point`, `waypoints`, `width`, `height`, `mode`, `surface_material` | **Trazado de Rutas en Terreno:** Excava carreteras a cielo abierto (`road`), túneles subterráneos abovedados que mantienen intacta la cima de la montaña (`tunnel`), canales fluviales navegables con agua (`river`) o trincheras (`trench`). |
| `shape_terrain` | `shape`, `operation`, `position`, `size`, `radius`, `rotation`, `material` | **Esculpido Paramétrico:** Inserta o sustrae primitivas (`Block`, `Ball`, `Cylinder`, `Wedge`) con adición de material o excavación con `Air`. |
| `paint_terrain_material` | `mode`, `center`, `size`, `target_material`, `source_material`, `region_bounds` | **Pintura y Reemplazo de Materiales:** Sustituye materiales nativos mediante `Terrain:ReplaceMaterial` (ej: cambiar todo `Grass` por `Snow` o `Sand`). |
| `clear_terrain` | `all`, `region_bounds` | Elimina todo el terreno del mundo (`workspace.Terrain:Clear()`) o un sector específico con soporte `Ctrl + Z`. |
| `configure_water` | `color`, `reflectance`, `transparency`, `wave_size`, `wave_speed` | Configura propiedades visuales y cinemáticas del agua de `workspace.Terrain`. |

---

### Grupo D: Infraestructura, Geometría Primitiva y Sistemas de Juego

| Herramienta | Parámetros Clave | Descripción y Capacidades |
| :--- | :--- | :--- |
| `build_structure` | `parts_list`, `default_parent`, `snap_grid`, `auto_optimize` | **Batching Masivo + Performance Shield:** Instancia lotes de decenas o cientos de piezas de cualquier primitiva (`Block`, `Wedge`, `CornerWedge`, `Truss`, `Cylinder`, `Sphere`) con poda automática de colisiones y LOD StreamingMesh. |
| `set_hollow_box` | `name`, `position`, `size`, `doors`, `include_parapet`, `include_lighting`, `include_baseboard` | **Estructura Hueca Profesional:** Habitación o edificio hueco completo (suelo, techo, 4 paredes con vanos de puerta transitables, zócalo, cornisas de azotea y luz interior). |
| `create_street` | `name`, `start_position`, `end_position`, `road_width`, `sidewalk_width`, `has_lanes`, `has_lamps` | Genera una calzada recta de asfalto con aceras elevadas, líneas divisorias amarillas y farolas automáticas. |
| `create_curved_road` | `name`, `waypoints`, `road_width`, `has_sidewalks`, `has_lamps` | **Carreteras Curvas Bézier:** Trazado vial suave y peraltado adaptado a laderas y curvas de montaña. |
| `create_intersection` | `name`, `center`, `type`, `radius`, `has_traffic_lights` | Glorietas circulares (*roundabouts*) con jardín/monumento central, o cruces de 4 vías / cruces en T con semáforos funcionales. |
| `generate_favela` | `name`, `center`, `size`, `slope_direction`, `elevation_gain`, `seed`, `has_footbridges` | **Urbanismo Orgánico de Favela en Ladera:** Terrazas escalonadas, callejones peatonales estrechos (*vielas*), escaleras transitables, casas apiladas con voladizos, caixas d'água azules, pasarelas entre azoteas y maraña de cables eléctricos. |
| `create_playable_interior` | `name`, `center`, `size`, `floors`, `theme`, `has_stairs`, `interactive_doors` | **Interiores Jugables y Conexión Vertical:** Hueco de escalera continuo para caminar hasta la azotea sin saltar, habitaciones amuebladas y puertas animadas con `TweenService` ('E'). |
| `scatter_foliage_and_clutter` | `name`, `center`, `radius`, `biome`, `count`, `seed` | Distribuye cientos de árboles, rocas o atrezzo urbano con detección de suelo por Raycast y filtro de pendientes. |
| `setup_environment` | `preset`, `clock_time`, `enable_future_lighting`, `shadow_softness` | Atmósfera cinemática: Future Lighting, sombras suaves, post-procesado (Atmosphere, Bloom, ColorCorrection, SunRays). |
| `inject_game_mechanics` | `enable_door_controller`, `enable_day_night_lighting`, `enable_team_spawns` | Scripts de ServerScriptService para puertas interactivas ('E'), ciclo día/noche de farolas y spawns tácticos. |
| `spawn_prop` | `type`, `position`, `rotation_y`, `length`, `parent` | Muebles y atrezzo táctico (`counter`, `desk`, `shelf`, `dumpster`, `barrier`, `street_lamp`, `dummy`). |
| `spawn_wedge` | `name`, `position`, `size`, `rotation`, `parent` | Cuñas (WedgePart) para rampas de autopista, desniveles y tejados. |
| `spawn_truss` | `name`, `position`, `height`, `parent` | Escaleras técnicas verticales (TrussPart) escalables por el avatar. |
| `create_stairs` | `startX`, `startY`, `startZ`, `width`, `totalHeight`, `direction` | Escaleras peatonales fluidas ($\le 1.1\text{ studs}$ por peldaño). |
| `add_tags_and_attributes` | `target_path`, `tags`, `attributes`, `recursive` | Asigna tags de CollectionService y atributos a partes o modelos existentes. |

---

## 5. Puesta en Marcha e Instalación

### 1. Requisitos
* **Node.js** v18 o superior.
* **Roblox Studio** con un Place abierto.
* **OpenCode** (o cliente MCP compatible como Claude Desktop o Antigravity).

### 2. Configurar Roblox Studio
1. Abre tu Place en **Roblox Studio**.
2. Ve a **Home > Game Settings > Security** y activa **Allow HTTP Requests** (obligatorio para que el plugin se comunique con el servidor local en el puerto `30250`).
3. El archivo del plugin ya se encuentra precompilado e instalado en tu carpeta local de plugins:
   `%LOCALAPPDATA%\Roblox\Plugins\GrayboxBridge.rbxmx`
4. En la barra superior de Studio, en la pestaña **Plugins**, haz clic en el botón **Graybox MCP** para desplegar la ventana acoplable lateral roja.

### 3. La Interfaz Dockable de Roblox Studio (Panel Rojo)
El panel lateral del plugin incluye controles directos para el desarrollador:
* **Fila 1:**
  * `⏸️ Pausar`: Suspende temporalmente el polling del servidor MCP.
  * `🔄 Probar`: Envía un ping HTTP a `127.0.0.1:30250` para confirmar que el servidor Node.js está activo.
  * `🧹 Limpiar`: Elimina carpetas de prueba (`City`, `Graybox`) con soporte `Ctrl + Z`.
* **Fila 2 (Herramientas Rápidas de Level Design):**
  * `🎯 Sel Info`: Imprime en la consola del plugin la información y coordenadas exactas de lo que tienes seleccionado en Studio.
  * `⚡ Optimizar`: Analiza al instante el estado de anclaje de todas las partes en Workspace.
  * `👁️ Enfocar`: Centra y orienta la cámara del viewport de Studio sobre el objeto seleccionado.

### 4. Configurar OpenCode (`opencode.json`)
Añade el servidor a tu archivo de configuración `~/.config/opencode/opencode.json`:

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

## 6. Flujos de Trabajo Prácticos (Level Design Workflows)

### Flujo 1: Crear un Barrio Suburbano Estilo Grove Street
1. **Nivelar el terreno:**
   > *"Nivela una parcela con `flatten_terrain_area` en [0, 0, 0] de 240x240 studs con material Grass."*
2. **Generar el distrito residencial:**
   > *"Usa `generate_district` para crear un distrito en [0, 0] de tamaño 240x240 con `district_type: 'residential_suburb'`. Quiero casas con porches y chimeneas, postes con cables eléctricos y mobiliario urbano."*
3. **Añadir el parque vecinal:**
   > *"Construye un parque de bolsillo en [60, 0, 60] con `build_pocket_park` con gazebo de madera, bancos y palmeras."*
4. **Semáforos y cruces:**
   > *"Coloca semáforos de mástil curvado en los cruces con `place_traffic_signage` y placas de 'GROVE ST / GANTON AVE'."*

### Flujo 2: Construir un Nudo Comercial con Gasolinera, Diner y Autopista
1. **Gasolinera 24/7:**
   > *"Construye una gasolinera en [150, 0, 0] con `build_landmark` (`gas_station`)."*
2. **Restaurante Burger Shot:**
   > *"Al lado, en [150, 0, 100], coloca un Diner de comida rápida con Drive-Thru (`fast_food_diner`)."*
3. **Aparcamiento Comercial:**
   > *"Genera un estacionamiento de 90x80 studs frente a la gasolinera con `build_parking_lot` con plazas delimitadas, wheel stops y barrera levadiza."*
4. **Autopista Elevada:**
   > *"Construye una autopista elevada con `build_elevated_highway` desde [150, 22, -150] hasta [150, 22, 200] con pilares de hormigón en T, pórtico verde interestatal y rampa de acceso al suelo."*

### Flujo 3: Pair-Programming Interactivo con Selección
1. En **Roblox Studio**, haz clic en cualquier modelo o edificio que te guste.
2. En el chat de **OpenCode / Antigravity**, di:
   > *"Dime qué tengo seleccionado en Studio usando `get_selection`."*
3. El asistente te devolverá su posición, tamaño y piezas.
4. Luego di:
   > *"Duplícalo 4 veces hacia adelante cada 40 studs con `duplicate_and_repeat` y asienta cada copia al terreno con `align_to_surface`."*
5. Finalmente:
   > *"Enfoca la cámara de Studio en la última copia generada con `focus_camera`."*

### Flujo 4: Auditoría y Optimización de Rendimiento en 1 Clic
Antes de publicar o testear el juego con jugadores reales:
1. > *"Ejecuta `audit_performance` en Workspace para ver si hay lag de físicas o modelos desoptimizados."*
2. El asistente reportará partes desancladas, modelos sin StreamingMesh y exceso de sombras.
3. > *"Aplica `optimize_workspace` para anclar todo y dejar el mapa a 60 FPS estables."*

---

## 7. Solución de Problemas Frecuentes (Troubleshooting)

### 1. "Roblox Studio NO está conectado al bridge actualmente en 127.0.0.1:30250"
* **Causa A:** No tienes Roblox Studio abierto con un Place cargado.
* **Causa B:** La opción **Allow HTTP Requests** está desactivada en Studio. Ve a **Home > Game Settings > Security** y actívala.
* **Causa C:** El botón del plugin no está activado. Haz clic en **Graybox MCP** en la pestaña Plugins de Studio. En la ventana roja, presiona el botón **🔄 Probar**. Si responde en verde, la conexión está lista.

### 2. "OpenCode dice: No dispongo de esa herramienta en esta sesión"
* En OpenCode Desktop, cada chat congela la lista de herramientas en el instante en que se abre. Si añadiste o actualizaste el MCP mientras tenías un chat abierto, haz clic en el botón **`+`** (arriba a la izquierda) para iniciar una sesión fresca con todas las herramientas recargadas.

### 3. "La cámara de Studio no se mueve con focus_camera"
* La cámara solo se puede manipular si estás en **modo Edit** (construcción). Si estás en modo *Play Solo* (probando el juego con tu avatar), la cámara está bajo el control del `PlayerScript` del avatar.

### 4. "El mapa tiene microtirones de físicas (micro-stutters)"
* Ejecuta `audit_performance`. Si hay partes desancladas (`Anchored = false`), la gravedad de Roblox intenta calcular contactos de colisión en cada frame. Ejecuta `optimize_workspace` con `anchor_static: true` para fijarlas al mundo.

---

## 8. Scripts y Telemetría del Proyecto

* **Recompilar el plugin de Studio:**
  ```bash
  node scripts/buildPlugin.js
  ```
* **Ejecutar el Test Suite completo (24 pruebas de Luau y generadores):**
  ```bash
  node scripts/testGenerators.js
  ```
* **Resumen de actividad y llamadas MCP (`logs/mcp-activity.jsonl`):**
  ```bash
  npm run logs:summary
  ```
* **Limpiar el historial de logs:**
  ```bash
  npm run logs:clear
  ```
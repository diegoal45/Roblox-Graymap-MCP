import { generateDetailedBuildingLuau } from "../src/generators/detailedBuilding.js";
import { generateHouseLuau } from "../src/generators/house.js";
import { generateLandmarkLuau } from "../src/generators/landmarks.js";
import { generateTrafficSignageLuau } from "../src/generators/trafficSignage.js";
import { generateElevatedHighwayLuau } from "../src/generators/highway.js";
import { generateParkingLotLuau } from "../src/generators/parkingLot.js";
import { generateCaliforniaPalmLuau, generatePocketParkLuau } from "../src/generators/palmsAndParks.js";
import { generateDistrictLuau } from "../src/generators/district.js";
import {
  generateTransformObjectLuau,
  generateAlignToSurfaceLuau,
  generateDuplicateAndRepeatLuau,
  generateMeasureDistanceLuau,
  generateFindObjectsLuau,
  generateAuditPerformanceLuau,
  generateOptimizeWorkspaceLuau,
  generateReplaceMaterialOrColorLuau,
  generateFocusCameraLuau,
  generateAdjustLightingLuau,
} from "../src/generators/levelDesignTools.js";
import { generateDocksLuau } from "../src/generators/docks.js";
import { generateMotelLuau } from "../src/generators/motel.js";
import { generateStorageFacilityLuau } from "../src/generators/storageFacility.js";
import { generateStormCanalLuau } from "../src/generators/stormCanal.js";
import { generateShadyBusinessLuau } from "../src/generators/shadyBusiness.js";

const tests = [
  {
    name: "Detailed Building",
    fn: () => generateDetailedBuildingLuau({ position: [0, 0, 0], floors: 4, style: "modern_downtown" }),
  },
  {
    name: "House (suburban_bungalow)",
    fn: () => generateHouseLuau({ position: [100, 0, 100], style: "suburban_bungalow" }),
  },
  {
    name: "House (victorian_rowhouse)",
    fn: () => generateHouseLuau({ position: [100, 0, 100], style: "victorian_rowhouse" }),
  },
  {
    name: "Landmark (gas_station)",
    fn: () => generateLandmarkLuau({ type: "gas_station", position: [200, 0, 0] }),
  },
  {
    name: "Landmark (fast_food_diner)",
    fn: () => generateLandmarkLuau({ type: "fast_food_diner", position: [200, 0, 100] }),
  },
  {
    name: "Landmark (police_station)",
    fn: () => generateLandmarkLuau({ type: "police_station", position: [200, 0, 200] }),
  },
  {
    name: "Traffic Signage (traffic light)",
    fn: () => generateTrafficSignageLuau({ type: "intersection_traffic_light", position: [0, 0, 0] }),
  },
  {
    name: "Traffic Signage (stop sign)",
    fn: () => generateTrafficSignageLuau({ type: "stop_sign", position: [0, 0, 0] }),
  },
  {
    name: "Elevated Highway",
    fn: () => generateElevatedHighwayLuau({ startPoint: [0, 22, -100], endPoint: [0, 22, 100], includeRamp: true }),
  },
  {
    name: "Parking Lot",
    fn: () => generateParkingLotLuau({ center: [0, 0, 0], size: [80, 80] }),
  },
  {
    name: "California Palm",
    fn: () => generateCaliforniaPalmLuau({ position: [0, 0, 0], height: 35 }),
  },
  {
    name: "Pocket Park",
    fn: () => generatePocketParkLuau({ center: [0, 0, 0], size: [80, 80] }),
  },
  {
    name: "District (residential_suburb)",
    fn: () => generateDistrictLuau({ districtType: "residential_suburb", size: [240, 240] }),
  },
  {
    name: "District (commercial_downtown)",
    fn: () => generateDistrictLuau({ districtType: "commercial_downtown", size: [240, 240] }),
  },
  // Schedule 1 Modular Generators
  {
    name: "Docks Industrial Complex",
    fn: () => generateDocksLuau({ position: [0, 0, 0], containerStacks: 8, includeWarehouse: true }),
  },
  {
    name: "Roadside Motel (2-story)",
    fn: () => generateMotelLuau({ position: [0, 0, 0], roomsPerFloor: 6, includeNeonSign: true }),
  },
  {
    name: "Storage Facility (with secret lab)",
    fn: () => generateStorageFacilityLuau({ position: [0, 0, 0], rows: 2, unitsPerRow: 6, hasSecretLabUnit: true }),
  },
  {
    name: "Storm Drainage Canal",
    fn: () => generateStormCanalLuau({ position: [0, 0, 0], length: 160, width: 56, depth: 16 }),
  },
  {
    name: "Shady Business (Pawn Shop)",
    fn: () => generateShadyBusinessLuau({ position: [0, 0, 0], businessType: "pawn", includeDeadDrop: true }),
  },
  {
    name: "Shady Business (24/7 Pharmacy)",
    fn: () => generateShadyBusinessLuau({ position: [40, 0, 0], businessType: "pharmacy" }),
  },
  {
    name: "Shady Business (Bodega)",
    fn: () => generateShadyBusinessLuau({ position: [80, 0, 0], businessType: "bodega" }),
  },
  {
    name: "Shady Business (Laundromat)",
    fn: () => generateShadyBusinessLuau({ position: [120, 0, 0], businessType: "laundromat" }),
  },
  // Level Design & Manipulation Tools
  {
    name: "Transform Object",
    fn: () => generateTransformObjectLuau({ targetPath: "City/Downtown/Tower", position: [40, 10, 40], snapGrid: 4 }),
  },
  {
    name: "Align to Surface (Magnet Drop)",
    fn: () => generateAlignToSurfaceLuau({ targetPath: "City/Houses/House_1", alignNormal: true }),
  },
  {
    name: "Duplicate and Repeat (Array)",
    fn: () => generateDuplicateAndRepeatLuau({ targetPath: "City/Props/Street_Lamp", count: 5, offsetStep: [0, 0, 40] }),
  },
  {
    name: "Measure Distance",
    fn: () => generateMeasureDistanceLuau({ pointA: [0, 0, 0], pointB: [100, 20, 50], checkLineOfSight: true }),
  },
  {
    name: "Find Objects Query",
    fn: () => generateFindObjectsLuau({ queryName: "Building", className: "Model", maxResults: 15 }),
  },
  {
    name: "Audit Performance",
    fn: () => generateAuditPerformanceLuau({ targetPath: "Workspace" }),
  },
  {
    name: "Optimize Workspace",
    fn: () => generateOptimizeWorkspaceLuau({ targetPath: "Workspace", anchorStatic: true, enableStreamingLOD: true }),
  },
  {
    name: "Replace Material or Color",
    fn: () => generateReplaceMaterialOrColorLuau({ targetPath: "City", sourceMaterial: "SmoothPlastic", targetMaterial: "Concrete" }),
  },
  {
    name: "Focus Studio Camera",
    fn: () => generateFocusCameraLuau({ targetPath: "selected", viewMode: "perspective_overhead" }),
  },
  {
    name: "Adjust Lighting",
    fn: () => generateAdjustLightingLuau({ clockTime: 17.5, brightness: 2, outdoorAmbient: [140, 120, 110] }),
  },
];

let allPassed = true;
for (const t of tests) {
  try {
    const luau = t.fn();
    if (!luau || typeof luau !== "string" || luau.length < 50) {
      console.error(`❌ FAILED: ${t.name} generated empty or tiny code`);
      allPassed = false;
      continue;
    }
    if (luau.includes("undefined") || luau.includes("NaN")) {
      console.error(`❌ FAILED: ${t.name} contains 'undefined' or 'NaN' in output`);
      allPassed = false;
      continue;
    }
    console.log(`✅ PASSED: ${t.name} (${luau.length} chars Luau)`);
  } catch (err) {
    console.error(`❌ ERROR in ${t.name}:`, err);
    allPassed = false;
  }
}

if (allPassed) {
  console.log(`\n🎉 ALL ${tests.length} GENERATOR & TOOL TESTS PASSED WITH 0 ERRORS!`);
  process.exit(0);
} else {
  console.error("\n💥 SOME TESTS FAILED!");
  process.exit(1);
}

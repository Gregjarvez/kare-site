export type Rgb = readonly [number, number, number];

export type Sand = {
  id: string;
  name: string;
  colour: Rgb;
  tinted: Rgb;
  dark: Rgb;
  clear: Rgb;
  sparkle: number;
  grain: number;
  swatch: string;
};

export type Tray = {
  id: string;
  name: string;
  top: Rgb;
  topBands: Rgb;
  wall: Rgb;
  wallBands: Rgb;
  pores: number;
  swatch: [string, string];
};

export type Rod = {
  id: string;
  name: string;
  tint: Rgb;
  gloss: number;
  shine: number;
  swatch: [string, string];
};

export const SANDS: Sand[] = [
  { id: "ivory", name: "Ivory", colour: [0.89, 0.835, 0.72], tinted: [0.97, 0.92, 0.82], dark: [0.74, 0.7, 0.66], clear: [0.98, 0.97, 0.93], sparkle: 0.55, grain: 1, swatch: "/looks/sand-ivory.webp" },
  { id: "marble", name: "White marble", colour: [0.93, 0.925, 0.905], tinted: [0.95, 0.955, 0.97], dark: [0.62, 0.635, 0.66], clear: [1, 1, 0.99], sparkle: 0.55, grain: 1, swatch: "/looks/sand-marble.webp" },
  { id: "volcanic", name: "Black volcanic", colour: [0.33, 0.32, 0.31], tinted: [0.37, 0.34, 0.28], dark: [0.2, 0.2, 0.2], clear: [0.66, 0.66, 0.64], sparkle: 0.55, grain: 1, swatch: "/looks/sand-volcanic.webp" },
  { id: "desert", name: "Red desert", colour: [0.75, 0.45, 0.32], tinted: [0.81, 0.47, 0.29], dark: [0.52, 0.27, 0.18], clear: [0.97, 0.88, 0.78], sparkle: 0.55, grain: 1, swatch: "/looks/sand-desert.webp" },
  { id: "coral", name: "Pink coral", colour: [0.848, 0.716, 0.623], tinted: [0.71, 0.53, 0.3], dark: [0.75, 0.56, 0.4], clear: [0.96, 0.89, 0.85], sparkle: 0.5, grain: 1, swatch: "/looks/sand-coral.webp" },
  { id: "garnet", name: "Garnet", colour: [0.741, 0.53, 0.384], tinted: [0.55, 0.22, 0.2], dark: [0.5, 0.33, 0.25], clear: [0.99, 0.88, 0.8], sparkle: 0.8, grain: 1, swatch: "/looks/sand-garnet.webp" },
  { id: "gravel", name: "Kyoto gravel", colour: [0.794, 0.791, 0.81], tinted: [0.88, 0.87, 0.88], dark: [0.36, 0.33, 0.28], clear: [0.97, 0.97, 0.96], sparkle: 0.85, grain: 2, swatch: "/looks/sand-gravel.webp" },
  { id: "starry", name: "Starry black", colour: [0.3, 0.295, 0.295], tinted: [0.34, 0.31, 0.27], dark: [0.19, 0.18, 0.19], clear: [0.82, 0.82, 0.86], sparkle: 1.6, grain: 1, swatch: "/looks/sand-starry.webp" },
];

export const TRAYS: Tray[] = [
  { id: "oak", name: "Oak", top: [0.85, 0.74, 0.585], topBands: [0.73, 0.59, 0.44], wall: [0.8, 0.68, 0.52], wallBands: [0.68, 0.54, 0.39], pores: 1, swatch: ["#dfc59f", "#b8946c"] },
  { id: "walnut", name: "Walnut", top: [0.5, 0.36, 0.26], topBands: [0.34, 0.23, 0.16], wall: [0.45, 0.32, 0.22], wallBands: [0.31, 0.21, 0.14], pores: 1, swatch: ["#86624a", "#6b4630"] },
  { id: "stone", name: "Stone", top: [0.79, 0.76, 0.7], topBands: [0.73, 0.7, 0.64], wall: [0.73, 0.7, 0.645], wallBands: [0.67, 0.64, 0.59], pores: 0, swatch: ["#cfc8b9", "#a49c8e"] },
  { id: "cedar", name: "Charred cedar", top: [0.287, 0.271, 0.303], topBands: [0.216, 0.204, 0.243], wall: [0.27, 0.249, 0.269], wallBands: [0.201, 0.187, 0.215], pores: 1, swatch: ["#4b474f", "#3a373f"] },
  { id: "cherry", name: "Cherry", top: [0.82, 0.68, 0.54], topBands: [0.65, 0.5, 0.37], wall: [0.772, 0.625, 0.48], wallBands: [0.606, 0.458, 0.328], pores: 0.45, swatch: ["#d7b28e", "#ac8a6a"] },
  { id: "ash", name: "Pale ash", top: [0.95, 0.87, 0.75], topBands: [0.85, 0.73, 0.57], wall: [0.894, 0.8, 0.667], wallBands: [0.792, 0.668, 0.505], pores: 1, swatch: ["#f9e4c5", "#d3bb9b"] },
  { id: "slate", name: "Slate", top: [0.487, 0.496, 0.511], topBands: [0.45, 0.455, 0.465], wall: [0.45, 0.457, 0.471], wallBands: [0.413, 0.416, 0.429], pores: 0, swatch: ["#808286", "#6e6f72"] },
  { id: "travertine", name: "Travertine", top: [0.81, 0.81, 0.79], topBands: [0.76, 0.76, 0.74], wall: [0.748, 0.746, 0.728], wallBands: [0.698, 0.695, 0.682], pores: 0.6, swatch: ["#d5d5cf", "#b8b8b3"] },
];

export const RODS: Rod[] = [
  { id: "steel", name: "Steel", tint: [0.9, 0.9, 0.89], gloss: 14, shine: 0.85, swatch: ["#e4e3df", "#8f8d88"] },
  { id: "brass", name: "Brass", tint: [0.86, 0.72, 0.46], gloss: 16, shine: 0.8, swatch: ["#d2b273", "#86683a"] },
  { id: "copper", name: "Copper", tint: [0.9, 0.58, 0.42], gloss: 16, shine: 0.8, swatch: ["#e19c78", "#8a4e35"] },
  { id: "bronze", name: "Bronze", tint: [0.6, 0.45, 0.29], gloss: 9, shine: 0.42, swatch: ["#93704a", "#563e27"] },
  { id: "blackened", name: "Blackened", tint: [0.3, 0.29, 0.28], gloss: 10, shine: 0.3, swatch: ["#5b5957", "#2b2a29"] },
  { id: "gold", name: "Gold", tint: [1, 0.78, 0.32], gloss: 40, shine: 1.3, swatch: ["#e6b443", "#9c6e1e"] },
];

export type Look = { sand: Sand; tray: Tray; rod: Rod };

export function look(sand: string, tray: string, rod: string): Look {
  return {
    sand: SANDS.find((s) => s.id === sand) ?? SANDS[0],
    tray: TRAYS.find((t) => t.id === tray) ?? TRAYS[0],
    rod: RODS.find((r) => r.id === rod) ?? RODS[0],
  };
}

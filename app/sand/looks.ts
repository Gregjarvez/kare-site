export type LookKind = "sand" | "tray" | "rod";

export type LookItem = { id: string; name: string; swatch: string };

export const SANDS: LookItem[] = [
  { id: "ivory", name: "Ivory", swatch: "url(/looks/sand-ivory.webp)" },
  { id: "marble", name: "White marble", swatch: "url(/looks/sand-marble.webp)" },
  { id: "volcanic", name: "Black volcanic", swatch: "url(/looks/sand-volcanic.webp)" },
  { id: "desert", name: "Red desert", swatch: "url(/looks/sand-desert.webp)" },
  { id: "coral", name: "Pink coral", swatch: "url(/looks/sand-coral.webp)" },
  { id: "garnet", name: "Garnet", swatch: "url(/looks/sand-garnet.webp)" },
  { id: "gravel", name: "Kyoto gravel", swatch: "url(/looks/sand-gravel.webp)" },
  { id: "starry", name: "Starry black", swatch: "url(/looks/sand-starry.webp)" },
];

export const TRAYS: LookItem[] = [
  { id: "oak", name: "Oak", swatch: "radial-gradient(circle at 35% 30%, #dfc59f, #b8946c)" },
  { id: "walnut", name: "Walnut", swatch: "radial-gradient(circle at 35% 30%, #86624a, #6b4630)" },
  { id: "stone", name: "Stone", swatch: "radial-gradient(circle at 35% 30%, #cfc8b9, #a49c8e)" },
  { id: "cedar", name: "Charred cedar", swatch: "radial-gradient(circle at 35% 30%, #4b474f, #3a373f)" },
  { id: "cherry", name: "Cherry", swatch: "radial-gradient(circle at 35% 30%, #d7b28e, #ac8a6a)" },
  { id: "ash", name: "Pale ash", swatch: "radial-gradient(circle at 35% 30%, #f9e4c5, #d3bb9b)" },
  { id: "slate", name: "Slate", swatch: "radial-gradient(circle at 35% 30%, #808286, #6e6f72)" },
  { id: "travertine", name: "Travertine", swatch: "radial-gradient(circle at 35% 30%, #d5d5cf, #b8b8b3)" },
];

export const RODS: LookItem[] = [
  { id: "steel", name: "Steel", swatch: "linear-gradient(135deg, #e4e3df, #8f8d88)" },
  { id: "brass", name: "Brass", swatch: "linear-gradient(135deg, #d2b273, #86683a)" },
  { id: "copper", name: "Copper", swatch: "linear-gradient(135deg, #e19c78, #8a4e35)" },
  { id: "bronze", name: "Bronze", swatch: "linear-gradient(135deg, #93704a, #563e27)" },
  { id: "blackened", name: "Blackened", swatch: "linear-gradient(135deg, #5b5957, #2b2a29)" },
  { id: "gold", name: "Gold", swatch: "linear-gradient(135deg, #e6b443, #9c6e1e)" },
];

export const LOOK_ROWS: { kind: LookKind; label: string; items: LookItem[] }[] = [
  { kind: "sand", label: "Sand", items: SANDS },
  { kind: "tray", label: "Tray", items: TRAYS },
  { kind: "rod", label: "Rod", items: RODS },
];

export const BASE_LOOK: Record<LookKind, string> = { sand: "ivory", tray: "walnut", rod: "steel" };

export function lookStill(kind: LookKind, id: string) {
  return `/looks/still-${kind}-${id}.webp`;
}

export function lookName(kind: LookKind, id: string) {
  const chosen = { ...BASE_LOOK, [kind]: id };
  const name = (items: LookItem[], at: string) => items.find((i) => i.id === at)?.name ?? at;
  return `${name(SANDS, chosen.sand)} · ${name(TRAYS, chosen.tray)} · ${name(RODS, chosen.rod)}`;
}

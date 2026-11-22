// Starting colourways used by the hero picker, the "Make it yours" scene and the collection drawer.
// Colour ids come from contracts/catalog.seed.json. Hex values and names are read from the catalog at runtime (never hard-coded here).
export const PALETTE = [
  { id: 'sunset', swatchColorId: 'sunset', parts: { upper: { colorId: 'sunset' }, midsole: { colorId: 'white' }, laces: { colorId: 'black' } } },
  { id: 'sky', swatchColorId: 'sky', parts: { upper: { colorId: 'sky' }, toe_cap: { colorId: 'white' }, midsole: { colorId: 'bone' } } },
  { id: 'forest', swatchColorId: 'forest', parts: { upper: { colorId: 'forest' }, laces: { colorId: 'neon-lime' }, midsole: { colorId: 'sand' } } },
  { id: 'crimson', swatchColorId: 'crimson', parts: { upper: { colorId: 'crimson' }, midsole: { colorId: 'white' }, laces: { colorId: 'black' } } },
];
/** Find a colour in the catalog by id. @returns {{id:string,label:string,hex:string}|null} */
export function findColor(catalog, colorId) {
  for (const p of catalog?.parts ?? []) {
    const c = p.options?.colors?.find((x) => x.id === colorId);
    if (c) return c;
  }
  return null;
}

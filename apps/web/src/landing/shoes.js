/**
 * SHOES: the one list that drives the landing collection (cards, drawer AND the 3D ring). Adding a shoe = adding ONE entry.
 *   id            slug; for the customizable shoe it is the catalog model id (links to /customize?model=<id>)
 *   name, colour  display text
 *   file          GLB under public/models (null = use the Runner model recoloured with `colourway`; set a path to show another model)
 *   colourway     PALETTE id (landing/palette.js) used to recolour the Runner model when file is null
 *   recolor       false for foreign models so their own colours are kept
 *   fromPriceInr  integer rupees, display only
 *   tag, tint, swatch   card label, card background colour, colour dot hex
 *   customizable  true only for the model Dev A separated into parts
 * MOCK: names, prices, tags and the "same shoe, different colour" display shoes are placeholders until real models are added.
 */
export const SHOES = [
  { id: 'runner-01', name: 'Signature', colour: 'Sky', file: null, colourway: 'sky', fromPriceInr: 5999, tag: 'Customizable', tint: '#a9d8ee', swatch: '#5BA4E6', customizable: true },
  { id: 'beach', name: 'Beach', colour: 'Sunset', file: null, colourway: 'sunset', fromPriceInr: 6499, tag: 'Bestseller', tint: '#ffc7a6', swatch: '#FF6B35', customizable: false },
  { id: 'street', name: 'Street', colour: 'Forest', file: null, colourway: 'forest', fromPriceInr: 6899, tag: 'New', tint: '#b9d8bf', swatch: '#2F5D3A', customizable: false },
  { id: 'ember', name: 'Ember', colour: 'Crimson', file: null, colourway: 'crimson', fromPriceInr: 6299, tag: 'Limited', tint: '#ffb3a0', swatch: '#B3202A', customizable: false },
];

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import {
  calculateQuote,
  validateConfiguration,
  countChangedParts,
  InvalidConfigurationError,
} from '../src/services/pricing.js';

const seedPath = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../../contracts/catalog.seed.json',
);
const catalog = JSON.parse(readFileSync(seedPath, 'utf8'));

/** Default configuration with some parts changed. */
function cfgWith(changes = {}) {
  const cfg = structuredClone(catalog.model.defaultConfiguration);
  for (const [partKey, change] of Object.entries(changes)) {
    Object.assign(cfg.parts[partKey], change);
  }
  return cfg;
}

describe('calculateQuote: table-driven prices', () => {
  const cases = [
    ['default shoe costs the base price', {}, 5999],
    ['leather upper', { upper: { materialId: 'leather' } }, 5999 + 900],
    ['premium color on one part', { upper: { colorId: 'gold' } }, 5999 + 150],
    ['standard color is free', { upper: { colorId: 'crimson' } }, 5999],
    ['suede toe cap alone has no combo', { toe_cap: { materialId: 'suede' } }, 5999 + 300],
    [
      'combo: leather upper + suede toe cap',
      { upper: { materialId: 'leather' }, toe_cap: { materialId: 'suede' } },
      5999 + 900 + 300 + 250,
    ],
    [
      'combo: leather upper + patent toe cap',
      { upper: { materialId: 'leather' }, toe_cap: { materialId: 'patent' } },
      5999 + 900 + 350 + 250,
    ],
    [
      '4 changed parts: no discount',
      {
        upper: { materialId: 'canvas' },
        tongue: { materialId: 'canvas' },
        eyestay: { materialId: 'leather' },
        laces: { materialId: 'patent' },
      },
      5999 + 300 + 100 + 200 + 100,
    ],
    [
      '5 changed parts: 5% off extras (1050 -> 52.5 rounds to 53)',
      {
        upper: { materialId: 'canvas' },
        tongue: { materialId: 'canvas' },
        eyestay: { materialId: 'leather' },
        laces: { materialId: 'patent' },
        insole: { materialId: 'leather' },
      },
      5999 + 1050 - 53,
    ],
    [
      'color-only changes count toward the 5 parts but cost nothing',
      {
        upper: { colorId: 'crimson' },
        toe_cap: { colorId: 'black' },
        heel_counter: { colorId: 'sky' },
        tongue: { colorId: 'sand' },
        eyestay: { colorId: 'forest' },
      },
      5999,
    ],
    [
      'worked example from the blueprint',
      {
        upper: { materialId: 'leather' },
        toe_cap: { materialId: 'suede' },
        laces: { colorId: 'neon-lime' },
        logo: { colorId: 'gold' },
        midsole: { materialId: 'rubber' },
      },
      8041,
    ],
  ];

  it.each(cases)('%s', (_name, changes, expectedTotal) => {
    expect(calculateQuote(catalog, cfgWith(changes)).totalInr).toBe(expectedTotal);
  });
});

describe('calculateQuote: lines', () => {
  it('default shoe has no lines', () => {
    const q = calculateQuote(catalog, cfgWith());
    expect(q.lines).toEqual([]);
    expect(q.currency).toBe('INR');
    expect(q.basePriceInr).toBe(5999);
    expect(q.modelId).toBe('runner-01');
  });

  it('worked example has the expected line items', () => {
    const q = calculateQuote(
      catalog,
      cfgWith({
        upper: { materialId: 'leather' },
        toe_cap: { materialId: 'suede' },
        laces: { colorId: 'neon-lime' },
        logo: { colorId: 'gold' },
        midsole: { materialId: 'rubber' },
      }),
    );
    expect(q.lines).toEqual([
      { type: 'OPTION', partKey: 'upper', label: 'Upper: Leather', amountInr: 900 },
      { type: 'OPTION', partKey: 'toe_cap', label: 'Toe cap: Suede', amountInr: 300 },
      { type: 'OPTION', partKey: 'laces', label: 'Laces: Neon lime', amountInr: 150 },
      { type: 'OPTION', partKey: 'logo', label: 'Logo patch: Gold', amountInr: 150 },
      { type: 'OPTION', partKey: 'midsole', label: 'Midsole: Rubber', amountInr: 400 },
      {
        type: 'RULE',
        partKey: null,
        label: 'Luxe contrast: leather upper + suede toe cap',
        amountInr: 250,
      },
      {
        type: 'DISCOUNT',
        partKey: null,
        label: '5% off customization extras when 5+ parts changed',
        amountInr: -108,
      },
    ]);
  });

  it('every single option keeps the total consistent and an integer', () => {
    for (const part of catalog.parts) {
      for (const m of part.options.materials) {
        for (const c of part.options.colors) {
          const q = calculateQuote(catalog, cfgWith({ [part.key]: { materialId: m.id, colorId: c.id } }));
          const sum = q.lines.reduce((s, l) => s + l.amountInr, 0);
          expect(q.totalInr).toBe(q.basePriceInr + sum);
          expect(Number.isInteger(q.totalInr)).toBe(true);
        }
      }
    }
  });
});

describe('countChangedParts', () => {
  it('is 0 for the default and counts material OR color changes', () => {
    expect(countChangedParts(catalog, cfgWith())).toBe(0);
    expect(countChangedParts(catalog, cfgWith({ upper: { colorId: 'crimson' } }))).toBe(1);
    expect(
      countChangedParts(catalog, cfgWith({ upper: { materialId: 'leather', colorId: 'gold' } })),
    ).toBe(1);
  });
});

describe('validateConfiguration', () => {
  const detailsOf = (cfg) => {
    try {
      validateConfiguration(catalog, cfg);
    } catch (e) {
      expect(e).toBeInstanceOf(InvalidConfigurationError);
      return e.details;
    }
    throw new Error('expected an InvalidConfigurationError');
  };

  it('accepts the default configuration', () => {
    expect(() => validateConfiguration(catalog, cfgWith())).not.toThrow();
  });

  it('rejects an unknown materialId', () => {
    expect(detailsOf(cfgWith({ upper: { materialId: 'glitter' } }))).toEqual([
      { partKey: 'upper', field: 'materialId', reason: 'material not available for this part' },
    ]);
  });

  it('rejects an unknown colorId', () => {
    expect(detailsOf(cfgWith({ upper: { colorId: 'pink' } }))).toEqual([
      { partKey: 'upper', field: 'colorId', reason: 'color not available for this part' },
    ]);
  });

  it('rejects a material that exists but is not allowed for that part', () => {
    expect(detailsOf(cfgWith({ upper: { materialId: 'rubber' } }))[0].field).toBe('materialId');
  });

  it('rejects a premium color on a part that does not allow it (insole gold)', () => {
    expect(detailsOf(cfgWith({ insole: { colorId: 'gold' } }))[0]).toMatchObject({
      partKey: 'insole',
      field: 'colorId',
    });
  });

  it('rejects a missing part', () => {
    const cfg = cfgWith();
    delete cfg.parts.laces;
    expect(detailsOf(cfg)).toEqual([{ partKey: 'laces', field: 'part', reason: 'missing part' }]);
  });

  it('rejects an extra unknown part key', () => {
    const cfg = cfgWith();
    cfg.parts.wings = { materialId: 'leather', colorId: 'gold' };
    expect(detailsOf(cfg)).toEqual([{ partKey: 'wings', field: 'partKey', reason: 'unknown part' }]);
  });

  it('rejects a configuration that is not an object with parts', () => {
    expect(detailsOf(null)[0].field).toBe('parts');
    expect(detailsOf({})[0].field).toBe('parts');
    expect(detailsOf({ parts: [] })[0].field).toBe('parts');
  });

  it('rejects an option that was deactivated (removed from the catalog)', () => {
    const smaller = structuredClone(catalog);
    const logo = smaller.parts.find((p) => p.key === 'logo');
    logo.options.colors = logo.options.colors.filter((c) => c.id !== 'gold');
    expect(() => calculateQuote(smaller, cfgWith({ logo: { colorId: 'gold' } }))).toThrow(
      InvalidConfigurationError,
    );
  });

  it('reports every problem at once', () => {
    const cfg = cfgWith({ upper: { materialId: 'glitter' }, tongue: { colorId: 'pink' } });
    expect(detailsOf(cfg)).toHaveLength(2);
  });
});

describe('calculateQuote: safety', () => {
  it('is deterministic and does not modify its input', () => {
    const cfg = cfgWith({ upper: { materialId: 'leather' } });
    const before = JSON.stringify(cfg);
    const a = calculateQuote(catalog, cfg);
    const b = calculateQuote(catalog, cfg);
    expect(a).toEqual(b);
    expect(JSON.stringify(cfg)).toBe(before);
  });

  it('ignores an inactive rule', () => {
    const off = structuredClone(catalog);
    off.rules.forEach((r) => (r.isActive = false));
    const q = calculateQuote(off, cfgWith({ upper: { materialId: 'leather' }, toe_cap: { materialId: 'suede' } }));
    expect(q.totalInr).toBe(5999 + 900 + 300);
  });
});

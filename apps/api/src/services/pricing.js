/**
 * Pricing engine: pure functions, no database access, integer rupees only.
 * The catalog passed in must include rule params (the internal shape, not the public API shape).
 */

/** Thrown when a configuration does not match the catalog. */
export class InvalidConfigurationError extends Error {
  /** @param {{partKey: string|null, field: string, reason: string}[]} details */
  constructor(details) {
    super('Invalid configuration');
    this.name = 'InvalidConfigurationError';
    this.details = details;
  }
}

const isPlainObject = (v) => typeof v === 'object' && v !== null && !Array.isArray(v);

/**
 * Checks a configuration against the catalog. Collects every problem, then throws once.
 * @param {object} catalog
 * @param {object} cfg
 * @throws {InvalidConfigurationError}
 */
export function validateConfiguration(catalog, cfg) {
  const details = [];

  if (!isPlainObject(cfg) || !isPlainObject(cfg.parts)) {
    throw new InvalidConfigurationError([
      { partKey: null, field: 'parts', reason: 'configuration.parts must be an object' },
    ]);
  }

  const knownKeys = new Set(catalog.parts.map((p) => p.key));

  for (const key of Object.keys(cfg.parts)) {
    if (!knownKeys.has(key)) {
      details.push({ partKey: key, field: 'partKey', reason: 'unknown part' });
    }
  }

  for (const part of catalog.parts) {
    const choice = cfg.parts[part.key];
    if (!isPlainObject(choice)) {
      details.push({ partKey: part.key, field: 'part', reason: 'missing part' });
      continue;
    }
    if (!part.options.materials.some((m) => m.id === choice.materialId)) {
      details.push({
        partKey: part.key,
        field: 'materialId',
        reason: 'material not available for this part',
      });
    }
    if (!part.options.colors.some((c) => c.id === choice.colorId)) {
      details.push({
        partKey: part.key,
        field: 'colorId',
        reason: 'color not available for this part',
      });
    }
  }

  if (details.length > 0) throw new InvalidConfigurationError(details);
}

/**
 * A part counts as changed when its material OR its color differs from the default.
 * @returns {number}
 */
export function countChangedParts(catalog, cfg) {
  const defaults = catalog.model.defaultConfiguration.parts;
  return catalog.parts.filter((p) => {
    const a = cfg.parts[p.key];
    const d = defaults[p.key];
    return a.materialId !== d.materialId || a.colorId !== d.colorId;
  }).length;
}

/**
 * Validates, then prices a configuration.
 * @param {object} catalog internal catalog (model, parts, rules with params)
 * @param {object} cfg configuration
 * @returns {{modelId:string,currency:'INR',basePriceInr:number,lines:object[],totalInr:number}}
 * @throws {InvalidConfigurationError}
 */
export function calculateQuote(catalog, cfg) {
  validateConfiguration(catalog, cfg);

  const lines = [];
  const parts = [...catalog.parts].sort((a, b) => a.sortOrder - b.sortOrder);

  // OPTION lines: material first, then color, only when the price is not zero
  for (const part of parts) {
    const choice = cfg.parts[part.key];
    const material = part.options.materials.find((m) => m.id === choice.materialId);
    const color = part.options.colors.find((c) => c.id === choice.colorId);
    if (material.priceDeltaInr !== 0) {
      lines.push({
        type: 'OPTION',
        partKey: part.key,
        label: `${part.label}: ${material.label}`,
        amountInr: material.priceDeltaInr,
      });
    }
    if (color.priceDeltaInr !== 0) {
      lines.push({
        type: 'OPTION',
        partKey: part.key,
        label: `${part.label}: ${color.label}`,
        amountInr: color.priceDeltaInr,
      });
    }
  }

  const activeRules = catalog.rules.filter((r) => r.isActive !== false);

  // RULE lines: every COMBO_SURCHARGE whose conditions all match
  for (const rule of activeRules.filter((r) => r.type === 'COMBO_SURCHARGE')) {
    const matches = rule.params.when.every((cond) => {
      const choice = cfg.parts[cond.partKey];
      const actual = cond.kind === 'MATERIAL' ? choice.materialId : choice.colorId;
      return actual === cond.slug;
    });
    if (matches) {
      lines.push({ type: 'RULE', partKey: null, label: rule.label, amountInr: rule.params.amountInr });
    }
  }

  const extras = lines.reduce((sum, l) => sum + l.amountInr, 0);

  // DISCOUNT line: best matching percentage rule, applied to extras only
  const changed = countChangedParts(catalog, cfg);
  const eligible = activeRules
    .filter((r) => r.type === 'CUSTOMIZATION_DISCOUNT_PCT' && changed >= r.params.minChangedParts)
    .sort((a, b) => b.params.percent - a.params.percent);

  if (eligible.length > 0) {
    const discount = Math.round((extras * eligible[0].params.percent) / 100);
    if (discount !== 0) {
      lines.push({ type: 'DISCOUNT', partKey: null, label: eligible[0].label, amountInr: -discount });
    }
  }

  const totalInr = catalog.model.basePriceInr + lines.reduce((sum, l) => sum + l.amountInr, 0);

  return {
    modelId: catalog.model.id,
    currency: 'INR',
    basePriceInr: catalog.model.basePriceInr,
    lines,
    totalInr,
  };
}

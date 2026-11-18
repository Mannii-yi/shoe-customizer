import { z } from 'zod';

const MAX_IMAGE_BYTES = 150 * 1024;

/** JPEG/PNG/WebP data URL whose decoded image is at most 150 KB. */
export const thumbnailDataUrl = z
  .string()
  .max(205_000)
  .regex(/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/]+={0,2}$/, 'must be a JPEG, PNG or WebP data URL')
  .refine((s) => {
    const b64 = s.slice(s.indexOf(',') + 1);
    const padding = b64.endsWith('==') ? 2 : b64.endsWith('=') ? 1 : 0;
    return (b64.length * 3) / 4 - padding <= MAX_IMAGE_BYTES;
  }, 'image must be 150 KB or smaller');

// Shape problems are 400. Wrong material/color ids are 422, decided by the pricing engine.
const configuration = z.object({ parts: z.record(z.string(), z.unknown()) });
const name = z.string().trim().min(1).max(80);

// Fields not listed (userId, priceInr, shareToken ...) are dropped, so clients cannot set them.
export const createDesignBody = z.object({
  modelId: z.string().min(1).max(60),
  name,
  configuration,
  thumbnailDataUrl: thumbnailDataUrl.optional(),
});

export const updateDesignBody = z
  .object({
    name: name.optional(),
    configuration: configuration.optional(),
    thumbnailDataUrl: thumbnailDataUrl.optional(),
  })
  .refine((b) => Object.keys(b).length > 0, 'at least one field is required');

// Ids are not format-checked: an unknown or malformed id is simply "not found" (404).
export const idParams = z.object({ id: z.string().min(1).max(60) });
export const tokenParams = z.object({ token: z.string().min(1).max(100) });

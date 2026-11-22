import { z } from 'zod';

const size = z.number().int().min(36).max(46);
const quantity = z.number().int().min(1).max(5);

export const addCartItemBody = z.object({
  designId: z.string().min(1).max(60),
  sizeEu: size,
  quantity,
});

export const updateCartItemBody = z
  .object({ sizeEu: size.optional(), quantity: quantity.optional() })
  .refine((b) => Object.keys(b).length > 0, 'at least one field is required');

const text = (max) => z.string().trim().min(1).max(max);

/**
 * Prices, totals and status are not accepted from the client: any such fields are dropped.
 * Only the address and the (mock) payment method are read.
 */
export const checkoutBody = z.object({
  shippingAddress: z.object({
    fullName: text(100),
    phone: z.string().regex(/^[0-9]{10}$/, 'must be 10 digits'),
    line1: text(200),
    line2: z.string().trim().max(200).optional(),
    city: text(100),
    state: text(100),
    pincode: z.string().regex(/^[0-9]{6}$/, 'must be 6 digits'),
  }),
  paymentMethod: z.literal('MOCK'),
});

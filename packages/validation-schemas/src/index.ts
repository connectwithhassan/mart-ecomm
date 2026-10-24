import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, 'Password must be at least 8 characters long'),
  fullName: z.string().min(2, 'Full name is required'),
  role: z.enum(['customer', 'seller']).default('customer'),
  preferredCurrency: z.string().length(3).default('USD'),
  preferredLanguage: z.string().min(2).max(5).default('en'),
});

export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, 'Password is required'),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const addressSchema = z.object({
  fullName: z.string().min(2),
  companyName: z.string().optional(),
  country: z.string().length(2, 'Country must be ISO 3166-1 alpha-2 code'),
  state: z.string().optional(),
  city: z.string().min(1),
  postalCode: z.string().min(2),
  addressLine1: z.string().min(3),
  addressLine2: z.string().optional(),
  phone: z.string().min(5),
});

export type AddressInput = z.infer<typeof addressSchema>;

export const checkoutItemSchema = z.object({
  variantId: z.string().uuid(),
  warehouseId: z.string().uuid(),
  quantity: z.number().int().positive(),
});

export const checkoutRequestSchema = z.object({
  currency: z.string().length(3),
  shippingAddress: addressSchema,
  billingAddress: addressSchema,
  items: z.array(checkoutItemSchema).min(1, 'At least one item is required in cart'),
});

export type CheckoutRequestInput = z.infer<typeof checkoutRequestSchema>;

export const warehouseCreateSchema = z.object({
  warehouseName: z.string().min(2),
  countryCode: z.string().length(2),
  stateProvince: z.string().optional(),
  city: z.string().min(1),
  postalCode: z.string().min(2),
  addressLine1: z.string().min(3),
  addressLine2: z.string().optional(),
  phoneContact: z.string().optional(),
});

export type WarehouseCreateInput = z.infer<typeof warehouseCreateSchema>;

export const productCreateSchema = z.object({
  categoryId: z.string().uuid(),
  titleI18n: z.record(z.string()),
  descriptionI18n: z.record(z.string()),
  brand: z.string().optional(),
  hsCode: z.string().min(6).max(10, 'HS Code must be 6 to 10 digits'),
  originCountry: z.string().length(2),
  images: z.array(z.string().url()).default([]),
});

export type ProductCreateInput = z.infer<typeof productCreateSchema>;

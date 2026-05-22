import { z } from 'zod';
import { apiResponseSchema } from './seasonPlanSchemas';

const warehouseSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  description: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),
});

const unitSchema = z.object({
  id: z.string().uuid(),
  code: z.string(),
  name: z.string(),
});

const supplierSchema = z.object({
  id: z.string().uuid(),
  code: z.string(),
  name: z.string(),
  createdAt: z.string(),
});

const skuSchema = z.object({
  sku: z.string(),
  description: z.string().nullable().optional(),
  createdAt: z.string(),
});

const userSchema = z.object({
  id: z.string().uuid(),
  fullName: z.string(),
  email: z.string().email(),
  phone: z.string().nullable().optional(),
  status: z.string(),
  isLocked: z.boolean(),
  createdAt: z.string(),
});

export const apiWarehouseItemSchema = z.object({
  id: z.string().uuid(),
  version: z.number().optional(),
  name: z.string(),
  stock: z.number(),
  reservedQty: z.number().nullable().optional(),
  minStockQty: z.number().nullable().optional(),
  unitPrice: z.number().nullable().optional(),
  warehouse: warehouseSchema,
  unit: unitSchema,
  supplier: supplierSchema.nullable().optional(),
  sku: skuSchema.nullable().optional(),
  createdBy: userSchema,
  createdAt: z.string(),
});

export const getWarehouseItemsResponseSchema = apiResponseSchema(z.array(apiWarehouseItemSchema));
export const createWarehouseItemResponseSchema = apiResponseSchema(apiWarehouseItemSchema);

export const createWarehouseItemSchema = z.object({
  name: z.string().trim().min(1, 'Vui lòng nhập tên vật tư'),
  unitId: z.string().min(1, 'Vui lòng chọn đơn vị tính'),
  stock: z.number().min(0, 'Số lượng tồn kho phải lớn hơn hoặc bằng 0'),
  sku: z.string().optional(),
  supplierId: z.string().optional(),
  unitPrice: z.number().min(0, 'Đơn giá phải lớn hơn hoặc bằng 0').optional(),
  minStockQty: z.number().min(0, 'Tồn kho tối thiểu phải lớn hơn hoặc bằng 0').optional(),
  toLocationId: z.string().min(1, 'Vui lòng chọn vị trí kho'),
});

export const updateWarehouseItemSchema = createWarehouseItemSchema.omit({
  stock: true,
  toLocationId: true,
}).extend({
  toLocationId: z.string().optional(),
  version: z.number().optional(),
});

export type CreateWarehouseItemInput = z.infer<typeof createWarehouseItemSchema>;
export type UpdateWarehouseItemInput = z.infer<typeof updateWarehouseItemSchema>;

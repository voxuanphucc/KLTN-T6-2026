export interface WarehouseItem {
  id: string;
  version?: number;
  name: string;
  stock: number;
  reservedQty?: number | null;
  warehouse: {
    id: string;
    name: string;
    description?: string | null;
    address?: string | null;
    latitude?: number | null;
    longitude?: number | null;
  };
  unit: {
    id: string;
    code: string;
    name: string;
  };
  supplier?: {
    id: string;
    code: string;
    name: string;
    createdAt: string;
  } | null;
  sku?: {
    sku: string;
    description?: string | null;
    createdAt: string;
  } | null;
  createdBy: {
    id: string;
    fullName: string;
    email: string;
    phone?: string | null;
    status: string;
    isLocked: boolean;
    createdAt: string;
  };
  createdAt: string;
  unitPrice: number;
  minStockQty?: number;
}

export interface CreateWarehouseItemDto {
  toLocationId: string;
  unitId: string;
  name: string;
  stock: number;
  sku: string | undefined;
  unitPrice: number;
  supplierId: string;
  minStockQty: number;
}

export interface UpdateWarehouseItemDto extends Partial<CreateWarehouseItemDto> {
  version?: number;
}

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Package, X, Loader2, Save } from "lucide-react";

import { useWarehouseItems } from "@/hooks/warehouseItems/useWarehouseItems";
import { useSuppliers } from "@/hooks/suppliers/useSuppliers";
import { useSkus } from "@/hooks/skus/useSkus";
import { useUnits } from "@/hooks/units/useUnits";
import { WarehouseItem } from "@/types/warehouseItem/warehouseItem";
import { extractErrorMessage } from "@/utils/errorUtils";
import { updateWarehouseItemSchema } from "@/schemas/warehouseItemSchemas";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface Props {
  farmId: string;
  warehouseId: string;
  item: WarehouseItem;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function EditWarehouseItemModal({ farmId, warehouseId, item, isOpen, onClose, onSuccess }: Props) {
  const { updateItem, loading: submitting } = useWarehouseItems(farmId, warehouseId);
  const { suppliers, fetchSuppliers } = useSuppliers();
  const { skus, fetchSkus } = useSkus();
  const { units, fetchUnits } = useUnits();

  const [form, setForm] = useState({
    name: "",
    sku: "",
    unitId: "",
    supplierId: "",
    unitPrice: 0,
    minStockQty: 0,
    version: 0,
  });

  useEffect(() => {
    if (isOpen && item) {
      setForm({
        name: item.name,
        sku: item.sku?.sku || "",
        unitId: item.unit?.id || "",
        supplierId: item.supplier?.id || "",
        unitPrice: item.unitPrice || 0,
        minStockQty: item.minStockQty || 0,
        version: item.version || 0,
      });
      
      void fetchSuppliers(farmId);
      void fetchSkus(farmId);
      void fetchUnits();
    }
  }, [isOpen, item, farmId, fetchSuppliers, fetchSkus, fetchUnits]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate với updateWarehouseItemSchema
    const validation = updateWarehouseItemSchema.safeParse(form);
    if (!validation.success) {
      toast.error(validation.error.errors[0].message);
      return;
    }
    
    try {
      await updateItem(farmId, warehouseId, item.id, validation.data).unwrap();
      toast.success("Cập nhật vật tư thành công!");
      onClose();
      onSuccess?.();
    } catch (err: any) {
      toast.error(extractErrorMessage(err));
    }
  };

  const numericInput = (value: number, onChange: (n: number) => void) => ({
    type: "text" as const,
    value: value === 0 ? "" : value.toLocaleString("vi-VN"),
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value.replace(/\D/g, "");
      onChange(raw === "" ? 0 : Number(raw));
    },
    placeholder: "0",
  });

  const labelCls = "block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2";
  const selectCls = "w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all appearance-none cursor-pointer";

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-lg flex flex-col overflow-hidden border border-slate-100">
        <div className="flex items-center justify-between px-8 py-6 border-b border-slate-50 shrink-0">
          <div className="flex items-center gap-4 text-left">
            <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center border border-blue-100 text-blue-600">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800 tracking-tight">Chỉnh sửa vật tư</h2>
              <p className="text-xs text-slate-400 font-medium mt-0.5">Cập nhật thông tin chi tiết vật tư</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-50 rounded-xl text-slate-400 transition-colors">
            <X size={20} />
          </button>
        </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-6 text-left overflow-y-auto max-h-[70vh] custom-scrollbar">
            <div>
              <label className={labelCls}>Tên vật tư <span className="text-rose-500">*</span></label>
              <Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className="font-bold" />
              {/* TODO: Hiển thị error nếu có từ validation */}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Đơn vị <span className="text-rose-500">*</span></label>
                <select value={form.unitId} onChange={e => setForm(p => ({ ...p, unitId: e.target.value }))} className={selectCls}>
                  <option value="">Chọn đơn vị</option>
                  {units.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>Mã SKU </label>
                <select value={form.sku} onChange={e => setForm(p => ({ ...p, sku: e.target.value }))} className={selectCls}>
                  <option value="">Chọn SKU</option>
                  {skus.map(s => <option key={s.sku} value={s.sku}>{s.sku}</option>)}
                </select>
              </div>
            </div>

          <div>
            <label className={labelCls}>Nhà cung cấp</label>
            <select value={form.supplierId} onChange={e => setForm(p => ({ ...p, supplierId: e.target.value }))} className={selectCls}>
              <option value="">Chọn nhà cung cấp</option>
              {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Đơn giá (₫)</label>
              <Input {...numericInput(form.unitPrice, v => setForm(p => ({ ...p, unitPrice: v })))} className="font-bold" />
            </div>
            <div>
              <label className={labelCls}>Tồn tối thiểu</label>
              <Input {...numericInput(form.minStockQty, v => setForm(p => ({ ...p, minStockQty: v })))} className="font-bold text-rose-600" />
            </div>
          </div>
        </form>

        <div className="px-8 py-6 border-t border-slate-50 flex gap-3 shrink-0 bg-slate-50/50">
          <Button type="button" variant="outline" onClick={onClose} className="flex-1 rounded-2xl h-12 font-bold">Hủy bỏ</Button>
          <Button type="submit" onClick={handleSubmit} disabled={submitting} variant="dark-olive" className="flex-[2] rounded-2xl h-12 font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-200/50">
            {submitting ? <Loader2 size={18} className="animate-spin" /> : <><Save size={18} /><span>Lưu thay đổi</span></>}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

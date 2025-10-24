import React, { useState, useEffect } from "react";
import { useAppDispatch } from "../../store/hooks";
import {
  useCreateUnitMutation,
  useUpdateUnitMutation,
  type Unit,
} from "../../store/slices/items/itemsApi";
import {
  addUnit,
  updateUnit as updateUnitAction,
} from "../../store/slices/items/items";

interface UnitModalProps {
  isOpen: boolean;
  onClose: () => void;
  unitToEdit: Unit | null;
}

const UnitModal: React.FC<UnitModalProps> = ({
  isOpen,
  onClose,
  unitToEdit,
}) => {
  const [name, setName] = useState("");
  const dispatch = useAppDispatch();
  const [createUnit, { isLoading: createLoading }] = useCreateUnitMutation();
  const [updateUnit, { isLoading: updateLoading }] = useUpdateUnitMutation();

  useEffect(() => {
    if (unitToEdit) {
      setName(unitToEdit.name);
    } else {
      setName("");
    }
  }, [unitToEdit, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (unitToEdit) {
        const result = await updateUnit({
          id: unitToEdit.id,
          data: { name },
        }).unwrap();
        dispatch(updateUnitAction((result as any).data as Unit));
      } else {
        const result = await createUnit({ name }).unwrap();
        dispatch(addUnit((result as any).data as Unit));
      }
      onClose();
    } catch (error: any) {
      console.error("Save error:", error);
    }
  };

  if (!isOpen) return null;

  const inputStyle =
    "mt-1 block w-full bg-brand-blue-bg border-2 border-brand-blue rounded-md shadow-sm text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-brand-blue py-3 px-4";

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-brand-dark">
            {unitToEdit ? "تعديل وحدة" : "اضافة وحدة جديدة"}
          </h2>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="p-6">
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700"
            >
              اسم الوحدة
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputStyle}
              required
            />
          </div>
          <div className="p-4 border-t border-gray-200 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 font-semibold"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={createLoading || updateLoading}
              className="px-6 py-2 bg-brand-blue text-white rounded-md hover:bg-blue-800 font-semibold disabled:opacity-50"
            >
              {createLoading || updateLoading ? "جاري الحفظ..." : "حفظ"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UnitModal;

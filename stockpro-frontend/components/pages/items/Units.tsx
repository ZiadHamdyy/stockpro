import React, { useState, useEffect } from "react";
import { PrintIcon, SearchIcon } from "../../icons";
import UnitModal from "./UnitModal";
import { useModal } from "../../common/ModalProvider";
import PermissionWrapper from "../../common/PermissionWrapper";
import {
  Resources,
  Actions,
  buildPermission,
} from "../../../enums/permissions.enum";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import {
  useGetUnitsQuery,
  useCreateUnitMutation,
  useUpdateUnitMutation,
  useDeleteUnitMutation,
  type Unit,
} from "../../store/slices/items/itemsApi";
import { setUnits, removeUnit } from "../../store/slices/items/items";

interface UnitsProps {
  title: string;
}

const Units: React.FC<UnitsProps> = ({ title }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [unitToEdit, setUnitToEdit] = useState<Unit | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const { showModal } = useModal();
  const dispatch = useAppDispatch();

  // Get data from Redux state
  const units = useAppSelector((state) => state.items.units);
  const isLoading = useAppSelector((state) => state.items.isLoading);

  // API hooks
  const {
    data: apiUnits = [],
    isLoading: apiLoading,
    error,
  } = useGetUnitsQuery(undefined);
  const [createUnit] = useCreateUnitMutation();
  const [updateUnit] = useUpdateUnitMutation();
  const [deleteUnit] = useDeleteUnitMutation();

  // Update Redux state when API data changes
  useEffect(() => {
    if (apiUnits && Array.isArray(apiUnits) && apiUnits.length > 0) {
      dispatch(setUnits(apiUnits));
    }
  }, [apiUnits, dispatch]);

  // Debug logging
  console.log("Units - Redux Data:", units);
  console.log("Units - API Data:", apiUnits);
  console.log("Units - Loading:", apiLoading);
  console.log("Units - Error:", error);

  const handleOpenModal = (unit: Unit | null = null) => {
    setUnitToEdit(unit);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setUnitToEdit(null);
  };

  const handleEditClick = (unit: Unit) => {
    showModal({
      title: "تأكيد التعديل",
      message: "هل أنت متأكد من رغبتك في تعديل بيانات هذه الوحدة؟",
      onConfirm: () => handleOpenModal(unit),
      type: "edit",
      showPassword: true,
    });
  };

  const handleDeleteClick = (unit: Unit) => {
    showModal({
      title: "تأكيد الحذف",
      message: `هل أنت متأكد من حذف الوحدة "${unit.name}"؟`,
      onConfirm: async () => {
        try {
          await deleteUnit(unit.id).unwrap();
          dispatch(removeUnit(unit.id));
        } catch (error: any) {
          console.error("Delete error:", error);
        }
      },
      type: "delete",
      showPassword: true,
    });
  };

  const filteredUnits = Array.isArray(units)
    ? units.filter((unit) =>
        unit.name.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    : [];

  const inputStyle =
    "w-64 pr-10 pl-4 py-3 bg-brand-blue-bg border-2 border-brand-blue rounded-md text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-blue";

  return (
    <>
      <div className="bg-white p-6 rounded-lg shadow">
        <h1 className="text-2xl font-bold mb-4 text-brand-dark">{title}</h1>
        <div className="flex justify-between items-center mb-6 no-print">
          <div className="relative">
            <SearchIcon className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-6 h-6" />
            <input
              type="text"
              placeholder="بحث عن وحدة..."
              className={inputStyle}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div>
            <PermissionWrapper
              requiredPermission={buildPermission(
                Resources.UNITS,
                Actions.CREATE,
              )}
              fallback={
                <button
                  disabled
                  className="px-6 py-3 bg-gray-400 text-white rounded-md cursor-not-allowed opacity-50 ml-2 font-semibold"
                >
                  اضافة وحدة جديدة
                </button>
              }
            >
              <button
                onClick={() => handleOpenModal()}
                className="px-6 py-3 bg-brand-blue text-white rounded-md hover:bg-blue-800 ml-2 font-semibold"
              >
                اضافة وحدة جديدة
              </button>
            </PermissionWrapper>
            <PermissionWrapper
              requiredPermission={buildPermission(
                Resources.UNITS,
                Actions.PRINT,
              )}
              fallback={
                <button
                  disabled
                  className="p-3 border-2 border-gray-200 rounded-md cursor-not-allowed opacity-50"
                >
                  <PrintIcon className="w-6 h-6" />
                </button>
              }
            >
              <button
                onClick={() => window.print()}
                className="p-3 border-2 border-gray-200 rounded-md hover:bg-gray-100"
              >
                <PrintIcon className="w-6 h-6" />
              </button>
            </PermissionWrapper>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-brand-blue">
              <tr>
                <th className="px-6 py-3 text-right text-sm font-semibold text-white uppercase tracking-wider">
                  كود الوحدة
                </th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-white uppercase tracking-wider">
                  اسم الوحدة
                </th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-white uppercase tracking-wider no-print">
                  اجراءات
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {apiLoading ? (
                <tr>
                  <td colSpan={3} className="px-6 py-8 text-center">
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-blue"></div>
                      <span className="mr-3 text-gray-600">
                        جاري تحميل البيانات...
                      </span>
                    </div>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={3} className="px-6 py-8 text-center">
                    <div className="text-red-600">
                      <p className="font-semibold">خطأ في تحميل البيانات</p>
                      <p className="text-sm mt-1">يرجى المحاولة مرة أخرى</p>
                    </div>
                  </td>
                </tr>
              ) : filteredUnits.length === 0 ? (
                <tr>
                  <td
                    colSpan={3}
                    className="px-6 py-8 text-center text-gray-500"
                  >
                    {searchTerm
                      ? "لا توجد وحدات تطابق البحث"
                      : "لا توجد وحدات متاحة"}
                  </td>
                </tr>
              ) : (
                filteredUnits.map((unit) => (
                  <tr key={unit.id} className="hover:bg-brand-blue-bg">
                    <td className="px-6 py-4 whitespace-nowrap">{unit.code}</td>
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-brand-dark">
                      {unit.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium no-print">
                      <PermissionWrapper
                        requiredPermission={buildPermission(
                          Resources.UNITS,
                          Actions.UPDATE,
                        )}
                        fallback={
                          <button
                            disabled
                            className="text-gray-400 cursor-not-allowed font-semibold ml-4"
                          >
                            تعديل
                          </button>
                        }
                      >
                        <button
                          onClick={() => handleEditClick(unit)}
                          className="text-brand-blue hover:text-blue-800 font-semibold ml-4"
                        >
                          تعديل
                        </button>
                      </PermissionWrapper>
                      <PermissionWrapper
                        requiredPermission={buildPermission(
                          Resources.UNITS,
                          Actions.DELETE,
                        )}
                        fallback={
                          <button
                            disabled
                            className="text-gray-400 cursor-not-allowed font-semibold"
                          >
                            حذف
                          </button>
                        }
                      >
                        <button
                          onClick={() => handleDeleteClick(unit)}
                          className="text-red-600 hover:text-red-900 font-semibold"
                        >
                          حذف
                        </button>
                      </PermissionWrapper>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      <UnitModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        unitToEdit={unitToEdit}
      />
    </>
  );
};

export default Units;

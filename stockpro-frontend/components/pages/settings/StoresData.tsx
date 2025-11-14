import React, { useState, useMemo } from "react";
import { PrintIcon, SearchIcon } from "../../icons";
import StoreModal from "./StoreModal.tsx";
import { useModal } from "../../common/ModalProvider.tsx";
import { useGetBranchesQuery } from "../../store/slices/branch/branchApi";
import {
  useGetStoresQuery,
  useCreateStoreMutation,
  useUpdateStoreMutation,
  useDeleteStoreMutation,
} from "../../store/slices/store/storeApi";
import type { Store as StoreEntity } from "../../store/slices/store/storeApi";

interface StoresDataProps {
  title: string;
}

const StoresData: React.FC<StoresDataProps> = ({ title }) => {
  const {
    data: stores = [],
    isLoading: storesLoading,
    error: storesError,
  } = useGetStoresQuery();
  const { data: branches = [], isLoading: branchesLoading } =
    useGetBranchesQuery();
  const [createStore] = useCreateStoreMutation();
  const [updateStore] = useUpdateStoreMutation();
  const [deleteStore] = useDeleteStoreMutation();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [storeToEdit, setStoreToEdit] = useState<StoreEntity | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const { showModal } = useModal();

  const handleOpenModal = (store: StoreEntity | null = null) => {
    setStoreToEdit(store);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setStoreToEdit(null);
  };

  const handleEditClick = (store: StoreEntity) => {
    showModal({
      title: "تأكيد التعديل",
      message: "هل أنت متأكد من رغبتك في تعديل بيانات هذا المخزن؟",
      onConfirm: () => {
        handleOpenModal(store);
      },
      type: "edit",
      showPassword: true,
    });
  };

  const handleDeleteClick = (store: StoreEntity) => {
    showModal({
      title: "تأكيد الحذف",
      message: `هل أنت متأكد من حذف المخزن "${store.name}"؟`,
      onConfirm: () => deleteStore(store.id),
      type: "delete",
      showPassword: true,
    });
  };

  const handleSave = async (
    store: {
      id?: string;
      name: string;
      address?: string;
      phone?: string;
      description?: string;
      branchId: string;
      userId: string;
    },
  ) => {
    try {
      const branchId =
        store.branchId ||
        storeToEdit?.branchId ||
        storeToEdit?.branch?.id ||
        "";
      const userId =
        store.userId ||
        storeToEdit?.userId ||
        storeToEdit?.user?.id ||
        "";

      if (!branchId || !userId) {
        console.error("Branch or user missing for store save.");
        return;
      }

      if (storeToEdit) {
        const targetId = store.id ?? storeToEdit.id;
        if (!targetId) {
          console.error("Missing store id for update.");
          return;
        }
        await updateStore({
          id: targetId,
          data: {
            name: store.name,
            address: store.address || "",
            phone: store.phone || "",
            description: store.description || "",
            branchId,
            userId,
          },
        }).unwrap();
      } else {
        await createStore({
          name: store.name,
          address: store.address || "",
          phone: store.phone || "",
          description: store.description || "",
          branchId,
          userId,
        }).unwrap();
      }
    } catch (error) {
      console.error("Error saving store:", error);
    }
  };

  const filteredStores = stores.filter((store) =>
    store.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const availableBranches = useMemo(() => {
    if (!branches.length) return [];

    const editingBranchId =
      storeToEdit?.branchId ?? storeToEdit?.branch?.id ?? null;

    const occupiedBranchIds = new Set(
      stores
        .map(
          (store) => store.branchId ?? store.branch?.id ?? null,
        )
        .filter((id): id is string => Boolean(id)),
    );

    return branches.filter((branch) => {
      if (editingBranchId && branch.id === editingBranchId) {
        return true;
      }
      return !occupiedBranchIds.has(branch.id);
    });
  }, [branches, stores, storeToEdit]);

  if (storesLoading || branchesLoading) {
    return <div className="p-6">Loading stores...</div>;
  }

  if (storesError) {
    return <div className="p-6 text-red-600">Error loading stores</div>;
  }

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
              placeholder="بحث عن مخزن..."
              className={inputStyle}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div>
            <button
              onClick={() => handleOpenModal()}
              className="px-6 py-3 bg-brand-blue text-white rounded-md hover:bg-blue-800 ml-2 font-semibold"
            >
              اضافة مخزن جديد
            </button>
            <button
              onClick={() => window.print()}
              className="p-3 border-2 border-gray-200 rounded-md hover:bg-gray-100"
            >
              <PrintIcon className="w-6 h-6" />
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-brand-blue">
              <tr>
                <th className="px-6 py-3 text-right text-sm font-semibold text-white uppercase tracking-wider">
                  كود المخزن
                </th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-white uppercase tracking-wider">
                  اسم المخزن
                </th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-white uppercase tracking-wider">
                  الفرع التابع له
                </th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-white uppercase tracking-wider">
                  أمين المخزن
                </th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-white uppercase tracking-wider no-print">
                  اجراءات
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredStores.map((store) => (
                <tr key={store.id} className="hover:bg-brand-blue-bg">
                  <td className="px-6 py-4 whitespace-nowrap">{store.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap font-medium text-brand-dark">
                    {store.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {store.branch.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {store.user?.name || ""}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium no-print">
                    <button
                      onClick={() => handleEditClick(store)}
                      className="text-brand-blue hover:text-blue-800 font-semibold ml-4"
                    >
                      تعديل
                    </button>
                    <button
                      onClick={() => handleDeleteClick(store)}
                      className="text-red-600 hover:text-red-900 font-semibold"
                    >
                      حذف
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <StoreModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSave}
        storeToEdit={storeToEdit}
        availableBranches={availableBranches}
      />
    </>
  );
};

export default StoresData;

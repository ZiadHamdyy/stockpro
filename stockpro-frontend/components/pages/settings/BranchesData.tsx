import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { PrintIcon, SearchIcon } from "../../icons";
import BranchModal from "./BranchModal";
import PermissionWrapper from "../../common/PermissionWrapper";
import { useModal } from "../../common/ModalProvider";
import { useGetBranchesQuery } from "../../store/slices/branch/branchApi";
import {
  useCreateBranchMutation,
  useUpdateBranchMutation,
  useDeleteBranchMutation,
} from "../../store/slices/branch/branchApi";
import {
  Actions,
  Resources,
  buildPermission,
} from "../../../enums/permissions.enum";

interface BranchesDataProps {
  title: string;
}

const BranchesData: React.FC<BranchesDataProps> = ({ title }) => {
  const dispatch = useDispatch();
  const { data: branches = [], isLoading, error } = useGetBranchesQuery();
  const [createBranch] = useCreateBranchMutation();
  const [updateBranch] = useUpdateBranchMutation();
  const [deleteBranch] = useDeleteBranchMutation();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [branchToEdit, setBranchToEdit] = useState<any | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const { showModal } = useModal();

  const handleOpenModal = (branch: any | null = null) => {
    setBranchToEdit(branch);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setBranchToEdit(null);
  };

  const handleEditClick = (branch: any) => {
    showModal({
      title: "تأكيد التعديل",
      message: "هل أنت متأكد من رغبتك في تعديل بيانات هذا الفرع؟",
      onConfirm: () => {
        handleOpenModal(branch);
      },
      type: "edit",
    });
  };

  const handleDeleteClick = (branch: any) => {
    showModal({
      title: "تأكيد الحذف",
      message: `هل أنت متأكد من حذف الفرع "${branch.name}"؟`,
      onConfirm: () => deleteBranch(branch.id),
      type: "delete",
    });
  };

  const handleSave = async (branch: any) => {
    try {
      if (branchToEdit) {
        // Update existing branch
        await updateBranch({
          id: branch.id,
          data: {
            name: branch.name,
            address: branch.address,
            phone: branch.phone,
            description: branch.description || "",
          },
        }).unwrap();
      } else {
        // Create new branch
        await createBranch({
          name: branch.name,
          address: branch.address,
          phone: branch.phone,
          description: branch.description || "",
        }).unwrap();
      }
    } catch (error) {
      console.error("Error saving branch:", error);
    }
  };

  const filteredBranches = branches.filter(
    (branch) =>
      branch.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (branch.address &&
        branch.address.toLowerCase().includes(searchTerm.toLowerCase())),
  );

  if (isLoading) {
    return <div className="p-6">Loading branches...</div>;
  }

  if (error) {
    return <div className="p-6 text-red-600">Error loading branches</div>;
  }

  const inputStyle =
    "w-64 pr-10 pl-4 py-3 bg-brand-blue-bg border-2 border-brand-blue rounded-md text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-blue";

  return (
    <>
      <style>{`
        @page {
          @bottom-center {
            content: counter(page) " / " counter(pages);
            font-family: "Cairo", sans-serif;
            font-size: 12px;
            color: #1F2937;
          }
        }
        @media print {
          .no-print { display: none !important; }
          body { -webkit-print-color-adjust: exact !important; color-adjust: exact !important; }
          thead { display: table-header-group; }
          tfoot { display: table-row-group !important; }
          table { width: 100%; border-collapse: collapse; }
          th { padding: 6px 8px !important; }
          td { padding: 6px 8px !important; }
          tbody tr:first-child { background: #FFFFFF !important; }
          tbody tr:nth-child(2n+2) { background: #D1D5DB !important; }
          tbody tr:nth-child(2n+3) { background: #FFFFFF !important; }
          tfoot tr { page-break-inside: avoid !important; break-inside: avoid !important; }
        }
      `}</style>
      <div className="bg-white p-6 rounded-lg shadow">
        <h1 className="text-2xl font-bold mb-4 text-brand-dark">{title}</h1>
        <div className="flex justify-between items-center mb-6 no-print">
          <div className="relative">
            <SearchIcon className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-6 h-6" />
            <input
              type="text"
              placeholder="بحث عن فرع..."
              className={inputStyle}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-3">
            <PermissionWrapper
              requiredPermission={buildPermission(
                Resources.BRANCHES_DATA,
                Actions.CREATE,
              )}
              fallback={
                <button
                  type="button"
                  disabled
                  className="px-6 py-3 bg-gray-400 text-white rounded-md cursor-not-allowed opacity-50 font-semibold"
                >
                  اضافة فرع جديد
                </button>
              }
            >
              <button
                onClick={() => handleOpenModal()}
                className="px-6 py-3 bg-brand-blue text-white rounded-md hover:bg-blue-800 font-semibold"
              >
                اضافة فرع جديد
              </button>
            </PermissionWrapper>
            <PermissionWrapper
              requiredPermission={buildPermission(
                Resources.BRANCHES_DATA,
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
                  كود الفرع
                </th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-white uppercase tracking-wider">
                  اسم الفرع
                </th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-white uppercase tracking-wider">
                  العنوان
                </th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-white uppercase tracking-wider">
                  الهاتف
                </th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-white uppercase tracking-wider no-print">
                  اجراءات
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredBranches.map((branch) => (
                <tr key={branch.id} className="hover:bg-brand-blue-bg">
                  <td className="px-6 py-4 whitespace-nowrap">{branch.code}</td>
                  <td className="px-6 py-4 whitespace-nowrap font-medium text-brand-dark">
                    {branch.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {branch.address}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {branch.phone}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium no-print">
                  <PermissionWrapper
                    requiredPermission={buildPermission(
                      Resources.BRANCHES_DATA,
                      Actions.UPDATE,
                    )}
                    fallback={
                      <button
                        type="button"
                        disabled
                        className="text-gray-400 font-semibold ml-4 cursor-not-allowed opacity-50"
                      >
                        تعديل
                      </button>
                    }
                  >
                    <button
                      onClick={() => handleEditClick(branch)}
                      className="text-brand-blue hover:text-blue-800 font-semibold ml-4"
                    >
                      تعديل
                    </button>
                  </PermissionWrapper>
                  <PermissionWrapper
                    requiredPermission={buildPermission(
                      Resources.BRANCHES_DATA,
                      Actions.DELETE,
                    )}
                    fallback={
                      <button
                        type="button"
                        disabled
                        className="text-gray-400 font-semibold cursor-not-allowed opacity-50"
                      >
                        حذف
                      </button>
                    }
                  >
                    <button
                      onClick={() => handleDeleteClick(branch)}
                      className="text-red-600 hover:text-red-900 font-semibold"
                    >
                      حذف
                    </button>
                  </PermissionWrapper>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <BranchModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSave}
        branchToEdit={branchToEdit}
      />
    </>
  );
};

export default BranchesData;

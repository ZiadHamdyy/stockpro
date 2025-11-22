import React, { useState } from "react";
import type { Branch } from "../../../types";
import { ExcelIcon, PdfIcon, PrintIcon, SearchIcon } from "../../icons";
import UserModal from "./UserModal";
import { useModal } from "../../common/ModalProvider";
import { exportToExcel, exportToPdf } from "../../../utils/formatting";
import {
  useGetUsersQuery,
  useDeleteUserMutation,
  useToggleUserActivityMutation,
  type User,
} from "../../store/slices/user/userApi";
import { useGetBranchesQuery } from "../../store/slices/branch/branchApi";
import { useAppSelector } from "../../store/hooks";
import { selectCurrentUser } from "../../store/slices/auth/auth";
import { useToast } from "../../common/ToastProvider";

interface UsersDataProps {
  title: string;
}

const UsersData: React.FC<UsersDataProps> = ({ title }) => {
  const {
    data: users = [],
    isLoading: isLoadingUsers,
    error: usersError,
  } = useGetUsersQuery();
  const { data: branches = [], isLoading: isLoadingBranches } =
    useGetBranchesQuery();
  const [deleteUser, { isLoading: isDeleting }] = useDeleteUserMutation();
  const [toggleUserActivity, { isLoading: isToggling }] =
    useToggleUserActivityMutation();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const { showModal } = useModal();
  const currentUser = useAppSelector(selectCurrentUser as any) as any;
  const { showToast } = useToast();

  const handleOpenModal = (user: User | null = null) => {
    setUserToEdit(user);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setUserToEdit(null);
  };

  const handleEditClick = (user: User) => {
    showModal({
      title: "تأكيد التعديل",
      message: "هل أنت متأكد من رغبتك في تعديل بيانات هذا المستخدم؟",
      onConfirm: () => {
        handleOpenModal(user);
      },
      type: "edit",
    });
  };

  const handleDeleteClick = (user: User) => {
    // Prevent deleting the currently logged-in user
    if (currentUser && user?.id === currentUser?.id) {
      showToast("لا يمكنك حذف حسابك الحالي.", 'error');
      return;
    }
    showModal({
      title: "تأكيد الحذف",
      message: `هل أنت متأكد من حذف المستخدم "${user.name}"؟`,
      onConfirm: async () => {
        try {
          await deleteUser(user.id).unwrap();
        } catch (error) {
          console.error("Error deleting user:", error);
          // You might want to show a toast notification here
        }
      },
      type: "delete",
    });
  };

  const handleToggleStatus = async (user: User) => {
    // Prevent users from deactivating themselves
    if (currentUser && user?.id === currentUser?.id) {
      showToast("لا يمكنك تعطيل حسابك الحالي.", 'error');
      return;
    }

    try {
      await toggleUserActivity(user.id).unwrap();
      showToast(
        user.active
          ? "تم تعطيل المستخدم بنجاح"
          : "تم تفعيل المستخدم بنجاح",
      );
    } catch (error: any) {
      console.error("Error toggling user status:", error);
      showToast("حدث خطأ أثناء تحديث حالة المستخدم", 'error');
    }
  };

  const filteredUsers = users.filter(
    (user) =>
      (user.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.email || "").toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const handleExcelExport = () => {
    const dataToExport = filteredUsers.map(({ id, name, email, role, branch }) => ({
      "كود المستخدم": id,
      "الاسم الكامل": name || "",
      "الفرع": branch?.name || "",
      "البريد الإلكتروني": email || "",
      "مجموعة الصلاحيات":
        role?.name === "manager"
          ? "مدير"
          : role?.name === "accountant"
            ? "محاسب"
            : role?.name === "salesperson"
              ? "بائع"
              : role?.name === "data_entry"
                ? "مدخل البيانات"
                : role?.name || "مستخدم",
      الحالة: "نشط",
    }));
    exportToExcel(dataToExport, "قائمة-المستخدمين");
  };

  const handlePdfExport = () => {
    const head = [
      [
        "الحالة",
        "مجموعة الصلاحيات",
        "البريد الإلكتروني",
        "الفرع",
        "الاسم الكامل",
        "كود المستخدم",
      ],
    ];
    const body = filteredUsers.map((user) => [
      user.active ? "نشط" : "غير نشط",
      user.role?.name === "manager"
        ? "مدير"
        : user.role?.name === "accountant"
          ? "محاسب"
          : user.role?.name === "salesperson"
            ? "بائع"
            : user.role?.name === "data_entry"
              ? "مدخل البيانات"
              : user.role?.name || "مستخدم",
      user.email || "",
      user.branch?.name || "",
      user.name || "",
      user.id.toString(),
    ]);

    exportToPdf("قائمة المستخدمين", head, body, "قائمة-المستخدمين");
  };

  const inputStyle =
    "w-64 pr-10 pl-4 py-3 bg-brand-blue-bg border-2 border-brand-blue rounded-md text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-blue";

  return (
    <>
      <style>
        {`
          @media print {
            @page { size: A4 landscape; margin: 10mm; }
            .no-print { display: none !important; }
            .overflow-x-auto { overflow: visible !important; }
            table { font-size: 12px !important; }
            th, td { padding: 4px 6px !important; }
          }
        `}
      </style>
      <div className="bg-white p-6 rounded-lg shadow">
        <h1 className="text-2xl font-bold mb-4 text-brand-dark">{title}</h1>
        <div className="flex justify-between items-center mb-4 no-print">
          <div className="relative">
            <SearchIcon className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-6 h-6" />
            <input
              type="text"
              placeholder="بحث عن مستخدم..."
              className={inputStyle}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleOpenModal()}
              className="px-6 py-3 bg-brand-blue text-white rounded-md hover:bg-blue-800 font-semibold"
            >
              اضافة مستخدم جديد
            </button>
            <button
              onClick={handleExcelExport}
              title="تصدير Excel"
              className="p-3 border-2 border-gray-200 rounded-md hover:bg-gray-100"
            >
              <ExcelIcon className="w-6 h-6" />
            </button>
            <button
              onClick={handlePdfExport}
              title="تصدير PDF"
              className="p-3 border-2 border-gray-200 rounded-md hover:bg-gray-100"
            >
              <PdfIcon className="w-6 h-6" />
            </button>
            <button
              title="طباعة"
              onClick={() => window.print()}
              className="p-3 border-2 border-gray-200 rounded-md hover:bg-gray-100"
            >
              <PrintIcon className="w-6 h-6" />
            </button>
          </div>
        </div>
        {isLoadingUsers ? (
          <div className="flex justify-center items-center py-8">
            <div className="text-lg">جاري تحميل البيانات...</div>
          </div>
        ) : usersError ? (
          <div className="flex justify-center items-center py-8">
            <div className="text-lg text-red-600">
              خطأ في تحميل البيانات: {JSON.stringify(usersError)}
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-brand-blue">
                <tr>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-white uppercase tracking-wider">
                    كود المستخدم
                  </th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-white uppercase tracking-wider">
                    الاسم الكامل
                  </th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-white uppercase tracking-wider">
                    الفرع
                  </th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-white uppercase tracking-wider">
                    البريد الإلكتروني
                  </th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-white uppercase tracking-wider">
                    مجموعة الصلاحيات
                  </th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-white uppercase tracking-wider w-52 min-w-[208px]">
                    الحالة
                  </th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-white uppercase tracking-wider">
                    تاريخ الإنشاء
                  </th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-white uppercase tracking-wider no-print">
                    اجراءات
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-brand-blue-bg">
                    <td className="px-6 py-4 whitespace-nowrap">{user?.code}</td>
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-brand-dark">
                      {user.name || ""}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {user.branch?.name || ""}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {user.email || ""}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          user.role?.name === "مدير"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-green-100 text-green-800"
                        }`}
                      >
                        {user.role?.name === "manager"
                          ? "مدير"
                          : user.role?.name === "accountant"
                            ? "محاسب"
                            : user.role?.name === "salesperson"
                              ? "بائع"
                              : user.role?.name === "data_entry"
                                ? "مدخل البيانات"
                                : user.role?.name || "مستخدم"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap w-52 min-w-[208px]">
                      <div className="flex items-center gap-4">
                        <span
                          className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full flex-shrink-0 ${user.active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
                        >
                          {user.active ? "نشط" : "غير نشط"}
                        </span>
                        <label className="no-print relative inline-flex items-center cursor-pointer flex-shrink-0">
                          <input
                            type="checkbox"
                            checked={user.active}
                            onChange={() => handleToggleStatus(user)}
                            disabled={
                              isToggling ||
                              (currentUser && user?.id === currentUser?.id)
                            }
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-brand-blue/20 rounded-full peer peer-checked:bg-brand-blue peer-disabled:opacity-50 peer-disabled:cursor-not-allowed">
                            <div className={`absolute top-[2px] h-5 w-5 bg-white border border-gray-300 rounded-full transition-all duration-200 ${user.active ? 'left-[2px]' : 'right-[2px]'}`}></div>
                          </div>
                        </label>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {new Date(user.createdAt).toLocaleDateString("ar-SA")}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium no-print">
                      <button
                        onClick={() => handleEditClick(user)}
                        className="text-brand-blue hover:text-blue-800 font-semibold ml-4"
                      >
                        تعديل
                      </button>
                      <button
                        onClick={() => handleDeleteClick(user)}
                        disabled={isDeleting}
                        className="text-red-600 hover:text-red-900 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isDeleting ? "جاري الحذف..." : "حذف"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <UserModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        userToEdit={userToEdit}
      />
    </>
  );
};

export default UsersData;

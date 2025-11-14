import React, { useState, useMemo } from "react";
import {
  DollarSignIcon,
  MoreVerticalIcon,
  PrintIcon,
  SearchIcon,
  TruckIcon,
} from "../../icons";
import { formatNumber } from "../../../utils/formatting";
import DataTableModal from "../../common/DataTableModal";
import { useGetCompanyQuery } from "../../store/slices/companyApiSlice";
import { useSuppliers } from "../../hook/useSuppliers";
import PermissionWrapper from "../../common/PermissionWrapper";
import {
  Resources,
  Actions,
  buildPermission,
} from "../../../enums/permissions.enum";

interface SuppliersListProps {
  title: string;
  onNavigate: (key: string, label: string, id?: string | null) => void;
  companyInfo?: any;
}

const StatCard: React.FC<{
  title: string;
  value: string;
  icon: React.ReactNode;
  color: string;
}> = ({ title, value, icon, color }) => (
  <div
    className={`flex items-center p-4 bg-white rounded-lg shadow-sm border-r-4 ${color}`}
  >
    {icon}
    <div className="mr-4">
      <p className="text-sm font-medium text-gray-500">{title}</p>
      <p className="text-lg font-semibold text-brand-dark">{value}</p>
    </div>
  </div>
);

const SuppliersList: React.FC<SuppliersListProps> = ({
  title,
  onNavigate,
}) => {
  const { data: companyInfo } = useGetCompanyQuery();
  const { suppliers, isLoading, handleDeleteClick } = useSuppliers();
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "balance_high" | "balance_low">(
    "name",
  );
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [isListModalOpen, setIsListModalOpen] = useState(false);

  const onDelete = (id: string) => {
    const supplier = suppliers.find((s) => s.id === id);
    if (supplier) {
      handleDeleteClick(supplier);
    }
  };

  const stats = useMemo(() => {
    const totalSuppliers = suppliers.length;
    // Assuming positive balance means we owe the supplier (liability)
    const totalLiability = suppliers.reduce(
      (sum, s) => (s.currentBalance > 0 ? sum + s.currentBalance : sum),
      0,
    );
    // Assuming negative balance means supplier owes us (asset)
    const totalAsset = suppliers.reduce(
      (sum, s) => (s.currentBalance < 0 ? sum + s.currentBalance : sum),
      0,
    );
    return { totalSuppliers, totalLiability, totalAsset };
  }, [suppliers]);

  const sortedAndFilteredSuppliers = useMemo(() => {
    return suppliers
      .filter(
        (supplier) =>
          supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          supplier.code.toLowerCase().includes(searchTerm.toLowerCase()),
      )
      .sort((a, b) => {
        switch (sortBy) {
          case "balance_high":
            return b.currentBalance - a.currentBalance;
          case "balance_low":
            return a.currentBalance - b.currentBalance;
          case "name":
          default:
            return a.name.localeCompare(b.name);
        }
      });
  }, [suppliers, searchTerm, sortBy]);

  const inputStyle =
    "w-full md:w-72 pr-10 pl-4 py-3 bg-brand-green-bg border-2 border-brand-green rounded-md text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-green";

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-gray-500">جاري التحميل...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center no-print">
        <h1 className="text-2xl font-bold text-brand-dark">{title}</h1>
        <PermissionWrapper
          requiredPermission={buildPermission(
            Resources.SUPPLIERS,
            Actions.CREATE,
          )}
        >
          <button
            onClick={() => onNavigate("add_supplier", "إضافة مورد")}
            className="px-6 py-2 bg-brand-green text-white rounded-md hover:bg-green-700 font-semibold transition-colors"
          >
            إضافة مورد جديد
          </button>
        </PermissionWrapper>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 no-print">
        <div
          className="cursor-pointer transition-transform hover:scale-105"
          onClick={() => setIsListModalOpen(true)}
        >
          <StatCard
            title="إجمالي الموردين"
            value={stats.totalSuppliers.toString()}
            icon={<TruckIcon className="w-8 h-8 text-green-500" />}
            color="border-green-500"
          />
        </div>
        <StatCard
          title="إجمالي المستحقات"
          value={`${formatNumber(Math.abs(stats.totalAsset))}`}
          icon={<DollarSignIcon className="w-8 h-8 text-red-500" />}
          color="border-red-500"
        />
        <StatCard
          title="إجمالي السندات"
          value={`${formatNumber(Math.abs(stats.totalLiability))}`}
          icon={<DollarSignIcon className="w-8 h-8 text-green-500" />}
          color="border-green-500"
        />
      </div>

      {/* Controls */}
      <div className="bg-white p-4 rounded-lg shadow-sm no-print">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="relative w-full md:w-auto">
            <SearchIcon className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-6 h-6" />
            <input
              type="text"
              placeholder="بحث بالاسم أو الكود..."
              className={inputStyle}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-4">
            <label htmlFor="sort" className="text-sm font-medium text-gray-700">
              ترتيب حسب:
            </label>
            <select
              id="sort"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-brand-green-bg border-2 border-brand-green rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-brand-green"
            >
              <option value="name">الاسم</option>
              <option value="balance_high">الرصيد (الأعلى)</option>
              <option value="balance_low">الرصيد (الأدنى)</option>
            </select>
            <PermissionWrapper
              requiredPermission={buildPermission(
                Resources.SUPPLIERS,
                Actions.PRINT,
              )}
            >
              <button
                title="طباعة"
                onClick={() => window.print()}
                className="p-3 border-2 border-gray-200 rounded-md hover:bg-gray-100"
              >
                <PrintIcon className="w-6 h-6" />
              </button>
            </PermissionWrapper>
          </div>
        </div>
      </div>

      {/* Supplier Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {sortedAndFilteredSuppliers.map((supplier) => (
          <div
            key={supplier.id}
            className="bg-white rounded-lg shadow-md border-t-4 border-brand-green p-5 flex flex-col justify-between relative transition-all hover:shadow-xl"
          >
            <div>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-brand-dark truncate">
                    {supplier.name}
                  </h3>
                  <p className="text-sm text-gray-500">
                    الكود: {supplier.code}
                  </p>
                </div>
                <div className="relative no-print">
                  <button
                    onClick={() =>
                      setActiveDropdown(
                        activeDropdown === supplier.id ? null : supplier.id,
                      )
                    }
                    className="p-1 rounded-full hover:bg-gray-200"
                    aria-label="Actions"
                  >
                    <MoreVerticalIcon className="text-gray-600" />
                  </button>
                  {activeDropdown === supplier.id && (
                    <div className="absolute left-0 mt-2 w-40 bg-white rounded-md shadow-lg z-20 border">
                      <a
                        onClick={() => {
                          onNavigate(
                            "supplier_statement_report",
                            `كشف حساب ${supplier.name}`,
                          );
                          setActiveDropdown(null);
                        }}
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
                      >
                        كشف حساب
                      </a>
                      <PermissionWrapper
                        requiredPermission={buildPermission(
                          Resources.SUPPLIERS,
                          Actions.UPDATE,
                        )}
                      >
                        <a
                          onClick={() => {
                            onNavigate(
                              "add_supplier",
                              `تعديل مورد #${supplier.id}`,
                              supplier.id,
                            );
                            setActiveDropdown(null);
                          }}
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
                        >
                          تعديل
                        </a>
                      </PermissionWrapper>
                      <PermissionWrapper
                        requiredPermission={buildPermission(
                          Resources.SUPPLIERS,
                          Actions.DELETE,
                        )}
                      >
                        <a
                          onClick={() => onDelete(supplier.id)}
                          className="block px-4 py-2 text-sm text-red-600 hover:bg-red-50 cursor-pointer"
                        >
                          حذف
                        </a>
                      </PermissionWrapper>
                    </div>
                  )}
                </div>
              </div>
              <div className="mt-4 border-t pt-4">
                <p className="text-sm text-gray-500">
                  الهاتف: {supplier.phone}
                </p>
                <p className="text-sm text-gray-500">
                  الرقم الضريبي: {supplier.taxNumber}
                </p>
              </div>
            </div>
            <div
              className={`mt-4 p-3 rounded-md text-center ${supplier.currentBalance >= 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700" }`}
            >
              <span className="text-sm font-semibold">الرصيد الحالي</span>
              <p className="text-2xl font-bold">
                {formatNumber(Math.abs(supplier.currentBalance))}
              </p>
            </div>
          </div>
        ))}
        {sortedAndFilteredSuppliers.length === 0 && (
          <p className="text-center text-gray-500 md:col-span-2 xl:col-span-3">
            لا يوجد موردين يطابقون البحث.
          </p>
        )}
      </div>

      <DataTableModal
        isOpen={isListModalOpen}
        onClose={() => setIsListModalOpen(false)}
        title="قائمة الموردين"
        companyInfo={companyInfo}
        colorTheme="green"
        columns={[
          { Header: "#", accessor: "sn" },
          { Header: "اسم المورد", accessor: "name" },
          { Header: "العنوان", accessor: "nationalAddress" },
          { Header: "الهاتف", accessor: "phone" },
          { Header: "الرصيد", accessor: "balance" },
        ]}
        data={suppliers.map((s, i) => ({
          ...s,
          sn: i + 1,
          balance: s.currentBalance,
        }))}
        onSelectRow={(row) => {
          onNavigate("add_supplier", `تعديل مورد #${row.id}`, row.id);
          setIsListModalOpen(false);
        }}
      />
    </div>
  );
};

export default SuppliersList;

import React, { useState, useMemo } from "react";
import type { Customer, CompanyInfo } from "../../../types";
import {
  DollarSignIcon,
  MoreVerticalIcon,
  PrintIcon,
  SearchIcon,
  UsersIcon,
} from "../../icons";
import { useModal } from "../../common/ModalProvider";
import { formatNumber } from "../../../utils/formatting";
import DataTableModal from "../../common/DataTableModal";

interface CustomersListProps {
  title: string;
  customers: Customer[];
  onNavigate: (key: string, label: string, id?: number | null) => void;
  onDelete: (id: number) => void;
  companyInfo: CompanyInfo;
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

const CustomersList: React.FC<CustomersListProps> = ({
  title,
  customers,
  onNavigate,
  onDelete,
  companyInfo,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "balance_high" | "balance_low">(
    "name",
  );
  const [activeDropdown, setActiveDropdown] = useState<number | null>(null);
  const [isListModalOpen, setIsListModalOpen] = useState(false);

  const { showModal } = useModal();

  const handleDeleteClick = (id: number, name: string) => {
    showModal({
      title: "تأكيد الحذف",
      message: `هل أنت متأكد من رغبتك في حذف العميل "${name}"؟`,
      onConfirm: () => onDelete(id),
      type: "delete",
      showPassword: true,
    });
    setActiveDropdown(null);
  };

  const stats = useMemo(() => {
    const totalCustomers = customers.length;
    const totalDebt = customers.reduce(
      (sum, c) => (c.openingBalance > 0 ? sum + c.openingBalance : sum),
      0,
    );
    const totalCredit = customers.reduce(
      (sum, c) => (c.openingBalance < 0 ? sum + c.openingBalance : sum),
      0,
    );
    return { totalCustomers, totalDebt, totalCredit };
  }, [customers]);

  const sortedAndFilteredCustomers = useMemo(() => {
    return customers
      .filter(
        (customer) =>
          customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          customer.code.toLowerCase().includes(searchTerm.toLowerCase()),
      )
      .sort((a, b) => {
        switch (sortBy) {
          case "balance_high":
            return b.openingBalance - a.openingBalance;
          case "balance_low":
            return a.openingBalance - b.openingBalance;
          case "name":
          default:
            return a.name.localeCompare(b.name);
        }
      });
  }, [customers, searchTerm, sortBy]);

  const inputStyle =
    "w-full md:w-72 pr-10 pl-4 py-3 bg-brand-blue-bg border-2 border-brand-blue rounded-md text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-blue";

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center no-print">
        <h1 className="text-2xl font-bold text-brand-dark">{title}</h1>
        <button
          onClick={() => onNavigate("add_customer", "إضافة عميل")}
          className="px-6 py-2 bg-brand-green text-white rounded-md hover:bg-green-700 font-semibold transition-colors"
        >
          إضافة عميل جديد
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 no-print">
        <div
          className="cursor-pointer transition-transform hover:scale-105"
          onClick={() => setIsListModalOpen(true)}
        >
          <StatCard
            title="إجمالي العملاء"
            value={stats.totalCustomers.toString()}
            icon={<UsersIcon className="w-8 h-8 text-blue-500" />}
            color="border-blue-500"
          />
        </div>
        <StatCard
          title="إجمالي الديون (مدين)"
          value={`${formatNumber(stats.totalDebt)}`}
          icon={<DollarSignIcon className="w-8 h-8 text-red-500" />}
          color="border-red-500"
        />
        <StatCard
          title="إجمالي الأرصدة (دائن)"
          value={`${formatNumber(Math.abs(stats.totalCredit))}`}
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
              className="bg-brand-blue-bg border-2 border-brand-blue rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-brand-blue"
            >
              <option value="name">الاسم</option>
              <option value="balance_high">الرصيد (الأعلى)</option>
              <option value="balance_low">الرصيد (الأدنى)</option>
            </select>
            <button
              title="طباعة"
              onClick={() => window.print()}
              className="p-3 border-2 border-gray-200 rounded-md hover:bg-gray-100"
            >
              <PrintIcon className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>

      {/* Customer Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {sortedAndFilteredCustomers.map((customer) => (
          <div
            key={customer.id}
            className="bg-white rounded-lg shadow-md border-t-4 border-brand-blue p-5 flex flex-col justify-between relative transition-all hover:shadow-xl"
          >
            <div>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-brand-dark truncate">
                    {customer.name}
                  </h3>
                  <p className="text-sm text-gray-500">
                    الكود: {customer.code}
                  </p>
                </div>
                <div className="relative no-print">
                  <button
                    onClick={() =>
                      setActiveDropdown(
                        activeDropdown === customer.id ? null : customer.id,
                      )
                    }
                    className="p-1 rounded-full hover:bg-gray-200"
                    aria-label="Actions"
                  >
                    <MoreVerticalIcon className="text-gray-600" />
                  </button>
                  {activeDropdown === customer.id && (
                    <div className="absolute left-0 mt-2 w-40 bg-white rounded-md shadow-lg z-20 border">
                      <a
                        onClick={() => {
                          onNavigate(
                            "customer_statement_report",
                            `كشف حساب ${customer.name}`,
                          );
                          setActiveDropdown(null);
                        }}
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
                      >
                        كشف حساب
                      </a>
                      <a
                        onClick={() => {
                          onNavigate(
                            "add_customer",
                            `تعديل عميل #${customer.id}`,
                            customer.id,
                          );
                          setActiveDropdown(null);
                        }}
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
                      >
                        تعديل
                      </a>
                      <a
                        onClick={() =>
                          handleDeleteClick(customer.id, customer.name)
                        }
                        className="block px-4 py-2 text-sm text-red-600 hover:bg-red-50 cursor-pointer"
                      >
                        حذف
                      </a>
                    </div>
                  )}
                </div>
              </div>
              <div className="mt-4 border-t pt-4">
                <p className="text-sm text-gray-500">
                  الهاتف: {customer.phone}
                </p>
                <p className="text-sm text-gray-500">
                  الرقم الضريبي: {customer.taxNumber}
                </p>
              </div>
            </div>
            <div
              className={`mt-4 p-3 rounded-md text-center ${customer.openingBalance >= 0 ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}
            >
              <span className="text-sm font-semibold">الرصيد الحالي</span>
              <p className="text-2xl font-bold">
                {formatNumber(Math.abs(customer.openingBalance))}
              </p>
            </div>
          </div>
        ))}
        {sortedAndFilteredCustomers.length === 0 && (
          <p className="text-center text-gray-500 md:col-span-2 xl:col-span-3">
            لا يوجد عملاء يطابقون البحث.
          </p>
        )}
      </div>

      <DataTableModal
        isOpen={isListModalOpen}
        onClose={() => setIsListModalOpen(false)}
        title="قائمة العملاء"
        companyInfo={companyInfo}
        columns={[
          { Header: "#", accessor: "sn" },
          { Header: "اسم العميل", accessor: "name" },
          { Header: "العنوان", accessor: "nationalAddress" },
          { Header: "الهاتف", accessor: "phone" },
          { Header: "الرصيد", accessor: "balance" },
        ]}
        data={customers.map((c, i) => ({
          ...c,
          sn: i + 1,
          balance: c.openingBalance,
        }))}
        onSelectRow={(row) => {
          onNavigate("add_customer", `تعديل عميل #${row.id}`, row.id);
          setIsListModalOpen(false);
        }}
      />
    </div>
  );
};

export default CustomersList;

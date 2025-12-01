import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  LogOutIcon,
  BellIcon,
  BoxIcon,
  ReceiptIcon,
} from "../icons";
import type { User } from "../../types";
import { getLabelByPath } from "../../routes/routeConfig";
import { useTitle } from "../context/TitleContext";
import { 
  useGetNotificationsQuery, 
  useGetUnreadCountQuery,
  useMarkAsReadMutation,
  type Notification 
} from "../store/slices/notification/notificationApi";

interface HeaderProps {
  currentUser: User | null;
  onLogout: () => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
}

const Header: React.FC<HeaderProps> = ({
  currentUser,
  onLogout,
  searchTerm,
  setSearchTerm,
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { title: dynamicTitle } = useTitle();
  const routeTitle = getLabelByPath(location.pathname);
  const title = dynamicTitle || routeTitle;
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch notifications from API
  const { data: notifications = [], refetch: refetchNotifications } = useGetNotificationsQuery();
  const { data: unreadCount = 0 } = useGetUnreadCountQuery();
  const [markAsRead] = useMarkAsReadMutation();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const NotificationIcon = ({ type }: { type: string }) => {
    switch (type) {
      case "stock":
        return <BoxIcon className="w-5 h-5 text-yellow-500" />;
      case "invoice":
        return <ReceiptIcon className="w-5 h-5 text-red-500" />;
      case "store_transfer":
      case "store_transfer_accepted":
      case "store_transfer_rejected":
        return <BoxIcon className="w-5 h-5 text-blue-500" />;
      default:
        return <BellIcon className="w-5 h-5 text-gray-500" />;
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    // Mark as read
    if (!notification.read) {
      try {
        await markAsRead(notification.id).unwrap();
        refetchNotifications();
      } catch (error) {
        console.error("Error marking notification as read:", error);
      }
    }

    // Navigate to related page if applicable
    if (notification.relatedId) {
      const encodedId = encodeURIComponent(String(notification.relatedId));
      
      // Store transfer notifications (new, accepted, rejected)
      // Use window.location.href for full page reload (like DailyCollectionsReport pattern)
      if (
        notification.type === "store_transfer" ||
        notification.type === "store_transfer_accepted" ||
        notification.type === "store_transfer_rejected"
      ) {
        window.location.href = `/warehouse/transfer?voucherId=${encodedId}`;
        return;
      }

      // Invoice notifications - check message to determine sales vs purchase
      if (notification.type === "invoice" || notification.message?.includes("فاتورة")) {
        // Check if it's a sales invoice (فاتورة المبيعات) or purchase invoice (فاتورة المشتريات)
        if (notification.message?.includes("فاتورة المبيعات") || notification.message?.includes("sales")) {
          navigate(`/sales/invoice?invoiceId=${encodedId}`);
          setIsDropdownOpen(false);
          return;
        } else if (notification.message?.includes("فاتورة المشتريات") || notification.message?.includes("purchase")) {
          navigate(`/purchases/invoice?invoiceId=${encodedId}`);
          setIsDropdownOpen(false);
          return;
        }
      }
    }
  };

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 flex-shrink-0">
      {/* Right side - Title */}
      <div className="flex-shrink-0">
        <h1 className="text-xl font-semibold text-brand-dark">{title}</h1>
      </div>

      {/* Center - Search */}
      <div className="flex-1 flex justify-center px-4 md:px-8 lg:px-16">
        <div className="relative w-full max-w-lg">
          <input
            type="text"
            placeholder="ابحث في البرنامج..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border-2 border-green-700 rounded-md bg-brand-green text-white placeholder-green-100 focus:outline-none focus:ring-2 focus:ring-brand-green-active focus:border-brand-green-active transition-colors"
          />
        </div>
      </div>

      {/* Left side - Actions */}
      <div className="flex-shrink-0 flex items-center gap-x-4">
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="p-2 rounded-full text-gray-500 hover:bg-gray-100 hover:text-brand-dark relative"
          >
            <BellIcon />
            {unreadCount > 0 && (
              <span className="absolute top-0 right-0 block h-5 w-5 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center transform -translate-y-1/2 translate-x-1/2">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>

          {isDropdownOpen && (
            <div className="absolute left-0 mt-2 w-80 bg-white rounded-lg shadow-xl border z-20">
              <div className="p-3 font-bold text-brand-dark border-b flex justify-between items-center">
                <span>الإشعارات</span>
                {unreadCount > 0 && (
                  <span className="text-xs text-gray-500">
                    {unreadCount} غير مقروء
                  </span>
                )}
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notifications.length > 0 ? (
                  notifications.map((notif) => (
                    <div
                      key={notif.id}
                      onClick={() => handleNotificationClick(notif)}
                      className={`flex items-start gap-3 p-3 border-b last:border-b-0 hover:bg-gray-50 cursor-pointer ${
                        !notif.read ? 'bg-blue-50' : ''
                      }`}
                    >
                      <NotificationIcon type={notif.type} />
                      <div className="flex-1">
                        <p className={`text-sm ${!notif.read ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>
                          {notif.message}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(notif.createdAt).toLocaleDateString('ar-SA', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                      {!notif.read && (
                        <div className="w-2 h-2 rounded-full bg-blue-500 mt-1"></div>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-center text-gray-500 p-4">
                    لا توجد إشعارات جديدة.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
        <div className="flex items-center cursor-pointer">
          {currentUser?.image ? (
            <img
              src={currentUser.image}
              alt="User"
              className="w-10 h-10 rounded-full"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-brand-blue text-white flex items-center justify-center font-semibold text-sm">
              {currentUser?.name?.charAt(0)?.toUpperCase() || "م"}
            </div>
          )}
          <div className="flex-1 mr-4">
            <div className="font-semibold text-sm text-brand-dark text-right">
              {currentUser?.name || "مستخدم"}
            </div>
            <div className="text-xs text-gray-500 text-right">
              {currentUser?.email || "غير محدد"}
            </div>
          </div>
        </div>
        <button
          onClick={onLogout}
          title="تسجيل الخروج"
          className="p-2 rounded-full text-brand-blue hover:bg-red-100 hover:text-red-600 transition-colors"
        >
          <LogOutIcon />
        </button>
      </div>
    </header>
  );
};

export default Header;

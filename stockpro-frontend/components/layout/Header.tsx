import React, { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import {
  LogOutIcon,
} from "../icons";
import type { User } from "../../types";
import { getLabelByPath } from "../../routes/routeConfig";
import { useTitle } from "../context/TitleContext";

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
  const { title: dynamicTitle } = useTitle();
  const routeTitle = getLabelByPath(location.pathname);
  const title = dynamicTitle || routeTitle;

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

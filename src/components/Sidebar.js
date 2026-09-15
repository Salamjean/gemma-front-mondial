"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import {
  FaHome,
  FaCalendarAlt,
  FaFileMedical,
  FaSignOutAlt,
  FaUserCircle,
  FaClipboardList,
  FaChevronLeft,
  FaChevronRight,
  FaIdCard,
} from "react-icons/fa";

export default function Sidebar({
  handleLogout,
  setIsSidebarOpen,
  isCollapsed: propIsCollapsed,
  toggleCollapse: propToggleCollapse,
}) {
  const pathname = usePathname();
  const [internalIsCollapsed, setInternalIsCollapsed] = useState(true);
  const [activeItem, setActiveItem] = useState("");

  const isCollapsed =
    propIsCollapsed !== undefined ? propIsCollapsed : internalIsCollapsed;

  const toggleCollapse = () => {
    if (propToggleCollapse) {
      propToggleCollapse();
    } else {
      setInternalIsCollapsed(!internalIsCollapsed);
    }
  };

  // Mettre à jour l'item actif quand la route change
  useEffect(() => {
    setActiveItem(pathname);
  }, [pathname]);

  const navItems = [
    {
      name: "Tableau de Bord",
      href: "/dashboard",
      icon: FaHome,
      description: "Vue d'ensemble",
    },
    {
      name: "Consultations",
      href: "/dashboard/consultations",
      icon: FaFileMedical,
      description: "Historique médical",
    },
    {
      name: "Déclarations",
      href: "/dashboard/declarations",
      icon: FaClipboardList,
      description: "Mes déclarations",
    },
    {
      name: "Rendez-vous",
      href: "/dashboard/rdv",
      icon: FaCalendarAlt,
      description: "Gérer mes RDV",
    },
    {
      name: "Ma Carte",
      href: "/dashboard/card",
      icon: FaIdCard,
      description: "Carte de Soin",
    },
  ];

  return (
    <>
      {/* Version Mobile Drawer Content */}
      <div className="md:hidden bg-white w-full h-full shadow-2xl flex flex-col">
        {/* Header Drawer */}
        <div className="p-4 sm:p-5 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-r from-[#06b6d4] to-[#2da442] p-0.5 shadow-md flex-shrink-0">
              <div className="w-full h-full bg-white rounded-[10px] flex items-center justify-center p-1">
                <Image
                  src="/gemma.png"
                  alt="Logo"
                  width={36}
                  height={36}
                  className="object-contain pointer-events-none"
                />
              </div>
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-800 leading-tight">
                Espace Patient
              </h2>
              <p className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> Connecté
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsSidebarOpen && setIsSidebarOpen(false)}
            className="p-2 rounded-xl text-gray-500 hover:bg-gray-100 hover:text-gray-800 transition-colors cursor-pointer"
            aria-label="Fermer le menu"
          >
            <FaChevronLeft className="text-base pointer-events-none" />
          </button>
        </div>

        {/* Navigation mobile avec défilement fluide */}
        <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              onClick={() => setIsSidebarOpen && setIsSidebarOpen(false)}
              className={`flex items-center p-3.5 rounded-xl transition-all duration-200 ${
                activeItem === item.href
                  ? "bg-gradient-to-r from-[#06b6d4]/10 to-[#2da442]/10 border-l-4 border-[#06b6d4] text-[#06b6d4] font-semibold"
                  : "text-gray-700 hover:bg-gray-50 hover:text-[#06b6d4]"
              }`}
            >
              <item.icon
                className={`mr-3.5 text-lg flex-shrink-0 ${
                  activeItem === item.href ? "text-[#06b6d4]" : "text-gray-400"
                }`}
              />
              <div className="flex-1 min-w-0">
                <span className="text-sm font-medium block truncate">{item.name}</span>
                <span className="text-xs text-gray-400 block truncate">
                  {item.description}
                </span>
              </div>
            </Link>
          ))}
        </nav>

        {/* Bouton déconnexion mobile */}
        <div className="p-4 border-t border-gray-100 flex-shrink-0">
          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center justify-center p-3 rounded-xl bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 transition-all duration-200 text-white font-semibold text-sm shadow-md active:scale-[0.98] cursor-pointer"
          >
            <FaSignOutAlt className="mr-2 text-base pointer-events-none" />
            Déconnexion
          </button>
        </div>
      </div>

      {/* Version Desktop (Réduite par défaut) */}
      <div
        className={`hidden md:flex flex-col h-full bg-gradient-to-b from-white to-gray-50 border-r border-gray-200 shadow-lg transition-all duration-300 z-20 ${
          isCollapsed ? "w-20" : "w-64"
        }`}
      >
        {/* En-tête avec bouton de réduction/extension */}
        <div className={`border-b border-gray-100 transition-all ${isCollapsed ? "py-4 px-2" : "p-4 sm:p-5"}`}>
          {isCollapsed ? (
            <div className="flex flex-col items-center space-y-3">
              <button
                type="button"
                onClick={toggleCollapse}
                className="h-10 w-10 rounded-xl bg-gradient-to-r from-[#06b6d4] to-[#2da442] p-0.5 shadow-md flex items-center justify-center cursor-pointer hover:scale-105 transition-transform"
                title="Cliquer pour agrandir le menu"
              >
                <div className="w-full h-full bg-white rounded-[10px] flex items-center justify-center p-1 pointer-events-none">
                  <Image
                    src="/gemma.png"
                    alt="Logo"
                    width={32}
                    height={32}
                    className="object-contain pointer-events-none"
                  />
                </div>
              </button>

              {/* Bouton Chevron d'Agrandissement */}
              <button
                type="button"
                onClick={toggleCollapse}
                className="w-8 h-8 rounded-xl bg-cyan-50 hover:bg-[#06b6d4] hover:text-white text-[#06b6d4] flex items-center justify-center transition-all duration-200 shadow-xs cursor-pointer focus:outline-none"
                title="Agrandir le menu"
                aria-label="Agrandir le menu"
              >
                <FaChevronRight className="text-xs pointer-events-none" />
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <Link href="/dashboard" className="flex items-center space-x-2">
                <Image
                  src="/gemma.png"
                  alt="Logo"
                  width={110}
                  height={40}
                  className="object-contain"
                  priority
                />
              </Link>
              <button
                type="button"
                onClick={toggleCollapse}
                className="p-2 rounded-xl bg-gray-50 hover:bg-[#06b6d4] text-gray-500 hover:text-white transition-all duration-200 cursor-pointer focus:outline-none shadow-xs"
                title="Réduire le menu"
                aria-label="Réduire le menu"
              >
                <FaChevronLeft className="text-sm pointer-events-none" />
              </button>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-2 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = activeItem === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`group flex items-center rounded-xl transition-all duration-200 ${
                  isCollapsed ? "justify-center p-3" : "p-3"
                } ${
                  isActive
                    ? "bg-gradient-to-r from-[#06b6d4] to-[#2da442] text-white shadow-md font-semibold"
                    : "text-gray-700 hover:bg-gray-100 hover:text-[#06b6d4]"
                }`}
                title={isCollapsed ? item.name : undefined}
              >
                <item.icon
                  className={`text-lg flex-shrink-0 ${
                    isCollapsed ? "" : "mr-3.5"
                  } ${
                    isActive
                      ? "text-white"
                      : "text-gray-500 group-hover:text-[#06b6d4]"
                  }`}
                />
                {!isCollapsed && (
                  <div className="flex-1 min-w-0">
                    <span className="font-medium block truncate text-sm">
                      {item.name}
                    </span>
                    <span
                      className={`text-xs block truncate ${
                        isActive ? "text-white/80" : "text-gray-400"
                      }`}
                    >
                      {item.description}
                    </span>
                  </div>
                )}
                {!isCollapsed && isActive && (
                  <div className="w-2 h-2 bg-white rounded-full ml-2 flex-shrink-0"></div>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bouton de bascule en bas de la navigation (quand réduit) */}
        {isCollapsed && (
          <div className="p-3 border-t border-gray-100 flex justify-center flex-shrink-0">
            <button
              type="button"
              onClick={toggleCollapse}
              className="p-2.5 rounded-xl bg-cyan-50 hover:bg-[#06b6d4] hover:text-white text-[#06b6d4] transition-all duration-200 cursor-pointer shadow-xs"
              title="Agrandir le menu"
              aria-label="Agrandir le menu"
            >
              <FaChevronRight className="text-sm pointer-events-none" />
            </button>
          </div>
        )}

        {/* Info utilisateur (quand déplié) */}
        {!isCollapsed && (
          <div className="p-4 border-t border-gray-100 flex-shrink-0">
            <div className="flex items-center">
              <div className="h-9 w-9 rounded-full bg-cyan-100 text-[#06b6d4] flex items-center justify-center mr-3 flex-shrink-0 font-bold">
                <FaUserCircle className="text-xl" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-gray-800 truncate">
                  Espace Patient
                </p>
                <p className="text-[10px] text-emerald-600 font-semibold">En ligne</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

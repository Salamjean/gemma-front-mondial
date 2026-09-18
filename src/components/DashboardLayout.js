"use client";

import { useRouter } from "next/navigation";
import Sidebar from "./Sidebar";
import {
  FaSignOutAlt,
  FaBars,
  FaUserCircle,
} from "react-icons/fa";
import { useState, useEffect, useRef } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

export default function DashboardLayout({ children }) {
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(true); // Réduit par défaut
  const [isScrolled, setIsScrolled] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const profileMenuRef = useRef(null);
  const menuTimeoutRef = useRef(null);

  // Charger et basculer l'état du collapse
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const savedState = localStorage.getItem("patient_sidebar_collapsed");
        if (savedState !== null) {
          setIsCollapsed(JSON.parse(savedState));
        } else {
          setIsCollapsed(true); // Par défaut réduit
        }
      } catch (e) {
        console.error("Erreur lecture sidebar_collapsed:", e);
      }
    }
  }, []);

  const toggleCollapse = () => {
    const nextState = !isCollapsed;
    setIsCollapsed(nextState);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("patient_sidebar_collapsed", JSON.stringify(nextState));
      } catch (e) {
        console.error("Erreur sauvegarde sidebar_collapsed:", e);
      }
    }
  };

  // Fermer le menu profil en cliquant en dehors
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(event.target)
      ) {
        setProfileMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Effet pour détecter le scroll
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Nettoyer le timeout
  useEffect(() => {
    return () => {
      if (menuTimeoutRef.current) {
        clearTimeout(menuTimeoutRef.current);
      }
    };
  }, []);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    const token = localStorage.getItem("patient_token");

    try {
      if (token) {
        const response = await fetch(`${API_URL}/v1/patient/logout`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        });

        if (!response.ok) {
          console.warn(
            "La réponse du serveur n'était pas OK, mais on procède à la déconnexion locale"
          );
        }
      }
    } catch (error) {
      console.error("Erreur lors de la déconnexion API:", error);
    } finally {
      localStorage.removeItem("patient_token");
      localStorage.removeItem("patient_data");

      router.replace("/");

      setTimeout(() => {
        window.location.reload();
      }, 100);
    }
  };

  // Gestion du hover avec délai
  const handleMouseEnter = () => {
    if (menuTimeoutRef.current) {
      clearTimeout(menuTimeoutRef.current);
    }
    setProfileMenuOpen(true);
  };

  const handleMouseLeave = () => {
    menuTimeoutRef.current = setTimeout(() => {
      setProfileMenuOpen(false);
    }, 300);
  };

  // Récupérer les données du patient depuis le localStorage
  const [patientData, setPatientData] = useState({});

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const data = localStorage.getItem("patient_data");
        if (data) {
          setPatientData(JSON.parse(data));
        }
      } catch (error) {
        console.error("Erreur lors du parsing des données patient:", error);
      }
    }

    const handleStorageChange = () => {
      try {
        const data = localStorage.getItem("patient_data");
        if (data) {
          setPatientData(JSON.parse(data));
        }
      } catch (error) {
        console.error("Erreur lors du rafraîchissement:", error);
      }
    };

    window.addEventListener("patientDataUpdated", handleStorageChange);
    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("patientDataUpdated", handleStorageChange);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  // Fonction pour obtenir l'URL de la photo de profil
  const getProfilePhotoUrl = () => {
    const photoUrl =
      patientData?.img_url ||
      patientData?.user?.img_url ||
      patientData?.user?.image_url ||
      patientData?.photo;

    if (photoUrl) {
      if (photoUrl.startsWith("http")) {
        return photoUrl;
      }
      return `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:8000"}/assets/uploads/patient/${photoUrl}`;
    }

    return null;
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gradient-to-br from-cyan-50 via-white to-blue-100 relative">
      {/* Arrière-plan Bulles */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute -top-[10%] -left-[10%] w-[40rem] h-[40rem] bg-cyan-300/20 rounded-full blur-[100px] mix-blend-multiply"></div>
        <div className="absolute top-[20%] -right-[10%] w-[35rem] h-[35rem] bg-blue-300/20 rounded-full blur-[100px] mix-blend-multiply"></div>
        <div className="absolute -bottom-[10%] left-[20%] w-[40rem] h-[40rem] bg-indigo-300/20 rounded-full blur-[100px] mix-blend-multiply"></div>
        <div className="absolute bottom-[30%] right-[20%] w-[30rem] h-[30rem] bg-teal-300/20 rounded-full blur-[80px] mix-blend-multiply"></div>
      </div>

      {/* Sidebar Mobile avec animation */}
      <aside
        className={`patient-sidebar-container md:hidden fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] h-full transform ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        } transition-transform duration-300 ease-in-out`}
      >
        <Sidebar
          handleLogout={handleLogout}
          setIsSidebarOpen={setIsSidebarOpen}
          isCollapsed={isCollapsed}
          toggleCollapse={toggleCollapse}
        />
      </aside>

      {/* Sidebar Desktop toujours visible */}
      <aside className="patient-sidebar-container hidden md:flex flex-col relative z-20">
        <Sidebar
          handleLogout={handleLogout}
          setIsSidebarOpen={setIsSidebarOpen}
          isCollapsed={isCollapsed}
          toggleCollapse={toggleCollapse}
        />
      </aside>

      {/* Overlay pour mobile */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 md:hidden transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
          onTouchStart={() => setIsSidebarOpen(false)}
        />
      )}

      <div className="flex flex-col flex-1 relative z-10 min-w-0 overflow-hidden">
        {/* Top Navbar ultra-responsive */}
        <header
          className={`
          sticky top-0 z-30 flex items-center justify-between h-16 sm:h-20 px-3 sm:px-6 md:px-8 
          transition-all duration-300 ${
            isScrolled
              ? "bg-[#54b5e0]/95 backdrop-blur-md shadow-md"
              : "bg-[#06b6d4]"
          }
          border-b border-white/20
        `}
        >
          {/* Section gauche */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            {/* Bouton menu mobile */}
            <button
              type="button"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="md:hidden p-2 rounded-xl text-white hover:bg-white/15 active:scale-95 transition-all focus:outline-none cursor-pointer"
              aria-label="Ouvrir le menu mobile"
            >
              <FaBars className="text-xl" />
            </button>

            {/* Bouton basculer réduire/agrandir sidebar Desktop dans la navbar du haut */}
            <button
              type="button"
              onClick={toggleCollapse}
              className="hidden md:flex items-center justify-center p-2 rounded-xl text-white hover:bg-white/15 active:scale-95 transition-all focus:outline-none cursor-pointer"
              title={isCollapsed ? "Agrandir le menu" : "Réduire le menu"}
              aria-label="Basculer la barre latérale"
            >
              <FaBars className="text-xl" />
            </button>

            {/* Logo/Brand */}
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 rounded-xl bg-white flex items-center justify-center shadow-sm flex-shrink-0">
                <span className="text-[#06b6d4] font-extrabold text-base">T</span>
              </div>
              <h1 className="text-base sm:text-lg md:text-xl font-bold text-white truncate max-w-[130px] xs:max-w-[190px] sm:max-w-none">
                Tableau de bord
              </h1>
            </div>
          </div>

          {/* Section droite (Profil + Dropdown) */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            <div
              className="flex items-center space-x-2 sm:space-x-3 pl-2 sm:pl-4 border-l border-white/20 relative"
              ref={profileMenuRef}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
            >
              <div className="hidden sm:flex flex-col items-end">
                <span className="text-xs sm:text-sm font-bold text-white truncate max-w-[120px] md:max-w-[180px]">
                  {patientData?.user?.name || "Utilisateur"}{" "}
                  {patientData?.user?.prenom || "Prénom"}
                </span>
                <span className="text-[10px] sm:text-xs text-cyan-100 font-medium">Patient</span>
              </div>

              <div className="relative">
                <button
                  type="button"
                  onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                  className="flex items-center focus:outline-none p-1 rounded-full hover:ring-2 hover:ring-white/40 transition-all cursor-pointer"
                  aria-label="Menu profil"
                >
                  {getProfilePhotoUrl() ? (
                    <img
                      src={getProfilePhotoUrl()}
                      alt="Photo de profil"
                      className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover border-2 border-white shadow-md hover:border-cyan-200 transition-all cursor-pointer"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.style.display = "none";
                        if (e.target.nextElementSibling) {
                          e.target.nextElementSibling.style.display = "block";
                        }
                      }}
                    />
                  ) : null}
                  <FaUserCircle
                    className="text-2xl sm:text-3xl text-white hover:text-cyan-100 cursor-pointer transition-colors"
                    style={{ display: getProfilePhotoUrl() ? "none" : "block" }}
                  />
                </button>

                {/* Menu déroulant réactif */}
                {profileMenuOpen && (
                  <div
                    className="absolute right-0 mt-2 w-60 sm:w-64 max-w-[calc(100vw-24px)] bg-white rounded-2xl shadow-2xl border border-gray-100 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200"
                    onMouseEnter={handleMouseEnter}
                    onMouseLeave={handleMouseLeave}
                  >
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="text-sm font-bold text-gray-800 truncate">
                        {patientData?.user?.name || "Nom"}{" "}
                        {patientData?.user?.prenom || "Prénom"}
                      </p>
                      <p className="text-xs text-gray-500 truncate mt-0.5">
                        {patientData?.user?.email || "email@example.com"}
                      </p>
                      <p className="text-[11px] text-cyan-600 font-semibold mt-1.5 bg-cyan-50 inline-block px-2.5 py-0.5 rounded-full border border-cyan-100">
                        Code: {patientData?.code_patient || "N/A"}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        router.push("/dashboard/update");
                        setProfileMenuOpen(false);
                      }}
                      className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-cyan-50 hover:text-[#06b6d4] flex items-center transition-colors font-medium cursor-pointer"
                    >
                      <FaUserCircle className="mr-3 text-[#06b6d4] text-base" />
                      Mon profil
                    </button>

                    <div className="border-t border-gray-100 my-1"></div>

                    <button
                      type="button"
                      onClick={handleLogout}
                      disabled={isLoggingOut}
                      className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 flex items-center transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    >
                      <FaSignOutAlt className="mr-3 text-base" />
                      {isLoggingOut ? "Déconnexion..." : "Déconnexion"}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Fil d'ariane (Breadcrumb) */}
        <div className="px-4 sm:px-6 md:px-8 py-2.5 bg-white/60 backdrop-blur-xs border-b border-gray-100 overflow-x-auto whitespace-nowrap scrollbar-none">
          <nav className="flex" aria-label="Breadcrumb">
            <ol className="flex items-center space-x-2 text-xs sm:text-sm">
              <li>
                <button
                  type="button"
                  onClick={() => router.push("/dashboard")}
                  className="text-gray-500 hover:text-[#06b6d4] font-medium transition-colors cursor-pointer"
                >
                  Dashboard
                </button>
              </li>
              <li className="text-gray-400">/</li>
              <li className="text-[#06b6d4] font-semibold">Tableau de bord</li>
            </ol>
          </nav>
        </div>

        {/* Contenu principal */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto py-4 sm:py-6 md:py-8 min-h-0">
          <div className="w-[96%] mx-auto">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6 md:p-8">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

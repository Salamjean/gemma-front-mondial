"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import {
  FaStethoscope,
  FaUserMd,
  FaCalendar,
  FaClock,
  FaFileMedical,
  FaSearch,
  FaFilter,
  FaDownload,
  FaChevronRight,
  FaVideo,
} from "react-icons/fa";

import SelectServiceModal from "@/components/SelectServiceModal";

const PRIMARY_BLUE = "#06b6d4";
const ACCENT_GREEN = "#2da442";
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

export default function ConsultationsPage() {
  const [consultations, setConsultations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [requestingCall, setRequestingCall] = useState(false);
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);

  const handleStartOnlineConsultation = () => {
    const token = localStorage.getItem("patient_token");
    if (!token) return;
    setIsServiceModalOpen(true);
  };

  const handleConfirmService = async (serviceId, paymentDetails = {}, apiResponseData = null) => {
    const token = localStorage.getItem("patient_token");
    if (!token) return;

    if (apiResponseData && apiResponseData.status === "success") {
      setIsServiceModalOpen(false);
      window.dispatchEvent(
        new CustomEvent("startOnlineConsultationCall", { detail: apiResponseData })
      );
      return;
    }

    try {
      setRequestingCall(true);
      const response = await fetch(`${API_URL}/v1/patient/online-consultation/request`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          prestation_hospital_id: serviceId,
          amount: paymentDetails?.amount || 100,
          payment_method: paymentDetails?.payment_method || "wave",
          phone: paymentDetails?.phone || "",
        }),
      });

      const data = await response.json();
      if (data.status === "success") {
        setIsServiceModalOpen(false);
        window.dispatchEvent(
          new CustomEvent("startOnlineConsultationCall", { detail: data })
        );
      } else {
        alert(data.message || "Erreur lors de la demande de consultation.");
      }
    } catch (err) {
      console.error("Erreur demande consultation en ligne:", err);
      alert("Impossible de contacter le serveur.");
    } finally {
      setRequestingCall(false);
    }
  };

  useEffect(() => {
    fetchConsultations();
  }, []);

  const fetchConsultations = async () => {
    const token = localStorage.getItem("patient_token");

    if (!token) {
      setError("Veuillez vous connecter");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/v1/patient/consultations`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Erreur lors de la récupération des consultations");
      }

      const data = await response.json();
      console.log("Consultations data:", data.consultations);
      setConsultations(data.consultations || []);
    } catch (err) {
      console.error("Erreur:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredConsultations = consultations.filter((consult) => {
    const doctorName = consult.doctor?.user
      ? `${consult.doctor.user.name} ${consult.doctor.user.prenom || ""}`
      : consult.doctor_name || "";

    const searchLower = searchTerm.toLowerCase();
    const motifMatch = consult.motif?.toLowerCase().includes(searchLower);
    const doctorMatch = doctorName.toLowerCase().includes(searchLower);
    const typeMatch = consult.type_consultation
      ?.toLowerCase()
      .includes(searchLower);

    const matchesSearch = motifMatch || doctorMatch || typeMatch;

    if (filter === "all") return matchesSearch;
    if (filter === "recent") {
      const consultDate = new Date(consult.date);
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
      return matchesSearch && consultDate >= oneMonthAgo;
    }
    if (filter === "upcoming") {
      const consultDate = new Date(consult.date);
      const today = new Date();
      return matchesSearch && consultDate >= today;
    }
    return matchesSearch;
  });

  const formatDate = (dateString) => {
    if (!dateString) return "Date non spécifiée";
    const date = new Date(dateString);
    return date.toLocaleDateString("fr-FR", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <DashboardLayout>
      <div className="p-4 md:p-6">
        {/* En-tête */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center">
                <FaStethoscope
                  className="mr-3"
                  style={{ color: PRIMARY_BLUE }}
                />
                Mes Consultations
              </h1>
              <p className="text-gray-600 mt-1">
                Historique complet de vos consultations médicales
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-500 hidden md:inline">
                {consultations.length} consultation(s)
              </span>
              <button
                onClick={handleStartOnlineConsultation}
                disabled={requestingCall}
                className="px-4 py-2.5 bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white rounded-xl font-bold shadow-md transition-all flex items-center gap-2 text-sm cursor-pointer disabled:opacity-50"
              >
                <FaVideo className="text-white text-base" />
                <span>{requestingCall ? "Lancement..." : "Demander une consultation en ligne"}</span>
              </button>
            </div>
          </div>

          {/* Filtres et recherche */}
          <div className="bg-white rounded-xl p-4 border border-gray-100 mb-6">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Barre de recherche */}
              <div className="flex-1">
                <div className="relative">
                  <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Rechercher par motif ou médecin..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Filtres */}
              <div className="flex gap-2">
                <button
                  onClick={() => setFilter("all")}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                    filter === "all"
                      ? "bg-blue-100 text-blue-700"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  Toutes
                </button>
                <button
                  onClick={() => setFilter("recent")}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                    filter === "recent"
                      ? "bg-green-100 text-green-700"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  Dernier mois
                </button>
                <button
                  onClick={() => setFilter("upcoming")}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                    filter === "upcoming"
                      ? "bg-blue-100 text-blue-700"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  À venir
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Contenu */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
              <p className="mt-2 text-gray-600">
                Chargement des consultations...
              </p>
            </div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
            <p className="text-red-700">{error}</p>
            <button
              onClick={fetchConsultations}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
            >
              Réessayer
            </button>
          </div>
        ) : filteredConsultations.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
            <FaFileMedical className="mx-auto text-4xl text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm
                ? "Aucune consultation trouvée"
                : "Aucune consultation enregistrée"}
            </h3>
            <p className="text-gray-600">
              {searchTerm
                ? "Essayez avec d'autres termes de recherche"
                : "Vos consultations apparaîtront ici une fois programmées"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredConsultations.map((consult) => (
              <ConsultationCard key={consult.id} consultation={consult} />
            ))}
          </div>
        )}
      </div>

      <SelectServiceModal
        isOpen={isServiceModalOpen}
        onClose={() => setIsServiceModalOpen(false)}
        onConfirm={handleConfirmService}
        loading={requestingCall}
      />
    </DashboardLayout>
  );
}

const ConsultationCard = ({ consultation }) => {
  const doctorName = consultation.doctor?.user
    ? `Dr. ${consultation.doctor.user.name} ${
        consultation.doctor.user.prenom || ""
      }`
    : consultation.doctor_name || "Médecin non spécifié";

  return (
    <div className="bg-white rounded-xl border border-gray-200 hover:shadow-lg transition-shadow p-6">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {consultation.motif || "Consultation générale"}
          </h3>
          <div className="flex items-center text-sm text-gray-600 mb-1">
            <FaUserMd className="mr-2" />
            <span>{doctorName}</span>
          </div>
          <div className="flex items-center text-sm text-gray-600">
            <FaCalendar className="mr-2" />
            <span>
              {new Date(
                consultation.created_at || consultation.date
              ).toLocaleDateString("fr-FR", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
              })}
            </span>
          </div>
        </div>
        <div
          className={`px-3 py-1 rounded-full text-xs font-medium ${
            consultation.status == 1
              ? "bg-green-100 text-green-800"
              : "bg-blue-100 text-blue-800"
          }`}
        >
          {consultation.status == 1 ? "Terminé" : "En cours"}
        </div>
      </div>

      <div className="border-t border-gray-100 pt-4">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-xs text-gray-500 mb-1">Heure</p>
            <p className="text-sm font-medium text-gray-900">
              {consultation.created_at
                ? new Date(consultation.created_at).toLocaleTimeString(
                    "fr-FR",
                    { hour: "2-digit", minute: "2-digit" }
                  )
                : "Non spécifiée"}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Type</p>
            <p className="text-sm font-medium text-gray-900">
              {consultation.type_consultation || "Consultation"}
            </p>
          </div>
        </div>

        {consultation.observation && (
          <div className="mb-4">
            <p className="text-xs text-gray-500 mb-1">Observations</p>
            <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3">
              {consultation.observation}
            </p>
          </div>
        )}

        <div className="flex justify-between items-center">
          <div className="flex items-center text-sm text-gray-600">
            <FaClock className="mr-1" />
            <span>
              Créée le{" "}
              {new Date(consultation.created_at).toLocaleDateString("fr-FR")}
            </span>
          </div>
          <button className="flex items-center text-sm font-medium text-blue-600 hover:text-blue-800">
            Voir détails
            <FaChevronRight className="ml-1" />
          </button>
        </div>
      </div>
    </div>
  );
};

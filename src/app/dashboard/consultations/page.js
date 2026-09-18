"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
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
  FaChevronDown,
  FaChevronUp,
  FaVideo,
  FaHospital,
  FaHeartbeat,
  FaThermometerHalf,
  FaWeight,
  FaPills,
  FaNotesMedical,
  FaFilePdf,
  FaTimes,
  FaRoute,
  FaCheckCircle,
  FaUserNurse,
  FaMicroscope,
  FaFileContract,
  FaReceipt,
} from "react-icons/fa";

const PRIMARY_BLUE = "#06b6d4";
const ACCENT_GREEN = "#2da442";
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
const BASE_URL = API_URL.replace(/\/api$/, "");

export default function ConsultationsPage() {
  const [consultations, setConsultations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedParcours, setSelectedParcours] = useState(null);

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

    const hospitalName = consult.hospital?.label || consult.hospital?.user?.name || "";
    const motifStr = consult.motif_consultation || consult.motif || "";

    const searchLower = searchTerm.toLowerCase();
    const motifMatch = motifStr.toLowerCase().includes(searchLower);
    const doctorMatch = doctorName.toLowerCase().includes(searchLower);
    const hospitalMatch = hospitalName.toLowerCase().includes(searchLower);

    const matchesSearch = motifMatch || doctorMatch || hospitalMatch;

    if (filter === "all") return matchesSearch;
    if (filter === "recent") {
      const consultDate = new Date(consult.created_at || consult.date);
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
      return matchesSearch && consultDate >= oneMonthAgo;
    }
    if (filter === "upcoming") {
      const consultDate = new Date(consult.created_at || consult.date);
      const today = new Date();
      return matchesSearch && consultDate >= today;
    }
    return matchesSearch;
  });

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
                Mes Consultations & Dossier Médical
              </h1>
              <p className="text-gray-600 mt-1">
                Historique complet de vos rendez-vous, constatations, constantes et ordonnances
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold text-gray-500 bg-gray-100 px-3.5 py-1.5 rounded-full border border-gray-200">
                {consultations.length} consultation(s) enregistrée(s)
              </span>
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
                    placeholder="Rechercher par motif, hôpital ou médecin..."
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
                      ? "bg-blue-100 text-blue-700 font-semibold"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  Toutes
                </button>
                <button
                  onClick={() => setFilter("recent")}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                    filter === "recent"
                      ? "bg-green-100 text-green-700 font-semibold"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  Dernier mois
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Contenu */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-cyan-500 border-r-transparent"></div>
              <p className="mt-2 text-gray-600">
                Chargement de vos consultations...
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
            <p className="text-gray-600 mb-4">
              {searchTerm
                ? "Essayez avec d'autres termes de recherche"
                : "Vos consultations médicales s'afficheront ici."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {filteredConsultations.map((consult) => (
              <ConsultationCard
                key={consult.id}
                consultation={consult}
                onOpenParcours={() => setSelectedParcours(consult)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modal Parcours de Soins */}
      {selectedParcours && (
        <ParcoursModal
          consultation={selectedParcours}
          onClose={() => setSelectedParcours(null)}
        />
      )}
    </DashboardLayout>
  );
}

const ConsultationCard = ({ consultation, onOpenParcours }) => {
  const [showDetails, setShowDetails] = useState(false);

  const hospitalLabel =
    consultation.hospital?.label ||
    consultation.hospital?.user?.name ||
    consultation.hospital_name ||
    "Hôpital Général";

  const doctorName = consultation.doctor?.user
    ? `Dr. ${consultation.doctor.user.name} ${consultation.doctor.user.prenom || ""}`
    : consultation.doctor_name || "Médecin traitant";

  const serviceName =
    consultation.prestation_hospital?.prestation_service?.libelle ||
    consultation.prestation_hospital?.service_hospital?.service?.libelle ||
    consultation.type_consultation ||
    "Consultation médicale";

  const regCur = consultation.registre?.registre_consultation_curative;

  const valTA = consultation.tension_arterielle || regCur?.ta || "N/A";
  const valTemp = consultation.temperature || regCur?.temperature || "N/A";
  const valPoids = consultation.poids || regCur?.poids || "N/A";
  const valTaille = consultation.taille || regCur?.taille || "N/A";
  const valImc = consultation.imc || regCur?.imc || "N/A";
  const valPouls = consultation.pouls || regCur?.pouls || "N/A";
  const valSat = consultation.saturation_oxygene || regCur?.saturation_oxygene || "N/A";
  const valGlyA = consultation.gly_a_jeun || regCur?.glycemie_a_jeun || "N/A";

  const motifStr =
    consultation.motif_consultation ||
    consultation.admission?.motif_consultation ||
    consultation.motif ||
    "Consultation générale";

  const diagStr =
    regCur?.diagnostic_retenu ||
    consultation.hospitalisation?.diagnostic ||
    null;

  const dateFormatted = new Date(
    consultation.created_at || consultation.date
  ).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const ordonnanceId = consultation.ordonnance?.id || consultation.ordonnances?.[0]?.id;
  const examenId = consultation.examen?.id;
  const arretId = consultation.arret?.id;

  const prescriptionsList = [];
  if (consultation.ordonnances && consultation.ordonnances.length > 0) {
    consultation.ordonnances.forEach((ord) => {
      if (ord.prescriptions) {
        ord.prescriptions.forEach((p) => prescriptionsList.push(p));
      }
    });
  } else if (consultation.ordonnance?.prescriptions) {
    consultation.ordonnance.prescriptions.forEach((p) => prescriptionsList.push(p));
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
      {/* En-tête de la carte */}
      <div className="p-5 md:p-6 bg-gradient-to-r from-slate-50 to-cyan-50/30 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="bg-cyan-600 text-white font-bold text-xs px-3 py-1 rounded-full shadow-2xs">
              {dateFormatted}
            </span>
            <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-1 rounded-full border border-emerald-200 flex items-center gap-1">
              <FaHospital className="text-emerald-600" />
              {hospitalLabel}
            </span>
            {consultation.call_channel && (
              <span className="bg-teal-100 text-teal-800 text-xs font-semibold px-2.5 py-1 rounded-full border border-teal-200 flex items-center gap-1">
                <FaVideo /> Téléconsultation
              </span>
            )}
          </div>

          <h3 className="text-lg font-bold text-gray-900 mt-2">
            Service : {serviceName}
          </h3>

          <div className="flex items-center text-sm text-gray-600 gap-1">
            <FaUserMd className="text-cyan-600" />
            <span>{doctorName}</span>
          </div>
        </div>

        {/* Boutons principaux : Détails et Parcours */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-sm font-bold shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <span>{showDetails ? "Masquer détails" : "Détails"}</span>
            {showDetails ? <FaChevronUp /> : <FaChevronDown />}
          </button>

          <Link
            href={`/dashboard/parcours/${consultation.id}`}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <FaRoute />
            <span>Parcours</span>
          </Link>
        </div>
      </div>

      {/* Corps synthétique */}
      <div className="p-5 md:p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">
              Motif de consultation
            </span>
            <p className="text-sm font-medium text-gray-800 bg-gray-50 p-3 rounded-xl border border-gray-100">
              {motifStr}
            </p>
          </div>

          {diagStr && (
            <div>
              <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider block mb-1">
                Diagnostic retenu
              </span>
              <p className="text-sm font-bold text-emerald-800 bg-emerald-50 p-3 rounded-xl border border-emerald-100 flex items-center gap-2">
                <FaCheckCircle className="text-emerald-600 flex-shrink-0" />
                <span>{diagStr}</span>
              </p>
            </div>
          )}
        </div>

        {/* Bulletins et Documents PDF */}
        <div className="pt-2 border-t border-gray-100">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-2">
            Documents téléchargeables (PDF)
          </span>
          <div className="flex flex-wrap gap-2">
            {ordonnanceId && (
              <a
                href={`${BASE_URL}/impression/ordonnance/${ordonnanceId}`}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-semibold rounded-lg border border-red-200 flex items-center gap-1.5 transition"
              >
                <FaFilePdf className="text-red-500" />
                Ordonnance Médicale
              </a>
            )}
            {examenId && (
              <a
                href={`${BASE_URL}/impression/examen/${examenId}`}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-lg border border-emerald-200 flex items-center gap-1.5 transition"
              >
                <FaFilePdf className="text-emerald-500" />
                Bulletin d'examen
              </a>
            )}
            {arretId && (
              <a
                href={`${BASE_URL}/impression/arret/${arretId}`}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 text-xs font-semibold rounded-lg border border-amber-200 flex items-center gap-1.5 transition"
              >
                <FaFilePdf className="text-amber-500" />
                Arrêt de travail
              </a>
            )}
            {!ordonnanceId && !examenId && !arretId && (
              <span className="text-xs text-gray-400 italic">
                Aucun document téléchargeable disponible.
              </span>
            )}
          </div>
        </div>

        {/* VOLET EXPANSIBLE DÉTAILS COMPLETS */}
        {showDetails && (
          <div className="mt-4 pt-4 border-t border-gray-200 space-y-5 bg-slate-50 p-5 rounded-2xl">
            {/* 1. Constantes Physiques */}
            <div>
              <h4 className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                <FaHeartbeat className="text-red-500" />
                Prises de Constantes Physiques
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="bg-white p-3 rounded-xl border border-gray-200 text-center shadow-2xs">
                  <span className="text-xs text-gray-500 block">Tension</span>
                  <span className="text-sm font-bold text-gray-900">
                    {valTA} {valTA !== "N/A" ? "mmHg" : ""}
                  </span>
                </div>
                <div className="bg-white p-3 rounded-xl border border-gray-200 text-center shadow-2xs">
                  <span className="text-xs text-gray-500 block">Température</span>
                  <span className="text-sm font-bold text-gray-900">
                    {valTemp} {valTemp !== "N/A" ? "°C" : ""}
                  </span>
                </div>
                <div className="bg-white p-3 rounded-xl border border-gray-200 text-center shadow-2xs">
                  <span className="text-xs text-gray-500 block">Poids</span>
                  <span className="text-sm font-bold text-gray-900">
                    {valPoids} {valPoids !== "N/A" ? "kg" : ""}
                  </span>
                </div>
                <div className="bg-white p-3 rounded-xl border border-gray-200 text-center shadow-2xs">
                  <span className="text-xs text-gray-500 block">Pouls</span>
                  <span className="text-sm font-bold text-gray-900">
                    {valPouls} {valPouls !== "N/A" ? "bpm" : ""}
                  </span>
                </div>
                <div className="bg-white p-3 rounded-xl border border-gray-200 text-center shadow-2xs">
                  <span className="text-xs text-gray-500 block">Saturation O₂</span>
                  <span className="text-sm font-bold text-gray-900">
                    {valSat} {valSat !== "N/A" ? "%" : ""}
                  </span>
                </div>
                <div className="bg-white p-3 rounded-xl border border-gray-200 text-center shadow-2xs">
                  <span className="text-xs text-gray-500 block">Glycémie</span>
                  <span className="text-sm font-bold text-gray-900">
                    {valGlyA} {valGlyA !== "N/A" ? "g/l" : ""}
                  </span>
                </div>
                <div className="bg-white p-3 rounded-xl border border-gray-200 text-center shadow-2xs">
                  <span className="text-xs text-gray-500 block">Taille</span>
                  <span className="text-sm font-bold text-gray-900">
                    {valTaille} {valTaille !== "N/A" ? "cm" : ""}
                  </span>
                </div>
                <div className="bg-white p-3 rounded-xl border border-gray-200 text-center shadow-2xs">
                  <span className="text-xs text-gray-500 block">IMC</span>
                  <span className="text-sm font-bold text-gray-900">
                    {valImc} {valImc !== "N/A" ? "kg/m²" : ""}
                  </span>
                </div>
              </div>
            </div>

            {/* 2. Traitements prescrits */}
            {prescriptionsList.length > 0 && (
              <div>
                <h4 className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                  <FaPills className="text-cyan-600" />
                  Prescriptions Médicamenteuses
                </h4>
                <div className="bg-white p-3.5 rounded-xl border border-gray-200 space-y-2">
                  {prescriptionsList.map((p, idx) => {
                    const drugName =
                      p.drug?.name || p.drugHospital?.drug?.name || "Médicament";
                    return (
                      <div
                        key={idx}
                        className="text-xs text-gray-800 flex flex-col sm:flex-row sm:items-center justify-between border-b pb-2 last:border-0 last:pb-0 gap-1"
                      >
                        <span className="font-bold text-gray-900">
                          • {drugName}
                        </span>
                        <span className="text-gray-600">
                          Posologie : {p.dosage || "Selon ordonnance"} (Qté: {p.quantity})
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

/* MODAL PARCOURS DE SOIN PATIENT */
const ParcoursModal = ({ consultation, onClose }) => {
  const hospitalLabel =
    consultation.hospital?.label ||
    consultation.hospital?.user?.name ||
    consultation.hospital_name ||
    "Hôpital Général";

  const doctorName = consultation.doctor?.user
    ? `Dr. ${consultation.doctor.user.name} ${consultation.doctor.user.prenom || ""}`
    : consultation.doctor_name || "Médecin non spécifié";

  const infirmierName = consultation.infirmier?.user
    ? `Inf. ${consultation.infirmier.user.name} ${consultation.infirmier.user.prenom || ""}`
    : consultation.admission?.infirmier?.user
    ? `Inf. ${consultation.admission.infirmier.user.name}`
    : "Infirmier non renseigné";

  const serviceName =
    consultation.prestation_hospital?.prestation_service?.libelle ||
    consultation.type_consultation ||
    "Consultation générale";

  const regCur = consultation.registre?.registre_consultation_curative;
  const valTA = consultation.tension_arterielle || regCur?.ta || "N/A";
  const valTemp = consultation.temperature || regCur?.temperature || "N/A";
  const valPoids = consultation.poids || regCur?.poids || "N/A";
  const valPouls = consultation.pouls || regCur?.pouls || "N/A";

  const motifStr =
    consultation.motif_consultation ||
    consultation.admission?.motif_consultation ||
    consultation.motif ||
    "Consultation générale";

  const diagStr =
    regCur?.diagnostic_retenu ||
    consultation.hospitalisation?.diagnostic ||
    "Aucun diagnostic renseigné";

  const dateStr = new Date(
    consultation.created_at || consultation.date
  ).toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-3xl w-full shadow-2xl overflow-hidden border border-gray-100 my-8">
        {/* En-tête Modal */}
        <div className="p-6 bg-gradient-to-r from-cyan-600 to-teal-600 text-white flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-cyan-100 block mb-1">
              Parcours de Soins Complet
            </span>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <FaHospital className="text-cyan-200" />
              {hospitalLabel}
            </h2>
            <p className="text-xs text-cyan-100 mt-0.5">{dateStr}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-full transition cursor-pointer"
          >
            <FaTimes className="text-lg" />
          </button>
        </div>

        {/* Timeline des étapes */}
        <div className="p-6 md:p-8 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Étape 1 : Enregistrement */}
          <div className="flex gap-4">
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 rounded-full bg-cyan-100 text-cyan-700 flex items-center justify-center font-bold shadow-xs">
                1
              </div>
              <div className="w-0.5 h-full bg-gray-200 my-1"></div>
            </div>
            <div className="flex-1 bg-slate-50 p-4 rounded-2xl border border-gray-100">
              <h4 className="font-bold text-gray-900 text-sm mb-1 flex items-center gap-1.5">
                <FaReceipt className="text-cyan-600" /> 1. Accueil & Service
              </h4>
              <p className="text-xs text-gray-600">
                Prise en charge au service : <b className="text-gray-800">{serviceName}</b>
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Motif initial : {motifStr}
              </p>
            </div>
          </div>

          {/* Étape 2 : Prise de constantes */}
          <div className="flex gap-4">
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold shadow-xs">
                2
              </div>
              <div className="w-0.5 h-full bg-gray-200 my-1"></div>
            </div>
            <div className="flex-1 bg-slate-50 p-4 rounded-2xl border border-gray-100">
              <h4 className="font-bold text-gray-900 text-sm mb-1 flex items-center gap-1.5">
                <FaUserNurse className="text-emerald-600" /> 2. Soins Infirmiers & Constantes
              </h4>
              <p className="text-xs text-gray-600 mb-2">
                Infirmier(ère) : <b className="text-gray-800">{infirmierName}</b>
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                <div className="bg-white p-2 rounded-lg border">TA: <b>{valTA}</b></div>
                <div className="bg-white p-2 rounded-lg border">Temp: <b>{valTemp}</b></div>
                <div className="bg-white p-2 rounded-lg border">Poids: <b>{valPoids}</b></div>
                <div className="bg-white p-2 rounded-lg border">Pouls: <b>{valPouls}</b></div>
              </div>
            </div>
          </div>

          {/* Étape 3 : Consultation Médicale */}
          <div className="flex gap-4">
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold shadow-xs">
                3
              </div>
            </div>
            <div className="flex-1 bg-slate-50 p-4 rounded-2xl border border-gray-100">
              <h4 className="font-bold text-gray-900 text-sm mb-1 flex items-center gap-1.5">
                <FaUserMd className="text-blue-600" /> 3. Bilan Médical & Diagnostic
              </h4>
              <p className="text-xs text-gray-600 mb-1">
                Médecin traitant : <b className="text-gray-800">{doctorName}</b>
              </p>
              <div className="bg-white p-3 rounded-xl border text-xs text-gray-800 space-y-1 mt-2">
                <div><b>Diagnostic retenu :</b> <span className="text-emerald-700 font-bold">{diagStr}</span></div>
              </div>
            </div>
          </div>
        </div>

        {/* Pied de Modal */}
        <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-800 hover:bg-gray-900 text-white rounded-xl text-sm font-bold shadow-sm transition cursor-pointer"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};

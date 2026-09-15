// src/app/dashboard/page.js
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/DashboardLayout";
import Link from "next/link";
import {
  FaCalendarCheck,
  FaStethoscope,
  FaUserEdit,
  FaFileMedical,
  FaPrescription,
  FaChartLine,
  FaHistory,
  FaNotesMedical,
  FaClipboardCheck,
  FaBell,
  FaUserMd,
  FaHospital,
  FaClock,
  FaPhoneAlt,
  FaEnvelope,
  FaIdCard,
  FaVideo,
  FaShieldAlt,
  FaArrowRight,
  FaPlus,
  FaHeartbeat,
  FaAddressCard,
  FaCheckCircle,
  FaHeadset,
  FaUserCheck,
} from "react-icons/fa";

import SelectServiceModal from "@/components/SelectServiceModal";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

export default function DashboardPage() {
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    consultations: 0,
    rendezVous: 0,
    callsCount: 0,
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [requestingCall, setRequestingCall] = useState(false);
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const router = useRouter();

  const handleStartOnlineConsultation = () => {
    const token = localStorage.getItem("patient_token");
    if (!token) {
      router.push("/login");
      return;
    }
    setIsServiceModalOpen(true);
  };

  const handleConfirmService = async (serviceId, paymentDetails = {}, apiResponseData = null) => {
    const token = localStorage.getItem("patient_token");
    if (!token) {
      router.push("/login");
      return;
    }

    if (apiResponseData && apiResponseData.status === "success") {
      fetchStats(token);
      fetchRecentActivity(token);
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
          hospital_id: paymentDetails?.hospital_id,
          desired_date: paymentDetails?.desired_date,
          desired_time: paymentDetails?.desired_time,
          amount: paymentDetails?.amount || 1000,
          payment_method: paymentDetails?.payment_method || "wave",
          phone: paymentDetails?.phone || "",
        }),
      });

      const data = await response.json();
      if (data.status === "success") {
        fetchStats(token);
        fetchRecentActivity(token);
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
    const token = localStorage.getItem("patient_token");
    const patientData = localStorage.getItem("patient_data");

    if (!token || !patientData) {
      router.replace("/login");
      return;
    }

    try {
      const parsedData = JSON.parse(patientData);
      setPatient(parsedData);
      fetchStats(token);
      fetchRecentActivity(token);
    } catch (e) {
      console.error("Erreur de parsing des données patient", e);
    } finally {
      setLoading(false);
    }

    const validateToken = async () => {
      try {
        const response = await fetch(`${API_URL}/v1/patient/show`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        });

        if (!response.ok) {
          throw new Error("Token invalide");
        }

        const data = await response.json();
        if (data.patient) {
          setPatient(data.patient);
          localStorage.setItem("patient_data", JSON.stringify(data.patient));
        }
      } catch (error) {
        console.error("Erreur de validation du token:", error);
      }
    };

    validateToken();
  }, [router]);

  const fetchStats = async (token) => {
    try {
      const [consultsRes, rdvRes, callsRes] = await Promise.all([
        fetch(`${API_URL}/v1/patient/consultations`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }),
        fetch(`${API_URL}/v1/patient/rdv`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }),
        fetch(`${API_URL}/v1/patient/calls/history`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }),
      ]);

      let consultsCount = 0;
      let rdvsCount = 0;
      let callsCount = 0;

      if (consultsRes.ok) {
        const cData = await consultsRes.json();
        consultsCount = cData.consultations?.length || 0;
      }

      if (rdvRes.ok) {
        const rData = await rdvRes.json();
        const list = rData.rdv || [];
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const upcomingCount = list.filter((rdv) => {
          if (rdv.status === "cancelled" || rdv.status === "complete") {
            return false;
          }
          if (rdv.status === "pending" || rdv.status === "en_attente") {
            return true;
          }
          if (!rdv.date) return false;
          const rDate = new Date(rdv.date);
          rDate.setHours(0, 0, 0, 0);
          return rDate >= today;
        }).length;

        rdvsCount = upcomingCount;
      }

      if (callsRes.ok) {
        const clData = await callsRes.json();
        callsCount = clData.calls?.length || 0;
      }

      setStats({
        consultations: consultsCount,
        rendezVous: rdvsCount,
        callsCount: callsCount,
      });
    } catch (error) {
      console.error("Erreur lors de la récupération des statistiques:", error);
    }
  };

  const fetchRecentActivity = async (token) => {
    try {
      const [consultsRes, rdvRes, callsRes] = await Promise.all([
        fetch(`${API_URL}/v1/patient/consultations`, {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_URL}/v1/patient/rdv`, {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_URL}/v1/patient/calls/history`, {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      let items = [];

      if (consultsRes.ok) {
        const cData = await consultsRes.json();
        (cData.consultations || []).forEach((c) => {
          items.push({
            id: `c_${c.id}`,
            type: "consultation",
            title: "Téléconsultation médicale",
            detail: c.motif_consultation || c.motif || "Consultation médicale",
            date: c.created_at ? new Date(c.created_at).toLocaleDateString("fr-FR") : "Récente",
            rawDate: c.created_at ? new Date(c.created_at) : new Date(0),
            status: "Terminé",
            statusColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
          });
        });
      }

      if (rdvRes.ok) {
        const rData = await rdvRes.json();
        (rData.rdv || []).forEach((r) => {
          items.push({
            id: `r_${r.id}`,
            type: "rdv",
            title: "Prise de rendez-vous",
            detail: r.motif || r.title || "Rendez-vous médical",
            date: r.date ? new Date(r.date).toLocaleDateString("fr-FR") : "Programmé",
            rawDate: r.date ? new Date(r.date) : new Date(0),
            status: r.status || "Programmé",
            statusColor: "bg-blue-50 text-blue-700 border-blue-200",
          });
        });
      }

      if (callsRes.ok) {
        const clData = await callsRes.json();
        (clData.calls || []).forEach((cl) => {
          items.push({
            id: `cl_${cl.id}`,
            type: "call",
            title: "Appel vidéo",
            detail: cl.doctor_name || "Médecin",
            date: cl.created_at ? new Date(cl.created_at).toLocaleDateString("fr-FR") : "Récent",
            rawDate: cl.created_at ? new Date(cl.created_at) : new Date(0),
            status: cl.call_status === "ended" || cl.call_status === "accepted" ? "Effectué" : "Appel",
            statusColor: "bg-cyan-50 text-cyan-700 border-cyan-200",
          });
        });
      }

      items.sort((a, b) => b.rawDate - a.rawDate);
      setRecentActivity(items.slice(0, 6));
    } catch (e) {
      console.error("Erreur récupération activités:", e);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-center p-8 bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-sm">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="absolute inset-0 rounded-full border-4 border-teal-200 animate-ping opacity-25"></div>
            <div className="w-16 h-16 rounded-full border-4 border-teal-600 border-t-transparent animate-spin"></div>
          </div>
          <h3 className="text-lg font-bold text-slate-800">Espace Patient GEMMA</h3>
          <p className="mt-2 text-xs text-slate-500 font-medium">
            Chargement sécurisé de vos données de santé...
          </p>
        </div>
      </div>
    );
  }

  if (!patient) return null;

  const patientName = `${patient.user?.prenom || ""} ${patient.user?.name || ""}`.trim() || "Patient";

  return (
    <DashboardLayout>
      <div className="space-y-8 pb-12">
        {/* HERO BANNER GLASSMORPHIC (Section d'Accueil & Visioconférence Directe) */}
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-teal-800 via-emerald-800 to-cyan-900 text-white shadow-2xl p-6 md:p-8 border border-teal-700/30">
          {/* Subtle Background Glow Circles */}
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-teal-400/20 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-emerald-400/20 rounded-full blur-3xl pointer-events-none"></div>

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Colonne Gauche: Informations & Salut */}
            <div className="lg:col-span-7 space-y-4">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-semibold text-teal-100 shadow-sm">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400"></span>
                </span>
                <span>Portail Médical Sécurisé • Actif</span>
              </div>

              <div>
                <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight text-white">
                  Bonjour, <span className="text-teal-200">{patientName}</span> 👋
                </h1>
                <p className="text-teal-100/90 text-sm md:text-base mt-2 max-w-xl leading-relaxed">
                  Bienvenue dans votre espace santé. Demandez une téléconsultation auprès de l'hôpital de votre choix ou gérez vos rendez-vous et votre dossier médical en toute simplicité.
                </p>
              </div>

              {/* Badges d'état rapide */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/10 backdrop-blur-sm text-xs font-medium text-white border border-white/15">
                  <FaShieldAlt className="text-teal-300 text-sm" />
                  <span>Dossier N° {patient.code_patient || "N/A"}</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/10 backdrop-blur-sm text-xs font-medium text-white border border-white/15">
                  <FaUserCheck className="text-emerald-300 text-sm" />
                  <span>Compte Vérifié</span>
                </div>
              </div>
            </div>

            {/* Colonne Droite: CARTE ACCÈS DIRECT DEMANDE TÉLÉCONSULTATION */}
            <div className="lg:col-span-5">
              <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20 shadow-xl space-y-4 hover:border-white/30 transition-all">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-lg text-white">
                    <FaVideo className="text-xl animate-pulse" />
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-400/20 text-emerald-200 border border-emerald-400/30 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                    Hôpitaux en Ligne
                  </span>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-white">Demander une Téléconsultation</h3>
                  <p className="text-xs text-teal-100 mt-1 leading-relaxed">
                    Sélectionnez votre hôpital, choisissez la date et l'heure souhaitées et effectuez votre règlement en ligne.
                  </p>
                </div>

                <button
                  onClick={handleStartOnlineConsultation}
                  disabled={requestingCall}
                  className="w-full py-3.5 px-5 bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-400 hover:from-emerald-300 hover:to-teal-200 text-teal-950 rounded-xl font-bold text-sm shadow-lg hover:shadow-emerald-500/25 transition-all duration-200 flex items-center justify-center gap-2.5 cursor-pointer active:scale-98 disabled:opacity-50"
                >
                  <FaVideo className="text-base text-teal-900" />
                  <span>{requestingCall ? "Traitement..." : "Demander une téléconsultation"}</span>
                  <FaArrowRight className="text-xs text-teal-900" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* CARTES STATISTIQUES ET APERÇU SANTÉ (4 Cartes Premium) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Card 1: Consultations */}
          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xl shadow-slate-200/40 hover:shadow-2xl hover:border-teal-200 transition-all duration-300 group">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <FaStethoscope className="text-xl" />
              </div>
              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-teal-50 text-teal-700 border border-teal-100">
                Total
              </span>
            </div>
            <div className="mt-4">
              <div className="text-3xl font-extrabold text-slate-900">{stats.consultations}</div>
              <div className="text-xs font-medium text-slate-500 mt-1">Consultations effectuées</div>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-50 flex items-center justify-between text-xs">
              <Link href="/dashboard/consultations" className="text-teal-600 font-semibold hover:text-teal-700 flex items-center gap-1">
                <span>Voir l'historique</span>
                <FaArrowRight className="text-[10px]" />
              </Link>
            </div>
          </div>

          {/* Card 2: Rendez-vous */}
          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xl shadow-slate-200/40 hover:shadow-2xl hover:border-emerald-200 transition-all duration-300 group">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <FaCalendarCheck className="text-xl" />
              </div>
              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
                À venir
              </span>
            </div>
            <div className="mt-4">
              <div className="text-3xl font-extrabold text-slate-900">{stats.rendezVous}</div>
              <div className="text-xs font-medium text-slate-500 mt-1">Rendez-vous programmés</div>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-50 flex items-center justify-between text-xs">
              <Link href="/dashboard/rdv" className="text-emerald-600 font-semibold hover:text-emerald-700 flex items-center gap-1">
                <span>Gérer les rendez-vous</span>
                <FaArrowRight className="text-[10px]" />
              </Link>
            </div>
          </div>

          {/* Card 3: Appels Vidéo */}
          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xl shadow-slate-200/40 hover:shadow-2xl hover:border-cyan-200 transition-all duration-300 group">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <FaVideo className="text-xl" />
              </div>
              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-cyan-50 text-cyan-700 border border-cyan-100">
                Téléconsultation
              </span>
            </div>
            <div className="mt-4">
              <div className="text-3xl font-extrabold text-slate-900">{stats.callsCount}</div>
              <div className="text-xs font-medium text-slate-500 mt-1">Appels vidéo enregistrés</div>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-50 flex items-center justify-between text-xs">
              <Link href="/dashboard/calls-history" className="text-cyan-600 font-semibold hover:text-cyan-700 flex items-center gap-1">
                <span>Historique des appels</span>
                <FaArrowRight className="text-[10px]" />
              </Link>
            </div>
          </div>

          {/* Card 4: Statut Profil */}
          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xl shadow-slate-200/40 hover:shadow-2xl hover:border-purple-200 transition-all duration-300 group">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <FaIdCard className="text-xl" />
              </div>
              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-100">
                Actif
              </span>
            </div>
            <div className="mt-4">
              <div className="text-lg font-extrabold text-slate-900 truncate">
                {patient.code_patient || "Patient GEMMA"}
              </div>
              <div className="text-xs font-medium text-slate-500 mt-1">N° Identifiant Unique</div>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-50 flex items-center justify-between text-xs">
              <Link href="/dashboard/update" className="text-purple-600 font-semibold hover:text-purple-700 flex items-center gap-1">
                <span>Profil & Paramètres</span>
                <FaArrowRight className="text-[10px]" />
              </Link>
            </div>
          </div>
        </div>

        {/* SECTION: CHRONOLOGIE ACTIVITÉS RÉCENTES (Disposition Horizontale - Sur la même ligne) */}
        <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-100 shadow-xl shadow-slate-200/30">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-100">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-cyan-50 text-cyan-600 flex items-center justify-center font-bold">
                <FaHistory className="text-lg" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">Journal d'Activité Récent</h2>
                <p className="text-xs text-slate-500">Dernières interactions et consultations effectuées</p>
              </div>
            </div>
            <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full border border-slate-200 self-start md:self-auto">
              {recentActivity.length} activité(s)
            </span>
          </div>

          {/* Disposer les éléments sur la même ligne horizontale */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentActivity.length > 0 ? (
              recentActivity.map((act) => (
                <div
                  key={act.id}
                  className="flex items-center justify-between p-4 rounded-2xl border border-slate-100 bg-slate-50/60 hover:bg-white hover:shadow-md transition duration-200"
                >
                  <div className="flex items-center space-x-3.5 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center font-bold text-sm flex-shrink-0">
                      {act.type === "consultation" ? (
                        <FaStethoscope />
                      ) : act.type === "call" ? (
                        <FaVideo />
                      ) : (
                        <FaCalendarCheck />
                      )}
                    </div>
                    <div className="truncate">
                      <h4 className="text-sm font-bold text-slate-900 truncate">{act.title}</h4>
                      <p className="text-xs text-slate-500 truncate">{act.detail} • {act.date}</p>
                    </div>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold border flex-shrink-0 ml-2 ${act.statusColor}`}>
                    {act.status}
                  </span>
                </div>
              ))
            ) : (
              <div className="col-span-full py-8 text-center text-slate-400 text-sm bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                <FaHistory className="mx-auto text-2xl mb-2 text-slate-300" />
                <span>Aucune activité récente enregistrée</span>
              </div>
            )}
          </div>
        </div>
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

// Composant pour les tuiles d'informations
function InfoTile({ icon: Icon, label, value, color }) {
  return (
    <div className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50 flex items-start space-x-3.5 hover:bg-white hover:shadow-md transition">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0 ${color}`}>
        <Icon />
      </div>
      <div className="overflow-hidden">
        <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">{label}</p>
        <p className="text-sm font-bold text-slate-800 mt-0.5 truncate">{value}</p>
      </div>
    </div>
  );
}

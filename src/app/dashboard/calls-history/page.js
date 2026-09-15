"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { FaVideo, FaArrowLeft, FaClock, FaCalendarAlt, FaUserMd, FaSearch, FaPhoneSlash, FaCheckCircle, FaExclamationTriangle } from "react-icons/fa";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

export default function CallsHistoryPage() {
  const [calls, setCalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    const token = localStorage.getItem("patient_token");
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const res = await fetch(`${API_URL}/v1/patient/calls/history`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });
      if (res.ok) {
        const data = await res.json();
        setCalls(data.calls || []);
      }
    } catch (err) {
      console.error("Erreur chargement historique appels:", err);
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (sec) => {
    if (!sec || sec <= 0) return "00 min 00 sec";
    const m = String(Math.floor(sec / 60)).padStart(2, "0");
    const s = String(sec % 60).padStart(2, "0");
    return `${m} min ${s} sec`;
  };

  const filteredCalls = calls.filter(
    (c) =>
      c.doctor_name?.toLowerCase().includes(search.toLowerCase()) ||
      c.prestation?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 md:p-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header Navigation */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/80 backdrop-blur-xl p-6 rounded-3xl border border-slate-800 shadow-2xl">
          <div className="flex items-center space-x-4">
            <Link
              href="/dashboard"
              className="p-3 bg-slate-800 hover:bg-slate-700 rounded-2xl text-slate-300 hover:text-white transition-all shadow-md"
            >
              <FaArrowLeft className="text-xl" />
            </Link>
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold flex items-center gap-3">
                <FaVideo className="text-cyan-400" /> Historique des Appels Vidéo
              </h1>
              <p className="text-slate-400 text-xs md:text-sm mt-1">
                Consultez l'historique complet de vos téléconsultations médicales.
              </p>
            </div>
          </div>

          <div className="relative">
            <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Rechercher un médecin..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-11 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-sm w-full md:w-64 focus:outline-none focus:border-cyan-500 transition-all text-white placeholder-slate-500"
            />
          </div>
        </div>

        {/* Liste des Appels */}
        {loading ? (
          <div className="py-20 text-center space-y-4">
            <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-slate-400 text-sm">Chargement de votre historique d'appels...</p>
          </div>
        ) : filteredCalls.length === 0 ? (
          <div className="py-20 text-center bg-slate-900/40 rounded-3xl border border-slate-800/80 p-8 space-y-4">
            <div className="w-20 h-20 bg-slate-800/60 rounded-full flex items-center justify-center mx-auto text-slate-500 text-3xl">
              <FaPhoneSlash />
            </div>
            <h3 className="text-xl font-bold text-slate-300">Aucun appel trouvé</h3>
            <p className="text-slate-500 text-sm max-w-md mx-auto">
              Vous n'avez pas encore d'historique d'appels vidéo enregistré. Vos consultations futures apparaîtront ici.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCalls.map((call) => (
              <div
                key={call.id}
                className="bg-slate-900/90 hover:bg-slate-900 border border-slate-800 hover:border-cyan-500/50 rounded-3xl p-6 transition-all duration-300 shadow-xl flex flex-col justify-between group"
              >
                <div className="space-y-4">
                  {/* Doctor Info */}
                  <div className="flex items-center space-x-4">
                    {call.doctor_photo ? (
                      <img
                        src={call.doctor_photo}
                        alt={call.doctor_name}
                        className="w-14 h-14 rounded-2xl object-cover border-2 border-cyan-500/30"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                        <FaUserMd />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-lg text-white truncate group-hover:text-cyan-400 transition-colors">
                        {call.doctor_name}
                      </h4>
                      <p className="text-cyan-400 text-xs font-medium truncate">
                        {call.doctor_specialite || "Médecin"}
                      </p>
                      <p className="text-slate-400 text-xs mt-0.5 truncate">
                        {call.prestation}
                      </p>
                    </div>
                  </div>

                  <hr className="border-slate-800" />

                  {/* Call Details */}
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="bg-slate-950/80 p-3 rounded-2xl border border-slate-800/80">
                      <span className="text-slate-500 flex items-center gap-1 mb-1">
                        <FaCalendarAlt className="text-cyan-500" /> Date & Heure
                      </span>
                      <span className="font-semibold text-slate-200 block">
                        {call.started_at}
                      </span>
                    </div>

                    <div className="bg-slate-950/80 p-3 rounded-2xl border border-slate-800/80">
                      <span className="text-slate-500 flex items-center gap-1 mb-1">
                        <FaClock className="text-emerald-500" /> Durée d'appel
                      </span>
                      <span className="font-mono font-bold text-emerald-400 block">
                        {formatDuration(call.call_duration)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Status Badge */}
                <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between">
                  <span className="text-xs text-slate-500">Statut:</span>
                  {call.call_status === "rejected" ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/20">
                      <FaPhoneSlash /> Refusé
                    </span>
                  ) : call.call_status === "patient_left" ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      <FaExclamationTriangle /> Patient a quitté
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      <FaCheckCircle /> Terminé
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

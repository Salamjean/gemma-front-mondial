"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import DashboardLayout from "@/components/DashboardLayout";
import {
  FaArrowLeft,
  FaHospital,
  FaCalendarAlt,
  FaStethoscope,
  FaUserMd,
  FaUserNurse,
  FaUserCheck,
  FaHeartbeat,
  FaThermometerHalf,
  FaWeight,
  FaRulerVertical,
  FaCalculator,
  FaTint,
  FaLungs,
  FaNotesMedical,
  FaPills,
  FaFilePrescription,
  FaXRay,
  FaFileContract,
  FaDoorOpen,
  FaBookMedical,
  FaLock,
  FaClipboardCheck,
  FaSyringe,
  FaBed,
  FaExclamationTriangle,
  FaFilePdf,
  FaDownload,
} from "react-icons/fa";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
const BASE_URL = API_URL.replace(/\/api$/, "");

export default function ParcoursDetailPage() {
  const { id } = useParams();
  const router = useRouter();

  const [consultation, setConsultation] = useState(null);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id) return;
    fetchParcoursDetail();
  }, [id]);

  const fetchParcoursDetail = async () => {
    const token = localStorage.getItem("patient_token");
    if (!token) {
      setError("Veuillez vous connecter pour accéder à cette page.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/v1/patient/parcours/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });

      if (!res.ok) {
        throw new Error("Impossible de récupérer le parcours de soin.");
      }

      const data = await res.json();
      if (data.status === "success") {
        setConsultation(data.consultation);
        setMeta(data.meta);
      } else {
        throw new Error(data.message || "Erreur lors du chargement des détails.");
      }
    } catch (err) {
      console.error("Erreur fetchParcoursDetail:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
          <div className="w-12 h-12 border-4 border-cyan-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-600 font-medium animate-pulse">
            Chargement du parcours de soin...
          </p>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !consultation) {
    return (
      <DashboardLayout>
        <div className="max-w-4xl mx-auto p-6">
          <div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-2xl text-center space-y-4">
            <FaExclamationTriangle className="text-4xl text-red-500 mx-auto" />
            <h2 className="text-lg font-bold">Erreur de chargement</h2>
            <p className="text-sm">{error || "Consultation introuvable."}</p>
            <Link
              href="/dashboard/consultations"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-red-600 text-white rounded-xl text-sm font-bold shadow-md hover:bg-red-700 transition"
            >
              <FaArrowLeft /> Retour aux consultations
            </Link>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Extraction des données formatées
  const patient = consultation.patient || {};
  const patientUser = patient.user || {};
  const reg = consultation.registre || null;
  const regCur = reg?.registre_consultation_curative || reg?.registreConsultationCurative || null;

  const dateStr = new Date(consultation.created_at).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const hospitalName = meta?.hospital_name || "Hôpital Général";
  const serviceName = meta?.service_name || "Consultation générale";
  const doctorName = meta?.doctor_name || "Non renseigné";
  const infirmierName = meta?.infirmier_name || "Non renseigné";
  const caissiereName = meta?.caissiere_name || "Non renseigné";

  // Constantes
  const valPoids = consultation.poids || regCur?.poids || "N/A";
  const valTaille = consultation.taille || regCur?.taille || "N/A";
  const valImc = consultation.imc || regCur?.imc || "N/A";
  const valTemp = consultation.temperature || regCur?.temperature || "N/A";
  const valTA = consultation.tension_arterielle || regCur?.ta || "N/A";
  const valPouls = consultation.pouls || regCur?.pouls || "N/A";
  const valSat = consultation.saturation_oxygene || regCur?.saturation_oxygene || "N/A";
  const valGlyA = consultation.gly_a_jeun || regCur?.glycemie_a_jeun || "N/A";

  const motifFull = consultation.motif_consultation || consultation.admission?.motif_consultation || regCur?.motif_consultation || "Non renseigné";
  const diagnosticFull = regCur?.diagnostic_retenu || consultation.hospitalisation?.diagnostic || "Aucun diagnostic renseigné";
  const examenPhysique = regCur?.examen_physique || "Non renseigné";
  const justification = reg?.issue_consultation_justification || consultation.hospitalisation?.remark || "Aucune remarque enregistrée";

  // Ordonnances
  const ordonnances = consultation.ordonnances || (consultation.ordonnance ? [consultation.ordonnance] : []);

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-6 pb-12">
        {/* Barre supérieure d'action */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <Link
            href="/dashboard/consultations"
            className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-100 text-gray-700 border border-gray-200 rounded-xl text-sm font-bold shadow-xs transition"
          >
            <FaArrowLeft className="text-cyan-600" />
            <span>Retour aux consultations</span>
          </Link>
          <span className="text-xs font-semibold bg-cyan-50 text-cyan-800 border border-cyan-200 px-3 py-1.5 rounded-lg">
            Consultation N° {consultation.code_consultation || `CONS-${consultation.id}`}
          </span>
        </div>

        {/* En-tête Patient & Consultation */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 md:p-8">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-cyan-600 to-emerald-500 text-white flex items-center justify-center text-2xl font-bold border-4 border-white shadow-md flex-shrink-0">
              {patientUser.name ? patientUser.name.charAt(0).toUpperCase() : "P"}
            </div>

            <div className="space-y-2 flex-1">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-bold text-gray-900">
                  {patientUser.name || ""} {patientUser.prenom || ""}
                </h1>
                {patient.code_patient && (
                  <span className="bg-cyan-100 text-cyan-800 text-xs font-bold px-3 py-1 rounded-full border border-cyan-200">
                    Dossier N° {patient.code_patient}
                  </span>
                )}
                <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-1 rounded-full border border-emerald-200">
                  Intervention : {consultation.code_consultation || `CONS-${consultation.id}`}
                </span>
              </div>

              <div className="flex items-center gap-y-2 gap-x-4 flex-wrap text-sm text-gray-600 pt-1">
                <span className="flex items-center gap-1.5 font-medium text-gray-800">
                  <FaHospital className="text-red-500" />
                  <b>Hôpital :</b> {hospitalName}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1.5 font-medium text-gray-800">
                  <FaCalendarAlt className="text-cyan-600" />
                  <b>Date :</b> {dateStr}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1.5 font-medium text-gray-800">
                  <FaStethoscope className="text-emerald-600" />
                  <b>Service :</b> {serviceName}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 1. ÉQUIPE MÉDICALE */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="bg-slate-50 border-b border-gray-200 px-6 py-4">
            <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <FaUserMd className="text-cyan-600 text-lg" />
              1. Équipe Médicale & Intervenants
            </h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-cyan-50/50 p-4 rounded-xl border border-cyan-100">
                <span className="text-xs font-bold text-cyan-700 uppercase tracking-wider block mb-1 flex items-center gap-1.5">
                  <FaUserMd /> Médecin Traitant
                </span>
                <span className="text-base font-bold text-gray-900 block">
                  {doctorName}
                </span>
              </div>

              <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100">
                <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider block mb-1 flex items-center gap-1.5">
                  <FaUserNurse /> Infirmier(ère) Responsable
                </span>
                <span className="text-base font-bold text-gray-900 block">
                  {infirmierName}
                </span>
              </div>

              <div className="bg-slate-100/70 p-4 rounded-xl border border-gray-200">
                <span className="text-xs font-bold text-gray-600 uppercase tracking-wider block mb-1 flex items-center gap-1.5">
                  <FaUserCheck /> Secrétariat / Accueil / Caisse
                </span>
                <span className="text-base font-bold text-gray-900 block">
                  {caissiereName}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 2. CONSTANTES PHYSIQUES */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="bg-slate-50 border-b border-gray-200 px-6 py-4">
            <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <FaHeartbeat className="text-red-500 text-lg" />
              2. Constantes Physiques (Prises de soins)
            </h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-white p-3.5 rounded-xl border border-gray-200 text-center shadow-2xs">
                <span className="text-xs font-semibold text-gray-500 block mb-1">Poids</span>
                <span className="text-lg font-bold text-gray-900">
                  {valPoids} {valPoids !== "N/A" ? "kg" : ""}
                </span>
              </div>

              <div className="bg-white p-3.5 rounded-xl border border-gray-200 text-center shadow-2xs">
                <span className="text-xs font-semibold text-gray-500 block mb-1">Taille</span>
                <span className="text-lg font-bold text-gray-900">
                  {valTaille} {valTaille !== "N/A" ? "cm" : ""}
                </span>
              </div>

              <div className="bg-white p-3.5 rounded-xl border border-gray-200 text-center shadow-2xs">
                <span className="text-xs font-semibold text-gray-500 block mb-1">IMC</span>
                <span className="text-lg font-bold text-gray-900">
                  {valImc} {valImc !== "N/A" ? "kg/m²" : ""}
                </span>
              </div>

              <div className="bg-white p-3.5 rounded-xl border border-gray-200 text-center shadow-2xs">
                <span className="text-xs font-semibold text-gray-500 block mb-1">Température</span>
                <span className="text-lg font-bold text-gray-900">
                  {valTemp} {valTemp !== "N/A" ? "°C" : ""}
                </span>
              </div>

              <div className="bg-white p-3.5 rounded-xl border border-gray-200 text-center shadow-2xs">
                <span className="text-xs font-semibold text-gray-500 block mb-1">Tension Artérielle</span>
                <span className="text-lg font-bold text-gray-900">
                  {valTA} {valTA !== "N/A" ? "mmHg" : ""}
                </span>
              </div>

              <div className="bg-white p-3.5 rounded-xl border border-gray-200 text-center shadow-2xs">
                <span className="text-xs font-semibold text-gray-500 block mb-1">Pouls</span>
                <span className="text-lg font-bold text-gray-900">
                  {valPouls} {valPouls !== "N/A" ? "batt/mn" : ""}
                </span>
              </div>

              <div className="bg-white p-3.5 rounded-xl border border-gray-200 text-center shadow-2xs">
                <span className="text-xs font-semibold text-gray-500 block mb-1">Saturation O₂</span>
                <span className="text-lg font-bold text-gray-900">
                  {valSat} {valSat !== "N/A" ? "%" : ""}
                </span>
              </div>

              <div className="bg-white p-3.5 rounded-xl border border-gray-200 text-center shadow-2xs">
                <span className="text-xs font-semibold text-gray-500 block mb-1">Glycémie à jeûn</span>
                <span className="text-lg font-bold text-gray-900">
                  {valGlyA} {valGlyA !== "N/A" ? "g/l" : ""}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 3. EXAMEN MÉDICAL & DIAGNOSTIC */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="bg-slate-50 border-b border-gray-200 px-6 py-4">
            <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <FaStethoscope className="text-cyan-600 text-lg" />
              3. Examen Médical & Diagnostic
            </h2>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <span className="text-xs font-bold text-gray-700 uppercase tracking-wider block mb-1.5">
                Motif de consultation :
              </span>
              <p className="bg-gray-50 p-3.5 rounded-xl text-sm font-medium text-gray-800 border border-gray-200">
                {motifFull}
              </p>
            </div>

            <div>
              <span className="text-xs font-bold text-gray-700 uppercase tracking-wider block mb-1.5">
                Examen physique :
              </span>
              <p className="bg-gray-50 p-3.5 rounded-xl text-sm font-medium text-gray-800 border border-gray-200">
                {examenPhysique}
              </p>
            </div>

            <div>
              <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider block mb-1.5">
                Diagnostic retenu :
              </span>
              <div className="bg-emerald-50 text-emerald-800 p-4 rounded-xl border border-emerald-200 text-sm font-bold flex items-center gap-2">
                <FaClipboardCheck className="text-emerald-600 text-lg flex-shrink-0" />
                <span>{diagnosticFull}</span>
              </div>
            </div>
          </div>
        </div>

        {/* 4. PRESCRIPTIONS & ORDONNANCES */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="bg-slate-50 border-b border-gray-200 px-6 py-4">
            <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <FaPills className="text-amber-500 text-lg" />
              4. Prescriptions & Imagerie Médicale
            </h2>
          </div>
          <div className="p-6 space-y-4">
            {ordonnances.length > 0 ? (
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                  <FaFilePrescription className="text-cyan-600" />
                  Ordonnances Médicamenteuses :
                </h3>
                {ordonnances.map((ord, idx) => (
                  <div key={ord.id || idx} className="border border-gray-200 rounded-xl overflow-hidden">
                    <div className="bg-gray-50 px-4 py-2 border-b border-gray-200 flex justify-between items-center text-xs font-bold text-gray-700">
                      <span>Type d'ordonnance : {ord.type ? ord.type.toUpperCase() : "INTERNE"}</span>
                      {ord.code_ordonnance && <span>Code : {ord.code_ordonnance}</span>}
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm text-left">
                        <thead className="bg-slate-100 text-gray-600 text-xs uppercase">
                          <tr>
                            <th className="px-4 py-2.5">Médicament</th>
                            <th className="px-4 py-2.5">Dosage / Posologie</th>
                            <th className="px-4 py-2.5">Quantité</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {ord.prescriptions && ord.prescriptions.length > 0 ? (
                            ord.prescriptions.map((p, pIdx) => {
                              const drugName = p.drug?.name || p.drug_hospital?.drug?.name || p.drug_name || "Médicament";
                              return (
                                <tr key={p.id || pIdx} className="hover:bg-slate-50">
                                  <td className="px-4 py-3 font-bold text-gray-900">{drugName}</td>
                                  <td className="px-4 py-3 text-gray-700">{p.dosage || "Selon prescription"}</td>
                                  <td className="px-4 py-3 text-gray-700">{p.quantity}</td>
                                </tr>
                              );
                            })
                          ) : (
                            <tr>
                              <td colSpan="3" className="px-4 py-3 text-gray-500 italic text-center">
                                Aucune ligne de médicament enregistrée.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 italic bg-gray-50 p-4 rounded-xl border border-gray-200">
                Aucune ordonnance émise lors de cette consultation.
              </p>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-200">
                <span className="text-xs font-bold text-gray-700 block mb-1 flex items-center gap-1.5">
                  <FaXRay className="text-gray-500" /> Bulletin d'examen :
                </span>
                <span className="text-sm text-gray-800 font-medium block mb-2">
                  {consultation.examen ? "Examen prescrit (Imagerie / Laboratoire)" : "Aucun examen demandé"}
                </span>
                {consultation.examen?.id && (
                  <a
                    href={`${BASE_URL}/impression/examen/${consultation.examen.id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition shadow-xs"
                  >
                    <FaFilePdf /> Télécharger Bulletin Examen (PDF)
                  </a>
                )}
              </div>

              <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-200">
                <span className="text-xs font-bold text-gray-700 block mb-1 flex items-center gap-1.5">
                  <FaFileContract className="text-cyan-600" /> Arrêt de travail :
                </span>
                <span className="text-sm text-gray-800 font-medium block mb-2">
                  {consultation.arret ? "Certificat d'arrêt de travail délivré" : "Aucun arrêt de travail"}
                </span>
                {consultation.arret?.id && (
                  <a
                    href={`${BASE_URL}/impression/arret/${consultation.arret.id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition shadow-xs"
                  >
                    <FaFilePdf /> Télécharger Certificat d'Arrêt (PDF)
                  </a>
                )}
              </div>
            </div>

            {/* Boutons Globaux d'impression Ordonnances */}
            {ordonnances.length > 0 && (
              <div className="pt-3 border-t border-gray-200 flex flex-wrap gap-2 items-center">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block mr-2">
                  Télécharger Ordonnance(s) PDF :
                </span>
                {ordonnances.map((ord, idx) => (
                  <a
                    key={ord.id || idx}
                    href={`${BASE_URL}/impression/ordonnance/${ord.id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
                  >
                    <FaFilePdf /> Télécharger Ordonnance #{ord.reference || ord.id} (PDF)
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 5. ISSUE DE LA CONSULTATION */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="bg-slate-50 border-b border-gray-200 px-6 py-4">
            <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <FaDoorOpen className="text-emerald-600 text-lg" />
              5. Issue de la Consultation & Sortie
            </h2>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex items-center gap-3">
              <span className="text-sm font-bold text-gray-900">Mode de sortie / Décision :</span>
              <span className="bg-emerald-600 text-white font-bold text-xs uppercase px-3.5 py-1.5 rounded-lg shadow-2xs">
                {reg?.issue_consultation || "Standard"}
              </span>
            </div>

            <div>
              <span className="text-xs font-bold text-gray-700 uppercase tracking-wider block mb-1.5">
                Justification & Remarques du Médecin :
              </span>
              <p className="bg-gray-50 p-3.5 rounded-xl text-sm font-medium text-gray-800 border border-gray-200">
                {justification}
              </p>
            </div>
          </div>
        </div>

        {/* 6. REGISTRE MÉDICAL DÉTAILLÉ */}
        {reg && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="bg-slate-50 border-b border-gray-200 px-6 py-4 flex items-center justify-between flex-wrap gap-2">
              <div>
                <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <FaBookMedical className="text-cyan-600 text-lg" />
                  6. Registre Médical (N° {reg.code || "N/A"})
                </h2>
                <span className="text-xs text-gray-500">
                  Consultation enregistrée au registre médical (lecture seule)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="bg-gray-200 text-gray-700 font-semibold text-xs px-3 py-1.5 rounded-lg flex items-center gap-1">
                  <FaLock className="text-xs" /> Lecture seule
                </span>
                <span className="bg-cyan-100 text-cyan-800 font-bold text-xs capitalize px-3 py-1.5 rounded-lg border border-cyan-200">
                  {reg.type_consultation || "Consultation"}
                </span>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Antécédents Médicaux & Habitudes */}
              {regCur && (
                <div className="space-y-3">
                  <h3 className="text-sm font-bold text-gray-900 pb-2 border-b border-gray-100 flex items-center gap-2">
                    <FaNotesMedical className="text-cyan-600" />
                    Antécédents Médicaux & Habitudes
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                    <div className="bg-gray-50 p-3 rounded-xl border border-gray-200">
                      <span className="text-[11px] font-bold text-gray-500 uppercase block mb-1">HTA</span>
                      <span
                        className={`text-xs font-bold px-2 py-0.5 rounded ${
                          (regCur.hta || "").includes("Oui") ? "bg-red-100 text-red-700" : "bg-gray-200 text-gray-700"
                        }`}
                      >
                        {regCur.hta || "Non"}
                      </span>
                    </div>

                    <div className="bg-gray-50 p-3 rounded-xl border border-gray-200">
                      <span className="text-[11px] font-bold text-gray-500 uppercase block mb-1">Diabète</span>
                      <span
                        className={`text-xs font-bold px-2 py-0.5 rounded ${
                          (regCur.diabete || "").includes("Oui") ? "bg-red-100 text-red-700" : "bg-gray-200 text-gray-700"
                        }`}
                      >
                        {regCur.diabete || "Non"}
                      </span>
                    </div>

                    <div className="bg-gray-50 p-3 rounded-xl border border-gray-200">
                      <span className="text-[11px] font-bold text-gray-500 uppercase block mb-1">Alcool</span>
                      <span
                        className={`text-xs font-bold px-2 py-0.5 rounded ${
                          regCur.alcool === "Oui" ? "bg-amber-100 text-amber-800" : "bg-gray-200 text-gray-700"
                        }`}
                      >
                        {regCur.alcool || "Non"}
                      </span>
                    </div>

                    <div className="bg-gray-50 p-3 rounded-xl border border-gray-200">
                      <span className="text-[11px] font-bold text-gray-500 uppercase block mb-1">Tabac</span>
                      <span
                        className={`text-xs font-bold px-2 py-0.5 rounded ${
                          regCur.tabac === "Oui" ? "bg-amber-100 text-amber-800" : "bg-gray-200 text-gray-700"
                        }`}
                      >
                        {regCur.tabac || "Non"}
                      </span>
                    </div>

                    <div className="bg-gray-50 p-3 rounded-xl border border-gray-200">
                      <span className="text-[11px] font-bold text-gray-500 uppercase block mb-1">UGD</span>
                      <span
                        className={`text-xs font-bold px-2 py-0.5 rounded ${
                          regCur.ugd === "Oui" ? "bg-amber-100 text-amber-800" : "bg-gray-200 text-gray-700"
                        }`}
                      >
                        {regCur.ugd || "Non"}
                      </span>
                    </div>

                    <div className="bg-gray-50 p-3 rounded-xl border border-gray-200">
                      <span className="text-[11px] font-bold text-gray-500 uppercase block mb-1">Drépanocytaire</span>
                      <span
                        className={`text-xs font-bold px-2 py-0.5 rounded ${
                          regCur.drepanocytaire === "Oui" ? "bg-red-100 text-red-700" : "bg-gray-200 text-gray-700"
                        }`}
                      >
                        {regCur.drepanocytaire || "Non"}
                      </span>
                    </div>
                  </div>

                  {regCur.traitement_medicamenteux_anterieur && (
                    <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-200">
                      <span className="text-xs font-bold text-gray-600 uppercase block mb-1">
                        Traitement Antérieur / En cours :
                      </span>
                      <span className="text-sm font-semibold text-gray-900">
                        {regCur.traitement_medicamenteux_anterieur}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Antécédents Chirurgicaux */}
              {regCur && (
                <div className="space-y-3">
                  <h3 className="text-sm font-bold text-gray-900 pb-2 border-b border-gray-100 flex items-center gap-2">
                    <FaSyringe className="text-red-500" />
                    Antécédents Chirurgicaux
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="bg-gray-50 p-3 rounded-xl border border-gray-200">
                      <span className="text-[11px] font-bold text-gray-500 uppercase block mb-1">
                        Opération antérieure
                      </span>
                      <span
                        className={`text-xs font-bold px-2 py-0.5 rounded ${
                          regCur.antecedent_chirurgical === "Oui" ? "bg-amber-100 text-amber-800" : "bg-gray-200 text-gray-700"
                        }`}
                      >
                        {regCur.antecedent_chirurgical || "Non"}
                      </span>
                    </div>
                    <div className="md:col-span-2 bg-gray-50 p-3 rounded-xl border border-gray-200">
                      <span className="text-[11px] font-bold text-gray-500 uppercase block mb-1">
                        Détail de l'opération
                      </span>
                      <span className="text-sm font-semibold text-gray-900">
                        {regCur.nom_operation || "Aucune intervention spécifiée"}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

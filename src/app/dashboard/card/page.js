"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import MedicalCard from "@/components/MedicalCard";
import { FaIdCard, FaSpinner } from "react-icons/fa";

const PRIMARY_BLUE = "#06b6d4";
const ACCENT_GREEN = "#2da442";
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

export default function MedicalCardPage() {
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPatientData();
  }, []);

  const fetchPatientData = async () => {
    setLoading(true);
    // Try to get from local storage first for immediate display
    const storedData = localStorage.getItem("patient_data");
    if (storedData) {
      try {
        const parsed = JSON.parse(storedData);
        setPatient(parsed.patient || parsed); // Handle potential structure difference
      } catch (e) {
        console.error("Error parsing local storage", e);
      }
    }

    // Then fetch fresh data
    const token = localStorage.getItem("patient_token");
    if (token) {
      try {
        const response = await fetch(`${API_URL}/v1/patient/show`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        });
        if (response.ok) {
          const data = await response.json();
          if (data.patient) {
            setPatient(data.patient);
            localStorage.setItem("patient_data", JSON.stringify(data.patient));
          }
        }
      } catch (err) {
        console.error("Error fetching patient data", err);
      }
    }
    setLoading(false);
  };

  return (
    <DashboardLayout>
      <div className="p-4 md:p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center">
            <FaIdCard className="mr-3" style={{ color: PRIMARY_BLUE }} />
            Ma Carte de Santé
          </h1>
          <p className="text-gray-600 mt-1">
            Visualisez et téléchargez votre carte de soin électronique
          </p>
        </div>

        {/* Content */}
        {loading && !patient ? (
          <div className="flex justify-center items-center h-64">
            <div className="text-center">
              <FaSpinner
                className="animate-spin text-4xl mb-4 mx-auto"
                style={{ color: PRIMARY_BLUE }}
              />
              <p className="text-gray-600">Chargement de votre carte...</p>
            </div>
          </div>
        ) : patient ? (
          <div className="flex flex-col items-center justify-center min-h-[500px] bg-white rounded-xl border border-gray-100 p-8 shadow-sm">
            <MedicalCard patient={patient} />

            <div className="mt-8 text-center max-w-lg">
              <h3 className="font-semibold text-gray-900 mb-2">
                À propos de votre carte
              </h3>
              <p className="text-sm text-gray-500">
                Cette carte est personnelle et contient vos informations
                médicales essentielles. Présentez-la lors de vos consultations
                pour un accès rapide à votre dossier. En cas de perte, veuillez
                contacter l'administration de votre établissement.
              </p>
            </div>
          </div>
        ) : (
          <div className="text-center p-8 bg-red-50 rounded-xl border border-red-100">
            <p className="text-red-600 font-medium">
              Impossible de charger les informations de votre carte.
            </p>
            <button
              onClick={fetchPatientData}
              className="mt-4 px-4 py-2 bg-white border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition"
            >
              Réessayer
            </button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import {
  FaCalendarAlt,
  FaClock,
  FaUserMd,
  FaTrash,
  FaEdit,
  FaPlus,
  FaSearch,
  FaFilter,
  FaExclamationTriangle,
  FaStethoscope,
  FaFileMedical,
} from "react-icons/fa";
import Swal from "sweetalert2";

const PRIMARY_BLUE = "#06b6d4";
const ACCENT_GREEN = "#2da442";
const ERROR_RED = "#dc2626";
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

export default function RendezVousPage() {
  const [rendezVous, setRendezVous] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [doctors, setDoctors] = useState([]);
  const [loadingDoctors, setLoadingDoctors] = useState(false);

  useEffect(() => {
    fetchRendezVous();
    fetchDoctors();
  }, []);

  const fetchRendezVous = async () => {
    const token = localStorage.getItem("patient_token");

    if (!token) {
      setError("Veuillez vous connecter");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      console.log("Fetching rendez-vous...");

      const response = await fetch(`${API_URL}/v1/patient/rdv`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      console.log("Response status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Error response:", errorText);
        throw new Error("Erreur lors de la récupération des rendez-vous");
      }

      const data = await response.json();
      console.log("API Response:", data);
      console.log("Rendez-vous reçus:", data.rdv);

      // Traitement des données pour extraire les informations du champ details si nécessaire
      const processedRdv = (data.rdv || []).map((rdv) => {
        let details = {};
        try {
          if (rdv.details && typeof rdv.details === "string") {
            details = JSON.parse(rdv.details);
          } else if (rdv.details && typeof rdv.details === "object") {
            details = rdv.details;
          }
        } catch (e) {
          console.error("Erreur parsing details:", e);
        }

        // Tentative d'extraction de l'heure
        let heure = rdv.heure || details.heure;

        // Si l'heure n'est pas définie, on essaie de l'extraire de la date
        if (!heure && rdv.date) {
          const dateStr = rdv.date;
          // Détection format YYYY-MM-DD HH:mm ou similaire
          if (dateStr.includes(" ") || dateStr.includes("T")) {
            const timePart = dateStr.split(/[ T]/)[1]; // Prend la partie après l'espace ou T
            if (timePart) {
              // On garde HH:mm
              heure = timePart.substring(0, 5);
            }
          }
        }

        return {
          ...rdv,
          heure: heure || null,
          // Le schéma montre que 'title' existe, c'est donc lui qui fait office de motif principal
          motif:
            rdv.motif || details.motif || rdv.title || "Motif non spécifié",
          notes: rdv.notes || details.notes || "",
          duree: rdv.duree || details.duree || "",
        };
      });

      setRendezVous(processedRdv);
    } catch (err) {
      console.error("Erreur complète:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchDoctors = async () => {
    const token = localStorage.getItem("patient_token");
    if (!token) return;

    try {
      setLoadingDoctors(true);
      const response = await fetch(`${API_URL}/v1/patient/doctors`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        setDoctors(data.doctors || []);
      }
    } catch (err) {
      console.error("Erreur lors de la récupération des médecins:", err);
    } finally {
      setLoadingDoctors(false);
    }
  };

  const handleCreateRendezVous = () => {
    Swal.fire({
      title: "Nouveau Rendez-vous",
      html: `
      <div class="text-left space-y-4">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Titre *</label>
            <input 
              id="swal-title" 
              type="text" 
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
              placeholder="Ex: Consultation générale"
              required
            >
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Médecin *</label>
            <select 
              id="swal-doctor" 
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                loadingDoctors ? "opacity-50" : ""
              }"
              ${loadingDoctors ? "disabled" : ""}
              required
            >
              <option value="">Sélectionnez un médecin</option>
              ${doctors
                .map(
                  (doctor) =>
                    `<option value="${doctor.id}">Dr. ${doctor.name} - ${doctor.specialite}</option>`
                )
                .join("")}
            </select>
            ${
              loadingDoctors
                ? '<p class="text-xs text-gray-500 mt-1">Chargement des médecins...</p>'
                : ""
            }
          </div>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Date *</label>
            <input 
              id="swal-date" 
              type="date" 
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
              required
              min="${new Date().toISOString().split("T")[0]}"
            >
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Heure *</label>
            <input 
              id="swal-heure" 
              type="time" 
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
              required
            >
          </div>
        </div>
        
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Motif *</label>
          <textarea 
            id="swal-motif" 
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
            placeholder="Décrivez le motif de votre rendez-vous"
            rows="3"
            required
          ></textarea>
        </div>
        
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Notes supplémentaires</label>
          <textarea 
            id="swal-notes" 
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
            placeholder="Informations complémentaires..."
            rows="2"
          ></textarea>
        </div>
        
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Document à joindre (optionnel)</label>
          <div class="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-blue-400 transition-colors">
            <input 
              id="swal-image" 
              type="file" 
              class="hidden" 
              accept="image/*,.pdf,.doc,.docx"
            >
            <label for="swal-image" class="cursor-pointer block">
              <svg class="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
              <span class="mt-2 block text-sm font-medium text-gray-900">Cliquez pour sélectionner un fichier</span>
              <span class="mt-1 block text-xs text-gray-500">Formats acceptés : images, PDF, Word (max 2MB)</span>
            </label>
          </div>
          <div id="swal-file-name" class="mt-2 text-sm text-gray-600 hidden"></div>
        </div>
      </div>
    `,
      showCancelButton: true,
      confirmButtonText: "Créer le rendez-vous",
      cancelButtonText: "Annuler",
      confirmButtonColor: PRIMARY_BLUE,
      cancelButtonColor: ERROR_RED,
      focusConfirm: false,
      width: "800px",
      padding: "2rem",
      customClass: {
        popup: "rounded-xl shadow-2xl",
        title: "text-2xl font-bold mb-6",
        htmlContainer: "!overflow-visible",
        confirmButton: "px-6 py-3 text-base font-medium",
        cancelButton: "px-6 py-3 text-base font-medium",
      },
      preConfirm: () => {
        const title = document.getElementById("swal-title").value;
        const date = document.getElementById("swal-date").value;
        const heure = document.getElementById("swal-heure").value;
        const doctorId = document.getElementById("swal-doctor").value;
        const motif = document.getElementById("swal-motif").value;
        const notes = document.getElementById("swal-notes").value;
        const image = document.getElementById("swal-image").files[0];

        // Validation
        if (!title || !date || !heure || !doctorId || !motif) {
          Swal.showValidationMessage(
            "Veuillez remplir tous les champs obligatoires (*)"
          );
          return false;
        }

        if (new Date(date) < new Date().setHours(0, 0, 0, 0)) {
          Swal.showValidationMessage("La date ne peut pas être dans le passé");
          return false;
        }

        if (image && image.size > 2 * 1024 * 1024) {
          Swal.showValidationMessage(
            "Le fichier est trop volumineux (max 2MB)"
          );
          return false;
        }

        return { title, date, heure, doctorId, motif, notes, image };
      },
      didOpen: () => {
        // Focus sur le premier champ
        document.getElementById("swal-title").focus();

        // Aujourd'hui comme date minimum
        const today = new Date().toISOString().split("T")[0];
        document.getElementById("swal-date").min = today;

        // Définir l'heure par défaut (9h)
        document.getElementById("swal-heure").value = "09:00";

        // Gérer l'affichage du nom du fichier
        const fileInput = document.getElementById("swal-image");
        const fileNameDisplay = document.getElementById("swal-file-name");

        fileInput.addEventListener("change", (e) => {
          if (e.target.files.length > 0) {
            fileNameDisplay.textContent = `Fichier sélectionné : ${e.target.files[0].name}`;
            fileNameDisplay.classList.remove("hidden");
          } else {
            fileNameDisplay.classList.add("hidden");
          }
        });
      },
    }).then(async (result) => {
      if (result.isConfirmed && result.value) {
        const { title, date, heure, doctorId, motif, notes, image } =
          result.value;
        await createRendezVous(
          title,
          date,
          heure,
          doctorId,
          motif,
          notes,
          image
        );
      }
    });
  };

  const createRendezVous = async (
    title,
    date,
    heure,
    doctorId,
    motif,
    notes,
    image
  ) => {
    const token = localStorage.getItem("patient_token");

    const formData = new FormData();
    formData.append("title", title);
    formData.append("date", date);
    formData.append("heure", heure);
    formData.append("doctor_id", doctorId);
    formData.append("motif", motif);
    if (notes) formData.append("notes", notes);
    if (image) formData.append("image", image);

    try {
      const response = await fetch(`${API_URL}/v1/patient/rdv/create`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        // Recharger la liste des rendez-vous
        await fetchRendezVous();

        // Récupérer le nom du médecin
        const selectedDoctor = doctors.find((d) => d.id == doctorId);
        const doctorName = selectedDoctor
          ? `Dr. ${selectedDoctor.name}`
          : "le médecin";

        Swal.fire({
          icon: "success",
          title: "Rendez-vous créé !",
          html: `
            <div class="text-left">
              <p><strong>${title}</strong></p>
              <p class="mt-2">Avec ${doctorName}</p>
              <p>Le ${new Date(date).toLocaleDateString("fr-FR")} à ${heure}</p>
              <p class="mt-3 text-sm text-gray-600">Un email de confirmation vous sera envoyé.</p>
            </div>
          `,
          confirmButtonColor: ACCENT_GREEN,
        });
      } else {
        throw new Error(data.message || "Erreur lors de la création");
      }
    } catch (err) {
      console.error("Erreur:", err);
      Swal.fire({
        icon: "error",
        title: "Erreur",
        text: err.message || "Impossible de créer le rendez-vous",
        confirmButtonColor: ERROR_RED,
      });
    }
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: "Confirmer la suppression",
      text: "Êtes-vous sûr de vouloir supprimer ce rendez-vous ?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: ERROR_RED,
      cancelButtonColor: PRIMARY_BLUE,
      confirmButtonText: "Oui, supprimer",
      cancelButtonText: "Annuler",
    });

    if (result.isConfirmed) {
      const token = localStorage.getItem("patient_token");
      try {
        const response = await fetch(`${API_URL}/v1/patient/rdv/${id}`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          setRendezVous((prev) => prev.filter((rdv) => rdv.id !== id));
          Swal.fire({
            title: "Supprimé !",
            text: "Le rendez-vous a été supprimé.",
            icon: "success",
            confirmButtonColor: ACCENT_GREEN,
          });
        } else {
          throw new Error("Erreur lors de la suppression");
        }
      } catch (err) {
        Swal.fire({
          title: "Erreur",
          text: "Impossible de supprimer le rendez-vous",
          icon: "error",
          confirmButtonColor: ERROR_RED,
        });
      }
    }
  };

  // Helper pour obtenir la date à minuit (00:00:00) pour une comparaison juste de la date
  const getMidnight = (dateInput) => {
    if (!dateInput) {
      const now = new Date();
      return new Date(now.getFullYear(), now.getMonth(), now.getDate());
    }

    const str = String(dateInput);

    // Cas 1: DD/MM/YYYY ou DD-MM-YYYY
    const ddmmyyyy = /^(\d{1,2})[-/](\d{1,2})[-/](\d{4})/;
    let match = str.match(ddmmyyyy);
    if (match) {
      return new Date(
        parseInt(match[3]),
        parseInt(match[2]) - 1,
        parseInt(match[1])
      );
    }

    // Cas 2: YYYY-MM-DD (Format ISO standard)
    const yyyymmdd = /^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/;
    match = str.match(yyyymmdd);
    if (match) {
      return new Date(
        parseInt(match[1]),
        parseInt(match[2]) - 1,
        parseInt(match[3])
      );
    }

    // Cas 3: Fallback standard
    const d = new Date(dateInput);

    if (isNaN(d.getTime())) {
      const now = new Date();
      return new Date(now.getFullYear(), now.getMonth(), now.getDate());
    }

    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  };

  const filteredRendezVous = rendezVous
    .map((rdv) => {
      // Enrichir avec le nom du médecin si manquant
      let doctorName = rdv.doctor_name;

      // Essayer de récupérer depuis la relation doctor si elle existe
      if (!doctorName && rdv.doctor && rdv.doctor.name) {
        doctorName = `Dr. ${rdv.doctor.name}`;
      }

      // Sinon chercher dans la liste des médecins chargée via l'ID
      if (!doctorName && rdv.doctor_id) {
        const doctor = doctors.find((d) => d.id == rdv.doctor_id);
        if (doctor) {
          doctorName = `Dr. ${doctor.name}`;
          if (doctor.specialite) {
            doctorName += ` - ${doctor.specialite}`;
          }
        }
      }

      // Debug temporaire si toujours pas de nom mais qu'on a un ID
      if (!doctorName && rdv.doctor_id) {
        console.log(
          `Rendez-vous ${rdv.id}: Doctor ID ${rdv.doctor_id} introuvable dans la liste des ${doctors.length} médecins chargés.`
        );
        // doctorName = `Médecin ID: ${rdv.doctor_id}`; // Optionnel : afficher l'ID pour débugger visuellement
      }

      return { ...rdv, doctor_name: doctorName };
    })
    .filter((rdv) => {
      const matchesSearch =
        (rdv.motif || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (rdv.doctor_name || "")
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        (rdv.title || "").toLowerCase().includes(searchTerm.toLowerCase());

      let rdvDate = getMidnight(rdv.date);
      const today = getMidnight(new Date());

      if (filter === "all") return matchesSearch;
      if (filter === "upcoming") return matchesSearch && rdvDate >= today;
      if (filter === "past") return matchesSearch && rdvDate < today;
      return matchesSearch;
    });

  const formatDateTime = (dateString, timeString) => {
    if (!dateString) return { date: "Date inconnue", time: timeString || "" };

    // Essayer de parser la date avec notre fonction robuste
    let date;

    // Test DD/MM/YYYY ou DD-MM-YYYY
    const ddmmyyyy = /^(\d{1,2})[-/](\d{1,2})[-/](\d{4})/;
    const match = String(dateString).match(ddmmyyyy);

    if (match) {
      // Note: month is 0-indexed in JS Date
      date = new Date(
        parseInt(match[3]),
        parseInt(match[2]) - 1,
        parseInt(match[1])
      );
    } else {
      date = new Date(dateString);
    }

    // Si date toujours invalide
    if (isNaN(date.getTime())) {
      return { date: dateString, time: timeString || "" };
    }

    const formattedDate = date.toLocaleDateString("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    return {
      date: formattedDate,
      time: timeString || "Heure non spécifiée",
    };
  };

  const getStatusBadge = (rdv) => {
    const rdvDate = getMidnight(rdv.date);
    const today = getMidnight(new Date());

    // Comparer les timestamps pour l'égalité stricte
    const isToday = rdvDate.getTime() === today.getTime();
    const isPast = rdvDate < today;
    const status = rdv.status || "pending";

    if (status === "complete") {
      return { text: "Terminé", color: "bg-green-100 text-green-800" };
    }

    if (isToday) {
      return { text: "Aujourd'hui", color: "bg-blue-100 text-blue-800" };
    }
    if (isPast) {
      return { text: "Passé", color: "bg-gray-100 text-gray-800" };
    }
    return { text: "À venir", color: "bg-yellow-100 text-yellow-800" };
  };

  return (
    <DashboardLayout>
      <div className="p-4 md:p-6">
        {/* En-tête avec statistiques */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center">
                <FaCalendarAlt
                  className="mr-3"
                  style={{ color: PRIMARY_BLUE }}
                />
                Mes Rendez-vous
              </h1>
              <p className="text-gray-600 mt-1">
                Gérez vos rendez-vous médicaux
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleCreateRendezVous}
                disabled={loadingDoctors}
                className={`px-4 py-2 ${
                  loadingDoctors
                    ? "bg-gray-400"
                    : "bg-blue-600 hover:bg-blue-700"
                } text-white rounded-lg transition text-sm font-medium flex items-center`}
                style={{
                  backgroundColor: loadingDoctors ? "#94a3b8" : PRIMARY_BLUE,
                }}
              >
                <FaPlus className="inline mr-2" />
                {loadingDoctors ? "Chargement..." : "Nouveau RDV"}
              </button>
            </div>
          </div>

          {/* Statistiques */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <StatCard
              title="Total"
              value={rendezVous.length}
              color={PRIMARY_BLUE}
              icon={FaCalendarAlt}
            />
            <StatCard
              title="À venir"
              value={
                rendezVous.filter((rdv) => {
                  const rdvDate = getMidnight(rdv.date);
                  const today = getMidnight(new Date());
                  return rdvDate >= today && rdv.status !== "complete";
                }).length
              }
              color={ACCENT_GREEN}
              icon={FaClock}
            />
            <StatCard
              title="Aujourd'hui"
              value={
                rendezVous.filter((rdv) => {
                  const rdvDate = getMidnight(rdv.date);
                  const today = getMidnight(new Date());
                  return (
                    rdvDate.getTime() === today.getTime() &&
                    rdv.status !== "complete"
                  );
                }).length
              }
              color="#f59e0b"
              icon={FaExclamationTriangle}
            />
            <StatCard
              title="Terminés"
              value={
                rendezVous.filter((rdv) => rdv.status === "complete").length
              }
              color="#6b7280"
              icon={FaFileMedical}
            />
          </div>

          {/* Filtres et recherche */}
          <div className="bg-white rounded-xl p-4 border border-gray-100 mb-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Rechercher par titre, motif ou médecin..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setFilter("all")}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                    filter === "all"
                      ? "bg-green-100 text-green-700"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  Tous
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
                <button
                  onClick={() => setFilter("past")}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                    filter === "past"
                      ? "bg-gray-100 text-gray-700"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  Passés
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Liste des rendez-vous */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
              <p className="mt-2 text-gray-600">
                Chargement des rendez-vous...
              </p>
            </div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
            <p className="text-red-700">{error}</p>
            <button
              onClick={fetchRendezVous}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
            >
              Réessayer
            </button>
          </div>
        ) : filteredRendezVous.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
            <FaCalendarAlt className="mx-auto text-4xl text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm
                ? "Aucun rendez-vous trouvé"
                : "Aucun rendez-vous programmé"}
            </h3>
            <p className="text-gray-600 mb-4">
              {searchTerm
                ? "Essayez avec d'autres termes de recherche"
                : "Vous n'avez pas de rendez-vous programmé pour le moment"}
            </p>
            <button
              onClick={handleCreateRendezVous}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center justify-center mx-auto"
            >
              <FaPlus className="inline mr-2" />
              Prendre un rendez-vous
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredRendezVous.map((rdv) => {
              const { date, time } = formatDateTime(rdv.date, rdv.heure);
              const status = getStatusBadge(rdv);

              return (
                <div
                  key={rdv.id}
                  className="bg-white rounded-xl border border-gray-200 hover:shadow-lg transition-shadow p-6"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-1">
                            {rdv.title || "Rendez-vous médical"}
                          </h3>
                          <div className="flex items-center text-sm text-gray-600 mb-1">
                            <FaUserMd className="mr-2" />
                            <span>
                              {rdv.doctor_name || "Médecin non spécifié"}
                            </span>
                          </div>
                        </div>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${status.color}`}
                        >
                          {status.text}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Date</p>
                          <p className="text-sm font-medium text-gray-900">
                            {date}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Heure</p>
                          <p className="text-sm font-medium text-gray-900">
                            {time}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Motif</p>
                          <p className="text-sm font-medium text-gray-900">
                            {rdv.motif || "Non spécifié"}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleDelete(rdv.id)}
                        className="px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition"
                        title="Supprimer"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </div>

                  {rdv.notes && (
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <p className="text-xs text-gray-500 mb-1">Notes</p>
                      <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3">
                        {rdv.notes}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

const StatCard = ({ title, value, color, icon: Icon }) => {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <p className="text-2xl font-bold mt-1" style={{ color }}>
            {value}
          </p>
        </div>
        <div
          className="p-2 rounded-lg"
          style={{ backgroundColor: `${color}10` }}
        >
          <Icon style={{ color }} />
        </div>
      </div>
    </div>
  );
};

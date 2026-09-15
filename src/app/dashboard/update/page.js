"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import {
  FaUserEdit,
  FaSave,
  FaUndo,
  FaCamera,
  FaPhone,
  FaEnvelope,
  FaHome,
  FaBriefcase,
  FaUserFriends,
  FaLock,
  FaEye,
  FaEyeSlash,
  FaIdCard,
  FaBirthdayCake,
  FaGlobe,
  FaUser,
  FaVenusMars,
} from "react-icons/fa";
import Swal from "sweetalert2";

const PRIMARY_BLUE = "#06b6d4";
const ACCENT_GREEN = "#2da442";
const ERROR_RED = "#dc2626";
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

export default function UpdateProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    // Informations personnelles de base
    name: "",
    prenom: "",
    code_patient: "",
    gender: "",
    birth_date: "",
    country: "",
    type_piece: "",
    numero_identite: "",
    assurer: "",
    no_assurance: "",
    img_url: "",

    // Informations complémentaires
    residence_actuelle_id: "",
    residence_habituelle_id: "",
    profession: "",
    situation_matrimoniale: "",
    telephone: "",
    contact2: "",

    // Personnes à contacter en cas d'urgence
    nom_personne_cas_urgence: "",
    telephone_personne_cas_urgence: "",
    lien_personne_cas_urgence: "",
    nom_personne2_cas_urgence: "",
    telephone_personne2_cas_urgence: "",
    lien_personne2_cas_urgence: "",

    // Adresse et email
    address: "",
    email: "",
    password: "",
    password_confirmation: "",

    // Pour l'upload d'image
    image: null,
    previewImage: null,
  });

  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [originalData, setOriginalData] = useState(null);

  // Options pour les selects
  const situationsMatrimoniales = [
    { value: "célibataire", label: "Célibataire" },
    { value: "marié(e)", label: "Marié(e)" },
    { value: "divorcé(e)", label: "Divorcé(e)" },
    { value: "veuf(ve)", label: "Veuf(ve)" },
    { value: "concubinage", label: "Concubinage" },
  ];

  const liensParente = [
    { value: "conjoint", label: "Conjoint/Conjointe" },
    { value: "parent", label: "Parent" },
    { value: "enfant", label: "Enfant" },
    { value: "frere_soeur", label: "Frère/Sœur" },
    { value: "ami", label: "Ami(e)" },
    { value: "autre", label: "Autre" },
  ];

  const typesPiece = [
    { value: "cni", label: "Carte Nationale d'Identité" },
    { value: "passeport", label: "Passeport" },
    { value: "permis", label: "Permis de conduire" },
    { value: "carte_sejour", label: "Carte de séjour" },
    { value: "autre", label: "Autre" },
  ];

  const genres = [
    { value: "masculin", label: "Masculin" },
    { value: "feminin", label: "Féminin" },
    { value: "autre", label: "Autre" },
  ];

  const optionsAssurer = [
    { value: "oui", label: "Oui" },
    { value: "non", label: "Non" },
  ];

  useEffect(() => {
    fetchPatientData();
  }, []);

  const fetchPatientData = async () => {
    const token = localStorage.getItem("patient_token");

    if (!token) {
      window.location.href = "/login";
      return;
    }

    try {
      setLoading(true);

      // Vérifier localStorage d'abord
      const storedData = localStorage.getItem("patient_data");
      if (storedData) {
        try {
          const parsedData = JSON.parse(storedData);
          console.log("📦 localStorage chargé:", parsedData);

          // IMPORTANT: Vérifier la structure
          if (parsedData.patient) {
            // Les données sont dans "patient"
            const mappedData = mapApiDataToForm(parsedData.patient);
            setFormData(mappedData);
            setOriginalData(mappedData);
          } else {
            // Les données sont peut-être directement à la racine
            const mappedData = mapApiDataToForm(parsedData);
            setFormData(mappedData);
            setOriginalData(mappedData);
          }
        } catch (e) {
          console.error("❌ Erreur parsing localStorage:", e);
        }
      }

      // Récupérer depuis l'API
      const response = await fetch(`${API_URL}/v1/patient/show`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Erreur lors de la récupération des données");
      }

      const apiResponse = await response.json();
      console.log("📡 Réponse API complète:", apiResponse);

      // IMPORTANT: Les données sont dans apiResponse.patient
      if (apiResponse.patient) {
        console.log("👤 Données patient API:", apiResponse.patient);
        console.log("👤 User data:", apiResponse.patient.user);
        console.log(
          "📍 Habitual residence:",
          apiResponse.patient.habitualResidence
        );
        console.log(
          "📍 Current residence:",
          apiResponse.patient.currentResidence
        );

        const mappedApiData = mapApiDataToForm(apiResponse.patient);
        setFormData(mappedApiData);
        setOriginalData(mappedApiData);

        // Mettre à jour localStorage avec la structure correcte
        localStorage.setItem(
          "patient_data",
          JSON.stringify(apiResponse.patient)
        );
      } else {
        console.error("❌ Aucune donnée patient dans la réponse API");
        throw new Error("Structure de données invalide");
      }
    } catch (err) {
      console.error("❌ Erreur détaillée:", err);
      Swal.fire({
        icon: "error",
        title: "Erreur",
        text: "Impossible de charger vos informations",
        confirmButtonColor: ERROR_RED,
      });
    } finally {
      setLoading(false);
    }
  };

  // Fonction helper pour mapper les données
  const mapApiDataToForm = (data) => {
    return {
      // Informations de base
      name: data.user?.name || data.name || "",
      prenom: data.user?.prenom || data.prenom || "",
      code_patient: data.code_patient || "",
      gender: data.gender || "",
      birth_date: data.birth_date || "",
      country: data.country || "",
      type_piece: data.type_piece || "",
      numero_identite: data.numero_identite || "",
      assurer: data.assurer || "",
      no_assurance: data.no_assurance || "",

      // Informations complémentaires
      residence_actuelle_id:
        data.residence_actuelle_id || data.residence_actuelle || "",
      residence_habituelle_id:
        data.residence_habituelle_id || data.residence_habituelle || "",
      profession: data.profession || "",
      situation_matrimoniale: data.situation_matrimoniale || "",
      telephone: data.telephone || "",
      contact2: data.contact2 || "",

      // Personnes à contacter en cas d'urgence
      nom_personne_cas_urgence: data.nom_personne_cas_urgence || "",
      telephone_personne_cas_urgence: data.telephone_personne_cas_urgence || "",
      lien_personne_cas_urgence: data.lien_personne_cas_urgence || "",
      nom_personne2_cas_urgence: data.nom_personne2_cas_urgence || "",
      telephone_personne2_cas_urgence:
        data.telephone_personne2_cas_urgence || "",
      lien_personne2_cas_urgence: data.lien_personne2_cas_urgence || "",

      // Adresse et email
      address: data.address || "",
      email: data.user?.email || data.email || "",
      password: "",
      password_confirmation: "",

      // Image
      image: null,
      previewImage: (() => {
        const photoUrl =
          data.img_url ||
          data.photo ||
          data.user?.img_url ||
          data.user?.image_url;
        if (photoUrl) {
          // Si c'est déjà une URL complète
          if (photoUrl.startsWith("http")) {
            return photoUrl;
          }
          // Sinon, construire l'URL complète vers le backend
          // On utilise l'URL racine sans /api
          const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:8000";
          return `${baseUrl}/assets/uploads/patient/${photoUrl}`;
        }
        return null;
      })(),
    };
  };

  const handleChange = (e) => {
    const { name, value, files } = e.target;

    if (files) {
      const file = files[0];
      if (file) {
        // Vérifier la taille du fichier (max 2MB)
        if (file.size > 2 * 1024 * 1024) {
          setErrors((prev) => ({
            ...prev,
            image: "L'image doit faire moins de 2MB",
          }));
          return;
        }

        // Vérifier le type de fichier
        const validTypes = ["image/jpeg", "image/jpg", "image/png"];
        if (!validTypes.includes(file.type)) {
          setErrors((prev) => ({
            ...prev,
            image: "Format non supporté. Utilisez JPG, JPEG ou PNG",
          }));
          return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
          setFormData((prev) => ({
            ...prev,
            image: file,
            previewImage: reader.result,
          }));
        };
        reader.readAsDataURL(file);

        // Effacer l'erreur si tout est bon
        if (errors.image) {
          setErrors((prev) => ({
            ...prev,
            image: "",
          }));
        }
      }
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));

      // Effacer l'erreur du champ modifié
      if (errors[name]) {
        setErrors((prev) => ({
          ...prev,
          [name]: "",
        }));
      }
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Validation des champs requis
    if (!formData.name) newErrors.name = "Ce champ est requis";
    if (!formData.prenom) newErrors.prenom = "Ce champ est requis";
    if (!formData.email) newErrors.email = "Ce champ est requis";
    if (!formData.telephone) newErrors.telephone = "Ce champ est requis";
    if (!formData.address) newErrors.address = "Ce champ est requis";
    if (!formData.profession) newErrors.profession = "Ce champ est requis";
    if (!formData.situation_matrimoniale)
      newErrors.situation_matrimoniale = "Ce champ est requis";

    // Validation email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.email && !emailRegex.test(formData.email)) {
      newErrors.email = "Email invalide";
    }

    // Validation téléphone
    const phoneRegex = /^[0-9]{10}$/;
    if (formData.telephone && !phoneRegex.test(formData.telephone)) {
      newErrors.telephone = "Numéro invalide (10 chiffres)";
    }
    if (formData.contact2 && !phoneRegex.test(formData.contact2)) {
      newErrors.contact2 = "Numéro invalide (10 chiffres)";
    }
    if (
      formData.telephone_personne_cas_urgence &&
      !phoneRegex.test(formData.telephone_personne_cas_urgence)
    ) {
      newErrors.telephone_personne_cas_urgence =
        "Numéro invalide (10 chiffres)";
    }
    if (
      formData.telephone_personne2_cas_urgence &&
      !phoneRegex.test(formData.telephone_personne2_cas_urgence)
    ) {
      newErrors.telephone_personne2_cas_urgence =
        "Numéro invalide (10 chiffres)";
    }

    // Validation date de naissance
    if (formData.birth_date) {
      const birthDate = new Date(formData.birth_date);
      const today = new Date();
      if (birthDate > today) {
        newErrors.birth_date = "Date de naissance invalide";
      }
    }

    // Validation mot de passe
    if (formData.password) {
      if (formData.password.length < 4) {
        newErrors.password =
          "Le mot de passe doit contenir au moins 4 caractères";
      }
      if (formData.password !== formData.password_confirmation) {
        newErrors.password_confirmation =
          "Les mots de passe ne correspondent pas";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      Swal.fire({
        icon: "warning",
        title: "Formulaire incomplet",
        text: "Veuillez corriger les erreurs dans le formulaire",
        confirmButtonColor: PRIMARY_BLUE,
      });
      return;
    }

    setSaving(true);

    const token = localStorage.getItem("patient_token");
    const formDataToSend = new FormData();

    // Mapper les champs du frontend vers les noms attendus par le backend
    const fieldMapping = {
      telephone: "contact1",
      contact2: "contact2",
      residence_actuelle_id: "residence_actuelle",
      residence_habituelle_id: "residence_habituelle",
      address: "adresse",
      nom_personne_cas_urgence: "nom_persn_sos",
      telephone_personne_cas_urgence: "tel_persn_sos",
      lien_personne_cas_urgence: "lien_persn_sos",
      nom_personne2_cas_urgence: "nom_persn_sos2",
      telephone_personne2_cas_urgence: "tel_persn_sos2",
      lien_personne2_cas_urgence: "lien_persn_sos2",
      image: "image",
    };

    // Ajouter les champs mappés au FormData
    Object.keys(formData).forEach((key) => {
      if (
        key !== "previewImage" &&
        key !== "img_url" &&
        key !== "name" &&
        key !== "prenom" &&
        key !== "code_patient" &&
        formData[key] !== null &&
        formData[key] !== ""
      ) {
        // Utiliser le nom mappé si disponible, sinon utiliser le nom original
        const backendFieldName = fieldMapping[key] || key;
        formDataToSend.append(backendFieldName, formData[key]);
      }
    });

    // Pour debug
    console.log("Données envoyées:");
    for (let [key, value] of formDataToSend.entries()) {
      console.log(key, value);
    }

    try {
      const response = await fetch(`${API_URL}/v1/patient/update`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          // Ne pas mettre Content-Type pour FormData, il le fait automatiquement
        },
        body: formDataToSend,
      });

      // Vérifier si la réponse est du JSON
      const contentType = response.headers.get("content-type");
      let data;

      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
        console.log("Réponse API:", data);
      } else {
        // Si ce n'est pas du JSON, c'est probablement une erreur HTML
        const textResponse = await response.text();
        console.error("Réponse HTML (erreur):", textResponse);
        throw new Error(
          "Le serveur a retourné une erreur. Vérifiez la console pour plus de détails."
        );
      }

      if (response.ok) {
        console.log("✅ Mise à jour réussie, données retournées:", data);

        // Récupérer les données actuelles du localStorage
        const currentPatientData = JSON.parse(
          localStorage.getItem("patient_data") || "{}"
        );

        // L'API retourne les données mises à jour (vérifier data.patient ou data.data)
        const updatedFromApi = data.patient || data.data || {};

        // Mettre à jour avec les nouvelles données
        const updatedData = {
          ...currentPatientData,
          ...formData,
          // IMPORTANT: Récupérer le nouveau img_url de l'API si une image a été uploadée
          img_url: updatedFromApi.img_url || currentPatientData.img_url,
          user: {
            ...currentPatientData.user,
            name: formData.name,
            prenom: formData.prenom,
            email: formData.email,
          },
        };

        console.log("💾 Mise à jour du localStorage avec:", updatedData);
        localStorage.setItem("patient_data", JSON.stringify(updatedData));

        // Déclencher un événement pour notifier les autres composants (header, etc.)
        window.dispatchEvent(new Event("patientDataUpdated"));

        // Mettre à jour le formData avec les nouvelles données
        const newFormData = mapApiDataToForm(updatedData);
        setFormData(newFormData);
        setOriginalData(newFormData);

        Swal.fire({
          icon: "success",
          title: "Profil mis à jour",
          text: "Vos informations ont été sauvegardées avec succès",
          confirmButtonColor: ACCENT_GREEN,
        });
      } else {
        throw new Error(data.message || "Erreur lors de la mise à jour");
      }
    } catch (err) {
      console.error("Erreur complète:", err);
      Swal.fire({
        icon: "error",
        title: "Erreur",
        text: err.message || "Impossible de mettre à jour votre profil",
        confirmButtonColor: ERROR_RED,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (originalData) {
      setFormData(originalData);
      setErrors({});
      Swal.fire({
        icon: "info",
        title: "Formulaire réinitialisé",
        text: "Les modifications ont été annulées",
        confirmButtonColor: PRIMARY_BLUE,
      });
    }
  };

  const hasChanges = () => {
    if (!originalData) return false;
    return JSON.stringify(formData) !== JSON.stringify(originalData);
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
            <p className="mt-2 text-gray-600">
              Chargement de vos informations...
            </p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-4 md:p-6">
        <div className="max-w-4xl mx-auto">
          {/* En-tête */}
          <div className="mb-8">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center">
              <FaUserEdit className="mr-3" style={{ color: PRIMARY_BLUE }} />
              Mettre à jour mon profil
            </h1>
            <p className="text-gray-600 mt-1">
              Modifiez vos informations personnelles et de contact
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Section Photo de profil */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <FaCamera className="mr-2" />
                Photo de profil
              </h2>

              <div className="flex flex-col md:flex-row items-center gap-6">
                <div className="relative">
                  <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-gray-100">
                    {formData.previewImage ? (
                      <img
                        src={formData.previewImage}
                        alt="Photo de profil"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-r from-blue-50 to-green-50 flex items-center justify-center">
                        <FaUser className="text-4xl text-gray-400" />
                      </div>
                    )}
                  </div>

                  <label className="absolute bottom-0 right-0 cursor-pointer">
                    <div className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition">
                      <FaCamera className="text-sm" />
                    </div>
                    <input
                      type="file"
                      name="image"
                      accept="image/jpeg,image/png,image/jpg"
                      onChange={handleChange}
                      className="hidden"
                    />
                  </label>
                </div>

                <div className="flex-1">
                  <p className="text-sm text-gray-600">
                    Téléchargez une photo de profil. Formats acceptés : JPG,
                    JPEG, PNG. La taille maximale est de 2MB.
                  </p>
                  {errors.image && (
                    <p className="text-red-600 text-sm mt-1">{errors.image}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Section Informations personnelles de base */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                <FaUser className="mr-2" />
                Informations personnelles de base
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Nom */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nom *
                  </label>
                  <input
                    type="text"
                    name="name"
                    readOnly
                    value={formData.name}
                    onChange={handleChange}
                    className={`w-full px-4 py-2 border rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed ${
                      errors.name ? "border-red-500" : "border-gray-300"
                    }`}
                    placeholder="Votre nom"
                  />
                  {errors.name && (
                    <p className="text-red-600 text-sm mt-1">{errors.name}</p>
                  )}
                </div>

                {/* Prénom */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Prénom *
                  </label>
                  <input
                    type="text"
                    name="prenom"
                    readOnly
                    value={formData.prenom}
                    onChange={handleChange}
                    className={`w-full px-4 py-2 border rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed ${
                      errors.prenom ? "border-red-500" : "border-gray-300"
                    }`}
                    placeholder="Votre prénom"
                  />
                  {errors.prenom && (
                    <p className="text-red-600 text-sm mt-1">{errors.prenom}</p>
                  )}
                </div>

                {/* Code patient (lecture seule) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Code bulletin médical
                  </label>
                  <input
                    type="text"
                    value={formData.code_patient}
                    readOnly
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Ce code ne peut pas être modifié
                  </p>
                </div>

                {/* Genre */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                    <FaVenusMars className="mr-2 text-sm" />
                    Genre
                  </label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    disabled
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed"
                  >
                    <option value="">Sélectionnez</option>
                    {genres.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Date de naissance */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                    <FaBirthdayCake className="mr-2 text-sm" />
                    Date de naissance
                  </label>
                  <input
                    type="date"
                    name="birth_date"
                    value={formData.birth_date}
                    onChange={handleChange}
                    readOnly
                    className={`w-full px-4 py-2 border rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed ${
                      errors.birth_date ? "border-red-500" : "border-gray-300"
                    }`}
                  />
                  {errors.birth_date && (
                    <p className="text-red-600 text-sm mt-1">
                      {errors.birth_date}
                    </p>
                  )}
                </div>

                {/* Pays de naissance */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                    <FaGlobe className="mr-2 text-sm" />
                    Pays de naissance
                  </label>
                  <input
                    type="text"
                    name="country"
                    value={formData.country}
                    onChange={handleChange}
                    readOnly
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed"
                    placeholder="Votre pays de naissance"
                  />
                </div>

                {/* Type de pièce */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                    <FaIdCard className="mr-2 text-sm" />
                    Type de pièce
                  </label>
                  <select
                    name="type_piece"
                    value={formData.type_piece}
                    onChange={handleChange}
                    disabled
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed"
                  >
                    <option value="">Sélectionnez</option>
                    {typesPiece.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Numéro de pièce */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Numéro de pièce
                  </label>
                  <input
                    type="text"
                    name="numero_identite"
                    value={formData.numero_identite}
                    onChange={handleChange}
                    readOnly
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed"
                    placeholder="Numéro de votre pièce d'identité"
                  />
                </div>

                {/* Assuré */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Assuré
                  </label>
                  <select
                    name="assurer"
                    value={formData.assurer}
                    onChange={handleChange}
                    disabled
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed"
                  >
                    <option value="">Sélectionnez</option>
                    {optionsAssurer.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Numéro de l'assurance */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Numéro de assurance
                  </label>
                  <input
                    type="text"
                    name="no_assurance"
                    value={formData.no_assurance}
                    onChange={handleChange}
                    readOnly
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed"
                    placeholder="Votre numéro d'assurance"
                  />
                </div>
              </div>
            </div>

            {/* Section Informations complémentaires */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                <FaBriefcase className="mr-2" />
                Informations complémentaires
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Résidence actuelle */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Résidence actuelle
                  </label>
                  <input
                    type="number"
                    name="residence_actuelle_id"
                    value={formData.residence_actuelle_id}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="ID de résidence actuelle"
                  />
                </div>

                {/* Résidence habituelle */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Résidence habituelle
                  </label>
                  <input
                    type="number"
                    name="residence_habituelle_id"
                    value={formData.residence_habituelle_id}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="ID de résidence habituelle"
                  />
                </div>

                {/* Profession */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Profession *
                  </label>
                  <input
                    type="text"
                    name="profession"
                    value={formData.profession}
                    onChange={handleChange}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.profession ? "border-red-500" : "border-gray-300"
                    }`}
                    placeholder="Votre profession"
                  />
                  {errors.profession && (
                    <p className="text-red-600 text-sm mt-1">
                      {errors.profession}
                    </p>
                  )}
                </div>

                {/* Situation matrimoniale */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Situation matrimoniale *
                  </label>
                  <select
                    name="situation_matrimoniale"
                    value={formData.situation_matrimoniale}
                    onChange={handleChange}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.situation_matrimoniale
                        ? "border-red-500"
                        : "border-gray-300"
                    }`}
                  >
                    <option value="">Sélectionnez</option>
                    {situationsMatrimoniales.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  {errors.situation_matrimoniale && (
                    <p className="text-red-600 text-sm mt-1">
                      {errors.situation_matrimoniale}
                    </p>
                  )}
                </div>

                {/* Contact 1 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                    <FaPhone className="mr-2 text-sm" />
                    Contact 1 (téléphone) *
                  </label>
                  <input
                    type="tel"
                    name="telephone"
                    value={formData.telephone}
                    onChange={handleChange}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.telephone ? "border-red-500" : "border-gray-300"
                    }`}
                    placeholder="0612345678"
                    maxLength="10"
                  />
                  {errors.telephone && (
                    <p className="text-red-600 text-sm mt-1">
                      {errors.telephone}
                    </p>
                  )}
                </div>

                {/* Contact 2 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contact 2
                  </label>
                  <input
                    type="tel"
                    name="contact2"
                    value={formData.contact2}
                    onChange={handleChange}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.contact2 ? "border-red-500" : "border-gray-300"
                    }`}
                    placeholder="0612345678"
                    maxLength="10"
                  />
                  {errors.contact2 && (
                    <p className="text-red-600 text-sm mt-1">
                      {errors.contact2}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Section Personnes à contacter */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                <FaUserFriends className="mr-2" />
                Personnes à contacter en cas d'urgence
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Personne 1 */}
                <div className="space-y-4">
                  <h3 className="font-medium text-gray-900">
                    Première personne
                  </h3>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nom complet
                    </label>
                    <input
                      type="text"
                      name="nom_personne_cas_urgence"
                      value={formData.nom_personne_cas_urgence}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Nom et prénom"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Téléphone
                    </label>
                    <input
                      type="tel"
                      name="telephone_personne_cas_urgence"
                      value={formData.telephone_personne_cas_urgence}
                      onChange={handleChange}
                      className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.telephone_personne_cas_urgence
                          ? "border-red-500"
                          : "border-gray-300"
                      }`}
                      placeholder="0612345678"
                      maxLength="10"
                    />
                    {errors.telephone_personne_cas_urgence && (
                      <p className="text-red-600 text-sm mt-1">
                        {errors.telephone_personne_cas_urgence}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Lien de parenté
                    </label>
                    <select
                      name="lien_personne_cas_urgence"
                      value={formData.lien_personne_cas_urgence}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Sélectionnez</option>
                      {liensParente.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Personne 2 */}
                <div className="space-y-4">
                  <h3 className="font-medium text-gray-900">
                    Deuxième personne (optionnel)
                  </h3>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nom complet
                    </label>
                    <input
                      type="text"
                      name="nom_personne2_cas_urgence"
                      value={formData.nom_personne2_cas_urgence}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Nom et prénom"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Téléphone
                    </label>
                    <input
                      type="tel"
                      name="telephone_personne2_cas_urgence"
                      value={formData.telephone_personne2_cas_urgence}
                      onChange={handleChange}
                      className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.telephone_personne2_cas_urgence
                          ? "border-red-500"
                          : "border-gray-300"
                      }`}
                      placeholder="0612345678"
                      maxLength="10"
                    />
                    {errors.telephone_personne2_cas_urgence && (
                      <p className="text-red-600 text-sm mt-1">
                        {errors.telephone_personne2_cas_urgence}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Lien de parenté
                    </label>
                    <select
                      name="lien_personne2_cas_urgence"
                      value={formData.lien_personne2_cas_urgence}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Sélectionnez</option>
                      {liensParente.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Section Adresse et sécurité */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                <FaLock className="mr-2" />
                Adresse et sécurité
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Adresse */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                    <FaHome className="mr-2 text-sm" />
                    Adresse complète *
                  </label>
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    rows="3"
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.address ? "border-red-500" : "border-gray-300"
                    }`}
                    placeholder="Votre adresse complète"
                  />
                  {errors.address && (
                    <p className="text-red-600 text-sm mt-1">
                      {errors.address}
                    </p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                    <FaEnvelope className="mr-2 text-sm" />
                    Adresse email *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.email ? "border-red-500" : "border-gray-300"
                    }`}
                    placeholder="votre@email.com"
                  />
                  {errors.email && (
                    <p className="text-red-600 text-sm mt-1">{errors.email}</p>
                  )}
                </div>

                {/* Mot de passe */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nouveau mot de passe
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.password ? "border-red-500" : "border-gray-300"
                      }`}
                      placeholder="Laisser vide pour ne pas changer"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                    >
                      {showPassword ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-red-600 text-sm mt-1">
                      {errors.password}
                    </p>
                  )}
                </div>

                {/* Confirmation mot de passe */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confirmation du mot de passe
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      name="password_confirmation"
                      value={formData.password_confirmation}
                      onChange={handleChange}
                      className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.password_confirmation
                          ? "border-red-500"
                          : "border-gray-300"
                      }`}
                      placeholder="Confirmez le mot de passe"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                    >
                      {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                  {errors.password_confirmation && (
                    <p className="text-red-600 text-sm mt-1">
                      {errors.password_confirmation}
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-4 text-sm text-gray-600">
                <p>
                  ⚠️ Si vous ne souhaitez pas changer votre mot de passe,
                  laissez les champs vides.
                </p>
              </div>
            </div>

            {/* Boutons d'action */}
            <div className="flex flex-col md:flex-row justify-between gap-4 pt-6 border-t border-gray-200">
              <div className="text-sm text-gray-600">* Champs obligatoires</div>

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={handleReset}
                  disabled={!hasChanges()}
                  className={`px-6 py-3 rounded-lg font-medium transition ${
                    hasChanges()
                      ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      : "bg-gray-100 text-gray-400 cursor-not-allowed"
                  }`}
                >
                  <FaUndo className="inline mr-2" />
                  Annuler
                </button>

                <button
                  type="submit"
                  disabled={saving || !hasChanges()}
                  className={`px-6 py-3 rounded-lg font-medium text-white transition ${
                    saving || !hasChanges()
                      ? "bg-blue-400 cursor-not-allowed"
                      : "bg-blue-600 hover:bg-blue-700"
                  }`}
                  style={{
                    backgroundColor:
                      saving || !hasChanges()
                        ? `${PRIMARY_BLUE}80`
                        : PRIMARY_BLUE,
                  }}
                >
                  <FaSave className="inline mr-2" />
                  {saving
                    ? "Enregistrement..."
                    : "Enregistrer les modifications"}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
}

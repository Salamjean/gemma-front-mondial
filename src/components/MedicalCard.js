"use client";

import React, { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { FaHeartbeat } from "react-icons/fa";
import "./MedicalCard.css";

const API_URL = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:8000";

export default function MedicalCard({ patient }) {
  const [flipped, setFlipped] = useState(false);

  if (!patient) return null;

  const toggleFlip = () => {
    setFlipped(!flipped);
  };

  const formatDate = (dateString, addYears = 0) => {
    if (!dateString) return "";

    let date;
    // Handle DD/MM/YYYY format manually if detected
    if (
      typeof dateString === "string" &&
      /^\d{2}\/\d{2}\/\d{4}$/.test(dateString)
    ) {
      const [day, month, year] = dateString.split("/");
      date = new Date(`${year}-${month}-${day}`);
    } else {
      date = new Date(dateString);
    }

    // Check for invalid date
    if (isNaN(date.getTime())) return dateString;

    if (addYears > 0) {
      date.setFullYear(date.getFullYear() + addYears);
    }

    try {
      return new Intl.DateTimeFormat("fr-FR", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }).format(date);
    } catch (e) {
      return dateString;
    }
  };

  const getPatientPhoto = () => {
    // Vérifier plusieurs sources possibles pour la photo
    const photoUrl =
      patient.img_url ||
      patient.user?.img_url ||
      patient.user?.image_url ||
      patient.photo;

    if (photoUrl) {
      // Si c'est déjà une URL complète (commence par http)
      if (photoUrl.startsWith("http")) {
        return photoUrl;
      }
      // Sinon, construire l'URL complète
      return `${API_URL}/assets/uploads/patient/${photoUrl}`;
    }

    // Image par défaut si aucune photo n'existe
    return `${API_URL}/assets/images/avatar.png`;
  };

  const hospitalName = patient.hospital?.nom_direction_generale || "ABIDJAN";
  const hospitalContact = patient.hospital?.contact || "+225";
  const hospitalEmail = patient.hospital?.email || "";
  const hospitalDetails = `${
    patient.hospital?.nom_direction_generale || ""
  } - ${patient.hospital?.district_sanitaire || ""} - ${
    patient.hospital?.label || "Abidjan, Côte d'Ivoire"
  }`;

  const qrText = `DM:${patient.code_patient}\nNom:${
    patient.user?.name || ""
  }\nPrenom:${patient.user?.prenom || ""}\nTel:${patient.telephone || ""}`;

  return (
    <div className="flex flex-col items-center w-full">
      <div className="medical-card-container">
        <div className="mc-id-card-wrapper">
          <div
            className={`mc-flip-card ${flipped ? "flipped" : ""}`}
            onClick={toggleFlip}
          >
            <div className="mc-flip-card-inner">
              {/* RECTO (FRONT) */}
              <div className="mc-id-card mc-id-card-front">
                {/* HEADER */}
                <div className="mc-id-card-header">
                  <div className="mc-header-logo-left">
                    <div
                      style={{
                        fontSize: "10px",
                        fontWeight: "bold",
                        textAlign: "center",
                        lineHeight: "1.1",
                      }}
                    >
                      <img
                        src={`${API_URL}/assets/images/sante.jpg`}
                        style={{
                          height: "90px",
                          display: "block",
                          margin: "0 auto 5px",
                        }}
                        alt="Logo"
                      />
                    </div>
                  </div>
                  <div className="mc-header-logo-center">
                    <div
                      style={{
                        fontSize: "8px",
                        textTransform: "uppercase",
                        marginBottom: "2px",
                      }}
                    >
                      Ma Carte de Soin Electronique
                    </div>
                    <div
                      style={{
                        background: "white",
                        border: "1px solid #ddd",
                        borderRadius: "20px",
                        padding: "5px 15px",
                        boxShadow: "2px 2px 5px rgba(0,0,0,0.1)",
                        display: "inline-flex",
                        alignItems: "center",
                      }}
                    >
                      <span
                        style={{
                          fontWeight: "900",
                          fontSize: "20px",
                          color: "#0056b3",
                          marginRight: "10px",
                          fontFamily: "sans-serif",
                        }}
                      >
                        MA-CSE
                      </span>
                      <FaHeartbeat
                        style={{ fontSize: "24px", color: "#dc3545" }}
                      />
                    </div>
                    <div
                      style={{
                        fontSize: "16px",
                        fontWeight: "bold",
                        marginTop: "8px",
                        color: "#333",
                        letterSpacing: "1px",
                      }}
                    >
                      {patient.code_patient}
                    </div>
                  </div>
                  <div className="mc-header-logo-right">
                    <img
                      src={`${API_URL}/assets/images/embleme.png`}
                      style={{ height: "90px" }}
                      alt="Emblème CI"
                    />
                  </div>
                </div>

                {/* QR CODE (Front) */}
                <div className="mc-qrcode-container">
                  <QRCodeSVG value={qrText} size={70} />
                </div>

                {/* INFO BOX */}
                <div className="mc-patient-info-box">
                  <div className="mc-info-row">
                    <span className="mc-info-label">Nom:</span>
                    <span className="mc-info-value">
                      {patient.user?.name?.toUpperCase()}
                    </span>
                  </div>
                  <div className="mc-info-row">
                    <span className="mc-info-label">Prénom:</span>
                    <span className="mc-info-value">
                      {patient.user?.prenom
                        ? patient.user.prenom.charAt(0).toUpperCase() +
                          patient.user.prenom.slice(1)
                        : ""}
                    </span>
                  </div>
                  <div className="mc-info-row">
                    <span className="mc-info-label">Né(e) le:</span>
                    <span className="mc-info-value">
                      {formatDate(patient.birth_date)}
                    </span>
                  </div>
                  <div className="mc-info-row">
                    <span className="mc-info-label">Validité:</span>
                    <span className="mc-info-value">
                      jusqu'au {formatDate(patient.created_at, 5)}
                    </span>
                  </div>
                </div>

                {/* PHOTO */}
                <div className="mc-patient-photo-container">
                  <img
                    src={getPatientPhoto()}
                    className="mc-patient-photo"
                    alt="Photo patient"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = `${API_URL}/assets/images/avatar.png`;
                    }}
                  />
                </div>

                {/* MAIN TITLE */}
                <div className="mc-main-title">CARTE DE SANTE ELECTRONIQUE</div>

                {/* FOOTER */}
                <div
                  className="mc-card-footer"
                  style={{ backgroundColor: "#3596f7" }}
                >
                  <div className="mc-footer-logo">
                    <img
                      src={`${API_URL}/home/assets/img/logo/GEMMA.jpeg`}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "contain",
                      }}
                      alt="Logo"
                    />
                  </div>
                  <div className="mc-footer-text">
                    <strong>GEMMA votre partenaire en santé</strong>
                    <br />
                    Tel: +225 07 11 11 79 79
                    <br />
                    Email: gemma@gmail.com
                  </div>
                </div>
              </div>

              {/* VERSO (BACK) */}
              <div className="mc-id-card mc-id-card-back">
                <div className="mc-magnetic-strip"></div>

                <div className="mc-back-content">
                  <div className="mc-legal-text">
                    <p>Cette carte est la propriété de GEMMA.</p>
                    <p>
                      Elle est personnelle et incessible. En cas de perte,
                      veuillez contacter GEMMA.
                    </p>
                    <p className="mt-2">
                      <strong>En cas d'urgence:</strong>{" "}
                      {patient.telephone_personne_cas_urgence ||
                        patient.hospital?.contact ||
                        "+225 07 11 117 979"}
                    </p>
                  </div>

                  <div className="mc-codes-section">
                    <div className="mc-qr-box">
                      <QRCodeSVG value={qrText} size={90} />
                      <span className="mc-code-label">Scan ME</span>
                    </div>
                  </div>
                </div>

                <div className="mc-card-footer">
                  <div
                    className="mc-footer-text w-100 text-center"
                    style={{
                      width: "100%",
                      textAlign: "center",
                      fontSize: "10px",
                      opacity: 0.8,
                    }}
                  >
                    Powered by GEMMA Technology
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="text-center mt-2 text-gray-500 text-sm">
        <small>
          <i className="fa fa-info-circle mr-1"></i> Cliquez sur la carte pour
          la retourner
        </small>
      </div>
    </div>
  );
}

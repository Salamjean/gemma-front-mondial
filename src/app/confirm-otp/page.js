"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { FaUnlockAlt, FaSpinner, FaRedo } from "react-icons/fa";
import Swal from "sweetalert2";

// --- CONFIGURATION ---
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
const PRIMARY_BLUE = "#06b6d4";
const ACCENT_GREEN = "#2da442";
const ERROR_RED = "#dc2626";

// Composant principal avec useSearchParams
function ConfirmOtpContent() {
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const router = useRouter();
  const searchParams = useSearchParams();
  const identifier = searchParams.get("identifier");

  // Initialisation et Redirection
  useEffect(() => {
    if (!identifier) {
      router.replace("/login");
    }
  }, [identifier, router]);

  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [countdown]);

  if (!identifier) {
    return (
      <div
        className="flex min-h-screen items-center justify-center text-primary-blue"
        style={{ color: PRIMARY_BLUE }}
      >
        Redirection vers la page de connexion...
      </div>
    );
  }

  // Fonction de renvoi du code
  const handleResend = async () => {
    setResending(true);
    try {
      const response = await fetch(`${API_URL}/v1/patient/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: identifier }),
      });

      const data = await response.json();

      if (response.ok) {
        Swal.fire({
          icon: "success",
          title: "Code Renové",
          text: data.message || "Un nouveau code a été envoyé.",
          confirmButtonColor: PRIMARY_BLUE,
        });
        setCountdown(60);
      } else {
        Swal.fire({
          icon: "error",
          title: "Erreur de Renvoi",
          text: data.message || "Impossible de renvoyer le code.",
          confirmButtonColor: ERROR_RED,
        });
      }
    } catch (err) {
      Swal.fire({
        icon: "warning",
        title: "Problème Serveur",
        text: "Impossible de se connecter au serveur API pour renvoyer le code.",
        confirmButtonColor: PRIMARY_BLUE,
      });
    } finally {
      setResending(false);
    }
  };

  // Fonction de soumission OTP
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/v1/patient/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: identifier,
          password: otp,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem("patient_token", data.token);
        localStorage.setItem("patient_data", JSON.stringify(data.patient));

        Swal.fire({
          icon: "success",
          title: "Connexion Réussie",
          text: data.message || "Bienvenue dans votre Espace Patient.",
          confirmButtonColor: PRIMARY_BLUE,
        }).then(() => {
          router.push("/dashboard");
        });
      } else {
        const errorMessage = data.errors
          ? Object.values(data.errors).flat().join("; ")
          : data.message || "Code OTP incorrect ou expiré.";

        Swal.fire({
          icon: "error",
          title: "Échec de la Vérification",
          text: errorMessage,
          confirmButtonColor: ERROR_RED,
        });
      }
    } catch (err) {
      console.error(err);
      Swal.fire({
        icon: "warning",
        title: "Problème Serveur",
        text: "Impossible de se connecter au serveur API.",
        confirmButtonColor: PRIMARY_BLUE,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center p-4 overflow-hidden">
      {/* ARRIÈRE-PLAN AVEC IMAGE ET OPACITY */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/gemma.jpeg"
          alt="Fond médical"
          fill={true}
          style={{ objectFit: "cover" }}
          quality={80}
        />
        <div
          className={`absolute inset-0 opacity-50`}
          style={{ backgroundColor: "gray" }}
        ></div>
      </div>

      {/* FORMULAIRE DE CONFIRMATION */}
      <div className="w-full max-w-lg p-10 space-y-8 bg-white shadow-2xl rounded-2xl border border-gray-100 relative z-10">
        <div className="text-center">
          <FaUnlockAlt
            className={`mx-auto text-6xl mb-4`}
            style={{ color: PRIMARY_BLUE }}
          />
          <h2
            className={`text-4xl font-extrabold`}
            style={{ color: PRIMARY_BLUE }}
          >
            Vérification OTP
          </h2>
          <p className="mt-2 text-gray-500 text-lg">
            Veuillez entrer le code à 6 chiffres envoyé à partir du DM{" "}
            <span className="font-bold" style={{ color: ACCENT_GREEN }}>
              {identifier}
            </span>
            .
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              htmlFor="otp"
              className={`block text-sm font-semibold mb-1`}
              style={{ color: PRIMARY_BLUE }}
            >
              Code de Confirmation (OTP)
            </label>
            <input
              id="otp"
              name="otp"
              type="text"
              required
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              className={`mt-1 block w-full px-5 py-3 border rounded-xl shadow-inner text-center text-2xl tracking-widest 
                           focus:outline-none focus:ring-2 focus:ring-[${ACCENT_GREEN}] focus:border-[${ACCENT_GREEN}]
                           transition duration-300`}
              style={{ borderColor: PRIMARY_BLUE }}
              maxLength="6"
              inputMode="numeric"
              pattern="[0-9]*"
              placeholder="123456"
            />
          </div>

          {/* BOUTON DE SOUMISSION */}
          <button
            type="submit"
            disabled={loading}
            className={`w-full flex items-center justify-center py-3 px-4 border border-transparent rounded-xl 
                         text-base font-bold text-white shadow-lg 
                         hover:opacity-90 focus:outline-none focus:ring-4 focus:ring-opacity-50 
                         disabled:opacity-60 disabled:cursor-not-allowed transition duration-300`}
            style={{ backgroundColor: PRIMARY_BLUE }}
          >
            {loading ? (
              <FaSpinner className="animate-spin mr-2" />
            ) : (
              "Confirmer et Se Connecter"
            )}
          </button>
        </form>

        {/* LIENS SECONDAIRES */}
        <div className="space-y-3 pt-2 text-center">
          {/* Bouton de Renvoi */}
          <button
            onClick={handleResend}
            disabled={resending || countdown > 0}
            className={`w-full flex items-center justify-center text-sm font-medium transition duration-200 ${
              countdown > 0
                ? "text-gray-400 cursor-not-allowed"
                : "hover:opacity-80"
            }`}
            style={{ color: PRIMARY_BLUE }}
          >
            {resending ? (
              <FaSpinner className="animate-spin mr-2" />
            ) : countdown > 0 ? (
              `Renvoyer le code dans (${countdown}s)`
            ) : (
              <>
                <FaRedo className="mr-2" />
                Renvoyer le code
              </>
            )}
          </button>

          {/* Lien Retour */}
          <p className="text-sm text-gray-500">
            <span
              onClick={() => router.push("/login")}
              className={`font-medium cursor-pointer hover:opacity-80 transition duration-200`}
              style={{ color: PRIMARY_BLUE }}
            >
              Code non reçu ou DM incorrect ?
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}

// Composant wrapper avec Suspense
export default function ConfirmOtpPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-cyan-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500 mx-auto"></div>
            <p className="mt-4 text-cyan-600 font-medium">
              Chargement de la vérification...
            </p>
          </div>
        </div>
      }
    >
      <ConfirmOtpContent />
    </Suspense>
  );
}

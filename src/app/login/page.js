"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { FaUserShield, FaSpinner } from "react-icons/fa";
import Swal from "sweetalert2";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
const PRIMARY_BLUE = "#06b6d4";
const ACCENT_GREEN = "#2da442";
const ERROR_RED = "#dc2626";

export default function LoginPage() {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/v1/patient/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ code }),
      });

      const data = await response.json();

      if (response.ok) {
        Swal.fire({
          icon: "success",
          title: "Code OTP Envoyé",
          text:
            data.message ||
            "Le code de vérification a été envoyé par SMS/Email.",
          confirmButtonColor: PRIMARY_BLUE,
        }).then(() => {
          router.push(`/confirm-otp?identifier=${code}`);
        });
      } else {
        const errorMessage =
          data.message || "Identifiant invalide ou non trouvé.";
        Swal.fire({
          icon: "error",
          title: "Erreur de Connexion",
          text: errorMessage,
          confirmButtonColor: ERROR_RED,
        });
      }
    } catch (err) {
      console.error(err);
      Swal.fire({
        icon: "warning",
        title: "Problème Serveur",
        text: "Impossible de se connecter au serveur API. Vérifiez votre connexion.",
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
          className={`absolute inset-0 opacity-80`}
          style={{ backgroundColor: "gray", opacity: 0.5 }}
        ></div>
      </div>

      {/* FORMULAIRE DE CONNEXION */}
      <div className="w-full max-w-lg p-10 space-y-8 bg-white shadow-2xl rounded-2xl border border-gray-100 relative z-10">
        <div className="text-center">
          <FaUserShield
            className={`mx-auto text-6xl mb-4`}
            style={{ color: PRIMARY_BLUE }}
          />
          <h2
            className={`text-4xl font-extrabold`}
            style={{ color: PRIMARY_BLUE }}
          >
            Accès Sécurisé
          </h2>
          <p className="mt-2 text-gray-500 text-lg">
            Veuillez entrer votre DM pour recevoir un code de vérification.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              htmlFor="code"
              className={`block text-sm font-semibold mb-1`}
              style={{ color: PRIMARY_BLUE }}
            >
              Votre DM ...
            </label>
            <input
              id="code"
              name="code"
              type="text"
              required
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className={`mt-1 block w-full px-5 py-3 border rounded-xl shadow-inner 
                           focus:outline-none focus:ring-2 focus:ring-[${ACCENT_GREEN}] focus:border-[${ACCENT_GREEN}]
                           placeholder-gray-400 transition duration-300`}
              style={{ borderColor: PRIMARY_BLUE }}
              placeholder="DM2014562452"
            />
          </div>
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
              "Recevoir le Code OTP"
            )}
          </button>
        </form>

        <div className="text-center text-sm pt-2">
          <p className="text-gray-500">
            <Link
              href="/"
              className={`font-medium hover:opacity-80 transition duration-200`}
              style={{ color: PRIMARY_BLUE }}
            >
              Retour - accueil
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

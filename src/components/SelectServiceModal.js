"use client";

import { useState, useEffect, useRef } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

const SERVICE_ICONS = {
  "urgence": "fa-truck-medical text-red-500",
  "gynécologie-obstétrique": "fa-person-breastfeeding text-pink-500",
  "gynécologie": "fa-person-breastfeeding text-pink-500",
  "consultation générale": "fa-user-doctor text-teal-600",
  "consultation pediatrique": "fa-child text-indigo-500",
  "pédiatrie": "fa-child text-indigo-500",
  "soins infirmier": "fa-user-nurse text-emerald-500",
  "cardiologie": "fa-heart-pulse text-rose-500",
  "default": "fa-stethoscope text-teal-600"
};

const PAYMENT_METHODS = [
  { id: "wave", name: "Wave (Code QR Officiel)", icon: "fa-qrcode text-cyan-500", bg: "bg-cyan-50 border-cyan-300" },
  { id: "orange", name: "Orange Money", icon: "fa-mobile-screen-button text-amber-500", bg: "bg-amber-50 border-amber-300" },
  { id: "mtn", name: "MTN MoMo", icon: "fa-bolt text-yellow-500", bg: "bg-yellow-50 border-yellow-300" },
  { id: "moov", name: "Moov Money", icon: "fa-money-bill-wave text-blue-500", bg: "bg-blue-50 border-blue-300" },
];

export default function SelectServiceModal({ isOpen, onClose, onConfirm, loading, patientPhone = "" }) {
  const [step, setStep] = useState(1); // 1 = Spécialité, 2 = Choix paiement, 3 = Code QR Wave
  const [services, setServices] = useState([]);
  const [selectedServiceId, setSelectedServiceId] = useState(null);
  const [fetchingServices, setFetchingServices] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("wave");
  const [phone, setPhone] = useState(patientPhone || "");
  
  const [waveLaunchUrl, setWaveLaunchUrl] = useState("");
  const [waveSessionId, setWaveSessionId] = useState("");
  const [activeConsultationId, setActiveConsultationId] = useState(null);
  const [fullCallData, setFullCallData] = useState(null);
  const [isVerifyingPayment, setIsVerifyingPayment] = useState(false);
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);
  const [paymentErrorMessage, setPaymentErrorMessage] = useState("");
  const [pendingPaid, setPendingPaid] = useState(null);
  const pollingRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setWaveLaunchUrl("");
      setWaveSessionId("");
      setActiveConsultationId(null);
      setFullCallData(null);
      setPaymentConfirmed(false);
      setPaymentErrorMessage("");
      setPendingPaid(null);
      checkPendingPaid();
      fetchServices();
      if (patientPhone) setPhone(patientPhone);
    } else {
      if (pollingRef.current) clearInterval(pollingRef.current);
    }
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [isOpen, patientPhone]);

  const checkPendingPaid = async () => {
    const token = localStorage.getItem("patient_token");
    if (!token) return;

    try {
      const res = await fetch(`${API_URL}/v1/patient/pending-paid-consultation`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });
      const data = await res.json();
      if (data.has_pending_paid && data.consultation) {
        setPendingPaid(data.consultation);
      } else {
        setPendingPaid(null);
      }
    } catch (err) {
      console.error("Erreur vérification consultation réglée:", err);
    }
  };

  const fetchServices = async () => {
    const token = localStorage.getItem("patient_token");
    if (!token) return;

    try {
      setFetchingServices(true);
      const res = await fetch(`${API_URL}/v1/patient/services`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });
      const data = await res.json();
      if (data.status === "success" && data.services) {
        setServices(data.services);
        if (data.services.length > 0) {
          setSelectedServiceId(data.services[0].id);
        }
      }
    } catch (err) {
      console.error("Erreur lors de la récupération des services :", err);
    } finally {
      setFetchingServices(false);
    }
  };

  const getServiceIcon = (libelle) => {
    const key = (libelle || "").toLowerCase();
    for (const [pattern, iconClass] of Object.entries(SERVICE_ICONS)) {
      if (key.includes(pattern)) return iconClass;
    }
    return SERVICE_ICONS.default;
  };

  const getSelectedService = () => {
    return services.find((serv) => serv.id === selectedServiceId) || null;
  };

  const getSelectedServicePrice = () => {
    const s = getSelectedService();
    return s ? (parseInt(s.prix || s.montant, 10) || 1000) : 1000;
  };

  const formatPrice = (price) => {
    const val = parseInt(price, 10) || 1000;
    return new Intl.NumberFormat('fr-FR').format(val) + " F CFA";
  };

  const handleNextToPayment = () => {
    if (!selectedServiceId && services.length > 0) {
      setSelectedServiceId(services[0].id);
    }
    setStep(2);
  };

  // Lancer la demande et générer la session Wave officielle avec le tarif de la spécialité
  const handleInitiatePayment = async () => {
    const token = localStorage.getItem("patient_token");
    if (!token) return;

    const currentPrice = pendingPaid ? pendingPaid.montant : getSelectedServicePrice();
    const serviceIdToUse = pendingPaid ? pendingPaid.prestation_hospital_id : selectedServiceId;

    try {
      setIsVerifyingPayment(true);
      setPaymentErrorMessage("");
      const res = await fetch(`${API_URL}/v1/patient/online-consultation/request`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          prestation_hospital_id: serviceIdToUse,
          amount: currentPrice,
          payment_method: paymentMethod,
          phone: phone,
        }),
      });

      const data = await res.json();
      if (data.status === "success") {
        if (data.already_paid) {
          // Consultation déjà réglée : relancement sans paiement
          onConfirm(serviceIdToUse, { amount: currentPrice, payment_method: "already_paid", phone }, data);
          return;
        }

        setActiveConsultationId(data.consultation_id);
        setFullCallData(data);
        const launchUrl = data.wave_launch_url || "https://pay.wave.com/c/cos_100_teleconsultation";
        setWaveLaunchUrl(launchUrl);
        setWaveSessionId(data.wave_session_id || "");

        if (paymentMethod === "wave") {
          setStep(3);
          startPaymentPolling(data.consultation_id, data.wave_session_id, data, currentPrice);
        } else {
          // Pour les autres moyens Mobile Money (Orange, MTN, Moov)
          try {
            await fetch(`${API_URL}/v1/patient/verify-wave-payment/${data.consultation_id}`, {
              headers: {
                Authorization: `Bearer ${token}`,
                Accept: "application/json",
              },
            });
          } catch (e) {
            console.warn("Erreur activation consultation Mobile Money:", e);
          }
          onConfirm(selectedServiceId, { amount: currentPrice, payment_method: paymentMethod, phone }, data);
        }
      } else {
        alert(data.message || "Erreur lors de l'initiation du paiement.");
      }
    } catch (err) {
      console.error("Erreur initiation paiement Wave:", err);
      alert("Erreur lors de la communication avec les serveurs de paiement.");
    } finally {
      setIsVerifyingPayment(false);
    }
  };

  // Polling automatique pour vérifier le paiement réel du tarif de la spécialité
  const startPaymentPolling = (consultationId, sessionId, cData, price) => {
    if (pollingRef.current) clearInterval(pollingRef.current);

    pollingRef.current = setInterval(async () => {
      const token = localStorage.getItem("patient_token");
      if (!token || !consultationId) return;

      try {
        const query = sessionId ? `?session_id=${sessionId}` : "";
        const res = await fetch(`${API_URL}/v1/patient/verify-wave-payment/${consultationId}${query}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        });

        if (res.ok) {
          const vData = await res.json();
          if (vData.paid) {
            clearInterval(pollingRef.current);
            setPaymentConfirmed(true);
            setPaymentErrorMessage("");
            setTimeout(() => {
              onConfirm(selectedServiceId, { amount: price, payment_method: "wave", phone }, cData);
            }, 1000);
          }
        }
      } catch (err) {
        console.warn("Polling vérification paiement Wave:", err);
      }
    }, 3000);
  };

  // Vérification manuelle du tarif réel de la spécialité
  const handleManualCheckAndStartCall = async () => {
    const token = localStorage.getItem("patient_token");
    if (!token || !activeConsultationId) return;

    const currentPrice = getSelectedServicePrice();

    try {
      setIsVerifyingPayment(true);
      setPaymentErrorMessage("");
      const query = waveSessionId ? `?session_id=${waveSessionId}` : "";
      const res = await fetch(`${API_URL}/v1/patient/verify-wave-payment/${activeConsultationId}${query}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });

      if (res.ok) {
        const vData = await res.json();
        if (vData.paid) {
          if (pollingRef.current) clearInterval(pollingRef.current);
          setPaymentConfirmed(true);
          setTimeout(() => {
            onConfirm(selectedServiceId, { amount: currentPrice, payment_method: "wave", phone }, fullCallData);
          }, 800);
          return;
        }
      }

      setPaymentErrorMessage(`Le paiement de ${formatPrice(currentPrice)} n'a pas encore été validé sur Wave. Veuillez scanner le code QR avec votre application Wave et valider le règlement.`);
    } catch (err) {
      console.error("Erreur vérification manuelle paiement Wave:", err);
      setPaymentErrorMessage("Impossible de vérifier le statut de paiement Wave pour le moment.");
    } finally {
      setIsVerifyingPayment(false);
    }
  };

  if (!isOpen) return null;

  const currentPrice = getSelectedServicePrice();
  const selectedServiceObj = getSelectedService();
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&margin=8&data=${encodeURIComponent(waveLaunchUrl || "https://pay.wave.com")}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-100 transform transition-all relative">
        
        {/* Header Modal */}
        <div className="bg-gradient-to-r from-teal-600 via-teal-700 to-emerald-600 p-5 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-md shadow-inner">
              <i className="fa-solid fa-headset text-xl text-white"></i>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-lg leading-tight">Téléconsultation en Ligne</h3>
                <span className="bg-emerald-400/20 text-emerald-100 border border-emerald-300/30 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full">
                  {formatPrice(currentPrice)}
                </span>
              </div>
              <p className="text-xs text-teal-100 font-medium">
                {step === 1 && "Étape 1/3 : Sélection de la spécialité"}
                {step === 2 && "Étape 2/3 : Choix du moyen de paiement"}
                {step === 3 && "Étape 3/3 : Validation du paiement réel Wave"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition text-white"
          >
            <i className="fa-solid fa-xmark text-sm"></i>
          </button>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-100 h-1.5 flex">
          <div className={`h-full bg-teal-500 transition-all duration-300 ${step === 1 ? "w-1/3" : step === 2 ? "w-2/3" : "w-full"}`}></div>
        </div>

        {/* Step 1: Choix de la Spécialité ou Relancement d'une Consultation déjà Payée */}
        {step === 1 && (
          <div className="p-6">
            {pendingPaid ? (
              <div className="text-center animate-fade-in py-2">
                <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-3xl flex items-center justify-center mx-auto mb-3.5 border border-emerald-200 shadow-md">
                  <i className="fa-solid fa-shield-check text-3xl text-emerald-600"></i>
                </div>
                
                <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 bg-emerald-50 border border-emerald-200 rounded-full text-emerald-800 text-xs font-extrabold mb-3">
                  <i className="fa-solid fa-lock text-emerald-600"></i>
                  <span>Consultation déjà réglée ({formatPrice(pendingPaid.montant)})</span>
                </div>

                <h3 className="text-xl font-extrabold text-slate-800 mb-1.5">
                  {pendingPaid.motif}
                </h3>

                <p className="text-slate-600 text-xs leading-relaxed max-w-sm mx-auto mb-6 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-left">
                  <i className="fa-solid fa-circle-info text-teal-600 me-1.5"></i>
                  Vous avez déjà réglé <strong className="font-bold text-slate-800">{formatPrice(pendingPaid.montant)}</strong> pour cette téléconsultation. Aucun paiement supplémentaire ne vous sera demandé.
                  <br /><br />
                  <span className="text-slate-500 font-semibold">Le type de consultation reste réservé à la spécialité « {pendingPaid.motif} » jusqu'à la prise en charge par le médecin.</span>
                </p>

                <button
                  type="button"
                  onClick={handleInitiatePayment}
                  disabled={isVerifyingPayment}
                  className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 text-white font-extrabold text-sm shadow-xl shadow-teal-600/30 hover:from-emerald-700 hover:to-cyan-700 transition flex items-center justify-center space-x-2.5 disabled:opacity-50"
                >
                  {isVerifyingPayment ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Relancement de l'appel aux médecins...</span>
                    </>
                  ) : (
                    <>
                      <i className="fa-solid fa-phone-volume text-base animate-bounce"></i>
                      <span>Relancer l'appel aux médecins (Sans frais)</span>
                    </>
                  )}
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm text-slate-700 font-semibold mb-0">
                    Choisissez la spécialité médicale souhaitée :
                  </p>
                </div>

                {fetchingServices ? (
                  <div className="py-12 text-center text-slate-500">
                    <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                    <p className="text-xs font-semibold">Chargement des tarifs des spécialités...</p>
                  </div>
                ) : services.length === 0 ? (
                  <div className="text-center py-8 bg-slate-50 rounded-2xl border border-slate-200">
                    <i className="fa-solid fa-triangle-exclamation text-amber-500 text-2xl mb-2"></i>
                    <p className="text-sm font-semibold text-slate-700">Aucun service spécifique trouvé</p>
                    <p className="text-xs text-slate-500">Une consultation générale sera ouverte par défaut.</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                    {services.map((item) => {
                      const isSelected = selectedServiceId === item.id;
                      const iconClass = getServiceIcon(item.libelle);
                      const priceVal = parseInt(item.prix || item.montant, 10) || 1000;

                      return (
                        <div
                          key={item.id}
                          onClick={() => setSelectedServiceId(item.id)}
                          className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-center justify-between ${
                            isSelected
                              ? "border-teal-500 bg-teal-50/60 shadow-sm"
                              : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                          }`}
                        >
                          <div className="flex items-center space-x-3.5">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isSelected ? "bg-teal-500 text-white shadow-md shadow-teal-500/30" : "bg-slate-100"}`}>
                              <i className={`fa-solid ${isSelected ? "fa-stethoscope text-white" : iconClass} text-lg`}></i>
                            </div>
                            <div>
                              <h4 className="font-bold text-slate-800 text-sm">{item.libelle}</h4>
                              <span className="text-xs text-slate-500 block">{item.service || "Médecine générale"}</span>
                            </div>
                          </div>
                          <div className="flex items-center space-x-3">
                            <span className="text-xs font-black text-teal-700 bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-200 shadow-2xs">
                              {formatPrice(priceVal)}
                            </span>
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${isSelected ? "border-teal-600 bg-teal-600" : "border-slate-300"}`}>
                              {isSelected && <i className="fa-solid fa-check text-white text-[10px]"></i>}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Step 2: Choix du Moyen de Paiement */}
        {step === 2 && (
          <div className="p-6">
            <div className="bg-gradient-to-r from-slate-900 to-teal-950 text-white rounded-2xl p-4 mb-5 shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 transform translate-x-3 -translate-y-3 w-24 h-24 bg-teal-500/10 rounded-full blur-xl"></div>
              <div className="flex justify-between items-center relative z-10">
                <div>
                  <span className="text-[10px] text-teal-300 uppercase tracking-wider font-bold">Récapitulatif commande</span>
                  <h4 className="font-bold text-base text-white">{selectedServiceObj ? selectedServiceObj.libelle : "Téléconsultation"}</h4>
                  <p className="text-xs text-slate-300 mb-0">Paiement obligatoire avant la mise en relation avec le médecin</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-teal-300 block font-semibold">Tarif spécialité</span>
                  <span className="text-xl md:text-2xl font-black text-emerald-400 tracking-tight">
                    {formatPrice(currentPrice)}
                  </span>
                </div>
              </div>
            </div>

            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Choisissez votre moyen de paiement :
            </label>
            <div className="grid grid-cols-2 gap-2.5 mb-4">
              {PAYMENT_METHODS.map((m) => {
                const isChecked = paymentMethod === m.id;
                return (
                  <div
                    key={m.id}
                    onClick={() => setPaymentMethod(m.id)}
                    className={`p-3 rounded-xl border-2 cursor-pointer transition-all flex items-center space-x-2.5 ${
                      isChecked
                        ? "border-teal-500 bg-teal-50/80 shadow-sm"
                        : "border-slate-200 bg-white hover:border-slate-300"
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${m.bg}`}>
                      <i className={`fa-solid ${m.icon} text-base`}></i>
                    </div>
                    <span className="font-bold text-xs text-slate-800">{m.name}</span>
                  </div>
                );
              })}
            </div>

            {paymentMethod === "wave" ? (
              <div className="bg-cyan-50 border border-cyan-200 rounded-2xl p-4 text-center">
                <div className="w-12 h-12 bg-cyan-500 text-white rounded-2xl flex items-center justify-center mx-auto mb-2.5 shadow-md shadow-cyan-500/30">
                  <i className="fa-solid fa-qrcode text-2xl"></i>
                </div>
                <h4 className="font-bold text-sm text-cyan-900 mb-1">Paiement Wave de {formatPrice(currentPrice)}</h4>
                <p className="text-xs text-cyan-700 leading-relaxed mb-0">
                  Cliquez sur <strong className="font-bold">« Générer le Code QR Wave »</strong>. L'appel ne sera transmis aux médecins qu'après la validation réelle du débit de <strong className="font-bold">{formatPrice(currentPrice)}</strong> sur Wave.
                </p>
              </div>
            ) : (
              <div className="mb-4">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Numéro de téléphone ({paymentMethod.toUpperCase()}) :
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Ex: 0700000000"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                    <i className="fa-solid fa-lock text-emerald-500 me-1"></i> Sécurisé
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 3: Affichage du Code QR Wave Officiel avec le Prix de la Spécialité */}
        {step === 3 && (
          <div className="p-6 text-center animate-fade-in">
            {paymentConfirmed ? (
              <div className="py-8">
                <div className="w-20 h-20 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce shadow-xl shadow-emerald-500/30">
                  <i className="fa-solid fa-check text-4xl"></i>
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-1">Paiement de {formatPrice(currentPrice)} Validé !</h3>
                <p className="text-xs text-slate-500">Validation Wave reçue. Transmission de votre appel aux médecins disponibles...</p>
              </div>
            ) : (
              <>
                <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 bg-cyan-100 border border-cyan-300 rounded-full text-cyan-900 text-xs font-bold mb-3">
                  <span className="w-2 h-2 rounded-full bg-cyan-600 animate-ping"></span>
                  <span>Scanner avec Wave pour régler {formatPrice(currentPrice)}</span>
                </div>

                <div className="bg-gradient-to-b from-white to-cyan-50/60 p-5 rounded-3xl border-2 border-cyan-300 shadow-xl max-w-xs mx-auto relative mb-3">
                  {/* Badge Montant Spécialité */}
                  <div className="bg-gradient-to-r from-cyan-600 to-teal-600 text-white font-extrabold text-xs px-3.5 py-1 rounded-full shadow-md mb-2.5 inline-block">
                    {selectedServiceObj ? selectedServiceObj.libelle : "Téléconsultation"} : {formatPrice(currentPrice)}
                  </div>

                  {/* QR Code Image */}
                  <div className="bg-white p-2.5 rounded-2xl shadow-inner border border-slate-200 inline-block mb-2 relative">
                    <img
                      src={qrImageUrl}
                      alt={`Code QR Wave ${formatPrice(currentPrice)}`}
                      className="w-52 h-52 mx-auto object-contain rounded-lg"
                    />
                  </div>

                  <div className="flex items-center justify-center space-x-2 text-xs text-cyan-800 font-bold bg-cyan-50/80 py-1.5 px-3 rounded-full border border-cyan-200">
                    <div className="w-3 h-3 border-2 border-cyan-600 border-t-transparent rounded-full animate-spin"></div>
                    <span>Attente du paiement de {formatPrice(currentPrice)}...</span>
                  </div>
                </div>

                {paymentErrorMessage && (
                  <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold p-3 rounded-xl mb-3 max-w-sm mx-auto flex items-center space-x-2 text-left">
                    <i className="fa-solid fa-circle-exclamation text-rose-500 text-base flex-shrink-0"></i>
                    <span>{paymentErrorMessage}</span>
                  </div>
                )}

                {/* Bouton d'accès direct sur mobile */}
                {waveLaunchUrl && (
                  <div className="mb-3">
                    <a
                      href={waveLaunchUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center space-x-2 text-xs font-bold text-cyan-700 hover:text-cyan-800 underline bg-cyan-50 px-3 py-1.5 rounded-lg border border-cyan-200"
                    >
                      <i className="fa-solid fa-arrow-up-right-from-square"></i>
                      <span>Ouvrir directement dans l'application Wave</span>
                    </a>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          {step === 1 && (
            <>
              <button
                type="button"
                onClick={onClose}
                disabled={loading || isVerifyingPayment}
                className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-sm font-semibold hover:bg-slate-100 transition"
              >
                {pendingPaid ? "Fermer" : "Annuler"}
              </button>
              {!pendingPaid && (
                <button
                  type="button"
                  onClick={handleNextToPayment}
                  disabled={loading || fetchingServices || isVerifyingPayment}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 text-white text-sm font-bold shadow-lg shadow-teal-600/30 hover:from-teal-700 hover:to-emerald-700 transition flex items-center space-x-2 disabled:opacity-50"
                >
                  <span>Payer {formatPrice(currentPrice)} & Continuer</span>
                  <i className="fa-solid fa-arrow-right"></i>
                </button>
              )}
            </>
          )}

          {step === 2 && (
            <>
              <button
                type="button"
                onClick={() => setStep(1)}
                disabled={loading || isVerifyingPayment}
                className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-sm font-semibold hover:bg-slate-100 transition flex items-center space-x-1.5"
              >
                <i className="fa-solid fa-arrow-left text-xs"></i>
                <span>Retour</span>
              </button>
              <button
                type="button"
                onClick={handleInitiatePayment}
                disabled={loading || isVerifyingPayment}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 via-teal-600 to-emerald-600 hover:from-cyan-600 hover:to-emerald-700 text-white text-sm font-extrabold shadow-lg shadow-cyan-500/30 transition flex items-center space-x-2 disabled:opacity-50"
              >
                {isVerifyingPayment ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Connexion Wave API...</span>
                  </>
                ) : paymentMethod === "wave" ? (
                  <>
                    <i className="fa-solid fa-qrcode text-base"></i>
                    <span>Générer le Code QR Wave ({formatPrice(currentPrice)})</span>
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-lock"></i>
                    <span>Payer {formatPrice(currentPrice)} & Lancer l'Appel</span>
                  </>
                )}
              </button>
            </>
          )}

          {step === 3 && (
            <>
              <button
                type="button"
                onClick={() => {
                  if (pollingRef.current) clearInterval(pollingRef.current);
                  setStep(2);
                }}
                disabled={loading || paymentConfirmed || isVerifyingPayment}
                className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-sm font-semibold hover:bg-slate-100 transition flex items-center space-x-1.5"
              >
                <i className="fa-solid fa-arrow-left text-xs"></i>
                <span>Changer de mode</span>
              </button>
              <button
                type="button"
                onClick={handleManualCheckAndStartCall}
                disabled={loading || paymentConfirmed || isVerifyingPayment}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-600 to-cyan-600 hover:from-emerald-600 hover:to-cyan-700 text-white text-sm font-extrabold shadow-lg shadow-emerald-500/30 transition flex items-center space-x-2 disabled:opacity-50"
              >
                {isVerifyingPayment ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Vérification Wave en cours...</span>
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-shield-check"></i>
                    <span>Vérifier le paiement ({formatPrice(currentPrice)}) & Lancer</span>
                  </>
                )}
              </button>
            </>
          )}
        </div>

      </div>
    </div>
  );
}

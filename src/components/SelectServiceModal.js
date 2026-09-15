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
  { id: "wave", name: "Wave", logo: "/images/payments/wave.png", bg: "bg-cyan-50 border-cyan-300" },
  { id: "orange", name: "Orange Money", logo: "/images/payments/orange.png", bg: "bg-amber-50 border-amber-300" },
  { id: "mtn", name: "MTN MoMo", logo: "/images/payments/mtn.png", bg: "bg-yellow-50 border-yellow-300" },
  { id: "moov", name: "Moov Money", logo: "/images/payments/moov.png", bg: "bg-blue-50 border-blue-300" },
];

export default function SelectServiceModal({ isOpen, onClose, onConfirm, loading, patientPhone = "" }) {
  // Steps: 
  // 1 = Choix de l'Hôpital
  // 2 = Date & Heure souhaitées + Spécialité
  // 3 = Moyen de Paiement
  // 4 = Ecran d'exécution du paiement (Code QR Wave ou Mobile Money USSD)
  // 5 = Confirmation Finale (Succès)
  const [step, setStep] = useState(1);
  
  const [hospitals, setHospitals] = useState([]);
  const [selectedHospitalId, setSelectedHospitalId] = useState(null);
  const [fetchingHospitals, setFetchingHospitals] = useState(false);

  const [services, setServices] = useState([]);
  const [selectedServiceId, setSelectedServiceId] = useState(null);
  const [fetchingServices, setFetchingServices] = useState(false);

  // Date et heure d'appel souhaitée
  const todayStr = new Date().toISOString().split("T")[0];
  const nowTimeStr = new Date().toTimeString().split(" ")[0].substring(0, 5);
  const [desiredDate, setDesiredDate] = useState(todayStr);
  const [desiredTime, setDesiredTime] = useState(nowTimeStr);

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
      
      const tStr = new Date().toISOString().split("T")[0];
      const nStr = new Date().toTimeString().split(" ")[0].substring(0, 5);
      setDesiredDate(tStr);
      setDesiredTime(nStr);

      checkPendingPaid();
      fetchHospitals();
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

  const fetchHospitals = async () => {
    const token = localStorage.getItem("patient_token");
    if (!token) return;

    try {
      setFetchingHospitals(true);
      const res = await fetch(`${API_URL}/v1/patient/hospitals`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });
      const data = await res.json();
      if (data.status === "success" && data.hospitals) {
        setHospitals(data.hospitals);
        if (data.hospitals.length > 0) {
          setSelectedHospitalId(data.hospitals[0].id);
        }
      }
    } catch (err) {
      console.error("Erreur chargement hôpitaux:", err);
    } finally {
      setFetchingHospitals(false);
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

  const getSelectedHospital = () => {
    return hospitals.find((h) => h.id === selectedHospitalId) || null;
  };

  const getHospitalName = () => {
    if (pendingPaid && pendingPaid.hospital_name) return pendingPaid.hospital_name;
    if (fullCallData && fullCallData.hospital_name) return fullCallData.hospital_name;
    const h = getSelectedHospital();
    if (h) return h.nom || h.name || "Hôpital";
    return "Hôpital";
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

  const handleNextToDateTime = () => {
    if (!selectedHospitalId && hospitals.length > 0) {
      setSelectedHospitalId(hospitals[0].id);
    }
    setStep(2);
  };

  const handleNextToPayment = () => {
    if (!selectedServiceId && services.length > 0) {
      setSelectedServiceId(services[0].id);
    }
    setStep(3);
  };

  // Lancer la demande et générer la session de paiement
  const handleInitiatePayment = async () => {
    const token = localStorage.getItem("patient_token");
    if (!token) return;

    if (paymentMethod !== "wave" && !phone) {
      alert("Veuillez saisir votre numéro de téléphone pour le paiement Mobile Money.");
      return;
    }

    const currentPrice = pendingPaid ? pendingPaid.montant : getSelectedServicePrice();
    const serviceIdToUse = pendingPaid ? pendingPaid.prestation_hospital_id : selectedServiceId;
    const hospitalIdToUse = pendingPaid ? pendingPaid.hospital_id : selectedHospitalId;

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
          hospital_id: hospitalIdToUse,
          desired_date: desiredDate,
          desired_time: desiredTime,
          amount: currentPrice,
          payment_method: paymentMethod,
          phone: phone,
        }),
      });

      const data = await res.json();
      if (data.status === "success") {
        if (data.already_paid) {
          setStep(5);
          onConfirm(serviceIdToUse, { amount: currentPrice, payment_method: "already_paid", phone }, data);
          return;
        }

        setActiveConsultationId(data.consultation_id);
        setFullCallData(data);
        const launchUrl = data.wave_launch_url || "https://pay.wave.com/c/cos_100_teleconsultation";
        setWaveLaunchUrl(launchUrl);
        setWaveSessionId(data.wave_session_id || "");

        // Passer à l'étape 4 d'exécution du paiement
        setStep(4);

        if (paymentMethod === "wave") {
          startPaymentPolling(data.consultation_id, data.wave_session_id, data, currentPrice);
        }
      } else {
        alert(data.message || "Erreur lors de l'initiation du paiement.");
      }
    } catch (err) {
      console.error("Erreur initiation paiement:", err);
      alert("Erreur lors de la communication avec les serveurs de paiement.");
    } finally {
      setIsVerifyingPayment(false);
    }
  };

  // Polling automatique pour vérifier le paiement Wave
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
            setStep(5);
            onConfirm(selectedServiceId, { amount: price, payment_method: "wave", phone }, cData);
          }
        }
      } catch (err) {
        console.warn("Polling vérification paiement Wave:", err);
      }
    }, 3000);
  };

  // Confirmation du paiement par le patient (Valider son règlement)
  const handleConfirmPatientPayment = async () => {
    const token = localStorage.getItem("patient_token");
    if (!token || !activeConsultationId) return;

    const currentPrice = getSelectedServicePrice();

    try {
      setIsVerifyingPayment(true);
      setPaymentErrorMessage("");
      const query = waveSessionId ? `?session_id=${waveSessionId}&confirm=1` : "?confirm=1";
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
          setStep(5);
          onConfirm(selectedServiceId, { amount: currentPrice, payment_method: paymentMethod, phone }, fullCallData);
          return;
        }
      }

      setPaymentErrorMessage("Le paiement n'a pas pu être validé. Veuillez réessayer.");
    } catch (err) {
      console.error("Erreur vérification paiement:", err);
      setPaymentErrorMessage("Impossible de valider le paiement pour le moment.");
    } finally {
      setIsVerifyingPayment(false);
    }
  };

  if (!isOpen) return null;

  const currentPrice = getSelectedServicePrice();
  const selectedHospitalObj = getSelectedHospital();
  const selectedServiceObj = getSelectedService();
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&margin=8&data=${encodeURIComponent(waveLaunchUrl || "https://pay.wave.com")}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-100 transform transition-all relative">
        
        {/* Header Modal */}
        <div className="bg-gradient-to-r from-teal-600 via-teal-700 to-emerald-600 p-5 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-md shadow-inner">
              <i className="fa-solid fa-hospital-user text-xl text-white"></i>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-lg leading-tight">Demande de Téléconsultation</h3>
                <span className="bg-emerald-400/20 text-emerald-100 border border-emerald-300/30 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full">
                  {formatPrice(currentPrice)}
                </span>
              </div>
              <p className="text-xs text-teal-100 font-medium">
                {step === 1 && "Étape 1/4 : Sélection de l'hôpital"}
                {step === 2 && "Étape 2/4 : Date & Heure souhaitées"}
                {step === 3 && "Étape 3/4 : Choix du paiement"}
                {step === 4 && "Étape 4/4 : Validation du règlement"}
                {step === 5 && "Transmission confirmée aux médecins"}
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
          <div className={`h-full bg-teal-500 transition-all duration-300 ${
            step === 1 ? "w-1/4" : step === 2 ? "w-2/4" : step === 3 ? "w-3/4" : "w-full"
          }`}></div>
        </div>

        {/* Step 1: Choix de l'Hôpital */}
        {step === 1 && (
          <div className="p-6">
            {pendingPaid ? (
              <div className="text-center animate-fade-in py-2">
                <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-3xl flex items-center justify-center mx-auto mb-3.5 border border-emerald-200 shadow-md">
                  <i className="fa-solid fa-shield-halved text-3xl text-emerald-600"></i>
                </div>
                
                <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 bg-emerald-50 border border-emerald-200 rounded-full text-emerald-800 text-xs font-extrabold mb-3">
                  <i className="fa-solid fa-lock text-emerald-600"></i>
                  <span>Consultation déjà réglée ({formatPrice(pendingPaid.montant)})</span>
                </div>

                <h3 className="text-lg font-extrabold text-slate-800 mb-1">
                  {pendingPaid.motif}
                </h3>
                <p className="text-xs text-teal-700 font-bold mb-3">
                  <i className="fa-solid fa-hospital me-1"></i> {pendingPaid.hospital_name || 'Hôpital sélectionné'}
                </p>

                <p className="text-slate-600 text-xs leading-relaxed max-w-sm mx-auto mb-6 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-left">
                  <i className="fa-solid fa-circle-info text-teal-600 me-1.5"></i>
                  Vous avez déjà réglé <strong className="font-bold text-slate-800">{formatPrice(pendingPaid.montant)}</strong> pour cette téléconsultation. 
                  <br /><br />
                  <span className="text-slate-700 font-semibold">Votre demande est transmise aux médecins généralistes de {pendingPaid.hospital_name || 'l\'hôpital'}.</span>
                </p>

                <button
                  type="button"
                  onClick={() => setStep(5)}
                  className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 text-white font-extrabold text-sm shadow-xl shadow-teal-600/30 hover:from-emerald-700 hover:to-cyan-700 transition flex items-center justify-center space-x-2.5"
                >
                  <i className="fa-solid fa-circle-check text-base"></i>
                  <span>Voir le récapitulatif de ma demande</span>
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm text-slate-700 font-bold mb-0 flex items-center space-x-2">
                    <i className="fa-solid fa-hospital text-teal-600"></i>
                    <span>Choisissez l'hôpital de consultation :</span>
                  </p>
                </div>

                {fetchingHospitals ? (
                  <div className="py-12 text-center text-slate-500">
                    <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                    <p className="text-xs font-semibold">Chargement des hôpitaux disponibles...</p>
                  </div>
                ) : hospitals.length === 0 ? (
                  <div className="text-center py-8 bg-slate-50 rounded-2xl border border-slate-200">
                    <i className="fa-solid fa-hospital text-slate-400 text-3xl mb-2"></i>
                    <p className="text-sm font-semibold text-slate-700">Aucun hôpital disponible</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                    {hospitals.map((h) => {
                      const isSelected = selectedHospitalId === h.id;

                      return (
                        <div
                          key={h.id}
                          onClick={() => setSelectedHospitalId(h.id)}
                          className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-center justify-between ${
                            isSelected
                              ? "border-teal-500 bg-teal-50/60 shadow-sm"
                              : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                          }`}
                        >
                          <div className="flex items-center space-x-3.5">
                            <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${isSelected ? "bg-teal-600 text-white shadow-md shadow-teal-600/30" : "bg-slate-100 text-slate-600"}`}>
                              {h.photo ? (
                                <img src={h.photo} alt={h.nom} className="w-full h-full object-cover rounded-xl" />
                              ) : (
                                <i className="fa-solid fa-hospital text-lg"></i>
                              )}
                            </div>
                            <div>
                              <h4 className="font-bold text-slate-800 text-sm">{h.nom}</h4>
                              <span className="text-xs text-slate-500 block">
                                <i className="fa-solid fa-location-dot me-1 text-slate-400"></i> {h.district || "Abidjan"}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${isSelected ? "border-teal-600 bg-teal-600" : "border-slate-300"}`}>
                              {isSelected && <i className="fa-solid fa-check text-white text-xs"></i>}
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

        {/* Step 2: Date & Heure souhaitées + Spécialité */}
        {step === 2 && (
          <div className="p-6 space-y-4">
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                <i className="fa-regular fa-calendar-check text-teal-600 me-1.5"></i>
                Date et heure d'appel souhaitées :
              </label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-[11px] text-slate-500 font-semibold block mb-1">Date souhaitée</span>
                  <input
                    type="date"
                    min={todayStr}
                    value={desiredDate}
                    onChange={(e) => setDesiredDate(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-800 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <span className="text-[11px] text-slate-500 font-semibold block mb-1">Heure souhaitée</span>
                  <input
                    type="time"
                    value={desiredTime}
                    onChange={(e) => setDesiredTime(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-800 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                <i className="fa-solid fa-stethoscope text-teal-600 me-1.5"></i>
                Spécialité / Motif de consultation :
              </label>

              {fetchingServices ? (
                <div className="py-8 text-center text-slate-500">
                  <div className="w-6 h-6 border-3 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                  <p className="text-xs font-semibold">Chargement des tarifs...</p>
                </div>
              ) : (
                <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                  {services.map((item) => {
                    const isSelected = selectedServiceId === item.id;
                    const iconClass = getServiceIcon(item.libelle);
                    const priceVal = parseInt(item.prix || item.montant, 10) || 1000;

                    return (
                      <div
                        key={item.id}
                        onClick={() => setSelectedServiceId(item.id)}
                        className={`p-3 rounded-xl border-2 cursor-pointer transition-all flex items-center justify-between ${
                          isSelected
                            ? "border-teal-500 bg-teal-50/60 shadow-sm"
                            : "border-slate-200 bg-white hover:border-slate-300"
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isSelected ? "bg-teal-500 text-white" : "bg-slate-100"}`}>
                            <i className={`fa-solid ${isSelected ? "fa-stethoscope" : iconClass} text-sm`}></i>
                          </div>
                          <div>
                            <h4 className="font-bold text-slate-800 text-xs">{item.libelle}</h4>
                            <span className="text-[10px] text-slate-500">{item.service || "Médecine générale"}</span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-black text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200">
                            {formatPrice(priceVal)}
                          </span>
                          <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${isSelected ? "border-teal-600 bg-teal-600" : "border-slate-300"}`}>
                            {isSelected && <i className="fa-solid fa-check text-white text-[8px]"></i>}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 3: Choix du Moyen de Paiement */}
        {step === 3 && (
          <div className="p-6">
            <div className="bg-gradient-to-r from-slate-900 to-teal-950 text-white rounded-2xl p-4 mb-4 shadow-lg relative overflow-hidden">
              <div className="flex justify-between items-center relative z-10">
                <div>
                  <span className="text-[10px] text-teal-300 uppercase tracking-wider font-bold">Récapitulatif</span>
                  <h4 className="font-bold text-sm text-white">{selectedServiceObj ? selectedServiceObj.libelle : "Téléconsultation"}</h4>
                  <p className="text-xs text-teal-200 mb-0 font-medium">
                    <i className="fa-solid fa-hospital me-1"></i> {selectedHospitalObj ? selectedHospitalObj.nom : "Hôpital"}
                  </p>
                  <p className="text-[11px] text-slate-300 mb-0 mt-0.5">
                    <i className="fa-regular fa-clock me-1 text-teal-400"></i> Appel souhaité le {desiredDate} à {desiredTime}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-teal-300 block font-semibold">Montant à régler</span>
                  <span className="text-xl font-black text-emerald-400 tracking-tight">
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
                    <div className={`w-9 h-9 rounded-lg overflow-hidden flex items-center justify-center bg-white p-0.5 border ${isChecked ? "border-teal-400 shadow-sm" : "border-slate-200"}`}>
                      <img src={m.logo} alt={m.name} className="w-full h-full object-contain rounded-md" />
                    </div>
                    <span className="font-bold text-xs text-slate-800">{m.name}</span>
                  </div>
                );
              })}
            </div>

            {paymentMethod === "wave" ? (
              <div className="bg-cyan-50 border border-cyan-200 rounded-2xl p-3.5 text-center">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center mx-auto mb-2 shadow-sm border border-cyan-200 overflow-hidden p-1">
                  <img src="/images/payments/wave.png" alt="Wave" className="w-full h-full object-contain rounded-lg" />
                </div>
                <h4 className="font-bold text-xs text-cyan-900 mb-1">Paiement Wave de {formatPrice(currentPrice)}</h4>
                <p className="text-[11px] text-cyan-700 leading-relaxed mb-0">
                  Après le règlement, votre demande sera directement transmise aux médecins généralistes de <strong className="font-bold">{selectedHospitalObj ? selectedHospitalObj.nom : "l'hôpital"}</strong>.
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

        {/* Step 4: Ecran d'exécution du paiement (Code QR Wave ou Mobile Money USSD) */}
        {step === 4 && (
          <div className="p-6 text-center animate-fade-in">
            {paymentConfirmed ? (
              <div className="py-8">
                <div className="w-20 h-20 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce shadow-xl shadow-emerald-500/30">
                  <i className="fa-solid fa-check text-4xl"></i>
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-1">Paiement de {formatPrice(currentPrice)} Validé !</h3>
                <p className="text-xs text-slate-500">Transmission de votre demande aux médecins généralistes de l'hôpital...</p>
              </div>
            ) : paymentMethod === "wave" ? (
              <>
                <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 bg-cyan-100 border border-cyan-300 rounded-full text-cyan-900 text-xs font-bold mb-3">
                  <span className="w-2 h-2 rounded-full bg-cyan-600 animate-ping"></span>
                  <span>Scanner avec Wave pour régler {formatPrice(currentPrice)}</span>
                </div>

                <div className="bg-gradient-to-b from-white to-cyan-50/60 p-4 rounded-3xl border-2 border-cyan-300 shadow-xl max-w-xs mx-auto relative mb-3">
                  <div className="bg-gradient-to-r from-cyan-600 to-teal-600 text-white font-extrabold text-xs px-3 py-1 rounded-full shadow-md mb-2 inline-block">
                    {selectedServiceObj ? selectedServiceObj.libelle : "Téléconsultation"} : {formatPrice(currentPrice)}
                  </div>

                  <div className="bg-white p-2 rounded-2xl shadow-inner border border-slate-200 inline-block mb-2 relative">
                    <img
                      src={qrImageUrl}
                      alt={`Code QR Wave ${formatPrice(currentPrice)}`}
                      className="w-48 h-48 mx-auto object-contain rounded-lg"
                    />
                  </div>

                  <div className="flex items-center justify-center space-x-2 text-xs text-cyan-800 font-bold bg-cyan-50/80 py-1.5 px-3 rounded-full border border-cyan-200">
                    <div className="w-3 h-3 border-2 border-cyan-600 border-t-transparent rounded-full animate-spin"></div>
                    <span>En attente de validation Wave...</span>
                  </div>
                </div>

                {paymentErrorMessage && (
                  <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold p-3 rounded-xl mb-3 max-w-sm mx-auto flex items-center space-x-2 text-left">
                    <i className="fa-solid fa-circle-exclamation text-rose-500 text-base flex-shrink-0"></i>
                    <span>{paymentErrorMessage}</span>
                  </div>
                )}

                {waveLaunchUrl && (
                  <div className="mb-3">
                    <a
                      href={waveLaunchUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center space-x-2 text-xs font-bold text-cyan-700 hover:text-cyan-800 underline bg-cyan-50 px-3 py-1.5 rounded-lg border border-cyan-200"
                    >
                      <i className="fa-solid fa-arrow-up-right-from-square"></i>
                      <span>Ouvrir dans l'application Wave</span>
                    </a>
                  </div>
                )}
              </>
            ) : (
              /* Ecran d'exécution du paiement Mobile Money (Orange / MTN / Moov) */
              <div className="py-2 max-w-sm mx-auto">
                <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-3xl flex items-center justify-center mx-auto mb-3 border border-amber-200 shadow-md">
                  <i className="fa-solid fa-mobile-screen-button text-3xl"></i>
                </div>

                <div className="inline-flex items-center space-x-2 px-3 py-1 bg-amber-50 border border-amber-300 rounded-full text-amber-900 text-xs font-bold mb-3">
                  <span>Paiement {paymentMethod.toUpperCase()} ({formatPrice(currentPrice)})</span>
                </div>

                <h4 className="font-extrabold text-slate-800 text-sm mb-2">
                  Validation du paiement sur le {phone || "numéro indiqué"}
                </h4>

                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-left text-xs space-y-2 mb-5">
                  <p className="text-slate-700 font-semibold mb-1">
                    <i className="fa-solid fa-bell text-amber-500 me-1.5"></i>
                    Une demande de débit de <strong className="text-slate-900 font-bold">{formatPrice(currentPrice)}</strong> a été envoyée sur votre téléphone.
                  </p>
                  <p className="text-slate-500 text-[11px] mb-0">
                    Veuillez composer votre code secret Mobile Money sur votre téléphone pour valider la transaction, puis cliquez sur le bouton ci-dessous pour confirmer.
                  </p>
                </div>

                {paymentErrorMessage && (
                  <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold p-3 rounded-xl mb-3 flex items-center space-x-2 text-left">
                    <i className="fa-solid fa-circle-exclamation text-rose-500 text-base flex-shrink-0"></i>
                    <span>{paymentErrorMessage}</span>
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleConfirmPatientPayment}
                  disabled={isVerifyingPayment}
                  className="w-full py-3.5 px-5 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 text-white font-extrabold text-xs shadow-xl shadow-emerald-600/30 hover:from-emerald-700 hover:to-cyan-700 transition flex items-center justify-center space-x-2 disabled:opacity-50"
                >
                  {isVerifyingPayment ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Vérification du règlement...</span>
                    </>
                  ) : (
                    <>
                      <i className="fa-solid fa-circle-check text-base"></i>
                      <span>J'ai validé le paiement sur mon téléphone</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Step 5: Confirmation Finale et Récapitulatif */}
        {step === 5 && (
          <div className="p-6 text-center animate-fade-in">
            <div className="w-16 h-16 bg-emerald-500 text-white rounded-3xl flex items-center justify-center mx-auto mb-3.5 shadow-lg shadow-emerald-500/30">
              <i className="fa-solid fa-circle-check text-3xl"></i>
            </div>

            <h3 className="text-xl font-extrabold text-slate-800 mb-1">
              Demande transmise avec succès !
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Votre demande de téléconsultation a été enregistrée et payée.
            </p>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-left space-y-2.5 mb-5 text-xs">
              <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                <span className="text-slate-500 font-medium">Hôpital sélectionné :</span>
                <span className="font-bold text-slate-800">
                  <i className="fa-solid fa-hospital text-teal-600 me-1"></i>
                  {getHospitalName()}
                </span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                <span className="text-slate-500 font-medium">Créneau d'appel souhaité :</span>
                <span className="font-bold text-teal-700">
                  <i className="fa-regular fa-calendar-check me-1"></i>
                  Le {desiredDate} à {desiredTime}
                </span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                <span className="text-slate-500 font-medium">Spécialité / Motif :</span>
                <span className="font-bold text-slate-800">
                  {selectedServiceObj ? selectedServiceObj.libelle : "Téléconsultation"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Destinataires :</span>
                <span className="font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                  <i className="fa-solid fa-user-doctor me-1"></i> Médecins de {getHospitalName()}
                </span>
              </div>
            </div>

            <p className="text-[11px] text-slate-600 leading-relaxed bg-teal-50 p-3 rounded-xl border border-teal-200 text-center mb-5">
              <i className="fa-solid fa-circle-info text-teal-600 me-1"></i>
              Un médecin généraliste de <strong>{getHospitalName()}</strong> examinera votre dossier et vous contactera au créneau convenu.
            </p>

            <button
              type="button"
              onClick={onClose}
              className="w-full py-3 px-5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs transition"
            >
              Fermer et retourner au tableau de bord
            </button>
          </div>
        )}

        {/* Footer Actions */}
        {step < 5 && (
          <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
            {step === 1 && (
              <>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-sm font-semibold hover:bg-slate-100 transition"
                >
                  Annuler
                </button>
                {!pendingPaid && (
                  <button
                    type="button"
                    onClick={handleNextToDateTime}
                    disabled={fetchingHospitals || hospitals.length === 0}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 text-white text-sm font-bold shadow-lg shadow-teal-600/30 hover:from-teal-700 hover:to-emerald-700 transition flex items-center space-x-2 disabled:opacity-50"
                  >
                    <span>Continuer</span>
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
                  className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-sm font-semibold hover:bg-slate-100 transition flex items-center space-x-1.5"
                >
                  <i className="fa-solid fa-arrow-left text-xs"></i>
                  <span>Retour</span>
                </button>
                <button
                  type="button"
                  onClick={handleNextToPayment}
                  disabled={fetchingServices || !desiredDate || !desiredTime}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 text-white text-sm font-bold shadow-lg shadow-teal-600/30 hover:from-teal-700 hover:to-emerald-700 transition flex items-center space-x-2 disabled:opacity-50"
                >
                  <span>Payer {formatPrice(currentPrice)} & Valider</span>
                  <i className="fa-solid fa-arrow-right"></i>
                </button>
              </>
            )}

            {step === 3 && (
              <>
                <button
                  type="button"
                  onClick={() => setStep(2)}
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
                      <span>Paiement en cours...</span>
                    </>
                  ) : paymentMethod === "wave" ? (
                    <>
                      <i className="fa-solid fa-qrcode text-base"></i>
                      <span>Générer le Code QR ({formatPrice(currentPrice)})</span>
                    </>
                  ) : (
                    <>
                      <i className="fa-solid fa-mobile-screen-button text-base"></i>
                      <span>Effectuer le règlement ({formatPrice(currentPrice)})</span>
                    </>
                  )}
                </button>
              </>
            )}

            {step === 4 && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    if (pollingRef.current) clearInterval(pollingRef.current);
                    setStep(3);
                  }}
                  disabled={loading || paymentConfirmed || isVerifyingPayment}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-sm font-semibold hover:bg-slate-100 transition flex items-center space-x-1.5"
                >
                  <i className="fa-solid fa-arrow-left text-xs"></i>
                  <span>Changer de mode</span>
                </button>

                {paymentMethod === "wave" && (
                  <button
                    type="button"
                    onClick={handleConfirmPatientPayment}
                    disabled={loading || paymentConfirmed || isVerifyingPayment}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-600 to-cyan-600 hover:from-emerald-600 hover:to-cyan-700 text-white text-sm font-extrabold shadow-lg shadow-emerald-500/30 transition flex items-center space-x-2 disabled:opacity-50"
                  >
                    {isVerifyingPayment ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Vérification...</span>
                      </>
                    ) : (
                      <>
                        <i className="fa-solid fa-circle-check"></i>
                        <span>Vérifier le paiement</span>
                      </>
                    )}
                  </button>
                )}
              </>
            )}
          </div>
        )}

      </div>
    </div>
  );
}

"use client";

import { useState, useEffect, useRef } from "react";
import { FaVideo, FaPhoneSlash, FaMicrophone, FaMicrophoneSlash, FaVideoSlash } from "react-icons/fa";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

export default function IncomingCallModal() {
  const [activeCall, setActiveCall] = useState(null);
  const [isInCall, setIsInCall] = useState(false);
  const [micMuted, setMicMuted] = useState(false);
  const [camOff, setCamOff] = useState(false);
  const [duration, setDuration] = useState(0);
  const [waitingTime, setWaitingTime] = useState(0);

  const livekitRoomRef = useRef(null);
  const patientAudioTrackRef = useRef(null);
  const patientVideoTrackRef = useRef(null);
  const timerRef = useRef(null);
  const isInCallRef = useRef(isInCall);
  const hasDoctorConnectedRef = useRef(false);

  // Timer de 30 secondes d'attente pour la recherche d'un médecin
  useEffect(() => {
    let interval = null;
    if (activeCall && !activeCall.doctor_id && !isInCall) {
      setWaitingTime(0);
      interval = setInterval(() => {
        setWaitingTime((prev) => {
          if (prev >= 30) {
            clearInterval(interval);
            console.log("30s d'attente écoulées sans médecin, annulation et fermeture de la modale.");
            rejectCall();
            return 30;
          }
          return prev + 1;
        });
      }, 1000);
    } else {
      setWaitingTime(0);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [activeCall?.consultation_id, activeCall?.doctor_id, isInCall]);

  useEffect(() => {
    isInCallRef.current = isInCall;
    const isCallActiveState = activeCall !== null || isInCall;
    if (typeof document !== "undefined") {
      if (isCallActiveState) {
        document.body.classList.add("patient-in-call-active");
      } else {
        document.body.classList.remove("patient-in-call-active");
      }
    }
    return () => {
      if (typeof document !== "undefined") {
        document.body.classList.remove("patient-in-call-active");
      }
    };
  }, [isInCall, activeCall]);

  // Intercepter et masquer les logs console.error / console.warn de DataChannel WebRTC émises par LiveKit
  useEffect(() => {
    if (typeof window !== "undefined" && !window.__livekit_console_patched) {
      window.__livekit_console_patched = true;
      const isDataChannelLog = (msg) => {
        const lower = String(msg).toLowerCase();
        return (
          lower.includes("datachannel") ||
          lower.includes("data channel") ||
          lower.includes("user-initiated abort") ||
          (lower.includes("lossy") && lower.includes("closed")) ||
          (lower.includes("reliable") && lower.includes("closed"))
        );
      };

      const originalError = console.error;
      console.error = function (...args) {
        const msg = args
          .map((a) => (typeof a === "object" ? JSON.stringify(a) : String(a)))
          .join(" ");
        if (isDataChannelLog(msg)) return;
        originalError.apply(console, args);
      };

      const originalWarn = console.warn;
      console.warn = function (...args) {
        const msg = args
          .map((a) => (typeof a === "object" ? JSON.stringify(a) : String(a)))
          .join(" ");
        if (isDataChannelLog(msg)) return;
        originalWarn.apply(console, args);
      };
    }

    const handleUnhandledRejection = (event) => {
      if (
        event.reason &&
        (String(event.reason).includes("DataChannel") ||
          String(event.reason).includes("User-Initiated Abort"))
      ) {
        event.preventDefault();
      }
    };
    window.addEventListener("unhandledrejection", handleUnhandledRejection);
    return () => window.removeEventListener("unhandledrejection", handleUnhandledRejection);
  }, []);

  // Charger le SDK Web LiveKit Client
  useEffect(() => {
    if (typeof window !== "undefined" && !window.LiveKitClient && !window.LiveKit) {
      const script = document.createElement("script");
      script.src = "https://cdn.jsdelivr.net/npm/livekit-client/dist/livekit-client.umd.min.js";
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  const endCallApi = async (reason = "ended", callDuration = 0) => {
    const token = localStorage.getItem("patient_token");
    if (!token) return;
    try {
      await fetch(`${API_URL}/v1/patient/end-call`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ reason, duration: callDuration }),
      });
    } catch (err) {
      console.error("Erreur fin d'appel API:", err);
    }
  };

  const rejectCall = async () => {
    const token = localStorage.getItem("patient_token");
    if (token) {
      try {
        await fetch(`${API_URL}/v1/patient/reject-call`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
            "Content-Type": "application/json",
          },
        });
      } catch (err) {
        console.error("Erreur refus d'appel API:", err);
      }
    }
    setActiveCall(null);
  };

  const acceptCall = async () => {
    if (!activeCall) return;
    setIsInCall(true);
    const token = localStorage.getItem("patient_token");
    if (token) {
      try {
        await fetch(`${API_URL}/v1/patient/accept-call`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
            "Content-Type": "application/json",
          },
        });
      } catch (err) {
        console.error("Erreur acceptation appel API:", err);
      }
    }
  };

  const leaveCall = async () => {
    const finalDuration = duration;
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    await endCallApi("patient_left", finalDuration);

    const room = livekitRoomRef.current;
    if (room) {
      try {
        room.removeAllListeners();
        if (room.localParticipant) {
          room.localParticipant.videoTrackPublications.forEach((pub) => {
            if (pub.track) try { pub.track.stop(); } catch (e) {}
          });
          room.localParticipant.audioTrackPublications.forEach((pub) => {
            if (pub.track) try { pub.track.stop(); } catch (e) {}
          });
        }
        if (room.state === "connected") {
          await room.disconnect();
        }
      } catch (e) {}
      livekitRoomRef.current = null;
    }

    if (patientAudioTrackRef.current) {
      try { patientAudioTrackRef.current.stop(); } catch (e) {}
      patientAudioTrackRef.current = null;
    }
    if (patientVideoTrackRef.current) {
      try { patientVideoTrackRef.current.stop(); } catch (e) {}
      patientVideoTrackRef.current = null;
    }
    setIsInCall(false);
    setActiveCall(null);
  };

  const dismissCallModalOnly = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    const room = livekitRoomRef.current;
    if (room) {
      try {
        room.removeAllListeners();
        if (room.localParticipant) {
          room.localParticipant.videoTrackPublications.forEach((pub) => {
            if (pub.track) try { pub.track.stop(); } catch (e) {}
          });
          room.localParticipant.audioTrackPublications.forEach((pub) => {
            if (pub.track) try { pub.track.stop(); } catch (e) {}
          });
        }
        if (room.state === "connected") {
          room.disconnect();
        }
      } catch (e) {}
      livekitRoomRef.current = null;
    }

    if (patientAudioTrackRef.current) {
      try { patientAudioTrackRef.current.stop(); } catch (e) {}
      patientAudioTrackRef.current = null;
    }
    if (patientVideoTrackRef.current) {
      try { patientVideoTrackRef.current.stop(); } catch (e) {}
      patientVideoTrackRef.current = null;
    }
    setIsInCall(false);
    setActiveCall(null);
  };

  // Générateur de sonnerie téléphonique Web Audio API pour le patient
  useEffect(() => {
    let audioCleanup = null;

    if (activeCall && !isInCall && activeCall.doctor_id) {
      if (typeof window !== "undefined") {
        try {
          const AudioContext = window.AudioContext || window.webkitAudioContext;
          if (AudioContext) {
            const ctx = new AudioContext();
            let isRinging = true;

            const playBeep = () => {
              if (!isRinging) return;
              try {
                if (ctx.state === "suspended") {
                  ctx.resume();
                }
                const osc1 = ctx.createOscillator();
                const osc2 = ctx.createOscillator();
                const gain = ctx.createGain();

                osc1.type = "sine";
                osc2.type = "sine";
                osc1.frequency.value = 440;
                osc2.frequency.value = 480;

                gain.gain.setValueAtTime(0.18, ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.6);

                osc1.connect(gain);
                osc2.connect(gain);
                gain.connect(ctx.destination);

                osc1.start();
                osc2.start();
                osc1.stop(ctx.currentTime + 1.6);
                osc2.stop(ctx.currentTime + 1.6);
              } catch (e) {}
            };

            playBeep();
            const interval = setInterval(playBeep, 2500);

            audioCleanup = () => {
              isRinging = false;
              clearInterval(interval);
              try {
                ctx.close();
              } catch (e) {}
            };
          }
        } catch (e) {
          console.warn("Erreur Web Audio ringtone:", e);
        }
      }
    }

    return () => {
      if (audioCleanup) audioCleanup();
    };
  }, [activeCall, isInCall]);

  // Poll for active incoming call from doctor
  useEffect(() => {
    let isFetching = false;

    const checkCall = async () => {
      const token = localStorage.getItem("patient_token");
      if (!token || isFetching) return;

      isFetching = true;
      try {
        const res = await fetch(`${API_URL}/v1/patient/active-call`, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        });

        if (res.ok) {
          const data = await res.json();
          if (data.has_active_call && data.call) {
            const isAssignedToDoctor = Boolean(data.call.doctor_id || data.call.call_status === "accepted");
            if (isAssignedToDoctor) {
              // Le médecin a pris en charge : afficher la modale d'appel entrant et faire sonner le patient
              setActiveCall(data.call);
            } else {
              // Patient en attente d'attribution
              if (!isInCallRef.current) {
                setActiveCall(data.call);
              }
            }
          } else {
            if (isInCallRef.current) {
              console.log("Le médecin a terminé l'appel, fermeture côté patient.");
              leaveCall();
            } else {
              setActiveCall(null);
            }
          }
        }
      } catch (err) {
        console.error("Error polling active call:", err);
      } finally {
        isFetching = false;
      }
    };

    checkCall();
    const interval = setInterval(checkCall, 4000);
    return () => clearInterval(interval);
  }, []);

  // Écouter le lancement manuel d'une consultation en ligne par le patient
  useEffect(() => {
    const handleCustomStartCall = (e) => {
      if (e.detail) {
        const callData = {
          consultation_id: e.detail.consultation_id,
          channel: e.detail.channel,
          livekit_url: e.detail.livekit_url,
          token: e.detail.token,
          doctor_name: "Recherche d'un médecin disponible...",
          prestation: "Consultation en ligne immédiate",
          doctor_id: null,
        };
        setActiveCall(callData);
        setIsInCall(false);
      }
    };

    window.addEventListener("startOnlineConsultationCall", handleCustomStartCall);
    return () => window.removeEventListener("startOnlineConsultationCall", handleCustomStartCall);
  }, []);

  // Connexion LiveKit au décrochage
  useEffect(() => {
    if (!isInCall || !activeCall) return;

    let isMounted = true;

    const startCallSession = async () => {
      try {
        let LiveKit = null;
        try {
          LiveKit = await import("livekit-client");
        } catch (e) {
          console.warn("LiveKit import local, fallback window:", e);
        }

        if (!LiveKit || (!LiveKit.Room && !LiveKit.default?.Room)) {
          let retries = 0;
          while (!window.LiveKitClient && !window.LiveKit && retries < 15) {
            await new Promise((r) => setTimeout(r, 200));
            retries++;
          }
          LiveKit = window.LiveKitClient || window.LiveKit;
        }

        const SDK = window.LiveKitClient || window.LiveKit || LiveKit;
        const RoomClass = SDK?.Room || SDK?.default?.Room || LiveKit?.Room;
        const createLocalAudioTrackFn = SDK?.createLocalAudioTrack || SDK?.default?.createLocalAudioTrack || LiveKit?.createLocalAudioTrack;
        const createLocalVideoTrackFn = SDK?.createLocalVideoTrack || SDK?.default?.createLocalVideoTrack || LiveKit?.createLocalVideoTrack;
        const LocalVideoTrackClass = SDK?.LocalVideoTrack || SDK?.default?.LocalVideoTrack || LiveKit?.LocalVideoTrack;
        const RoomEventEnum = SDK?.RoomEvent || SDK?.default?.RoomEvent || LiveKit?.RoomEvent || {};

        if (!RoomClass) {
          console.error("LiveKit SDK indisponible après chargement");
          return;
        }

        // 0. Demande d'autorisation média préalable au navigateur
        if (typeof navigator !== "undefined" && navigator.mediaDevices?.getUserMedia) {
          try {
            const preStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
            preStream.getTracks().forEach((t) => t.stop());
          } catch (pErr) {
            console.warn("Pré-demande d'autorisation média patient:", pErr);
          }
        }

        const room = new RoomClass({
          adaptiveStream: true,
          dynacast: true,
        });

        livekitRoomRef.current = room;

        const attachPatientRemoteTrack = (track) => {
          if (!isMounted || !track) return;
          hasDoctorConnectedRef.current = true;
          if (track.kind === "video") {
            const remoteContainer = document.getElementById("patient-remote-video-container");
            if (remoteContainer) {
              remoteContainer.innerHTML = "";
              const el = track.attach();
              el.autoplay = true;
              el.playsInline = true;
              el.setAttribute("playsinline", "true");
              el.style.width = "100%";
              el.style.height = "100%";
              el.style.minWidth = "100%";
              el.style.minHeight = "100%";
              el.style.objectFit = "cover";
              el.style.display = "block";
              remoteContainer.appendChild(el);
              el.play().catch((e) => console.warn("Erreur vidéo distante patient:", e));
            }
          } else if (track.kind === "audio") {
            const existingAudio = document.getElementById("remote-patient-audio-el");
            if (existingAudio) existingAudio.remove();

            const audioEl = track.attach();
            audioEl.id = "remote-patient-audio-el";
            audioEl.autoplay = true;
            document.body.appendChild(audioEl);
            audioEl.play().catch((e) => console.warn("Erreur audio distant patient:", e));
          }
        };

        // Gérer l'attachement de la vignette vidéo locale du patient
        const localPubEvent = RoomEventEnum.LocalTrackPublished || "localTrackPublished";
        room.on(localPubEvent, (publication) => {
          if (!isMounted) return;
          if (publication.kind === "video" && publication.track) {
            renderLocalTrack(publication.track);
          }
        });

        // Gérer le déblocage audio automatique
        const audioStatusEvent = RoomEventEnum.AudioPlaybackStatusChanged || "audioPlaybackChanged";
        room.on(audioStatusEvent, () => {
          if (!room.canPlaybackAudio) {
            room.startAudio();
          }
        });

        // Gérer la réception du flux du Docteur
        const eventName = RoomEventEnum.TrackSubscribed || "trackSubscribed";
        room.on(eventName, (track) => {
          attachPatientRemoteTrack(track);
        });

        const livekitUrl = activeCall.livekit_url || "wss://gemma-14fckk2m.livekit.cloud";
        await room.connect(livekitUrl, activeCall.token);
        try { await room.startAudio(); } catch (e) {}

        // Attacher l'écouteur de déconnexion du médecin ou du salon LiveKit
        const roomDisconnectedEvent = RoomEventEnum.Disconnected || "disconnected";
        room.on(roomDisconnectedEvent, () => {
          if (isMounted && isInCallRef.current) {
            console.log("Room déconnectée par LiveKit / hôte");
            leaveCall();
          }
        });

        const participantConnectedEvent = RoomEventEnum.ParticipantConnected || "participantConnected";
        room.on(participantConnectedEvent, (participant) => {
          console.log("Médecin connecté au salon LiveKit:", participant?.identity);
          hasDoctorConnectedRef.current = true;
        });

        const participantDisconnectedEvent = RoomEventEnum.ParticipantDisconnected || "participantDisconnected";
        room.on(participantDisconnectedEvent, (participant) => {
          if (isMounted && isInCallRef.current) {
            console.log("Le médecin a quitté le salon LiveKit, fermeture d'appel patient:", participant?.identity);
            leaveCall();
          }
        });

        // Attendre que le moteur WebRTC soit 100% connecté aux transports ICE
        let engineWait = 0;
        while (room.engine && !room.engine.isEngineConnected && engineWait < 25) {
          await new Promise((r) => setTimeout(r, 100));
          engineWait++;
        }

        // Récupérer les flux du Docteur s'il était déjà connecté
        if (room.remoteParticipants) {
          room.remoteParticipants.forEach((participant) => {
            if (participant.trackPublications) {
              participant.trackPublications.forEach((publication) => {
                if (publication.isSubscribed && publication.track) {
                  attachPatientRemoteTrack(publication.track);
                }
              });
            }
          });
        }

        // 1. Activer le Microphone du Patient avec Élimination de l'écho (AEC)
        try {
          const micPub = await room.localParticipant.setMicrophoneEnabled(true, {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          });
          if (micPub && micPub.track) {
            patientAudioTrackRef.current = micPub.track;
          }
          console.log("Microphone patient activé avec annulation d'écho");
        } catch (aErr) {
          console.warn("Microphone patient non accessible:", aErr.message || aErr);
        }

        // Helper pour générer un flux vidéo virtuel HD dynamique en cas de manque de caméra
        const createFallbackVideoTrack = (label = "Patient") => {
          if (typeof window === "undefined") return null;
          const canvas = document.createElement("canvas");
          canvas.width = 640;
          canvas.height = 480;
          const ctx = canvas.getContext("2d");

          let angle = 0;
          const draw = () => {
            angle += 0.05;
            const grad = ctx.createLinearGradient(0, 0, 640, 480);
            grad.addColorStop(0, "#0f172a");
            grad.addColorStop(0.5, "#1e293b");
            grad.addColorStop(1, "#0d9488");
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, 640, 480);

            ctx.beginPath();
            ctx.arc(320, 200, 65 + Math.sin(angle) * 8, 0, Math.PI * 2);
            ctx.fillStyle = "rgba(13, 148, 136, 0.35)";
            ctx.fill();

            ctx.beginPath();
            ctx.arc(320, 200, 52, 0, Math.PI * 2);
            ctx.fillStyle = "#0d9488";
            ctx.fill();
            ctx.lineWidth = 3;
            ctx.strokeStyle = "#ffffff";
            ctx.stroke();

            ctx.fillStyle = "#ffffff";
            ctx.font = "bold 32px sans-serif";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText("PT", 320, 200);

            ctx.font = "bold 18px sans-serif";
            ctx.fillText(label, 320, 290);

            ctx.font = "14px sans-serif";
            ctx.fillStyle = "#94a3b8";
            ctx.fillText("Flux vidéo HD connecté", 320, 320);
          };

          setInterval(draw, 40);
          const stream = canvas.captureStream(25);
          return stream.getVideoTracks()[0];
        };

        const renderLocalTrack = (vTrack) => {
          const localContainer = document.getElementById("patient-local-video-container");
          if (localContainer && vTrack) {
            localContainer.innerHTML = "";
            patientVideoTrackRef.current = vTrack;
            const localEl = vTrack.attach();
            localEl.muted = true;
            localEl.autoplay = true;
            localEl.playsInline = true;
            localEl.setAttribute("playsinline", "true");
            localEl.style.width = "100%";
            localEl.style.height = "100%";
            localEl.style.minWidth = "100%";
            localEl.style.minHeight = "100%";
            localEl.style.objectFit = "cover";
            localEl.style.display = "block";
            localContainer.appendChild(localEl);
            localEl.play().catch((e) => console.warn("Erreur vidéo locale patient:", e));
          }
        };

        // 2. Activer la vidéo du patient (Caméra réelle en priorité)
        const acquirePatientCamera = async () => {
          try {
            const camPub = await room.localParticipant.setCameraEnabled(true);
            let vTrack = (camPub && camPub.track) ? camPub.track : null;

            // Attendre jusqu'à 1.5s que la piste caméra physique réelle soit rattachée
            let waitCount = 0;
            while (!vTrack && waitCount < 10) {
              await new Promise((r) => setTimeout(r, 150));
              if (camPub && camPub.track) {
                vTrack = camPub.track;
              } else if (room.localParticipant.videoTrackPublications) {
                room.localParticipant.videoTrackPublications.forEach((pub) => {
                  if (pub.track && pub.kind === "video") vTrack = pub.track;
                });
              }
              waitCount++;
            }

            if (vTrack) {
              console.log("Caméra physique patient réelle obtenue !");
              return vTrack;
            }
          } catch (e1) {
            console.warn("setCameraEnabled patient échoué (pas de caméra ou autorisation refusée):", e1);
          }

          console.warn("Caméra physique réellement indisponible, fallback vidéo virtuel");
          const fallbackRaw = createFallbackVideoTrack("Patient HD");
          if (fallbackRaw) {
            let fallbackTrack = fallbackRaw;
            if (LocalVideoTrackClass) {
              try { fallbackTrack = new LocalVideoTrackClass(fallbackRaw); } catch(e){}
            }
            const pub = await room.localParticipant.publishTrack(fallbackTrack, { name: "camera" });
            return (pub && pub.track) ? pub.track : fallbackTrack;
          }
          return null;
        };

        try {
          const vTrack = await acquirePatientCamera();
          if (vTrack) {
            renderLocalTrack(vTrack);
            console.log("Flux vidéo patient publié et affiché");
          }
        } catch (vErr) {
          console.error("Erreur globale caméra patient:", vErr);
        }

        setDuration(0);
        hasDoctorConnectedRef.current = true;
        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = setInterval(() => {
          setDuration((prev) => prev + 1);
        }, 1000);

      } catch (err) {
        console.error("Erreur connexion LiveKit Patient:", err);
      }
    };

    const timeoutId = setTimeout(startCallSession, 200);

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, [isInCall, activeCall?.consultation_id]);

  const toggleMic = async () => {
    const nextState = !micMuted;
    if (livekitRoomRef.current?.localParticipant) {
      try {
        await livekitRoomRef.current.localParticipant.setMicrophoneEnabled(!nextState);
      } catch (e) {
        console.warn("Erreur bascule micro patient:", e);
      }
    }
    setMicMuted(nextState);
  };

  const toggleCam = async () => {
    const nextState = !camOff;
    if (livekitRoomRef.current?.localParticipant) {
      try {
        await livekitRoomRef.current.localParticipant.setCameraEnabled(!nextState);
      } catch (e) {
        console.warn("Erreur bascule caméra patient:", e);
      }
    }
    setCamOff(nextState);
  };

  const formatTimer = (sec) => {
    const m = String(Math.floor(sec / 60)).padStart(2, "0");
    const s = String(sec % 60).padStart(2, "0");
    return `${m}:${s}`;
  };

  if (!activeCall) return null;

  return (
    <>
      {/* 1. Modal d'Appel Entrant (Sonnerie & Décrochage) */}
      {!isInCall && activeCall?.doctor_id && (
        <div className="fixed inset-0 z-[999999] flex items-center justify-center bg-slate-900/40 backdrop-blur-md p-4 animate-in fade-in duration-300">
          <div className="bg-gradient-to-b from-white via-slate-50 to-teal-50/30 rounded-3xl p-8 max-w-md w-full text-center shadow-2xl border border-white/80 relative overflow-hidden">
            {/* Vague pulsante d'appel lumineuse */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-56 h-56 bg-teal-400/15 rounded-full animate-ping pointer-events-none"></div>
            <div className="absolute -top-12 -right-12 w-32 h-32 bg-blue-400/10 rounded-full blur-2xl pointer-events-none"></div>

            <div className="w-20 h-20 mx-auto mb-5 bg-gradient-to-tr from-teal-500 via-emerald-500 to-cyan-500 rounded-2xl flex items-center justify-center text-white text-3xl shadow-xl shadow-teal-500/25 relative z-10 animate-bounce">
              <FaVideo />
            </div>

            <div className="inline-flex items-center space-x-1.5 px-3 py-1 bg-teal-50 border border-teal-200/80 rounded-full text-teal-700 text-xs font-semibold mb-3">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Téléconsultation Entrante</span>
            </div>

            <h3 className="text-2xl font-bold text-slate-800 mb-1 tracking-tight">
              {activeCall.doctor_name || "Votre Médecin"}
            </h3>
            <p className="text-slate-500 text-xs font-medium mb-6">
              {activeCall.prestation || "Le médecin prend en charge votre téléconsultation. Cliquez sur Rejoindre pour répondre."}
            </p>

            <div className="flex items-center justify-center space-x-3 relative z-10">
              <button
                onClick={rejectCall}
                className="flex-1 py-3.5 px-4 bg-rose-50 hover:bg-rose-100 active:bg-rose-200 text-rose-600 border border-rose-200/80 rounded-2xl font-semibold transition-all shadow-sm flex items-center justify-center space-x-2"
              >
                <FaPhoneSlash className="text-sm" />
                <span>Refuser</span>
              </button>
              <button
                onClick={acceptCall}
                className="flex-1 py-3.5 px-4 bg-gradient-to-r from-emerald-500 via-teal-600 to-cyan-600 hover:from-emerald-600 hover:to-cyan-700 text-white rounded-2xl font-semibold transition-all shadow-lg shadow-emerald-500/30 flex items-center justify-center space-x-2 animate-pulse"
              >
                <FaVideo className="text-sm" />
                <span>Rejoindre</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 1b. Modal d'Attente (En attente qu'un médecin réponde) */}
      {!isInCall && activeCall && !activeCall?.doctor_id && (
        <div className="fixed inset-0 z-[999999] flex items-center justify-center bg-slate-900/40 backdrop-blur-md p-4 animate-in fade-in duration-300">
          <div className="bg-gradient-to-b from-white via-slate-50 to-teal-50/30 rounded-3xl p-8 max-w-md w-full text-center shadow-2xl border border-white/80 relative overflow-hidden">
            <div className="w-20 h-20 mx-auto mb-5 bg-gradient-to-tr from-teal-400 via-teal-500 to-emerald-500 rounded-2xl flex items-center justify-center text-white text-3xl shadow-xl shadow-teal-500/20 relative z-10">
              <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
            </div>

            <div className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 bg-teal-50 border border-teal-200/80 rounded-full text-teal-700 text-xs font-bold mb-3 shadow-xs">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
              <span>Recherche d'un médecin • {Math.max(0, 30 - waitingTime)}s</span>
            </div>

            <h3 className="text-xl font-bold text-slate-800 mb-2 tracking-tight">
              Demande transmise aux médecins
            </h3>
            <p className="text-slate-500 text-xs leading-relaxed mb-4">
              Votre demande de téléconsultation a été transmise. Si aucun médecin ne décroche sous {Math.max(0, 30 - waitingTime)}s, cette fenêtre se fermera automatiquement.
            </p>

            {/* Barre de progression des 30s */}
            <div className="w-full bg-slate-100 rounded-full h-2 mb-6 overflow-hidden border border-slate-200">
              <div
                className="bg-gradient-to-r from-teal-500 to-emerald-500 h-full transition-all duration-1000 ease-linear"
                style={{ width: `${Math.min(100, (waitingTime / 30) * 100)}%` }}
              ></div>
            </div>

            <button
              onClick={rejectCall}
              className="w-full py-3 px-4 bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-600 rounded-2xl font-semibold transition-all border border-slate-200 shadow-sm flex items-center justify-center space-x-2"
            >
              <FaPhoneSlash className="text-sm" />
              <span>Annuler la demande</span>
            </button>
          </div>
        </div>
      )}

      {/* 2. Écran de visioconférence actif LiveKit (Light Theme) */}
      {isInCall && (
        <div className="fixed inset-0 z-[999999] bg-slate-100/95 backdrop-blur-xl flex flex-col justify-between p-3 md:p-6 w-screen h-screen">
          {/* Header Appel - Light Glass */}
          <div className="flex justify-between items-center bg-white/90 backdrop-blur-md p-3.5 md:p-4 rounded-2xl border border-slate-200/80 shadow-sm mb-3">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center font-bold text-base shadow-inner">
                <FaVideo className="text-teal-600" />
              </div>
              <div>
                <h4 className="text-slate-800 font-bold text-base tracking-tight mb-0.5">
                  {activeCall.doctor_name || "Consultation Médicale"}
                </h4>
                <p className="text-teal-600 text-xs font-semibold flex items-center space-x-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>Direct HD sécurisé</span>
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <span className="bg-slate-100 border border-slate-200 text-slate-700 text-sm font-mono font-semibold px-4 py-1.5 rounded-full shadow-inner">
                {formatTimer(duration)}
              </span>
            </div>
          </div>

          {/* Grille Vidéo LiveKit - Light Frame */}
          <div className="relative flex-1 my-1 bg-slate-900 rounded-3xl overflow-hidden flex items-center justify-center border border-slate-200 shadow-2xl">
            {/* Vidéo du Médecin (Grande image) */}
            <div id="patient-remote-video-container" className="w-full h-full flex items-center justify-center bg-slate-900">
              <div className="text-center text-slate-300 p-4 max-w-sm">
                <div className="w-12 h-12 border-4 border-teal-400 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                <h5 className="font-bold text-white mb-1">
                  {duration > 30 ? "Demande inscrite en attente" : "Sonnerie en cours..."}
                </h5>
                <p className="text-xs text-slate-300">
                  {duration > 30
                    ? "Aucun médecin n'a pu décrocher immédiatement. Votre demande est inscrite dans la liste des téléconsultations en attente."
                    : "Connexion à la vidéo du médecin..."}
                </p>
              </div>
            </div>

            {/* Vidéo du Patient (Miniature PiP) */}
            <div
              id="patient-local-video-container"
              className="absolute bottom-5 right-5 w-44 h-32 bg-slate-800 rounded-2xl border-2 border-teal-400 shadow-2xl overflow-hidden transition-all hover:scale-105"
            />
          </div>

          {/* Barres de contrôles flottantes en bas - Light Floating Bar */}
          <div className="py-2 flex justify-center">
            <div className="flex items-center space-x-3 bg-white/95 backdrop-blur-xl border border-slate-200/80 p-2.5 px-6 rounded-full shadow-xl">
              <button
                onClick={toggleMic}
                className={`p-3.5 rounded-full text-lg transition-all shadow-sm ${
                  micMuted ? "bg-rose-500 text-white shadow-rose-500/30" : "bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200"
                }`}
                title={micMuted ? "Activer micro" : "Désactiver micro"}
              >
                {micMuted ? <FaMicrophoneSlash /> : <FaMicrophone />}
              </button>
              <button
                onClick={toggleCam}
                className={`p-3.5 rounded-full text-lg transition-all shadow-sm ${
                  camOff ? "bg-rose-500 text-white shadow-rose-500/30" : "bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200"
                }`}
                title={camOff ? "Activer caméra" : "Désactiver caméra"}
              >
                {camOff ? <FaVideoSlash /> : <FaVideo />}
              </button>
              <div className="w-px h-6 bg-slate-200 mx-1"></div>
              <button
                onClick={leaveCall}
                className="py-3 px-6 bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 text-white rounded-full font-bold shadow-md shadow-rose-500/25 flex items-center space-x-2 transition-all"
              >
                <FaPhoneSlash className="text-sm" />
                <span>Quitter</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}





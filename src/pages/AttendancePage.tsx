import React, { useState, useEffect, useRef, useMemo } from 'react';
import Webcam from 'react-webcam';
import * as faceapi from 'face-api.js';
import { useStore } from '../context/StoreContext';
import { MapPin, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { getDistance } from 'geolib';
import { useLanguage } from '../context/LanguageContext';
import { playSuccessBeep } from '../utils/sound';
import { speak } from '../utils/speech';
import type { Zone } from '../types';
import AdminAccessButton from '../components/AdminAccessButton';
import AdminSuccessModal from '../components/AdminSuccessModal';
import clsx from 'clsx';

const AttendancePage: React.FC = () => {
    const { t, language } = useLanguage();
    const {
        employees,
        zones,
        logs,
        addLog,
        modelsLoaded,
        isEmployeesLoading,
        adminUser,
        setDetectedAdminId,
        enableKioskAdmin
    } = useStore();

    const webcamRef = useRef<Webcam>(null);

    const [location, setLocation] = useState<{ lat: number, lng: number, accuracy: number } | null>(null);
    const [currentZone, setCurrentZone] = useState<Zone | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [status, setStatus] = useState<'idle' | 'capturing' | 'processing' | 'success'>('idle');
    const [matchedEmployee, setMatchedEmployee] = useState<string | null>(null);
    const [detectedKioskEmployee, setDetectedKioskEmployee] = useState<string | null>(null);
    const [matchedPhoto, setMatchedPhoto] = useState<string | null>(null);
    const [lastLogType, setLastLogType] = useState<'check-in' | 'check-out' | null>(null);
    const [isAdminButtonVisible, setIsAdminButtonVisible] = useState(false);
    const [showAdminSuccessModal, setShowAdminSuccessModal] = useState(false);

    // v1.5.5: TIMEOUT GUARD - If loading takes > 10s, show rescue screen
    const [isLongLoading, setIsLongLoading] = useState(false);
    const isPublicMode = !adminUser;
    const isLoadingPublicMode = isPublicMode && (!currentZone || isEmployeesLoading);

    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (isLoadingPublicMode) {
            timer = setTimeout(() => setIsLongLoading(true), 10000); // 10s timeout
        }
        return () => clearTimeout(timer);
    }, [isLoadingPublicMode]);



    const labeledDescriptors = useMemo(() => {
        if (!employees.length) return [];
        return employees.map(emp => new faceapi.LabeledFaceDescriptors(emp.id, [new Float32Array(emp.photoDescriptor)]));
    }, [employees]);

    const scanningIntervalRef = useRef<NodeJS.Timeout | null>(null);

    // GPS Tracking
    useEffect(() => {
        if (!navigator.geolocation) {
            setError(t('attendance.gps_not_supported'));
            return;
        }

        const watchId = navigator.geolocation.watchPosition(
            (position) => {
                const { latitude, longitude, accuracy } = position.coords;
                setLocation({ lat: latitude, lng: longitude, accuracy });
                setError(prev => (accuracy > 100 ? t('attendance.gps_imprecise') : (prev?.includes("Localisation") || prev?.includes("Inaccurate") || prev?.includes("GPS") ? null : prev)));
            },
            (err) => {
                if (err.code === 3) {
                    setError("🌐 Signal GPS faible. Attendez ou déplacez-vous à l'extérieur.");
                } else {
                    setError(t('attendance.gps_error') + ": " + err.message);
                }
            },
            { enableHighAccuracy: true, timeout: 60000, maximumAge: 0 }
        );

        return () => navigator.geolocation.clearWatch(watchId);
    }, []);

    // Zone Discovery
    useEffect(() => {
        if (location) {
            const foundZone = zones.find(zone => {
                const dist = getDistance({ latitude: location.lat, longitude: location.lng }, { latitude: zone.lat, longitude: zone.lng });
                return dist <= zone.radius + 30; // 30m tolerance
            });

            if (foundZone) {
                setCurrentZone(foundZone);
                setDetectedAdminId(foundZone.adminId);
            } else {
                setCurrentZone(null);
                setDetectedAdminId(null);
            }
        }
    }, [location, zones, setDetectedAdminId]);

    // Kiosk Auto-scan logic
    useEffect(() => {
        if (!modelsLoaded || status !== 'idle' || !labeledDescriptors.length) {
            if (scanningIntervalRef.current) clearInterval(scanningIntervalRef.current);
            return;
        }

        const yawHistory: number[] = [];
        scanningIntervalRef.current = setInterval(async () => {
            if (!webcamRef.current?.video || status !== 'idle') return;
            try {
                const videoEl = webcamRef.current.video;
                if (videoEl.paused || videoEl.ended) return;

                const detection = await faceapi.detectSingleFace(videoEl, new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.5 }))
                    .withFaceLandmarks().withFaceDescriptor();

                if (detection) {
                    const l = detection.landmarks;
                    const ratio = Math.abs(l.getNose()[3].x - l.getLeftEye()[0].x) / (Math.abs(l.getRightEye()[3].x - l.getNose()[3].x) + 0.001);
                    const match = new faceapi.FaceMatcher(labeledDescriptors, 0.6).findBestMatch(detection.descriptor);

                    if (match.label !== 'unknown') {
                        const emp = employees.find(e => e.id === match.label);
                        if (emp?.isKiosk) {
                            yawHistory.push(ratio);
                            if (yawHistory.length > 5) yawHistory.shift();
                            if (yawHistory.length >= 5) {
                                const diff = Math.max(...yawHistory) - Math.min(...yawHistory);
                                if (diff > 0.2) {
                                    setDetectedKioskEmployee(`${emp.firstName} ${emp.lastName}`);
                                    setIsAdminButtonVisible(true);
                                }
                            }
                        }
                    } else {
                        setIsAdminButtonVisible(false);
                    }
                } else {
                    setIsAdminButtonVisible(false);
                }
            } catch (err) { console.error(err); }
        }, 300);

        return () => { if (scanningIntervalRef.current) clearInterval(scanningIntervalRef.current); };
    }, [modelsLoaded, status, labeledDescriptors, employees]);

    const handleAdminAccess = async () => {
        if (!webcamRef.current?.video || !modelsLoaded) return;
        try {
            const detection = await faceapi.detectSingleFace(webcamRef.current.video, new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.5 }))
                .withFaceLandmarks().withFaceDescriptor();
            if (detection) {
                if (labeledDescriptors.length === 0) return;
                const match = new faceapi.FaceMatcher(labeledDescriptors, 0.6).findBestMatch(detection.descriptor);
                const emp = employees.find(e => e.id === match.label);
                if (emp) {
                    enableKioskAdmin(emp.adminId || '');
                    localStorage.setItem('kiosk_admin_session', JSON.stringify({ timestamp: new Date().toISOString(), adminId: emp.adminId }));
                    setShowAdminSuccessModal(true);
                }
            }
        } catch (err) { console.error(err); }
    };

    const handleModalClose = () => {
        setShowAdminSuccessModal(false);
        window.location.href = '/admin/employees';
    };

    const handlePointage = async () => {
        if (!webcamRef.current || !currentZone) return;
        setStatus('processing');
        setError(null);
        try {
            let detection = null;
            for (let i = 0; i < 3; i++) {
                const img = new Image();
                const screenshot = webcamRef.current.getScreenshot();
                if (!screenshot) break;
                img.src = screenshot;
                await new Promise(r => img.onload = r);
                detection = await faceapi.detectSingleFace(img, new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.3 }))
                    .withFaceLandmarks().withFaceDescriptor();
                if (detection) break;
                await new Promise(r => setTimeout(r, 300));
            }

            if (!detection) throw new Error(t('attendance.face_not_detected'));

            if (labeledDescriptors.length === 0) {
                throw new Error("Aucune donnée faciale chargée. Attendez quelques secondes.");
            }

            const match = new faceapi.FaceMatcher(labeledDescriptors, 0.6).findBestMatch(detection.descriptor);
            if (match.label === 'unknown') throw new Error(t('attendance.face_not_recognized'));

            const emp = employees.find(e => e.id === match.label);
            if (emp) {
                setMatchedEmployee(`${emp.firstName} ${emp.lastName}`);
                setMatchedPhoto(emp.photoURL || emp.photo || null);
                const today = new Date().toISOString().split('T')[0];
                const lastLog = logs.filter(l => l.employeeId === emp.id && l.timestamp.startsWith(today))
                    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];
                const type = (!lastLog || lastLog.type === 'check-out') ? 'check-in' : 'check-out';
                setLastLogType(type);
                addLog({ id: crypto.randomUUID(), employeeId: emp.id, timestamp: new Date().toISOString(), type, location: location || { lat: 0, lng: 0 }, verified: true, method: 'face_geo', zoneName: currentZone.name, adminId: currentZone.adminId });
                playSuccessBeep();

                // v1.9.2: Language-aware Voice Feedback
                const messages = {
                    fr: `Bienvenue, ${emp.firstName}`,
                    ar: `مرحباً, ${emp.firstName}`,
                    en: `Welcome, ${emp.firstName}`
                };

                // v1.9.3 FIX: Actually calling the speak function!
                const langCode = (language === 'ar' || language === 'en' || language === 'fr') ? language : 'fr';
                const msg = messages[langCode];
                speak(msg, langCode);

                setStatus('success');
                setTimeout(() => { setStatus('idle'); setMatchedEmployee(null); setMatchedPhoto(null); }, 3000);
            }
        } catch (err: any) {
            setError(err.message);
            setStatus('idle');
        }
    };

    // v1.6.1: MOVED GUARD TO END OF HOOKS BLOCK to fix React Error #310 (Hooks violation)
    if (isLoadingPublicMode) {
        if (isLongLoading) {
            return (
                <div className="min-h-screen flex flex-col items-center justify-center bg-red-50 p-6 text-center">
                    <AlertTriangle className="text-red-600 mb-4" size={48} />
                    <h2 className="text-xl font-bold text-red-700">Le chargement est trop long.</h2>
                    <p className="text-gray-600 text-sm mt-2 mb-4">
                        Zones: {zones.length} | Employés: {employees.length}
                    </p>
                    <button
                        onClick={() => window.location.reload()}
                        className="bg-red-600 text-white px-6 py-3 rounded-lg font-bold shadow-lg active:scale-95"
                    >
                        🔄 FORCER L'ACTUALISATION
                    </button>
                    <div className="mt-8 text-xs text-gray-400 font-mono">
                        Debug: {new Date().toLocaleTimeString()}
                    </div>
                </div>
            );
        }

        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
                <Loader2 className="animate-spin text-blue-600 mb-4" size={48} />
                <h2 className="text-xl font-bold text-gray-700">Chargement...</h2>
                <p className="text-gray-500 text-sm mt-2">Patience, le réseau est lent.</p>
            </div>
        );
    }

    if (!modelsLoaded) return <div className="flex flex-col h-full items-center justify-center p-8 text-center"><Loader2 className="animate-spin text-blue-600 mb-4" size={48} /><p className="text-gray-400 font-medium italic">{t('attendance.loading_models')}</p></div>;

    if (status === 'success') return (
        <div className="flex flex-col items-center justify-center h-[80vh] p-4 text-center animate-in zoom-in duration-300">
            <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-green-500 shadow-xl mb-6">
                {matchedPhoto ? <img src={matchedPhoto} className="w-full h-full object-cover" alt="" /> : <CheckCircle size={128} className="text-green-500 p-4" />}
            </div>
            <h2 className="text-2xl font-bold text-green-800">{t('attendance.success_title')}</h2>
            <p className="text-lg text-gray-700 mt-2">{t('attendance.welcome')}, {matchedEmployee}</p>
            <div className={clsx("mt-4 px-6 py-2 rounded-full text-sm font-bold", lastLogType === 'check-in' ? "bg-blue-100 text-blue-700" : "bg-orange-100 text-orange-700")}>
                {lastLogType === 'check-in' ? t('attendance.check_in_recorded') : t('attendance.check_out_recorded')}
            </div>
        </div>
    );

    return (
        <div className="flex flex-col h-full p-4 max-w-md mx-auto relative overflow-hidden">
            <AdminAccessButton isVisible={isAdminButtonVisible} onClick={handleAdminAccess} />
            {detectedKioskEmployee && <AdminSuccessModal isOpen={showAdminSuccessModal} onClose={handleModalClose} employeeName={detectedKioskEmployee} />}

            {!currentZone && (
                <div className="absolute inset-0 bg-white/95 backdrop-blur-md z-50 flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-500">
                    <div className="bg-blue-50 p-6 rounded-full mb-6 animate-bounce">
                        <MapPin className="h-12 w-12 text-blue-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-3">{t('attendance.site_detection')}</h2>
                    <p className="text-gray-600 mb-6">{t('attendance.site_instruction')}</p>
                    {location && <div className="text-xs font-mono text-gray-400 bg-gray-50 px-3 py-1 rounded">GPS: {location.lat.toFixed(5)}, {location.lng.toFixed(5)} (±{Math.round(location.accuracy)}m)</div>}
                </div>
            )}

            <div className={clsx("flex-1 flex flex-col space-y-6 transition-all duration-700", !currentZone && "blur-xl scale-95 opacity-50")}>
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex items-center gap-4">
                    <div className="bg-blue-600 p-3 rounded-xl text-white"><MapPin size={24} /></div>
                    <div className="flex-1">
                        <h2 className="text-xl font-bold text-gray-800">{currentZone?.name || t('attendance.site_detection')}</h2>
                        <p className="text-xs text-gray-400">{t('attendance.site_detected_via_gps')}</p>
                    </div>
                </div>

                <div className="relative aspect-square w-full max-w-[320px] mx-auto bg-black rounded-3xl overflow-hidden shadow-2xl border-4 border-white">
                    <Webcam audio={false} ref={webcamRef} screenshotFormat="image/jpeg" className="w-full h-full object-cover" videoConstraints={{ facingMode: "user" }} mirrored={true} />
                    <div className="absolute inset-0 border-[20px] border-black/10 pointer-events-none"></div>
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="w-48 h-64 border-2 border-white/40 border-dashed rounded-[60px]"></div>
                    </div>
                </div>

                {error && <div className="bg-red-50 text-red-600 p-4 rounded-xl flex items-center gap-3 text-sm font-medium animate-in slide-in-from-top-2"><AlertTriangle size={20} />{error}</div>}

                {error && error.includes("GPS") && (
                    <button
                        onClick={() => window.location.reload()}
                        className="w-full py-3 bg-red-100 text-red-700 rounded-xl font-bold text-sm mb-4 border border-red-200"
                    >
                        🔄 RÉESSAYER LE GPS
                    </button>
                )}

                <button
                    onClick={handlePointage}
                    disabled={status === 'processing' || !currentZone || employees.length === 0}
                    className="w-full py-5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-xl shadow-xl transition-all active:scale-95 disabled:bg-gray-200 disabled:text-gray-400 disabled:shadow-none"
                >
                    {status === 'processing'
                        ? t('attendance.verifying')
                        : (isEmployeesLoading
                            ? (currentZone ? "Synchronisation site..." : "Découverte site (GPS)...")
                            : (!currentZone
                                ? "Recherche de votre site..."
                                : (employees.length === 0
                                    ? "Aucun employé sur ce site"
                                    : t('attendance.check_in_button'))))}
                </button>

                {employees.length === 0 && currentZone && (
                    <p className="mt-4 text-[10px] text-gray-400 font-mono text-center opacity-50">
                        Debug Site ID: {currentZone.adminId}
                    </p>
                )}
            </div>
        </div>
    );
};

export default AttendancePage;

import React, { useState, useRef, useEffect } from 'react';
import Webcam from 'react-webcam';
import * as faceapi from 'face-api.js';
import { useStore } from '../context/StoreContext';
import { MapPin, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { getDistance } from 'geolib';
import { playSuccessBeep } from '../utils/sound';

import AdminAccessButton from '../components/AdminAccessButton';
import AdminSuccessModal from '../components/AdminSuccessModal';


const AttendancePage: React.FC = () => {
    const { employees, zones, logs, addLog, modelsLoaded, loadingError, enableKioskAdmin } = useStore();
    const webcamRef = useRef<Webcam>(null);
    // const navigate = useNavigate(); // Unused due to partial reload fix

    const [location, setLocation] = useState<{ lat: number, lng: number } | null>(null);
    const [currentZone, setCurrentZone] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [status, setStatus] = useState<'idle' | 'capturing' | 'processing' | 'success'>('idle');
    const [matchedEmployee, setMatchedEmployee] = useState<string | null>(null); // For attendance
    const [detectedKioskEmployee, setDetectedKioskEmployee] = useState<string | null>(null); // For Admin Modal name
    const [matchedPhoto, setMatchedPhoto] = useState<string | null>(null);
    const [lastLogType, setLastLogType] = useState<'check-in' | 'check-out' | null>(null);
    const [accuracy, setAccuracy] = useState<number | null>(null);
    const [isAdminButtonVisible, setIsAdminButtonVisible] = useState(false);
    const [showAdminSuccessModal, setShowAdminSuccessModal] = useState(false);

    const scanningIntervalRef = useRef<NodeJS.Timeout | null>(null);


    // Get Location
    useEffect(() => {
        if (!navigator.geolocation) {
            setError("Géolocalisation non supportée par ce navigateur.");
            return;
        }

        const watchId = navigator.geolocation.watchPosition(
            (position) => {
                const { latitude, longitude, accuracy } = position.coords;

                console.log("📍 GPS:", latitude, longitude, "±", accuracy, "m");

                // ⛔ GPS trop imprécis → on refuse
                if (accuracy > 100) {
                    setError("Localisation imprécise. Activez le GPS et sortez à l'extérieur.");
                    return;
                }

                // ✅ GPS OK
                setLocation({
                    lat: latitude,
                    lng: longitude,
                });
                setAccuracy(accuracy);
                // Only clear error if it was a GPS error, not a face error
                setError(prev => (prev?.includes("Localisation") ? null : prev));
            },
            (err) => {
                console.error("❌ GPS ERROR:", err);

                switch (err.code) {
                    case err.PERMISSION_DENIED:
                        setError("Autorisation de localisation refusée.");
                        break;
                    case err.POSITION_UNAVAILABLE:
                        setError("Position indisponible. Activez le GPS.");
                        break;
                    case err.TIMEOUT:
                        setError("Délai GPS dépassé. Réessayez.");
                        break;
                    default:
                        setError("Erreur inconnue de géolocalisation.");
                }
            },
            {
                enableHighAccuracy: true,
                timeout: 20000,
                maximumAge: 0
            }
        );

        return () => navigator.geolocation.clearWatch(watchId);
    }, []);



    // Check zones when location or zones change
    useEffect(() => {
        if (location) {
            const foundZone = zones.find(zone => {
                const dist = getDistance(
                    { latitude: location.lat, longitude: location.lng },
                    { latitude: zone.lat, longitude: zone.lng }
                );
                const GPS_TOLERANCE = 30; // mètres
                return dist <= zone.radius + GPS_TOLERANCE;
            });
            setCurrentZone(foundZone ? foundZone.name : null);
        }
    }, [location, zones]);


    // Continuous Face Scanning for Kiosk Admin
    useEffect(() => {
        if (!modelsLoaded || status === 'processing' || status === 'success') {
            if (scanningIntervalRef.current) clearInterval(scanningIntervalRef.current);
            return;
        }

        const yawHistory: number[] = [];
        const HISTORY_SIZE = 5;
        const MOVEMENT_THRESHOLD = 0.2; // Significant movement required

        const scanFace = async () => {
            if (!webcamRef.current?.video || !webcamRef.current.getScreenshot()) return;

            try {
                const videoEl = webcamRef.current.video;
                if (videoEl.paused || videoEl.ended) return;

                const detection = await faceapi.detectSingleFace(
                    videoEl,
                    new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.5 })
                ).withFaceLandmarks().withFaceDescriptor();

                if (!detection) {
                    setIsAdminButtonVisible(false);
                    yawHistory.length = 0;
                    return;
                }

                const landmarks = detection.landmarks;
                const nose = landmarks.getNose()[3];
                const leftEye = landmarks.getLeftEye()[0];
                const rightEye = landmarks.getRightEye()[3];

                const noseX = nose.x;
                const leftEyeX = leftEye.x;
                const rightEyeX = rightEye.x;

                const dLeft = Math.abs(noseX - leftEyeX);
                const dRight = Math.abs(rightEyeX - noseX);

                const ratio = dLeft / (dRight + 0.001);

                const labeledDescriptors = employees.map(emp =>
                    new faceapi.LabeledFaceDescriptors(emp.id, [new Float32Array(emp.photoDescriptor)])
                );

                if (labeledDescriptors.length === 0) return;

                const faceMatcher = new faceapi.FaceMatcher(labeledDescriptors, 0.6);
                const match = faceMatcher.findBestMatch(detection.descriptor);

                if (match.label !== 'unknown') {
                    const employee = employees.find(e => e.id === match.label);
                    if (employee && employee.isKiosk) {
                        // Authenticated as Kiosk. Now Check Liveness.
                        yawHistory.push(ratio);
                        if (yawHistory.length > HISTORY_SIZE) yawHistory.shift();

                        if (yawHistory.length >= HISTORY_SIZE) {
                            const min = Math.min(...yawHistory);
                            const max = Math.max(...yawHistory);
                            const diff = max - min;

                            if (diff > MOVEMENT_THRESHOLD) {
                                if (!isAdminButtonVisible) { // Only set if not already visible to avoid spam
                                    setDetectedKioskEmployee(`${employee.firstName} ${employee.lastName}`);
                                    setIsAdminButtonVisible(true);
                                }
                            }
                        }
                    } else {
                        setIsAdminButtonVisible(false);
                        yawHistory.length = 0;
                        setDetectedKioskEmployee(null);
                    }
                } else {
                    setIsAdminButtonVisible(false);
                    yawHistory.length = 0;
                    setDetectedKioskEmployee(null);
                }

            } catch (err) {
                console.error("Auto-scan error (silent):", err);
            }
        };

        // Scan somewhat frequently (e.g. 200ms) to capture movement smoothy
        scanningIntervalRef.current = setInterval(scanFace, 200);

        return () => {
            if (scanningIntervalRef.current) clearInterval(scanningIntervalRef.current);
        };
    }, [modelsLoaded, employees, status, isAdminButtonVisible]); // Added isAdminButtonVisible to deps to avoid stale closure if needed, though setState is safe


    const handleAdminAccess = () => {
        console.log("Admin Access Triggered for Kiosk");

        // 1. Elevate Privileges (using Store for reactivity)
        enableKioskAdmin();

        // Mock admin session data if needed (Store handles the main flag)
        const adminSession = {
            timestamp: new Date().toISOString(),
            role: 'admin',
            source: 'kiosk_face_auth'
        };
        localStorage.setItem('kiosk_admin_session', JSON.stringify(adminSession));

        // 2. Show Success Modal
        setShowAdminSuccessModal(true);
    };

    const handleModalClose = () => {
        setShowAdminSuccessModal(false);
        // Force a hard reload to ensure Layout and StoreContext pick up the new localStorage state
        // This fixes the issue where the bottom navigation doesn't appear immediately
        window.location.href = '/admin/employees';
    };


    const handlePointage = async () => {


        if (!webcamRef.current || !modelsLoaded || !currentZone) return;
        setStatus('processing');
        setError(null);

        try {
            let detection = null;
            let attempt = 0;
            const MAX_RETRIES = 3;

            // Retry loop to handle varying lighting/angles
            while (attempt < MAX_RETRIES && !detection) {
                attempt++;
                const imageSrc = webcamRef.current.getScreenshot();
                if (!imageSrc) {
                    if (attempt === MAX_RETRIES) throw new Error("Impossible de capturer la photo.");
                    // If imageSrc is null, and not the last attempt, continue to next attempt
                    await new Promise(r => setTimeout(r, 200)); // Small delay before retry
                    continue;
                }

                // finalImageSrc = imageSrc; // Store the imageSrc for the current attempt

                const currentImg = new Image();
                currentImg.src = imageSrc;
                await new Promise((resolve) => currentImg.onload = resolve);

                // Detect face with SsdMobilenetv1 with permissive threshold
                detection = await faceapi.detectSingleFace(
                    currentImg,
                    new faceapi.SsdMobilenetv1Options({ minConfidence: 0.2 })
                ).withFaceLandmarks().withFaceDescriptor();

                if (!detection && attempt < MAX_RETRIES) {
                    // Small cooling off before retry
                    await new Promise(r => setTimeout(r, 200));
                }
            }

            if (!detection) {
                setError("Aucun visage détecté. Assurez-vous d'être bien éclairé et face caméra.");
                setStatus('idle');
                return;
            }

            // Match face

            // Create FaceMatcher
            const labeledDescriptors = employees.map(emp => {
                return new faceapi.LabeledFaceDescriptors(
                    emp.id,
                    [new Float32Array(emp.photoDescriptor)]
                );
            });

            if (labeledDescriptors.length === 0) {
                setError("Aucun employé enregistré dans la base.");
                setStatus('idle');
                return;
            }

            const faceMatcher = new faceapi.FaceMatcher(labeledDescriptors, 0.6);
            const match = faceMatcher.findBestMatch(detection.descriptor);

            if (match.label === 'unknown') {
                setError("Visage non reconnu. Êtes-vous bien enregistré ?");
                setStatus('idle');
                return;
            }
            const employee = employees.find(e => e.id === match.label);
            if (employee) {
                setMatchedEmployee(`${employee.firstName} ${employee.lastName}`);
                setMatchedPhoto(employee.photo || null);

                // Determine log type (reset daily)
                const today = new Date().toISOString().split('T')[0];
                const employeeLogsToday = logs
                    .filter(l => l.employeeId === employee.id && l.timestamp.startsWith(today))
                    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

                const lastLog = employeeLogsToday[0];
                const newType = (!lastLog || lastLog.type === 'check-out') ? 'check-in' : 'check-out';
                setLastLogType(newType);

                // Re-calculate zone at the exact moment of pointage for reliability
                const zoneAtMoment = zones.find(zone => {
                    const dist = getDistance(
                        { latitude: location!.lat, longitude: location!.lng },
                        { latitude: zone.lat, longitude: zone.lng }
                    );
                    return dist <= zone.radius + 30;
                });

                // Log attendance
                addLog({
                    id: crypto.randomUUID(),
                    employeeId: employee.id,
                    timestamp: new Date().toISOString(),
                    type: newType,
                    location: location || { lat: 0, lng: 0 },
                    verified: true,
                    method: 'face_geo',
                    zoneName: zoneAtMoment ? zoneAtMoment.name : (currentZone || undefined)
                });

                // Play success sound
                playSuccessBeep();

                setStatus('success');
                setTimeout(() => {
                    setStatus('idle');
                    setMatchedEmployee(null);
                    setMatchedPhoto(null);
                    setLastLogType(null);
                }, 3000);
            }

        } catch (err: any) {
            console.error("Attendance error:", err);
            setError(`Erreur: ${err.message || "Problème lors du pointage"}`);
            setStatus('idle');
        }
    };

    if (!modelsLoaded) {
        return (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center animate-in fade-in duration-500">
                {loadingError ? (
                    <div className="text-red-600 bg-red-50 p-6 rounded-xl shadow-sm max-w-xs">
                        <AlertTriangle className="mx-auto mb-3 h-10 w-10" />
                        <p className="font-medium">{loadingError}</p>
                    </div>
                ) : (
                    <div className="flex flex-col items-center gap-4">
                        <div className="relative">
                            <div className="w-16 h-16 border-4 border-blue-100 rounded-full animate-spin border-t-blue-600"></div>
                            <Loader2 className="absolute inset-0 m-auto text-blue-600 animate-pulse" size={24} />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-xl font-semibold text-gray-800">Initialisation IA</h3>
                            <p className="text-sm text-gray-500">Chargement des modèles de reconnaissance...</p>
                        </div>

                        {/* Skeleton mimicking webcam view */}
                        <div className="mt-8 w-64 h-64 bg-gray-100 rounded-2xl animate-pulse flex items-center justify-center border-2 border-gray-200 border-dashed">
                            <div className="text-gray-300">Caméra en attente</div>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    if (status === 'success') {
        return (
            <div className="flex flex-col items-center justify-center h-[80vh] p-4 text-center">
                <div className="relative mb-6">
                    <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-green-500 shadow-lg">
                        {matchedPhoto ? (
                            <img src={matchedPhoto} alt="Matched" className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full bg-green-100 flex items-center justify-center">
                                <CheckCircle size={64} className="text-green-600" />
                            </div>
                        )}
                    </div>
                    <div className="absolute -bottom-2 -right-2 bg-white rounded-full p-1 shadow-md">
                        <CheckCircle size={32} className="text-green-600" />
                    </div>
                </div>
                <h2 className="text-2xl font-bold text-green-800">Pointage Réussi !</h2>
                <p className="text-lg text-gray-700 mt-2">Bonjour, {matchedEmployee}</p>
                <div className={`mt-2 px-4 py-1 rounded-full text-sm font-bold ${lastLogType === 'check-in' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>
                    {lastLogType === 'check-in' ? 'ENTRÉE ENREGISTRÉE' : 'SORTIE ENREGISTRÉE'}
                </div>
                <p className="text-sm text-gray-500 mt-4">
                    {new Date().toLocaleString()} <br />
                    {currentZone}
                </p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full p-4 max-w-md mx-auto relative">
            <AdminAccessButton
                isVisible={isAdminButtonVisible}
                onClick={handleAdminAccess}
            />
            {detectedKioskEmployee && (
                <AdminSuccessModal
                    isOpen={showAdminSuccessModal}
                    onClose={handleModalClose}
                    employeeName={detectedKioskEmployee}
                />
            )}

            <div className="bg-white p-4 rounded-lg shadow-sm mb-4">
                <div className="flex items-center gap-3 text-gray-700 mb-2">
                    <MapPin className={currentZone ? "text-blue-600" : "text-red-500"} />
                    <span className={`font-medium ${!currentZone && location ? "text-red-600" : ""}`}>
                        {location ? (currentZone || "Hors zone autorisée") : "Recherche position..."}
                    </span>
                </div>
                {!currentZone && location && (
                    <div className="flex items-center gap-2 text-red-500 text-xs mt-1 bg-red-50 p-2 rounded">
                        <AlertTriangle size={14} />
                        <span>Le pointage est désactivé en dehors des zones.</span>
                    </div>
                )}
                {location && (
                    <div className="text-xs text-gray-400 ml-9">
                        <p>
                            {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
                        </p>

                        {accuracy !== null && (
                            <p>
                                Précision GPS : ±{Math.round(accuracy)} m
                            </p>
                        )}
                    </div>
                )}

            </div>

            <div className="flex-1 flex flex-col items-center justify-center">
                <div className="relative w-full max-w-[300px] aspect-square bg-black rounded-2xl overflow-hidden shadow-xl mb-4">
                    <Webcam
                        audio={false}
                        ref={webcamRef}
                        screenshotFormat="image/jpeg"
                        className="w-full h-full object-cover"
                        videoConstraints={{ facingMode: "user" }}
                        mirrored={true}
                    />

                    {/* Face Overlay Guide */}
                    <div className="absolute inset-0 border-2 border-white/30 rounded-2xl pointer-events-none">
                        <div className="absolute top-1/4 left-1/4 right-1/4 bottom-1/4 border-2 border-dashed border-white/50 rounded-full"></div>
                    </div>
                </div>

                {error && (
                    <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-lg mb-4 text-sm">
                        <AlertTriangle size={16} />
                        {error}
                    </div>
                )}

                <button
                    onClick={handlePointage}
                    disabled={status === 'processing' || !location || !currentZone || !!error}
                    className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:bg-blue-700 active:scale-95 transition-all disabled:bg-gray-400 disabled:scale-100"
                >
                    {status === 'processing' ? 'Vérification...' : !currentZone && location ? 'ZONE NON AUTORISÉE' : 'POINTER MA PRÉSENCE'}
                </button>
            </div>
        </div>
    );
};

export default AttendancePage;

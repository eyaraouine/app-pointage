import React, { useState, useRef, useEffect } from 'react';
import Webcam from 'react-webcam';
import * as faceapi from 'face-api.js';
import { useStore } from '../context/StoreContext';
import { MapPin, CheckCircle, AlertTriangle } from 'lucide-react';
import { getDistance } from 'geolib';

const AttendancePage: React.FC = () => {
    const { employees, zones, logs, addLog, modelsLoaded, loadingError } = useStore();
    const webcamRef = useRef<Webcam>(null);

    const [location, setLocation] = useState<{ lat: number, lng: number } | null>(null);
    const [currentZone, setCurrentZone] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [status, setStatus] = useState<'idle' | 'capturing' | 'processing' | 'success'>('idle');
    const [matchedEmployee, setMatchedEmployee] = useState<string | null>(null);
    const [matchedPhoto, setMatchedPhoto] = useState<string | null>(null);
    const [lastLogType, setLastLogType] = useState<'check-in' | 'check-out' | null>(null);
    const [accuracy, setAccuracy] = useState<number | null>(null);


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
                setError(null);
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

    const handlePointage = async () => {
        if (!webcamRef.current || !modelsLoaded || !currentZone) return;
        setStatus('processing');
        setError(null);

        try {
            const imageSrc = webcamRef.current.getScreenshot();
            if (!imageSrc) {
                throw new Error("Impossible de capturer la photo.");
            }

            const img = new Image();
            img.src = imageSrc;
            await new Promise((resolve, reject) => {
                img.onload = resolve;
                img.onerror = () => reject(new Error("Impossible de charger l'image capturée."));
            });

            // Detect face with TinyFaceDetector
            const detection = await faceapi.detectSingleFace(
                img,
                new faceapi.TinyFaceDetectorOptions({ inputSize: 416, scoreThreshold: 0.3 })
            ).withFaceLandmarks().withFaceDescriptor();

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
            <div className="p-8 text-center">
                {loadingError ? (
                    <div className="text-red-600 bg-red-50 p-4 rounded-lg">
                        <AlertTriangle className="mx-auto mb-2" />
                        {loadingError}
                    </div>
                ) : (
                    "Chargement des modèles IA..."
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
        <div className="flex flex-col h-full p-4 max-w-md mx-auto">
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
                <div className="relative w-full aspect-[3/4] bg-black rounded-2xl overflow-hidden shadow-xl mb-6">
                    <Webcam
                        audio={false}
                        ref={webcamRef}
                        screenshotFormat="image/jpeg"
                        className="w-full h-full object-cover"
                        videoConstraints={{ facingMode: "user" }}
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

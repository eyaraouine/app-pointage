import React, { useState, useRef, useCallback } from 'react';
import Webcam from 'react-webcam';
import * as faceapi from 'face-api.js';
import { useStore } from '../context/StoreContext';
import { Camera, Save, RefreshCw, CheckCircle, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface EmployeeFormProps {
    onSuccess?: () => void;
}

const EmployeeForm: React.FC<EmployeeFormProps> = ({ onSuccess }) => {
    const { employees, addEmployee, modelsLoaded, loadingError } = useStore();
    const navigate = useNavigate();
    const webcamRef = useRef<Webcam>(null);

    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [matricule, setMatricule] = useState('');
    const [phone, setPhone] = useState('');
    const [isCapturing, setIsCapturing] = useState(false);
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showSuccess, setShowSuccess] = useState(false);

    const capture = useCallback(() => {
        const imageSrc = webcamRef.current?.getScreenshot();
        if (imageSrc) {
            setCapturedImage(imageSrc);
            setIsCapturing(false);
        }
    }, [webcamRef]);

    const retake = () => {
        setCapturedImage(null);
        setIsCapturing(true);
        setError(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!firstName || !lastName || !capturedImage) {
            setError("Veuillez remplir tous les champs et prendre une photo.");
            return;
        }

        if (!modelsLoaded) {
            setError("Les modèles de reconnaissance faciale sont en cours de chargement...");
            return;
        }

        setProcessing(true);
        setError(null);

        try {
            // 1. Basic field checks (Name/Matricule)
            const nameExists = employees.some(emp =>
                emp.firstName.toLowerCase() === firstName.toLowerCase() &&
                emp.lastName.toLowerCase() === lastName.toLowerCase()
            );

            if (nameExists) {
                setError("Un employé avec ce nom et prénom existe déjà.");
                setProcessing(false);
                return;
            }

            if (matricule) {
                const matriculeExists = employees.some(emp => emp.matricule === matricule);
                if (matriculeExists) {
                    setError(`Le matricule ${matricule} est déjà utilisé.`);
                    setProcessing(false);
                    return;
                }
            }

            // 2. Face Detection
            const img = new Image();
            img.src = capturedImage;
            await new Promise((resolve) => { img.onload = resolve; });

            const detection = await faceapi.detectSingleFace(
                img,
                new faceapi.SsdMobilenetv1Options({ minConfidence: 0.4 })
            ).withFaceLandmarks().withFaceDescriptor();

            if (!detection) {
                setError("Aucun visage détecté. Veuillez reprendre la photo.");
                setProcessing(false);
                return;
            }

            // 3. Face Duplicate Check
            if (employees.length > 0) {
                const labeledDescriptors = employees.map(emp => {
                    return new faceapi.LabeledFaceDescriptors(
                        emp.id,
                        [new Float32Array(emp.photoDescriptor)]
                    );
                });

                const faceMatcher = new faceapi.FaceMatcher(labeledDescriptors, 0.5); // 0.5 threshold for registration check
                const match = faceMatcher.findBestMatch(detection.descriptor);

                if (match.label !== 'unknown') {
                    const existingEmp = employees.find(emp => emp.id === match.label);
                    setError(`Ce visage est déjà enregistré pour l'employé : ${existingEmp?.firstName} ${existingEmp?.lastName}.`);
                    setProcessing(false);
                    return;
                }
            }

            // 4. Save employee
            const newEmployee = {
                id: crypto.randomUUID(),
                firstName,
                lastName,
                photoDescriptor: Array.from(detection.descriptor),
                photo: capturedImage,
                matricule: matricule || undefined,
                phone: phone || undefined,
                role: 'employee' as const,
            };

            addEmployee(newEmployee);
            setShowSuccess(true);

            setTimeout(() => {
                if (onSuccess) {
                    onSuccess();
                } else {
                    navigate('/admin/employees');
                }
            }, 2000);
        } catch (err) {
            console.error(err);
            setError("Erreur lors du traitement de la photo.");
        } finally {
            setProcessing(false);
        }
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-md max-w-md mx-auto">
            <h3 className="text-xl font-semibold mb-4">Ajouter un employé</h3>

            {showSuccess && (
                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3 text-green-800 animate-in fade-in slide-in-from-top-4 duration-300">
                    <CheckCircle className="text-green-600" size={24} />
                    <div>
                        <p className="font-bold">Succès !</p>
                        <p className="text-sm">L'employé {firstName} {lastName} a été ajouté.</p>
                    </div>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Prénom</label>
                    <input
                        type="text"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">Nom</label>
                    <input
                        type="text"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
                        required
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Matricule (Optionnel)</label>
                        <input
                            type="text"
                            value={matricule}
                            onChange={(e) => setMatricule(e.target.value)}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
                            placeholder="Ex: M123"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Téléphone (Optionnel)</label>
                        <input
                            type="tel"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
                            placeholder="Ex: 22 123 456"
                        />
                    </div>
                </div>

                <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Photo du visage</label>

                    {!capturedImage ? (
                        <div className="relative bg-black rounded-lg overflow-hidden aspect-[4/3]">
                            {isCapturing ? (
                                <>
                                    <Webcam
                                        audio={false}
                                        ref={webcamRef}
                                        screenshotFormat="image/jpeg"
                                        className="w-full h-full object-cover"
                                        videoConstraints={{ facingMode: "user" }}
                                    />
                                    <button
                                        type="button"
                                        onClick={capture}
                                        className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-white rounded-full p-3 shadow-lg hover:bg-gray-100"
                                    >
                                        <Camera size={24} className="text-blue-600" />
                                    </button>
                                </>
                            ) : (
                                <div className="flex items-center justify-center h-full">
                                    <button
                                        type="button"
                                        onClick={() => setIsCapturing(true)}
                                        className="bg-blue-600 text-white px-4 py-2 rounded-md flex items-center gap-2"
                                    >
                                        <Camera size={20} />
                                        Activer la caméra
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="relative">
                            <img src={capturedImage} alt="Captured" className="w-full rounded-lg" />
                            <button
                                type="button"
                                onClick={retake}
                                className="absolute top-2 right-2 bg-white rounded-full p-2 shadow-md hover:bg-gray-100"
                            >
                                <RefreshCw size={20} className="text-gray-700" />
                            </button>
                        </div>
                    )}
                </div>

                {error && (
                    <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">
                        {error}
                    </div>
                )}

                <button
                    type="submit"
                    disabled={processing || !modelsLoaded || !firstName || !lastName || !capturedImage || showSuccess}
                    className="w-full flex justify-center items-center gap-2 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                    {showSuccess ? (
                        <>
                            <Loader2 size={20} className="animate-spin" />
                            Redirection...
                        </>
                    ) : processing ? (
                        <>
                            <Loader2 size={20} className="animate-spin" />
                            Traitement...
                        </>
                    ) : (
                        <>
                            <Save size={20} />
                            Enregistrer
                        </>
                    )}
                </button>
                {!modelsLoaded && !loadingError && <p className="text-xs text-center text-gray-500 mt-1">Chargement des modèles IA...</p>}
                {loadingError && <p className="text-xs text-center text-red-500 mt-1">{loadingError}</p>}
            </form>
        </div>
    );
};

export default EmployeeForm;

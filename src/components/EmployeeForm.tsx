import React, { useState, useRef, useMemo, useCallback } from 'react';
import Webcam from 'react-webcam';
import * as faceapi from 'face-api.js';
import { useStore } from '../context/StoreContext';
import { Camera, Save, RefreshCw, CheckCircle, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import type { Employee } from '../types';

interface EmployeeFormProps {
    employeeToEdit?: Employee;
    onSuccess?: () => void;
}

const EmployeeForm: React.FC<EmployeeFormProps> = ({ onSuccess, employeeToEdit }) => {
    const { employees, addEmployee, updateEmployee, uploadEmployeePhoto, modelsLoaded, loadingError } = useStore();
    const navigate = useNavigate();
    const webcamRef = useRef<Webcam>(null);

    // MEMOIZATION: Pre-calculate labeled descriptors to avoid UI freeze during duplicate check
    const labeledDescriptors = useMemo(() => {
        if (!employees.length) return [];
        return employees.map(emp => {
            return new faceapi.LabeledFaceDescriptors(
                emp.id,
                [new Float32Array(emp.photoDescriptor)]
            );
        });
    }, [employees]);

    const [firstName, setFirstName] = useState(employeeToEdit?.firstName || '');
    const [lastName, setLastName] = useState(employeeToEdit?.lastName || '');
    const [matricule, setMatricule] = useState(employeeToEdit?.matricule || '');
    const [phone, setPhone] = useState(employeeToEdit?.phone || '');
    const [isKiosk, setIsKiosk] = useState(employeeToEdit?.isKiosk || false);
    const [isCapturing, setIsCapturing] = useState(false);
    const [capturedImage, setCapturedImage] = useState<string | null>(employeeToEdit?.photoURL || employeeToEdit?.photo || null);
    const [processing, setProcessing] = useState(false);
    const [processingStep, setProcessingStep] = useState<string>('');
    const [error, setError] = useState<string | null>(null);
    const [showSuccess, setShowSuccess] = useState(false);

    const capture = useCallback(() => {
        const imageSrc = webcamRef.current?.getScreenshot();
        if (imageSrc) {
            setCapturedImage(imageSrc);
            setIsCapturing(false);
        }
    }, [webcamRef]);

    const compressImage = (base64: string): Promise<string> => {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;
                const maxSize = 300;

                if (width > height) {
                    if (width > maxSize) {
                        height *= maxSize / width;
                        width = maxSize;
                    }
                } else {
                    if (height > maxSize) {
                        width *= maxSize / height;
                        height = maxSize;
                    }
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx?.drawImage(img, 0, 0, width, height);
                resolve(canvas.toDataURL('image/jpeg', 0.6));
            };
            img.src = base64;
        });
    };

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
        setProcessingStep('Vérification...');
        setError(null);

        try {
            // 1. Basic field checks (Name/Matricule)
            const nameExists = employees.some(emp =>
                emp.id !== employeeToEdit?.id &&
                emp.firstName.toLowerCase() === firstName.toLowerCase() &&
                emp.lastName.toLowerCase() === lastName.toLowerCase()
            );

            if (nameExists) {
                setError("Un employé avec ce nom et prénom existe déjà.");
                setProcessing(false);
                return;
            }

            if (matricule) {
                const matriculeExists = employees.some(emp => emp.id !== employeeToEdit?.id && emp.matricule === matricule);
                if (matriculeExists) {
                    setError(`Le matricule ${matricule} est déjà utilisé.`);
                    setProcessing(false);
                    return;
                }
            }

            // 2. Face Detection
            const img = new Image();
            img.src = capturedImage;
            await new Promise((resolve, reject) => {
                img.onload = resolve;
                img.onerror = () => reject(new Error("Impossible de charger l'image capturée."));
            });

            setProcessingStep('Détection du visage...');
            const detection = await faceapi.detectSingleFace(
                img,
                new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.3 })
            ).withFaceLandmarks().withFaceDescriptor();

            if (!detection) {
                setError("Aucun visage détecté. Veuillez reprendre la photo en étant bien éclairé.");
                setProcessing(false);
                return;
            }

            // 3. Face Duplicate Check
            setProcessingStep('Vérification des doublons...');
            const hasNewPhoto = capturedImage !== (employeeToEdit?.photoURL || employeeToEdit?.photo);
            if (hasNewPhoto && labeledDescriptors.length > 0) {
                const faceMatcher = new faceapi.FaceMatcher(labeledDescriptors, 0.5);
                const match = faceMatcher.findBestMatch(detection.descriptor);

                if (match.label !== 'unknown') {
                    const existingEmp = employees.find(emp => emp.id === match.label);
                    setError(`Ce visage est déjà enregistré pour l'employé : ${existingEmp?.firstName} ${existingEmp?.lastName}.`);
                    setProcessing(false);
                    return;
                }
            }

            // 4. Compress and Upload photo if it's new (is a base64 string)
            let photoURL = employeeToEdit?.photoURL || "";
            const isBase64 = capturedImage.startsWith('data:image');

            if (isBase64) {
                setProcessingStep('Optimisation de la photo...');
                const compressed = await compressImage(capturedImage);

                setProcessingStep('Téléchargement de la photo...');
                const tempId = employeeToEdit?.id || (typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : Math.random().toString(36).substring(2));
                photoURL = await uploadEmployeePhoto(tempId, compressed);
            }

            // 5. Save/Update employee
            setProcessingStep('Enregistrement...');
            const employeeData: Employee = {
                id: employeeToEdit?.id || '',
                firstName,
                lastName,
                photoDescriptor: hasNewPhoto ? Array.from(detection.descriptor) : (employeeToEdit?.photoDescriptor || []),
                photo: isBase64 ? "" : (employeeToEdit?.photo || ""), // Clear base64 if we have a URL
                photoURL,
                matricule: matricule || "",
                phone: phone || "",
                role: (employeeToEdit?.role || 'employee') as 'admin' | 'employee',
                isKiosk,
                adminId: employeeToEdit?.adminId,
            };

            if (employeeToEdit) {
                await updateEmployee(employeeData);
            } else {
                await addEmployee(employeeData);
            }
            setShowSuccess(true);

            setTimeout(() => {
                if (onSuccess) {
                    onSuccess();
                } else {
                    navigate('/admin/employees');
                }
            }, 2000);
        } catch (err: any) {
            console.error("Face processing error:", err);
            setError(`Erreur (${processingStep}): ${err.message || "Problème lors du traitement"}`);
        } finally {
            setProcessing(false);
            setProcessingStep('');
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
                        <p className="text-sm">L'employé {firstName} {lastName} a été {employeeToEdit ? 'modifié' : 'ajouté'}.</p>
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

                    <div className="flex items-center gap-2 mt-2">
                        <input
                            type="checkbox"
                            id="isKiosk"
                            checked={isKiosk}
                            onChange={(e) => setIsKiosk(e.target.checked)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label htmlFor="isKiosk" className="text-sm font-medium text-gray-700">
                            Borne de pointage
                        </label>
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
                            {processingStep || 'Traitement...'}
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

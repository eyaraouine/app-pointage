import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { MapPin, Trash2, Loader2 } from 'lucide-react';

const ZoneList: React.FC = () => {
    const { zones, deleteZone } = useStore();
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [localError, setLocalError] = useState<{ id: string, message: string } | null>(null);
    const [showConfirmId, setShowConfirmId] = useState<string | null>(null);

    if (zones.length === 0) {
        return (
            <div className="text-center py-8 text-gray-500">
                Aucune zone définie.
            </div>
        );
    }

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {zones.map((zone) => (
                <div key={zone.id} className="bg-white p-4 rounded-lg shadow flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-transparent hover:border-gray-200 transition-all">
                    <div className="flex items-center gap-4 flex-1">
                        <div className="bg-green-100 p-3 rounded-full">
                            <MapPin className="text-green-600" size={24} />
                        </div>
                        <div>
                            <h4 className="font-semibold text-lg">{zone.name}</h4>
                            <p className="text-sm text-gray-600">
                                Rayon: {zone.radius}m
                            </p>
                            <p className="text-xs text-gray-400">
                                {zone.lat.toFixed(4)}, {zone.lng.toFixed(4)}
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-col items-end gap-2 shrink-0">
                        {showConfirmId === zone.id ? (
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => {
                                        setShowConfirmId(null);
                                    }}
                                    className="text-xs font-semibold px-2 py-1 text-gray-500 hover:bg-gray-100 rounded transition-colors"
                                >
                                    Annuler
                                </button>
                                <button
                                    onClick={async () => {
                                        try {
                                            setLocalError(null);
                                            setDeletingId(zone.id);
                                            await deleteZone(zone.id);
                                            setShowConfirmId(null);
                                        } catch (error: any) {
                                            setLocalError({ id: zone.id, message: error.message || "Échec" });
                                        } finally {
                                            setDeletingId(null);
                                        }
                                    }}
                                    disabled={deletingId === zone.id}
                                    className="text-xs font-bold px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 shadow-sm flex items-center gap-1"
                                >
                                    {deletingId === zone.id ? <Loader2 size={12} className="animate-spin" /> : "Confirmer la suppression"}
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setLocalError(null);
                                    setShowConfirmId(zone.id);
                                }}
                                disabled={deletingId === zone.id}
                                className={`p-2 rounded-full transition-all active:scale-90 ${deletingId === zone.id
                                    ? "text-gray-400 bg-gray-100 cursor-not-allowed"
                                    : "text-red-500 hover:bg-red-50 border border-transparent hover:border-red-100"
                                    }`}
                                title="Supprimer la zone"
                            >
                                <Trash2 size={20} />
                            </button>
                        )}

                        {localError && localError.id === zone.id && (
                            <p className="text-[10px] text-red-600 font-bold bg-red-50 px-2 py-1 rounded border border-red-200 animate-bounce">
                                {localError.message}
                            </p>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default ZoneList;

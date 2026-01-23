import React from 'react';
import { useStore } from '../context/StoreContext';
import { MapPin, Trash2 } from 'lucide-react';

const ZoneList: React.FC = () => {
    const { zones, deleteZone } = useStore();

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
                <div key={zone.id} className="bg-white p-4 rounded-lg shadow flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
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

                    <button
                        onClick={() => {
                            console.log("Delete button clicked for zone:", zone.name, zone.id);
                            if (window.confirm(`Supprimer la zone "${zone.name}" ?`)) {
                                console.log("Confirmation accepted for zone:", zone.id);
                                deleteZone(zone.id);
                            } else {
                                console.log("Confirmation rejected for zone:", zone.id);
                            }
                        }}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors"
                        title="Supprimer"
                    >
                        <Trash2 size={20} />
                    </button>
                </div>
            ))}
        </div>
    );
};

export default ZoneList;

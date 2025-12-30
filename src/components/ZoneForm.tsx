import React, { useState, useRef, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Circle, useMapEvents, useMap } from 'react-leaflet';
import { useStore } from '../context/StoreContext';
import { Save, Search, Loader2, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import L from 'leaflet';

// Fix for default marker icon
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

// Tunisia default center (Tunis)
const TUNISIA_CENTER: [number, number] = [36.8065, 10.1815];

const LocationMarker = ({ position, setPosition }: { position: { lat: number, lng: number } | null, setPosition: (pos: { lat: number, lng: number }) => void }) => {
    useMapEvents({
        click(e) {
            setPosition(e.latlng);
        },
    });

    return position === null ? null : (
        <Marker position={position} />
    );
};

// Component to handle map view changes
const MapViewHandler = ({ center, bounds, zoom }: { center: [number, number] | null, bounds?: L.LatLngBoundsExpression | null, zoom?: number }) => {
    const map = useMap();
    useEffect(() => {
        if (bounds) {
            map.fitBounds(bounds, { padding: [20, 20] });
        } else if (center) {
            map.setView(center, zoom || 13);
        }
    }, [center, bounds, zoom, map]);
    return null;
};

interface Suggestion {
    place_id: number;
    display_name: string;
    lat: string;
    lon: string;
    boundingbox?: string[];
}

interface ZoneFormProps {
    onSuccess?: () => void;
}

const ZoneForm: React.FC<ZoneFormProps> = ({ onSuccess }) => {
    const { zones, addZone } = useStore();
    const navigate = useNavigate();

    const [name, setName] = useState('');
    const [radius, setRadius] = useState(100);
    const [position, setPosition] = useState<{ lat: number, lng: number } | null>(null);
    const [selectedAddress, setSelectedAddress] = useState<string | null>(null);
    const [isReverseGeocoding, setIsReverseGeocoding] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    // Search state
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [mapCenter, setMapCenter] = useState<[number, number] | null>(null);
    const [mapBounds, setMapBounds] = useState<L.LatLngBoundsExpression | null>(null);
    const [mapZoom, setMapZoom] = useState<number>(13);
    const [isLocating, setIsLocating] = useState(false);
    const [searchError, setSearchError] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const suggestionRef = useRef<HTMLDivElement>(null);

    // Reverse geocoding when position changes
    useEffect(() => {
        const fetchAddress = async () => {
            if (!position) {
                setSelectedAddress(null);
                return;
            }

            setIsReverseGeocoding(true);
            try {
                const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${position.lat}&lon=${position.lng}&zoom=18&addressdetails=1`);
                const data = await response.json();
                if (data && data.display_name) {
                    setSelectedAddress(data.display_name);
                } else {
                    setSelectedAddress("Adresse inconnue");
                }
            } catch (err) {
                console.error("Error in reverse geocoding:", err);
                setSelectedAddress("Erreur de localisation");
            } finally {
                setIsReverseGeocoding(false);
            }
        };

        fetchAddress();
    }, [position]);

    // Debounced search for suggestions
    useEffect(() => {
        const timer = setTimeout(async () => {
            if (searchQuery.length > 2 && !isSearching) {
                try {
                    // Optimized for Tunisia
                    const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=5&addressdetails=1&countrycodes=tn`);
                    const data = await response.json();
                    setSuggestions(data);
                    setShowSuggestions(true);
                } catch (err) {
                    console.error("Error fetching suggestions:", err);
                }
            } else {
                setSuggestions([]);
                setShowSuggestions(false);
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [searchQuery]);

    // Close suggestions when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (suggestionRef.current && !suggestionRef.current.contains(event.target as Node)) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelectSuggestion = (suggestion: Suggestion) => {
        const lat = parseFloat(suggestion.lat);
        const lon = parseFloat(suggestion.lon);
        const newCenter: [number, number] = [lat, lon];

        setMapCenter(newCenter);
        setPosition({ lat, lng: lon });
        setSearchQuery(suggestion.display_name);
        setMapZoom(18); // High zoom for specific address

        if (suggestion.boundingbox) {
            const [latMin, latMax, lonMin, lonMax] = suggestion.boundingbox.map(parseFloat);
            setMapBounds([[latMin, lonMin], [latMax, lonMax]]);
        } else {
            setMapBounds(null);
        }

        setShowSuggestions(false);
    };

    const handleLocateMe = () => {
        if (!navigator.geolocation) {
            setError("La géolocalisation n'est pas supportée.");
            return;
        }

        setIsLocating(true);
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const { latitude, longitude } = pos.coords;
                const newPos = { lat: latitude, lng: longitude };
                setPosition(newPos);
                setMapCenter([latitude, longitude]);
                setMapZoom(18);
                setMapBounds(null);
                setIsLocating(false);
            },
            (err) => {
                console.error(err);
                setError("Impossible de vous localiser.");
                setIsLocating(false);
            },
            { enableHighAccuracy: true }
        );
    };

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchQuery.trim()) return;

        setIsSearching(true);
        setSearchError(null);
        setShowSuggestions(false);
        try {
            const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1&countrycodes=tn&addressdetails=1`);
            const data = await response.json();

            if (data && data.length > 0) {
                const { lat, lon, boundingbox, display_name } = data[0];
                const newLat = parseFloat(lat);
                const newLon = parseFloat(lon);
                const newCenter: [number, number] = [newLat, newLon];

                setMapCenter(newCenter);
                setPosition({ lat: newLat, lng: newLon });
                setSearchQuery(display_name);
                setMapZoom(18);

                if (boundingbox) {
                    const [latMin, latMax, lonMin, lonMax] = boundingbox.map(parseFloat);
                    setMapBounds([[latMin, lonMin], [latMax, lonMax]]);
                } else {
                    setMapBounds(null);
                }
            } else {
                setSearchError("Lieu non trouvé.");
            }
        } catch (err) {
            console.error(err);
            setSearchError("Erreur lors de la recherche.");
        } finally {
            setIsSearching(false);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !position) return;
        setError(null);

        // 1. Check for duplicate name
        const nameExists = zones.some(z => z.name.toLowerCase() === name.toLowerCase());
        if (nameExists) {
            setError(`Une zone avec le nom "${name}" existe déjà.`);
            return;
        }

        // 2. Check for duplicate position (using 6 decimal places for precision)
        const positionExists = zones.some(z =>
            z.lat.toFixed(6) === position.lat.toFixed(6) &&
            z.lng.toFixed(6) === position.lng.toFixed(6)
        );
        if (positionExists) {
            setError("Cette position géographique est déjà enregistrée pour une autre zone.");
            return;
        }

        addZone({
            id: crypto.randomUUID(),
            name,
            lat: position.lat,
            lng: position.lng,
            radius,
        });

        setShowSuccess(true);
        setTimeout(() => {
            if (onSuccess) {
                onSuccess();
            } else {
                navigate('/admin/zones');
            }
        }, 2000);
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-md max-w-2xl mx-auto">
            <h3 className="text-xl font-semibold mb-4">Ajouter une zone de pointage</h3>

            {showSuccess && (
                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3 text-green-800 animate-in fade-in slide-in-from-top-4 duration-300">
                    <MapPin className="text-green-600" size={24} />
                    <div>
                        <p className="font-bold">Succès !</p>
                        <p className="text-sm">La zone "{name}" a été enregistrée avec succès.</p>
                    </div>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Nom de la zone</label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
                        placeholder="Ex: Siège Social, Chantier A..."
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">Rayon (mètres)</label>
                    <input
                        type="number"
                        value={radius}
                        onChange={(e) => setRadius(Number(e.target.value))}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
                        min="10"
                        required
                    />
                </div>

                <div className="space-y-2 relative" ref={suggestionRef}>
                    <label className="block text-sm font-medium text-gray-700">Rechercher un lieu (Gratuit)</label>
                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSearch(e)}
                                onFocus={() => searchQuery.length > 2 && setShowSuggestions(true)}
                                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2 pl-10"
                                placeholder="Ville, rue ou adresse..."
                            />
                            <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                        </div>
                        <button
                            type="button"
                            onClick={handleSearch}
                            disabled={isSearching}
                            className="bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200 flex items-center gap-2 transition-colors disabled:opacity-50"
                        >
                            {isSearching ? <Loader2 size={18} className="animate-spin" /> : "Chercher"}
                        </button>
                        <button
                            type="button"
                            onClick={handleLocateMe}
                            disabled={isLocating}
                            className="bg-blue-50 text-blue-600 px-4 py-2 rounded-md hover:bg-blue-100 flex items-center gap-2 transition-colors disabled:opacity-50"
                            title="Ma position actuelle"
                        >
                            {isLocating ? <Loader2 size={18} className="animate-spin" /> : <MapPin size={18} />}
                        </button>
                    </div>

                    {/* Suggestions Dropdown */}
                    {showSuggestions && suggestions.length > 0 && (
                        <div className="absolute z-[1000] w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                            {suggestions.map((suggestion) => (
                                <button
                                    key={suggestion.place_id}
                                    type="button"
                                    onClick={() => handleSelectSuggestion(suggestion)}
                                    className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-start gap-3 border-b border-gray-100 last:border-0"
                                >
                                    <MapPin className="text-gray-400 mt-1 flex-shrink-0" size={16} />
                                    <span className="text-sm text-gray-700 truncate">{suggestion.display_name}</span>
                                </button>
                            ))}
                        </div>
                    )}

                    {searchError && <p className="text-xs text-red-500">{searchError}</p>}
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Position (Cliquez sur la carte)</label>
                    <div className="h-64 rounded-lg overflow-hidden border border-gray-300 relative">
                        <MapContainer center={TUNISIA_CENTER} zoom={7} style={{ height: '100%', width: '100%' }}>
                            <TileLayer
                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                            />
                            <LocationMarker position={position} setPosition={setPosition} />
                            {position && <Circle center={position} radius={radius} />}
                            <MapViewHandler center={mapCenter} bounds={mapBounds} zoom={mapZoom} />
                        </MapContainer>
                    </div>
                    {position && (
                        <div className="mt-2 space-y-1">
                            <p className="text-xs text-gray-500 font-mono">
                                Lat: {position.lat.toFixed(6)}, Lng: {position.lng.toFixed(6)}
                            </p>
                            <div className="flex items-start gap-1 text-sm text-gray-700 bg-gray-50 p-2 rounded-md border border-gray-100">
                                <MapPin size={14} className="mt-1 flex-shrink-0 text-blue-500" />
                                {isReverseGeocoding ? (
                                    <span className="text-gray-400 italic flex items-center gap-2">
                                        <Loader2 size={12} className="animate-spin" />
                                        Récupération de l'adresse...
                                    </span>
                                ) : (
                                    <span>{selectedAddress || "Cliquez sur la carte pour voir l'adresse"}</span>
                                )}
                            </div>
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
                    className="w-full flex justify-center items-center gap-2 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                    disabled={!name || !position || isReverseGeocoding || showSuccess}
                >
                    {showSuccess ? (
                        <>
                            <Loader2 size={20} className="animate-spin" />
                            Redirection...
                        </>
                    ) : (
                        <>
                            <Save size={20} />
                            Enregistrer la zone
                        </>
                    )}
                </button>
            </form>
        </div>
    );
};

export default ZoneForm;

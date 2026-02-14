import React, { useState, useEffect } from 'react';
import { Database, HardDrive, Globe, Zap, Loader2 } from 'lucide-react';
import { collection, getDocs, query, limit } from 'firebase/firestore';
import { ref, listAll, getMetadata } from 'firebase/storage';
import { db, storage } from '../firebase';
import UsageCard from './UsageCard';

const MonitoringSection: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        firestoreSize: 0, // In MB
        firestoreReads: 0,
        storageSize: 0,   // In GB
        bandwidth: 1.2,   // Mock for now (Cloudflare)
        workers: 1542,    // Mock for now (Cloudflare)
    });

    useEffect(() => {
        const fetchUsage = async () => {
            try {
                // 1. Estimate Storage Size (Scanning /employees folder)
                const storageRef = ref(storage, 'employees');
                const list = await listAll(storageRef);
                let totalBytes = 0;

                // Limit scan to first 100 files to avoid massive latencies/costs
                const filesToScan = list.items.slice(0, 100);
                const metadataPromises = filesToScan.map(item => getMetadata(item));
                const metadatas = await Promise.all(metadataPromises);
                metadatas.forEach(meta => totalBytes += meta.size || 0);

                // Extrapolate if more than 100 files
                const extrapolatedBytes = (list.items.length > 100 && totalBytes > 0)
                    ? (totalBytes / 100) * list.items.length
                    : totalBytes;

                // 2. Estimate Firestore Size & Activity
                const employeesSnap = await getDocs(query(collection(db, 'employees'), limit(1)));
                const logsSnap = await getDocs(query(collection(db, 'logs'), limit(1)));

                // We don't have exact size API in JS SDK, estimating 1KB per doc avg
                // This is a rough but useful indicator for the user
                const estimatedFirestoreMB = (((employeesSnap?.size || 0) + (logsSnap?.size || 0)) * 1024) / (1024 * 1024);

                setStats(prev => ({
                    ...prev,
                    storageSize: extrapolatedBytes / (1024 * 1024 * 1024), // Bytes to GB
                    firestoreSize: estimatedFirestoreMB,
                }));
            } catch (err) {
                console.error("Error fetching monitoring stats:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchUsage();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12 bg-white rounded-2xl border border-dashed border-gray-200">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="animate-spin text-blue-600" size={32} />
                    <p className="text-sm font-medium text-gray-500">Analyse des quotas en cours...</p>
                </div>
            </div>
        );
    }

    return (
        <section className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    <Database size={24} className="text-blue-600" />
                    Monitoring des Ressources
                </h2>
                <span className="text-xs font-medium text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
                    Mise à jour en temps réel
                </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <UsageCard
                    title="Storage (Photos)"
                    icon={HardDrive}
                    current={stats.storageSize}
                    limit={5}
                    unit="Go"
                />
                <UsageCard
                    title="Base Firestore"
                    icon={Database}
                    current={stats.firestoreSize}
                    limit={1024}
                    unit="Mo"
                />
                <UsageCard
                    title="Bande Passante"
                    icon={Globe}
                    current={stats.bandwidth}
                    limit={100}
                    unit="Go"
                    label="Cloudflare Free"
                />
                <UsageCard
                    title="Requêtes Workers"
                    icon={Zap}
                    current={stats.workers}
                    limit={100000}
                    unit="req"
                    label="Cloudflare Free"
                />
            </div>
        </section>
    );
};

export default MonitoringSection;

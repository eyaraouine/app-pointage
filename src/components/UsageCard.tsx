import React from 'react';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import clsx from 'clsx';

interface UsageCardProps {
    title: string;
    icon: React.ElementType;
    current: number;
    limit: number;
    unit: string;
    label?: string;
}

const UsageCard: React.FC<UsageCardProps> = ({ title, icon: Icon, current, limit, unit, label = "Plan Gratuit Actif" }) => {
    const percentage = Math.min(Math.round((current / limit) * 100), 100);
    const isAlert = percentage >= 80;

    return (
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className={clsx(
                        "p-2 rounded-lg",
                        isAlert ? "bg-red-50 text-red-600" : "bg-blue-50 text-blue-600"
                    )}>
                        <Icon size={20} />
                    </div>
                    <h4 className="font-bold text-gray-800">{title}</h4>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 bg-gray-50 px-2 py-1 rounded-md border border-gray-100">
                    {label}
                </span>
            </div>

            <div className="space-y-2">
                <div className="flex justify-between items-end">
                    <p className="text-sm text-gray-500">
                        <span className={clsx("font-bold text-lg", isAlert ? "text-red-600" : "text-gray-900")}>
                            {current.toFixed(2)}
                        </span>
                        <span className="ml-1">{unit}</span>
                    </p>
                    <p className="text-xs text-gray-400 font-medium">
                        Quota: {limit} {unit}
                    </p>
                </div>

                <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                    <div
                        className={clsx(
                            "h-full transition-all duration-500 rounded-full",
                            isAlert ? "bg-red-500" : "bg-blue-600"
                        )}
                        style={{ width: `${percentage}%` }}
                    />
                </div>

                <div className="flex items-center gap-2">
                    {isAlert ? (
                        <>
                            <AlertTriangle size={14} className="text-red-500" />
                            <span className="text-[11px] font-bold text-red-500">Attention : Seuil critique (80%+)</span>
                        </>
                    ) : (
                        <>
                            <CheckCircle2 size={14} className="text-green-500" />
                            <span className="text-[11px] font-bold text-green-600">Utilisation optimisée</span>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default UsageCard;

import React from 'react';
import { Shield, PlayCircle, Phone, Mail } from 'lucide-react';
import logoHodourFull from '../assets/hodour_full_logo.png';

const HomePage: React.FC = () => {
    return (
        <div className="flex flex-col min-h-full bg-white text-gray-800">
            {/* 1. En-tête avec Logo et Nom */}
            <header className="flex flex-col items-center py-6 bg-blue-50/30">
                {/* Logo Hodour Complet */}
                <div className="w-64 h-auto flex items-center justify-center mb-2 transition-transform duration-300 hover:scale-105">
                    <img src={logoHodourFull} alt="Hodour - Presence & Punctuality" className="w-full h-full object-contain mix-blend-multiply" />
                </div>
            </header>

            <div className="flex-1 px-6 space-y-10 pb-8">
                {/* 2. Section Vidéos Tutoriels */}
                <section>
                    <div className="flex items-center gap-2 mb-4">
                        <PlayCircle className="text-blue-600" size={24} />
                        <h2 className="text-xl font-bold text-gray-900">Guide d'utilisation</h2>
                    </div>
                    <div className="space-y-4">
                        {/* Placeholder Vidéo 1 */}
                        <div className="bg-gray-100 rounded-xl overflow-hidden shadow-sm aspect-video flex flex-col items-center justify-center group cursor-pointer hover:bg-gray-200 transition-colors">
                            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                                <PlayCircle className="text-blue-600" size={24} fill="currentColor" />
                            </div>
                            <span className="text-sm text-gray-500 font-medium mt-2">Tutoriel : Comment pointer</span>
                        </div>
                        {/* Placeholder Vidéo 2 */}
                        <div className="bg-gray-100 rounded-xl overflow-hidden shadow-sm aspect-video flex flex-col items-center justify-center group cursor-pointer hover:bg-gray-200 transition-colors">
                            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                                <PlayCircle className="text-blue-600" size={24} fill="currentColor" />
                            </div>
                            <span className="text-sm text-gray-500 font-medium mt-2">Tutoriel : Accès Admin</span>
                        </div>
                    </div>
                </section>

                {/* 3. description et Confidentialité */}
                <section className="space-y-6">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 mb-3">À propos de Hodour</h2>
                        <p className="text-gray-600 leading-relaxed text-justify">
                            <strong className="text-gray-800">Hodour</strong> est une application de gestion du temps basée sur le cloud qui se distingue par sa facilité d'utilisation.
                            Elle s'adapte aussi bien aux entreprises ayant des bureaux physiques qu'aux équipes mobiles ou en télétravail.
                        </p>
                        <p className="text-gray-600 leading-relaxed mt-4 text-justify">
                            Pour éviter le "buddy punching" (un employé qui pointe pour un autre), Hodour utilise la <strong className="text-gray-800">reconnaissance faciale</strong>.
                            L'employé prend simplement un selfie pour valider son arrivée ou son départ.
                        </p>
                    </div>

                    <div className="bg-blue-50 p-5 rounded-2xl border border-blue-100">
                        <div className="flex items-center gap-2 mb-3">
                            <Shield className="text-blue-600" size={20} />
                            <h3 className="font-bold text-blue-900">Protection des données</h3>
                        </div>
                        <p className="text-sm text-blue-800 leading-relaxed italic border-l-4 border-blue-300 pl-3">
                            "L'application collecte la géolocalisation uniquement lors du pointage pour valider la présence dans la zone autorisée.
                            Aucun suivi n'est effectué en dehors de ces instants. Les données sont cryptées et gérées conformément aux normes de sécurité."
                        </p>
                    </div>
                </section>

                {/* 4. Contact Éditeur */}
                <section className="border-t border-gray-100 pt-8 mt-8 pb-4">
                    <h2 className="text-lg font-bold text-center text-gray-400 uppercase tracking-widest mb-6">Éditeur</h2>
                    <div className="bg-gray-900 text-white rounded-2xl p-6 shadow-xl relative overflow-hidden mb-8">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl"></div>

                        <div className="relative z-10 text-center space-y-4">
                            <h3 className="text-xl font-bold mb-4">Glory Smart tech</h3>
                            <p className="text-gray-400 text-sm">Ariana, Tunisie</p>

                            <div className="flex flex-col gap-3 pt-2">
                                <a href="https://wa.me/21694990307" className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-500 text-white py-2 rounded-lg transition-colors font-medium">
                                    <Phone size={18} />
                                    <span>WhatsApp : 94 990 307</span>
                                </a>
                                <a href="mailto:glorysmart.tech@gmail.com" className="flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white py-2 rounded-lg transition-colors font-medium backdrop-blur-sm">
                                    <Mail size={18} />
                                    <span>glorysmart.tech@gmail.com</span>
                                </a>
                            </div>
                        </div>
                    </div>

                    {/* Liens Discrets */}
                    <div className="text-center">
                        <a href="/super-admin/instances" className="text-xs text-gray-300 hover:text-gray-500 transition-colors">
                            Gestion des Instances
                        </a>
                    </div>
                </section>

                {/* Espace pour ne pas être caché par la barre de nav */}
                <div className="h-12"></div>
            </div>
        </div>
    );
};

export default HomePage;

import React, { createContext, useContext, useState, useEffect } from 'react';
import { type Language, translations } from '../utils/translations';

interface LanguageContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: (key: string) => string;
    dir: 'ltr' | 'rtl';
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    // 1. Initial State from LocalStorage
    const [language, setLanguageState] = useState<Language>(() => {
        const saved = localStorage.getItem('hodour_lang');
        return (saved as Language) || 'fr';
    });

    const dir = language === 'ar' ? 'rtl' : 'ltr';

    // 2. Sync with DOM and Storage
    useEffect(() => {
        localStorage.setItem('hodour_lang', language);
        document.documentElement.lang = language;
        document.documentElement.dir = dir;
    }, [language, dir]);

    const setLanguage = (lang: Language) => {
        setLanguageState(lang);
    };

    // 3. Translation Helper (Flat Key Support)
    const t = (path: string): string => {
        const keys = path.split('.');
        let result: any = (translations as any)[language];

        for (const key of keys) {
            if (result && result[key]) {
                result = result[key];
            } else {
                // Fallback to FR if key missing in EN/AR
                let fallback: any = translations.fr;
                for (const fKey of keys) {
                    fallback = fallback ? fallback[fKey] : null;
                }
                return fallback || path;
            }
        }

        return result;
    };

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t, dir }}>
            <div dir={dir} className={dir === 'rtl' ? 'font-arabic' : ''}>
                {children}
            </div>
        </LanguageContext.Provider>
    );
};

export const useLanguage = () => {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
};

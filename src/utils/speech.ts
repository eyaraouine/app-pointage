export const speak = (text: string, lang: 'fr' | 'ar' | 'en' = 'fr') => {
    if (!window.speechSynthesis) return;

    // CRITICAL: Cancel any currently playing speech (including the phantom "Thank you")
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);

    // Set language
    switch (lang) {
        case 'ar':
            utterance.lang = 'ar-SA';
            break;
        case 'en':
            utterance.lang = 'en-US';
            break;
        case 'fr':
        default:
            utterance.lang = 'fr-FR';
            break;
    }

    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    // Small timeout to ensure the cancel command has processed
    setTimeout(() => {
        window.speechSynthesis.speak(utterance);
    }, 50);
};

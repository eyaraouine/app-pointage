
/**
 * Plays a success "beep" sound using the Web Audio API.
 * This does not require any external assets.
 */
export const playSuccessBeep = () => {
    try {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContext) return;

        const ctx = new AudioContext();
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        // Success sound: Stable clean "ding"
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(1046.5, ctx.currentTime); // C6 - High C, stable

        // Envelope: Fast attack, exponential decay (Bell-like)
        gainNode.gain.setValueAtTime(0, ctx.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 0.01); // Slightly softer volume
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);

        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.3);

    } catch (e) {
        console.error("Failed to play success beep:", e);
    }
};

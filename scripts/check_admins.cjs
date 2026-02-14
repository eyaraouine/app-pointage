const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs } = require('firebase/firestore');

const firebaseConfig = {
    apiKey: "AIzaSyBeYj-R77m_XC7ctFLwawFZESR77PP19xw",
    authDomain: "app-pointage-ed826.firebaseapp.com",
    projectId: "app-pointage-ed826",
    storageBucket: "app-pointage-ed826.firebasestorage.app",
    messagingSenderId: "464152156428",
    appId: "1:464152156428:web:27ec746ff4776cafe61129"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function check() {
    try {
        console.log("Probing 'admins' collection...");
        const snap = await getDocs(collection(db, 'admins'));
        console.log(`Total admins: ${snap.size}`);
        snap.forEach(doc => {
            console.log(`Admin [${doc.id}]:`, doc.data());
        });
    } catch (e) {
        console.error("Probe failed:", e.message);
    }
    process.exit(0);
}

check();

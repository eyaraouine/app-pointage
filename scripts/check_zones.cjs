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
        const snap = await getDocs(collection(db, 'zones'));
        console.log(`--- SCAN ZONES ---`);
        console.log(`Total: ${snap.size}`);

        snap.forEach(doc => {
            const data = doc.data();
            console.log(`[${doc.id}] ${data.name} - Admin: ${data.adminId}`);
        });
    } catch (e) {
        console.error("Check failed:", e);
    }
    process.exit(0);
}

check();

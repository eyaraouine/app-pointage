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

async function probe() {
    console.log('--- ADMIN MAPPING START ---');
    try {
        const snapAdmins = await getDocs(collection(db, 'admins'));
        console.log(`Total Admins: ${snapAdmins.size}`);
        snapAdmins.forEach(doc => {
            const data = doc.data();
            console.log(`Admin: ${data.email} | ID: ${doc.id} | role: ${data.role}`);
        });
    } catch (e) {
        console.error(e);
    }
    process.exit(0);
}

probe();

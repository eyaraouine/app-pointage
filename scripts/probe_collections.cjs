const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, limit, query } = require('firebase/firestore');

const firebaseConfig = {
    apiKey: "AIzaSyBeYj-R77m_XC7ctFLwawFZESR77PP19xw",
    authDomain: "app-pointage-ed826.firebaseapp.com",
    projectId: "app-pointage-ed826"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const COLLECTIONS = ['admins', 'zones', 'employees', 'logs', 'settings', 'debug_logs', 'users', 'compagnies', 'instances'];

async function probe() {
    for (const coll of COLLECTIONS) {
        try {
            console.log(`Probe [${coll}]...`);
            const q = query(collection(db, coll), limit(1));
            const snap = await getDocs(q);
            console.log(`  -> SUCCESS (Found ${snap.size} docs)`);
        } catch (e) {
            console.log(`  -> FAIL: ${e.message}`);
        }
    }
    process.exit(0);
}

probe();

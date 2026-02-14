import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js';
import { getFirestore, collection, getDocs, query, where, limit } from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js';

const firebaseConfig = {
    apiKey: "AIzaSyBeYj-R77m_XC7ctFLwawFZESR77PP19xw",
    authDomain: "app-pointage-ed826.firebaseapp.com",
    projectId: "app-pointage-ed826",
    storageBucket: "app-pointage-ed826.firebasestorage.app",
    messagingSenderId: "464152156428",
    appId: "1:464152156428:web:27ec746ff4776cafe61129"
};

// This script is meant to be run in a browser or a environment that supports these imports.
// Since I'm in a terminal, I'll use the node-compatible version but I'll use 'firebase' package.
import { initializeApp as initApp } from 'firebase/app';
import { getFirestore as getFS, collection as coll, getDocs as getD, query as qry, where as whr, limit as lim } from 'firebase/firestore';

const app = initApp(firebaseConfig);
const db = getFS(app);

async function probe() {
    const targetId = '9NGj58ZtEohiUgB9HweIKp7ttyj1';
    console.log(`🔎 PROBE: ${targetId}`);

    try {
        const qZones = qry(coll(db, 'zones'), whr('adminId', '==', targetId));
        const snapZones = await getD(qZones);
        console.log(`Zones found: ${snapZones.size}`);
        snapZones.forEach(d => console.log(` - Site: ${d.data().name}`));

        const qEmployees = qry(coll(db, 'employees'), whr('adminId', '==', targetId));
        const snapEmployees = await getD(qEmployees);
        console.log(`Employees for this ID: ${snapEmployees.size}`);

        if (snapEmployees.size === 0) {
            console.log("Searching for ALL employees to find orphaned ones...");
            const all = await getD(qry(coll(db, 'employees'), lim(20)));
            all.forEach(d => {
                const data = d.data();
                console.log(`[${d.id}] ${data.firstName} ${data.lastName} -> adminId: "${data.adminId}"`);
            });
        }
    } catch (e) {
        console.error("Error:", e);
    }
    process.exit(0);
}

probe();

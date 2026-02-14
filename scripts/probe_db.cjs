const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, query, where, limit } = require('firebase/firestore');

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
    const targetId = '9NGj58ZtEohiUgB9HweIKp7ttyj1';
    console.log('--- FIRESTORE PROBE START ---');

    try {
        const qZones = query(collection(db, 'zones'), where('adminId', '==', targetId));
        const snapZones = await getDocs(qZones);
        console.log(`ZONES: ${snapZones.size}`);

        const qEmp = query(collection(db, 'employees'), where('adminId', '==', targetId));
        const snapEmp = await getDocs(qEmp);
        console.log(`EMPLOYEES: ${snapEmp.size}`);

        if (snapEmp.size === 0) {
            console.log('Searching for ALL employees...');
            const all = await getDocs(query(collection(db, 'employees'), limit(10)));
            all.forEach(d => console.log(`[${d.id}] adminId: "${d.data().adminId}"`));
        }
    } catch (e) {
        console.error(e);
    }
    console.log('--- PROBE END ---');
    process.exit(0);
}

probe();

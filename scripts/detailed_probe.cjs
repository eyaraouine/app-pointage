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
    console.log('--- DETAILED PROBE START ---');

    try {
        // 1. Find the site "Bayti"
        const snapZones = await getDocs(collection(db, 'zones'));
        console.log(`Total Zones: ${snapZones.size}`);
        let baytiAdminId = null;
        snapZones.forEach(doc => {
            const data = doc.data();
            console.log(`Zone: "${data.name}" | ID: ${doc.id} | adminId: ${data.adminId}`);
            if (data.name.includes("Bayti")) baytiAdminId = data.adminId;
        });

        // 2. Scan for all unique adminIds in employees
        const snapEmp = await getDocs(collection(db, 'employees'));
        console.log(`Total Employees: ${snapEmp.size}`);
        const adminIds = new Set();
        snapEmp.forEach(doc => adminIds.add(doc.data().adminId));
        console.log('Unique adminIds in employees:', Array.from(adminIds));

        // 3. Search for the specific adminId 9NGj...
        const targetId = '9NGj58ZtEohiUgB9HweIKp7ttyj1';
        const qTarget = query(collection(db, 'employees'), where('adminId', '==', targetId));
        const snapTarget = await getDocs(qTarget);
        console.log(`Employees for 9NGj... : ${snapTarget.size}`);

    } catch (e) {
        console.error(e);
    }
    process.exit(0);
}

probe();

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, doc, updateDoc } = require('firebase/firestore');

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

async function nukeMigrate() {
    const targetId = '9NGj58ZtEohiUgB9HweIKp7ttyj1';
    console.log(`🚀 NUKE MIGRATION to Admin ID: ${targetId}`);

    try {
        // 1. Migrate Employees
        const snapEmployees = await getDocs(collection(db, 'employees'));
        console.log(`Employees found: ${snapEmployees.size}`);
        for (const d of snapEmployees.docs) {
            const data = d.data();
            if (data.adminId !== targetId) {
                console.log(`  -> Updating Employee [${d.id}] ${data.firstName}: ${data.adminId} -> ${targetId}`);
                await updateDoc(doc(db, 'employees', d.id), { adminId: targetId });
            }
        }

        // 2. Migrate Zones
        const snapZones = await getDocs(collection(db, 'zones'));
        console.log(`Zones found: ${snapZones.size}`);
        for (const d of snapZones.docs) {
            const data = d.data();
            if (data.adminId !== targetId) {
                console.log(`  -> Updating Zone [${d.id}] ${data.name}: ${data.adminId} -> ${targetId}`);
                await updateDoc(doc(db, 'zones', d.id), { adminId: targetId });
            }
        }

        console.log(`✅ NUKE MIGRATION COMPLETE!`);
    } catch (e) {
        console.error("Migration failed:", e);
    }
    process.exit(0);
}

nukeMigrate();

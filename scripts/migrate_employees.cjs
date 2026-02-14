const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, doc, updateDoc, query, where } = require('firebase/firestore');

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

async function migrate() {
    const targetId = '9NGj58ZtEohiUgB9HweIKp7ttyj1';
    console.log(`🚀 MIGRATING Employees to Admin ID: ${targetId}`);

    try {
        const snapEmployees = await getDocs(collection(db, 'employees'));
        console.log(`Found ${snapEmployees.size} total employees.`);

        let count = 0;
        for (const d of snapEmployees.docs) {
            const data = d.data();
            if (data.adminId !== targetId) {
                console.log(`Updating [${d.id}] ${data.firstName} ${data.lastName}: ${data.adminId} -> ${targetId}`);
                await updateDoc(doc(db, 'employees', d.id), { adminId: targetId });
                count++;
            }
        }
        console.log(`✅ Successfully updated ${count} employees.`);
    } catch (e) {
        console.error("Migration failed:", e);
    }
    process.exit(0);
}

migrate();

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query, where, limit } from 'firebase/firestore';
import * as dotenv from 'dotenv';
dotenv.config();

const firebaseConfig = {
    apiKey: process.env.VITE_FIREBASE_API_KEY,
    authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function probe() {
    const targetId = '9NGj58ZtEohiUgB9HweIKp7ttyj1';
    console.log(`🔎 Probing employees for Admin ID: ${targetId}`);

    // 1. Check direct match
    const qDirect = query(collection(db, 'employees'), where('adminId', '==', targetId));
    const snapDirect = await getDocs(qDirect);
    console.log(`✅ Direct Match: ${snapDirect.size} employees`);

    // 2. Check all employees (limit 50) to see if there's a typo or different ID
    const snapAll = await getDocs(query(collection(db, 'employees'), limit(50)));
    console.log(`🌍 Sample of all employees (${snapAll.size} found):`);
    snapAll.forEach(doc => {
        const data = doc.data();
        console.log(` - [${doc.id}] Name: ${data.firstName} ${data.lastName}, AdminID: ${data.adminId}`);
    });

    // 3. Look for the site "Bayti" specifically
    const qZones = query(collection(db, 'zones'), where('adminId', '==', targetId));
    const snapZones = await getDocs(qZones);
    console.log(`🏗️ Zones for this ID (${snapZones.size} found):`);
    snapZones.forEach(doc => {
        console.log(` - Zone: ${doc.data().name} (${doc.id})`);
    });

    process.exit(0);
}

probe();

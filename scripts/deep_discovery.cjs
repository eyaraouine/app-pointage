const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs } = require('firebase/firestore');

const firebaseConfig = {
    apiKey: "AIzaSyBeYj-R77m_XC7ctFLwawFZESR77PP19xw",
    authDomain: "app-pointage-ed826.firebaseapp.com",
    projectId: "app-pointage-ed826"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function deepDiscovery() {
    console.log("🚀 DEEP DISCOVERY STARTING...");
    const uniqueIds = new Set();
    const collections = ['zones', 'employees', 'logs', 'settings'];

    for (const collName of collections) {
        try {
            console.log(`Scanning [${collName}]...`);
            const snap = await getDocs(collection(db, collName));
            console.log(`  Found ${snap.size} docs.`);
            snap.forEach(d => {
                const data = d.data();
                if (data.adminId) uniqueIds.add(data.adminId);
                // Also check userId or potential owner fields
                if (data.ownerId) uniqueIds.add(data.ownerId);
            });
        } catch (e) {
            console.log(`  Error on ${collName}: ${e.message}`);
        }
    }

    console.log(`\n🔎 UNIQUE ADMIN IDs DISCOVERED (${uniqueIds.size}):`);
    console.log(Array.from(uniqueIds));

    process.exit(0);
}

deepDiscovery();

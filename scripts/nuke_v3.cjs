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

async function run() {
    const targetId = '9NGj58ZtEohiUgB9HweIKp7ttyj1';
    console.log("Starting Migration v3 to:", targetId);

    const collections = ['employees', 'zones'];

    for (const collName of collections) {
        console.log(`\nChecking collection: ${collName}`);
        const snap = await getDocs(collection(db, collName));
        console.log(`Found ${snap.size} documents.`);

        for (const d of snap.docs) {
            const data = d.data();
            const currentId = data.adminId;
            console.log(` - Doc [${d.id}] Current AdminId: [${currentId}]`);

            if (currentId !== targetId) {
                console.log(`   !!! MISMATCH !!! Upgrading to ${targetId}...`);
                await updateDoc(doc(db, collName, d.id), { adminId: targetId });
                console.log(`   DONE.`);
            } else {
                console.log(`   OK (Matches target)`);
            }
        }
    }
    console.log("\nFINISHED.");
    process.exit(0);
}

run().catch(e => { console.error(e); process.exit(1); });

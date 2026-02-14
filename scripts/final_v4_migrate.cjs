const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, doc, updateDoc } = require('firebase/firestore');

const firebaseConfig = {
    apiKey: "AIzaSyBeYj-R77m_XC7ctFLwawFZESR77PP19xw",
    authDomain: "app-pointage-ed826.firebaseapp.com",
    projectId: "app-pointage-ed826"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const TARGET_ID = '9NGj58ZtEohiUgB9HweIKp7ttyj1';

async function migrate() {
    console.log("Starting Migration v4...");

    try {
        const collections = ['employees', 'zones'];
        for (const col of collections) {
            console.log(`\nCollection: ${col}`);
            const snap = await getDocs(collection(db, col));
            console.log(`Found ${snap.size} docs.`);

            for (const d of snap.docs) {
                const data = d.data();
                if (data.adminId !== TARGET_ID) {
                    console.log(`Updating [${d.id}] from [${data.adminId}] to [${TARGET_ID}]`);
                    await updateDoc(doc(db, col, d.id), { adminId: TARGET_ID });
                } else {
                    console.log(`[${d.id}] Already OK.`);
                }
            }
        }
    } catch (err) {
        console.error("CRITICAL ERROR DURING MIGRATION:");
        console.error(err);
    }
    process.exit(0);
}

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});

migrate();

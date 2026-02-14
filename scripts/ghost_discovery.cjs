const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, doc, getDoc } = require('firebase/firestore');
const { getAuth, signInWithEmailAndPassword } = require('firebase/auth');

const config = {
    apiKey: 'AIzaSyBeYj-R77m_XC7ctFLwawFZESR77PP19xw',
    authDomain: 'app-pointage-ed826.firebaseapp.com',
    projectId: 'app-pointage-ed826'
};

// ghostApp is NOT authenticated
const ghostApp = initializeApp(config, "GhostApp");
const ghostDb = getFirestore(ghostApp);

// mainApp will be authenticated
const mainApp = initializeApp(config, "MainApp");
const mainDb = getFirestore(mainApp);
const mainAuth = getAuth(mainApp);

async function run() {
    try {
        console.log("🔐 Authenticating MainApp as Super Admin...");
        await signInWithEmailAndPassword(mainAuth, 'glorysmart.tech@gmail.com', '94990307');
        console.log("✅ MainApp Authenticated.");

        console.log("\n📡 GHOST DISCOVERY (Unauthenticated)...");
        const uniqueIds = new Set();
        try {
            const zones = await getDocs(collection(ghostDb, 'zones'));
            console.log(`🔎 Ghost saw ${zones.size} zones.`);
            zones.forEach(d => { if (d.data().adminId) uniqueIds.add(d.data().adminId); });
        } catch (e) {
            console.log("❌ Ghost Zones Blocked:", e.message);
        }

        console.log("✨ Discovered IDs:", Array.from(uniqueIds));

        console.log("\n📡 MAIN APP FETCH (Authenticated)...");
        for (const id of uniqueIds) {
            try {
                const snap = await getDoc(doc(mainDb, 'admins', id));
                if (snap.exists()) {
                    console.log(`✅ Found Admin: ${snap.data().name} (${id})`);
                } else {
                    console.log(`⚠️ Admin Doc Missing: ${id}`);
                }
            } catch (e) {
                console.log(`❌ Admin ${id} Restricted for MainApp:`, e.message);
            }
        }

    } catch (error) {
        console.error("💥 FAILED:", error.message);
    }
    process.exit(0);
}

run();

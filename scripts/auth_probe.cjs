const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs } = require('firebase/firestore');
const { getAuth, signInWithEmailAndPassword } = require('firebase/auth');

const config = {
    apiKey: 'AIzaSyBeYj-R77m_XC7ctFLwawFZESR77PP19xw',
    authDomain: 'app-pointage-ed826.firebaseapp.com',
    projectId: 'app-pointage-ed826'
};

const app = initializeApp(config);
const db = getFirestore(app);
const auth = getAuth(app);

async function run() {
    try {
        console.log("🔐 Authenticating as Super Admin...");
        const userCred = await signInWithEmailAndPassword(auth, 'glorysmart.tech@gmail.com', '94990307');
        console.log("✅ Authenticated UID:", userCred.user.uid);

        console.log("\n📡 Probing [zones]...");
        try {
            const zonesSnap = await getDocs(collection(db, 'zones'));
            console.log(`✅ ZONES LISTED: ${zonesSnap.size} docs`);
            zonesSnap.forEach(d => console.log('  -', d.data().name, d.data().adminId));
        } catch (e) {
            console.log(`❌ ZONES FAILED: ${e.message}`);
        }

        console.log("\n📡 Probing [employees]...");
        try {
            const empsSnap = await getDocs(collection(db, 'employees'));
            console.log(`✅ EMPLOYEES LISTED: ${empsSnap.size} docs`);
        } catch (e) {
            console.log(`❌ EMPLOYEES FAILED: ${e.message}`);
        }

        console.log("\n📡 Probing [admins]...");
        try {
            const adminsSnap = await getDocs(collection(db, 'admins'));
            console.log(`✅ ADMINS LISTED: ${adminsSnap.size} docs`);
        } catch (e) {
            console.log(`❌ ADMINS FAILED: ${e.message}`);
        }

    } catch (error) {
        console.error("💥 AUTH FAILED:", error.message);
    }
    process.exit(0);
}

run();

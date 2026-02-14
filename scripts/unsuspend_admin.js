import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc, updateDoc } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyBeYj-R77m_XC7ctFLwawFZESR77PP19xw",
    authDomain: "app-pointage-ed826.firebaseapp.com",
    projectId: "app-pointage-ed826",
    storageBucket: "app-pointage-ed826.firebasestorage.app",
    messagingSenderId: "464152156428",
    appId: "1:464152156428:web:27ec746ff4776cafe61129",
    measurementId: "G-MJJ6J7CTBP"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const adminId = "9NGj58ZtEohiUgB9HweIKp7ttyj1"; // Hatem UID (glorysmart.tech@gmail.com)

async function checkAndFix() {
    console.log("🔍 Checking admin:", adminId);
    const adminRef = doc(db, "admins", adminId);
    const snap = await getDoc(adminRef);

    if (!snap.exists()) {
        console.log("❌ Admin not found in 'admins' collection!");

        // Try to check if it's under a different ID or in public index
        return;
    }

    const data = snap.data();
    console.log("📊 Current Data:", data);

    if (data.suspended === true) {
        console.log("⚠️ Admin is SUSPENDED. Fixing...");
        await updateDoc(adminRef, { suspended: false });
        console.log("✅ Unsuspend successful!");
    } else {
        console.log("✅ Admin is ALREADY active (not suspended).");
    }
}

checkAndFix().catch(e => {
    console.error("🔥 Error:", e);
    process.exit(1);
});

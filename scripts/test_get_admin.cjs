const { initializeApp } = require('firebase/app');
const { getFirestore, doc, getDoc } = require('firebase/firestore');

const firebaseConfig = {
    apiKey: "AIzaSyBeYj-R77m_XC7ctFLwawFZESR77PP19xw",
    authDomain: "app-pointage-ed826.firebaseapp.com",
    projectId: "app-pointage-ed826"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const TARGET_IDS = ['9NGj58ZtEohiUgB9HweIKp7ttyj1', 'GPdf0zYahP8y1'];

async function testGetDoc() {
    for (const id of TARGET_IDS) {
        try {
            console.log(`Testing getDoc(admins, ${id})...`);
            const d = await getDoc(doc(db, 'admins', id));
            if (d.exists()) {
                console.log(`  -> SUCCESS! Data:`, d.data());
            } else {
                console.log(`  -> NOT FOUND.`);
            }
        } catch (e) {
            console.log(`  -> FAIL: ${e.message}`);
        }
    }
    process.exit(0);
}

testGetDoc();

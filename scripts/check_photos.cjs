const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function checkEmployeePhotos() {
    console.log('🔍 Vérification des photos des employés...\n');

    try {
        const snapshot = await db.collection('employees').get();

        console.log(`📊 Total employés: ${snapshot.size}\n`);

        snapshot.forEach(doc => {
            const data = doc.data();
            const hasPhoto = !!data.photo;
            const hasPhotoURL = !!data.photoURL;

            console.log(`👤 ${data.firstName || 'Inconnu'} ${data.lastName || ''}`);
            console.log(`   ID: ${doc.id}`);
            console.log(`   photo (base64): ${hasPhoto ? '✅ OUI' : '❌ NON'}`);
            console.log(`   photoURL (Firebase Storage): ${hasPhotoURL ? '✅ OUI' : '❌ NON'}`);

            if (hasPhotoURL) {
                console.log(`   URL: ${data.photoURL.substring(0, 80)}...`);
            }
            console.log('');
        });

        const withPhoto = snapshot.docs.filter(d => d.data().photo).length;
        const withPhotoURL = snapshot.docs.filter(d => d.data().photoURL).length;

        console.log('\n📈 RÉSUMÉ:');
        console.log(`   Employés avec photo (base64): ${withPhoto}/${snapshot.size}`);
        console.log(`   Employés avec photoURL (Storage): ${withPhotoURL}/${snapshot.size}`);

        if (withPhotoURL === 0) {
            console.log('\n⚠️  PROBLÈME DÉTECTÉ:');
            console.log('   Aucun employé n\'a de photoURL dans Firebase Storage.');
            console.log('   Les photos sont peut-être stockées uniquement en base64 dans le champ "photo".');
            console.log('   Solution: Migrer les photos base64 vers Firebase Storage.');
        }

    } catch (error) {
        console.error('❌ Erreur:', error);
    }

    process.exit(0);
}

checkEmployeePhotos();

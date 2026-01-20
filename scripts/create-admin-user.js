/**
 * Script para criar usuário admin no Firebase Authentication
 * 
 * Execute: node scripts/create-admin-user.js
 * 
 * Requisitos:
 * - Ter as variáveis de ambiente do Firebase configuradas
 * - Ou ter o arquivo de credenciais do Firebase
 */

import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import dotenv from 'dotenv';

// Carrega variáveis de ambiente
dotenv.config();

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID
};

const ADMIN_EMAIL = 'admin@adventurelabs.com.br';
const ADMIN_PASSWORD = 'admin123';

async function createAdminUser() {
  try {
    console.log('Inicializando Firebase...');
    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    const db = getFirestore(app);

    console.log(`Criando usuário admin: ${ADMIN_EMAIL}...`);
    
    // Cria o usuário no Firebase Authentication
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      ADMIN_EMAIL,
      ADMIN_PASSWORD
    );

    const user = userCredential.user;
    console.log('✅ Usuário criado com sucesso!');
    console.log(`   UID: ${user.uid}`);
    console.log(`   Email: ${user.email}`);

    // Cria o registro de role no Firestore
    console.log('Configurando role de admin no Firestore...');
    await setDoc(doc(db, 'userRoles', user.uid), {
      email: ADMIN_EMAIL,
      role: 'admin',
      createdAt: new Date().toISOString(),
      createdBy: 'system'
    });

    console.log('✅ Role de admin configurada com sucesso!');
    console.log('\n🎉 Usuário admin criado e configurado!');
    console.log(`\nCredenciais:`);
    console.log(`   Email: ${ADMIN_EMAIL}`);
    console.log(`   Senha: ${ADMIN_PASSWORD}`);
    console.log('\n⚠️  IMPORTANTE: Altere a senha após o primeiro login!');

    process.exit(0);
  } catch (error) {
    console.error('❌ Erro ao criar usuário admin:', error.message);
    
    if (error.code === 'auth/email-already-in-use') {
      console.log('\n⚠️  O usuário já existe. Verificando role...');
      // Se o usuário já existe, apenas atualiza a role
      try {
        const app = initializeApp(firebaseConfig);
        const db = getFirestore(app);
        const auth = getAuth(app);
        
        // Busca o usuário pelo email (precisa fazer login primeiro ou usar Admin SDK)
        console.log('Para atualizar a role de um usuário existente, use o Firebase Console ou Admin SDK.');
        console.log('Ou execute este script após fazer login com o usuário.');
      } catch (updateError) {
        console.error('Erro ao atualizar role:', updateError.message);
      }
    }
    
    process.exit(1);
  }
}

createAdminUser();

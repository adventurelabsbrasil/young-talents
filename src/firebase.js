// Firebase Configuration - Módulo Único
// Centraliza a inicialização do Firebase para toda a aplicação

import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Configuração do Firebase
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Validação das variáveis de ambiente
const hasRequiredConfig = firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.authDomain;
if (!hasRequiredConfig) {
  console.error('[Firebase] Erro: Variáveis de ambiente não configuradas corretamente.');
  console.error('[Firebase] Config:', {
    hasApiKey: !!firebaseConfig.apiKey,
    hasProjectId: !!firebaseConfig.projectId,
    hasAuthDomain: !!firebaseConfig.authDomain
  });
  console.error('[Firebase] Verifique se todas as variáveis VITE_FIREBASE_* estão definidas no Vercel.');
}

// Inicializa Firebase App (idempotente - pode ser chamado múltiplas vezes)
let app;
let auth;
let db;

try {
  if (!hasRequiredConfig) {
    throw new Error('Configuração do Firebase incompleta. Verifique as variáveis de ambiente no Vercel.');
  }
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
} catch (error) {
  console.error('[Firebase] Erro ao inicializar Firebase:', error);
  // Não lança erro aqui para permitir que a aplicação carregue
  // A aplicação deve tratar o erro de forma mais amigável
  // Em produção, isso deve mostrar uma mensagem de erro ao usuário
}

// Exporta para uso em toda a aplicação
export { app, auth, db };
export default { app, auth, db };

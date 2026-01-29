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

// Inicializa Firebase App (idempotente - pode ser chamado múltiplas vezes)
// Firebase é opcional - se não estiver configurado, exporta undefined
let app = undefined;
let auth = undefined;
let db = undefined;

// Apenas inicializa se tiver configuração completa
// Não mostra erros no console - Firebase é opcional agora
if (hasRequiredConfig) {
  try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
  } catch (error) {
    // Silencioso - não mostra erro no console
    // Firebase é opcional, a aplicação pode funcionar sem ele
    app = undefined;
    auth = undefined;
    db = undefined;
  }
}

// Exporta para uso em toda a aplicação
export { app, auth, db };
export default { app, auth, db };

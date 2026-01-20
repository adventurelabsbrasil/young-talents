# Guia: Criar Usuário Admin no Firebase

Este guia explica como criar o usuário administrador no Firebase Authentication.

## Opção 1: Firebase Console (Recomendado)

1. Acesse o [Firebase Console](https://console.firebase.google.com/)
2. Selecione seu projeto
3. Vá em **Authentication** > **Users**
4. Clique em **Add user**
5. Preencha:
   - **Email**: `admin@adventurelabs.com.br`
   - **Password**: `admin123`
   - Marque **Email/Password** como provedor
6. Clique em **Add user**

### Configurar Role de Admin

Após criar o usuário, você precisa adicionar a role no Firestore:

1. No Firebase Console, vá em **Firestore Database**
2. Crie uma coleção chamada `userRoles` (se não existir)
3. Crie um documento com o **ID** igual ao **UID** do usuário criado
4. Adicione os seguintes campos:
   ```json
   {
     "email": "admin@adventurelabs.com.br",
     "role": "admin",
     "createdAt": "2025-01-XX...",
     "createdBy": "system"
   }
   ```

## Opção 2: Script Node.js

### Pré-requisitos

1. Instale as dependências:
   ```bash
   npm install firebase dotenv
   ```

2. Certifique-se de que as variáveis de ambiente estão configuradas no arquivo `.env`:
   ```
   VITE_FIREBASE_API_KEY=...
   VITE_FIREBASE_AUTH_DOMAIN=...
   VITE_FIREBASE_PROJECT_ID=...
   VITE_FIREBASE_STORAGE_BUCKET=...
   VITE_FIREBASE_MESSAGING_SENDER_ID=...
   VITE_FIREBASE_APP_ID=...
   ```

3. Execute o script:
   ```bash
   node scripts/create-admin-user.js
   ```

## Opção 3: Firebase Admin SDK (Mais Seguro)

Para produção, recomenda-se usar o Firebase Admin SDK:

1. Instale o Admin SDK:
   ```bash
   npm install firebase-admin
   ```

2. Crie um arquivo `scripts/create-admin-admin-sdk.js`:
   ```javascript
   const admin = require('firebase-admin');
   const serviceAccount = require('./path/to/serviceAccountKey.json');

   admin.initializeApp({
     credential: admin.credential.cert(serviceAccount)
   });

   admin.auth().createUser({
     email: 'admin@adventurelabs.com.br',
     password: 'admin123',
     emailVerified: true
   })
   .then((userRecord) => {
     console.log('Usuário criado:', userRecord.uid);
     
     // Criar role no Firestore
     return admin.firestore().collection('userRoles').doc(userRecord.uid).set({
       email: 'admin@adventurelabs.com.br',
       role: 'admin',
       createdAt: admin.firestore.FieldValue.serverTimestamp(),
       createdBy: 'system'
     });
   })
   .then(() => {
     console.log('Role de admin configurada!');
     process.exit(0);
   })
   .catch((error) => {
     console.error('Erro:', error);
     process.exit(1);
   });
   ```

## Verificação

Após criar o usuário:

1. Acesse a aplicação
2. Faça login com:
   - **Email**: `admin@adventurelabs.com.br`
   - **Senha**: `admin123`
3. Verifique se você tem acesso completo (role admin)

## Segurança

⚠️ **IMPORTANTE**: Após o primeiro login, altere a senha padrão!

1. Faça login com as credenciais padrão
2. Vá em **Configurações** > **Perfil** (ou similar)
3. Altere a senha para uma senha forte

## Troubleshooting

### Erro: "Email já está em uso"
- O usuário já existe. Use o Firebase Console para verificar ou resetar a senha.

### Erro: "Permissão negada"
- Verifique se as regras do Firestore permitem escrita na coleção `userRoles`
- Adicione temporariamente esta regra:
  ```javascript
  match /userRoles/{userId} {
    allow write: if request.auth != null;
  }
  ```

### Usuário criado mas sem permissões
- Verifique se o documento foi criado corretamente na coleção `userRoles`
- Verifique se o campo `role` está definido como `"admin"`

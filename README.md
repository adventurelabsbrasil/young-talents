# React + Vite

# 🏆 Young Talents ATS

Sistema de Gerenciamento de Recrutamento (ATS - Applicant Tracking System) desenvolvido com React + Vite + Firebase.

## 📋 Funcionalidades

- **Pipeline de Talentos**: Visualização kanban com drag & drop dos candidatos
- **Banco de Talentos**: Tabela com busca, filtros, paginação e ordenação
- **Dashboard**: Gráficos e KPIs de recrutamento
- **Gestão de Vagas**: Criação e acompanhamento de vagas
- **Autenticação**: Login com Google
- **Tema**: Toggle dark/light com persistência (corrigido)
- **Importação CSV**: Mapeamento inteligente de campos com auto-detecção melhorada
- **Campos do Candidato**: Seletores apropriados para cidade, fonte, áreas de interesse
- **Botões de Ação**: Edição, visibilidade e popups funcionando corretamente
- **Responsivo**: Otimizado para desktop e tablet

## 🚀 Quick Start

### Pré-requisitos
- Node.js 16+
- npm ou yarn

### Instalação

\`\`\`bash
# Clone o repositório
git clone https://github.com/rodrigoribasyoung/young-hunt-ats.git
cd young-hunt-ats

# Instale dependências
npm install

# Configure variáveis de ambiente
cp .env.example .env.local
# Edite .env.local e adicione suas credenciais Firebase

# Inicie o servidor de desenvolvimento
npm run dev
\`\`\`

Acesse \`http://localhost:5173\`

## 📦 Build e Deploy

\`\`\`bash
# Build para produção
npm run build

# Preview do build
npm run preview
\`\`\`

### Deploy no Vercel

1. Conecte seu repositório no [Vercel](https://vercel.com)
2. Adicione variáveis de ambiente no dashboard:
	- \`VITE_FIREBASE_API_KEY\`
	- \`VITE_FIREBASE_AUTH_DOMAIN\`
	- \`VITE_FIREBASE_PROJECT_ID\`
	- \`VITE_FIREBASE_STORAGE_BUCKET\`
	- \`VITE_FIREBASE_MESSAGING_SENDER_ID\`
	- \`VITE_FIREBASE_APP_ID\`
3. Clique em "Deploy"

## 🔐 Configuração Firebase

1. Crie um projeto no [Firebase Console](https://console.firebase.google.com)
2. Ative Google Authentication
3. Crie um arquivo \`.env.local\`:

\`\`\`env
VITE_FIREBASE_API_KEY=sua_api_key
VITE_FIREBASE_AUTH_DOMAIN=seu_auth_domain
VITE_FIREBASE_PROJECT_ID=seu_project_id
VITE_FIREBASE_STORAGE_BUCKET=seu_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=seu_messaging_sender_id
VITE_FIREBASE_APP_ID=seu_app_id
\`\`\`

## 📚 Documentação

- [TESTE_COMPLETO.md](./TESTE_COMPLETO.md) - Guia completo de teste com Hunter
- [TROUBLESHOOTING_LOGIN.md](./TROUBLESHOOTING_LOGIN.md) - Solução de problemas de autenticação
- [TECHNICAL_CHANGES.md](./TECHNICAL_CHANGES.md) - Mudanças técnicas realizadas

## 🛠️ Scripts Disponíveis

\`\`\`bash
npm run dev      # Servidor de desenvolvimento
npm run build    # Build para produção
npm run preview  # Preview do build
npm run lint     # Verificar linting
\`\`\`

## 📱 Estrutura do Projeto

\`\`\`
src/
├── App.jsx                 # Aplicação principal
├── constants.js            # Constantes (Pipeline stages, cores, etc)
├── ThemeContext.jsx        # Context para tema dark/light
├── components/
│   ├── SettingsPage.jsx   # Página de configurações
│   └── modals/
│       ├── TransitionModal.jsx      # Modal de transição entre etapas
│       ├── JobsCandidateModal.jsx   # Modal de candidatos de vagas
│       └── CsvImportModal.jsx       # Modal de importação CSV
├── assets/                 # Imagens e assets
└── index.css              # Estilos globais
\`\`\`

## 🎯 Tecnologias

- **React 18.3** - UI Framework
- **Vite 5.4** - Build tool
- **Firebase 11.0** - Backend e autenticação
- **Recharts 2.13** - Gráficos
- **Tailwind CSS 3.4** - Styling
- **Lucide React 0.460** - Icons

## 🐛 Troubleshooting

### Login Google não funciona
Ver [TROUBLESHOOTING_LOGIN.md](./TROUBLESHOOTING_LOGIN.md)

### Porta 5173 em uso
\`\`\`bash
npm run dev -- --port 3000
\`\`\`

## 📝 Licença

Proprietário - Young Talents

## 👥 Contribuidores

- Rodrigo Ribas (Young Talents)
- GitHub Copilot (Desenvolvimento)

## 🔧 Correções e Melhorias Recentes

### Fixes (Correções)
- ✅ **Toggle Dark/Light Mode**: Corrigido bug do tema - adicionado `darkMode: 'class'` no Tailwind config
- ✅ **Campos do Candidato**: Corrigido mapeamento de campos - cidade, fonte e áreas de interesse agora usam selects apropriados
- ✅ **Botões de Edição/Visibilidade**: Corrigidos botões no Kanban - agora aparecem corretamente no hover com melhor z-index
- ✅ **TransitionModal**: Adicionado suporte para campo 'city' com select de cidades
- ✅ **CandidateModal**: Melhorado para usar selects para cidade, fonte e áreas de interesse ao invés de inputs de texto

### Features (Melhorias)
- ✨ **Auto-guess Mapping CSV**: Melhorado algoritmo de detecção automática de campos no CSV
- ✨ **Botões de Ação no Kanban**: Adicionado botão de edição junto com botões de contratar/reprovar
- ✨ **Melhor UX**: Campos com selects apropriados melhoram a consistência dos dados

---

**Status:** ✅ Pronto para Produção

Última atualização: 4 de Dezembro, 2025

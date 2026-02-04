# 🏆 Young Talents ATS

Sistema de Gerenciamento de Recrutamento (ATS - Applicant Tracking System) desenvolvido com **React**, **Vite** e **Supabase**.

## 📋 Funcionalidades Principais

### 🎯 Gestão de Candidatos
- **Pipeline Kanban**: Visualização em colunas com drag & drop para mover candidatos entre etapas
- **Banco de Talentos**: Tabela completa com todas as informações dos candidatos
  - Colunas: Nome, Email, Telefone, Cidade, Fonte, Áreas de Interesse, Formação, Escolaridade, CNH, Status, Data de Cadastro
  - Busca em tempo real por múltiplos campos
  - Ordenação por qualquer coluna (clique no cabeçalho)
  - Paginação configurável (5, 10, 25, 50, 100, 500, 1000 itens por página)
- **Filtros Avançados**: 
  - Período (últimos 7/30/90 dias ou personalizado)
  - Status/Etapa da Pipeline (seleção múltipla)
  - Vaga vinculada (seleção múltipla)
  - Cidade (seleção múltipla com busca por texto)
  - Área de Interesse (seleção múltipla com busca por texto)
  - Fonte/Origem (seleção múltipla com busca por texto)
  - Escolaridade (seleção múltipla, ordenado alfabeticamente)
  - Estado Civil (seleção múltipla, ordenado alfabeticamente)
  - CNH (Sim/Não)
- **Menu de Avanço de Etapa**: Menu destacado na primeira aba do formulário de candidato para avançar etapas rapidamente
- **Normalização Inteligente**: Padronização automática de cidades, fontes e áreas de interesse

### 💼 Gestão de Vagas
- **Cadastro Completo**: Título, Empresa, Cidade, Área de Interesse, Status, Tipo, Faixa Salarial, Descrição, Requisitos
- **Vincular a Base**: Empresas, Cidades e Áreas de Interesse vinculadas às collections do sistema
- **Visualização por Abas**: 
  - Por Status (Aberta, Preenchida, Cancelada, Fechada)
  - Por Cidade
  - Por Empresa
  - Por Período (data de criação)
- **Candidatos Vinculados**: Visualizar quantos candidatos estão associados a cada vaga

### 🏢 Gestão de Empresas/Unidades
- **CRUD Completo**: Criar, editar e excluir empresas
- **Campos**: Nome, Cidade, Área de Interesse, Endereço, Telefone, Email
- **Integração**: Empresas cadastradas aparecem automaticamente no cadastro de vagas

### 📊 Dashboard
- **KPIs Principais**: Total de Candidatos, Contratados, Vagas Abertas, Reprovados
- **Gráficos Interativos**:
  - Candidatos por Status (Pizza)
  - Candidatos por Cidade (Barras)
  - Candidatos por Fonte/Origem (Barras)
  - Candidatos por Área de Interesse (Barras)
  - Candidatos por Mês (Linha)
- **Responsivo**: Gráficos adaptáveis com legendas e tooltips melhorados

### 📥 Importação e Exportação
- **Importação CSV/XLSX**:
  - Download de modelo (CSV ou XLSX) com 3 linhas de exemplo
  - Mapeamento inteligente de colunas com auto-detecção
  - Revisão de vínculos antes da importação
  - Opções de duplicação: Pular (manter atual), Substituir/Atualizar, Duplicar
  - Tags de importação automáticas (nome do arquivo + data + hora) ou personalizadas
  - Normalização automática de cidades, fontes e áreas de interesse
- **Exportação**: Exportar candidatos ou vagas em formato CSV ou Excel (XLSX)

### ⚙️ Configurações
- **Gerenciamento de Campos**: 
  - Seções separadas para Campos do Candidato e Campos da Vaga
  - Toggle de visibilidade e obrigatoriedade (funcional)
  - Busca de campos
- **Configuração do Pipeline**: 
  - Adicionar, editar e remover etapas do funil
  - Gerenciar motivos de perda
- **Empresas/Unidades**: Gerenciamento completo de empresas
- **Histórico de Ações**: Registro de todas as ações em massa (importações, exportações, exclusões)
- **Usuários**: Gerenciamento de usuários do sistema (criação via Configurações ou script/Edge Function)
- **Modelos de Email**: Templates de email automáticos (planejado)

### 🎨 Interface e UX
- **Tema Dark/Light**: Toggle com persistência e suporte completo
- **Design Universal**: Cores padrão (blue/gray) para melhor contraste e legibilidade
- **Responsivo**: Otimizado para desktop, tablet e mobile
- **URLs Compartilháveis**: Cada página e modal tem URL única para compartilhamento
- **Paginação**: Implementada em Pipeline (Kanban e Lista) e Banco de Talentos
- **Soft Delete**: Exclusão lógica com preservação de dados
- **Histórico de Ações**: Rastreamento completo de modificações por usuário

## 🚀 Quick Start

### Pré-requisitos
- Node.js 16+
- npm ou yarn

### Instalação

```bash
# Clone o repositório
git clone <url-do-repositorio>
cd young-talents

# Instale dependências
npm install

# Configure variáveis de ambiente (crie .env.local)
# VITE_SUPABASE_URL=https://seu-projeto.supabase.co
# VITE_SUPABASE_ANON_KEY=sua-anon-key-aqui

# Inicie o servidor de desenvolvimento
npm run dev
```

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
	- \`VITE_SUPABASE_URL\` - URL do seu projeto Supabase
	- \`VITE_SUPABASE_ANON_KEY\` - Anon key do Supabase
3. Clique em "Deploy"

## 🔐 Configuração Supabase

1. Crie um projeto no [Supabase](https://supabase.com)
2. Execute as migrations SQL (veja `supabase/migrations/`)
3. Configure Google OAuth (opcional) no dashboard do Supabase
4. Crie um arquivo \`.env.local\`:

\`\`\`env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-anon-key-aqui
SUPABASE_SERVICE_ROLE_KEY=sua-service-role-key-aqui
\`\`\`

5. Execute o script para criar usuários iniciais:
\`\`\`bash
node scripts/setup-supabase-users.js
\`\`\`

📖 **Guia completo**: Veja [GUIA_SETUP_SUPABASE.md](./GUIA_SETUP_SUPABASE.md) para instruções detalhadas.

## 📚 Documentação

### 📖 Para Usuários Finais
- [README_USUARIO.md](./README_USUARIO.md) - Guia completo do usuário

### 🔧 Para Desenvolvedores / Administradores

#### Setup e Deploy
- [GUIA_SETUP_SUPABASE.md](./GUIA_SETUP_SUPABASE.md) - Configuração do Supabase (projeto, migrations, credenciais)
- [GUIA_CRIAR_USUARIO_ADMIN.md](./GUIA_CRIAR_USUARIO_ADMIN.md) - Criar usuário administrador (script, Dashboard ou Edge Function)
- [CHECKLIST_PRE_DEPLOY.md](./CHECKLIST_PRE_DEPLOY.md) - Checklist antes do deploy
- [CONFIGURACAO_VERCEL.md](./CONFIGURACAO_VERCEL.md) - Variáveis de ambiente no Vercel
- [TROUBLESHOOTING_LOGIN.md](./TROUBLESHOOTING_LOGIN.md) - Problemas de login (Supabase Auth / Google OAuth)

#### Rotas e Dados
- [docs/ROTAS_E_NAVEGACAO.md](./docs/ROTAS_E_NAVEGACAO.md) - Rotas e navegação do sistema
- [GUIA_IMPORTACAO_CSV.md](./GUIA_IMPORTACAO_CSV.md) - Importação de candidatos via CSV/XLSX
- [GUIA_NORMALIZACAO_CIDADES.md](./GUIA_NORMALIZACAO_CIDADES.md) - Normalização de cidades
- [docs/IMPORTAR_CSV_CANDIDATOS.md](./docs/IMPORTAR_CSV_CANDIDATOS.md) - Popular banco a partir de CSV (script CLI)
- [docs/GUIA_BACKUP_SUPABASE.md](./docs/GUIA_BACKUP_SUPABASE.md) - Backup do banco Supabase
- [docs/SEED_CANDIDATOS_CLI.md](./docs/SEED_CANDIDATOS_CLI.md) - Seed de candidatos via CLI

#### Troubleshooting
- [docs/TROUBLESHOOTING_DEPLOY.md](./docs/TROUBLESHOOTING_DEPLOY.md) - Problemas de deploy
- [docs/TROUBLESHOOTING_SCHEMA.md](./docs/TROUBLESHOOTING_SCHEMA.md) - Problemas de schema Supabase

#### Arquivado
- [docs/arquivado/](./docs/arquivado/) - Documentação obsoleta (Firebase/Forms) e planejamentos não implementados

## 🛠️ Scripts Disponíveis

```bash
npm run dev                  # Servidor de desenvolvimento
npm run build                # Build para produção
npm run preview              # Preview do build
npm run lint                 # Verificar linting
node scripts/setup-supabase-users.js   # Criar usuários iniciais (admin/editor)
npm run import-candidates    # Importar candidatos de assets/candidates/candidates.csv
npm run generate-candidates-sql  # Gerar SQL de seed a partir do CSV
npm run seed-candidates-db   # Executar seed de candidatos no Supabase
```

## 📱 Estrutura do Projeto

```
src/
├── App.jsx                      # Aplicação principal e rotas
├── main.jsx                     # Entry point
├── supabase.js                  # Cliente Supabase (único ponto de configuração)
├── constants.js                 # Constantes (Pipeline, campos, cores)
├── ThemeContext.jsx             # Tema dark/light
├── components/
│   ├── CandidateProfilePage.jsx # Perfil do candidato (/candidate/:id)
│   ├── PublicCandidateForm.jsx   # Formulário público (/apply) → Supabase
│   ├── ThankYouPage.jsx          # Agradecimento pós-envio
│   ├── SettingsPage.jsx          # Configurações (campos, pipeline, usuários)
│   ├── DataManager.jsx           # Dados mestres (empresas, cidades, etc.)
│   ├── ApplicationsPage.jsx     # Candidaturas
│   ├── ReportsPage.jsx           # Relatórios
│   ├── HelpPage.jsx              # Ajuda
│   ├── LoginPage.jsx             # Login (email/senha e Google OAuth)
│   └── modals/
│       ├── TransitionModal.jsx   # Transição de etapas
│       ├── JobsCandidateModal.jsx
│       ├── CsvImportModal.jsx
│       ├── DashboardCandidatesModal.jsx
│       └── InterviewModal.jsx
├── utils/                       # Normalizadores, validação, matching
└── index.css

supabase/
├── migrations/                  # SQL do schema (young_talents)
└── functions/
    └── create-user/             # Edge Function para criar usuário (email/senha)

docs/
├── ROTAS_E_NAVEGACAO.md
├── GUIA_BACKUP_SUPABASE.md
├── IMPORTAR_CSV_CANDIDATOS.md
└── arquivado/                   # Docs obsoletos (Firebase/Forms)
```

## 🎯 Stack

- **React 18** + **Vite 5** - Frontend
- **Supabase** - Backend (PostgreSQL), Auth (email/senha e Google OAuth), RLS
- **Recharts** - Gráficos
- **Tailwind CSS** - Estilos
- **Lucide React** - Ícones

## 🐛 Troubleshooting

### Login não funciona
Ver [TROUBLESHOOTING_LOGIN.md](./TROUBLESHOOTING_LOGIN.md) (Supabase Auth / Google OAuth)

### Porta 5173 em uso
\`\`\`bash
npm run dev -- --port 3000
\`\`\`

## 📝 Licença

Proprietário - Young Talents

## 👥 Contribuidores

- Rodrigo Ribas (Young Talents)
- GitHub Copilot (Desenvolvimento)

## 🔧 Melhorias e Correções Recentes

### ✨ Funcionalidades Adicionadas (v2.2.0)
- ✅ **Formulário Público de Candidatos**: Formulário público (`/apply`) com envio direto para Supabase
  - Validação e normalização integradas; recadastro permitido (aviso se já cadastrado)
  - Identidade Young (logo, cores); design responsivo; página de agradecimento

### ✨ Funcionalidades Adicionadas (v2.1.0)
- ✅ **Página de Perfil do Candidato**: Página dedicada (`/candidate/:id`) com dashboard, abas e histórico completo
- ✅ **Sistema de Match**: Cálculo automático de compatibilidade entre candidatos e vagas
- ✅ **Dashboard Interativo**: Scorecards clicáveis que abrem modais com listas de candidatos
- ✅ **Sistema de Permissões**: Controle de acesso por roles (admin, recruiter, viewer)
- ✅ **Login Email/Senha**: Autenticação tradicional além do Google Login
- ✅ **Filtros Inteligentes**: Busca e seleção em massa para filtros multi-seleção
- ✅ **Data de Criação**: Exibida em tabelas e cards da pipeline
- ✅ **Paginação "Load More"**: Sistema de carregamento progressivo no Kanban
- ✅ **Validação de Movimentação**: Avisos ao tentar mover candidato sem candidatura vinculada
- ✅ **Cidades dos Candidatos**: Priorização de cidades existentes no cadastro de vagas
- ✅ **Gráficos Melhorados**: Animações, gradientes, legendas clicáveis e tooltips com melhor contraste

### ✨ Funcionalidades Anteriores (v2.0.0)
- ✅ **Menu de Avanço de Etapa**: Menu destacado no formulário de candidato para avançar etapas rapidamente
- ✅ **Coluna de Data de Cadastro**: Adicionada na tabela de banco de talentos com ordenação
- ✅ **Cadastro de Empresas Completo**: Com campos de cidade e área de interesse
- ✅ **Filtros de Período**: Funcionando corretamente com campo createdAt
- ✅ **Avisos Visuais**: Badges indicando funcionalidades em desenvolvimento
- ✅ **Melhorias de Contraste**: Cores ajustadas para melhor legibilidade em dark/light mode
- ✅ **Normalização de Dados**: Sistema inteligente para padronizar cidades, fontes e áreas de interesse
- ✅ **Histórico de Ações**: Sistema completo de rastreamento de operações
- ✅ **Exportação de Dados**: Exportação de candidatos e vagas em CSV/XLSX

### 🐛 Correções Recentes
- ✅ **Modal do Dashboard**: Corrigido tela escura ao clicar em scorecards
- ✅ **Timestamps**: Suporte a múltiplos formatos; dados vindos do formulário público ou importação CSV
- ✅ **Página de Vagas**: Simplificada com botão centralizado e dropdown em vez de abas
- ✅ **Validação de Status**: Avisos ao tentar avançar etapa sem candidatura vinculada
- ✅ **Filtros de Período**: Corrigido funcionamento com campo createdAt
- ✅ **Soft Delete**: Registros deletados não aparecem mais nas listas
- ✅ **Contraste Visual**: Tags, etapas e cabeçalhos com melhor visibilidade
- ✅ **Tabela Completa**: Todas as colunas importantes incluídas
- ✅ **Filtro Padrão de Candidatos**: Corrigido para mostrar todos os candidatos por padrão (não apenas últimos 7 dias)
- ✅ **Supabase centralizado**: `src/supabase.js` como único ponto de configuração

---

**Status:** ✅ Pronto para Produção (stack Supabase)

**Última atualização:** Fevereiro 2025

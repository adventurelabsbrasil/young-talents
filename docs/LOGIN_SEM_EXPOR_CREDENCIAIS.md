# Login sem expor usuário e senha

Este documento descreve o que foi feito para não expor credenciais no repositório e as alternativas de login que evitam (ou reduzem) o uso de senha.

---

## O que foi feito no repositório

- **Script `setup-supabase-users.js`**: não contém mais lista de usuários nem senhas no código. Os usuários são lidos de um arquivo local **não versionado** (`scripts/users-setup.local.json`). Assim, nenhum email ou senha é commitado.
- **Arquivo de exemplo**: `scripts/users-setup.example.json` mostra apenas o formato; cada ambiente cria seu próprio `users-setup.local.json` com dados reais.

---

## Formas de login que não expõem usuário/senha no código

### 1. **Google OAuth (já implementado)**

- O usuário clica em **Entrar com Google** e é redirecionado para o Google. Nenhuma senha do app é usada ou armazenada no código.
- **Configuração**: no Supabase Dashboard, em **Authentication > Providers**, ative o Google e configure Client ID e Secret. Em **URL Configuration**, adicione a URL de redirect da sua aplicação.
- **Criar usuários**: em Configurações > Usuários do sistema, adicione o usuário informando o **email do Google** e a role. No primeiro login com Google (mesmo email), a conta é vinculada.

**Vantagem**: zero senha no app; experiência familiar para o usuário.

---

### 2. **Magic Link (login por link no e-mail)**

- O usuário informa **apenas o e-mail**. O Supabase envia um link por e-mail; ao clicar, o usuário entra sem digitar senha.
- Nenhuma senha fica no código ou no repositório; o link é de uso único e expira.

**Implementação no Supabase:**

No frontend, em vez de `signInWithPassword`, use:

```javascript
const { error } = await supabase.auth.signInWithOtp({
  email: email,
  options: {
    emailRedirectTo: `${window.location.origin}/dashboard`
  }
});
```

Depois, mostre uma mensagem do tipo: *“Verifique seu e-mail e clique no link para entrar.”*

No Supabase Dashboard:

- **Authentication > URL Configuration**: adicione a URL do seu site em **Redirect URLs**.
- **Authentication > Email Templates**: edite o template “Magic Link” se quiser personalizar o e-mail.

**Quando usar**: para reduzir dependência de senha; bom para usuários que preferem não decorar mais uma senha.

---

### 3. **Email + senha (atual)**

- O usuário digita e-mail e senha **na tela de login**. Esses dados existem só em memória no navegador e são enviados direto ao Supabase; **nunca** devem estar no código ou em arquivos versionados.
- O script de setup não contém mais usuários/senhas; eles vêm de `users-setup.local.json` (local e não commitado).

**Segurança**: manter senhas fortes e, se possível, fluxo de “Esqueci minha senha” (Supabase já oferece).

---

## Resumo

| Método        | Senha no app? | No repositório? | Observação                          |
|---------------|----------------|------------------|-------------------------------------|
| Google OAuth  | Não            | Não              | Já disponível na aplicação          |
| Magic Link    | Não            | Não              | Requer implementar na tela de login|
| Email + senha | Sim (digitação)| Não              | Dados só em runtime, nunca no código|

Recomendações:

1. **Priorizar Google** para quem tem conta Google.
2. **Adicionar Magic Link** como opção “Entrar por e-mail” para quem não quiser usar senha.
3. Manter **email + senha** como opção, sem colocar credenciais em arquivos versionados; criação de usuários iniciais apenas via `users-setup.local.json` ou pelo Dashboard/Edge Function.

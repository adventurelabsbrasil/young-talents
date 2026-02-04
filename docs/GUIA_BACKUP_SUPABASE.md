# Backup semanal do schema young_talents (Supabase)

O projeto tem um workflow de GitHub Actions que faz backup **apenas do schema `young_talents`** (tenant): estrutura + dados (tabela `candidates`, `user_roles`, `jobs`, `applications`, etc.).

- **Quando roda**: todo domingo às 00:00 UTC e/ou manualmente (Actions → Backup young_talents → Run workflow).
- **Onde fica o backup**:
  - Commit automático em `backups/young_talents/` no repositório.
  - **Cópia no projeto destino**: arquivos enviados para o Storage do projeto Supabase de destino (bucket `backups`, pasta `young_talents/YYYY-MM-DD/`).
- **Notificação**: email enviado a **múltiplos destinatários** (sucesso ou falha) via Resend.

## Secrets no GitHub (Settings → Secrets and variables → Actions)

| Secret | Obrigatório | Descrição |
|--------|-------------|-----------|
| `SUPABASE_DB_URL` | Sim | Connection string do banco **de origem** (projeto de onde o backup é feito). Dashboard do projeto → Settings → Database → Connection string → **URI** (ex.: `postgresql://postgres.[ref]:[SENHA]@...`). |
| `RESEND_API_KEY` | Sim | API key do [Resend](https://resend.com). **Gere uma nova** se a chave já foi exposta em algum lugar. |
| `BACKUP_NOTIFY_EMAIL` | Sim | Emails que recebem notificação, separados por vírgula. Ex.: `contato@adventurelabs.com.br,eduardo@youngempreendimentos.com.br` |
| `RESEND_FROM_EMAIL` | Não | Remetente (deve ser um endereço em domínio **verificado** no Resend). Ex.: `noreply@updates.adventurelabs.com.br`. Se não definir, o workflow usa `noreply@updates.adventurelabs.com.br`. |
| `DESTINATION_SUPABASE_URL` | Sim (para cópia) | URL do projeto **destino** onde a cópia do backup vai. Ex.: `https://cporcxqbxzekbrilzaec.supabase.co` |
| `DESTINATION_SUPABASE_SERVICE_ROLE_KEY` | Sim (para cópia) | Chave **service_role** do projeto destino. Dashboard do projeto destino → Settings → API → service_role. Necessária para gravar no Storage. |

## Projeto destino (cópia do backup)

O workflow envia uma cópia dos arquivos de backup para o **Storage** do projeto Supabase de destino:

- **Organization / Project**: configurados via `DESTINATION_SUPABASE_URL` e `DESTINATION_SUPABASE_SERVICE_ROLE_KEY`.
- **Bucket**: `backups` (criado automaticamente se não existir).
- **Caminho**: `young_talents/YYYY-MM-DD/young_talents_schema.sql` e `young_talents_data.sql`.

Os arquivos ficam disponíveis no Dashboard do projeto destino em **Storage → backups**.

## Checklist

1. Repositório **privado**.
2. Resend: domínio verificado se usar `noreply@adventurelabs.com.br` ou outro “from” customizado.
3. **Rotacionar** a Resend API key se ela já foi exposta (ex.: em chat).
4. Rodar o workflow manualmente uma vez e conferir: commit no repo, arquivos no Storage do destino e emails recebidos.

## Restauração

- **A partir do repo**: usar `backups/young_talents/young_talents_schema.sql` e `young_talents_data.sql`.
- **A partir do projeto destino**: baixar os arquivos do Storage (bucket `backups`, pasta `young_talents/YYYY-MM-DD/`) e aplicar no banco (schema depois dados).

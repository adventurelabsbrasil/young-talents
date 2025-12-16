# 📊 Análise: Apps Script vs Frontend - Mapeamento de Campos

## 🔍 Comparação de Campos

### ✅ Campos que BATM (Mesmo Nome)
- `fullName` ✅
- `email` ✅
- `phone` ✅
- `birthDate` ✅
- `age` ✅
- `photoUrl` ✅
- `city` ✅
- `portfolioUrl` ✅
- `institution` ✅

### ❌ Campos que NÃO BATM (Precisam Correção)

| Apps Script | Frontend | Ação Necessária |
|-------------|----------|-----------------|
| `educationLevel` | `schoolingLevel` | **Renomear no Apps Script** |
| `educationBackground` | `education` | **Renomear no Apps Script** |
| `experienceSummary` | `experience` | **Renomear no Apps Script** |
| `resumeUrl` | `cvUrl` | **Renomear no Apps Script** |
| `sourceOrigin` | `source` | **Renomear no Apps Script** |
| `pipelineStage` | `status` | **Renomear no Apps Script** |
| `legacyId` | `external_id` | **Renomear no Apps Script** |

### ⚠️ Campos com Diferenças de Formato

| Campo | Apps Script | Frontend | Correção |
|-------|-------------|----------|----------|
| `interestAreas` | Array `["Área1", "Área2"]` | String ou Array | **Manter como string** (frontend aceita ambos) |
| `status` | `"Em andamento"` | `"Inscrito"` (primeiro estágio) | **Usar status do pipeline** |
| `tags` | Array `["Novo Inscrito"]` | Não usado no frontend | **Manter (pode ser útil)** |

### 📋 Campos Faltantes no Apps Script (Presentes no Frontend)

Estes campos existem no formulário mas não estão sendo enviados pelo Apps Script:

- `email_secondary` - Email secundário
- `maritalStatus` - Estado civil
- `childrenCount` - Quantidade de filhos
- `hasLicense` - Possui CNH
- `graduationDate` - Data de formatura
- `isStudying` - Está cursando atualmente
- `courses` - Cursos e certificações
- `certifications` - Certificações profissionais
- `referral` - Indicação
- `salaryExpectation` - Expectativa salarial
- `canRelocate` - Disponibilidade para mudança
- `references` - Referências profissionais
- `typeOfApp` - Tipo de candidatura
- `freeField` - Campo livre

---

## 🎯 Status do Pipeline

**Apps Script atual:**
```javascript
status: "Em andamento",
pipelineStage: "Inscrito"
```

**Frontend espera:**
```javascript
status: "Inscrito"  // Primeiro estágio do pipeline
```

**Correção:** O campo `status` deve ser o estágio atual do pipeline, não "Em andamento".

---

## 📝 Recomendações

1. ✅ **Renomear campos no Apps Script** para bater com o frontend
2. ✅ **Adicionar campos faltantes** do formulário
3. ✅ **Ajustar status inicial** para "Inscrito" ao invés de "Em andamento"
4. ✅ **Manter interestAreas como string** (separado por vírgula) para compatibilidade
5. ✅ **Adicionar tratamento de campos opcionais** que podem não existir no formulário

---

## ✅ Código Corrigido

O arquivo `Code.gs` foi criado com todas as correções aplicadas:

### Mudanças Principais:

1. **Campos Renomeados:**
   - `educationLevel` → `schoolingLevel`
   - `educationBackground` → `education`
   - `experienceSummary` → `experience`
   - `resumeUrl` → `cvUrl`
   - `sourceOrigin` → `source`
   - `pipelineStage` → removido (usar apenas `status`)
   - `legacyId` → `external_id`

2. **Status Corrigido:**
   - Antes: `status: "Em andamento"` + `pipelineStage: "Inscrito"`
   - Agora: `status: "Inscrito"` (primeiro estágio do pipeline)

3. **Campos Adicionados:**
   - `email_secondary`
   - `maritalStatus`
   - `childrenCount`
   - `hasLicense`
   - `graduationDate`
   - `isStudying`
   - `courses`
   - `certifications`
   - `referral`
   - `salaryExpectation`
   - `canRelocate`
   - `references`
   - `typeOfApp`
   - `freeField`
   - `original_timestamp`
   - `external_id`

4. **interestAreas:**
   - Mantido como string (separado por vírgula) para compatibilidade com frontend
   - Função `normalizeInterests` ajustada

---

## 🚀 Próximos Passos

1. **Copiar o código corrigido** (`Code.gs`) para o Google Apps Script
2. **Testar** com um novo envio de formulário
3. **Verificar** se os dados aparecem corretamente no frontend
4. **Executar importação em massa** se necessário (função `importarEmLotes()`)


/*
 * YOUNG TALENTS ATS - INTEGRAÇÃO FINAL (CORRIGIDO)
 * Funcionalidade: Conecta Google Forms e Planilhas ao Firebase Firestore via REST API
 * Versão: 2.0 - Alinhado com Frontend React
 */

// =================================================================================
// ⚙️ CONFIGURAÇÕES (PREENCHA APENAS AQUI)
// =================================================================================

// 1. ID do Projeto Firebase (Configurações do Projeto -> Geral -> ID do projeto)
const PROJECT_ID = "talents-c856d"; 

// 2. ID da Planilha de Dados (O código longo na URL da sua planilha)
const SPREADSHEET_ID = "1DKJSelwLZkBag-1ORe-IXT2TVI0XpRpj-CIgR0oaIf0";

// =================================================================================
// 🚀 1. GATILHO AUTOMÁTICO (Para Novos Candidatos)
// =================================================================================

function onFormSubmit(e) {
  if (!e || !e.namedValues) {
    Logger.log("Erro: Função rodada manualmente. Use o gatilho do formulário.");
    return;
  }
  const responses = e.namedValues;

  // Helper para pegar valor do form de forma segura
  const get = (key) => responses[key] ? responses[key][0].trim() : "";
  
  // Monta o objeto do candidato - CAMPOS ALINHADOS COM O FRONTEND
  const data = {
    // Metadados
    createdAt: new Date().toISOString(),
    external_id: get('COD') || "", // COD legado (se houver)
    
    // Identificação e Contato
    fullName: get('Nome completo:'),
    email: get('E-mail principal:'),
    email_secondary: get('Endereço de e-mail') || "",
    phone: get('Nº telefone celular / Whatsapp:'),
    
    // Dados Pessoais
    birthDate: get('Data de Nascimento:'),
    age: parseInt(get('Idade')) || 0,
    photoUrl: get('Nos envie uma foto atual que você goste:'),
    maritalStatus: get('Estado civil:') || "",
    childrenCount: parseInt(get('Se tem filhos, quantos?')) || 0,
    hasLicense: get('Você possui CNH tipo B?') || "",
    
    // Localização
    city: normalizeCity(get('Cidade onde reside:')),
    
    // Profissional e Acadêmico
    education: get('Formação:'), // Renomeado de educationBackground
    schoolingLevel: get('Nível de escolaridade:'), // Renomeado de educationLevel
    institution: get('Instituição de ensino:'),
    graduationDate: get('Data de formatura:') || "",
    isStudying: get('Em caso de curso superior, está cursando neste momento?') || "",
    experience: get('Experiências anteriores:'), // Renomeado de experienceSummary
    courses: get('Cursos e certificações profissionais.') || "",
    certifications: get('Certificações profissionais:') || "",
    interestAreas: normalizeInterests(get('Áreas de interesse profissional')),
    
    // Links
    cvUrl: get('Anexar currículo:'), // Renomeado de resumeUrl
    portfolioUrl: get('Portfólio de trabalho:'),
    
    // Processo e Fit Cultural
    source: get('Onde você nos encontrou?') || "Google Forms", // Renomeado de sourceOrigin
    referral: get('Você foi indicado por algum colaborador da Young? Se sim, quem?') || "",
    salaryExpectation: get('Qual seria sua expectativa salarial?') || "",
    canRelocate: get('Teria disponibilidade para mudança de cidade?') || "",
    references: get('Referências profissionais:') || "",
    typeOfApp: get('Você está se candidatando a uma vaga específica...?') || "",
    freeField: get('Campo Livre, SEJA VOCÊ!') || "",
    
    // Status do Pipeline (CORRIGIDO)
    status: "Inscrito", // Primeiro estágio do pipeline (não "Em andamento")
    
    // Tags e metadados adicionais
    tags: ["Novo Inscrito"],
    original_timestamp: new Date().toISOString()
  };

  // Envia para o Firestore
  try {
    const firestoreObject = toFirestoreFormat(data);
    const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/candidates`;
    
    const options = {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify(firestoreObject)
    };
    
    const response = UrlFetchApp.fetch(url, options);
    if (response.getResponseCode() === 200) {
      Logger.log("✅ Novo candidato enviado: " + data.fullName);
    } else {
      Logger.log("❌ Erro ao salvar: " + response.getContentText());
    }
  } catch (err) {
    Logger.log("❌ Erro ao salvar novo candidato: " + err);
  }
}

// =================================================================================
// 📦 2. IMPORTAÇÃO EM MASSA (Rodar Manualmente uma vez)
// =================================================================================

function importarEmLotes() {
  const BATCH_SIZE = 400; // Limite seguro por requisição

  // Abre a planilha pelo ID específico
  const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = spreadsheet.getSheets()[0];
  
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const rows = data.slice(1); // Remove cabeçalho

  Logger.log(`📊 Iniciando importação de ${rows.length} linhas...`);

  // Loop principal: Processa em blocos de 400
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const chunk = rows.slice(i, i + BATCH_SIZE);
    const writes = [];

    Logger.log(`⏳ Processando lote ${i + 1} a ${i + chunk.length}...`);

    chunk.forEach(row => {
      // Pula linhas vazias se houver
      if (!row[0] && !row[2]) return;

      const obj = rowToCandidateObject(row, headers);
      
      // Gera ID único para o documento
      const docId = Utilities.getUuid(); 
      const docPath = `projects/${PROJECT_ID}/databases/(default)/documents/candidates/${docId}`;

      writes.push({
        update: {
          name: docPath,
          fields: toFirestoreFormat(obj).fields
        }
      });
    });

    if (writes.length > 0) {
      enviarBatch(writes);
    }
    
    // Pausa para evitar limite de taxa
    Utilities.sleep(1000);
  }
  
  Logger.log("✅ Importação Total Concluída!");
}

// =================================================================================
// 🛠️ 3. FERRAMENTAS E HELPERS (Não mexer aqui)
// =================================================================================

function enviarBatch(writesArray) {
  const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents:commit`;
  
  const payload = { writes: writesArray };
  const options = {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };

  try {
    const response = UrlFetchApp.fetch(url, options);
    if (response.getResponseCode() !== 200) {
      Logger.log("❌ Erro no lote: " + response.getContentText());
    } else {
      Logger.log("✅ Lote enviado com sucesso!");
    }
  } catch (e) {
    Logger.log("❌ Erro fatal de rede: " + e);
  }
}

function rowToCandidateObject(row, headers) {
  const get = (headerName) => {
    const index = headers.indexOf(headerName);
    return (index > -1 && row[index]) ? String(row[index]).trim() : "";
  };

  return {
    // Metadados
    external_id: get('COD') || "",
    createdAt: new Date().toISOString(),
    original_timestamp: get('Carimbo de data/hora') || new Date().toISOString(),
    
    // Identificação e Contato
    fullName: get('Nome completo:'),
    email: get('E-mail principal:'),
    email_secondary: get('Endereço de e-mail') || "",
    phone: get('Nº telefone celular / Whatsapp:'),
    
    // Dados Pessoais
    birthDate: get('Data de Nascimento:'),
    age: parseInt(get('Idade')) || 0,
    photoUrl: get('Nos envie uma foto atual que você goste:'),
    maritalStatus: get('Estado civil:') || "",
    childrenCount: parseInt(get('Se tem filhos, quantos?')) || 0,
    hasLicense: get('Você possui CNH tipo B?') || "",
    
    // Localização
    city: normalizeCity(get('Cidade onde reside:')),
    
    // Profissional e Acadêmico
    education: get('Formação:'), // CORRIGIDO: era educationBackground
    schoolingLevel: get('Nível de escolaridade:'), // CORRIGIDO: era educationLevel
    institution: get('Instituição de ensino:'),
    graduationDate: get('Data de formatura:') || "",
    isStudying: get('Em caso de curso superior, está cursando neste momento?') || "",
    experience: get('Experiências anteriores:'), // CORRIGIDO: era experienceSummary
    courses: get('Cursos e certificações profissionais.') || "",
    certifications: get('Certificações profissionais:') || "",
    interestAreas: normalizeInterests(get('Áreas de interesse profissional')),
    
    // Links
    cvUrl: get('Anexar currículo:'), // CORRIGIDO: era resumeUrl
    portfolioUrl: get('Portfólio de trabalho:'),
    
    // Processo e Fit Cultural
    source: get('Onde você nos encontrou?') || "Legado", // CORRIGIDO: era sourceOrigin
    referral: get('Você foi indicado por algum colaborador da Young? Se sim, quem?') || "",
    salaryExpectation: get('Qual seria sua expectativa salarial?') || "",
    canRelocate: get('Teria disponibilidade para mudança de cidade?') || "",
    references: get('Referências profissionais:') || "",
    typeOfApp: get('Você está se candidatando a uma vaga específica...?') || "",
    freeField: get('Campo Livre, SEJA VOCÊ!') || "",
    
    // Status do Pipeline (CORRIGIDO)
    status: "Inscrito", // CORRIGIDO: era "Em andamento" e tinha pipelineStage separado
    
    // Tags
    tags: ["Importado CSV"]
  };
}

function normalizeCity(city) {
  if (!city) return "";
  // Pega apenas o texto antes de "/" ou "-"
  return city.split('/')[0].split('-')[0].trim();
}

function normalizeInterests(rawString) {
  if (!rawString) return "";
  // Converte array para string separada por vírgula (compatível com frontend)
  if (Array.isArray(rawString)) {
    return rawString.join(', ');
  }
  // Se já for string, retorna como está
  return String(rawString).trim();
}

function toFirestoreFormat(json) {
  const fields = {};
  for (const key in json) {
    const value = json[key];
    if (value === null || value === undefined || value === "") continue;

    if (Array.isArray(value)) {
      fields[key] = { arrayValue: { values: value.map(v => ({ stringValue: String(v) })) } };
    } else if (typeof value === 'number') {
      fields[key] = { integerValue: value };
    } else if (typeof value === 'boolean') {
      fields[key] = { booleanValue: value };
    } else {
      fields[key] = { stringValue: String(value) };
    }
  }
  return { fields: fields };
}


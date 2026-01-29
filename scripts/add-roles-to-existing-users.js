/**
 * Script para adicionar roles na tabela young_talents.user_roles
 * para usuários que já existem no Supabase Auth
 * 
 * Execute: node scripts/add-roles-to-existing-users.js
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';

// Obter diretório atual (ES modules)
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Carrega variáveis de ambiente
const envLocalPath = join(__dirname, '..', '.env.local');
const envPath = join(__dirname, '..', '.env');

if (existsSync(envLocalPath)) {
  dotenv.config({ path: envLocalPath });
  console.log('📁 Carregando variáveis de .env.local');
} else if (existsSync(envPath)) {
  dotenv.config({ path: envPath });
  console.log('📁 Carregando variáveis de .env');
} else {
  dotenv.config();
}

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Erro: Variáveis de ambiente não configuradas.');
  console.error('Configure SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no arquivo .env.local');
  process.exit(1);
}

// Criar cliente Supabase com service role
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Mapeamento de emails para roles
const userRoles = [
  {
    email: 'contato@adventurelabs.com.br',
    role: 'admin',
    name: 'Admin Principal'
  },
  {
    email: 'suelen@youngempreendimentos.com.br',
    role: 'admin',
    name: 'Suelen'
  },
  {
    email: 'carla@youngempreendimentos.com.br',
    role: 'editor',
    name: 'Carla'
  },
  {
    email: 'rodrigo@youngempreendimentos.com.br',
    role: 'admin',
    name: 'Rodrigo'
  },
  {
    email: 'eduardo@youngempreendimentos.com.br',
    role: 'admin',
    name: 'Eduardo'
  }
];

async function addRoleToUser(userEmail, roleData) {
  try {
    console.log(`\n📧 Processando: ${userEmail}...`);
    
    // Buscar usuário no Supabase Auth
    const { data: usersData, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (listError) {
      throw new Error(`Erro ao listar usuários: ${listError.message}`);
    }
    
    const user = usersData?.users?.find(u => u.email === userEmail);
    
    if (!user) {
      console.log(`⚠️  Usuário ${userEmail} não encontrado no Supabase Auth`);
      return { success: false, reason: 'Usuário não encontrado' };
    }

    console.log(`   ✅ Usuário encontrado: ${user.id}`);

    // Verificar se role já existe
    // Usar RPC ou query SQL direta para acessar schema customizado
    let existingRole = null;
    let fetchError = null;
    
    // Tentar usar RPC function para buscar role
    try {
      const { data: roleData, error: rpcError } = await supabaseAdmin.rpc('get_user_role', {
        p_user_id: user.id
      }).catch(() => ({ data: null, error: { message: 'RPC not available' } }));
      
      if (!rpcError && roleData) {
        existingRole = roleData;
      }
    } catch (e) {
      // RPC não disponível, usar método alternativo
    }
    
    // Se RPC não funcionou, usar query SQL direta via PostgREST
    if (!existingRole) {
      // Tentar acessar via namespace explícito na URL
      const { data, error } = await supabaseAdmin
        .from('young_talents.user_roles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      
      existingRole = data;
      fetchError = error;
      
      // Se ainda falhar, tentar sem schema (assumindo que está no search_path)
      if (error && error.message?.includes('Invalid schema')) {
        // Última tentativa: usar query SQL via RPC genérico
        const { data: sqlData, error: sqlError } = await supabaseAdmin.rpc('exec_sql', {
          query: `SELECT * FROM young_talents.user_roles WHERE user_id = '${user.id}' LIMIT 1`
        }).catch(() => ({ data: null, error: { message: 'SQL RPC not available' } }));
        
        if (!sqlError && sqlData && sqlData.length > 0) {
          existingRole = sqlData[0];
        }
      }
    }
    
    if (fetchError && fetchError.code !== 'PGRST116' && !existingRole) {
      console.error(`   ⚠️  Aviso ao buscar role: ${fetchError.message}`);
      // Continuar mesmo com erro, tentando criar a role
    }

    if (existingRole) {
      // Atualizar role existente
      console.log(`   ⚠️  Role já existe. Atualizando...`);
      const { error: updateError } = await supabaseAdmin
        .from('young_talents.user_roles')
        .update({
          role: roleData.role,
          name: roleData.name,
          email: userEmail,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingRole.id);

      if (updateError) throw updateError;
      console.log(`   ✅ Role atualizada para ${roleData.role}`);
      return { success: true, action: 'updated' };
    } else {
      // Criar nova role
      console.log(`   📝 Criando role ${roleData.role}...`);
      const { error: insertError } = await supabaseAdmin
        .from('young_talents.user_roles')
        .insert([{
          user_id: user.id,
          email: userEmail,
          name: roleData.name,
          role: roleData.role,
          created_at: new Date().toISOString()
        }]);

      if (insertError) {
        // Se for erro de unique violation, tentar atualizar por email
        if (insertError.code === '23505') {
          console.log(`   ⚠️  Role com este email já existe. Atualizando...`);
          const { error: updateError } = await supabaseAdmin
            .from('young_talents.user_roles')
            .update({
              user_id: user.id,
              role: roleData.role,
              name: roleData.name,
              updated_at: new Date().toISOString()
            })
            .eq('email', userEmail);

          if (updateError) throw updateError;
          console.log(`   ✅ Role atualizada via email`);
          return { success: true, action: 'updated' };
        }
        throw insertError;
      }
      
      console.log(`   ✅ Role ${roleData.role} criada com sucesso`);
      return { success: true, action: 'created' };
    }

  } catch (error) {
    console.error(`   ❌ Erro: ${error.message}`);
    return { success: false, reason: error.message };
  }
}

async function main() {
  console.log('🚀 Adicionando roles para usuários existentes...\n');

  const results = {
    success: [],
    failed: [],
    updated: [],
    created: []
  };

  for (const roleData of userRoles) {
    const result = await addRoleToUser(roleData.email, roleData);
    
    if (result.success) {
      results.success.push(roleData.email);
      if (result.action === 'updated') {
        results.updated.push(roleData.email);
      } else if (result.action === 'created') {
        results.created.push(roleData.email);
      }
    } else {
      results.failed.push({ email: roleData.email, reason: result.reason });
    }
  }

  console.log('\n📊 Resumo:');
  console.log(`✅ Sucesso: ${results.success.length} usuários`);
  console.log(`   - Criadas: ${results.created.length}`);
  console.log(`   - Atualizadas: ${results.updated.length}`);
  console.log(`❌ Falhas: ${results.failed.length} usuários`);
  
  if (results.failed.length > 0) {
    console.log('\n❌ Usuários com falha:');
    results.failed.forEach(f => {
      console.log(`   - ${f.email}: ${f.reason}`);
    });
  }

  console.log('\n🎉 Processo concluído!');
  
  process.exit(results.failed.length > 0 ? 1 : 0);
}

main();

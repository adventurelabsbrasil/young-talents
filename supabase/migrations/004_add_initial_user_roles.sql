-- Script SQL para adicionar roles para usuários existentes
-- Execute este script no SQL Editor do Supabase
-- Este script busca os usuários por email e cria/atualiza as roles automaticamente

-- Adicionar roles para os usuários existentes
DO $$
DECLARE
  user_record RECORD;
  user_emails TEXT[] := ARRAY[
    'contato@adventurelabs.com.br',
    'suelen@youngempreendimentos.com.br',
    'carla@youngempreendimentos.com.br',
    'rodrigo@youngempreendimentos.com.br',
    'eduardo@youngempreendimentos.com.br'
  ];
  user_roles_map JSONB := '{
    "contato@adventurelabs.com.br": {"name": "Admin Principal", "role": "admin"},
    "suelen@youngempreendimentos.com.br": {"name": "Suelen", "role": "admin"},
    "carla@youngempreendimentos.com.br": {"name": "Carla", "role": "editor"},
    "rodrigo@youngempreendimentos.com.br": {"name": "Rodrigo", "role": "admin"},
    "eduardo@youngempreendimentos.com.br": {"name": "Eduardo", "role": "admin"}
  }'::JSONB;
  user_email TEXT;
  user_data JSONB;
  role_exists BOOLEAN;
BEGIN
  FOREACH user_email IN ARRAY user_emails
  LOOP
    -- Buscar usuário no auth.users
    SELECT id, email INTO user_record
    FROM auth.users
    WHERE email = user_email
    LIMIT 1;
    
    IF user_record.id IS NOT NULL THEN
      user_data := user_roles_map->user_email;
      
      -- Verificar se role já existe
      SELECT EXISTS(
        SELECT 1 FROM young_talents.user_roles 
        WHERE user_id = user_record.id OR email = user_email
      ) INTO role_exists;
      
      IF role_exists THEN
        -- Atualizar role existente
        UPDATE young_talents.user_roles
        SET
          user_id = user_record.id,
          name = user_data->>'name',
          role = user_data->>'role',
          email = user_email,
          updated_at = NOW()
        WHERE user_id = user_record.id OR email = user_email;
        
        RAISE NOTICE '✅ Role atualizada para % (ID: %)', user_email, user_record.id;
      ELSE
        -- Criar nova role
        INSERT INTO young_talents.user_roles (user_id, email, name, role, created_at)
        VALUES (
          user_record.id,
          user_email,
          user_data->>'name',
          user_data->>'role',
          NOW()
        );
        
        RAISE NOTICE '✅ Role criada para % (ID: %)', user_email, user_record.id;
      END IF;
    ELSE
      RAISE WARNING '⚠️  Usuário % não encontrado no auth.users', user_email;
    END IF;
  END LOOP;
END $$;

-- Verificar resultados - Listar todas as roles criadas
SELECT 
  ur.id,
  ur.email,
  ur.name,
  ur.role,
  ur.user_id,
  u.email_confirmed_at IS NOT NULL as email_confirmado,
  ur.created_at,
  ur.updated_at
FROM young_talents.user_roles ur
LEFT JOIN auth.users u ON u.id = ur.user_id
ORDER BY ur.email;

-- Resumo
SELECT 
  COUNT(*) as total_roles,
  COUNT(CASE WHEN role = 'admin' THEN 1 END) as total_admin,
  COUNT(CASE WHEN role = 'editor' THEN 1 END) as total_editor,
  COUNT(CASE WHEN role = 'viewer' THEN 1 END) as total_viewer
FROM young_talents.user_roles;

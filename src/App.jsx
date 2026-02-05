import React, { useState, useEffect, useMemo } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Users, Briefcase, Settings, Plus, Search,
  FileText, MapPin, Filter, Trophy, Menu, X, Loader2, Edit3, Trash2,
  Building2, Mail, Check, Ban, UserMinus, CheckSquare, Square, Kanban, List,
  CalendarCheck, AlertCircle, UserPlus, Moon, Sun, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, ExternalLink,
  MessageSquare, History, ArrowRight, Palette, Copy, Info, BarChart3, HelpCircle, Clock
} from 'lucide-react';

// Supabase Imports
import { supabase } from "./supabase";

// Component Imports
import TransitionModal from './components/modals/TransitionModal';
import SettingsPage from './components/SettingsPage';
import InterviewModal from './components/modals/InterviewModal';
import CsvImportModal from './components/modals/CsvImportModal';
import JobCandidatesModal from './components/modals/JobsCandidateModal';
import DashboardCandidatesModal from './components/modals/DashboardCandidatesModal';
import ApplicationsPage from './components/ApplicationsPage';
import ReportsPage from './components/ReportsPage';
import HelpPage from './components/HelpPage';
import CandidateProfilePage from './components/CandidateProfilePage';
import DiagnosticPage from './components/DiagnosticPage';
import PublicCandidateForm from './components/PublicCandidateForm';
import ThankYouPage from './components/ThankYouPage';
import FormSubmitTestPage from './components/FormSubmitTestPage';
import LoginPage from './components/LoginPage';
import Dashboard from './features/dashboard/components/Dashboard';
import FilterSidebar from './components/FilterSidebar';
import PipelineView from './components/PipelineView';
import TalentBankView from './components/TalentBankView';
import SubmissionsView from './components/SubmissionsView';
import JobsList from './components/JobsList';
import MasterDataManager from './components/MasterDataManager';
import JobsManagementPage from './components/JobsManagementPage';
import InputField from './components/InputField';
import UrlField from './components/UrlField';
import JobModal from './components/JobModal';
import CandidatesList from './components/CandidatesList';
import CandidateModal from './components/CandidateModal';
import { getCandidateRecency, getRecencyRowClass } from './utils/candidateRecency';
import { useTheme } from './ThemeContext';

import { PIPELINE_STAGES, STATUS_COLORS, JOB_STATUSES, CSV_FIELD_MAPPING_OPTIONS, ALL_STATUSES, CLOSING_STATUSES, STAGE_REQUIRED_FIELDS, CANDIDATE_FIELDS, getFieldDisplayName, REJECTION_REASONS, FILTER_STORAGE_KEY } from './constants';
import { getTimestampSeconds, getCandidateTimestamp } from './utils/timestampUtils';
import { mapCandidatesFromSupabase, candidateToSupabase } from './utils/candidateFromSupabase';
import {
  mapJobsFromSupabase,
  mapCompaniesFromSupabase,
  mapCitiesFromSupabase,
  mapSectorsFromSupabase,
  mapPositionsFromSupabase,
  mapJobLevelsFromSupabase,
  mapActivityAreasFromSupabase,
  mapApplicationsFromSupabase,
  jobToSupabase
} from './utils/fromSupabase';
import { validateCandidate, validateEmail, validatePhone, checkDuplicateEmail, formatValidationErrors } from './utils/validation';
import { normalizeCity, getMainCitiesOptions } from './utils/cityNormalizer';
import { normalizeSource, getMainSourcesOptions } from './utils/sourceNormalizer';
import { normalizeInterestArea, normalizeInterestAreasString, getMainInterestAreasOptions } from './utils/interestAreaNormalizer';
import { formatChildrenForDisplay, CHILDREN_OPTIONS, normalizeChildrenForStorage } from './utils/childrenNormalizer';
import { calculateMatchScore, findMatchingJobs, findMatchingCandidates, getMatchBadgeColor, getMatchBadgeText } from './utils/matching';



// getCandidateRecency and getRecencyRowClass moved to ./utils/candidateRecency

// --- COMPONENTES AUXILIARES ---



// --- SIDEBAR FILTROS AVANÇADOS ---


// --- APP PRINCIPAL ---
const DEV_USER = {
  id: 'dev-local',
  email: 'dev@local',
  displayName: 'Desenvolvimento',
  user_metadata: {},
  photoURL: null
};

const PUBLIC_PATHS = ['/apply', '/apply/test', '/apply/thank-you', '/login'];

export default function App() {
  const { isDark, toggleTheme } = useTheme();
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Usuário efetivo: sessão ou DEV_USER quando Supabase não está configurado
  const effectiveUser = user ?? (!supabase ? DEV_USER : null);

  // Auth: sessão Supabase
  useEffect(() => {
    if (!supabase) {
      setAuthLoading(false);
      setUser(DEV_USER);
      return;
    }
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setAuthLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription?.unsubscribe();
  }, []);

  // Sistema de Rotas usando URL
  const location = useLocation();
  const navigate = useNavigate();

  // Mapear pathname para activeTab
  const getActiveTabFromPath = () => {
    const path = location.pathname;
    if (path === '/' || path === '') return 'dashboard';
    const slug = path.replace(/^\//, '').split('/')[0];
    const validTabs = ['dashboard', 'pipeline', 'candidates', 'submissions', 'jobs', 'applications', 'companies', 'positions', 'sectors', 'cities', 'job_levels', 'activity_areas', 'reports', 'help', 'settings', 'diagnostic'];
    return validTabs.includes(slug) ? slug : 'dashboard';
  };

  const [route, setRoute] = useState({
    page: getActiveTabFromPath(),
    modal: new URLSearchParams(location.search).get('modal') || null,
    id: new URLSearchParams(location.search).get('id') || null,
    settingsTab: new URLSearchParams(location.search).get('settingsTab') || null
  });

  const activeTab = route.page;

  // Sincronizar com mudanças de URL
  useEffect(() => {
    const newTab = getActiveTabFromPath();
    const params = new URLSearchParams(location.search);
    setRoute({
      page: newTab,
      modal: params.get('modal') || null,
      id: params.get('id') || null,
      settingsTab: params.get('settingsTab') || null
    });
  }, [location.pathname, location.search]);

  // Sincronizar query /candidates?status=...&filter=...&jobs=... com filtros
  useEffect(() => {
    if (location.pathname !== '/candidates') return;
    const params = new URLSearchParams(location.search);
    const statusParam = params.get('status');
    const filterParam = params.get('filter');
    const jobsParam = params.get('jobs');
    setFilters(prev => {
      const next = { ...prev };
      if (statusParam) {
        next.status = [statusParam];
        next.dashboardFilter = null;
      } else if (filterParam === 'missing-return') {
        next.dashboardFilter = 'missing-return';
      } else if (jobsParam === 'open') {
        next.dashboardFilter = 'jobs-open';
      } else if (!statusParam && !filterParam && !jobsParam) {
        next.dashboardFilter = null;
      }
      return next;
    });
  }, [location.pathname, location.search]);

  // Reset completo de filtros ao sair de /candidates para que Dashboard/Pipeline/Banco mostrem dados
  useEffect(() => {
    if (location.pathname !== '/candidates') {
      setFilters(initialFilters);
    }
  }, [location.pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false); // Para ocultar menu em desktop

  // Redirecionar rota raiz para dashboard
  useEffect(() => {
    if (location.pathname === '/' || location.pathname === '') {
      navigate('/dashboard', { replace: true });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Proteger rotas: sem sessão e rota não pública -> login
  const isPublicPath = PUBLIC_PATHS.some(p => location.pathname === p || location.pathname.startsWith(p + '/'));
  useEffect(() => {
    if (authLoading || !supabase) return;
    if (!user && !isPublicPath) {
      navigate('/login', { replace: true });
    }
  }, [authLoading, user, isPublicPath, location.pathname, navigate]);

  // Inicializar settingsTab na URL se estiver na página de settings
  useEffect(() => {
    if (activeTab === 'settings' && !route.settingsTab) {
      const params = new URLSearchParams(location.search);
      params.set('settingsTab', 'campos');
      navigate(`${location.pathname}?${params.toString()}`, { replace: true });
      setRoute(prev => ({ ...prev, settingsTab: 'campos' }));
    }
  }, [activeTab, route.settingsTab, location.pathname, location.search, navigate]);

  const setActiveTab = (tab) => {
    // Navegar para a slug direta
    navigate(`/${tab}`, { replace: true });
    setRoute(prev => ({ ...prev, page: tab }));
  };

  // Dados
  const [jobs, setJobs] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [cities, setCities] = useState([]);
  const [interestAreas, setInterestAreas] = useState([]);
  const [roles, setRoles] = useState([]);
  const [jobLevels, setJobLevels] = useState([]);
  const [activityAreas, setActivityAreas] = useState([]);
  const [sectors, setSectors] = useState([]);
  const [origins, setOrigins] = useState([]);
  const [schooling, setSchooling] = useState([]);
  const [marital, setMarital] = useState([]);
  const [tags, setTags] = useState([]);
  const [statusMovements, setStatusMovements] = useState([]); // Log de movimentações de status
  const [applications, setApplications] = useState([]); // Candidaturas formais (candidato-vaga)
  const [interviews, setInterviews] = useState([]); // Agendamentos de entrevistas
  const [userRoles, setUserRoles] = useState([{ email: DEV_USER.email, role: 'admin' }]); // Dev: role fixo
  const [activityLog, setActivityLog] = useState([]); // Log de atividades para admin
  const activityLogUnavailableRef = React.useRef(false);
  const [candidatesLoading, setCandidatesLoading] = useState(false);

  // Verificar se usuário é desenvolvedor (baseado em email ou flag)
  const isDeveloper = useMemo(() => {
    if (!effectiveUser?.email) return false;
    // Verificar se é DEV_USER ou email de desenvolvedor
    const devEmails = ['dev@local', 'dev@adventurelabs.com.br', 'developer@adventurelabs.com.br'];
    return effectiveUser.email === DEV_USER.email || devEmails.includes(effectiveUser.email.toLowerCase());
  }, [effectiveUser]);

  // Role do usuário atual (admin, editor, viewer) — exibido na UI como Administrador, Recrutador, Visualizador
  const currentUserRole = useMemo(() => {
    if (!effectiveUser?.email) return 'viewer';
    // Desenvolvedores têm permissões de admin
    if (isDeveloper) return 'admin';
    const userRoleDoc = userRoles.find(r => r.email === effectiveUser.email);
    return userRoleDoc?.role || 'admin'; // Primeiro usuário é admin por padrão
  }, [effectiveUser, userRoles, isDeveloper]);

  // Verificar permissões
  const hasPermission = (action) => {
    // Desenvolvedores têm todas as permissões
    if (isDeveloper) return true;

    const permissions = {
      admin: ['all'],
      editor: ['view', 'edit_candidates', 'move_pipeline', 'schedule_interviews', 'add_notes'],
      viewer: ['view']
    };
    const userPerms = permissions[currentUserRole] || [];
    return userPerms.includes('all') || userPerms.includes(action);
  };

  // Modais - sincronizados com URL
  const isJobModalOpen = route.modal === 'job';
  const isCsvModalOpen = route.modal === 'csv';
  const viewingJob = route.modal === 'job-candidates' && route.id ? jobs.find(j => j.id === route.id) : null;
  const [editingCandidate, setEditingCandidate] = useState(null);

  // Função para abrir perfil do candidato (redireciona para página dedicada)
  const openCandidateProfile = (candidate) => {
    if (candidate?.id) {
      navigate(`/candidate/${candidate.id}`);
    } else if (typeof candidate === 'string') {
      // Se for apenas o ID
      navigate(`/candidate/${candidate}`);
    }
  };
  const [editingJob, setEditingJob] = useState(null);
  const [pendingTransition, setPendingTransition] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isFilterSidebarOpen, setIsFilterSidebarOpen] = useState(false);
  const [dashboardModalCandidates, setDashboardModalCandidates] = useState(null);
  const [dashboardModalTitle, setDashboardModalTitle] = useState('');
  const [highlightedCandidateId, setHighlightedCandidateId] = useState(null);
  const [interviewModalData, setInterviewModalData] = useState(null); // { candidate, job, application }
  // Helpers para abrir modais com URL
  const openJobModal = (job = null) => {
    if (job?.id) {
      navigate(`/jobs/${job.id}`);
    } else {
      navigate('/jobs/new');
    }
    setRoute(prev => ({ ...prev, page: 'jobs', modal: null, id: null }));
  };

  const closeJobModal = () => {
    setEditingJob(null);
    if (location.pathname === '/jobs/new' || /^\/jobs\/[^/]+$/.test(location.pathname)) {
      navigate('/jobs');
    } else {
      navigate(location.pathname);
    }
    setRoute(prev => ({ ...prev, page: 'jobs', modal: null, id: null }));
  };

  const openCsvModal = () => {
    const params = new URLSearchParams(location.search);
    params.set('modal', 'csv');
    navigate(`${location.pathname}?${params.toString()}`);
    setRoute(prev => ({ ...prev, modal: 'csv' }));
  };

  const closeCsvModal = () => {
    navigate(location.pathname);
    setRoute(prev => ({ ...prev, modal: null }));
  };

  const openJobCandidatesModal = (job) => {
    const params = new URLSearchParams(location.search);
    params.set('modal', 'job-candidates');
    if (job?.id) params.set('id', job.id);
    navigate(`${location.pathname}?${params.toString()}`);
    setRoute(prev => ({ ...prev, modal: 'job-candidates', id: job?.id || '' }));
  };

  const closeJobCandidatesModal = () => {
    navigate(location.pathname);
    setRoute(prev => ({ ...prev, modal: null, id: null }));
  };

  // Filtro Global
  // IMPORTANTE: createdAtPreset = 'all' para NÃO limitar por padrão aos últimos 7 dias.
  // Isso garante que todo o histórico de candidatos (ex: 2600+) apareça no Banco de Talentos,
  // a menos que o usuário ative filtros de período manualmente.
  const initialFilters = {
    jobId: 'all',
    company: 'all',
    city: 'all',
    interestArea: 'all',
    cnh: 'all',
    marital: 'all',
    origin: 'all',
    schooling: 'all',
    createdAtPreset: 'all',
    tags: 'all',
    status: 'all',
    dashboardFilter: null // 'missing-return' | 'jobs-open' | null (from URL /candidates?filter=...)
  };
  const [filters, setFilters] = useState(() => {
    try {
      const stored = localStorage.getItem(FILTER_STORAGE_KEY);
      if (stored) return { ...initialFilters, ...JSON.parse(stored) };
    } catch (e) {
      console.warn('Erro ao carregar filtros salvos', e);
    }
    return initialFilters;
  });
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 2500);
  };

  // Sync user_roles do Supabase; sincronizar dados do usuário após login
  useEffect(() => {
    if (!supabase) return;
    if (!user || user.email === DEV_USER.email) return;

    (async () => {
      try {
        const schema = () => supabase.schema('young_talents');

        // Carregar todos os user_roles
        const { data, error } = await schema().from('user_roles').select('*').order('created_at', { ascending: false });

        if (!error && data) {
          setUserRoles(data);

          // Sincronizar dados do usuário atual se necessário
          const currentUserRole = data.find(r => r.email === user.email);
          if (currentUserRole && user.id) {
            // Atualizar user_id, name e photo se necessário
            const needsUpdate =
              currentUserRole.user_id !== user.id ||
              (user.user_metadata?.full_name || user.user_metadata?.name) !== currentUserRole.name ||
              (user.user_metadata?.avatar_url || user.user_metadata?.picture) !== currentUserRole.photo;

            if (needsUpdate) {
              const { error: updateError } = await schema()
                .from('user_roles')
                .update({
                  user_id: user.id,
                  name: user.user_metadata?.full_name || user.user_metadata?.name || currentUserRole.name,
                  photo: user.user_metadata?.avatar_url || user.user_metadata?.picture || currentUserRole.photo,
                  last_login: new Date().toISOString(),
                  updated_at: new Date().toISOString()
                })
                .eq('id', currentUserRole.id);

              if (!updateError) {
                // Recarregar após atualização
                const { data: updatedData } = await schema().from('user_roles').select('*').order('created_at', { ascending: false });
                if (updatedData) setUserRoles(updatedData);
              }
            }
          }
        } else if (error) {
          console.error('Erro ao carregar user_roles:', error);
          // Em caso de erro, manter estado anterior ou array vazio
          if (error.code !== 'PGRST116' && error.code !== '42P01') {
            // Erro não é de tabela não encontrada, logar
            console.warn('Não foi possível carregar user_roles:', error.message);
          }
        }

        // Subscribe para mudanças em tempo real
        const sub = supabase
          .channel('user_roles_changes')
          .on('postgres_changes',
            { event: '*', schema: 'young_talents', table: 'user_roles' },
            async () => {
              const { data: d } = await schema().from('user_roles').select('*').order('created_at', { ascending: false });
              if (d) setUserRoles(d);
            }
          )
          .subscribe();

        return () => {
          sub.unsubscribe();
        };
      } catch (err) {
        console.error('Erro ao sincronizar user_roles:', err);
      }
    })();
  }, [user]);

  // Carregar candidatos do Supabase (view public.candidates → young_talents.candidates)
  // PostgREST limita 1000 linhas por request; paginamos em lotes de 1000 até trazer todos
  const loadCandidates = React.useCallback(async () => {
    if (!supabase) return;
    setCandidatesLoading(true);
    try {
      const PAGE_SIZE = 1000;
      let allRows = [];
      let offset = 0;
      let hasMore = true;
      while (hasMore) {
        const { data, error } = await supabase
          .from('candidates')
          .select('*')
          .order('created_at', { ascending: false })
          .range(offset, offset + PAGE_SIZE - 1);
        if (error) {
          console.error('Erro ao carregar candidatos:', error);
          setCandidates([]);
          if (typeof showToast === 'function') showToast('Falha ao carregar candidatos.', 'error');
          return;
        }
        const chunk = data ?? [];
        allRows = allRows.concat(chunk);
        hasMore = chunk.length >= PAGE_SIZE;
        offset += PAGE_SIZE;
      }
      const mapped = mapCandidatesFromSupabase(allRows);
      setCandidates(mapped);
    } catch (e) {
      console.error('Erro ao carregar candidatos:', e);
      setCandidates([]);
      if (typeof showToast === 'function') showToast('Falha ao carregar candidatos.', 'error');
    } finally {
      setCandidatesLoading(false);
    }
  }, []);

  // Carregar jobs, companies, cities, sectors, positions, applications do schema young_talents
  const schema = () => supabase?.schema('young_talents');
  const loadJobs = React.useCallback(async () => {
    if (!supabase) return;
    const { data, error } = await schema().from('jobs').select('*').order('created_at', { ascending: false });
    if (!error) setJobs(mapJobsFromSupabase(data ?? []));
    else console.error('Erro ao carregar vagas:', error);
  }, []);
  const loadCompanies = React.useCallback(async () => {
    if (!supabase) return;
    const { data, error } = await schema().from('companies').select('*').order('name');
    if (!error) setCompanies(mapCompaniesFromSupabase(data ?? []));
    else console.error('Erro ao carregar empresas:', error);
  }, []);
  const loadCities = React.useCallback(async () => {
    if (!supabase) return;
    const { data, error } = await schema().from('cities').select('*').order('name');
    if (!error) setCities(mapCitiesFromSupabase(data ?? []));
    else console.error('Erro ao carregar cidades:', error);
  }, []);
  const loadSectors = React.useCallback(async () => {
    if (!supabase) return;
    const { data, error } = await schema().from('sectors').select('*').order('name');
    if (!error) setSectors(mapSectorsFromSupabase(data ?? []));
    else console.error('Erro ao carregar setores:', error);
  }, []);
  const loadRoles = React.useCallback(async () => {
    if (!supabase) return;
    const { data, error } = await schema().from('positions').select('*').order('name');
    if (!error) setRoles(mapPositionsFromSupabase(data ?? []));
    else console.error('Erro ao carregar cargos:', error);
  }, []);
  const loadJobLevels = React.useCallback(async () => {
    if (!supabase) return;
    const { data, error } = await schema().from('job_levels').select('*').order('name');
    if (!error) setJobLevels(mapJobLevelsFromSupabase(data ?? []));
    else console.error('Erro ao carregar níveis de cargo:', error);
  }, []);
  const loadActivityAreas = React.useCallback(async () => {
    if (!supabase) return;
    const { data, error } = await schema().from('activity_areas').select('*').order('name');
    if (!error) setActivityAreas(mapActivityAreasFromSupabase(data ?? []));
    else console.error('Erro ao carregar áreas de atuação:', error);
  }, []);
  const loadApplications = React.useCallback(async () => {
    if (!supabase) return;
    const { data, error } = await schema().from('applications').select('*').order('created_at', { ascending: false });
    if (!error) setApplications(mapApplicationsFromSupabase(data ?? []));
    else console.error('Erro ao carregar candidaturas:', error);
  }, []);

  const loadActivityLog = React.useCallback(async () => {
    if (activityLogUnavailableRef.current) {
      setActivityLog([]);
      return;
    }
    if (!supabase) {
      activityLogUnavailableRef.current = true;
      setActivityLog([]);
      return;
    }
    try {
      const { data, error } = await supabase.from('activity_log').select('*').order('created_at', { ascending: false }).limit(500);
      if (error) {
        // Suprimir erro 404 (tabela não existe) - é esperado se a migration não foi executada
        if (error.code !== 'PGRST116' && error.code !== '42P01') {
          console.warn('[ActivityLog] Erro ao carregar:', error.message);
        }
        activityLogUnavailableRef.current = true;
        setActivityLog([]);
        return;
      }
      if (data) {
        setActivityLog(data.map(row => ({
          id: row.id,
          type: row.action,
          description: row.details,
          userName: row.user_name,
          userEmail: row.user_email,
          timestamp: row.created_at,
          entityType: row.entity_type,
          entityId: row.entity_id
        })));
      } else {
        setActivityLog([]);
      }
    } catch (_e) {
      activityLogUnavailableRef.current = true;
      setActivityLog([]);
    }
  }, []);

  const loadAllData = React.useCallback(async () => {
    await Promise.all([
      loadCandidates(),
      loadJobs(),
      loadCompanies(),
      loadCities(),
      loadSectors(),
      loadRoles(),
      loadJobLevels(),
      loadActivityAreas(),
      loadApplications()
    ]);
  }, [loadCandidates, loadJobs, loadCompanies, loadCities, loadSectors, loadRoles, loadJobLevels, loadActivityAreas, loadApplications]);

  useEffect(() => {
    if (!effectiveUser) return;
    loadAllData();
    if (currentUserRole === 'admin') loadActivityLog();
    if (!supabase) return;
    const channel = supabase
      .channel('candidates_changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'young_talents', table: 'candidates' }, () => {
        loadCandidates();
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'young_talents', table: 'candidates' }, () => {
        loadCandidates();
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'young_talents', table: 'candidates' }, () => {
        loadCandidates();
      })
      .subscribe();
    return () => {
      if (supabase) supabase.removeChannel(channel);
    };
  }, [effectiveUser, loadAllData, loadActivityLog, currentUserRole]);

  const handleSaveGeneric = async (col, d, closeFn) => {
    if (!supabase) return;
    const schema = () => supabase.schema('young_talents');
    try {
      if (col === 'jobs') {
        const payload = jobToSupabase(d);
        if (d.id) {
          const { id, ...rest } = payload;
          const { error } = await schema().from('jobs').update(rest).eq('id', d.id);
          if (error) throw error;
          showToast('Vaga atualizada com sucesso.', 'success');
          await recordActivity('update', `Vaga "${d.title}" atualizada`, 'job', d.id, { title: d.title });
        } else {
          const { data: inserted, error } = await schema().from('jobs').insert(payload).select('id').single();
          if (error) throw error;
          if (inserted) await recordActivity('create', `Vaga "${d.title || payload.title}" criada`, 'job', inserted.id, { title: d.title || payload.title });
          showToast('Vaga criada com sucesso.', 'success');
        }
        await loadJobs();
      } else if (col === 'companies') {
        const payload = { name: d.name ?? d.name?.trim(), city: d.city ?? null };
        if (d.id) {
          const { error } = await schema().from('companies').update(payload).eq('id', d.id);
          if (error) throw error;
          showToast('Empresa atualizada.', 'success');
        } else {
          const { error } = await schema().from('companies').insert(payload);
          if (error) throw error;
          showToast('Empresa criada.', 'success');
        }
        await loadCompanies();
      } else if (col === 'cities') {
        const payload = { name: d.name ?? d.name?.trim() };
        if (d.id) {
          const { error } = await schema().from('cities').update(payload).eq('id', d.id);
          if (error) throw error;
          showToast('Cidade atualizada.', 'success');
        } else {
          const { error } = await schema().from('cities').insert(payload);
          if (error) throw error;
          showToast('Cidade criada.', 'success');
        }
        await loadCities();
      } else if (col === 'sectors') {
        const payload = { name: d.name ?? d.name?.trim() };
        if (d.id) {
          const { error } = await schema().from('sectors').update(payload).eq('id', d.id);
          if (error) throw error;
          showToast('Setor atualizado.', 'success');
        } else {
          const { error } = await schema().from('sectors').insert(payload);
          if (error) throw error;
          showToast('Setor criado.', 'success');
        }
        await loadSectors();
      } else if (col === 'positions') {
        const payload = {
          name: d.name ?? d.name?.trim(),
          level: d.level ?? null,
          level_id: d.levelId ?? null,
          activity_area_id: d.activityAreaId ?? null
        };
        if (d.id) {
          const { error } = await schema().from('positions').update(payload).eq('id', d.id);
          if (error) throw error;
          showToast('Cargo atualizado.', 'success');
        } else {
          const { error } = await schema().from('positions').insert(payload);
          if (error) throw error;
          showToast('Cargo criado.', 'success');
        }
        await loadRoles();
      } else if (col === 'job_levels') {
        const payload = { name: d.name ?? d.name?.trim() };
        if (d.id) {
          const { error } = await schema().from('job_levels').update(payload).eq('id', d.id);
          if (error) throw error;
          showToast('Nível atualizado.', 'success');
        } else {
          const { error } = await schema().from('job_levels').insert(payload);
          if (error) throw error;
          showToast('Nível criado.', 'success');
        }
        await loadJobLevels();
      } else if (col === 'activity_areas') {
        const payload = { name: d.name ?? d.name?.trim() };
        if (d.id) {
          const { error } = await schema().from('activity_areas').update(payload).eq('id', d.id);
          if (error) throw error;
          showToast('Área de atuação atualizada.', 'success');
        } else {
          const { error } = await schema().from('activity_areas').insert(payload);
          if (error) throw error;
          showToast('Área de atuação criada.', 'success');
        }
        await loadActivityAreas();
      } else if (col === 'candidates') {
        const payload = candidateToSupabase(d);
        if (d.id) {
          const { id, ...rest } = payload;
          const { error } = await supabase.from('candidates').update(rest).eq('id', d.id);
          if (error) throw error;
          showToast('Candidato atualizado.', 'success');
        } else {
          const { error } = await supabase.from('candidates').insert(payload);
          if (error) throw error;
          showToast('Candidato criado.', 'success');
        }
        await loadCandidates();
      } else {
        showToast('Coleção não suportada para salvar.', 'error');
        return;
      }
      closeFn?.();
    } catch (err) {
      console.error('Erro ao salvar:', err);
      const msg = err?.message || err?.details || (typeof err?.error_description === 'string' ? err.error_description : null);
      showToast(msg ? `${msg}` : 'Erro ao salvar. Verifique os dados e tente novamente.', 'error');
    }
  };

  const handleDeleteGeneric = async (col, id) => {
    if (!window.confirm('Tem certeza que deseja excluir este item?')) return;
    if (!supabase) return;
    const schema = () => supabase.schema('young_talents');
    try {
      if (col === 'jobs') {
        const { error } = await schema().from('jobs').update({ deleted_at: new Date().toISOString() }).eq('id', id);
        if (error) throw error;
        showToast('Vaga excluída.', 'success');
        await loadJobs();
      } else if (col === 'companies') {
        const { error } = await schema().from('companies').delete().eq('id', id);
        if (error) throw error;
        showToast('Empresa excluída.', 'success');
        await loadCompanies();
      } else if (col === 'cities') {
        const { error } = await schema().from('cities').delete().eq('id', id);
        if (error) throw error;
        showToast('Cidade excluída.', 'success');
        await loadCities();
      } else if (col === 'sectors') {
        const { error } = await schema().from('sectors').delete().eq('id', id);
        if (error) throw error;
        showToast('Setor excluído.', 'success');
        await loadSectors();
      } else if (col === 'positions') {
        const { error } = await schema().from('positions').delete().eq('id', id);
        if (error) throw error;
        showToast('Cargo excluído.', 'success');
        await loadRoles();
      } else if (col === 'job_levels') {
        const { error } = await schema().from('job_levels').delete().eq('id', id);
        if (error) throw error;
        showToast('Nível excluído.', 'success');
        await loadJobLevels();
      } else if (col === 'activity_areas') {
        const { error } = await schema().from('activity_areas').delete().eq('id', id);
        if (error) throw error;
        showToast('Área de atuação excluída.', 'success');
        await loadActivityAreas();
      } else if (col === 'candidates') {
        const { error } = await supabase.from('candidates').delete().eq('id', id);
        if (error) throw error;
        showToast('Candidato excluído.', 'success');
        await loadCandidates();
      } else {
        showToast('Coleção não suportada para excluir.', 'error');
      }
    } catch (err) {
      console.error('Erro ao excluir:', err);
      showToast(err?.message || 'Erro ao excluir. Tente novamente.', 'error');
    }
  };

  // Função para registrar histórico de ações
  const recordActionHistory = async ({ action, col, recordsAffected, details = {} }) => {
    if (!effectiveUser || !effectiveUser.email) return;
    // TODO: Migrar para Supabase
    console.log('Action history:', { action, col, recordsAffected, details });
  };

  // Função para registrar atividades gerais do sistema (log completo) — persiste em young_talents.activity_log
  const recordActivity = async (activityType, description, entityType = null, entityId = null, metadata = {}) => {
    if (!effectiveUser || !effectiveUser.email || !supabase) return;
    try {
      const payload = {
        user_id: effectiveUser.id || null,
        user_email: effectiveUser.email,
        user_name: effectiveUser.displayName || effectiveUser.email,
        action: activityType,
        entity_type: entityType || null,
        entity_id: entityId || null,
        details: description || '',
        meta: metadata && Object.keys(metadata).length > 0 ? metadata : null
      };
      const { data, error } = await supabase.from('activity_log').insert(payload).select('id, created_at').single();
      if (!error && data) {
        setActivityLog(prev => [...prev, { id: data.id, type: activityType, description, userName: payload.user_name, userEmail: payload.user_email, timestamp: data.created_at, entityType, entityId }]);
      }
    } catch (e) {
      console.warn('Erro ao registrar atividade:', e);
    }
  };

  // Função para registrar log de movimentação de status do candidato
  const recordStatusMovement = async (candidateId, candidateName, previousStatus, newStatus) => {
    if (!effectiveUser || !effectiveUser.email) return;

    const isClosingStatus = CLOSING_STATUSES.includes(newStatus);

    try {
      // TODO: Migrar para Supabase
      console.log('Status movement:', { candidateId, candidateName, previousStatus, newStatus, isClosingStatus });

      // Registrar também no log de atividades
      await recordActivity('move', `${candidateName} movido de "${previousStatus || 'Inscrito'}" para "${newStatus}"`, 'candidate', candidateId, { previousStatus: previousStatus || 'Inscrito', newStatus, isClosingStatus });

      console.log(`[Log] Movimentação registrada: ${candidateName} de "${previousStatus || 'Inscrito'}" para "${newStatus}"`);
    } catch (error) {
      console.error('Erro ao registrar movimentação de status:', error);
      // Não interrompe a operação principal se o log falhar
    }
  };

  // ======= SISTEMA DE CANDIDATURAS (APPLICATIONS) =======

  // Criar nova candidatura (candidato se candidata a uma vaga)
  const createApplication = async (candidateId, jobId) => {
    if (!effectiveUser || !effectiveUser.email) return null;

    // Verifica se já existe candidatura
    const existingApp = applications.find(a => a.candidateId === candidateId && a.jobId === jobId);
    if (existingApp) {
      showToast('Candidato já está vinculado a esta vaga', 'info');
      return existingApp;
    }

    const candidate = candidates.find(c => c.id === candidateId);
    const job = jobs.find(j => j.id === jobId);

    try {
      const payload = {
        candidate_id: candidateId,
        job_id: jobId,
        candidate_name: candidate?.fullName || 'Candidato',
        candidate_email: candidate?.email || '',
        job_title: job?.title || 'Vaga',
        job_company: job?.company || '',
        status: 'Inscrito',
        applied_at: new Date().toISOString(),
        last_activity: new Date().toISOString(),
        rating: 0,
        closed_at: null,
        closed_reason: null,
        created_by: effectiveUser.email,
        created_at: new Date().toISOString(),
        notes: []
      };
      const { data: inserted, error } = await supabase.schema('young_talents').from('applications').insert(payload).select('*').single();
      if (error) throw error;
      if (inserted) await recordActivity('create', `Candidatura: ${candidate?.fullName || 'Candidato'} vinculado à vaga "${job?.title || 'Vaga'}"`, 'application', inserted.id, { candidateId, jobId });
      await loadApplications();
      const appData = inserted ? {
        id: inserted.id,
        candidateId: inserted.candidate_id,
        jobId: inserted.job_id,
        candidateName: inserted.candidate_name,
        candidateEmail: inserted.candidate_email,
        jobTitle: inserted.job_title,
        jobCompany: inserted.job_company,
        status: inserted.status,
        appliedAt: inserted.applied_at,
        lastActivity: inserted.last_activity,
        rating: inserted.rating,
        closedAt: inserted.closed_at,
        closedReason: inserted.closed_reason,
        createdBy: inserted.created_by,
        createdAt: inserted.created_at,
        notes: inserted.notes ?? []
      } : null;
      showToast(`${candidate?.fullName} vinculado à vaga ${job?.title}`, 'success');
      return appData;
    } catch (error) {
      console.error('Erro ao criar candidatura:', error);
      showToast(error?.message || 'Erro ao vincular candidato à vaga', 'error');
      return null;
    }
  };

  // Atualizar status da candidatura
  const updateApplicationStatus = async (applicationId, newStatus, notes = '') => {
    if (!effectiveUser || !effectiveUser.email) return;

    const app = applications.find(a => a.id === applicationId);
    if (!app) return;

    try {
      // TODO: Migrar para Supabase
      console.log('Update application status:', { applicationId, newStatus, notes, app });

      showToast('Status da candidatura atualizado', 'success');
    } catch (error) {
      console.error('Erro ao atualizar candidatura:', error);
      showToast('Erro ao atualizar candidatura', 'error');
    }
  };

  // Remover candidatura
  const removeApplication = async (applicationId) => {
    if (!window.confirm('Remover este candidato da vaga?')) return;

    try {
      // TODO: Migrar para Supabase
      console.log('Remove application:', { applicationId });
      showToast('Candidato removido da vaga', 'success');
    } catch (error) {
      console.error('Erro ao remover candidatura:', error);
      showToast('Erro ao remover candidatura', 'error');
    }
  };

  // Adicionar nota à candidatura
  const addApplicationNote = async (applicationId, noteText) => {
    if (!effectiveUser || !effectiveUser.email || !noteText.trim()) return;

    const app = applications.find(a => a.id === applicationId);
    if (!app) return;

    try {
      const existingNotes = app.notes || [];
      const newNote = {
        text: noteText.trim(),
        timestamp: new Date().toISOString(),
        userEmail: effectiveUser.email,
        userName: effectiveUser.displayName || effectiveUser.email
      };

      // TODO: Migrar para Supabase
      console.log('Add note:', { applicationId, newNote, existingNotes });

      showToast('Nota adicionada', 'success');
    } catch (error) {
      console.error('Erro ao adicionar nota:', error);
      showToast('Erro ao adicionar nota', 'error');
    }
  };

  // ======= SISTEMA DE AGENDAMENTO DE ENTREVISTAS =======

  // Criar agendamento de entrevista
  const scheduleInterview = async (data) => {
    if (!effectiveUser || !effectiveUser.email) return null;
    if (!hasPermission('schedule_interviews') && !hasPermission('all')) {
      showToast('Sem permissão para agendar entrevistas', 'error');
      return null;
    }

    try {
      const interviewData = {
        candidateId: data.candidateId,
        candidateName: data.candidateName || '',
        candidateEmail: data.candidateEmail || '',
        jobId: data.jobId || null,
        jobTitle: data.jobTitle || '',
        applicationId: data.applicationId || null,
        type: data.type || 'Entrevista', // Entrevista, Teste, Dinâmica
        date: data.date, // YYYY-MM-DD
        time: data.time, // HH:MM
        duration: data.duration || 60, // minutos
        location: data.location || '', // Local físico ou link
        isOnline: data.isOnline || false,
        meetingLink: data.meetingLink || '',
        interviewers: data.interviewers || [], // emails dos entrevistadores
        notes: data.notes || '',
        status: 'Agendada', // Agendada, Confirmada, Realizada, Cancelada, NoShow
        createdBy: effectiveUser.email,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // TODO: Migrar para Supabase
      const docRef = { id: 'temp-' + Date.now() };

      // Registrar atividade
      await recordActivity('schedule', `Entrevista agendada para ${data.candidateName} em ${data.date} às ${data.time}`, 'interview', docRef.id, { candidateId: data.candidateId, jobId: data.jobId, date: data.date, time: data.time });

      showToast('Entrevista agendada com sucesso!', 'success');
      return { id: docRef.id, ...interviewData };
    } catch (error) {
      console.error('Erro ao agendar entrevista:', error);
      showToast('Erro ao agendar entrevista', 'error');
      return null;
    }
  };

  // Atualizar status da entrevista
  const updateInterviewStatus = async (interviewId, newStatus, feedback = '') => {
    if (!effectiveUser || !effectiveUser.email) return;

    try {
      // TODO: Migrar para Supabase
      console.log('Update interview:', { interviewId, newStatus, feedback });
      showToast('Status da entrevista atualizado', 'success');
    } catch (error) {
      console.error('Erro ao atualizar entrevista:', error);
      showToast('Erro ao atualizar entrevista', 'error');
    }
  };

  // Cancelar entrevista
  const cancelInterview = async (interviewId, reason = '') => {
    if (!window.confirm('Cancelar esta entrevista?')) return;

    try {
      // TODO: Migrar para Supabase
      console.log('Cancel interview:', { interviewId, reason });
      showToast('Entrevista cancelada', 'success');
    } catch (error) {
      console.error('Erro ao cancelar entrevista:', error);
      showToast('Erro ao cancelar entrevista', 'error');
    }
  };

  // ======= GERENCIAMENTO DE USUÁRIOS E ROLES =======

  // Adicionar/atualizar role de usuário
  const setUserRole = async (email, role, userName = '') => {
    if (!hasPermission('all')) {
      showToast('Apenas administradores podem gerenciar usuários', 'error');
      return;
    }

    if (!supabase) {
      showToast('Erro de conexão com o servidor', 'error');
      return;
    }

    try {
      const normalizedEmail = email.trim().toLowerCase();
      const existingRole = userRoles.find(r => r.email === normalizedEmail);

      const schema = () => supabase.schema('young_talents');

      if (existingRole) {
        // Atualizar role existente
        const { error } = await schema()
          .from('user_roles')
          .update({
            role: role,
            name: userName || existingRole.name || null,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingRole.id);

        if (error) {
          // Se erro de constraint ou RLS, tentar por email
          if (error.code === '42501' || error.message?.includes('policy')) {
            throw new Error('Você não tem permissão para atualizar este usuário');
          }
          throw error;
        }

        showToast(`Permissão de ${normalizedEmail} atualizada para ${role}`, 'success');
      } else {
        // Criar novo registro (user_id será NULL até o primeiro login)
        const { error } = await schema()
          .from('user_roles')
          .insert({
            email: normalizedEmail,
            name: userName || null,
            role: role,
            user_id: null, // Será preenchido automaticamente no primeiro login
            created_at: new Date().toISOString()
          });

        if (error) {
          // Se erro de constraint unique (email duplicado), tentar atualizar
          if (error.code === '23505') {
            const { error: updateError } = await schema()
              .from('user_roles')
              .update({
                role: role,
                name: userName || null,
                updated_at: new Date().toISOString()
              })
              .eq('email', normalizedEmail);

            if (updateError) throw updateError;
            showToast(`Permissão de ${normalizedEmail} atualizada para ${role}`, 'success');
          } else if (error.code === '42501' || error.message?.includes('policy')) {
            throw new Error('Você não tem permissão para criar este usuário');
          } else {
            throw error;
          }
        } else {
          showToast(`Usuário ${normalizedEmail} adicionado com perfil ${role}`, 'success');
        }
      }

      // Recarregar lista de usuários
      const { data: updatedRoles, error: fetchError } = await schema()
        .from('user_roles')
        .select('*')
        .order('created_at', { ascending: false });

      if (!fetchError && updatedRoles) {
        setUserRoles(updatedRoles);
      }

    } catch (error) {
      console.error('Erro ao definir role:', error);
      showToast('Erro ao atualizar permissão: ' + (error.message || 'Erro desconhecido'), 'error');
    }
  };

  // Criar usuário com email/senha via Edge Function (apenas admin)
  const createUserWithPassword = async (email, password, role, userName = '') => {
    if (!hasPermission('all')) {
      showToast('Apenas administradores podem criar usuários', 'error');
      return false;
    }
    if (!supabase) {
      showToast('Erro de conexão com o servidor', 'error');
      return false;
    }
    try {
      const { data, error } = await supabase.functions.invoke('create-user', {
        body: { email, password, role, name: userName || null }
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      showToast(`Usuário ${email} criado com sucesso`, 'success');
      const schema = () => supabase.schema('young_talents');
      const { data: updatedRoles } = await schema().from('user_roles').select('*').order('created_at', { ascending: false });
      if (updatedRoles) setUserRoles(updatedRoles);
      return true;
    } catch (err) {
      showToast(err?.message || 'Erro ao criar usuário', 'error');
      return false;
    }
  };

  // Remover usuário
  const removeUserRole = async (roleId) => {
    if (!hasPermission('all')) {
      showToast('Apenas administradores podem gerenciar usuários', 'error');
      return;
    }

    if (!window.confirm('Remover acesso deste usuário?')) return;

    if (!supabase) {
      showToast('Erro de conexão com o servidor', 'error');
      return;
    }

    try {
      const schema = () => supabase.schema('young_talents');

      const { error } = await schema()
        .from('user_roles')
        .delete()
        .eq('id', roleId);

      if (error) {
        if (error.code === '42501' || error.message?.includes('policy')) {
          throw new Error('Você não tem permissão para remover este usuário');
        }
        throw error;
      }

      showToast('Acesso removido', 'success');

      // Recarregar lista de usuários
      const { data: updatedRoles, error: fetchError } = await schema()
        .from('user_roles')
        .select('*')
        .order('created_at', { ascending: false });

      if (!fetchError && updatedRoles) {
        setUserRoles(updatedRoles);
      }

    } catch (error) {
      console.error('Erro ao remover usuário:', error);
      showToast('Erro ao remover acesso: ' + (error.message || 'Erro desconhecido'), 'error');
    }
  };

  const computeMissingFields = (candidate, nextStatus) => {
    const required = STAGE_REQUIRED_FIELDS[nextStatus] || [];
    return required.filter((field) => {
      const value = candidate[field];
      return value === undefined || value === null || value === '';
    });
  };

  // --- LÓGICA DE MOVIMENTO DE CARDS COM VALIDAÇÃO ---
  const handleDragEnd = async (cId, newStage) => {
    const candidate = candidates.find(c => c.id === cId);
    if (!candidate || candidate.status === newStage || !ALL_STATUSES.includes(newStage)) return;

    // Validar se precisa de candidatura (a partir de "Considerado")
    // IMPORTANTE: Usar apenas applications como fonte de verdade, não candidate.jobId
    const stagesRequiringApplication = PIPELINE_STAGES.slice(PIPELINE_STAGES.indexOf('Considerado'));
    const needsApplication = stagesRequiringApplication.includes(newStage);
    if (needsApplication) {
      const candidateApplications = applications.filter(a => a.candidateId === cId);
      if (candidateApplications.length === 0) {
        showToast('É necessário vincular o candidato a uma vaga antes de avançar para esta etapa. Use o botão "Vincular a Vaga" no perfil do candidato.', 'error');
        return;
      }
    }

    const missingFields = computeMissingFields(candidate, newStage);
    const isConclusion = CLOSING_STATUSES.includes(newStage);

    // Para conclusões ou quando há campos obrigatórios faltando, abre modal
    if (isConclusion || missingFields.length > 0) {
      setPendingTransition({
        candidate,
        toStage: newStage,
        missingFields,
        isConclusion
      });
      return;
    }

    // Movimentação direta quando não há pendências
    const previousStatus = candidate.status || 'Inscrito';
    // TODO: Migrar para Supabase
    console.log('Update candidate status:', { cId, newStage, previousStatus, candidate });

    showToast('Status atualizado', 'success');
  };

  const handleCloseStatus = (cId, status) => {
    handleDragEnd(cId, status); // Reutiliza a lógica do DragEnd para acionar o modal se necessário
  };

  // Um candidato por email (último envio por timestamp) para listagem e contagem; múltiplos envios ficam nas linhas do banco.
  // Candidatos sem email usam chave por id para não serem perdidos na deduplicação.
  const uniqueCandidatesByEmail = useMemo(() => {
    const byKey = {};
    const filtered = candidates.filter(c => !c.deletedAt);
    filtered.forEach(c => {
      const key = (c.email != null && String(c.email).trim() !== '') ? c.email : `no-email-${c.id}`;
      const ts = getCandidateTimestamp(c) || (c.createdAt ? new Date(c.createdAt).getTime() / 1000 : 0);
      if (!byKey[key] || (getCandidateTimestamp(byKey[key]) || 0) < ts) byKey[key] = c;
    });
    return Object.values(byKey);
  }, [candidates]);

  // Filtra candidatos baseado nos filtros da Sidebar (Avançados) — usa lista única por email
  const filteredCandidates = useMemo(() => {
    let data = [...uniqueCandidatesByEmail];
    const nowSeconds = Math.floor(Date.now() / 1000);
    const preset = filters.createdAtPreset || 'all';
    const presetToSeconds = {
      'today': 1 * 24 * 60 * 60,
      'yesterday': 2 * 24 * 60 * 60,
      '7d': 7 * 24 * 60 * 60,
      '30d': 30 * 24 * 60 * 60,
      '90d': 90 * 24 * 60 * 60,
    };

    Object.keys(filters).forEach(key => {
      if (filters[key] !== 'all' && filters[key] !== '' && filters[key] !== null && filters[key] !== undefined) {
        if (key === 'createdAtPreset' || key === 'customDateStart' || key === 'customDateEnd' || key === 'tags' || key === 'dashboardFilter') return;

        // Suporta arrays para seleção múltipla
        if (Array.isArray(filters[key])) {
          if (filters[key].length > 0) {
            data = data.filter(c => filters[key].includes(c[key]));
          }
        } else {
          data = data.filter(c => c[key] === filters[key]);
        }
      }
    });

    // Filtro por tags (seleção múltipla)
    if (filters.tags && filters.tags !== 'all' && Array.isArray(filters.tags) && filters.tags.length > 0) {
      data = data.filter(c => {
        if (!c.tags || !Array.isArray(c.tags)) return false;
        return filters.tags.some(tag => c.tags.includes(tag));
      });
    }

    // Filtro por período - USANDO DATA DE CADASTRO ORIGINAL
    if (preset === 'custom' && filters.customDateStart && filters.customDateEnd) {
      const startDate = new Date(filters.customDateStart).getTime() / 1000;
      const endDate = new Date(filters.customDateEnd).getTime() / 1000 + 86400; // +1 dia para incluir o dia final
      data = data.filter(c => {
        const ts = getCandidateTimestamp(c);
        if (!ts) return false;
        return ts >= startDate && ts <= endDate;
      });
    } else if (preset === 'today') {
      // Hoje: do início do dia até agora
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const startTs = todayStart.getTime() / 1000;
      data = data.filter(c => {
        const ts = getCandidateTimestamp(c);
        if (!ts) return false;
        return ts >= startTs;
      });
    } else if (preset === 'yesterday') {
      // Ontem: do início de ontem até o início de hoje
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const yesterdayStart = new Date(todayStart);
      yesterdayStart.setDate(yesterdayStart.getDate() - 1);
      const startTs = yesterdayStart.getTime() / 1000;
      const endTs = todayStart.getTime() / 1000;
      data = data.filter(c => {
        const ts = getCandidateTimestamp(c);
        if (!ts) return false;
        return ts >= startTs && ts < endTs;
      });
    } else if (preset !== 'all') {
      const delta = presetToSeconds[preset];
      if (delta) {
        data = data.filter(c => {
          const ts = getCandidateTimestamp(c);
          if (!ts) return false;
          return ts >= nowSeconds - delta;
        });
      }
    }

    // Filtros vindos da URL (scorecards do dashboard)
    if (filters.dashboardFilter === 'missing-return') {
      data = data.filter(c => {
        const isSelection = c.status === 'Seleção' || c.status === 'Selecionado';
        const needsReturn = !c.returnSent || c.returnSent === 'Pendente' || c.returnSent === 'Não';
        return isSelection && needsReturn;
      });
    } else if (filters.dashboardFilter === 'jobs-open') {
      const openJobIds = (jobs || []).filter(j => j.status === 'Aberta').map(j => j.id);
      data = data.filter(c => (applications || []).some(a => a.candidateId === c.id && openJobIds.includes(a.jobId)));
    }

    return data;
  }, [uniqueCandidatesByEmail, filters, jobs, applications]);

  const optionsProps = { jobs, companies, cities, interestAreas, roles, sectors, origins, schooling, marital, tags, userRoles, user: effectiveUser };

  // Verificar se Supabase foi inicializado corretamente
  if (!supabase) {
    return (
      <div className="flex h-screen items-center justify-center bg-white dark:bg-gray-900">
        <div className="text-center p-8 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg max-w-md">
          <AlertCircle className="mx-auto mb-4 text-red-600 dark:text-red-400" size={48} />
          <h2 className="text-xl font-bold text-red-900 dark:text-red-200 mb-2">Erro de Configuração</h2>
          <p className="text-red-700 dark:text-red-300 mb-4">
            Supabase não foi inicializado corretamente. Verifique as variáveis de ambiente no Vercel.
          </p>
          <p className="text-sm text-red-600 dark:text-red-400 mb-2">
            Variáveis necessárias:
          </p>
          <ul className="text-sm text-red-600 dark:text-red-400 text-left list-disc list-inside">
            <li>VITE_SUPABASE_URL</li>
            <li>VITE_SUPABASE_ANON_KEY</li>
          </ul>
          <p className="text-sm text-red-600 dark:text-red-400 mt-4">
            Abra o console do navegador (F12) para mais detalhes.
          </p>
        </div>
      </div>
    );
  }

  if (authLoading) return <div className="flex h-screen items-center justify-center bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400"><Loader2 className="animate-spin mr-2" /> Carregando...</div>;

  // Sem sessão em rota protegida -> mostrar apenas login (redirect já feito no useEffect)
  if (!effectiveUser && !isPublicPath) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="*" element={<div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin" /></div>} />
      </Routes>
    );
  }

  return (
    <>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/apply" element={<PublicCandidateForm />} />
        <Route path="/apply/test" element={<FormSubmitTestPage />} />
        <Route path="/apply/thank-you" element={<ThankYouPage />} />

        <Route path="/candidate/:id" element={
          <CandidateProfilePage
            candidates={candidates}
            jobs={jobs}
            companies={companies}
            applications={applications}
            interviews={interviews}
            statusMovements={statusMovements}
            onUpdateCandidate={(updatedCandidate) => {
              // Atualiza o candidato na lista local se necessário
              const index = candidates.findIndex(c => c.id === updatedCandidate.id);
              if (index >= 0) {
                // A atualização já foi feita no Firestore, apenas sincroniza localmente se necessário
              }
            }}
            onCreateApplication={createApplication}
            onScheduleInterview={(candidate) => setInterviewModalData({ candidate })}
            onStatusChange={handleDragEnd}
          />
        } />
        <Route path="*" element={
          <div className="flex min-h-screen bg-white dark:bg-gray-900 font-sans text-slate-200 overflow-hidden">

            {/* SIDEBAR PRINCIPAL */}
            <div className={`fixed inset-y-0 left-0 z-30 w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} ${!isSidebarCollapsed ? 'lg:translate-x-0' : 'lg:-translate-x-full'}`}>
              <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <img
                    src="/logo-young-empreendimentos-caixa.png"
                    alt="Young"
                    className="h-10 w-10 rounded-lg"
                  />
                  <div>
                    <div className="font-bold text-gray-900 dark:text-white text-sm">Young Talents</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">ATS</div>
                  </div>
                </div>
                <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white"><X /></button>
              </div>
              <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                {/* Dashboard */}
                <button onClick={() => { setActiveTab('dashboard'); setIsSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'dashboard' ? 'bg-blue-600 text-white shadow-lg dark:bg-blue-500' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'}`}>
                  <LayoutDashboard size={18} /> Dashboard
                </button>

                {/* Pipeline */}
                <button onClick={() => { setActiveTab('pipeline'); setIsSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'pipeline' ? 'bg-blue-600 text-white shadow-lg dark:bg-blue-500' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'}`}>
                  <Kanban size={18} /> Pipeline
                </button>

                {/* Banco de Talentos */}
                <button onClick={() => { setActiveTab('candidates'); setIsSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'candidates' ? 'bg-blue-600 text-white shadow-lg dark:bg-blue-500' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'}`}>
                  <Users size={18} /> Banco de Talentos
                </button>

                {/* Formulários recebidos (todos os envios) */}
                <button onClick={() => { setActiveTab('submissions'); setIsSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'submissions' ? 'bg-blue-600 text-white shadow-lg dark:bg-blue-500' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'}`}>
                  <FileText size={18} /> Formulários recebidos
                </button>

                {/* Vagas - Gerenciar Vagas (página com abas) + Candidaturas */}
                <div>
                  <button onClick={() => { setActiveTab(['jobs', 'applications'].includes(activeTab) ? activeTab : 'jobs'); setIsSidebarOpen(false); }} className={`w-full flex items-center justify-between gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${['jobs', 'applications', 'companies', 'positions', 'sectors', 'cities'].includes(activeTab) ? 'bg-blue-600 text-white shadow-lg dark:bg-blue-500' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'}`}>
                    <div className="flex items-center gap-3">
                      <Briefcase size={18} /> Vagas
                    </div>
                    <ChevronRight size={16} className={`transition-transform ${['jobs', 'applications', 'companies', 'positions', 'sectors', 'cities'].includes(activeTab) ? 'rotate-90' : ''}`} />
                  </button>
                  {['jobs', 'applications', 'companies', 'positions', 'sectors', 'cities'].includes(activeTab) && (
                    <div className="ml-4 mt-1 space-y-1 border-l-2 border-gray-300 dark:border-gray-600 pl-4">
                      <button onClick={() => { setActiveTab('jobs'); setIsSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg text-xs font-medium transition-colors ${['jobs', 'companies', 'positions', 'sectors', 'cities'].includes(activeTab) ? 'bg-blue-500/20 text-blue-700 dark:text-blue-300' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
                        Gerenciar Vagas
                      </button>
                      <button onClick={() => { setActiveTab('applications'); setIsSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg text-xs font-medium transition-colors ${activeTab === 'applications' ? 'bg-blue-500/20 text-blue-700 dark:text-blue-300' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
                        Candidaturas
                      </button>
                    </div>
                  )}
                </div>

                {/* Relatórios */}
                <button onClick={() => { setActiveTab('reports'); setIsSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'reports' ? 'bg-blue-600 text-white shadow-lg dark:bg-blue-500' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'}`}>
                  <BarChart3 size={18} /> Relatórios
                </button>

                {/* Configurações — navega já com aba padrão para abrir em um clique */}
                <button onClick={() => { navigate('/settings?settingsTab=campos'); setRoute(prev => ({ ...prev, page: 'settings', settingsTab: 'campos' })); setIsSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'settings' ? 'bg-blue-600 text-white shadow-lg dark:bg-blue-500' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'}`}>
                  <Settings size={18} /> Configurações
                </button>

                {/* Diagnóstico — em desenvolvimento */}
                <button onClick={() => { setActiveTab('diagnostic'); setIsSidebarOpen(false); }} title="Funcionalidade em desenvolvimento" className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors cursor-not-allowed opacity-70 ${activeTab === 'diagnostic' ? 'bg-gray-500 text-white dark:bg-gray-600' : 'text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
                  <AlertCircle size={18} /> Diagnóstico <span className="text-xs ml-1">(em breve)</span>
                </button>

                {/* Ajuda */}
                <button onClick={() => { setActiveTab('help'); setIsSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'help' ? 'bg-blue-600 text-white shadow-lg dark:bg-blue-500' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'}`}>
                  <HelpCircle size={18} /> Ajuda
                </button>
              </nav>
              <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/30 space-y-2">
                <div className="text-xs text-slate-400 truncate w-32" title={effectiveUser?.email}>{effectiveUser?.email || 'Desenvolvimento'}</div>
                {supabase && user && (
                  <button
                    type="button"
                    onClick={async () => {
                      await supabase.auth.signOut();
                      navigate('/login', { replace: true });
                    }}
                    className="text-xs text-slate-500 hover:text-red-600 dark:hover:text-red-400 font-medium"
                  >
                    Sair
                  </button>
                )}
              </div>
            </div>

            {/* CONTEÚDO PRINCIPAL */}
            <div className={`flex-1 flex flex-col h-screen overflow-hidden transition-all duration-300 ${!isSidebarCollapsed ? 'lg:pl-64' : 'lg:pl-0'}`}>
              <header className="h-16 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex items-center justify-between px-4 z-20">
                <div className="flex items-center gap-2">
                  {/* Botão mobile */}
                  <button
                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    className="lg:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                  >
                    <Menu size={20} className="text-gray-600 dark:text-gray-400" />
                  </button>
                  {/* Botão desktop - ocultar/mostrar menu */}
                  <button
                    onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                    className="hidden lg:flex p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                    title={isSidebarCollapsed ? 'Mostrar menu' : 'Ocultar menu'}
                  >
                    {isSidebarCollapsed ? <Menu size={20} className="text-gray-600 dark:text-gray-400" /> : <ChevronLeft size={20} className="text-gray-600 dark:text-gray-400" />}
                  </button>
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white ml-2">
                    {activeTab === 'pipeline' ? 'Pipeline de Talentos' : activeTab === 'candidates' ? 'Banco de Talentos' : activeTab === 'submissions' ? 'Formulários recebidos' : ['jobs', 'companies', 'positions', 'sectors', 'cities'].includes(activeTab) ? 'Gerenciar Vagas' : activeTab === 'applications' ? 'Candidaturas' : activeTab === 'settings' ? 'Configurações' : activeTab === 'diagnostic' ? 'Diagnóstico' : activeTab === 'reports' ? 'Relatórios' : activeTab === 'help' ? 'Ajuda' : 'Dashboard'}
                  </h2>
                </div>
                <div className="flex items-center gap-3">
                  <button onClick={() => setIsFilterSidebarOpen(true)} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 font-medium px-3 py-1.5 rounded border border-gray-300 dark:border-gray-600 hover:border-blue-500 dark:hover:border-blue-500 transition-colors">
                    <Filter size={16} /> Filtros
                  </button>
                  <button onClick={toggleTheme} className="p-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 rounded border border-gray-300 dark:border-gray-600 hover:border-blue-500 dark:hover:border-blue-500 transition-colors">
                    {isDark ? <Sun size={18} /> : <Moon size={18} />}
                  </button>
                </div>
              </header>

              <div className="flex-1 overflow-hidden bg-white dark:bg-gray-900 relative">
                {/* Aviso quando há envios mas os filtros ocultam todos os candidatos no Pipeline/Banco */}
                {!candidatesLoading && (activeTab === 'pipeline' || activeTab === 'candidates') && filteredCandidates.length === 0 && (uniqueCandidatesByEmail.length > 0 || candidates.filter(c => !c.deletedAt).length > 0) && (
                  <div className="flex items-center justify-between gap-4 px-4 py-3 bg-amber-50 dark:bg-amber-900/30 border-b border-amber-200 dark:border-amber-700 text-amber-800 dark:text-amber-200 text-sm">
                    <span>Os filtros estão ocultando todos os candidatos. Limpe os filtros para ver o Pipeline e o Banco de Talentos.</span>
                    <button type="button" onClick={() => setFilters(initialFilters)} className="shrink-0 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-medium text-sm transition-colors">
                      Limpar filtros
                    </button>
                  </div>
                )}
                {/^\/jobs\/[^/]+$/.test(location.pathname) && (
                  <div className="p-6 overflow-y-auto h-full">
                    <JobModal
                      isOpen
                      isPageMode
                      job={location.pathname === '/jobs/new' ? null : jobs.find(j => j.id === location.pathname.replace(/^\/jobs\//, ''))}
                      onClose={() => navigate('/jobs')}
                      onSave={d => handleSaveGeneric('jobs', d, () => navigate('/jobs'))}
                      options={optionsProps}
                      isSaving={isSaving}
                      candidates={candidates}
                    />
                  </div>
                )}
                {activeTab === 'dashboard' && <div className="p-6 overflow-y-auto h-full"><Dashboard candidatesLoading={candidatesLoading} filteredJobs={jobs} filteredCandidates={filteredCandidates} totalCandidatesCount={uniqueCandidatesByEmail.length} totalSubmissionsCount={candidates.filter(c => !c.deletedAt).length} onOpenCandidates={setDashboardModalCandidates} onSetModalTitle={setDashboardModalTitle} onNavigateToCandidates={(path) => navigate(path)} onNavigateToJobs={(path) => navigate(path)} statusMovements={statusMovements} applications={applications} onViewJob={openJobCandidatesModal} interviews={interviews} onScheduleInterview={(candidate) => setInterviewModalData({ candidate })} /></div>}
                {activeTab === 'pipeline' && <PipelineView candidatesLoading={candidatesLoading} candidatesTotal={candidates.length} filteredCount={filteredCandidates.length} onClearFilters={() => setFilters(initialFilters)} candidates={filteredCandidates} jobs={jobs} companies={companies} onDragEnd={handleDragEnd} onEdit={openCandidateProfile} onCloseStatus={handleCloseStatus} applications={applications} interviews={interviews} forceViewMode="kanban" highlightedCandidateId={highlightedCandidateId} />}
                {activeTab === 'candidates' && <TalentBankView candidatesLoading={candidatesLoading} candidatesTotal={candidates.length} filteredCount={filteredCandidates.length} onClearFilters={() => setFilters(initialFilters)} candidates={filteredCandidates} jobs={jobs} companies={companies} onEdit={openCandidateProfile} applications={applications} onStatusChange={handleDragEnd} />}
                {activeTab === 'submissions' && <SubmissionsView candidatesLoading={candidatesLoading} candidates={candidates.filter(c => !c.deletedAt)} onEdit={openCandidateProfile} />}
                {(activeTab === 'jobs' || activeTab === 'companies' || activeTab === 'positions' || activeTab === 'sectors' || activeTab === 'cities') && !/^\/jobs\/[^/]+$/.test(location.pathname) && (
                  <JobsManagementPage
                    jobs={jobs}
                    candidates={candidates}
                    companies={companies}
                    cities={cities}
                    sectors={sectors}
                    roles={roles}
                    jobLevels={jobLevels}
                    activityAreas={activityAreas}
                    onOpenJobModal={openJobModal}
                    onDeleteGeneric={handleDeleteGeneric}
                    onSaveGeneric={handleSaveGeneric}
                    onShowToast={showToast}
                    onViewCandidates={openJobCandidatesModal}
                    setFilters={setFilters}
                    setActiveTab={setActiveTab}
                    filters={filters}
                    routeTab={activeTab}
                    initialJobStatusFilter={new URLSearchParams(location.search).get('status') || undefined}
                  />
                )}
                {activeTab === 'applications' && <ApplicationsPage applications={applications} candidates={candidates} jobs={jobs} companies={companies} onUpdateApplicationStatus={updateApplicationStatus} onRemoveApplication={removeApplication} onAddApplicationNote={addApplicationNote} onEditCandidate={openCandidateProfile} onViewJob={openJobCandidatesModal} onCreateApplication={createApplication} />}
                {activeTab === 'reports' && <ReportsPage candidates={candidates} jobs={jobs} applications={applications} statusMovements={statusMovements} />}
                {activeTab === 'help' && <HelpPage />}
                {activeTab === 'diagnostic' && <div className="p-6 overflow-y-auto h-full"><DiagnosticPage candidates={candidates} /></div>}
                {activeTab === 'settings' && <div className="p-0 h-full"><SettingsPage {...optionsProps} onOpenCsvModal={openCsvModal} activeSettingsTab={route.settingsTab} onSettingsTabChange={(tab) => { const params = new URLSearchParams(location.search); params.set('settingsTab', tab); navigate(`${location.pathname}?${params.toString()}`); setRoute(prev => ({ ...prev, settingsTab: tab })); }} onShowToast={showToast} userRoles={userRoles} currentUserRole={currentUserRole} onSetUserRole={setUserRole} onRemoveUserRole={removeUserRole} onCreateUserWithPassword={createUserWithPassword} currentUserEmail={effectiveUser?.email} currentUserName={effectiveUser?.displayName} currentUserPhoto={effectiveUser?.photoURL} activityLog={activityLog} candidateFields={CANDIDATE_FIELDS} /></div>}
              </div>
            </div>

            <FilterSidebar isOpen={isFilterSidebarOpen} onClose={() => setIsFilterSidebarOpen(false)} filters={filters} setFilters={setFilters} clearFilters={() => setFilters(initialFilters)} options={optionsProps} candidates={candidates} />

            {/* MODAIS GLOBAIS - CORRIGIDO PASSAGEM DE PROPS */}
            {isJobModalOpen && <JobModal isOpen={isJobModalOpen} job={editingJob} onClose={closeJobModal} onSave={d => handleSaveGeneric('jobs', d, closeJobModal)} options={optionsProps} isSaving={isSaving} candidates={candidates} />}
            {editingCandidate && <CandidateModal
              candidate={editingCandidate}
              onClose={() => setEditingCandidate(null)}
              onSave={d => handleSaveGeneric('candidates', d, () => setEditingCandidate(null))}
              options={optionsProps}
              isSaving={isSaving}
              statusMovements={statusMovements}
              interviews={interviews}
              onScheduleInterview={(candidate) => setInterviewModalData({ candidate })}
              allCandidates={candidates}
              applications={applications}
              onCreateApplication={createApplication}
              jobs={jobs}
              onAddNote={async (candidateId, noteText) => {
                // TODO: Migrar para Supabase
                console.log('Get candidate:', candidateId);
                const candidateDoc = candidates.find(c => c.id === candidateId);
                const existingNotes = candidateDoc?.notes || [];
                const newNote = {
                  text: noteText,
                  timestamp: new Date().toISOString(),
                  userEmail: effectiveUser?.email || 'unknown',
                  userName: effectiveUser?.displayName || effectiveUser?.email || 'Usuário'
                };
                // TODO: Migrar para Supabase
                console.log('Add candidate note:', { candidateRef, newNote, existingNotes });
                showToast('Nota adicionada', 'success');
              }}
              onAdvanceStage={async (candidate, newStage) => {
                const missingFields = computeMissingFields(candidate, newStage);
                const isConclusion = CLOSING_STATUSES.includes(newStage);
                if (isConclusion || missingFields.length > 0) {
                  setPendingTransition({ candidate, toStage: newStage, missingFields, isConclusion });
                } else {
                  const previousStatus = candidate.status || 'Inscrito';
                  // TODO: Migrar para Supabase
                  console.log('Advance stage:', { candidate, newStage, previousStatus });

                  showToast('Status atualizado', 'success');
                }
              }}
            />}

            {/* CORREÇÃO IMPORTANTE: Passando todas as props necessárias para o TransitionModal */}
            {pendingTransition && (
              <TransitionModal
                transition={pendingTransition}
                onClose={() => setPendingTransition(null)}
                onConfirm={async d => {
                  const payload = {
                    id: pendingTransition.candidate.id,
                    ...d,
                    status: pendingTransition.toStage,
                    updatedAt: new Date().toISOString()
                  };
                  if (pendingTransition.isConclusion) {
                    payload.closedAt = new Date().toISOString();
                  }
                  handleSaveGeneric('candidates', payload, () => setPendingTransition(null));
                }}
                cities={cities}
                interestAreas={interestAreas}
                schooling={schooling}
                marital={marital}
                origins={origins}
                jobs={jobs}
                applications={applications}
                onCreateApplication={createApplication}
              />
            )}

            <CsvImportModal
              isOpen={isCsvModalOpen}
              onClose={closeCsvModal}
              existingCandidates={candidates}
              onImportData={async (candidatesData, importMode) => {
                if (!supabase) {
                  showToast('Supabase não configurado. Configure as variáveis de ambiente.', 'error');
                  return;
                }
                setIsSaving(true);
                try {
                  const BATCH_SIZE = 100;
                  let imported = 0;
                  let skipped = 0;
                  let updated = 0;
                  let duplicated = 0;

                  // Helper: link Drive -> URL direta para exibição
                  const driveLinkToDirect = (url) => {
                    if (!url || typeof url !== 'string') return url;
                    const m = url.match(/drive\.google\.com\/open\?id=([^&\s]+)/i) || url.match(/drive\.google\.com\/file\/d\/([^/]+)/i);
                    return m ? `https://drive.google.com/uc?export=view&id=${m[1]}` : url;
                  };

                  const rows = candidatesData
                    .filter(c => c && c.email)
                    .map(c => {
                      const payload = candidateToSupabase(c);
                      delete payload.id;
                      payload.phone = payload.phone ?? '';
                      payload.origin = 'csv_import';
                      payload.created_by = effectiveUser?.email || 'Importação CSV';
                      payload.original_timestamp = c.original_timestamp || c.createdAt || null;
                      if (payload.photo_url) payload.photo_url = driveLinkToDirect(payload.photo_url);
                      payload.tags = Array.isArray(payload.tags) ? payload.tags : (payload.tags ? [payload.tags] : []);
                      return payload;
                    });

                  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
                    const chunk = rows.slice(i, i + BATCH_SIZE);
                    const { error } = await supabase.from('candidates').insert(chunk);
                    if (error) {
                      if (error.code === '23505') {
                        for (const row of chunk) {
                          const { error: oneErr } = await supabase.from('candidates').insert([row]);
                          if (oneErr && oneErr.code === '23505') {
                            duplicated++;
                          } else if (oneErr) {
                            skipped++;
                          } else {
                            imported++;
                          }
                        }
                      } else {
                        skipped += chunk.length;
                        console.error('Erro no lote CSV:', error.message);
                      }
                    } else {
                      imported += chunk.length;
                    }
                  }

                  await loadCandidates();

                  const totalAffected = imported + updated + duplicated;
                  if (totalAffected > 0) {
                    try {
                      await recordActionHistory({
                        action: 'importação_csv',
                        col: 'candidates',
                        recordsAffected: totalAffected,
                        details: {
                          imported,
                          updated,
                          duplicated,
                          skipped,
                          importMode,
                          totalProcessed: candidatesData.length
                        }
                      });
                    } catch (_) { /* histórico opcional */ }
                  }

                  const message = `Importação concluída! ${imported} novos, ${updated} atualizados, ${duplicated} duplicados, ${skipped} ignorados.`;
                  showToast(message, 'success');
                  closeCsvModal();
                } catch (error) {
                  console.error('Erro na importação:', error);
                  showToast(`Erro ao importar: ${error.message}`, 'error');
                } finally {
                  setIsSaving(false);
                }
              }}
            />
            <JobCandidatesModal
              isOpen={!!viewingJob}
              onClose={closeJobCandidatesModal}
              job={viewingJob}
              candidates={candidates}
              applications={applications}
              onCreateApplication={createApplication}
              onUpdateApplicationStatus={updateApplicationStatus}
              onRemoveApplication={removeApplication}
              onAddApplicationNote={addApplicationNote}
              onEditCandidate={openCandidateProfile}
            />
            <DashboardCandidatesModal
              isOpen={!!dashboardModalCandidates}
              onClose={() => {
                setDashboardModalCandidates(null);
                setDashboardModalTitle('');
              }}
              title={dashboardModalTitle || 'Candidatos do Dashboard'}
              candidates={dashboardModalCandidates || []}
              onViewProfile={openCandidateProfile}
              onViewPipeline={(candidate) => {
                setHighlightedCandidateId(candidate.id);
                setActiveTab('pipeline');
                // Scroll para o candidato destacado será feito no PipelineView
              }}
            />

            {/* Modal de Agendamento de Entrevista */}
            {interviewModalData && (
              <InterviewModal
                isOpen={true}
                onClose={() => setInterviewModalData(null)}
                onSchedule={scheduleInterview}
                candidate={interviewModalData.candidate}
                job={interviewModalData.job}
                application={interviewModalData.application}
              />
            )}

            {toast && (
              <div className={`fixed bottom-4 right-4 z-[70] px-4 py-3 rounded-lg shadow-lg border text-sm ${toast.type === 'success' ? 'bg-emerald-500/20 text-emerald-200 border-emerald-500/40' :
                toast.type === 'error' ? 'bg-red-500/20 text-red-200 border-red-500/40' :
                  'bg-slate-800 text-slate-200 border-slate-600'
                }`}>
                {toast.message}
              </div>
            )}
          </div>
        } />
      </Routes>
    </>
  );
}

// PipelineView moved to ./components/PipelineView

// --- BANCO DE TALENTOS (TABELA COMPLETA) ---


// --- PÁGINA ÚNICA GERENCIAR VAGAS (com abas: Vagas, Empresas, Cidades, Setores, Cargos, Níveis, Áreas) ---
const JOBS_PAGE_TAB_MAP = { jobs: 'vagas', companies: 'companies', cities: 'cities', sectors: 'sectors', positions: 'positions', job_levels: 'job_levels', activity_areas: 'activity_areas' };

// --- MASTER DATA MANAGER ---
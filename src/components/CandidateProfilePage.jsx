import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, User, Briefcase, Calendar, FileText, Mail, Phone, MapPin,
  Building2, GraduationCap, Award, ExternalLink, Edit3, Save, X,
  History, MessageSquare, Clock, UserPlus, Tag, Database, TrendingUp,
  CheckCircle, XCircle, AlertCircle, Clock as ClockIcon
} from 'lucide-react';
import { supabase } from '../supabase';
import { mapCandidateFromSupabase } from '../utils/candidateFromSupabase';
import { PIPELINE_STAGES, STATUS_COLORS, CLOSING_STATUSES, ALL_STATUSES } from '../constants';
import { normalizeCity, getMainCitiesOptions } from '../utils/cityNormalizer';
import { normalizeSource, getMainSourcesOptions } from '../utils/sourceNormalizer';
import { normalizeInterestArea, normalizeInterestAreasString, getMainInterestAreasOptions } from '../utils/interestAreaNormalizer';
import { formatChildrenForDisplay, CHILDREN_OPTIONS, normalizeChildrenForStorage } from '../utils/childrenNormalizer';

export default function CandidateProfilePage({ 
  candidates = [], 
  jobs = [], 
  companies = [], 
  applications = [], 
  interviews = [], 
  statusMovements = [],
  onUpdateCandidate,
  onCreateApplication,
  onScheduleInterview,
  onStatusChange
}) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [candidate, setCandidate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({});
  const [changeLog, setChangeLog] = useState([]);
  const [saving, setSaving] = useState(false);
  const [photoLoadError, setPhotoLoadError] = useState(false);

  const photoDisplayUrl = (url) => {
    if (!url || typeof url !== 'string') return null;
    const m = url.match(/drive\.google\.com\/open\?id=([^&\s]+)/i) || url.match(/drive\.google\.com\/file\/d\/([^/]+)/i);
    if (m) return `https://drive.google.com/uc?export=view&id=${m[1]}`;
    return url;
  };
  const initials = (name) => {
    if (!name || typeof name !== 'string') return '?';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return (parts[0][0] || '?').toUpperCase();
  };

  // Buscar candidato: primeiro na lista, depois por ID no Supabase
  useEffect(() => {
    if (!id) return;
    const foundInList = candidates.find(c => c.id === id);
    if (foundInList) {
      setCandidate(foundInList);
      setEditData(foundInList);
      setLoading(false);
      return;
    }
    (async () => {
      const { data, error } = await supabase.from('candidates').select('*').eq('id', id).maybeSingle();
      if (error) {
        console.warn('Erro ao buscar candidato:', error);
        setCandidate(null);
        setLoading(false);
        return;
      }
      const mapped = data ? mapCandidateFromSupabase(data) : null;
      setCandidate(mapped);
      if (mapped) setEditData(mapped);
      setLoading(false);
    })();
  }, [id, candidates]);

  useEffect(() => {
    setPhotoLoadError(false);
  }, [candidate?.id]);

  // Buscar log de alterações - TODO: Migrar para Supabase
  useEffect(() => {
    if (!id) return;
    // TODO: Carregar changeLog do Supabase
    setChangeLog([]);
  }, [id]);

  // Dados do candidato filtrados
  const candidateApplications = useMemo(() => {
    if (!candidate) return [];
    return applications.filter(a => a.candidateId === candidate.id);
  }, [candidate, applications]);

  const candidateInterviews = useMemo(() => {
    if (!candidate) return [];
    return interviews.filter(i => i.candidateId === candidate.id);
  }, [candidate, interviews]);

  const candidateMovements = useMemo(() => {
    if (!candidate) return [];
    return statusMovements.filter(m => m.candidateId === candidate.id);
  }, [candidate, statusMovements]);

  // Todos os envios deste email (múltiplos cadastros = múltiplas linhas)
  const submissionsByEmail = useMemo(() => {
    if (!candidate?.email) return [];
    const sameEmail = candidates.filter(c => c.email === candidate.email);
    const getTs = (c) => {
      const ot = c.original_timestamp;
      if (ot) return new Date(ot).getTime();
      const ca = c.createdAt;
      if (ca?.seconds) return ca.seconds * 1000;
      if (typeof ca === 'string') return new Date(ca).getTime();
      return 0;
    };
    return sameEmail.sort((a, b) => getTs(b) - getTs(a));
  }, [candidate?.email, candidates]);

  // Dados calculados para scorecards
  const scorecards = useMemo(() => {
    if (!candidate) return [];
    
    const completedInterviews = candidateInterviews.filter(i => 
      i.status === 'Realizada' || i.status === 'Confirmada'
    ).length;
    
    const activeApplications = candidateApplications.filter(a => 
      !CLOSING_STATUSES.includes(a.status)
    ).length;
    
    const getCadastroDate = (c) => {
      if (c.original_timestamp) return new Date(c.original_timestamp);
      if (c.createdAt?.seconds) return new Date(c.createdAt.seconds * 1000);
      if (c.createdAt?.toDate) return c.createdAt.toDate();
      if (c.createdAt) return new Date(c.createdAt);
      return null;
    };
    const created = getCadastroDate(candidate);
    const daysInPipeline = created ? Math.floor((Date.now() - created.getTime()) / (1000 * 60 * 60 * 24)) : 0;

    return [
      {
        title: 'Status Atual',
        value: candidate.status || 'Inscrito',
        icon: TrendingUp,
        color: STATUS_COLORS[candidate.status] || 'bg-slate-600',
        subtitle: PIPELINE_STAGES.includes(candidate.status) ? 'Em processo' : 'Finalizado'
      },
      {
        title: 'Candidaturas Ativas',
        value: activeApplications,
        icon: Briefcase,
        color: 'bg-blue-600',
        subtitle: `${candidateApplications.length} total`
      },
      {
        title: 'Entrevistas Realizadas',
        value: completedInterviews,
        icon: Calendar,
        color: 'bg-green-600',
        subtitle: `${candidateInterviews.length} agendadas`
      },
      {
        title: 'Dias no Pipeline',
        value: daysInPipeline,
        icon: ClockIcon,
        color: 'bg-purple-600',
        subtitle: 'Tempo desde o cadastro (envio do formulário)'
      }
    ];
  }, [candidate, applications, interviews, statusMovements]);

  // Formatar timestamp
  const formatTimestamp = (ts) => {
    if (!ts) return 'N/A';
    let date;
    if (ts.seconds || ts._seconds) {
      date = new Date((ts.seconds || ts._seconds) * 1000);
    } else if (ts.toDate) {
      date = ts.toDate();
    } else {
      date = new Date(ts);
    }
    return date.toLocaleString('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  // Formatar data apenas
  const formatDate = (ts) => {
    if (!ts) return 'N/A';
    let date;
    if (ts.seconds || ts._seconds) {
      date = new Date((ts.seconds || ts._seconds) * 1000);
    } else if (ts.toDate) {
      date = ts.toDate();
    } else {
      date = new Date(ts);
    }
    return date.toLocaleDateString('pt-BR');
  };

  // Registrar alteração no log - TODO: Migrar para Supabase
  const recordChange = async (field, oldValue, newValue, userId, userName) => {
    if (!id) return;
    // TODO: Migrar para Supabase
    console.log('Record change:', { field, oldValue, newValue, userId, userName });
  };

  // Salvar alterações
  const handleSave = async () => {
    if (!candidate || !id) return;
    
    setSaving(true);
    try {
      // TODO: Migrar para Supabase
      const changes = [];
      Object.keys(editData).forEach(key => {
        if (key === 'id' || key === 'createdAt' || key === 'updatedAt' || key === 'changeLog') return;
        const oldValue = candidate[key];
        const newValue = editData[key];
        if (oldValue !== newValue) {
          changes.push({ field: key, oldValue, newValue });
        }
      });

      console.log('Save candidate:', { id, editData, changes });

      // Registra cada alteração no log
      // TODO: Implementar registro de alterações quando migrar para Supabase
      // if (user && changes.length > 0) {
      //   for (const change of changes) {
      //     await recordChange(
      //       change.field,
      //       change.oldValue,
      //       change.newValue,
      //       user.email,
      //       user.displayName || user.email
      //     );
      //   }
      // }

      // Atualiza estado local
      setCandidate({ ...candidate, ...editData });
      setIsEditing(false);
      
      if (onUpdateCandidate) {
        onUpdateCandidate({ id, ...editData });
      }
    } catch (error) {
      console.error('Erro ao salvar:', error);
      alert('Erro ao salvar alterações: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  // Handler para mudanças nos campos
  const handleFieldChange = (field, value) => {
    // Normaliza campos específicos
    let normalizedValue = value;
    if (field === 'city' && value) {
      normalizedValue = normalizeCity(value);
    } else if (field === 'source' && value) {
      normalizedValue = normalizeSource(value);
    } else if (field === 'interestAreas' && value) {
      normalizedValue = normalizeInterestAreasString(value);
    }
    
    setEditData(prev => ({ ...prev, [field]: normalizedValue }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-white dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Carregando candidato...</p>
        </div>
      </div>
    );
  }

  if (!candidate && !loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white dark:bg-gray-900 p-4">
        <div className="text-center max-w-md">
          <AlertCircle className="h-12 w-12 text-red-500 dark:text-red-400 mx-auto mb-4" />
          <p className="text-gray-700 dark:text-gray-300 font-medium mb-2">Candidato não encontrado</p>
          <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">O perfil solicitado não existe ou você não tem acesso.</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 font-medium"
          >
            Voltar ao início
          </button>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Visão Geral', icon: User },
    { id: 'personal', label: 'Dados Pessoais', icon: User },
    { id: 'professional', label: 'Profissional', icon: Briefcase },
    { id: 'process', label: 'Processo', icon: FileText },
    { id: 'history', label: 'Histórico', icon: History },
    { id: 'metadata', label: 'Metadados', icon: Database }
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate(-1)}
                className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <ArrowLeft size={20} />
              </button>
              <div className="w-14 h-14 rounded-full bg-gray-200 dark:bg-gray-700 flex-shrink-0 overflow-hidden flex items-center justify-center text-lg font-bold text-gray-600 dark:text-gray-300">
                {candidate.photoUrl && !photoLoadError ? (
                  <img
                    src={photoDisplayUrl(candidate.photoUrl) || candidate.photoUrl}
                    alt={candidate.fullName}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                    onError={() => setPhotoLoadError(true)}
                  />
                ) : (
                  <span>{initials(candidate.fullName)}</span>
                )}
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                  {candidate.fullName || 'Candidato sem nome'}
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {candidate.email || 'Sem e-mail'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {isEditing ? (
                <>
                  <button
                    onClick={() => {
                      setEditData(candidate);
                      setIsEditing(false);
                    }}
                    className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white rounded-lg"
                  >
                    <X size={18} className="inline mr-2" />
                    Cancelar
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                  >
                    <Save size={18} />
                    {saving ? 'Salvando...' : 'Salvar'}
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                >
                  <Edit3 size={18} />
                  Editar
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-1 overflow-x-auto">
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 ${
                    activeTab === tab.id
                      ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300'
                  }`}
                >
                  <Icon size={16} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Scorecards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {scorecards.map((card, idx) => {
                const Icon = card.icon;
                return (
                  <div
                    key={idx}
                    className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className={`p-3 rounded-lg ${card.color} text-white`}>
                        <Icon size={24} />
                      </div>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${card.color} text-white`}>
                        {card.subtitle}
                      </span>
                    </div>
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                      {card.title}
                    </h3>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {card.value}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Informações Principais */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Dados de Contato */}
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Mail size={20} />
                  Contato
                </h2>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Mail size={16} className="text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">E-mail Principal</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {candidate.email || 'Não informado'}
                      </p>
                    </div>
                  </div>
                  {candidate.emailSecondary && (
                    <div className="flex items-center gap-3">
                      <Mail size={16} className="text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">E-mail Secundário</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {candidate.emailSecondary}
                        </p>
                      </div>
                    </div>
                  )}
                  {candidate.phone && (
                    <div className="flex items-center gap-3">
                      <Phone size={16} className="text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Telefone</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {candidate.phone}
                        </p>
                      </div>
                    </div>
                  )}
                  {candidate.city && (
                    <div className="flex items-center gap-3">
                      <MapPin size={16} className="text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Cidade</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {candidate.city}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Status e Processo */}
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <TrendingUp size={20} />
                  Status do Processo
                </h2>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Status Atual</p>
                    {isEditing ? (
                      <select
                        value={editData.status || candidate.status || 'Inscrito'}
                        onChange={(e) => {
                          const newStatus = e.target.value;
                          handleFieldChange('status', newStatus);
                          if (onStatusChange && newStatus !== (candidate.status || 'Inscrito')) {
                            if (!window.confirm(`Tem certeza que deseja alterar a etapa de ${candidate.fullName || 'este candidato'} para "${newStatus}"?`)) return;
                            onStatusChange(candidate.id, newStatus);
                          }
                        }}
                        className={`px-3 py-2 rounded-lg text-sm font-medium border-2 transition-colors cursor-pointer ${
                          STATUS_COLORS[editData.status || candidate.status] || 'bg-slate-600 text-white border-slate-600'
                        } hover:opacity-80`}
                      >
                        {ALL_STATUSES.map(status => (
                          <option key={status} value={status} className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
                            {status}
                          </option>
                        ))}
                      </select>
                    ) : onStatusChange ? (
                      <select
                        value={candidate.status || 'Inscrito'}
                        onChange={async (e) => {
                          const newStatus = e.target.value;
                          if (newStatus === candidate.status) return;
                          if (!window.confirm(`Tem certeza que deseja alterar a etapa de ${candidate.fullName || 'este candidato'} para "${newStatus}"?`)) return;

                          // Validações similares ao handleDragEnd
                          const PIPELINE_STAGES = ['Inscrito', 'Considerado', 'Entrevista', 'Seleção', 'Selecionado', 'Contratado', 'Reprovado', 'Desistência'];
                          const CLOSING_STATUSES = ['Contratado', 'Reprovado', 'Desistência'];
                          const stagesRequiringApplication = PIPELINE_STAGES.slice(PIPELINE_STAGES.indexOf('Considerado'));

                          // Verificar se precisa de candidatura
                          if (stagesRequiringApplication.includes(newStatus)) {
                            if (candidateApplications.length === 0) {
                              alert('É necessário vincular o candidato a uma vaga antes de avançar para esta etapa. Use a seção "Candidaturas" para vincular a uma vaga.');
                              return;
                            }
                          }

                          await onStatusChange(candidate.id, newStatus);
                        }}
                        className={`px-3 py-2 rounded-lg text-sm font-medium border-2 transition-colors cursor-pointer ${
                          STATUS_COLORS[candidate.status] || 'bg-slate-600 text-white border-slate-600'
                        } hover:opacity-80`}
                      >
                        {ALL_STATUSES.map(status => (
                          <option key={status} value={status} className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
                            {status}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span className={`inline-block px-3 py-1 rounded text-sm font-medium ${
                        STATUS_COLORS[candidate.status] || 'bg-slate-600 text-white'
                      }`}>
                        {candidate.status || 'Inscrito'}
                      </span>
                    )}
                  </div>
                  {candidate.source && (
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Origem</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {candidate.source}
                      </p>
                    </div>
                  )}
                  {candidate.interestAreas && (
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Área de Interesse</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {candidate.interestAreas}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'personal' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
              <User size={20} />
              Dados Pessoais
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nome Completo
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editData.fullName || ''}
                    onChange={(e) => handleFieldChange('fullName', e.target.value)}
                    className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-gray-900 dark:text-white"
                  />
                ) : (
                  <p className="text-gray-900 dark:text-white">{candidate.fullName || 'Não informado'}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                  <Mail size={16} />
                  E-mail Principal
                </label>
                {isEditing ? (
                  <input
                    type="email"
                    value={editData.email || ''}
                    onChange={(e) => handleFieldChange('email', e.target.value)}
                    className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-gray-900 dark:text-white"
                  />
                ) : (
                  <p className="text-gray-900 dark:text-white">{candidate.email || 'Não informado'}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                  <Mail size={16} />
                  E-mail Secundário
                </label>
                {isEditing ? (
                  <input
                    type="email"
                    value={editData.emailSecondary || ''}
                    onChange={(e) => handleFieldChange('emailSecondary', e.target.value)}
                    className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-gray-900 dark:text-white"
                  />
                ) : (
                  <p className="text-gray-900 dark:text-white">{candidate.emailSecondary || 'Não informado'}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                  <Phone size={16} />
                  Telefone
                </label>
                {isEditing ? (
                  <input
                    type="tel"
                    value={editData.phone || ''}
                    onChange={(e) => handleFieldChange('phone', e.target.value)}
                    className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-gray-900 dark:text-white"
                  />
                ) : (
                  <p className="text-gray-900 dark:text-white">{candidate.phone || 'Não informado'}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                  <MapPin size={16} />
                  Cidade
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editData.city || ''}
                    onChange={(e) => handleFieldChange('city', e.target.value)}
                    className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-gray-900 dark:text-white"
                  />
                ) : (
                  <p className="text-gray-900 dark:text-white">{candidate.city || 'Não informado'}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Estado Civil
                </label>
                {isEditing ? (
                  <select
                    value={editData.maritalStatus || ''}
                    onChange={(e) => handleFieldChange('maritalStatus', e.target.value)}
                    className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-gray-900 dark:text-white"
                  >
                    <option value="">Selecione</option>
                    <option value="Solteiro(a)">Solteiro(a)</option>
                    <option value="Casado(a)">Casado(a)</option>
                    <option value="Divorciado(a)">Divorciado(a)</option>
                    <option value="Viúvo(a)">Viúvo(a)</option>
                    <option value="União Estável">União Estável</option>
                    <option value="Namorando">Namorando</option>
                  </select>
                ) : (
                  <p className="text-gray-900 dark:text-white">{candidate.maritalStatus || 'Não informado'}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Número de Filhos
                </label>
                {isEditing ? (
                  <select
                    value={editData.childrenCount != null && editData.childrenCount !== '' ? normalizeChildrenForStorage(editData.childrenCount) : ''}
                    onChange={(e) => handleFieldChange('childrenCount', e.target.value === '' ? '' : normalizeChildrenForStorage(e.target.value))}
                    className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-gray-900 dark:text-white"
                  >
                    <option value="">Selecione</option>
                    {CHILDREN_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                  </select>
                ) : (
                  <p className="text-gray-900 dark:text-white">{formatChildrenForDisplay(candidate.childrenCount) || 'Não informado'}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Data de Nascimento
                </label>
                {isEditing ? (
                  <input
                    type="date"
                    value={editData.birthDate || ''}
                    onChange={(e) => handleFieldChange('birthDate', e.target.value)}
                    className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-gray-900 dark:text-white"
                  />
                ) : (
                  <p className="text-gray-900 dark:text-white">{candidate.birthDate ? formatDate(candidate.birthDate) : 'Não informado'}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Idade
                </label>
                {isEditing ? (
                  <input
                    type="number"
                    value={editData.age || ''}
                    onChange={(e) => handleFieldChange('age', e.target.value ? parseInt(e.target.value) : null)}
                    className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-gray-900 dark:text-white"
                    min="0"
                    max="120"
                  />
                ) : (
                  <p className="text-gray-900 dark:text-white">{candidate.age ? `${candidate.age} anos` : 'Não informado'}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Foto (URL)
                </label>
                {isEditing ? (
                  <input
                    type="url"
                    value={editData.photoUrl || ''}
                    onChange={(e) => handleFieldChange('photoUrl', e.target.value)}
                    className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-gray-900 dark:text-white"
                  />
                ) : (
                  candidate.photoUrl ? (
                    <img src={photoDisplayUrl(candidate.photoUrl) || candidate.photoUrl} alt={candidate.fullName} className="w-24 h-24 rounded-lg object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <p className="text-gray-500 dark:text-gray-400">Sem foto</p>
                  )
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'professional' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
              <Briefcase size={20} />
              Dados Profissionais
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                  <Award size={16} />
                  Áreas de Interesse Profissional
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editData.interestAreas || ''}
                    onChange={(e) => handleFieldChange('interestAreas', e.target.value)}
                    className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-gray-900 dark:text-white"
                    placeholder="Ex: Administração, Vendas, Marketing"
                  />
                ) : (
                  <p className="text-gray-900 dark:text-white">{candidate.interestAreas || 'Não informado'}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                  <GraduationCap size={16} />
                  Nível de Escolaridade
                </label>
                {isEditing ? (
                  <select
                    value={editData.schoolingLevel || ''}
                    onChange={(e) => handleFieldChange('schoolingLevel', e.target.value)}
                    className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-gray-900 dark:text-white"
                  >
                    <option value="">Selecione</option>
                    <option value="Ensino Fundamental">Ensino Fundamental</option>
                    <option value="Ensino Médio">Ensino Médio</option>
                    <option value="Técnico">Técnico</option>
                    <option value="Superior Incompleto">Superior Incompleto</option>
                    <option value="Superior Completo">Superior Completo</option>
                    <option value="Pós-graduação">Pós-graduação</option>
                    <option value="Mestrado">Mestrado</option>
                    <option value="Doutorado">Doutorado</option>
                  </select>
                ) : (
                  <p className="text-gray-900 dark:text-white">{candidate.schoolingLevel || 'Não informado'}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Formação
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editData.education || ''}
                    onChange={(e) => handleFieldChange('education', e.target.value)}
                    className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-gray-900 dark:text-white"
                  />
                ) : (
                  <p className="text-gray-900 dark:text-white">{candidate.education || 'Não informado'}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Instituição de Ensino
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editData.institution || ''}
                    onChange={(e) => handleFieldChange('institution', e.target.value)}
                    className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-gray-900 dark:text-white"
                  />
                ) : (
                  <p className="text-gray-900 dark:text-white">{candidate.institution || 'Não informado'}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Data de Formatura
                </label>
                {isEditing ? (
                  <input
                    type="date"
                    value={editData.graduationDate || ''}
                    onChange={(e) => handleFieldChange('graduationDate', e.target.value)}
                    className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-gray-900 dark:text-white"
                  />
                ) : (
                  <p className="text-gray-900 dark:text-white">{candidate.graduationDate ? formatDate(candidate.graduationDate) : 'Não informado'}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Cursando Atualmente
                </label>
                {isEditing ? (
                  <select
                    value={editData.isStudying ? 'Sim' : 'Não'}
                    onChange={(e) => handleFieldChange('isStudying', e.target.value === 'Sim')}
                    className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-gray-900 dark:text-white"
                  >
                    <option value="Não">Não</option>
                    <option value="Sim">Sim</option>
                  </select>
                ) : (
                  <p className={`font-medium ${candidate.isStudying ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>{candidate.isStudying ? 'Sim' : 'Não'}</p>
                )}
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Experiências Anteriores
                </label>
                {isEditing ? (
                  <textarea
                    value={editData.experience || ''}
                    onChange={(e) => handleFieldChange('experience', e.target.value)}
                    rows={4}
                    className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-gray-900 dark:text-white"
                  />
                ) : (
                  <p className="text-gray-900 dark:text-white whitespace-pre-wrap">{candidate.experience || 'Não informado'}</p>
                )}
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Cursos e Certificações
                </label>
                {isEditing ? (
                  <textarea
                    value={editData.courses || ''}
                    onChange={(e) => handleFieldChange('courses', e.target.value)}
                    rows={4}
                    className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-gray-900 dark:text-white"
                  />
                ) : (
                  <p className="text-gray-900 dark:text-white whitespace-pre-wrap">{candidate.courses || 'Não informado'}</p>
                )}
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Certificações Adicionais
                </label>
                {isEditing ? (
                  <textarea
                    value={editData.certifications || ''}
                    onChange={(e) => handleFieldChange('certifications', e.target.value)}
                    rows={3}
                    className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-gray-900 dark:text-white"
                    placeholder="Liste certificações adicionais"
                  />
                ) : (
                  <p className="text-gray-900 dark:text-white whitespace-pre-wrap">{candidate.certifications || 'Não informado'}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Pretensão Salarial
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editData.salaryExpectation || ''}
                    onChange={(e) => handleFieldChange('salaryExpectation', e.target.value)}
                    className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-gray-900 dark:text-white"
                    placeholder="Ex: R$ 3.000,00"
                  />
                ) : (
                  <p className="text-gray-900 dark:text-white">{candidate.salaryExpectation || 'Não informado'}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Pode se Relocar
                </label>
                {isEditing ? (
                  <select
                    value={editData.canRelocate || ''}
                    onChange={(e) => handleFieldChange('canRelocate', e.target.value)}
                    className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-gray-900 dark:text-white"
                  >
                    <option value="">Selecione</option>
                    <option value="Sim">Sim</option>
                    <option value="Não">Não</option>
                  </select>
                ) : (
                  <p className={`font-medium ${candidate.canRelocate === 'Sim' ? 'text-green-600 dark:text-green-400' : candidate.canRelocate === 'Não' ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'}`}>{candidate.canRelocate || 'Não informado'}</p>
                )}
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Referências Profissionais
                </label>
                {isEditing ? (
                  <textarea
                    value={editData.professionalReferences || ''}
                    onChange={(e) => handleFieldChange('professionalReferences', e.target.value)}
                    rows={4}
                    className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-gray-900 dark:text-white"
                    placeholder="Nome, empresa, telefone, e-mail"
                  />
                ) : (
                  <p className="text-gray-900 dark:text-white whitespace-pre-wrap">{candidate.professionalReferences || 'Não informado'}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tipo de Aplicação
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editData.typeOfApp || ''}
                    onChange={(e) => handleFieldChange('typeOfApp', e.target.value)}
                    className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-gray-900 dark:text-white"
                  />
                ) : (
                  <p className="text-gray-900 dark:text-white">{candidate.typeOfApp || 'Não informado'}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Indicação
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editData.referral || ''}
                    onChange={(e) => handleFieldChange('referral', e.target.value)}
                    className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-gray-900 dark:text-white"
                    placeholder="Nome de quem indicou"
                  />
                ) : (
                  <p className="text-gray-900 dark:text-white">{candidate.referral || 'Não informado'}</p>
                )}
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Campo Livre
                </label>
                {isEditing ? (
                  <textarea
                    value={editData.freeField || ''}
                    onChange={(e) => handleFieldChange('freeField', e.target.value)}
                    rows={3}
                    className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-gray-900 dark:text-white"
                    placeholder="Informações adicionais"
                  />
                ) : (
                  <p className="text-gray-900 dark:text-white whitespace-pre-wrap">{candidate.freeField || 'Não informado'}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Possui CNH Tipo B
                </label>
                {isEditing ? (
                  <select
                    value={editData.hasLicense || ''}
                    onChange={(e) => handleFieldChange('hasLicense', e.target.value)}
                    className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-gray-900 dark:text-white"
                  >
                    <option value="">Selecione</option>
                    <option value="Sim">Sim</option>
                    <option value="Não">Não</option>
                  </select>
                ) : (
                  <p className={`font-medium ${candidate.hasLicense === 'Sim' ? 'text-green-600 dark:text-green-400' : candidate.hasLicense === 'Não' ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'}`}>{candidate.hasLicense || 'Não informado'}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Currículo (URL)
                </label>
                {isEditing ? (
                  <input
                    type="url"
                    value={editData.cvUrl || ''}
                    onChange={(e) => handleFieldChange('cvUrl', e.target.value)}
                    className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-gray-900 dark:text-white"
                  />
                ) : (
                  candidate.cvUrl ? (
                    <a href={candidate.cvUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-2">
                      Ver Currículo <ExternalLink size={14} />
                    </a>
                  ) : (
                    <p className="text-gray-500 dark:text-gray-400">Não informado</p>
                  )
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Portfólio (URL)
                </label>
                {isEditing ? (
                  <input
                    type="url"
                    value={editData.portfolioUrl || ''}
                    onChange={(e) => handleFieldChange('portfolioUrl', e.target.value)}
                    className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-gray-900 dark:text-white"
                  />
                ) : (
                  candidate.portfolioUrl ? (
                    <a href={candidate.portfolioUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-2">
                      Ver Portfólio <ExternalLink size={14} />
                    </a>
                  ) : (
                    <p className="text-gray-500 dark:text-gray-400">Não informado</p>
                  )
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'process' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
              <FileText size={20} />
              Status do Processo
            </h2>
            
            {/* Status Atual */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Status Atual
              </label>
              <span className={`inline-block px-4 py-2 rounded-lg text-sm font-medium ${
                STATUS_COLORS[candidate.status] || 'bg-slate-600 text-white'
              }`}>
                {candidate.status || 'Inscrito'}
              </span>
            </div>

            {/* Candidaturas */}
            <div className="mb-6">
              <h3 className="text-md font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <Briefcase size={18} />
                Candidaturas ({candidateApplications.length})
              </h3>
              {candidateApplications.length > 0 ? (
                <div className="space-y-3">
                  {candidateApplications.map((app) => {
                    const job = jobs.find(j => j.id === app.jobId);
                    return (
                      <div key={app.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">{job?.title || 'Vaga não encontrada'}</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{job?.company || 'Empresa não informada'}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                              Criada em: {formatTimestamp(app.createdAt)}
                            </p>
                          </div>
                          <span className={`px-3 py-1 rounded text-xs font-medium ${
                            STATUS_COLORS[app.status] || 'bg-slate-600 text-white'
                          }`}>
                            {app.status || 'Inscrito'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400">Nenhuma candidatura vinculada</p>
              )}
            </div>

            {/* Entrevistas */}
            <div className="mb-6">
              <h3 className="text-md font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <Calendar size={18} />
                Entrevistas ({candidateInterviews.length})
              </h3>
              {candidateInterviews.length > 0 ? (
                <div className="space-y-3">
                  {candidateInterviews.map((interview) => {
                    const job = jobs.find(j => j.id === interview.jobId);
                    return (
                      <div key={interview.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {interview.date} às {interview.time}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{job?.title || 'Vaga não encontrada'}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                              Status: {interview.status || 'Agendada'}
                            </p>
                          </div>
                          <span className={`px-3 py-1 rounded text-xs font-medium ${
                            interview.status === 'Realizada' ? 'bg-green-600 text-white' :
                            interview.status === 'Cancelada' ? 'bg-red-600 text-white' :
                            'bg-blue-600 text-white'
                          }`}>
                            {interview.status || 'Agendada'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400">Nenhuma entrevista agendada</p>
              )}
            </div>

            {/* Histórico de Movimentações */}
            <div>
              <h3 className="text-md font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <History size={18} />
                Log de Movimentações no Funil ({candidateMovements.length})
              </h3>
              {candidateMovements.length > 0 ? (
                <div className="relative">
                  {/* Timeline vertical */}
                  <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-300 dark:bg-gray-600"></div>
                  
                  <div className="space-y-4">
                    {candidateMovements
                      .sort((a, b) => {
                        const tsA = a.timestamp?.seconds || a.timestamp?._seconds || (a.timestamp ? new Date(a.timestamp).getTime() / 1000 : 0);
                        const tsB = b.timestamp?.seconds || b.timestamp?._seconds || (b.timestamp ? new Date(b.timestamp).getTime() / 1000 : 0);
                        return tsB - tsA; // Mais recente primeiro
                      })
                      .map((movement, idx) => {
                        const isContratado = movement.newStatus === 'Contratado';
                        const isReprovado = movement.newStatus === 'Reprovado';
                        const isDesistencia = movement.newStatus === 'Desistência';
                        const isProgresso = PIPELINE_STAGES.includes(movement.newStatus) && 
                                          PIPELINE_STAGES.indexOf(movement.newStatus) > 
                                          (movement.previousStatus ? PIPELINE_STAGES.indexOf(movement.previousStatus) : -1);
                        const isRegresso = PIPELINE_STAGES.includes(movement.newStatus) && 
                                          PIPELINE_STAGES.indexOf(movement.newStatus) < 
                                          (movement.previousStatus ? PIPELINE_STAGES.indexOf(movement.previousStatus) : 999);
                        
                        let iconColor = 'bg-blue-500';
                        let borderColor = 'border-blue-500';
                        let bgColor = 'bg-blue-50 dark:bg-blue-900/20';
                        
                        if (isContratado) {
                          iconColor = 'bg-green-500';
                          borderColor = 'border-green-500';
                          bgColor = 'bg-green-50 dark:bg-green-900/20';
                        } else if (isReprovado || isDesistencia) {
                          iconColor = 'bg-red-500';
                          borderColor = 'border-red-500';
                          bgColor = 'bg-red-50 dark:bg-red-900/20';
                        } else if (isProgresso) {
                          iconColor = 'bg-green-500';
                          borderColor = 'border-green-500';
                          bgColor = 'bg-green-50 dark:bg-green-900/20';
                        } else if (isRegresso) {
                          iconColor = 'bg-yellow-500';
                          borderColor = 'border-yellow-500';
                          bgColor = 'bg-yellow-50 dark:bg-yellow-900/20';
                        }
                        
                        return (
                          <div key={movement.id || idx} className="relative pl-12">
                            {/* Ícone na timeline */}
                            <div className={`absolute left-0 top-1 w-8 h-8 rounded-full ${iconColor} border-4 border-white dark:border-gray-800 flex items-center justify-center z-10`}>
                              {isContratado ? (
                                <CheckCircle size={16} className="text-white" />
                              ) : isReprovado || isDesistencia ? (
                                <XCircle size={16} className="text-white" />
                              ) : isProgresso ? (
                                <TrendingUp size={16} className="text-white" />
                              ) : (
                                <ClockIcon size={16} className="text-white" />
                              )}
                            </div>
                            
                            {/* Card da movimentação */}
                            <div className={`${bgColor} border-l-4 ${borderColor} rounded-lg p-4 shadow-sm`}>
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    <span className={`px-2 py-1 rounded text-xs font-medium ${STATUS_COLORS[movement.previousStatus] || 'bg-gray-500'} text-white`}>
                                      {movement.previousStatus || 'Inscrito'}
                                    </span>
                                    <span className="text-gray-400 dark:text-gray-500">→</span>
                                    <span className={`px-2 py-1 rounded text-xs font-medium ${STATUS_COLORS[movement.newStatus] || 'bg-gray-500'} text-white`}>
                                      {movement.newStatus}
                                    </span>
                                  </div>
                                  
                                  {isContratado && (
                                    <p className="text-sm font-semibold text-green-700 dark:text-green-400 mb-1">
                                      ✓ Candidato Contratado
                                    </p>
                                  )}
                                  {isReprovado && (
                                    <p className="text-sm font-semibold text-red-700 dark:text-red-400 mb-1">
                                      ✗ Candidato Reprovado
                                    </p>
                                  )}
                                  {isDesistencia && (
                                    <p className="text-sm font-semibold text-orange-700 dark:text-orange-400 mb-1">
                                      ⚠ Candidato Desistiu
                                    </p>
                                  )}
                                  {isProgresso && !isContratado && (
                                    <p className="text-sm font-semibold text-green-700 dark:text-green-400 mb-1">
                                      ↑ Progresso no Funil
                                    </p>
                                  )}
                                  {isRegresso && (
                                    <p className="text-sm font-semibold text-yellow-700 dark:text-yellow-400 mb-1">
                                      ↓ Regresso no Funil
                                    </p>
                                  )}
                                  
                                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                                    <ClockIcon size={12} className="inline mr-1" />
                                    {formatTimestamp(movement.timestamp)}
                                  </p>
                                  
                                  {movement.userId && (
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                      Alterado por: {movement.userName || movement.userId}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg">
                  <History size={48} className="mx-auto text-gray-400 dark:text-gray-500 mb-3" />
                  <p className="text-gray-500 dark:text-gray-400">Nenhuma movimentação registrada ainda</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">As mudanças de status no funil aparecerão aqui</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'metadata' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Metadados</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                  <UserPlus size={16} />
                  Criado Por
                </label>
                <p className="text-gray-900 dark:text-white">
                  {candidate.createdBy || 'Sistema'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                  <Clock size={16} />
                  Data de cadastro (envio do formulário)
                </label>
                <p className="text-gray-900 dark:text-white">
                  {formatTimestamp(candidate.original_timestamp || candidate.createdAt)}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                  <Database size={16} />
                  Data de importação no sistema
                </label>
                <p className="text-gray-500 dark:text-gray-400 text-sm">
                  {formatTimestamp(candidate.createdAt)}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                  <Database size={16} />
                  Origem do Cadastro
                </label>
                <p className="text-gray-900 dark:text-white">
                  {candidate.origin || candidate.imported ? 'Importado' : candidate.createdBy ? 'Manual' : 'Automação'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                  <Tag size={16} />
                  Tags
                </label>
                <div className="flex flex-wrap gap-2">
                  {candidate.tags && candidate.tags.length > 0 ? (
                    candidate.tags.map((tag, idx) => (
                      <span key={idx} className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded text-sm">
                        {tag}
                      </span>
                    ))
                  ) : (
                    <p className="text-gray-500 dark:text-gray-400">Nenhuma tag</p>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                  <Clock size={16} />
                  Última Atualização
                </label>
                <p className="text-gray-900 dark:text-white">
                  {formatTimestamp(candidate.updatedAt || candidate.createdAt)}
                </p>
                {candidate.updatedBy && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Por: {candidate.updatedBy}
                  </p>
                )}
              </div>
              <div className="col-span-full mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                  <History size={16} />
                  Envios do formulário ({submissionsByEmail.length} {submissionsByEmail.length === 1 ? 'envio' : 'envios'} com este e-mail)
                </label>
                <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                  {submissionsByEmail.map((sub, idx) => (
                    <li key={sub.id}>
                      {idx === 0 ? '(perfil atual) ' : ''}
                      {formatTimestamp(sub.original_timestamp || sub.createdAt)}
                      {sub.origin && ` · ${sub.origin}`}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
              <History size={20} />
              Histórico de Alterações
            </h2>
            {changeLog.length > 0 ? (
              <div className="space-y-4">
                {changeLog.map((log, idx) => (
                  <div key={log.id || idx} className="border-l-4 border-blue-500 pl-4 py-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          Campo <span className="font-bold">{log.field}</span> alterado
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          De: <span className="font-mono">{log.oldValue || '(vazio)'}</span> → Para: <span className="font-mono">{log.newValue || '(vazio)'}</span>
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {formatTimestamp(log.timestamp)}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {log.userName || log.userId}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                Nenhuma alteração registrada ainda
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

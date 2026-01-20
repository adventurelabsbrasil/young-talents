import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, User, Briefcase, Calendar, FileText, Mail, Phone, MapPin,
  Building2, GraduationCap, Award, ExternalLink, Edit3, Save, X,
  History, MessageSquare, Clock, UserPlus, Tag, Database, TrendingUp,
  CheckCircle, XCircle, AlertCircle, Clock as ClockIcon
} from 'lucide-react';
import { auth, db } from '../firebase';
import { 
  doc, getDoc, updateDoc, collection, query, where, orderBy, onSnapshot,
  serverTimestamp, addDoc
} from 'firebase/firestore';
import { PIPELINE_STAGES, STATUS_COLORS, CLOSING_STATUSES } from '../constants';
import { normalizeCity, getMainCitiesOptions } from '../utils/cityNormalizer';
import { normalizeSource, getMainSourcesOptions } from '../utils/sourceNormalizer';
import { normalizeInterestArea, normalizeInterestAreasString, getMainInterestAreasOptions } from '../utils/interestAreaNormalizer';

export default function CandidateProfilePage({ 
  candidates = [], 
  jobs = [], 
  companies = [], 
  applications = [], 
  interviews = [], 
  statusMovements = [],
  onUpdateCandidate,
  onCreateApplication,
  onScheduleInterview
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

  // Buscar candidato
  useEffect(() => {
    if (!id) return;
    
    // Primeiro tenta buscar da lista de candidatos (mais rápido)
    const foundCandidate = candidates.find(c => c.id === id);
    if (foundCandidate) {
      setCandidate(foundCandidate);
      setEditData(foundCandidate);
      setLoading(false);
    } else {
      // Se não encontrar, busca direto do Firestore
      const candidateRef = doc(db, 'candidates', id);
      getDoc(candidateRef).then(docSnap => {
        if (docSnap.exists()) {
          setCandidate({ id: docSnap.id, ...docSnap.data() });
          setEditData({ id: docSnap.id, ...docSnap.data() });
        }
        setLoading(false);
      }).catch(err => {
        console.error('Erro ao buscar candidato:', err);
        setLoading(false);
      });
    }
  }, [id, candidates]);

  // Buscar log de alterações
  useEffect(() => {
    if (!id) return;
    
    const q = query(
      collection(db, 'candidateChangeLog'),
      where('candidateId', '==', id),
      orderBy('timestamp', 'desc')
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const logs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setChangeLog(logs);
    }, (error) => {
      console.error('Erro ao buscar log de alterações:', error);
    });

    return () => unsubscribe();
  }, [id]);

  // Dados calculados para scorecards
  const scorecards = useMemo(() => {
    if (!candidate) return [];
    
    const candidateApplications = applications.filter(a => a.candidateId === candidate.id);
    const candidateInterviews = interviews.filter(i => i.candidateId === candidate.id);
    const candidateMovements = statusMovements.filter(m => m.candidateId === candidate.id);
    
    const completedInterviews = candidateInterviews.filter(i => 
      i.status === 'Realizada' || i.status === 'Confirmada'
    ).length;
    
    const activeApplications = candidateApplications.filter(a => 
      !CLOSING_STATUSES.includes(a.status)
    ).length;
    
    const daysInPipeline = candidate.createdAt ? (() => {
      const created = candidate.createdAt?.seconds 
        ? new Date(candidate.createdAt.seconds * 1000)
        : candidate.createdAt?.toDate 
        ? candidate.createdAt.toDate()
        : new Date(candidate.createdAt);
      const now = new Date();
      return Math.floor((now - created) / (1000 * 60 * 60 * 24));
    })() : 0;

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
        subtitle: 'Tempo desde criação'
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

  // Registrar alteração no log
  const recordChange = async (field, oldValue, newValue, userId, userName) => {
    if (!id) return;
    
    try {
      await addDoc(collection(db, 'candidateChangeLog'), {
        candidateId: id,
        candidateName: candidate?.fullName || 'Candidato',
        field,
        oldValue: String(oldValue || ''),
        newValue: String(newValue || ''),
        userId,
        userName,
        timestamp: serverTimestamp(),
        createdAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Erro ao registrar alteração:', error);
    }
  };

  // Salvar alterações
  const handleSave = async () => {
    if (!candidate || !id) return;
    
    setSaving(true);
    try {
      const candidateRef = doc(db, 'candidates', id);
      const user = auth.currentUser;
      
      // Compara valores antigos e novos para registrar no log
      const changes = [];
      Object.keys(editData).forEach(key => {
        if (key === 'id' || key === 'createdAt' || key === 'updatedAt' || key === 'changeLog') return;
        const oldValue = candidate[key];
        const newValue = editData[key];
        if (oldValue !== newValue) {
          changes.push({ field: key, oldValue, newValue });
        }
      });

      // Atualiza documento
      const updateData = {
        ...editData,
        updatedAt: serverTimestamp(),
        updatedBy: user?.email || 'unknown'
      };
      
      // Remove campos que não devem ser atualizados diretamente
      delete updateData.id;
      delete updateData.createdAt;
      delete updateData.changeLog;

      await updateDoc(candidateRef, updateData);

      // Registra cada alteração no log
      if (user && changes.length > 0) {
        for (const change of changes) {
          await recordChange(
            change.field,
            change.oldValue,
            change.newValue,
            user.email,
            user.displayName || user.email
          );
        }
      }

      // Atualiza estado local
      setCandidate({ ...candidate, ...updateData });
      setIsEditing(false);
      
      if (onUpdateCandidate) {
        onUpdateCandidate({ id, ...updateData });
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

  if (!candidate) {
    return (
      <div className="flex items-center justify-center h-screen bg-white dark:bg-gray-900">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400 mb-4">Candidato não encontrado</p>
          <button
            onClick={() => navigate('/')}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Voltar
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
                  {candidate.email_secondary && (
                    <div className="flex items-center gap-3">
                      <Mail size={16} className="text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">E-mail Secundário</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {candidate.email_secondary}
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
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Status Atual</p>
                    <span className={`inline-block px-3 py-1 rounded text-sm font-medium ${
                      STATUS_COLORS[candidate.status] || 'bg-slate-600 text-white'
                    }`}>
                      {candidate.status || 'Inscrito'}
                    </span>
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
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Dados Pessoais</h2>
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
              {/* Adicionar mais campos pessoais aqui */}
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
                  Data de Criação
                </label>
                <p className="text-gray-900 dark:text-white">
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

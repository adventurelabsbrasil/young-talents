import React, { useState, useEffect, useMemo } from 'react';
import { 
  LayoutDashboard, Users, Briefcase, Settings, Plus, Search, 
  FileText, MapPin, ChevronRight, CheckCircle, Filter, 
  UserPlus, Trophy, Menu, X, LogOut, Lock, Loader2, Edit3, Trash2,
  Building2, Tag, Mail, Save, AlertTriangle, UploadCloud
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';

// Firebase Imports
import { initializeApp } from "firebase/app";
import { 
  getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut 
} from "firebase/auth";
import { 
  getFirestore, collection, addDoc, updateDoc, deleteDoc, doc, 
  onSnapshot, serverTimestamp, query, orderBy, writeBatch 
} from "firebase/firestore";

// --- CONFIGURAÇÃO E CONSTANTES ---

// Constantes do Pipeline
const PIPELINE_STAGES = [
  'Inscrito', 
  'Considerado', 
  'Primeira Entrevista', 
  'Testes', 
  'Segunda Entrevista', 
  'Selecionado', 
  'Contratado',
  'Reprovado'
];

const STATUS_COLORS = {
  'Inscrito': 'bg-slate-700 text-slate-200 border-slate-600',
  'Considerado': 'bg-blue-900/40 text-blue-300 border-blue-700',
  'Primeira Entrevista': 'bg-brand-cyan/20 text-brand-cyan border-brand-cyan/30',
  'Testes': 'bg-purple-900/40 text-purple-300 border-purple-700',
  'Segunda Entrevista': 'bg-brand-orange/20 text-brand-orange border-brand-orange/30',
  'Selecionado': 'bg-yellow-900/40 text-yellow-300 border-yellow-700',
  'Contratado': 'bg-green-900/40 text-green-300 border-green-700',
  'Reprovado': 'bg-red-900/40 text-red-300 border-red-700'
};

// Configuração do Firebase
const firebaseConfig = {
  apiKey: "AIzaSyD54i_1mQdEbS3ePMxhCkN2bhezjcq7xEg",
  authDomain: "young-talents-ats.firebaseapp.com",
  projectId: "young-talents-ats",
  storageBucket: "young-talents-ats.firebasestorage.app",
  messagingSenderId: "436802511318",
  appId: "436802511318:web:c7f103e4b09344f9bf4477"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);


// --- COMPONENTES AUXILIARES ---

// 1. Modal de Transição (Validação de Funil)
const TransitionModal = ({ transition, onClose, onConfirm }) => {
  const [data, setData] = useState({
    feedback: '',
    returnSent: false,
    ...transition.candidate 
  });

  const handleSave = () => {
    if (transition.isConclusion && !data.feedback) {
      alert("O feedback/motivo é obrigatório nesta etapa.");
      return;
    }
    onConfirm(data);
  };

  const fieldLabels = {
    city: 'Cidade',
    hasLicense: 'Possui CNH?',
    interestAreas: 'Áreas de Interesse',
    education: 'Formação Acadêmica',
    experience: 'Experiência Anterior',
    maritalStatus: 'Estado Civil',
    source: 'Onde encontrou (Fonte)'
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      <div className="bg-brand-card rounded-xl shadow-2xl w-full max-w-md border border-brand-orange animate-in zoom-in duration-200">
        <div className="px-6 py-4 border-b border-brand-border flex justify-between items-center bg-brand-orange/10">
          <h3 className="font-bold text-white flex items-center gap-2">
            <AlertTriangle size={20} className="text-brand-orange" />
            Movimentação Necessária
          </h3>
          <button onClick={onClose}><X size={20} className="text-slate-400 hover:text-white" /></button>
        </div>
        
        <div className="p-6 space-y-4">
          <p className="text-sm text-slate-300">
            Para mover <strong>{transition.candidate.fullName}</strong> para <strong>{transition.toStage}</strong>, preencha os dados obrigatórios:
          </p>

          {transition.missingFields.map(field => (
            <div key={field}>
              <label className="block text-xs font-bold text-brand-cyan uppercase mb-1.5">{fieldLabels[field] || field}</label>
              {field === 'hasLicense' ? (
                 <select 
                    className="w-full bg-brand-dark border border-brand-border p-2 rounded text-white text-sm"
                    value={data[field] || ''}
                    onChange={e => setData({...data, [field]: e.target.value})}
                 >
                    <option value="">Selecione...</option>
                    <option value="Sim">Sim</option>
                    <option value="Não">Não</option>
                 </select>
              ) : (
                <input 
                  className="w-full bg-brand-dark border border-brand-border p-2 rounded text-white text-sm"
                  value={data[field] || ''}
                  onChange={e => setData({...data, [field]: e.target.value})}
                />
              )}
            </div>
          ))}

          {transition.isConclusion && (
            <div className="space-y-4 pt-2 border-t border-brand-border">
               <div>
                  <label className="block text-xs font-bold text-brand-cyan uppercase mb-1.5">Motivo / Feedback</label>
                  <textarea 
                    className="w-full bg-brand-dark border border-brand-border p-2 rounded text-white text-sm h-24"
                    placeholder="Descreva o motivo..."
                    value={data.feedback}
                    onChange={e => setData({...data, feedback: e.target.value})}
                  />
               </div>
               <div className="flex items-center gap-2 bg-brand-dark p-3 rounded border border-brand-border">
                  <input 
                    type="checkbox" 
                    id="returnSent"
                    className="w-4 h-4 accent-brand-orange"
                    checked={data.returnSent}
                    onChange={e => setData({...data, returnSent: e.target.checked})}
                  />
                  <label htmlFor="returnSent" className="text-sm text-white cursor-pointer select-none">
                    Confirmo que o retorno (feedback) foi enviado.
                  </label>
               </div>
            </div>
          )}
        </div>

        <div className="px-6 py-4 bg-brand-dark/50 flex justify-end gap-2 rounded-b-xl">
          <button onClick={onClose} className="px-4 py-2 text-slate-400 hover:text-white rounded text-sm">Cancelar</button>
          <button onClick={handleSave} className="bg-brand-orange text-white px-4 py-2 rounded text-sm font-bold hover:bg-orange-600 flex items-center gap-2">
            <Save size={16} /> Salvar e Mover
          </button>
        </div>
      </div>
    </div>
  );
};

// 2. Componente de Configuração
const ConfigBox = ({ title, icon: Icon, items, val, setVal, onAdd, onDel, placeholder = "Adicionar novo..." }) => (
  <div className="bg-brand-card p-6 rounded-xl border border-brand-border shadow-lg">
    <h3 className="font-bold flex items-center gap-2 mb-4 text-white"><Icon className="text-brand-cyan"/> {title}</h3>
    <div className="flex gap-2 mb-4">
      <input 
        value={val} 
        onChange={e => setVal(e.target.value)} 
        className="bg-brand-dark border border-brand-border p-2 rounded flex-1 text-sm outline-none focus:border-brand-orange text-white" 
        placeholder={placeholder} 
        onKeyDown={(e) => e.key === 'Enter' && onAdd()}
      />
      <button onClick={onAdd} className="bg-brand-orange text-white px-3 rounded text-sm hover:bg-orange-600"><Plus size={18}/></button>
    </div>
    <ul className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
      {items.map(i => (
        <li key={i.id} className="flex justify-between items-center bg-brand-dark p-2 rounded text-sm text-slate-300 border border-brand-border group">
          {i.name} 
          <button onClick={() => onDel(i.id)} className="text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"><X size={14}/></button>
        </li>
      ))}
    </ul>
  </div>
);

const SettingsPage = ({ companies, onAddCompany, onDelCompany, cities, onAddCity, onDelCity, interestAreas, onAddInterest, onDelInterest, roles, onAddRole, onDelRole, onImportCSV, isImporting }) => {
  const [inputs, setInputs] = useState({ company: '', city: '', interest: '', role: '' });
  const handleAdd = (key, fn) => { if (inputs[key]) { fn(inputs[key]); setInputs({ ...inputs, [key]: '' }); } };

  return (
    <div className="space-y-8 pb-10">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">Configurações do Sistema</h2>
        
        {/* BOTÃO DE IMPORTAR CSV */}
        <div className="relative">
           <input 
             type="file" 
             accept=".csv"
             onChange={onImportCSV}
             id="csvUpload"
             className="hidden"
             disabled={isImporting}
           />
           <label 
             htmlFor="csvUpload"
             className={`cursor-pointer bg-brand-cyan text-brand-dark font-bold px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-cyan-400 transition-colors ${isImporting ? 'opacity-50 cursor-not-allowed' : ''}`}
           >
             {isImporting ? <Loader2 className="animate-spin" size={18} /> : <UploadCloud size={18} />}
             {isImporting ? 'Importando...' : 'Importar Candidatos (CSV)'}
           </label>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <ConfigBox title="Empresas" icon={Building2} items={companies} val={inputs.company} setVal={v => setInputs({...inputs, company: v})} onAdd={() => handleAdd('company', onAddCompany)} onDel={onDelCompany} />
        <ConfigBox title="Cidades / Locais" icon={MapPin} items={cities} val={inputs.city} setVal={v => setInputs({...inputs, city: v})} onAdd={() => handleAdd('city', onAddCity)} onDel={onDelCity} />
        <ConfigBox title="Áreas de Interesse" icon={Tag} items={interestAreas} val={inputs.interest} setVal={v => setInputs({...inputs, interest: v})} onAdd={() => handleAdd('interest', onAddInterest)} onDel={onDelInterest} placeholder="Ex: Comercial..." />
        <ConfigBox title="Cargos / Roles" icon={Briefcase} items={roles} val={inputs.role} setVal={v => setInputs({...inputs, role: v})} onAdd={() => handleAdd('role', onAddRole)} onDel={onDelRole} placeholder="Ex: Analista Jr..." />
        <div className="md:col-span-2 bg-brand-card p-6 rounded-xl border border-brand-border shadow-lg opacity-75">
           <h3 className="font-bold flex items-center gap-2 mb-4 text-white"><Mail className="text-brand-cyan"/> Templates de E-mail (Em Breve)</h3>
           <p className="text-sm text-slate-400">Este módulo permitirá configurar disparos automáticos.</p>
        </div>
      </div>
    </div>
  );
};

// 3. Login
const LoginScreen = ({ onLogin, error }) => (
  <div className="min-h-screen bg-brand-dark flex items-center justify-center p-4">
    <div className="bg-brand-card rounded-2xl shadow-2xl p-8 max-w-md w-full text-center border border-brand-border">
      <div className="w-20 h-20 bg-gradient-to-br from-brand-orange to-brand-cyan rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-brand-orange/20">
        <Trophy size={40} className="text-white" />
      </div>
      <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">Young Talents</h1>
      <p className="text-slate-400 mb-8 font-light">Gestão de Talentos do Futuro</p>
      {error && <div className="bg-red-900/20 text-red-400 p-3 rounded-lg text-sm mb-6 flex items-center justify-center border border-red-900/50"><Lock size={16} className="mr-2"/>{error}</div>}
      <button onClick={onLogin} className="w-full bg-white text-brand-dark font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-3 hover:bg-slate-100 transition-all">
        <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="G" className="w-5 h-5" /> Entrar com Google
      </button>
    </div>
  </div>
);

// --- APP PRINCIPAL ---
export default function App() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [loginError, setLoginError] = useState('');
  
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Dados
  const [jobs, setJobs] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [cities, setCities] = useState([]);
  const [interestAreas, setInterestAreas] = useState([]);
  const [roles, setRoles] = useState([]);

  // Estados UI
  const [isJobModalOpen, setIsJobModalOpen] = useState(false);
  const [editingCandidate, setEditingCandidate] = useState(null);
  const [pendingTransition, setPendingTransition] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  // Filtros
  const [filters, setFilters] = useState({ period: 'all', company: 'all', jobId: 'all', city: 'all', interestArea: 'all', search: '' });

  // Auth
  useEffect(() => {
    return onAuthStateChanged(auth, (u) => { setUser(u); setAuthLoading(false); });
  }, []);

  const handleGoogleLogin = async () => {
    try { await signInWithPopup(auth, new GoogleAuthProvider()); setLoginError(''); } catch (e) { setLoginError('Erro no login'); }
  };

  // Data Sync
  useEffect(() => {
    if (!user) return;
    const unsubs = [
      onSnapshot(query(collection(db, 'jobs'), orderBy('createdAt', 'desc')), s => setJobs(s.docs.map(d => ({id:d.id, ...d.data()})))),
      onSnapshot(query(collection(db, 'candidates'), orderBy('createdAt', 'desc')), s => setCandidates(s.docs.map(d => ({id:d.id, ...d.data()})))),
      onSnapshot(query(collection(db, 'companies'), orderBy('name')), s => setCompanies(s.docs.map(d => ({id:d.id, ...d.data()})))),
      onSnapshot(query(collection(db, 'cities'), orderBy('name')), s => setCities(s.docs.map(d => ({id:d.id, ...d.data()})))),
      onSnapshot(query(collection(db, 'interest_areas'), orderBy('name')), s => setInterestAreas(s.docs.map(d => ({id:d.id, ...d.data()})))),
      onSnapshot(query(collection(db, 'roles'), orderBy('name')), s => setRoles(s.docs.map(d => ({id:d.id, ...d.data()})))),
    ];
    return () => unsubs.forEach(u => u());
  }, [user]);

  // Lógica de Importação CSV
  const handleCSVImport = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setIsImporting(true);
    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        const text = e.target.result;
        // Divide por linhas e remove linhas vazias
        const rows = text.split('\n').filter(r => r.trim() !== '');
        
        if (rows.length < 2) {
          alert("CSV vazio ou sem dados.");
          setIsImporting(false);
          return;
        }

        // Assume primeira linha como header e limpa as aspas/espaços
        const headers = rows[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
        const batchSize = 450; // Margem de segurança abaixo de 500
        let batch = writeBatch(db);
        let count = 0;
        let totalImported = 0;

        for (let i = 1; i < rows.length; i++) {
          // Lógica simples para separar por vírgula (atenção: falha se houver vírgula dentro do valor)
          const values = rows[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
          
          if (values.length < headers.length) continue;

          const candidateData = {};
          headers.forEach((header, index) => {
             // Mapeamento básico: se o CSV tiver header "Nome", salva como "fullName", etc.
             // Se o CSV já tiver os headers certos (fullName, email, city), usa direto.
             let key = header;
             if (header.toLowerCase().includes('nome')) key = 'fullName';
             if (header.toLowerCase().includes('mail')) key = 'email';
             if (header.toLowerCase().includes('cidade')) key = 'city';
             if (header.toLowerCase().includes('telefone') || header.toLowerCase().includes('celular')) key = 'phone';
             
             candidateData[key] = values[index] || '';
          });

          // Dados padrão obrigatórios
          candidateData.status = 'Inscrito';
          candidateData.createdAt = serverTimestamp();
          candidateData.imported = true;

          const ref = doc(collection(db, "candidates"));
          batch.set(ref, candidateData);
          count++;
          totalImported++;

          if (count >= batchSize) {
            await batch.commit();
            batch = writeBatch(db);
            count = 0;
          }
        }

        if (count > 0) {
          await batch.commit();
        }

        alert(`Importação concluída! ${totalImported} candidatos adicionados.`);
        
      } catch (error) {
        console.error("Erro na importação:", error);
        alert("Erro ao processar o arquivo. Verifique o formato.");
      } finally {
        setIsImporting(false);
        event.target.value = ''; // Reset input
      }
    };

    reader.readAsText(file);
  };


  // Lógica de Filtro
  const filteredData = useMemo(() => {
    let list = candidates;
    let fJobs = jobs;

    if (filters.company !== 'all') fJobs = fJobs.filter(j => j.company === filters.company);
    if (filters.city !== 'all') fJobs = fJobs.filter(j => j.location === filters.city);

    if (filters.search) {
      const s = filters.search.toLowerCase();
      list = list.filter(c => c.fullName?.toLowerCase().includes(s) || c.email?.toLowerCase().includes(s));
    }
    if (filters.jobId !== 'all') list = list.filter(c => c.jobId === filters.jobId);
    if (filters.city !== 'all') list = list.filter(c => c.city === filters.city);
    if (filters.interestArea !== 'all') list = list.filter(c => c.interestAreas?.includes(filters.interestArea));
    
    if (filters.period !== 'all') {
      const days = parseInt(filters.period);
      const now = new Date();
      list = list.filter(c => {
        if (!c.createdAt) return false;
        const date = c.createdAt.toDate ? c.createdAt.toDate() : new Date(c.createdAt);
        return Math.ceil(Math.abs(now - date) / (86400000)) <= days;
      });
    }
    return { jobs: fJobs, candidates: list };
  }, [jobs, candidates, filters]);

  // Handlers
  const handleDragEnd = (candidateId, newStage) => {
    const candidate = candidates.find(c => c.id === candidateId);
    if (!candidate || candidate.status === newStage) return;

    const currIdx = PIPELINE_STAGES.indexOf(candidate.status);
    const newIdx = PIPELINE_STAGES.indexOf(newStage);
    const isConclusion = ['Selecionado', 'Contratado', 'Reprovado'].includes(newStage);
    let missing = [];

    if (currIdx <= 0 && newIdx >= 1) {
       if (!candidate.city) missing.push('city');
       if (!candidate.hasLicense) missing.push('hasLicense');
    }
    if (currIdx <= 1 && newIdx >= 2 && !isConclusion) {
       if (!candidate.interestAreas) missing.push('interestAreas');
       if (!candidate.education) missing.push('education');
       if (!candidate.experience) missing.push('experience');
       if (!candidate.maritalStatus) missing.push('maritalStatus');
       if (!candidate.source) missing.push('source');
    }

    if (missing.length > 0 || isConclusion) {
      setPendingTransition({ candidate, toStage: newStage, missingFields: missing, isConclusion });
    } else {
      updateDoc(doc(db, 'candidates', candidateId), { status: newStage });
    }
  };

  const confirmTransition = async (updatedData) => {
    if (!pendingTransition) return;
    setIsSaving(true);
    try {
      await updateDoc(doc(db, 'candidates', pendingTransition.candidate.id), {
        ...updatedData, status: pendingTransition.toStage, updatedAt: serverTimestamp()
      });
      setPendingTransition(null);
    } catch (e) { alert("Erro ao atualizar."); } finally { setIsSaving(false); }
  };

  const handleSaveJob = async (data) => {
    setIsSaving(true);
    try {
      await addDoc(collection(db, 'jobs'), { ...data, status: 'Aberta', createdAt: serverTimestamp(), createdBy: user.email });
      setIsJobModalOpen(false);
    } catch (e) { alert("Erro ao salvar."); } finally { setIsSaving(false); }
  };

  const handleAddAux = async (col, name) => { if(name.trim()) await addDoc(collection(db, col), { name }); };
  const handleDeleteItem = async (col, id) => { if(confirm('Excluir?')) await deleteDoc(doc(db, col, id)); };

  if (authLoading) return <div className="min-h-screen bg-brand-dark flex items-center justify-center text-brand-cyan gap-2"><Loader2 className="animate-spin"/> Carregando...</div>;
  if (!user) return <LoginScreen onLogin={handleGoogleLogin} error={loginError} />;

  return (
    <div className="flex min-h-screen bg-brand-dark font-sans text-slate-200">
      {/* Sidebar */}
      <div className={`fixed lg:static inset-y-0 left-0 z-30 w-64 bg-brand-card border-r border-brand-border transform transition-transform duration-200 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 flex flex-col`}>
        <div className="p-6 border-b border-brand-border flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-xl text-white">
            <div className="w-8 h-8 bg-gradient-to-br from-brand-orange to-brand-cyan rounded-lg flex items-center justify-center"><Trophy size={18} className="text-white"/></div>
            Young Talents
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden text-slate-400"><X size={24}/></button>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {[{ id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard }, { id: 'pipeline', label: 'Pipeline', icon: Filter }, { id: 'jobs', label: 'Vagas', icon: Briefcase }, { id: 'candidates', label: 'Candidatos', icon: Users }, { id: 'settings', label: 'Configurações', icon: Settings }].map((item) => (
            <button key={item.id} onClick={() => { setActiveTab(item.id); setIsSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === item.id ? 'bg-brand-orange text-white' : 'text-slate-400 hover:bg-brand-hover hover:text-white'}`}>
              <item.icon size={18}/> {item.label}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-brand-border bg-brand-dark/30">
           <div className="flex items-center gap-3 px-4 py-2 mb-2">
             <div className="w-8 h-8 rounded-full bg-brand-cyan flex items-center justify-center text-xs font-bold text-brand-dark">{user.displayName?.charAt(0)}</div>
             <div className="flex-1 min-w-0"><p className="text-sm font-medium truncate text-white">{user.displayName}</p><p className="text-xs text-slate-500 truncate">{user.email}</p></div>
           </div>
           <button onClick={() => signOut(auth)} className="w-full flex items-center gap-2 text-xs text-red-400 hover:text-red-300 px-4 py-2 hover:bg-red-900/10 rounded"><LogOut size={14}/> Sair</button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
        <div className="lg:hidden p-4 bg-brand-card shadow-sm flex items-center justify-between border-b border-brand-border sticky top-0 z-10">
          <button onClick={() => setIsSidebarOpen(true)} className="text-slate-200"><Menu size={24}/></button>
          <span className="font-bold text-white">Young Talents</span>
          <div className="w-6"/> 
        </div>

        <div className="bg-brand-card border-b border-brand-border px-6 py-4 flex flex-col xl:flex-row gap-4 items-center justify-between shadow-sm z-10">
           <div className="flex flex-wrap gap-2 w-full lg:w-auto items-center">
              <div className="relative w-full md:w-64">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16}/>
                 <input placeholder="Buscar..." className="pl-9 pr-3 py-2 bg-brand-dark border border-brand-border rounded-lg text-sm w-full outline-none text-white focus:border-brand-cyan" value={filters.search} onChange={e => setFilters({...filters, search: e.target.value})}/>
              </div>
              <select className="border border-brand-border rounded-lg text-sm px-2 py-2 bg-brand-dark text-slate-200 outline-none max-w-[140px]" value={filters.jobId} onChange={e => setFilters({...filters, jobId: e.target.value})}>
                 <option value="all">Vagas</option>{jobs.map(j => <option key={j.id} value={j.id}>{j.title}</option>)}
              </select>
              <select className="border border-brand-border rounded-lg text-sm px-2 py-2 bg-brand-dark text-slate-200 outline-none max-w-[140px]" value={filters.city} onChange={e => setFilters({...filters, city: e.target.value})}>
                 <option value="all">Cidades</option>{cities.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
              </select>
              <select className="border border-brand-border rounded-lg text-sm px-2 py-2 bg-brand-dark text-slate-200 outline-none max-w-[140px]" value={filters.interestArea} onChange={e => setFilters({...filters, interestArea: e.target.value})}>
                 <option value="all">Áreas</option>{interestAreas.map(i => <option key={i.id} value={i.name}>{i.name}</option>)}
              </select>
              <select className="border border-brand-border rounded-lg text-sm px-2 py-2 bg-brand-dark text-slate-200 outline-none max-w-[140px]" value={filters.period} onChange={e => setFilters({...filters, period: e.target.value})}>
                 <option value="all">Período</option><option value="7">7 dias</option><option value="30">30 dias</option>
              </select>
           </div>
           <div className="text-xs text-brand-cyan font-medium border border-brand-cyan/20 px-3 py-1 rounded-full bg-brand-cyan/10 whitespace-nowrap">
              {filteredData.candidates.length} Talentos • {filteredData.jobs.length} Vagas
           </div>
        </div>

        <main className="flex-1 p-4 md:p-8 overflow-y-auto bg-brand-dark custom-scrollbar">
          <div className="max-w-[1600px] mx-auto h-full">
            {activeTab === 'dashboard' && <Dashboard filteredJobs={filteredData.jobs} filteredCandidates={filteredData.candidates} />}
            {activeTab === 'pipeline' && <Pipeline candidates={filteredData.candidates} jobs={jobs} onDragEnd={handleDragEnd} onEdit={(c) => setEditingCandidate(c)} />}
            {activeTab === 'jobs' && <JobsList jobs={filteredData.jobs} candidates={candidates} onAdd={() => setIsJobModalOpen(true)} onDelete={(id) => handleDeleteItem('jobs', id)} onFilterPipeline={(id) => { setFilters({...filters, jobId: id}); setActiveTab('pipeline'); }} />}
            {activeTab === 'candidates' && <CandidatesList candidates={filteredData.candidates} jobs={jobs} onAdd={() => setEditingCandidate({})} onEdit={(c) => setEditingCandidate(c)} onDelete={(id) => handleDeleteItem('candidates', id)} />}
            {activeTab === 'settings' && 
              <SettingsPage 
                companies={companies} onAddCompany={n => handleAddAux('companies', n)} onDelCompany={id => handleDeleteItem('companies', id)} 
                cities={cities} onAddCity={n => handleAddAux('cities', n)} onDelCity={id => handleDeleteItem('cities', id)} 
                interestAreas={interestAreas} onAddInterest={n => handleAddAux('interest_areas', n)} onDelInterest={id => handleDeleteItem('interest_areas', id)} 
                roles={roles} onAddRole={n => handleAddAux('roles', n)} onDelRole={id => handleDeleteItem('roles', id)} 
                onImportCSV={handleCSVImport} isImporting={isImporting}
              />}
          </div>
        </main>
      </div>

      {isJobModalOpen && <JobModal isOpen={isJobModalOpen} onClose={() => setIsJobModalOpen(false)} onSave={handleSaveJob} companies={companies} cities={cities} isSaving={isSaving} />}
      {editingCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 text-white">
           <div className="bg-brand-card p-6 rounded-xl border border-brand-border w-full max-w-lg">
             <h3 className="text-xl font-bold mb-4">Edição (Placeholder)</h3>
             <p className="text-sm text-slate-400 mb-6">Integre o <code>CandidateModal</code> completo aqui se necessário.</p>
             <button onClick={() => setEditingCandidate(null)} className="bg-brand-orange px-4 py-2 rounded text-white">Fechar</button>
           </div>
        </div>
      )}
      {pendingTransition && <TransitionModal transition={pendingTransition} onClose={() => setPendingTransition(null)} onConfirm={confirmTransition} />}
    </div>
  );
}

// --- VIEWS ---

const Dashboard = ({ filteredJobs, filteredCandidates }) => {
  const activeJobs = filteredJobs.filter(j => j.status === 'Aberta').length;
  const hired = filteredCandidates.filter(c => c.status === 'Contratado').length;
  const graphStages = PIPELINE_STAGES.filter(s => s !== 'Reprovado');
  const stageData = graphStages.map(s => ({ name: s, count: filteredCandidates.filter(c => c.status === s).length }));
  
  return (
    <div className="space-y-6 animate-fade-in">
      <h2 className="text-2xl font-bold text-white">Visão Geral</h2>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard label="Vagas Ativas" value={activeJobs} icon={Briefcase} color="text-brand-orange" bg="bg-brand-orange/10" />
        <StatCard label="Total Talentos" value={filteredCandidates.length} icon={Users} color="text-brand-cyan" bg="bg-brand-cyan/10" />
        <StatCard label="Em Processo" value={filteredCandidates.filter(c => c.status !== 'Inscrito' && c.status !== 'Contratado' && c.status !== 'Reprovado').length} icon={FileText} color="text-purple-400" bg="bg-purple-500/10" />
        <StatCard label="Contratados" value={hired} icon={CheckCircle} color="text-green-400" bg="bg-green-500/10" />
      </div>
      <div className="bg-brand-card p-6 rounded-xl shadow-lg border border-brand-border h-96">
          <h3 className="font-bold mb-4 text-white">Funil de Seleção</h3>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stageData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" />
              <XAxis dataKey="name" fontSize={10} stroke="#94a3b8" interval={0} angle={-15} textAnchor="end" height={60} />
              <YAxis fontSize={12} stroke="#94a3b8" />
              <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#475569', color: '#fff' }} cursor={{fill: '#334155'}} />
              <Bar dataKey="count" fill="#fe5009" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
      </div>
    </div>
  );
};

const StatCard = ({ label, value, icon: Icon, color, bg }) => (
  <div className="bg-brand-card p-6 rounded-xl shadow-lg border border-brand-border flex items-center gap-4 hover:border-brand-cyan/50 transition-colors">
    <div className={`p-3 rounded-lg ${bg}`}><Icon className={`w-6 h-6 ${color}`} /></div>
    <div><p className="text-sm text-slate-400 font-medium">{label}</p><p className="text-2xl font-bold text-white">{value}</p></div>
  </div>
);

const Pipeline = ({ candidates, jobs, onDragEnd, onEdit }) => {
  const [draggedId, setDraggedId] = useState(null);
  const handleDragStart = (e, id) => { setDraggedId(id); e.dataTransfer.effectAllowed = "move"; };
  constQT = (e, stage) => { e.preventDefault(); if (draggedId) { onDragEnd(draggedId, stage); setDraggedId(null); } };

  return (
    <div className="flex flex-col h-[calc(100vh-180px)]">
      <div className="flex-1 overflow-x-auto pb-4 custom-scrollbar">
        <div className="flex gap-4 min-w-max h-full">
          {PIPELINE_STAGES.map(stage => (
            <div key={stage} className="flex-1 flex flex-col bg-brand-card/50 rounded-xl p-2 min-w-[280px] w-[280px] border border-brand-border"
              onDragOver={(e) => e.preventDefault()} onDrop={(e) =>QT(e, stage)}>
              <div className={`font-semibold text-slate-200 mb-3 px-2 flex justify-between items-center bg-brand-hover p-2 rounded border-l-4 ${STATUS_COLORS[stage]?.split(' ')[2] || 'border-slate-500'}`}>
                <span className="truncate">{stage}</span>
                <span className="bg-brand-dark text-slate-300 px-2 py-0.5 rounded text-xs font-bold border border-brand-border">{candidates.filter(c => c.status === stage).length}</span>
              </div>
              <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                {candidates.filter(c => c.status === stage).map(c => {
                  const job = jobs.find(j => j.id === c.jobId);
                  return (
                    <div key={c.id} draggable onDragStart={(e) => handleDragStart(e, c.id)} onClick={() => onEdit(c)}
                      className="bg-brand-card p-3 rounded-lg shadow-sm border border-brand-border hover:border-brand-cyan cursor-grab active:cursor-grabbing transition-all group relative">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                             <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs text-white font-bold border border-brand-border">{c.fullName?.charAt(0)}</div>
                             <p className="font-bold text-slate-200 text-sm truncate max-w-[140px]">{c.fullName}</p>
                        </div>
                        <Edit3 size={14} className="text-slate-500 hover:text-brand-orange opacity-0 group-hover:opacity-100" />
                      </div>
                      <p className="text-xs text-brand-cyan bg-brand-cyan/10 inline-block px-1.5 py-0.5 rounded mb-2 font-medium truncate max-w-full">{job?.title || 'Banco Geral'}</p>
                      <div className="text-xs text-slate-400 flex items-center gap-1"><MapPin size={10} /> {c.city || 'N/A'}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const JobsList = ({ jobs, candidates, onAdd, onDelete, onFilterPipeline }) => (
  <div className="space-y-6">
    <div className="flex justify-between items-center"><h2 className="text-2xl font-bold text-white">Vagas</h2><button onClick={onAdd} className="bg-brand-orange text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-orange-600 transition-colors"><Plus size={18}/> Nova Vaga</button></div>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {jobs.map(job => (
        <div key={job.id} className="bg-brand-card p-6 rounded-xl border border-brand-border shadow-lg flex flex-col group hover:border-brand-orange/50 transition-colors">
          <div className="flex justify-between mb-4"><div className="p-2 bg-brand-dark rounded-lg"><Briefcase className="text-brand-orange" size={24}/></div><span className="text-xs bg-brand-cyan/20 text-brand-cyan px-2 py-1 rounded-full h-fit border border-brand-cyan/20">{job.status}</span></div>
          <h3 className="font-bold text-lg mb-1 text-white">{job.title}</h3>
          <p className="text-sm text-slate-400 mb-4">{job.company}</p>
          <div className="text-sm text-slate-500 space-y-1 mb-4 flex-1">
            <p className="flex items-center gap-2"><MapPin size={14}/> {job.location}</p>
            <p className="flex items-center gap-2 font-medium text-brand-cyan"><Users size={14}/> {candidates.filter(c => c.jobId === job.id).length} Candidatos</p>
          </div>
          <div className="flex justify-between items-center border-t border-brand-border pt-4">
            <button onClick={() => onFilterPipeline(job.id)} className="text-brand-orange text-sm font-medium hover:underline flex items-center gap-1">Ver Pipeline <ChevronRight size={14}/></button>
            <button onClick={() => onDelete(job.id)} className="text-red-400 text-xs hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">Excluir</button>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const CandidatesList = ({ candidates, jobs, onAdd, onEdit, onDelete }) => (
  <div className="space-y-6">
    <div className="flex justify-between items-center"><h2 className="text-2xl font-bold text-white">Banco de Talentos</h2><button onClick={onAdd} className="bg-brand-cyan text-brand-dark font-bold px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-cyan-400 transition-colors"><UserPlus size={18}/> Adicionar Talento</button></div>
    <div className="bg-brand-card rounded-xl border border-brand-border shadow-lg overflow-hidden">
      <table className="w-full text-sm text-left text-slate-300">
        <thead className="bg-brand-hover text-slate-200 font-medium"><tr><th className="px-6 py-4">Nome</th><th className="px-6 py-4">Vaga</th><th className="px-6 py-4">Cidade</th><th className="px-6 py-4">Status</th><th className="px-6 py-4 text-right">Ações</th></tr></thead>
        <tbody className="divide-y divide-brand-border">
          {candidates.map(c => (
            <tr key={c.id} className="hover:bg-brand-hover/50 cursor-pointer transition-colors" onClick={() => onEdit(c)}>
              <td className="px-6 py-4 font-medium flex items-center gap-3">
                 <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs text-white border border-brand-border">{c.fullName?.charAt(0)}</div>
                 <div>{c.fullName}<div className="text-xs text-slate-500 font-normal">{c.email}</div></div>
              </td>
              <td className="px-6 py-4">{jobs.find(j => j.id === c.jobId)?.title || <span className="text-slate-600 italic">Banco Geral</span>}</td>
              <td className="px-6 py-4">{c.city}</td>
              <td className="px-6 py-4"><span className={`px-2 py-1 rounded text-xs border ${STATUS_COLORS[c.status] || 'bg-slate-700 text-white'}`}>{c.status}</span></td>
              <td className="px-6 py-4 text-right"><button onClick={(e) => { e.stopPropagation(); onDelete(c.id); }} className="text-slate-500 hover:text-red-500 p-1"><Trash2 size={16}/></button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

const JobModal = ({ onClose, onSave, companies, cities, isSaving }) => {
  const [d, setD] = useState({ title: '', company: '', location: '', roleType: 'Tempo Integral' });
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="bg-brand-card rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in duration-200 border border-brand-border text-white">
        <div className="px-6 py-4 border-b border-brand-border flex justify-between items-center"><h3 className="font-bold text-lg">Nova Vaga</h3><button onClick={onClose}><X size={20}/></button></div>
        <div className="p-6 space-y-4">
          <input className="w-full bg-brand-dark border border-brand-border p-2 rounded text-white" placeholder="Título do Cargo" value={d.title} onChange={e => setD({...d, title: e.target.value})} />
          <select className="w-full bg-brand-dark border border-brand-border p-2 rounded text-white" value={d.company} onChange={e => setD({...d, company: e.target.value})}><option value="">Empresa</option>{companies.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}</select>
          <select className="w-full bg-brand-dark border border-brand-border p-2 rounded text-white" value={d.location} onChange={e => setD({...d, location: e.target.value})}><option value="">Cidade</option>{cities.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}</select>
        </div>
        <div className="px-6 py-4 bg-brand-dark/50 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 text-slate-400 hover:text-white rounded">Cancelar</button>
          <button onClick={() => onSave(d)} disabled={isSaving || !d.title} className="bg-brand-orange text-white px-4 py-2 rounded flex items-center gap-2 hover:bg-orange-600 disabled:opacity-50">{isSaving && <Loader2 size={16} className="animate-spin" />} Salvar</button>
        </div>
      </div>
    </div>
  );
};
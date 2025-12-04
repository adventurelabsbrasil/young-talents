import React, { useState, useMemo, useEffect } from 'react';
import { 
  Search, Plus, Edit3, Trash2, 
  Eye, EyeOff, CheckSquare, Square, 
  Save, X, GripVertical, AlertTriangle, Database,
  Briefcase, Users, Layout, FileText
} from 'lucide-react';
import { CSV_FIELD_MAPPING_OPTIONS, PIPELINE_STAGES } from '../constants';

// Mocks de Configuração Inicial (simulando dados do banco que não são apenas listas simples)
const SYSTEM_JOB_FIELDS = [
  { id: 'title', label: 'Título da Vaga', type: 'Texto Curto', required: true, visible: true, isSystem: true },
  { id: 'description', label: 'Descrição da Vaga', type: 'Texto Longo', required: true, visible: true, isSystem: true },
  { id: 'salary_range', label: 'Faixa Salarial', type: 'Financeiro', required: false, visible: true, isSystem: false },
  { id: 'hiring_model', label: 'Modelo de Contratação', type: 'Seleção', required: true, visible: true, isSystem: false },
];

const PIPELINE_CONFIGS = {
  gatilhos: [
    { id: 'trig_hire', label: 'Ao mover para Contratado', type: 'Gatilho de Email', description: 'Envia email de boas-vindas' },
    { id: 'trig_reject', label: 'Ao mover para Reprovado', type: 'Gatilho de Email', description: 'Envia feedback padrão' },
  ],
  motivos: [
    { id: 'reason_salary', label: 'Salário Incompatível', type: 'Motivo Perda' },
    { id: 'reason_qual', label: 'Qualificação Técnica', type: 'Motivo Perda' },
    { id: 'reason_cult', label: 'Fit Cultural', type: 'Motivo Perda' },
  ]
};

export default function SettingsPage({ 
  companies, onAddCompany, onDelCompany,
  cities, onAddCity, onDelCity,
  interestAreas, onAddInterest, onDelInterest,
  roles, onAddRole, onDelRole,
  // Props para funções futuras de edição de campos
  onUpdateField, onDeleteField
}) {
  const [activeTab, setActiveTab] = useState('candidatos');
  const [activeSubTab, setActiveSubTab] = useState(''); 
  const [searchTerm, setSearchTerm] = useState('');
  
  // Estado local para dados que ainda não estão no App.jsx (ex: configs de campos)
  // Em produção, isso viria via props do Firebase
  const [candidateFields, setCandidateFields] = useState(
    CSV_FIELD_MAPPING_OPTIONS.map(f => ({
      id: f.value,
      label: f.label.replace(':', ''),
      type: 'Texto',
      required: false,
      visible: true,
      isSystem: true // Protege contra exclusão
    }))
  );
  const [jobFields, setJobFields] = useState(SYSTEM_JOB_FIELDS);

  // Estados do Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' | 'edit'
  const [currentItem, setCurrentItem] = useState({ id: '', label: '', type: 'Texto' });

  // --- DEFINIÇÃO DE ABAS E SUB-ABAS ---
  const tabs = [
    { id: 'candidatos', label: 'Candidatos', icon: Users },
    { id: 'cargos', label: 'Cargos', icon: Briefcase }, // Cargo como entidade principal
    { id: 'vagas', label: 'Vagas', icon: FileText },
    { id: 'pipeline', label: 'Pipeline', icon: Layout },
  ];

  const subTabs = useMemo(() => {
    if (activeTab === 'vagas') return [
      { id: 'campos', label: 'Campos da Vaga' },
      { id: 'empresas', label: 'Empresas' },
      { id: 'cidades', label: 'Cidades' },
      { id: 'areas', label: 'Áreas de Interesse' },
      // 'Cargos' também pode aparecer aqui se for um dropdown da vaga, 
      // mas já tem aba própria. Vamos manter aqui como "Lista de Opções"
      { id: 'roles_list', label: 'Lista de Cargos' } 
    ];
    if (activeTab === 'pipeline') return [
      { id: 'etapas', label: 'Etapas do Funil' },
      { id: 'motivos', label: 'Motivos de Fechamento' },
      { id: 'status', label: 'Status do Processo' }
    ];
    return [];
  }, [activeTab]);

  // Resetar sub-aba ao trocar aba principal
  useEffect(() => {
    if (subTabs.length > 0) setActiveSubTab(subTabs[0].id);
    else setActiveSubTab('');
  }, [activeTab, subTabs]);

  // --- PREPARAÇÃO DOS DADOS DA TABELA ---
  const getTableData = () => {
    let data = [];
    let typeLabel = 'Campo de Texto';

    // 1. CANDIDATOS
    if (activeTab === 'candidatos') {
      data = candidateFields;
    } 
    // 2. CARGOS (Lista Principal)
    else if (activeTab === 'cargos') {
      data = roles.map(r => ({ ...r, label: r.name, type: 'Opção de Lista', isSystem: false }));
    }
    // 3. VAGAS
    else if (activeTab === 'vagas') {
      if (activeSubTab === 'campos') data = jobFields;
      else if (activeSubTab === 'empresas') data = companies.map(i => ({ ...i, label: i.name, type: 'Opção (Empresa)', isSystem: false }));
      else if (activeSubTab === 'cidades') data = cities.map(i => ({ ...i, label: i.name, type: 'Opção (Cidade)', isSystem: false }));
      else if (activeSubTab === 'areas') data = interestAreas.map(i => ({ ...i, label: i.name, type: 'Opção (Área)', isSystem: false }));
      else if (activeSubTab === 'roles_list') data = roles.map(i => ({ ...i, label: i.name, type: 'Opção (Cargo)', isSystem: false }));
    }
    // 4. PIPELINE
    else if (activeTab === 'pipeline') {
      if (activeSubTab === 'etapas') data = PIPELINE_STAGES.map((s, i) => ({ id: `stage_${i}`, label: s, type: 'Etapa Funil', required: true, visible: true, isSystem: true }));
      else if (activeSubTab === 'motivos') data = PIPELINE_CONFIGS.motivos;
      else if (activeSubTab === 'status') data = [{ id: 'closed', label: 'Fechada', type: 'Status' }, { id: 'cancelled', label: 'Cancelada', type: 'Status' }]; // Exemplo
    }

    // Filtro de Busca
    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      data = data.filter(item => 
        (item.label && item.label.toLowerCase().includes(lower)) || 
        (item.id && item.id.toLowerCase().includes(lower))
      );
    }

    return data;
  };

  const currentData = getTableData();

  // --- HANDLERS ---

  const handleOpenModal = (item = null) => {
    if (item) {
      setModalMode('edit');
      setCurrentItem({ ...item });
    } else {
      setModalMode('create');
      // Gera um ID sugestivo ou aleatório
      const newId = `field_${Date.now().toString().slice(-6)}`;
      setCurrentItem({ 
        id: newId, 
        label: '', 
        type: 'Texto', 
        required: false, 
        visible: true, 
        isSystem: false 
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (!currentItem.label.trim()) return alert("O nome do campo é obrigatório.");

    // LÓGICA DE SALVAR (Aqui você conectaria com o App.jsx / Firebase)
    // Estamos simulando a atualização local para feedback visual imediato
    
    // 1. Listas Simples (Adicionar novo)
    const saveSimpleList = (addFn) => {
      if (modalMode === 'create') addFn(currentItem.label);
      else console.log("Edição de nome de lista simples não implementada no backend ainda (requer updateDoc)");
    };

    if (activeTab === 'cargos') saveSimpleList(onAddRole);
    else if (activeTab === 'vagas') {
      if (activeSubTab === 'empresas') saveSimpleList(onAddCompany);
      if (activeSubTab === 'cidades') saveSimpleList(onAddCity);
      if (activeSubTab === 'areas') saveSimpleList(onAddInterest);
      if (activeSubTab === 'roles_list') saveSimpleList(onAddRole);
      
      if (activeSubTab === 'campos') {
        setJobFields(prev => modalMode === 'create' ? [...prev, currentItem] : prev.map(i => i.id === currentItem.id ? currentItem : i));
      }
    }
    else if (activeTab === 'candidatos') {
      setCandidateFields(prev => modalMode === 'create' ? [...prev, currentItem] : prev.map(i => i.id === currentItem.id ? currentItem : i));
    }

    setIsModalOpen(false);
  };

  const handleDelete = (id) => {
    if (!confirm("Tem certeza que deseja excluir? Esta ação não pode ser desfeita.")) return;

    if (activeTab === 'cargos') onDelRole(id);
    else if (activeTab === 'vagas') {
      if (activeSubTab === 'empresas') onDelCompany(id);
      if (activeSubTab === 'cidades') onDelCity(id);
      if (activeSubTab === 'areas') onDelInterest(id);
      if (activeSubTab === 'roles_list') onDelRole(id);
      if (activeSubTab === 'campos') setJobFields(prev => prev.filter(i => i.id !== id));
    }
    else if (activeTab === 'candidatos') {
      setCandidateFields(prev => prev.filter(i => i.id !== id));
    }
  };

  // Toggle rápido na tabela
  const toggleFieldProp = (id, prop, listSetter) => {
    if (listSetter) {
        listSetter(prev => prev.map(item => item.id === id ? { ...item, [prop]: !item[prop] } : item));
    }
  };

  const handleToggle = (item, prop) => {
      if (activeTab === 'candidatos') toggleFieldProp(item.id, prop, setCandidateFields);
      if (activeTab === 'vagas' && activeSubTab === 'campos') toggleFieldProp(item.id, prop, setJobFields);
  };

  return (
    <div className="flex flex-col h-full bg-brand-dark text-slate-200 p-6 gap-6 overflow-hidden">
      
      {/* HEADER */}
      <div className="flex flex-col gap-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Database className="text-brand-orange" /> Configurações de Dados
          </h2>
        </div>

        {/* ABAS PRINCIPAIS */}
        <div className="flex gap-2 border-b border-brand-border">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id); setSearchTerm(''); }}
                className={`flex items-center gap-2 px-6 py-3 font-bold text-sm rounded-t-lg transition-all border-t border-l border-r ${
                  activeTab === tab.id 
                    ? 'bg-brand-card text-brand-cyan border-brand-border border-b-brand-card -mb-[1px] z-10' 
                    : 'bg-brand-dark/50 text-slate-500 border-transparent hover:text-slate-300'
                }`}
              >
                <Icon size={16} /> {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ÁREA DE CONTEÚDO */}
      <div className="flex-1 bg-brand-card border border-brand-border rounded-xl rounded-tl-none shadow-xl flex flex-col overflow-hidden">
        
        {/* BARRA DE CONTROLES (Sub-abas e Busca) */}
        <div className="p-4 border-b border-brand-border flex flex-col gap-4 bg-brand-dark/20">
          
          {/* Sub-abas */}
          {subTabs.length > 0 && (
            <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-1">
              {subTabs.map(st => (
                <button
                  key={st.id}
                  onClick={() => setActiveSubTab(st.id)}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors border ${
                    activeSubTab === st.id
                      ? 'bg-brand-cyan/10 text-brand-cyan border-brand-cyan'
                      : 'bg-transparent text-slate-400 border-slate-600 hover:border-slate-400'
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>
          )}

          <div className="flex justify-between items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-2.5 text-slate-500" size={16} />
              <input 
                className="w-full bg-brand-dark border border-brand-border rounded-lg pl-9 pr-4 py-2 text-sm text-white focus:border-brand-cyan outline-none"
                placeholder="Buscar campo ou opção..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            
            <button 
              onClick={() => handleOpenModal()}
              className="bg-brand-orange hover:bg-orange-600 text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 transition-colors shadow-lg"
            >
              <Plus size={18}/> Novo Campo/Item
            </button>
          </div>
        </div>

        {/* TABELA */}
        <div className="flex-1 overflow-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead className="bg-brand-dark/50 text-xs uppercase text-slate-400 font-bold sticky top-0 backdrop-blur-md z-10">
              <tr>
                <th className="p-4 w-16 text-center"><GripVertical size={16}/></th>
                <th className="p-4 w-40">ID (Banco)</th>
                <th className="p-4">Nome / Rótulo</th>
                <th className="p-4 w-32">Tipo</th>
                <th className="p-4 w-24 text-center">Obrigatório</th>
                <th className="p-4 w-24 text-center">Visível</th>
                <th className="p-4 w-32 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border text-sm">
              {currentData.length > 0 ? currentData.map((item, idx) => (
                <tr key={item.id || idx} className="hover:bg-brand-dark/30 transition-colors group">
                  <td className="p-4 text-center text-slate-600 cursor-move"><GripVertical size={16}/></td>
                  
                  {/* ID */}
                  <td className="p-4">
                    <span className="font-mono text-[10px] text-brand-cyan bg-brand-cyan/5 px-2 py-1 rounded border border-brand-cyan/20 truncate max-w-[150px] block" title={item.id}>
                      {item.id}
                    </span>
                  </td>
                  
                  {/* Nome */}
                  <td className="p-4">
                    <span className="font-bold text-white block">{item.label}</span>
                    {item.description && <span className="text-xs text-slate-500">{item.description}</span>}
                  </td>
                  
                  {/* Tipo */}
                  <td className="p-4">
                    <span className="text-[10px] uppercase font-bold text-slate-400 border border-slate-700 px-2 py-0.5 rounded bg-slate-800">
                      {item.type}
                    </span>
                  </td>

                  {/* Checkbox Obrigatório */}
                  <td className="p-4 text-center">
                    <button 
                        onClick={() => handleToggle(item, 'required')}
                        disabled={!item.hasOwnProperty('required') || item.isSystem} // Desabilita se não tiver a prop ou se for sistema fixo
                        className={`transition-transform hover:scale-110 ${!item.hasOwnProperty('required') ? 'opacity-30 cursor-not-allowed' : ''}`}
                    >
                      {item.required 
                        ? <CheckSquare size={18} className="text-green-400 mx-auto"/> 
                        : <Square size={18} className="text-slate-600 mx-auto"/>}
                    </button>
                  </td>

                  {/* Checkbox Visível */}
                  <td className="p-4 text-center">
                    <button 
                        onClick={() => handleToggle(item, 'visible')}
                        disabled={!item.hasOwnProperty('visible')}
                        className={`transition-transform hover:scale-110 ${!item.hasOwnProperty('visible') ? 'opacity-30 cursor-not-allowed' : ''}`}
                    >
                      {item.visible !== false 
                        ? <Eye size={18} className="text-brand-cyan mx-auto"/> 
                        : <EyeOff size={18} className="text-slate-600 mx-auto"/>}
                    </button>
                  </td>

                  {/* Ações */}
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleOpenModal(item)} className="p-2 text-blue-400 hover:bg-blue-500/10 rounded transition-colors" title="Editar">
                        <Edit3 size={16}/>
                      </button>
                      {!item.isSystem && (
                        <button onClick={() => handleDelete(item.id)} className="p-2 text-red-400 hover:bg-red-500/10 rounded transition-colors" title="Excluir">
                          <Trash2 size={16}/>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="7" className="p-12 text-center text-slate-500 flex flex-col items-center justify-center gap-2">
                    <AlertTriangle size={24} />
                    <p>Nenhum registro encontrado.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL DE EDIÇÃO */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-brand-card w-full max-w-lg rounded-xl border border-brand-border shadow-2xl p-6 relative">
            
            <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white">
                <X size={20}/>
            </button>

            <h3 className="text-xl font-bold text-white mb-6 pr-8">
              {modalMode === 'create' ? 'Adicionar Novo' : 'Editar'} 
              <span className="text-brand-orange ml-2">
                {activeSubTab ? subTabs.find(t=>t.id===activeSubTab)?.label : activeTab}
              </span>
            </h3>
            
            <div className="space-y-5">
              
              {/* ID Field */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 flex items-center gap-2">
                  ID do Banco de Dados
                  {modalMode === 'edit' && <span className="bg-brand-dark px-1.5 py-0.5 rounded text-[10px] text-slate-400 border border-brand-border">Imutável</span>}
                </label>
                <input 
                  className={`w-full bg-brand-dark border border-brand-border p-3 rounded-lg text-sm outline-none font-mono ${modalMode === 'edit' ? 'text-slate-500 cursor-not-allowed' : 'text-white focus:border-brand-cyan'}`}
                  value={currentItem.id}
                  onChange={e => modalMode === 'create' && setCurrentItem({...currentItem, id: e.target.value})}
                  disabled={modalMode === 'edit'}
                  placeholder="ex: company_google"
                />
                {modalMode === 'create' && <p className="text-[10px] text-slate-500 mt-1">Recomendado: letras minúsculas e sem espaços.</p>}
              </div>

              {/* Label Field */}
              <div>
                <label className="block text-xs font-bold text-brand-cyan uppercase mb-1.5">Nome de Exibição</label>
                <input 
                  className="w-full bg-brand-dark border border-brand-border p-3 rounded-lg text-white focus:border-brand-orange outline-none transition-colors"
                  value={currentItem.label}
                  onChange={e => setCurrentItem({...currentItem, label: e.target.value})}
                  placeholder="Ex: Nome da Empresa"
                  autoFocus
                />
              </div>

              {/* Type Field */}
              <div>
                <label className="block text-xs font-bold text-brand-cyan uppercase mb-1.5">Tipo de Dado</label>
                <select 
                  className="w-full bg-brand-dark border border-brand-border p-3 rounded-lg text-white focus:border-brand-orange outline-none appearance-none"
                  value={currentItem.type}
                  onChange={e => setCurrentItem({...currentItem, type: e.target.value})}
                  disabled={currentItem.isSystem} 
                >
                  <option value="Texto">Texto Curto</option>
                  <option value="Texto Longo">Texto Longo</option>
                  <option value="Número">Número</option>
                  <option value="Data">Data</option>
                  <option value="Seleção">Seleção Única</option>
                  <option value="Financeiro">Financeiro (R$)</option>
                  <option value="Opção de Lista">Item de Lista Simples</option>
                </select>
              </div>

              {/* Toggles (Apenas para Campos de Verdade, não para itens de lista simples) */}
              {!['Opção (Empresa)', 'Opção (Cidade)', 'Opção (Área)', 'Opção (Cargo)'].includes(currentItem.type) && (
                <div className="flex gap-6 pt-2 bg-brand-dark p-4 rounded-lg border border-brand-border">
                   <label className="flex items-center gap-3 cursor-pointer select-none group">
                      <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${currentItem.required ? 'bg-brand-orange border-brand-orange' : 'border-slate-600 group-hover:border-slate-400'}`}>
                          {currentItem.required && <CheckSquare size={14} className="text-white" />}
                      </div>
                      <input 
                        type="checkbox" 
                        className="hidden"
                        checked={currentItem.required || false}
                        onChange={e => setCurrentItem({...currentItem, required: e.target.checked})}
                      />
                      <span className={`text-sm ${currentItem.required ? 'text-white font-bold' : 'text-slate-400'}`}>Obrigatório</span>
                   </label>

                   <div className="h-6 w-px bg-brand-border"></div>

                   <label className="flex items-center gap-3 cursor-pointer select-none group">
                      <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${currentItem.visible !== false ? 'bg-brand-cyan border-brand-cyan' : 'border-slate-600 group-hover:border-slate-400'}`}>
                          {currentItem.visible !== false && <Eye size={14} className="text-brand-dark" />}
                      </div>
                      <input 
                        type="checkbox" 
                        className="hidden"
                        checked={currentItem.visible !== false}
                        onChange={e => setCurrentItem({...currentItem, visible: e.target.checked})}
                      />
                      <span className={`text-sm ${currentItem.visible !== false ? 'text-white font-bold' : 'text-slate-400'}`}>Visível</span>
                   </label>
                </div>
              )}
            </div>

            <div className="mt-8 flex justify-end gap-3 pt-4 border-t border-brand-border">
              <button onClick={() => setIsModalOpen(false)} className="px-6 py-2 text-slate-400 hover:text-white transition-colors">Cancelar</button>
              <button onClick={handleSave} className="bg-brand-orange text-white px-6 py-2 rounded-lg font-bold hover:bg-orange-600 flex items-center gap-2 shadow-lg transition-all">
                <Save size={18}/> Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
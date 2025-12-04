import React, { useState, useEffect } from 'react';
import { 
  Search, Plus, Filter, Edit3, Trash2, 
  ArrowUp, ArrowDown, Eye, EyeOff, CheckSquare, Square,
  ChevronLeft, ChevronRight, Calendar, GripVertical, Save, X
} from 'lucide-react';
import { CSV_FIELD_MAPPING_OPTIONS, PIPELINE_STAGES } from '../constants';

export default function SettingsPage({ 
  companies, onAddCompany, onDelCompany,
  cities, onAddCity, onDelCity,
  interestAreas, onAddInterest, onDelInterest,
  roles, onAddRole, onDelRole,
  origins, onAddOrigin, onDelOrigin,
  schooling, onAddSchooling, onDelSchooling,
  marital, onAddMarital, onDelMarital,
  tags, onAddTag, onDelTag
}) {
  // --- ESTADOS GLOBAIS ---
  const [activeTab, setActiveTab] = useState('candidatos');
  const [activeSubTab, setActiveSubTab] = useState('todos'); // Para abas com subcategorias
  const [searchTerm, setSearchTerm] = useState('');
  
  // --- MOCK DE DADOS DO SISTEMA (Campos Fixos) ---
  const systemJobFields = [
    { id: 'job_1', name: 'Título da Vaga', type: 'texto', category: 'campos', required: true, visible: true, immutable: true },
    { id: 'job_2', name: 'Empresa Contratante', type: 'select', category: 'campos', required: true, visible: true, immutable: true },
    { id: 'job_3', name: 'Cidade / Local', type: 'select', category: 'campos', required: true, visible: true, immutable: true },
    { id: 'job_4', name: 'Status', type: 'status', category: 'campos', required: true, visible: true, immutable: true },
  ];

  const pipelineTriggers = [
    { id: 'trig_1', name: 'Ao mover para Contratado', type: 'email', category: 'gatilhos', description: 'Envia email de boas-vindas' },
    { id: 'trig_2', name: 'Ao mover para Reprovado', type: 'email', category: 'gatilhos', description: 'Envia email de feedback negativo' },
  ];

  const closingReasons = [
    { id: 'reas_1', name: 'Salário Incompatível', category: 'motivos' },
    { id: 'reas_2', name: 'Sem qualificação técnica', category: 'motivos' },
    { id: 'reas_3', name: 'Perfil Comportamental', category: 'motivos' },
    { id: 'reas_4', name: 'Desistência do Candidato', category: 'motivos' },
  ];

  // --- CONFIGURAÇÃO DAS ABAS ---
  const getTabData = () => {
    switch (activeTab) {
      case 'candidatos':
        return CSV_FIELD_MAPPING_OPTIONS.map((f, i) => ({
          id: f.value,
          name: f.label.replace(':', ''),
          type: 'texto',
          category: 'campos',
          required: i < 3, // Mock: primeiros 3 obrigatórios
          visible: true,
          source: 'Sistema'
        }));
      
      case 'cargos':
        return roles.map(r => ({ ...r, type: 'opção', category: 'lista', source: 'Cadastrado' }));

      case 'vagas':
        const allVagasData = [
          ...systemJobFields,
          ...cities.map(c => ({ ...c, type: 'opção', category: 'cidades', source: 'Cadastrado' })),
          ...interestAreas.map(i => ({ ...i, type: 'opção', category: 'areas', source: 'Cadastrado' })),
          ...companies.map(c => ({ ...c, type: 'opção', category: 'empresas', source: 'Cadastrado' })),
        ];
        // Filtro por sub-aba
        if (activeSubTab === 'campos') return systemJobFields;
        if (activeSubTab === 'cidades') return cities.map(c => ({ ...c, type: 'opção', category: 'cidades' }));
        if (activeSubTab === 'areas') return interestAreas.map(i => ({ ...i, type: 'opção', category: 'areas' }));
        if (activeSubTab === 'empresas') return companies.map(c => ({ ...c, type: 'opção', category: 'empresas' }));
        return allVagasData;

      case 'pipeline':
        const stages = PIPELINE_STAGES.map((s, i) => ({ id: `stg_${i}`, name: s, type: 'etapa', category: 'funil', order: i + 1 }));
        if (activeSubTab === 'funil') return stages;
        if (activeSubTab === 'gatilhos') return pipelineTriggers;
        if (activeSubTab === 'motivos') return closingReasons;
        return [...stages, ...pipelineTriggers, ...closingReasons];

      default: return [];
    }
  };

  const currentData = getTabData().filter(item => 
    item.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // --- MODAL DE EDIÇÃO/CRIAÇÃO ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // create | edit
  const [currentItem, setCurrentItem] = useState({ name: '' });

  const handleOpenModal = (item = null) => {
    if (item) {
      setModalMode('edit');
      setCurrentItem({ ...item });
    } else {
      setModalMode('create');
      setCurrentItem({ name: '', category: activeSubTab !== 'todos' ? activeSubTab : getSubTabs()[0]?.id });
    }
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (!currentItem.name) return alert("Nome é obrigatório");

    // Lógica de Salvamento baseada na Tab/SubTab ativa
    if (activeTab === 'cargos') {
       if (modalMode === 'create') onAddRole(currentItem.name);
       // if edit -> update logic (mocked for now as props don't have update)
    } else if (activeTab === 'vagas') {
       if (currentItem.category === 'cidades') onAddCity(currentItem.name);
       if (currentItem.category === 'areas') onAddInterest(currentItem.name);
       if (currentItem.category === 'empresas') onAddCompany(currentItem.name);
    }
    
    setIsModalOpen(false);
  };

  const handleDelete = (id, category) => {
    if (!confirm("Deseja realmente excluir?")) return;
    if (activeTab === 'cargos') onDelRole(id);
    if (activeTab === 'vagas') {
      if (category === 'cidades') onDelCity(id);
      if (category === 'areas') onDelInterest(id);
      if (category === 'empresas') onDelCompany(id);
    }
  };

  // --- SUB-ABAS HELPERS ---
  const getSubTabs = () => {
    if (activeTab === 'vagas') return [
      { id: 'todos', label: 'Tudo' },
      { id: 'campos', label: 'Campos da Vaga' },
      { id: 'cidades', label: 'Cidades' },
      { id: 'areas', label: 'Áreas de Interesse' },
      { id: 'empresas', label: 'Empresas' }
    ];
    if (activeTab === 'pipeline') return [
      { id: 'todos', label: 'Tudo' },
      { id: 'funil', label: 'Etapas do Funil' },
      { id: 'gatilhos', label: 'Gatilhos' },
      { id: 'motivos', label: 'Motivos de Perda' }
    ];
    return [];
  };

  const subTabs = getSubTabs();

  // --- COMPONENTE DE TABELA ---
  return (
    <div className="flex flex-col h-full bg-brand-dark text-slate-200 p-6 space-y-6">
      
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <Edit3 className="text-brand-orange" /> Editor de Configurações
        </h2>
        {/* Botão Global de Adicionar (Contextual) */}
        {activeTab !== 'candidatos' && (
          <button 
            onClick={() => handleOpenModal()}
            className="bg-brand-orange hover:bg-orange-600 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 shadow-lg transition-all"
          >
            <Plus size={20}/> Novo Item
          </button>
        )}
      </div>

      {/* Navegação Principal (Abas) */}
      <div className="flex border-b border-brand-border space-x-1">
        {[
          { id: 'candidatos', label: 'Candidatos' },
          { id: 'cargos', label: 'Cargos' },
          { id: 'vagas', label: 'Vagas' },
          { id: 'pipeline', label: 'Pipeline' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id); setActiveSubTab('todos'); }}
            className={`px-6 py-3 font-bold text-sm rounded-t-lg transition-colors ${
              activeTab === tab.id 
                ? 'bg-brand-card text-brand-cyan border-t-2 border-brand-cyan' 
                : 'text-slate-500 hover:text-slate-300 hover:bg-brand-card/50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Sub-Navegação (Filtros de Categoria) */}
      {subTabs.length > 0 && (
        <div className="flex gap-2 pb-2 overflow-x-auto custom-scrollbar">
          {subTabs.map(st => (
            <button
              key={st.id}
              onClick={() => setActiveSubTab(st.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${
                activeSubTab === st.id
                  ? 'bg-brand-cyan/20 text-brand-cyan border-brand-cyan'
                  : 'bg-transparent text-slate-400 border-slate-600 hover:border-slate-400'
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>
      )}

      {/* Barra de Ferramentas */}
      <div className="bg-brand-card p-4 rounded-xl border border-brand-border flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 text-slate-500" size={18} />
          <input 
            className="w-full bg-brand-dark border border-brand-border rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:border-brand-cyan outline-none transition-colors"
            placeholder={`Buscar em ${activeTab}...`}
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="text-xs text-slate-500 font-medium">
          {currentData.length} registros
        </div>
      </div>

      {/* Tabela de Dados */}
      <div className="flex-1 bg-brand-card rounded-xl border border-brand-border shadow-lg overflow-hidden flex flex-col">
        <div className="overflow-auto flex-1 custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead className="bg-brand-dark/80 text-xs uppercase text-slate-400 font-bold sticky top-0 z-10 backdrop-blur-sm">
              <tr>
                <th className="p-4 w-16 text-center">#</th>
                <th className="p-4">Nome / Identificador</th>
                <th className="p-4">Categoria / Tipo</th>
                <th className="p-4 w-32 text-center">Obrigatório</th>
                <th className="p-4 w-32 text-center">Visível</th>
                <th className="p-4 w-32 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border text-sm">
              {currentData.length > 0 ? currentData.map((item, idx) => (
                <TableRow 
                  key={item.id || idx} 
                  item={item} 
                  idx={idx} 
                  onDelete={() => handleDelete(item.id, item.category)}
                  onEdit={() => handleOpenModal(item)}
                />
              )) : (
                <tr>
                  <td colSpan="6" className="p-12 text-center text-slate-500 italic">
                    Nenhum item encontrado nesta visualização.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Simplificado */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-brand-card w-full max-w-md rounded-xl border border-brand-border shadow-2xl p-6 animate-in zoom-in-95">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-white">
                {modalMode === 'create' ? 'Adicionar Novo' : 'Editar Item'}
              </h3>
              <button onClick={() => setIsModalOpen(false)}><X className="text-slate-400 hover:text-white"/></button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-brand-cyan uppercase mb-1.5">Nome do Campo/Item</label>
                <input 
                  className="w-full bg-brand-dark border border-brand-border p-3 rounded-lg text-white focus:border-brand-orange outline-none"
                  value={currentItem.name}
                  onChange={e => setCurrentItem({...currentItem, name: e.target.value})}
                  autoFocus
                />
              </div>
              
              {/* Seletor de Categoria se estiver em "Tudo" na aba Vagas */}
              {activeTab === 'vagas' && activeSubTab === 'todos' && modalMode === 'create' && (
                <div>
                  <label className="block text-xs font-bold text-brand-cyan uppercase mb-1.5">Categoria</label>
                  <select 
                    className="w-full bg-brand-dark border border-brand-border p-3 rounded-lg text-white focus:border-brand-orange outline-none"
                    value={currentItem.category}
                    onChange={e => setCurrentItem({...currentItem, category: e.target.value})}
                  >
                    <option value="cidades">Cidade</option>
                    <option value="empresas">Empresa</option>
                    <option value="areas">Área de Interesse</option>
                  </select>
                </div>
              )}

              <div className="flex gap-4 pt-4">
                 <div className="flex items-center gap-2 cursor-pointer" onClick={() => setCurrentItem({...currentItem, required: !currentItem.required})}>
                    {currentItem.required ? <CheckSquare className="text-brand-orange"/> : <Square className="text-slate-600"/>}
                    <span className="text-sm">Obrigatório</span>
                 </div>
                 <div className="flex items-center gap-2 cursor-pointer" onClick={() => setCurrentItem({...currentItem, visible: !currentItem.visible})}>
                    {currentItem.visible !== false ? <Eye className="text-brand-cyan"/> : <EyeOff className="text-slate-600"/>}
                    <span className="text-sm">Visível</span>
                 </div>
              </div>
            </div>

            <div className="mt-8 flex justify-end gap-3">
              <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-400 hover:text-white">Cancelar</button>
              <button onClick={handleSave} className="bg-brand-orange text-white px-6 py-2 rounded-lg font-bold hover:bg-orange-600 flex items-center gap-2">
                <Save size={18}/> Salvar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

// Subcomponente de Linha para gerenciar estado local de UI (toggle imediato)
const TableRow = ({ item, idx, onDelete, onEdit }) => {
  // Estado local para feedback instantâneo da UI
  const [localItem, setLocalItem] = useState(item);

  useEffect(() => { setLocalItem(item); }, [item]);

  const toggleRequired = () => setLocalItem(prev => ({ ...prev, required: !prev.required }));
  const toggleVisible = () => setLocalItem(prev => ({ ...prev, visible: prev.visible === false ? true : false }));

  return (
    <tr className="hover:bg-brand-dark/30 transition-colors group">
      <td className="p-4 text-center text-slate-500 font-mono text-xs">{idx + 1}</td>
      <td className="p-4">
        <span className="font-bold text-white block">{localItem.name}</span>
        <span className="text-xs text-slate-500">{localItem.id}</span>
      </td>
      <td className="p-4">
        <span className="px-2 py-1 rounded text-xs border border-slate-600 bg-slate-700/50 text-slate-300 uppercase tracking-wider">
          {localItem.category || localItem.type}
        </span>
      </td>
      <td className="p-4 text-center">
        <button onClick={toggleRequired} className="hover:scale-110 transition-transform">
          {localItem.required 
            ? <CheckSquare size={18} className="text-green-400 mx-auto"/> 
            : <Square size={18} className="text-slate-600 mx-auto"/>}
        </button>
      </td>
      <td className="p-4 text-center">
        <button onClick={toggleVisible} className="hover:scale-110 transition-transform">
          {localItem.visible !== false 
            ? <Eye size={18} className="text-brand-cyan mx-auto"/> 
            : <EyeOff size={18} className="text-slate-600 mx-auto"/>}
        </button>
      </td>
      <td className="p-4 text-right">
        {!localItem.immutable && (
          <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={onEdit} className="p-2 text-blue-400 hover:bg-blue-400/10 rounded-lg transition-colors"><Edit3 size={16}/></button>
            <button onClick={onDelete} className="p-2 text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"><Trash2 size={16}/></button>
          </div>
        )}
      </td>
    </tr>
  );
};
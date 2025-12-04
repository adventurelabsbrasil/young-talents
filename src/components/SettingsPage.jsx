import React, { useState, useMemo } from 'react';
import { 
  Search, Plus, Filter, MoreHorizontal, Edit3, Trash2, 
  ArrowUp, ArrowDown, Eye, EyeOff, CheckSquare, Square,
  ChevronLeft, ChevronRight, Calendar
} from 'lucide-react';

export default function SettingsPage({ 
  companies, onAddCompany, onDelCompany,
  cities, onAddCity, onDelCity,
  interestAreas, onAddInterest, onDelInterest,
  roles, onAddRole, onDelRole,
  origins, onAddOrigin, onDelOrigin,
  schooling, onAddSchooling, onDelSchooling,
  marital, onAddMarital, onDelMarital,
  tags, onAddTag, onDelTag,
  onOpenCsvModal
}) {
  // Estado Principal
  const [activeTab, setActiveTab] = useState('empresas');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'createdAt', direction: 'desc' });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Estado para Edição/Criação
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [newItemData, setNewItemData] = useState({ name: '', type: 'text', required: false, visible: true });

  // Definição das Abas e suas Fontes de Dados
  const tabs = [
    { id: 'empresas', label: 'Empresas', data: companies, handler: onAddCompany, deleter: onDelCompany, type: 'list' },
    { id: 'cidades', label: 'Cidades', data: cities, handler: onAddCity, deleter: onDelCity, type: 'list' },
    { id: 'areas', label: 'Áreas de Interesse', data: interestAreas, handler: onAddInterest, deleter: onDelInterest, type: 'list' },
    { id: 'cargos', label: 'Cargos', data: roles, handler: onAddRole, deleter: onDelRole, type: 'list' },
    { id: 'escolaridade', label: 'Escolaridade', data: schooling, handler: onAddSchooling, deleter: onDelSchooling, type: 'list' },
    { id: 'civil', label: 'Estado Civil', data: marital, handler: onAddMarital, deleter: onDelMarital, type: 'list' },
    { id: 'origens', label: 'Origens', data: origins, handler: onAddOrigin, deleter: onDelOrigin, type: 'list' },
    { id: 'tags', label: 'Tags', data: tags, handler: onAddTag, deleter: onDelTag, type: 'list' },
    // Abas de Estrutura (Mockadas para visualização conforme pedido, pois requerem backend específico para edição real de schema)
    { id: 'candidatos', label: 'Campos Candidato', data: [], handler: () => {}, deleter: () => {}, type: 'schema' },
    { id: 'vagas', label: 'Campos Vaga', data: [], handler: () => {}, deleter: () => {}, type: 'schema' },
    { id: 'pipeline', label: 'Pipeline', data: [], handler: () => {}, deleter: () => {}, type: 'schema' }
  ];

  const currentTabConfig = tabs.find(t => t.id === activeTab);

  // Processamento de Dados (Filtro e Ordenação)
  const processedData = useMemo(() => {
    let data = currentTabConfig?.data || [];
    
    // Mock de dados para abas de Schema (apenas visualização por enquanto)
    if (activeTab === 'candidatos' && data.length === 0) {
        data = [
            { id: 'sys_1', name: 'Nome Completo', type: 'text', required: true, visible: true, createdAt: '2023-01-01' },
            { id: 'sys_2', name: 'Email', type: 'email', required: true, visible: true, createdAt: '2023-01-01' },
            { id: 'sys_3', name: 'Telefone', type: 'phone', required: true, visible: true, createdAt: '2023-01-01' },
            { id: 'sys_4', name: 'Pretensão Salarial', type: 'financeiro', required: false, visible: true, createdAt: '2023-05-10' },
        ];
    }

    // 1. Filtrar
    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      data = data.filter(item => 
        item.name?.toLowerCase().includes(lower) || 
        item.id?.toLowerCase().includes(lower)
      );
    }

    // 2. Ordenar
    return [...data].sort((a, b) => {
      if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1;
      if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [currentTabConfig, searchTerm, sortConfig, activeTab]);

  // Paginação
  const totalPages = Math.ceil(processedData.length / itemsPerPage);
  const paginatedData = processedData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Handlers
  const handleSort = (key) => {
    setSortConfig(current => ({
      key,
      direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handleSave = () => {
    if (newItemData.name.trim()) {
        if (currentTabConfig.handler) {
            // Se for edição, precisaríamos de uma função de update no App.jsx, 
            // aqui simulamos apenas criação para as listas simples
            currentTabConfig.handler(newItemData.name); 
        }
        setIsModalOpen(false);
        setNewItemData({ name: '', type: 'text', required: false, visible: true });
        setEditingItem(null);
    }
  };

  const openModal = (item = null) => {
    if (item) {
        setEditingItem(item);
        setNewItemData({ ...item, type: item.type || 'option' });
    } else {
        setEditingItem(null);
        setNewItemData({ name: '', type: currentTabConfig.type === 'list' ? 'Opção de Lista' : 'Texto', required: false, visible: true });
    }
    setIsModalOpen(true);
  };

  const handleDelete = (id) => {
      if (confirm('Tem certeza que deseja excluir este item?')) {
          currentTabConfig.deleter(id);
      }
  };

  // Renderização de Colunas Dinâmicas
  const renderCell = (item, column) => {
    switch(column) {
        case 'created': 
            return item.createdAt?.seconds 
                ? new Date(item.createdAt.seconds * 1000).toLocaleDateString('pt-BR')
                : (item.createdAt ? new Date(item.createdAt).toLocaleDateString('pt-BR') : '-');
        case 'id': return <span className="font-mono text-xs text-slate-500">{item.id.slice(0, 8)}...</span>;
        case 'order': return <span className="text-slate-400">#</span>; // Placeholder para drag-n-drop futuro
        case 'name': return <span className="font-bold text-white">{item.name}</span>;
        case 'type': return (
            <span className="px-2 py-1 rounded text-xs bg-slate-700 border border-slate-600 text-slate-300">
                {currentTabConfig.type === 'list' ? 'Opção Seleção' : (item.type || 'Texto')}
            </span>
        );
        case 'required': return item.required 
            ? <CheckSquare size={16} className="text-green-400"/> 
            : <Square size={16} className="text-slate-600"/>;
        case 'visible': return item.visible !== false 
            ? <Eye size={16} className="text-brand-cyan"/> 
            : <EyeOff size={16} className="text-slate-600"/>;
        default: return null;
    }
  };

  return (
    <div className="flex flex-col h-full bg-brand-dark space-y-6">
      
      {/* Header & Controls */}
      <div className="flex flex-col gap-6">
        <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-white">Configurações do Sistema</h2>
            <button 
                onClick={() => openModal()}
                className="bg-brand-orange text-white px-4 py-2 rounded-lg font-bold hover:bg-orange-600 flex items-center gap-2 transition-all shadow-lg hover:shadow-orange-500/20"
            >
                <Plus size={20}/> Criar {currentTabConfig.type === 'list' ? 'Item' : 'Campo'}
            </button>
        </div>

        {/* Tabs Scrollable */}
        <div className="border-b border-brand-border overflow-x-auto custom-scrollbar">
            <div className="flex gap-2 min-w-max pb-2">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => { setActiveTab(tab.id); setCurrentPage(1); }}
                        className={`px-4 py-2 rounded-t-lg text-sm font-bold transition-all border-b-2 ${
                            activeTab === tab.id 
                            ? 'text-brand-cyan border-brand-cyan bg-brand-cyan/5' 
                            : 'text-slate-400 border-transparent hover:text-white hover:bg-brand-card'
                        }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>
        </div>

        {/* Filters Toolbar */}
        <div className="flex gap-4 items-center bg-brand-card p-4 rounded-xl border border-brand-border">
            <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-2.5 text-slate-400" size={18}/>
                <input 
                    type="text" 
                    placeholder={`Buscar em ${currentTabConfig.label}...`}
                    className="w-full bg-brand-dark border border-brand-border rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:border-brand-cyan outline-none"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                />
            </div>
            <div className="h-8 w-px bg-brand-border mx-2"></div>
            <div className="flex items-center gap-2 text-sm text-slate-400">
                <Filter size={16}/>
                <span>{processedData.length} registros encontrados</span>
            </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="flex-1 bg-brand-card rounded-xl border border-brand-border shadow-xl overflow-hidden flex flex-col">
        <div className="overflow-x-auto flex-1">
            <table className="w-full text-left text-sm">
                <thead className="bg-brand-dark/50 text-slate-400 border-b border-brand-border uppercase text-xs font-bold">
                    <tr>
                        <th className="p-4 w-12 text-center cursor-pointer hover:text-white" onClick={() => handleSort('order')}>Ordem</th>
                        <th className="p-4 cursor-pointer hover:text-white group" onClick={() => handleSort('name')}>
                            <div className="flex items-center gap-1">Nome do Campo {sortConfig.key === 'name' && (sortConfig.direction === 'asc' ? <ArrowUp size={12}/> : <ArrowDown size={12}/>)}</div>
                        </th>
                        <th className="p-4 w-24">ID</th>
                        <th className="p-4">Tipo</th>
                        <th className="p-4 text-center">Obrigatório</th>
                        <th className="p-4 text-center">Visível</th>
                        <th className="p-4 w-32 cursor-pointer hover:text-white" onClick={() => handleSort('createdAt')}>
                            <div className="flex items-center gap-1"><Calendar size={14}/> Criação</div>
                        </th>
                        <th className="p-4 text-right">Ações</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-brand-border">
                    {paginatedData.length > 0 ? paginatedData.map((item, index) => (
                        <tr key={item.id || index} className="hover:bg-brand-dark/30 transition-colors group">
                            <td className="p-4 text-center text-slate-500">{index + 1 + ((currentPage-1)*itemsPerPage)}</td>
                            <td className="p-4">{renderCell(item, 'name')}</td>
                            <td className="p-4">{renderCell(item, 'id')}</td>
                            <td className="p-4">{renderCell(item, 'type')}</td>
                            <td className="p-4 text-center">{renderCell(item, 'required')}</td>
                            <td className="p-4 text-center">{renderCell(item, 'visible')}</td>
                            <td className="p-4 text-slate-400 text-xs">{renderCell(item, 'created')}</td>
                            <td className="p-4 text-right">
                                <div className="flex items-center justify-end gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => openModal(item)} className="p-2 text-blue-400 hover:bg-blue-400/10 rounded"><Edit3 size={16}/></button>
                                    <button onClick={() => handleDelete(item.id)} className="p-2 text-red-400 hover:bg-red-400/10 rounded"><Trash2 size={16}/></button>
                                </div>
                            </td>
                        </tr>
                    )) : (
                        <tr>
                            <td colSpan="8" className="p-12 text-center text-slate-500">
                                Nenhum item encontrado nesta categoria.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>

        {/* Pagination */}
        <div className="p-4 border-t border-brand-border bg-brand-dark/30 flex justify-between items-center">
            <span className="text-xs text-slate-500">Página {currentPage} de {totalPages || 1}</span>
            <div className="flex gap-2">
                <button 
                    onClick={() => setCurrentPage(p => Math.max(1, p-1))}
                    disabled={currentPage === 1}
                    className="p-2 rounded bg-brand-dark border border-brand-border text-slate-400 hover:text-white disabled:opacity-50"
                >
                    <ChevronLeft size={16}/>
                </button>
                <button 
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p+1))}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded bg-brand-dark border border-brand-border text-slate-400 hover:text-white disabled:opacity-50"
                >
                    <ChevronRight size={16}/>
                </button>
            </div>
        </div>
      </div>

      {/* Modal de Criação/Edição */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
            <div className="bg-brand-card w-full max-w-lg rounded-xl border border-brand-border shadow-2xl p-6 animate-in zoom-in-95 duration-200">
                <h3 className="text-xl font-bold text-white mb-6">
                    {editingItem ? 'Editar' : 'Novo'} {currentTabConfig.type === 'list' ? 'Item' : 'Campo'} em <span className="text-brand-orange">{currentTabConfig.label}</span>
                </h3>
                
                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-brand-cyan uppercase mb-1.5">Nome do Campo / Item</label>
                        <input 
                            className="w-full bg-brand-dark border border-brand-border p-3 rounded text-white outline-none focus:border-brand-orange"
                            placeholder="Ex: Nome Completo ou Google Inc"
                            value={newItemData.name}
                            onChange={e => setNewItemData({...newItemData, name: e.target.value})}
                            autoFocus
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-brand-cyan uppercase mb-1.5">Tipo de Dado</label>
                            <select 
                                className="w-full bg-brand-dark border border-brand-border p-3 rounded text-white outline-none focus:border-brand-orange"
                                value={newItemData.type}
                                onChange={e => setNewItemData({...newItemData, type: e.target.value})}
                                disabled={currentTabConfig.type === 'list'} // Listas são sempre 'option' visualmente
                            >
                                <option value="text">Texto Simples</option>
                                <option value="long_text">Texto Longo</option>
                                <option value="number">Número</option>
                                <option value="date">Data</option>
                                <option value="select">Lista de Seleção</option>
                                <option value="financeiro">Financeiro (R$)</option>
                                {currentTabConfig.type === 'list' && <option value="Opção de Lista">Opção de Lista</option>}
                            </select>
                        </div>
                        <div className="flex flex-col gap-2 pt-6">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input 
                                    type="checkbox" 
                                    className="accent-brand-orange w-4 h-4"
                                    checked={newItemData.required}
                                    onChange={e => setNewItemData({...newItemData, required: e.target.checked})}
                                    disabled={currentTabConfig.type === 'list'}
                                />
                                <span className="text-sm text-white">Obrigatório</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input 
                                    type="checkbox" 
                                    className="accent-brand-cyan w-4 h-4"
                                    checked={newItemData.visible}
                                    onChange={e => setNewItemData({...newItemData, visible: e.target.checked})}
                                />
                                <span className="text-sm text-white">Visível no Formulário</span>
                            </label>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-3 mt-8">
                    <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-400 hover:text-white">Cancelar</button>
                    <button onClick={handleSave} className="bg-brand-orange text-white px-6 py-2 rounded font-bold hover:bg-orange-600">Salvar Alterações</button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
}
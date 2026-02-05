import React, { useState, useMemo } from 'react';
import {
    ArrowRight, Check, AlertCircle, CalendarCheck
} from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend, LineChart, Line
} from 'recharts';

import { PIPELINE_STAGES } from '../../../constants';
import { getCandidateTimestamp } from '../../../utils/timestampUtils';
import { normalizeCity } from '../../../utils/cityNormalizer';
import { normalizeSource } from '../../../utils/sourceNormalizer';
import { normalizeInterestArea } from '../../../utils/interestAreaNormalizer';

// Material Design Colors (Google)
const MATERIAL_COLORS = [
    '#4285F4', // Google Blue
    '#34A853', // Google Green
    '#FBBC04', // Google Yellow
    '#EA4335', // Google Red
    '#9C27B0', // Purple
    '#FF9800', // Orange
    '#00BCD4', // Cyan
    '#E91E63', // Pink
    '#3F51B5', // Indigo
    '#009688', // Teal
];

const COLORS = MATERIAL_COLORS;

// Dashboard com Gráficos
const Dashboard = ({
    candidatesLoading = false,
    filteredJobs,
    filteredCandidates,
    totalCandidatesCount = 0,
    totalSubmissionsCount = 0,
    onOpenCandidates,
    onSetModalTitle,
    onNavigateToCandidates,
    onNavigateToJobs,
    statusMovements = [],
    applications: applicationsProp = [],
    onViewJob,
    interviews = [],
    onScheduleInterview
}) => {
    const applications = applicationsProp || [];
    const [periodFilter, setPeriodFilter] = useState('today'); // Filtro de período para gráficos (padrão: Hoje)
    const [showCustomPeriod, setShowCustomPeriod] = useState(false);
    const [customDateStart, setCustomDateStart] = useState('');
    const [customDateEnd, setCustomDateEnd] = useState('');

    // Filtrar candidatos por período para scorecards (usa getCandidateTimestamp: original_timestamp prioridade, depois createdAt)
    const filteredCandidatesByPeriod = useMemo(() => {
        if (periodFilter === 'all') return filteredCandidates;
        if (periodFilter === 'custom' && customDateStart && customDateEnd) {
            const startDate = new Date(customDateStart).getTime() / 1000;
            const endDate = new Date(customDateEnd).getTime() / 1000 + 86400;
            return filteredCandidates.filter(c => {
                const ts = getCandidateTimestamp(c);
                if (!ts) return false;
                return ts >= startDate && ts <= endDate;
            });
        }

        const now = Date.now() / 1000;
        const periods = {
            'today': 1 * 24 * 60 * 60,
            '7d': 7 * 24 * 60 * 60,
            '30d': 30 * 24 * 60 * 60,
            '90d': 90 * 24 * 60 * 60
        };

        const cutoff = now - (periods[periodFilter] || 0);

        return filteredCandidates.filter(c => {
            const ts = getCandidateTimestamp(c);
            if (!ts) return false;
            return ts >= cutoff;
        });
    }, [filteredCandidates, periodFilter, customDateStart, customDateEnd]);

    // Filtrar statusMovements por período
    const filteredMovements = useMemo(() => {
        if (!periodFilter || periodFilter === 'all') return statusMovements;
        if (periodFilter === 'custom' && customDateStart && customDateEnd) {
            const startDate = new Date(customDateStart).getTime();
            const endDate = new Date(customDateEnd).getTime() + 86400000;
            return statusMovements.filter(m => {
                const ts = m.timestamp?.seconds || m.timestamp?._seconds || 0;
                const timestampMs = ts * 1000;
                return timestampMs >= startDate && timestampMs <= endDate;
            });
        }

        const now = Date.now();
        const periods = {
            'today': 24 * 60 * 60 * 1000,
            '7d': 7 * 24 * 60 * 60 * 1000,
            '30d': 30 * 24 * 60 * 60 * 1000,
            '90d': 90 * 24 * 60 * 60 * 1000
        };

        const cutoff = now - (periods[periodFilter] || 0);

        return statusMovements.filter(m => {
            const ts = m.timestamp?.seconds || m.timestamp?._seconds || 0;
            return ts * 1000 >= cutoff;
        });
    }, [statusMovements, periodFilter, customDateStart, customDateEnd]);

    // Próximas entrevistas (apenas futuras e não canceladas)
    const upcomingInterviews = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        return interviews
            .filter(i => {
                if (i.status === 'Cancelada' || i.status === 'Realizada') return false;
                const interviewDate = new Date(i.date);
                return interviewDate >= today;
            })
            .sort((a, b) => {
                const dateA = new Date(`${a.date}T${a.time}`);
                const dateB = new Date(`${b.date}T${b.time}`);
                return dateA - dateB;
            })
            .slice(0, 5); // Mostrar apenas as 5 próximas
    }, [interviews]);
    // Dados para gráficos - ordenados por status do pipeline (usando candidatos filtrados por período)
    const statusData = useMemo(() => {
        const counts = {};
        PIPELINE_STAGES.forEach(stage => {
            counts[stage] = filteredCandidatesByPeriod.filter(c => (c.status || 'Inscrito') === stage).length;
        });
        counts['Contratado'] = filteredCandidatesByPeriod.filter(c => c.status === 'Contratado').length;
        counts['Reprovado'] = filteredCandidatesByPeriod.filter(c => c.status === 'Reprovado').length;
        return Object.entries(counts).map(([name, value]) => ({ name, value }));
    }, [filteredCandidatesByPeriod]);

    // Calcular taxas de conversão BASEADAS NAS MOVIMENTAÇÕES REAIS
    // Conta quantos candidatos fizeram a transição de uma etapa para outra
    const conversionRates = useMemo(() => {
        const stages = [...PIPELINE_STAGES, 'Contratado'];
        const rates = [];

        // Se temos movimentações registradas, usa elas para calcular (com filtro de período)
        if (filteredMovements.length > 0) {
            for (let i = 0; i < stages.length - 1; i++) {
                const fromStage = stages[i];
                const toStage = stages[i + 1];

                // Conta movimentações que SAÍRAM desta etapa (filtradas por período)
                const movedFrom = filteredMovements.filter(m => m.previousStatus === fromStage).length;
                // Conta movimentações que foram PARA a próxima etapa (filtradas por período)
                const movedTo = filteredMovements.filter(m => m.previousStatus === fromStage && m.newStatus === toStage).length;

                // Também considera os que estão atualmente nesta etapa (usando candidatos filtrados por período)
                const currentInStage = filteredCandidatesByPeriod.filter(c => (c.status || 'Inscrito') === fromStage).length;
                const totalPassed = movedFrom + currentInStage;

                const rate = totalPassed > 0 ? ((movedTo / totalPassed) * 100).toFixed(1) : 0;

                rates.push({
                    from: fromStage,
                    to: toStage,
                    rate: parseFloat(rate),
                    fromCount: totalPassed,
                    toCount: movedTo,
                    hasMovements: true
                });
            }
        } else {
            // Fallback: cálculo simplificado baseado no status atual (menos preciso)
            for (let i = 0; i < stages.length - 1; i++) {
                const current = filteredCandidatesByPeriod.filter(c => c.status === stages[i]).length;
                const next = filteredCandidatesByPeriod.filter(c => c.status === stages[i + 1]).length;
                const rate = current > 0 ? ((next / current) * 100).toFixed(1) : 0;
                rates.push({
                    from: stages[i],
                    to: stages[i + 1],
                    rate: parseFloat(rate),
                    fromCount: current,
                    toCount: next,
                    hasMovements: false
                });
            }
        }
        return rates;
    }, [filteredCandidatesByPeriod, filteredMovements]);

    // Total de movimentações registradas (para mostrar indicador)
    const totalMovements = filteredMovements.length;

    // Dados com taxas de conversão para o gráfico de status
    const statusDataWithConversion = useMemo(() => {
        return statusData.map((item, index) => {
            const conversionRate = conversionRates.find(r => r.from === item.name);
            return {
                ...item,
                conversion: conversionRate ? `${conversionRate.rate}%` : null,
                conversionValue: conversionRate ? conversionRate.rate : null
            };
        });
    }, [statusData, conversionRates]);

    const areaData = useMemo(() => {
        const areas = {};
        // Usar filteredCandidates quando período é 'all' ou quando não há dados no período filtrado
        const candidatesToUse = periodFilter === 'all' || filteredCandidatesByPeriod.length === 0
            ? filteredCandidates
            : filteredCandidatesByPeriod;
        candidatesToUse.forEach(c => {
            if (c.interestAreas) {
                const areasList = c.interestAreas.split(',').map(a => normalizeInterestArea(a.trim())).filter(a => a);
                areasList.forEach(area => {
                    areas[area] = (areas[area] || 0) + 1;
                });
            }
        });
        const total = candidatesToUse.length;
        return Object.entries(areas)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([name, value]) => ({
                name,
                value,
                percentage: total > 0 ? ((value / total) * 100).toFixed(1) : 0
            }));
    }, [filteredCandidatesByPeriod, filteredCandidates, periodFilter]);

    // Cidades ordenadas do maior para o menor (normalizadas para agregação coerente)
    const cityData = useMemo(() => {
        const cities = {};
        // Usar filteredCandidates quando período é 'all' ou quando não há dados no período filtrado
        const candidatesToUse = periodFilter === 'all' || filteredCandidatesByPeriod.length === 0
            ? filteredCandidates
            : filteredCandidatesByPeriod;
        candidatesToUse.forEach(c => {
            if (c.city) {
                const norm = normalizeCity(c.city);
                if (norm) cities[norm] = (cities[norm] || 0) + 1;
            }
        });
        return Object.entries(cities)
            .sort((a, b) => b[1] - a[1]) // Ordenar do maior para o menor
            .slice(0, 5)
            .map(([name, value]) => ({ name, value }));
    }, [filteredCandidatesByPeriod, filteredCandidates, periodFilter]);

    const originData = useMemo(() => {
        const origins = {};
        // Usar filteredCandidates quando período é 'all' ou quando não há dados no período filtrado
        const candidatesToUse = periodFilter === 'all' || filteredCandidatesByPeriod.length === 0
            ? filteredCandidates
            : filteredCandidatesByPeriod;
        candidatesToUse.forEach(c => {
            if (c.source) {
                const norm = normalizeSource(c.source);
                if (norm) origins[norm] = (origins[norm] || 0) + 1;
            }
        });
        const total = candidatesToUse.length;
        return Object.entries(origins)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([name, value]) => ({
                name,
                value,
                percentage: total > 0 ? ((value / total) * 100).toFixed(1) : 0
            }));
    }, [filteredCandidatesByPeriod, filteredCandidates, periodFilter]);

    // Inscrições por dia (para gráfico de linha/barras)
    const inscriptionsPerDayData = useMemo(() => {
        const byDay = {};
        filteredCandidatesByPeriod.forEach(c => {
            const ts = getCandidateTimestamp(c);
            if (!ts) return;
            const d = new Date(ts * 1000);
            const y = d.getFullYear();
            const m = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            const key = `${y}-${m}-${day}`;
            byDay[key] = (byDay[key] || 0) + 1;
        });
        return Object.entries(byDay)
            .sort((a, b) => a[0].localeCompare(b[0]))
            .map(([date, count]) => {
                const [y, m, d] = date.split('-');
                return { date, label: `${d}/${m}`, count };
            });
    }, [filteredCandidatesByPeriod]);

    const missingReturnCount = useMemo(() => {
        return filteredCandidatesByPeriod.filter(c => {
            const isSelectionStage = c.status === 'Seleção' || c.status === 'Selecionado';
            const needsReturn = !c.returnSent || c.returnSent === 'Pendente' || c.returnSent === 'Não';
            return isSelectionStage && needsReturn;
        }).length;
    }, [filteredCandidates]);

    const jobStats = {
        open: filteredJobs.filter(j => j.status === 'Aberta').length,
        filled: filteredJobs.filter(j => j.status === 'Preenchida').length,
        closed: filteredJobs.filter(j => j.status === 'Fechada').length,
    };

    const candidateStats = {
        total: filteredCandidatesByPeriod.length,
        hired: filteredCandidatesByPeriod.filter(c => c.status === 'Contratado').length,
        rejected: filteredCandidatesByPeriod.filter(c => c.status === 'Reprovado').length,
        active: filteredCandidatesByPeriod.filter(c => PIPELINE_STAGES.includes(c.status || 'Inscrito')).length,
    };

    // Taxa de conversão geral (Inscrito -> Contratado)
    const overallConversionRate = candidateStats.total > 0
        ? ((candidateStats.hired / candidateStats.total) * 100).toFixed(1)
        : 0;

    // Tooltip customizado com melhor contraste para light e dark mode
    const tooltipStyle = {
        backgroundColor: 'rgba(15, 23, 42, 0.95)', // slate-900 com opacidade
        border: '2px solid #3b82f6', // blue-500
        borderRadius: '8px',
        color: '#f1f5f9', // slate-100 - texto claro
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.2)',
        padding: '12px',
        fontSize: '14px',
        fontWeight: '500'
    };

    // Estados para controlar visibilidade das séries (legendas clicáveis)
    const [visibleAreaSeries, setVisibleAreaSeries] = useState(new Set());
    const [visibleOriginSeries, setVisibleOriginSeries] = useState(new Set());

    if (candidatesLoading) {
        return (
            <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
                <span>Carregando candidatos...</span>
            </div>
        );
    }

    return (
        <div className="text-gray-900 dark:text-white space-y-6 overflow-y-auto h-full pb-6">
            <div className="flex justify-between items-center mb-2 flex-wrap gap-2">
                <div className="flex items-center gap-3">
                    <h2 className="text-2xl font-bold">Dashboard</h2>
                    <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium">
                        Total geral: {totalCandidatesCount} pessoas {totalSubmissionsCount > totalCandidatesCount && <span className="text-slate-500">({totalSubmissionsCount} envios)</span>}
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <label className="text-sm text-gray-600 dark:text-gray-400">Período:</label>
                    <select
                        value={periodFilter}
                        onChange={e => {
                            const value = e.target.value;
                            setPeriodFilter(value);
                            setShowCustomPeriod(value === 'custom');
                            if (value !== 'custom') {
                                setCustomDateStart('');
                                setCustomDateEnd('');
                            }
                        }}
                        className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    >
                        <option value="today">Hoje</option>
                        <option value="all">Todo o período</option>
                        <option value="7d">Últimos 7 dias</option>
                        <option value="30d">Últimos 30 dias</option>
                        <option value="90d">Últimos 90 dias</option>
                        <option value="custom">Período personalizado</option>
                    </select>
                    {showCustomPeriod && (
                        <div className="flex items-center gap-2">
                            <input
                                type="date"
                                value={customDateStart}
                                onChange={e => setCustomDateStart(e.target.value)}
                                className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white outline-none focus:border-blue-500"
                                placeholder="Data inicial"
                            />
                            <span className="text-gray-600 dark:text-gray-400">até</span>
                            <input
                                type="date"
                                value={customDateEnd}
                                onChange={e => setCustomDateEnd(e.target.value)}
                                className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white outline-none focus:border-blue-500"
                                placeholder="Data final"
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* KPIs Principais - Material Design Colors: ao clicar navega para lista filtrada */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div onClick={() => onNavigateToCandidates ? onNavigateToCandidates('/candidates') : (onOpenCandidates && onOpenCandidates(filteredCandidates))} className="cursor-pointer bg-gradient-to-br from-[#4285F4]/20 to-[#4285F4]/10 p-6 rounded-xl border border-[#4285F4]/30 hover:scale-[1.01] transition-transform shadow-lg hover:shadow-[#4285F4]/20">
                    <h3 className="text-gray-700 dark:text-gray-300 text-sm font-semibold">Total de Candidatos</h3>
                    <p className="text-3xl font-bold text-[#4285F4] mt-2">{candidateStats.total}</p>
                    <p className="text-xs text-gray-500 dark:text-slate-500 mt-1">{candidateStats.active} em processo</p>
                </div>
                <div onClick={() => onNavigateToCandidates ? onNavigateToCandidates('/candidates?status=Contratado') : (onOpenCandidates && onOpenCandidates(filteredCandidates.filter(c => c.status === 'Contratado')))} className="cursor-pointer bg-gradient-to-br from-[#34A853]/20 to-[#34A853]/10 p-6 rounded-xl border border-[#34A853]/30 hover:scale-[1.01] transition-transform shadow-lg hover:shadow-[#34A853]/20">
                    <h3 className="text-gray-700 dark:text-gray-300 text-sm font-semibold">Contratados</h3>
                    <p className="text-3xl font-bold text-[#34A853] mt-2">{candidateStats.hired}</p>
                    <p className="text-xs text-gray-500 dark:text-slate-500 mt-1">Taxa geral: {overallConversionRate}%</p>
                </div>
                <div onClick={() => onNavigateToJobs ? onNavigateToJobs('/jobs?status=Aberta') : (onNavigateToCandidates ? onNavigateToCandidates('/candidates?jobs=open') : (onOpenCandidates && onOpenCandidates(filteredJobs.filter(j => j.status === 'Aberta').flatMap(j => filteredCandidates.filter(c => c.jobId === j.id)))))} className="cursor-pointer bg-gradient-to-br from-[#FBBC04]/20 to-[#FBBC04]/10 p-6 rounded-xl border border-[#FBBC04]/30 hover:scale-[1.01] transition-transform shadow-lg hover:shadow-[#FBBC04]/20">
                    <h3 className="text-gray-700 dark:text-gray-300 text-sm font-semibold">Vagas Abertas</h3>
                    <p className="text-3xl font-bold text-[#FBBC04] mt-2">{jobStats.open}</p>
                    <p className="text-xs text-gray-500 dark:text-slate-500 mt-1">{jobStats.filled} preenchidas</p>
                </div>
                <div onClick={() => onNavigateToCandidates ? onNavigateToCandidates('/candidates?status=Reprovado') : (onOpenCandidates && onOpenCandidates(filteredCandidates.filter(c => c.status === 'Reprovado')))} className="cursor-pointer bg-gradient-to-br from-[#EA4335]/20 to-[#EA4335]/10 p-6 rounded-xl border border-[#EA4335]/30 hover:scale-[1.01] transition-transform shadow-lg hover:shadow-[#EA4335]/20">
                    <h3 className="text-gray-700 dark:text-gray-300 text-sm font-semibold">Reprovados</h3>
                    <p className="text-3xl font-bold text-[#EA4335] mt-2">{candidateStats.rejected}</p>
                    <p className="text-xs text-gray-500 dark:text-slate-500 mt-1">Taxa: {candidateStats.total > 0 ? ((candidateStats.rejected / candidateStats.total) * 100).toFixed(1) : 0}%</p>
                </div>
            </div>

            {/* Taxas de Conversão entre Etapas */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-lg">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-lg text-gray-900 dark:text-white">Taxas de Conversão por Etapa</h3>
                    <div className={`text-xs px-2 py-1 rounded ${totalMovements > 0 ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'}`}>
                        {totalMovements > 0 ? (
                            <span className="flex items-center gap-1">
                                <Check size={12} /> Baseado em {totalMovements} movimentações reais
                            </span>
                        ) : (
                            <span className="flex items-center gap-1">
                                <AlertCircle size={12} /> Dados estimados (mova candidatos para gerar histórico)
                            </span>
                        )}
                    </div>
                </div>
                <div className="flex flex-wrap gap-3">
                    {conversionRates.map((rate, idx) => (
                        <div key={idx} className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 px-3 py-2 rounded-lg">
                            <span className="text-xs text-gray-600 dark:text-gray-300">{rate.from}</span>
                            <ArrowRight size={12} className="text-gray-400" />
                            <span className="text-xs text-gray-600 dark:text-gray-300">{rate.to}</span>
                            <span className={`text-sm font-bold ${rate.rate >= 50 ? 'text-green-500' : rate.rate >= 25 ? 'text-yellow-500' : 'text-red-500'}`}>
                                {rate.rate}%
                            </span>
                            <span className="text-xs text-gray-500">({rate.toCount}/{rate.fromCount})</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Card rápido: falta dar retorno */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div onClick={() => {
                    if (onNavigateToCandidates) {
                        onNavigateToCandidates('/candidates?filter=missing-return');
                    } else if (onOpenCandidates) {
                        if (onSetModalTitle) onSetModalTitle('Faltam dar retorno');
                        onOpenCandidates(filteredCandidates.filter(c => {
                            const isSelectionStage = c.status === 'Seleção' || c.status === 'Selecionado';
                            const needsReturn = !c.returnSent || c.returnSent === 'Pendente' || c.returnSent === 'Não';
                            return isSelectionStage && needsReturn;
                        }));
                    }
                }} className="cursor-pointer bg-gradient-to-br from-[#9C27B0]/20 to-[#9C27B0]/10 p-4 rounded-xl border border-[#9C27B0]/30 hover:scale-[1.01] transition-transform shadow-lg hover:shadow-[#9C27B0]/20">
                    <div className="text-gray-700 dark:text-gray-300 text-sm">Faltam dar retorno</div>
                    <div className="text-2xl font-bold text-[#9C27B0] mt-2">{missingReturnCount}</div>
                    <div className="text-xs text-gray-500 dark:text-slate-500 mt-1">Candidatos selecionados sem confirmação</div>
                </div>
            </div>

            {/* Próximas Entrevistas */}
            {upcomingInterviews.length > 0 && (
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-lg">
                    <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <CalendarCheck className="text-purple-500" size={20} /> Próximas Entrevistas
                    </h3>
                    <div className="space-y-3">
                        {upcomingInterviews.map(interview => {
                            const interviewDate = new Date(interview.date);
                            const isToday = interviewDate.toDateString() === new Date().toDateString();
                            const isTomorrow = interviewDate.toDateString() === new Date(Date.now() + 86400000).toDateString();

                            return (
                                <div
                                    key={interview.id}
                                    className={`flex items-center justify-between p-4 rounded-lg border transition-colors ${isToday
                                            ? 'bg-purple-50 dark:bg-purple-900/20 border-purple-300 dark:border-purple-700'
                                            : 'bg-gray-50 dark:bg-gray-900/50 border-gray-200 dark:border-gray-700'
                                        }`}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`w-12 h-12 rounded-lg flex flex-col items-center justify-center ${isToday ? 'bg-purple-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                                            }`}>
                                            <span className="text-xs font-medium">
                                                {interviewDate.toLocaleDateString('pt-BR', { weekday: 'short' }).toUpperCase()}
                                            </span>
                                            <span className="text-lg font-bold">{interviewDate.getDate()}</span>
                                        </div>
                                        <div>
                                            <h4 className="font-medium text-gray-900 dark:text-white">
                                                {interview.candidateName}
                                                {isToday && <span className="ml-2 text-xs bg-purple-500 text-white px-2 py-0.5 rounded">HOJE</span>}
                                                {isTomorrow && <span className="ml-2 text-xs bg-yellow-500 text-white px-2 py-0.5 rounded">AMANHÃ</span>}
                                            </h4>
                                            <p className="text-sm text-gray-700 dark:text-gray-300">
                                                {interview.type} {interview.jobTitle && `• ${interview.jobTitle}`}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-bold text-gray-900 dark:text-white">{interview.time}</div>
                                        <div className="text-xs text-gray-500">
                                            {interview.isOnline ? 'Online' : `${interview.location || 'Presencial'}`}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Vagas com Candidaturas */}
            {applications.length > 0 && filteredJobs.filter(j => j.status === 'Aberta').length > 0 && (
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-lg">
                    <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-4">Vagas Abertas - Candidaturas</h3>
                    <div className="space-y-3">
                        {filteredJobs.filter(j => j.status === 'Aberta').map(job => {
                            const jobApps = applications.filter(a => a.jobId === job.id);
                            const hired = jobApps.filter(a => a.status === 'Contratado').length;
                            const inProcess = jobApps.filter(a => PIPELINE_STAGES.includes(a.status)).length;
                            const rejected = jobApps.filter(a => a.status === 'Reprovado').length;

                            return (
                                <div
                                    key={job.id}
                                    onClick={() => onViewJob && onViewJob(job)}
                                    className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-500 cursor-pointer transition-colors"
                                >
                                    <div>
                                        <h4 className="font-medium text-gray-900 dark:text-white">{job.title}</h4>
                                        <p className="text-xs text-gray-500">{job.company} {job.city && `• ${job.city}`}</p>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="text-center">
                                            <div className="text-lg font-bold text-blue-600">{jobApps.length}</div>
                                            <div className="text-xs text-gray-500">total</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-lg font-bold text-yellow-600">{inProcess}</div>
                                            <div className="text-xs text-gray-500">em processo</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-lg font-bold text-green-600">{hired}</div>
                                            <div className="text-xs text-gray-500">contratados</div>
                                        </div>
                                        {rejected > 0 && (
                                            <div className="text-center">
                                                <div className="text-lg font-bold text-red-500">{rejected}</div>
                                                <div className="text-xs text-gray-500">reprovados</div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Gráficos */}
            <div className="grid grid-cols-1 gap-6">
                {/* Distribuição por Status com Taxa de Conversão */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-lg">
                    <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-4">Distribuição por Status (com Taxa de Conversão)</h3>
                    {statusData.some(d => d.value > 0) ? (
                        <ResponsiveContainer width="100%" height={380}>
                            <BarChart data={statusDataWithConversion} layout="vertical" margin={{ top: 5, right: 80, left: 180, bottom: 5 }}>
                                <defs>
                                    <linearGradient id="gradient-status" x1="0" y1="0" x2="1" y2="0">
                                        <stop offset="0%" stopColor="#4285F4" stopOpacity={1} />
                                        <stop offset="100%" stopColor="#1a56db" stopOpacity={1} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                <XAxis type="number" stroke="#94a3b8" />
                                <YAxis type="category" dataKey="name" stroke="#94a3b8" width={170} tick={{ fontSize: 12 }} />
                                <Tooltip
                                    contentStyle={tooltipStyle}
                                    cursor={{ fill: 'rgba(255,255,255,0.1)' }}
                                    formatter={(value, name, props) => {
                                        const conv = props.payload.conversion;
                                        return [
                                            <span key="v">{value} candidatos{conv ? ` (→ ${conv} conversão)` : ''}</span>,
                                            'Quantidade'
                                        ];
                                    }}
                                />
                                <Bar
                                    dataKey="value"
                                    fill="url(#gradient-status)"
                                    radius={[0, 8, 8, 0]}
                                    isAnimationActive={true}
                                    animationBegin={0}
                                    animationDuration={800}
                                    label={{
                                        position: 'right',
                                        fill: '#94a3b8',
                                        fontSize: 11,
                                        formatter: (value, entry) => {
                                            const item = statusDataWithConversion.find(d => d.value === value);
                                            return item?.conversion ? `${value} (${item.conversion})` : value;
                                        }
                                    }}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-[380px] flex items-center justify-center text-gray-500">Sem dados</div>
                    )}
                </div>

                {/* Inscrições por dia */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-lg">
                    <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-4">Candidatos inscritos por dia</h3>
                    {inscriptionsPerDayData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={280}>
                            <LineChart data={inscriptionsPerDayData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                <XAxis dataKey="label" stroke="#94a3b8" tick={{ fontSize: 11 }} />
                                <YAxis stroke="#94a3b8" allowDecimals={false} tick={{ fontSize: 11 }} />
                                <Tooltip
                                    contentStyle={tooltipStyle}
                                    labelFormatter={(_, payload) => payload?.[0]?.payload?.date ? new Date(payload[0].payload.date + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' }) : ''}
                                    formatter={(value) => [`${value} inscrições`, 'Quantidade']}
                                />
                                <Line type="monotone" dataKey="count" stroke="#4285F4" strokeWidth={2} dot={{ fill: '#4285F4', r: 4 }} activeDot={{ r: 6 }} name="Inscrições" />
                            </LineChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-[280px] flex items-center justify-center text-gray-500">Nenhuma inscrição no período selecionado</div>
                    )}
                </div>

                {/* Top 5 Áreas de Interesse - DONUT */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-lg">
                    <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-4">Principais Áreas de Interesse</h3>
                    {areaData.length > 0 && areaData.some(d => d.value > 0) ? (
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <defs>
                                    {areaData.filter(d => d.value > 0).map((entry, index) => {
                                        const baseColor = COLORS[index % COLORS.length];
                                        const gradients = {
                                            '#4285F4': ['#4285F4', '#1a56db'],
                                            '#34A853': ['#34A853', '#15803d'],
                                            '#FBBC04': ['#FBBC04', '#d97706'],
                                            '#EA4335': ['#EA4335', '#dc2626'],
                                            '#00BCD4': ['#00BCD4', '#0891b2'],
                                        };
                                        const [light, dark] = gradients[baseColor] || [baseColor, baseColor];
                                        return (
                                            <linearGradient key={`gradient-area-${index}`} id={`gradient-area-${index}`} x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor={light} stopOpacity={1} />
                                                <stop offset="100%" stopColor={dark} stopOpacity={1} />
                                            </linearGradient>
                                        );
                                    })}
                                </defs>
                                <Pie
                                    data={areaData.filter(d => d.value > 0 && (visibleAreaSeries.size === 0 || visibleAreaSeries.has(d.name)))}
                                    cx="50%"
                                    cy="45%"
                                    innerRadius={60}
                                    outerRadius={100}
                                    fill="#8884d8"
                                    dataKey="value"
                                    labelLine={false}
                                    label={({ value, percentage }) => `${value} (${percentage}%)`}
                                    isAnimationActive={true}
                                    animationBegin={0}
                                    animationDuration={800}
                                >
                                    {areaData.filter(d => d.value > 0).map((entry, index) => {
                                        const isVisible = visibleAreaSeries.size === 0 || visibleAreaSeries.has(entry.name);
                                        return (
                                            <Cell
                                                key={`cell-${index}`}
                                                fill={isVisible ? `url(#gradient-area-${index})` : '#e5e7eb'}
                                                opacity={isVisible ? 1 : 0.3}
                                            />
                                        );
                                    })}
                                </Pie>
                                <Tooltip
                                    contentStyle={tooltipStyle}
                                    formatter={(value, name, props) => [`${value} (${props.payload.percentage}%)`, name]}
                                />
                                <Legend
                                    verticalAlign="bottom"
                                    height={50}
                                    wrapperStyle={{ fontSize: 11, cursor: 'pointer' }}
                                    onClick={(e) => {
                                        const name = e.value;
                                        setVisibleAreaSeries(prev => {
                                            const newSet = new Set(prev);
                                            if (newSet.has(name)) {
                                                newSet.delete(name);
                                            } else {
                                                newSet.add(name);
                                            }
                                            return newSet;
                                        });
                                    }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-[300px] flex items-center justify-center text-gray-500">Sem dados</div>
                    )}
                </div>

                {/* Origem dos Candidatos - DONUT */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-lg">
                    <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-4">Origem dos Candidatos</h3>
                    {originData.length > 0 && originData.some(d => d.value > 0) ? (
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <defs>
                                    {originData.filter(d => d.value > 0).map((entry, index) => {
                                        const baseColor = COLORS[index % COLORS.length];
                                        const gradients = {
                                            '#4285F4': ['#4285F4', '#1a56db'],
                                            '#34A853': ['#34A853', '#15803d'],
                                            '#FBBC04': ['#FBBC04', '#d97706'],
                                            '#EA4335': ['#EA4335', '#dc2626'],
                                            '#00BCD4': ['#00BCD4', '#0891b2'],
                                        };
                                        const [light, dark] = gradients[baseColor] || [baseColor, baseColor];
                                        return (
                                            <linearGradient key={`gradient-origin-${index}`} id={`gradient-origin-${index}`} x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor={light} stopOpacity={1} />
                                                <stop offset="100%" stopColor={dark} stopOpacity={1} />
                                            </linearGradient>
                                        );
                                    })}
                                </defs>
                                <Pie
                                    data={originData.filter(d => d.value > 0 && (visibleOriginSeries.size === 0 || visibleOriginSeries.has(d.name)))}
                                    cx="50%"
                                    cy="45%"
                                    innerRadius={60}
                                    outerRadius={100}
                                    fill="#8884d8"
                                    dataKey="value"
                                    labelLine={false}
                                    label={({ value, percentage }) => `${value} (${percentage}%)`}
                                    isAnimationActive={true}
                                    animationBegin={0}
                                    animationDuration={800}
                                >
                                    {originData.filter(d => d.value > 0).map((entry, index) => {
                                        const isVisible = visibleOriginSeries.size === 0 || visibleOriginSeries.has(entry.name);
                                        return (
                                            <Cell
                                                key={`cell-origin-${index}`}
                                                fill={isVisible ? `url(#gradient-origin-${index})` : '#e5e7eb'}
                                                opacity={isVisible ? 1 : 0.3}
                                            />
                                        );
                                    })}
                                </Pie>
                                <Tooltip
                                    contentStyle={tooltipStyle}
                                    formatter={(value, name, props) => [`${value} (${props.payload.percentage}%)`, name]}
                                />
                                <Legend
                                    verticalAlign="bottom"
                                    height={50}
                                    wrapperStyle={{ fontSize: 11, cursor: 'pointer' }}
                                    onClick={(e) => {
                                        const name = e.value;
                                        setVisibleOriginSeries(prev => {
                                            const newSet = new Set(prev);
                                            if (newSet.has(name)) {
                                                newSet.delete(name);
                                            } else {
                                                newSet.add(name);
                                            }
                                            return newSet;
                                        });
                                    }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-[300px] flex items-center justify-center text-gray-500">Sem dados</div>
                    )}
                </div>

                {/* Top 5 Cidades - Ordenado do maior para o menor */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-lg">
                    <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-4">Candidatos por Cidade (Top 5)</h3>
                    {cityData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={cityData} layout="vertical" margin={{ top: 5, right: 30, left: 200, bottom: 5 }}>
                                <defs>
                                    <linearGradient id="gradient-city" x1="0" y1="0" x2="1" y2="0">
                                        <stop offset="0%" stopColor="#00BCD4" stopOpacity={1} />
                                        <stop offset="100%" stopColor="#0891b2" stopOpacity={1} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                <XAxis type="number" stroke="#94a3b8" />
                                <YAxis type="category" dataKey="name" stroke="#94a3b8" width={190} tick={{ fontSize: 12 }} />
                                <Tooltip
                                    contentStyle={tooltipStyle}
                                    cursor={{ fill: 'rgba(255,255,255,0.1)' }}
                                />
                                <Bar
                                    dataKey="value"
                                    fill="url(#gradient-city)"
                                    radius={[0, 8, 8, 0]}
                                    isAnimationActive={true}
                                    animationBegin={0}
                                    animationDuration={800}
                                    label={{
                                        position: 'inside',
                                        fill: '#ffffff',
                                        fontSize: 12,
                                        fontWeight: 'bold',
                                        formatter: (value) => value
                                    }}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-[300px] flex items-center justify-center text-gray-500">Sem dados</div>
                    )}
                </div>

                {/* Status de Vagas - Barras Verticais */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-lg">
                    <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-4">Status das Vagas</h3>
                    {jobStats.open > 0 || jobStats.filled > 0 || jobStats.closed > 0 ? (
                        <ResponsiveContainer width="100%" height={280}>
                            <BarChart
                                data={[
                                    { name: 'Abertas', value: jobStats.open, fill: '#FBBC04' },
                                    { name: 'Preenchidas', value: jobStats.filled, fill: '#34A853' },
                                    { name: 'Fechadas', value: jobStats.closed, fill: '#9E9E9E' }
                                ]}
                                margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                            >
                                <defs>
                                    <linearGradient id="gradient-jobs-open" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#FBBC04" stopOpacity={1} />
                                        <stop offset="100%" stopColor="#d97706" stopOpacity={1} />
                                    </linearGradient>
                                    <linearGradient id="gradient-jobs-filled" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#34A853" stopOpacity={1} />
                                        <stop offset="100%" stopColor="#15803d" stopOpacity={1} />
                                    </linearGradient>
                                    <linearGradient id="gradient-jobs-closed" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#9E9E9E" stopOpacity={1} />
                                        <stop offset="100%" stopColor="#6b7280" stopOpacity={1} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                <XAxis dataKey="name" stroke="#94a3b8" tick={{ fontSize: 12 }} />
                                <YAxis stroke="#94a3b8" />
                                <Tooltip
                                    contentStyle={tooltipStyle}
                                    cursor={{ fill: 'rgba(255,255,255,0.1)' }}
                                />
                                <Bar
                                    dataKey="value"
                                    radius={[8, 8, 0, 0]}
                                    isAnimationActive={true}
                                    animationBegin={0}
                                    animationDuration={800}
                                    label={{ position: 'top', fill: '#94a3b8', fontSize: 14, fontWeight: 'bold' }}
                                >
                                    <Cell fill="url(#gradient-jobs-open)" />
                                    <Cell fill="url(#gradient-jobs-filled)" />
                                    <Cell fill="url(#gradient-jobs-closed)" />
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-[280px] flex items-center justify-center text-gray-500">Sem dados</div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;

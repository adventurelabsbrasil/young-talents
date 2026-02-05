import React from 'react';
import { Mail, Phone, MapPin, Briefcase, TrendingUp, Clock as ClockIcon } from 'lucide-react';
import { STATUS_COLORS, PIPELINE_STAGES } from '../../../constants';
import { photoDisplayUrl } from '../../../utils/urlUtils';

export default function OverviewTab({
    candidate,
    scorecards,
    photoLoadError,
    setPhotoLoadError
}) {
    return (
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

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Contato e Essenciais */}
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <Mail size={20} />
                        Informações de Contato
                    </h2>
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <Mail size={16} className="text-gray-400" />
                            <div>
                                <p className="text-xs text-gray-500 dark:text-gray-400">E-mail Principal</p>
                                <p className="text-sm font-medium text-gray-900 dark:text-white">
                                    {candidate.email || 'Não informado'}
                                </p>
                            </div>
                        </div>
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
                        <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
                            <h3 className="text-xs font-bold text-gray-400 uppercase mb-3">Resumo de Filtros</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">Pretensão Salarial</p>
                                    <p className="text-sm font-medium text-gray-900 dark:text-white">{candidate.salaryExpectation || 'N/A'}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">Disponibilidade Mudança</p>
                                    <p className="text-sm font-medium text-gray-900 dark:text-white">{candidate.canRelocate || 'N/A'}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Status e Perfil Rápido */}
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <TrendingUp size={20} />
                        Status e Links
                    </h2>
                    <div className="space-y-4">
                        <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Status Atual no Funil</p>
                            <span className={`inline-block px-3 py-1 rounded text-sm font-medium ${STATUS_COLORS[candidate.status] || 'bg-slate-600 text-white'}`}>
                                {candidate.status || 'Inscrito'}
                            </span>
                        </div>

                        <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
                            <h3 className="text-xs font-bold text-gray-400 uppercase mb-3">Links Rápidos</h3>
                            <div className="flex flex-wrap gap-2">
                                {candidate.cvUrl ? (
                                    <a href={candidate.cvUrl} target="_blank" rel="noopener noreferrer" className="px-4 py-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors border border-blue-200 dark:border-blue-800">
                                        Ver Currículo (CV)
                                    </a>
                                ) : (
                                    <span className="px-4 py-2 bg-gray-50 dark:bg-gray-800 text-gray-400 rounded-lg text-sm border border-gray-200 dark:border-gray-700 cursor-not-allowed">
                                        CV não anexado
                                    </span>
                                )}
                                {candidate.portfolioUrl && (
                                    <a href={candidate.portfolioUrl} target="_blank" rel="noopener noreferrer" className="px-4 py-2 bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-lg text-sm font-medium hover:bg-purple-100 transition-colors border border-purple-200 dark:border-purple-800">
                                        Portfólio
                                    </a>
                                )}
                            </div>
                        </div>

                        <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
                            <h3 className="text-xs font-bold text-gray-400 uppercase mb-1">Bio/Campo Livre</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400 italic">
                                {candidate.freeField ? `"${candidate.freeField.substring(0, 150)}${candidate.freeField.length > 150 ? '...' : ''}"` : 'Nenhuma observação adicional.'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

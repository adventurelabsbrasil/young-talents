import React from 'react';
import { X, User, MapPin, Mail, Phone } from 'lucide-react';
import { STATUS_COLORS } from '../../constants';

export default function JobCandidatesModal({ isOpen, onClose, job, candidates }) {
  if (!isOpen || !job) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      <div className="bg-brand-card rounded-xl shadow-2xl w-full max-w-4xl h-[80vh] flex flex-col border border-brand-border">
        <div className="p-6 border-b border-brand-border flex justify-between items-center bg-brand-dark/50">
          <div>
            <h3 className="font-bold text-xl text-white">Candidatos: {job.title}</h3>
            <p className="text-sm text-brand-cyan">{candidates.length} inscritos</p>
          </div>
          <button onClick={onClose}><X className="text-slate-400 hover:text-white"/></button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 bg-brand-dark">
           {candidates.length === 0 ? (
             <div className="text-center text-slate-500 py-10">Nenhum candidato aplicado a esta vaga ainda.</div>
           ) : (
             <div className="grid gap-4">
                {candidates.map(c => (
                    <div key={c.id} className="bg-brand-card p-4 rounded-lg border border-brand-border flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:border-brand-orange/50 transition-colors">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-white font-bold border border-brand-border">
                                {c.photoUrl ? <img src={c.photoUrl} className="w-full h-full object-cover rounded-full"/> : <User size={20}/>}
                            </div>
                            <div>
                                <h4 className="font-bold text-white">{c.fullName}</h4>
                                <div className="flex flex-wrap gap-3 text-xs text-slate-400 mt-1">
                                    <span className="flex items-center gap-1"><Mail size={12}/> {c.email}</span>
                                    <span className="flex items-center gap-1"><Phone size={12}/> {c.phone}</span>
                                    <span className="flex items-center gap-1"><MapPin size={12}/> {c.city || 'N/D'}</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
                            <span className={`px-3 py-1 rounded-full text-xs font-bold border ${STATUS_COLORS[c.status] || 'bg-slate-700 text-slate-300'}`}>
                                {c.status}
                            </span>
                            {c.score && <span className="text-brand-orange font-bold text-sm">Match: {c.score}%</span>}
                        </div>
                    </div>
                ))}
             </div>
           )}
        </div>
        
        <div className="p-4 border-t border-brand-border bg-brand-dark/50 flex justify-end">
             <button onClick={onClose} className="bg-brand-hover text-white px-4 py-2 rounded text-sm hover:bg-slate-600">Fechar</button>
        </div>
      </div>
    </div>
  );
}
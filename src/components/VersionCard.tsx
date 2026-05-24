import React, { useState } from 'react';
import { GameVersion } from '../supabase';
import { Download, Sparkles, CheckCircle2, AlertTriangle, Calendar, ChevronDown, ChevronUp, Code } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface VersionCardProps {
  version: GameVersion;
}

export const VersionCard: React.FC<VersionCardProps> = ({ version }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const formattedDate = version.created_at
    ? new Date(version.created_at).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : 'Data desconhecida';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="bg-[#1A1A1E] border border-zinc-800/80 rounded-2xl p-6 hover:border-springfield-yellow/40 transition-all duration-300 shadow-xl relative overflow-hidden group"
    >
      {/* Decorative colored glow at the corner of stable vs debug versions */}
      <div 
        className={`absolute top-0 right-0 w-32 h-32 -mr-16 -mt-16 rounded-full blur-3xl opacity-10 transition-opacity duration-500 group-hover:opacity-25 ${
          version.is_stable ? 'bg-emerald-500' : 'bg-springfield-yellow'
        }`}
      />

      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 relative z-10">
        <div>
          {/* Badge & Date */}
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-medium flex items-center gap-1 ${
              version.is_stable 
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                : 'bg-springfield-yellow/10 text-springfield-yellow border border-springfield-yellow/20'
            }`}>
              {version.is_stable ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Estável (Debug)
                </>
              ) : (
                <>
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Experimental
                </>
              )}
            </span>
            <span className="text-zinc-500 text-xs flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              {formattedDate}
            </span>
            <span className="bg-zinc-800/50 text-zinc-300 font-mono text-xs px-2 py-0.5 rounded border border-zinc-700/40">
              {version.version_code}
            </span>
          </div>

          <h3 className="text-xl font-display font-bold text-white tracking-tight group-hover:text-springfield-yellow transition-colors duration-200">
            {version.title}
          </h3>
          <p className="text-zinc-400 text-sm mt-2 leading-relaxed max-w-2xl">
            {version.description}
          </p>
        </div>

        {/* Download Button */}
        <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-3 w-full sm:w-auto mt-2 sm:mt-0 self-stretch sm:self-start">
          <a
            href={version.download_url === '#' ? undefined : version.download_url}
            onClick={(e) => {
              if (version.download_url === '#') {
                e.preventDefault();
                alert('Aviso: Esta é uma versão conceitual arquivada ou o APK direto está em compilação na nuvem. Use os guias abaixo para testar!');
              }
            }}
            id={`btn-download-${version.version_code}`}
            className="flex-1 sm:flex-none bg-springfield-yellow hover:bg-[#ebd541] text-zinc-950 font-medium px-5 py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95 text-sm font-semibold cursor-pointer"
          >
            <Download className="w-4 h-4" />
            Baixar APK
          </a>
          
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1 text-zinc-400 hover:text-white text-xs px-3 py-2.5 hover:bg-zinc-800/40 rounded-xl transition duration-150"
          >
            {isExpanded ? 'Ocultar detalhes' : 'Ver logs da IA'}
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Expandable Changelog & AI Integration Report */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="border-t border-zinc-800/60 mt-5 pt-5 space-y-4">
              {/* Changelog Bullets */}
              <div>
                <h4 className="text-sm font-semibold text-zinc-300 font-display flex items-center gap-2 mb-2">
                  <span className="w-1.5 h-1.5 bg-springfield-blue rounded-full" />
                  Registro de Alterações (Changelog):
                </h4>
                <ul className="space-y-1.5 pl-3.5">
                  {version.change_log && version.change_log.length > 0 ? (
                    version.change_log.map((change, idx) => (
                      <li key={idx} className="text-zinc-400 text-xs leading-relaxed flex items-start gap-1.5">
                        <span className="text-zinc-600 font-mono mt-0.5">•</span>
                        <span>{change}</span>
                      </li>
                    ))
                  ) : (
                    <li className="text-zinc-500 text-xs italic">Nenhum evento registrado nesta compilação.</li>
                  )}
                </ul>
              </div>

              {/* AI Details Warning Accent Box */}
              {version.ai_involvement && (
                <div className="bg-purple-950/10 border border-purple-900/40 rounded-xl p-4 flex gap-3 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-1 opacity-10">
                    <Sparkles className="w-12 h-12 text-purple-400" />
                  </div>
                  <Sparkles className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <h5 className="text-xs font-semibold text-purple-300 tracking-wide uppercase font-mono flex items-center gap-1">
                      IA Assistida (Processamento Autônomo)
                    </h5>
                    <p className="text-zinc-300 text-xs leading-relaxed">
                      {version.ai_involvement}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

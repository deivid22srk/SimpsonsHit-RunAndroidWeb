import React, { useState, useEffect } from 'react';
import { 
  getVersions, 
  getFeedback, 
  addFeedback, 
  voteFeedback, 
  GameVersion, 
  UserFeedback,
  FALLBACK_VERSIONS,
  FALLBACK_FEEDBACK
} from './supabase';
import { VersionCard } from './components/VersionCard';
import { FeedbackItem } from './components/FeedbackItem';
import { 
  Sparkles, 
  Cpu, 
  AlertTriangle, 
  MessageSquare, 
  BookOpen, 
  Info, 
  Smartphone, 
  X, 
  Layers, 
  Search, 
  Filter, 
  Send,
  Download,
  CheckCircle,
  HelpCircle,
  Activity,
  Clipboard,
  Database
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  // Main database lists state
  const [versions, setVersions] = useState<GameVersion[]>([]);
  const [feedback, setFeedback] = useState<UserFeedback[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSchemaMissing, setIsSchemaMissing] = useState(false);
  const [showSqlCopyPanel, setShowSqlCopyPanel] = useState(false);

  // Filters & Tabs Navigation
  const [activeTab, setActiveTab] = useState<'versions' | 'feedback' | 'guide'>('versions');
  const [searchQuery, setSearchQuery] = useState('');
  const [feedbackFilter, setFeedbackFilter] = useState<'all' | 'bug' | 'suggestion' | 'general'>('all');

  // Form State: Feedback
  const [formNickname, setFormNickname] = useState('');
  const [formType, setFormType] = useState<'suggestion' | 'bug' | 'general'>('suggestion');
  const [formContent, setFormContent] = useState('');
  const [formVersion, setFormVersion] = useState('');
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);

  // Toast Notifications System
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'warning' | 'info' } | null>(null);

  const showToast = (text: string, type: 'success' | 'warning' | 'info' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 5000);
  };

  // Load initial real data from Supabase
  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const vData = await getVersions();
        const fData = await getFeedback();
        setVersions(vData || []);
        setFeedback(fData || []);
        setIsSchemaMissing(false);
        if (vData && vData.length > 0) {
          setFormVersion(vData[0].version_code);
        }
      } catch (err: any) {
        console.error('Error loading database tables from Supabase:', err);
        const errMsg = err?.message || '';
        if (errMsg.includes('schema cache') || errMsg.includes('relation') || errMsg.includes('does not exist') || errMsg.includes('not found')) {
          setIsSchemaMissing(true);
          setVersions(FALLBACK_VERSIONS);
          setFeedback(FALLBACK_FEEDBACK);
          setFormVersion(FALLBACK_VERSIONS[0].version_code);
          showToast('Tabelas não encontradas no Supabase. Usando dados locais para demonstração!', 'warning');
        } else {
          showToast('Falha ao conectar com o Supabase. Usando dados de cache.', 'warning');
          setVersions(FALLBACK_VERSIONS);
          setFeedback(FALLBACK_FEEDBACK);
          setFormVersion(FALLBACK_VERSIONS[0].version_code);
        }
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  // Handle Feedback Upvoting
  const handleVote = async (feedbackId: string, currentUpvotes: number) => {
    // Optimistic UI updates
    setFeedback(prev => 
      prev.map(f => f.id === feedbackId ? { ...f, upvotes: f.upvotes + 1 } : f)
    );
    showToast('Muito obrigado! Seu voto de apoio/relevância foi contabilizado.', 'success');

    try {
      await voteFeedback(feedbackId, currentUpvotes);
    } catch (err) {
      console.error('Error voting feedback on backend:', err);
    }
  };

  // Handle Feedback Insertion
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formNickname.trim() || !formContent.trim()) {
      showToast('Preencha todos os campos do formulário para prosseguir!', 'warning');
      return;
    }

    setIsSubmittingFeedback(true);

    const feedbackPayload = {
      nickname: formNickname.trim(),
      type: formType,
      content: formContent.trim(),
      version_affected: formVersion || undefined,
    };

    try {
      const added = await addFeedback(feedbackPayload);
      
      const newFeedbackItem: UserFeedback = added ? added : {
        ...feedbackPayload,
        id: Math.random().toString(),
        upvotes: 0,
        status: 'pending',
        created_at: new Date().toISOString()
      };

      setFeedback(prev => [newFeedbackItem, ...prev]);
      setFormContent('');
      showToast('Mensagem enviada! Seu feedback está salvo com segurança no banco de dados.', 'success');
    } catch (err) {
      console.error('Failed to publish feedback on Supabase:', err);
      showToast('Ocorreu um erro ao enviar para o Supabase. Tente novamente mais tarde.', 'warning');
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  // Filter versions by query matching key terms
  const filteredVersions = versions.filter(v => {
    const s = searchQuery.toLowerCase();
    return (
      v.version_code.toLowerCase().includes(s) ||
      v.title.toLowerCase().includes(s) ||
      v.description.toLowerCase().includes(s) ||
      (v.change_log && v.change_log.some(log => log.toLowerCase().includes(s))) ||
      (v.ai_involvement && v.ai_involvement.toLowerCase().includes(s))
    );
  });

  // Filter feedbacks
  const filteredFeedback = feedback.filter(f => {
    if (feedbackFilter === 'all') return true;
    return f.type === feedbackFilter;
  });

  return (
    <div className="min-h-screen bg-[#121214] text-[#E4E4E7] flex flex-col font-sans selection:bg-springfield-yellow selection:text-zinc-950">
      
      {/* Dynamic Toast Alerts */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-50 max-w-sm w-[90%] md:w-auto"
          >
            <div className={`px-4 py-3.5 rounded-xl shadow-2xl border text-xs font-medium flex items-center gap-2.5 ${
              toastMessage.type === 'success' 
                ? 'bg-emerald-950/95 border-emerald-500/40 text-emerald-300' 
                : toastMessage.type === 'warning'
                ? 'bg-rose-950/95 border-rose-500/40 text-rose-300'
                : 'bg-zinc-900 border-springfield-yellow/45 text-springfield-yellow'
            }`}>
              <Sparkles className="w-4.5 h-4.5 shrink-0" />
              <span>{toastMessage.text}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Styled Top Header with Navigation Bar integration */}
      <header className="border-b border-zinc-850 bg-[#16161A]/95 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-18 flex flex-col md:flex-row items-center justify-between gap-4 py-3 md:py-0">
          
          {/* Brand Logo & Name */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-springfield-yellow rounded-xl flex items-center justify-center shadow-md transform -rotate-1">
              <span className="font-display font-black text-zinc-950 text-lg tracking-tighter">H&R</span>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-sm font-display font-extrabold uppercase tracking-wider text-white">
                  Simpsons Hit & Run Port
                </h1>
                <span className="bg-purple-950 text-purple-400 font-mono text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wide">
                  IA
                </span>
              </div>
              <span className="text-[9px] text-zinc-500 font-mono block">MODIFICAÇÃO & DESENVOLVIMENTO DE VERSÕES</span>
            </div>
          </div>

          {/* Navigation Bar integration for tab routing */}
          <nav className="flex items-center bg-zinc-900/80 p-1 rounded-xl border border-zinc-800/60 w-full md:w-auto scrollbar-none overflow-x-auto self-stretch md:self-auto">
            <button
              onClick={() => setActiveTab('versions')}
              id="nav-btn-versions"
              className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition duration-200 cursor-pointer ${
                activeTab === 'versions'
                  ? 'bg-zinc-800 text-white shadow-sm border border-zinc-700/60'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800/30'
              }`}
            >
              <Cpu className="w-3.5 h-3.5" />
              Versões de Debug
            </button>

            <button
              onClick={() => setActiveTab('feedback')}
              id="nav-btn-feedback"
              className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition duration-200 cursor-pointer ${
                activeTab === 'feedback'
                  ? 'bg-zinc-800 text-white shadow-sm border border-zinc-700/60'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800/30'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              Sugestões e Feedback
              {feedback.length > 0 && (
                <span className="bg-springfield-blue text-white text-[9px] px-1.5 py-0.2 rounded-full font-bold">
                  {feedback.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('guide')}
              id="nav-btn-guide"
              className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition duration-200 cursor-pointer ${
                activeTab === 'guide'
                  ? 'bg-zinc-800 text-white shadow-sm border border-zinc-700/60'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800/30'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              Guia MT Manager
            </button>
          </nav>

        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8 space-y-8">
        
        {/* Banner de Aviso Crítico consolidado com a descrição do projeto por IA (Não esperar grandes coisas) */}
        <section className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 relative overflow-hidden shadow-xl animate-fade-in">
          <div className="absolute top-0 right-0 w-48 h-48 bg-springfield-blue/5 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex flex-col lg:flex-row items-start gap-5 relative z-10">
            <div className="p-3 bg-springfield-yellow/15 rounded-xl border border-springfield-yellow/30 shrink-0 self-start">
              <AlertTriangle className="w-7 h-7 text-springfield-yellow" />
            </div>

            <div className="space-y-3.5">
              <div>
                <h2 className="text-lg font-display font-extrabold text-white tracking-tight flex items-center gap-2">
                  <span>ATENÇÃO: DESENVOLVIMENTO EXPERIMENTAL ASSISTIDO POR IA</span>
                </h2>
                <p className="text-zinc-350 text-xs sm:text-sm leading-relaxed mt-1">
                  Este port para Android está sendo desenvolvido de forma experimental e reestruturado com o <strong>auxílio de Inteligência Artificial</strong>. Como a IA ajuda a refatorar o Radical Engine clássico a nível de código de forma automatizada, erros imprevisíveis de colisão, crashes inesperados e bugs bizarros fazem parte do processo de depuração diária. <strong className="text-springfield-yellow font-medium">Por favor, esteja ciente de que as modificações estão na fase experimental e não se deve esperar grandes coisas ou estabilidade polida</strong> em comparação com ports profissionais polidos nativos.
                </p>
              </div>

              {/* MT Manager Requirement Sub-Banner (Assinar APK) */}
              <div className="bg-[#1C1405] border border-amber-900/40 rounded-xl p-4 flex gap-3.5 items-start">
                <Smartphone className="w-4.5 h-4.5 text-springfield-yellow shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider font-mono">
                    🔑 Requisito de Instalação: Usar o MT Manager para Assinatura
                  </h4>
                  <p className="text-zinc-300 text-xs leading-relaxed">
                    Para instalar as builds de depuração sem conflito de pacotes no Android, <strong>é essencial assinar o APK usando o editor MT MANAGER</strong>. O Android rejeita instalações de APKs gerados que não possuam assinatura criptográfica de teste. Siga o roteamento no passo a passo da nossa guia.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Supabase Schema Missing Warning Block */}
        {isSchemaMissing && (
          <section className="bg-amber-955/40 border border-amber-500/30 rounded-2xl p-6 relative overflow-hidden shadow-lg animate-fade-in">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-550/5 rounded-full blur-2xl pointer-events-none" />
            
            <div className="flex flex-col lg:flex-row items-start gap-5 relative z-10 w-full">
              <div className="p-3 bg-amber-500/10 rounded-xl border border-amber-500/20 shrink-0 self-start">
                <Database className="w-6 h-6 text-amber-400" />
              </div>

              <div className="space-y-4 w-full">
                <div>
                  <h3 className="text-sm font-bold text-amber-300 uppercase tracking-widest font-mono flex items-center gap-2">
                    ⚡ Modo de Demonstração (Tabelas ausentes no Supabase)
                  </h3>
                  <p className="text-zinc-350 text-xs sm:text-xs leading-relaxed mt-1.5">
                    O aplicativo foi inicializado com sucesso, mas detectou que as tabelas <code className="text-amber-300 font-mono bg-amber-900/40 px-1 py-0.5 rounded text-[10px]">versions</code> e <code className="text-amber-300 font-mono bg-amber-900/40 px-1 py-0.5 rounded text-[10px]">feedback</code> ainda não foram criadas ou atualizadas no banco de dados do seu projeto do Supabase. <strong className="text-white">Para ativar a sincronia real e persistir novos dados</strong>, siga os passos abaixo para inicializar o seu esquema rapidamente no console do Supabase!
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="bg-zinc-900/60 p-3 rounded-lg border border-zinc-850">
                    <span className="text-amber-400 font-mono text-[10px] font-bold block mb-1">Passo 1</span>
                    <p className="text-[11px] text-zinc-400 leading-relaxed font-sans">Acesse o seu console do projeto no <strong>Supabase Dashboard</strong>.</p>
                  </div>
                  <div className="bg-zinc-900/60 p-3 rounded-lg border border-zinc-850">
                    <span className="text-amber-400 font-mono text-[10px] font-bold block mb-1">Passo 2</span>
                    <p className="text-[11px] text-zinc-400 leading-relaxed font-sans font-normal">Vá na guia <strong>SQL Editor</strong> e clique em <strong>"New Query"</strong>.</p>
                  </div>
                  <div className="bg-zinc-900/60 p-3 rounded-lg border border-zinc-850">
                    <span className="text-amber-400 font-mono text-[10px] font-bold block mb-1">Passo 3</span>
                    <p className="text-[11px] text-zinc-400 leading-relaxed font-sans font-normal">Copie o script SQL abaixo, cole e clique no botão de cor verde <strong>"Run"</strong> para criar as tabelas!</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 pt-1">
                  <button
                    onClick={() => setShowSqlCopyPanel(!showSqlCopyPanel)}
                    className="bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold px-4 py-2 rounded-xl text-xs transition active:scale-[0.98] cursor-pointer inline-flex items-center gap-2"
                  >
                    <span>{showSqlCopyPanel ? 'Ocultar Script SQL' : 'Ver / Copiar Script SQL Schema'}</span>
                  </button>
                  <button
                    onClick={() => {
                      const sqlString = `-- SQL Schema for The Simpsons: Hit & Run - AI Port Portal
CREATE TABLE IF NOT EXISTS public.versions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    version_code VARCHAR(50) NOT NULL UNIQUE,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    change_log TEXT[] DEFAULT '{}'::TEXT[],
    ai_involvement TEXT,
    download_url TEXT,
    is_stable BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.feedback (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nickname VARCHAR(100) NOT NULL,
    type VARCHAR(50) NOT NULL,
    content TEXT NOT NULL,
    upvotes INTEGER DEFAULT 0 NOT NULL,
    status VARCHAR(50) DEFAULT 'pending' NOT NULL,
    version_affected VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to versions" ON public.versions FOR SELECT USING (true);
CREATE POLICY "Allow public insert to versions" ON public.versions FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public read access to feedback" ON public.feedback FOR SELECT USING (true);
CREATE POLICY "Allow public insert to feedback" ON public.feedback FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update to upvotes" ON public.feedback FOR UPDATE USING (true) WITH CHECK (true);`;

                      navigator.clipboard.writeText(sqlString);
                      showToast('Script SQL copiado com sucesso!', 'success');
                    }}
                    className="bg-zinc-900/90 hover:bg-zinc-805 border border-zinc-700/80 text-zinc-100 font-semibold px-4 py-2 rounded-xl text-xs transition active:scale-[0.98] cursor-pointer inline-flex items-center gap-2"
                  >
                    <Clipboard className="w-3.5 h-3.5" />
                    <span>Copiar SQL</span>
                  </button>
                </div>

                {showSqlCopyPanel && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="bg-[#0B0B0D] border border-zinc-800 rounded-xl max-h-72 overflow-y-auto mt-2 text-[11px] font-mono leading-relaxed p-4 selection:bg-amber-900/50"
                  >
                    <div className="flex justify-between items-center text-zinc-500 pb-2 border-b border-zinc-900 mb-2">
                      <span>database-schema.sql</span>
                      <span>UTF-8 PostGreSQL</span>
                    </div>
                    <pre className="text-zinc-300 overflow-x-auto select-all">
{`-- SQL Schema for The Simpsons: Hit & Run - AI Port Portal

-- Create the versions table
CREATE TABLE IF NOT EXISTS public.versions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    version_code VARCHAR(50) NOT NULL UNIQUE,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    change_log TEXT[] DEFAULT '{}'::TEXT[],
    ai_involvement TEXT,
    download_url TEXT,
    is_stable BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create the feedback table
CREATE TABLE IF NOT EXISTS public.feedback (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nickname VARCHAR(100) NOT NULL,
    type VARCHAR(50) NOT NULL,
    content TEXT NOT NULL,
    upvotes INTEGER DEFAULT 0 NOT NULL,
    status VARCHAR(50) DEFAULT 'pending' NOT NULL,
    version_affected VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS Policies
ALTER TABLE public.versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to versions" ON public.versions FOR SELECT USING (true);
CREATE POLICY "Allow public insert to versions" ON public.versions FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public read access to feedback" ON public.feedback FOR SELECT USING (true);
CREATE POLICY "Allow public insert to feedback" ON public.feedback FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update to upvotes" ON public.feedback FOR UPDATE USING (true) WITH CHECK (true);`}
                    </pre>
                  </motion.div>
                )}
              </div>
            </div>
          </section>
        )}

        {/* Dynamic Pages / Sub view Render Depending on Active Navigation Tab */}
        <AnimatePresence mode="wait">
          
          {/* Tab 1: Versões do Jogo */}
          {activeTab === 'versions' && (
            <motion.div
              key="versions-panel"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
              className="space-y-6"
            >
              {/* Header section of sub-view */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-4">
                <div>
                  <h3 className="text-md font-display font-bold text-white flex items-center gap-2">
                    <Activity className="w-4 h-4 text-springfield-yellow" />
                    Compilações de Debug em Sincronia Real (Supabase)
                  </h3>
                  <p className="text-zinc-500 text-xs">Abaixo estão listados as builds autênticas do port carregadas do esquema do seu banco de dados.</p>
                </div>

                {/* Box de busca refinado */}
                <div className="relative w-full sm:max-w-xs">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">
                    <Search className="w-3.5 h-3.5" />
                  </span>
                  <input
                    type="text"
                    placeholder="Filtrar por versão, recursos ou IA..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-[#1A1A1E] border border-zinc-800 rounded-xl pl-9 pr-8 py-2 text-xs focus:border-springfield-yellow focus:outline-none placeholder-zinc-650 text-white"
                  />
                  {searchQuery && (
                    <button 
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>

              {/* Versions list */}
              <div className="space-y-4">
                {isLoading ? (
                  <div className="text-center py-20">
                    <div className="w-9 h-9 border-2 border-dashed border-springfield-yellow rounded-full animate-spin mx-auto mb-3" />
                    <p className="text-zinc-500 text-xs font-mono">Carregando versões de debug diretamente do banco Supabase...</p>
                  </div>
                ) : filteredVersions.length > 0 ? (
                  filteredVersions.map((v) => (
                    <VersionCard key={v.id || v.version_code} version={v} />
                  ))
                ) : (
                  <div className="text-center py-16 bg-[#1A1A1E] border border-zinc-800 rounded-xl">
                    <Layers className="w-9 h-9 text-zinc-600 mx-auto mb-3" />
                    <h3 className="text-xs font-semibold text-zinc-400">Nenhuma compilação correspondente encontrada</h3>
                    <p className="text-zinc-500 text-[11px] mt-1">Sua busca não trouxe resultados. Certifique-se de que os dados foram populados no Supabase.</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Tab 2: Feedback & Sugestões */}
          {activeTab === 'feedback' && (
            <motion.div
              key="feedback-panel"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start"
            >
              {/* Coluna de Exibição de feed de feedbacks */}
              <div className="lg:col-span-2 space-y-6">
                
                {/* Cabeçalho de filtragem */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#1A1A1E] border border-zinc-850 p-4 rounded-xl">
                  <div className="flex items-center gap-2 text-xs text-zinc-400 font-medium">
                    <Filter className="w-3.5 h-3.5" />
                    <span>Selecione a categoria:</span>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    {[
                      { id: 'all', label: 'Todos' },
                      { id: 'bug', label: 'Bugs' },
                      { id: 'suggestion', label: 'Sugestões' },
                      { id: 'general', label: 'Geral' }
                    ].map((item) => (
                      <button
                        key={item.id}
                        onClick={() => setFeedbackFilter(item.id as any)}
                        className={`px-3 py-1 rounded-lg text-xs font-medium transition cursor-pointer ${
                          feedbackFilter === item.id
                            ? 'bg-springfield-yellow/15 text-springfield-yellow border border-springfield-yellow/30'
                            : 'bg-zinc-900 border border-zinc-850 text-zinc-455 hover:text-white'
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Grid real preenchido pelo Supabase */}
                <div className="space-y-4">
                  {isLoading ? (
                    <div className="text-center py-20">
                      <div className="w-9 h-9 border-2 border-dashed border-springfield-blue rounded-full animate-spin mx-auto mb-3" />
                      <p className="text-zinc-500 text-xs font-mono">Buscando relatos salvos no Supabase...</p>
                    </div>
                  ) : filteredFeedback.length > 0 ? (
                    filteredFeedback.map((f) => (
                      <FeedbackItem 
                        key={f.id} 
                        feedback={f} 
                        onVote={handleVote} 
                      />
                    ))
                  ) : (
                    <div className="text-center py-16 bg-[#1A1A1E] border border-zinc-800 rounded-xl">
                      <MessageSquare className="w-9 h-9 text-zinc-650 mx-auto mb-3" />
                      <h3 className="text-xs font-semibold text-zinc-400">Nenhum feedback catalogado</h3>
                      <p className="text-zinc-500 text-[11px] mt-1">Preencha o formulário para inaugurar esta listagem.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Coluna 3 - Envio do feedback */}
              <div className="bg-[#1A1A1E] border border-zinc-850 rounded-xl p-5 shadow-lg space-y-4">
                <div className="border-b border-zinc-800 pb-3">
                  <h3 className="font-display font-bold text-white text-sm flex items-center gap-1.5">
                    <Send className="w-4 h-4 text-springfield-yellow" />
                    Cadastrar Sugestão ou Relato
                  </h3>
                  <p className="text-zinc-500 text-[10px] mt-1">Suas observações serão publicadas e conectadas ao Supabase de forma nativa.</p>
                </div>

                <form onSubmit={handleFormSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-400 block">Nick / Apelidado *</label>
                    <input
                      type="text"
                      placeholder="ex: BartSimpson_99"
                      value={formNickname}
                      onChange={(e) => setFormNickname(e.target.value)}
                      className="w-full bg-[#121214] border border-zinc-800 rounded-xl px-3 py-2 text-xs focus:border-springfield-yellow focus:outline-none text-white placeholder-zinc-700"
                      maxLength={40}
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-400 block">Especificidade</label>
                    <select
                      value={formType}
                      onChange={(e) => setFormType(e.target.value as any)}
                      className="w-full bg-[#121214] border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-300 focus:border-springfield-yellow focus:outline-none"
                    >
                      <option value="suggestion">💡 Sugestão de Melhoria</option>
                      <option value="bug">🐛 Relato de Bug / Crash</option>
                      <option value="general">💬 Feedback Geral do Port</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-400 block font-mono">Versão correspondente</label>
                    <select
                      value={formVersion}
                      onChange={(e) => setFormVersion(e.target.value)}
                      className="w-full bg-[#121214] border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-300 focus:border-springfield-yellow focus:outline-none font-mono"
                    >
                      <option value="">Nenhuma / Aplicável a todas</option>
                      {versions.map((v) => (
                        <option key={v.version_code} value={v.version_code}>
                          {v.version_code}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-400 block">Mensagem descritiva *</label>
                    <textarea
                      placeholder="Descreva o problema encontrado (ex: travou ao mudar texturas) ou a sua sugestão..."
                      value={formContent}
                      onChange={(e) => setFormContent(e.target.value)}
                      className="w-full bg-[#121214] border border-zinc-800 rounded-xl px-3 py-2 text-xs focus:border-springfield-yellow focus:outline-none text-white placeholder-zinc-700 h-24 resize-none leading-relaxed"
                      maxLength={500}
                      required
                    />
                    <div className="text-right text-[9px] text-zinc-650">
                      {formContent.length}/500 caracteres
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmittingFeedback}
                    className="w-full bg-springfield-yellow hover:bg-[#ebd541] font-bold text-zinc-950 py-2.5 rounded-xl text-xs transition active:scale-[0.98] cursor-pointer"
                  >
                    {isSubmittingFeedback ? 'Gravando no Banco...' : 'Publicar no Supabase'}
                  </button>
                </form>
              </div>
            </motion.div>
          )}

          {/* Tab 3: Guia MT Manager Manual */}
          {activeTab === 'guide' && (
            <motion.div
              key="guide-panel"
              initial={{ opacity: 0, scale: 0.99 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.99 }}
              transition={{ duration: 0.15 }}
              className="max-w-3xl mx-auto bg-[#1A1A1E] border border-zinc-800/80 rounded-2xl p-6 sm:p-8 space-y-6"
            >
              <div className="flex items-center gap-3 border-b border-zinc-800 pb-4">
                <div className="w-10 h-10 bg-springfield-blue/10 rounded-xl flex items-center justify-center border border-springfield-blue/20">
                  <Smartphone className="w-5 h-5 text-springfield-blue" />
                </div>
                <div>
                  <h3 className="font-display font-extrabold text-white text-md">
                    Guia Passo a Passo: Assinar com o MT MANAGER
                  </h3>
                  <p className="text-zinc-500 text-xs text-secondary-font">Como contornar erros de análise de APK no Android de forma segura.</p>
                </div>
              </div>

              <div className="space-y-6 text-xs sm:text-sm text-zinc-300 leading-relaxed">
                <div className="flex gap-4 items-start">
                  <div className="w-6 h-6 bg-zinc-800 rounded-full flex items-center justify-center font-mono font-bold text-xs shrink-0 mt-0.5 text-springfield-yellow">
                    1
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-sm mb-1">Passo 1: Baixar a Build</h4>
                    <p>
                      Comute para a guia <strong>"Versões de Debug"</strong>, identifique os APKs disponíveis nos cards e clique no botão de download para baixar o executável bruto.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 items-start">
                  <div className="w-6 h-6 bg-zinc-800 rounded-full flex items-center justify-center font-mono font-bold text-xs shrink-0 mt-0.5 text-springfield-yellow">
                    2
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-sm mb-1">Passo 2: Abrir no MT Manager</h4>
                    <p>
                      Inicie o editor de pacotes <strong>MT Manager</strong> em seu dispositivo Android e navegue até a pasta de downloads onde o APK bruto foi armazenado.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 items-start">
                  <div className="w-6 h-6 bg-zinc-800 rounded-full flex items-center justify-center font-mono font-bold text-xs shrink-0 mt-0.5 text-springfield-yellow">
                    3
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-sm mb-1">Passo 3: Executar a Assinatura</h4>
                    <p className="mb-2">
                      Toque rápido em cima do arquivo APK do port, e no menu contextual de ações, clique na opção de <strong>"Assinar" / "Sign"</strong>.
                    </p>
                    <div className="bg-[#121214] border border-zinc-800 p-3 rounded-lg font-mono text-xs text-zinc-400 space-y-1">
                      <p>🔋 Método de assinatura de depuração: testkey</p>
                      <p>✨ Saída: arquivo gerado contendo o sufixo customizado "_signed.apk"</p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-4 items-start">
                  <div className="w-6 h-6 bg-zinc-800 rounded-full flex items-center justify-center font-mono font-bold text-xs shrink-0 mt-0.5 text-springfield-yellow">
                    4
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-sm mb-1">Passo 4: Instalar o APK Assinado</h4>
                    <p>
                      Desinstale qualquer outra versão do Simpsons Hit & Run instalada anteriormente para evitar o conflito de assinaturas de pacotes locais. Em seguida, instale o novo arquivo assinado. O jogo rodará normalmente!
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-purple-950/15 border border-purple-900/30 rounded-xl p-4 flex gap-3 text-xs text-purple-300">
                <Info className="w-4.5 h-4.5 shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  <strong>Nota técnica:</strong> A necessidade do MT Manager surge pois o Android requer que todos os APKs de debug rodando localmente (sideloading) tenham assinaturas autorizadas no armazenamento para evitar conflitos de segurança na Sandbox do sistema.
                </p>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* Page Footer */}
      <footer className="border-t border-zinc-900 bg-[#0F0F12] mt-20 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
          <div className="space-y-1">
            <p className="text-zinc-500 text-[11px]">
              © {new Date().getFullYear()} Simpsons Hit & Run - AI Assistance Porting Team.
            </p>
            <p className="text-zinc-600 text-[9px] max-w-xl mx-auto md:mx-0">
              Projeto acadêmico e conceitual de engenharia em computação experimental. Simpsons Hit & Run é marca registrada de seus legítimos detetores e proprietários.
            </p>
          </div>
          
          <div className="flex items-center gap-4 text-[11px] font-mono text-zinc-500">
            <span>Serviço: Supabase Integration</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

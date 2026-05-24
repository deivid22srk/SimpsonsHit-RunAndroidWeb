import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://dbvmkochemjmeyookgsu.supabase.co';
const SUPABASE_KEY = 'sb_publishable_Ezt_GGAqymphZUzsscB_XQ_tkLxHRof';

// Initialize Supabase client
export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    persistSession: false
  }
});

export interface GameVersion {
  id?: string;
  version_code: string;
  title: string;
  description: string;
  change_log: string[];
  ai_involvement: string;
  download_url: string;
  is_stable: boolean;
  created_at?: string;
}

export interface UserFeedback {
  id?: string;
  nickname: string;
  type: 'suggestion' | 'bug' | 'general';
  content: string;
  upvotes: number;
  status: 'pending' | 'investigating' | 'implemented' | 'rejected';
  version_affected?: string;
  created_at?: string;
}

// Fallback seed data so the user has an interactive interface immediately!
export const FALLBACK_VERSIONS: GameVersion[] = [
  {
    id: '1',
    version_code: 'v0.3.0-debug',
    title: 'Câmera Dinâmica e FPS Desbloqueado',
    description: 'Atualização focada na fluidez do gameplay. Adiciona suporte completo a gamepad externo e câmera em terceira pessoa responsiva.',
    change_log: [
      'Suporte a gamepads Bluetooth (DualSense, Xbox e controles de toque integrados)',
      'Configurações de resolução escalável (720p, 1080p nativo para otimizar desempenho)',
      'Desbloqueio opcional de limite para 60 FPS em aparelhos com telas de alta taxa de atualização',
      'Correção do crash que ocorria ao tentar entrar na casa dos Simpsons no Level 1 usando celulares POCO'
    ],
    ai_involvement: 'A IA auxiliou no mapeamento e portabilidade da física de colisão da câmera do Radical Engine original para o formato de matrizes do OpenGLES 3.0, corrigindo clipping indesejado ao bater o carro contra texturas e paredes.',
    download_url: 'https://github.com/exemplo/hit-and-run-port/releases/download/v0.3.0/simpsons-hr-v0.3.0-signed.apk',
    is_stable: true,
    created_at: new Date(Date.now()).toISOString()
  },
  {
    id: '2',
    version_code: 'v0.2.2-debug',
    title: 'Ajustes de Física e IA de Tráfego',
    description: 'Esta versão adiciona os primeiros carros jogáveis de Springfield com comportamento físico parcial e inteligência artificial de tráfego simplificada nas quadras centrais.',
    change_log: [
      'Implementação de colisão de veículo melhorada e efeitos sonoros básicos',
      'Carregamento otimizado de Springfield Level 1 (Vizinhança imediata dos Simpsons)',
      'Correção nos travamentos de carregamento de arquivos .rsd de áudio e música'
    ],
    ai_involvement: 'A IA reescreveu a rotina obsoleta de amortecimento das suspensões em C++ antigo, traduzindo as variáveis legadas para instruções SIMD NEON nativas de processadores modernos ARM64.',
    download_url: 'https://github.com/exemplo/hit-and-run-port/releases/download/v0.2.2/simpsons-hr-v0.2.2-signed.apk',
    is_stable: false,
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: '3',
    version_code: 'v0.1.0-debug',
    title: 'Primeiro Boot do Motor & Texturas Base',
    description: 'A versão de nascimento do port para Android. Inicializa o motor gráfico e faz o mapeamento bruto do Springfield Level 1.',
    change_log: [
      'Engine montada e renderizador OpenGL ES inicializado com sucesso',
      'Controles táteis simples em sobreposição na tela',
      'Taxa de quadros travada em 30 FPS para testes iniciais de bateria'
    ],
    ai_involvement: 'A IA foi utilizada para gerar conversores eficientes para o formato proprietário .p3d do roteamento de malhas de Springfield, acelerando intensivamente o pipeline manual de importação e conversão de polígonos.',
    download_url: 'https://github.com/exemplo/hit-and-run-port/releases/download/v0.1.0/simpsons-hr-v0.1.0-signed.apk',
    is_stable: false,
    created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString()
  }
];

export const FALLBACK_FEEDBACK: UserFeedback[] = [
  {
    id: 'f1',
    nickname: 'LisaSimps',
    type: 'suggestion',
    content: 'Seria sensacional se a inteligência artificial também fizesse o upscaling inteligente de todas as texturas de 512x512 para 2K usando redimensionamento neural, dando um visual HD incrível pro jogo!',
    upvotes: 28,
    status: 'pending',
    version_affected: 'v0.3.0-debug',
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'f2',
    nickname: 'Manoel_Gamer',
    type: 'bug',
    content: 'A colisão do carro fica muito louca quando colidimos com as caixas de correio azuis nas calçadas, o veículo é arremessado pro espaço sideral! Corrijam por favor.',
    upvotes: 19,
    status: 'investigating',
    version_affected: 'v0.3.0-debug',
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'f3',
    nickname: 'Bart_Skater',
    type: 'general',
    content: 'Adorei a taxa de quadros desta nova build! Rodou a 60 FPS fixos e super leve no meu Snapdragon 8 Gen 1, o suporte de gamepad agilizou demais as missões.',
    upvotes: 12,
    status: 'implemented',
    version_affected: 'v0.2.2-debug',
    created_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString()
  }
];

// Fetch all game versions from Supabase
export async function getVersions(): Promise<GameVersion[]> {
  const { data, error } = await supabase
    .from('versions')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  return (data || []).map(item => ({
    ...item,
    change_log: Array.isArray(item.change_log) ? item.change_log : []
  }));
}

// Add a new version (for general API capability)
export async function addVersion(version: Omit<GameVersion, 'id' | 'created_at'>): Promise<GameVersion | null> {
  const { data, error } = await supabase
    .from('versions')
    .insert([version])
    .select();

  if (error) {
    throw error;
  }

  return data && data[0] ? data[0] : null;
}

// Fetch feedback list from Supabase
export async function getFeedback(): Promise<UserFeedback[]> {
  const { data, error } = await supabase
    .from('feedback')
    .select('*')
    .order('upvotes', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  return data || [];
}

// Insert new feedback
export async function addFeedback(feedback: Omit<UserFeedback, 'id' | 'created_at' | 'upvotes' | 'status'>): Promise<UserFeedback | null> {
  const newRecord = {
    ...feedback,
    upvotes: 0,
    status: 'pending' as const
  };

  const { data, error } = await supabase
    .from('feedback')
    .insert([newRecord])
    .select();

  if (error) {
    throw error;
  }

  return data && data[0] ? data[0] : null;
}

// Upvote a feedback row
export async function voteFeedback(id: string, currentUpvotes: number): Promise<boolean> {
  const { error } = await supabase
    .from('feedback')
    .update({ upvotes: currentUpvotes + 1 })
    .eq('id', id);

  if (error) {
    throw error;
  }
  return true;
}

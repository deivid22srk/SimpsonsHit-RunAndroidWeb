-- SQL Schema for The Simpsons: Hit & Run - AI Port Portal

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

-- Create the feedback and suggestions table
CREATE TABLE IF NOT EXISTS public.feedback (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nickname VARCHAR(100) NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'suggestion' (sugestão), 'bug' (relato de bug), 'general' (feedback geral)
    content TEXT NOT NULL,
    upvotes INTEGER DEFAULT 0 NOT NULL,
    status VARCHAR(50) DEFAULT 'pending' NOT NULL, -- 'pending', 'investigating', 'implemented', 'rejected'
    version_affected VARCHAR(50), -- optional linkage to version_code
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS) on both tables (Supabase standard)
ALTER TABLE public.versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

-- Create Policies for versions table
-- 1. Allow public read access to versions
CREATE POLICY "Allow public read access to versions" ON public.versions
    FOR SELECT USING (true);

-- 2. Allow public insert to versions (so developers can upload fresh versions through the site or anyone testing)
CREATE POLICY "Allow public insert to versions" ON public.versions
    FOR INSERT WITH CHECK (true);

-- Create Policies for feedback table
-- 1. Allow public read access to feedback
CREATE POLICY "Allow public read access to feedback" ON public.feedback
    FOR SELECT USING (true);

-- 2. Allow public insert access so clients can submit feedback
CREATE POLICY "Allow public insert to feedback" ON public.feedback
    FOR INSERT WITH CHECK (true);

-- 3. Allow public updates to upvote button (only update the upvotes count and status)
CREATE POLICY "Allow public update to upvotes" ON public.feedback
    FOR UPDATE USING (true) WITH CHECK (true);

-- Insert comfortable initial seed data for the Simpsons Hit & Run port
INSERT INTO public.versions (version_code, title, description, change_log, ai_involvement, download_url, is_stable, created_at)
VALUES 
(
    'v0.1.0-debug', 
    'Primeiro Boot do Motor & Texturas Base', 
    'A versão de nascimento do port para Android. Inicializa o motor gráfico e mapeia os assets originais do jogo de GameCube/PS2.', 
    ARRAY['Mapeamento de texturas e shaders para renderizador OpenGL ES 3.0', 'Controles de toque básicos na tela estilo D-pad', 'Suporte experimental a taxas de quadros de 30 FPS'],
    'IA ajudou a refatorar a leitura do formato de arquivo .p3d proprietário do Radical Engine original, gerando buffers compatíveis com Vertex Array do OpenGL móvel.',
    '#', 
    false, 
    NOW() - INTERVAL '15 days'
),
(
    'v0.2.2-debug', 
    'Ajustes de Física e IA de Tráfego', 
    'Esta versão adiciona os primeiros carros jogáveis de Springfield com comportamento físico parcial e IA de tráfego simplificada.', 
    ARRAY['Implementação de colisão de veículo melhorada', 'Carregamento otimizado de Springfield Level 1 (Vizinhança dos Simpsons)', 'Correção de travamento no carregamento de áudio em formato de streaming .rsd'],
    'IA reescreveu a física dos amortecedores e do torque das rodas, traduzindo as variáveis legadas de física de ponto flutuante do PS2 para cálculo SIMD Neon moderno.',
    '#', 
    false, 
    NOW() - INTERVAL '5 days'
),
(
    'v0.3.0-debug', 
    'Câmera Dinâmica e FPS Desbloqueado', 
    'Atualização focada na fluidez do gameplay. Adiciona suporte completo a gamepad externo e câmera em terceira pessoa responsiva.', 
    ARRAY['Suporte a gamepads Bluetooth (DualSense e Xbox)', 'Configurações de resolução escalável (720p, 1080p nativo)', 'Desbloqueio de limite para 60 FPS em aparelhos com telas de alta taxa de atualização'],
    'A IA foi alimentada com o código-fonte da câmera do Radical Engine compilada em C++ antigos e desenvolveu um algoritmo preditivo suave de interpolação quadrática para evitar clipping nas paredes.',
    '#', 
    true, 
    NOW()
)
ON CONFLICT (version_code) DO NOTHING;

-- Insert some dummy feedbacks/suggestions
INSERT INTO public.feedback (nickname, type, content, upvotes, status, version_affected)
VALUES 
('Manoel_Gamer', 'bug', 'O jogo fecha sozinho (crash) ao tentar entrar na casa dos Simpsons no Level 1 usando o celular Poco X5.', 14, 'investigating', 'v0.3.0-debug'),
('LisaSimps', 'suggestion', 'Seria insano se a inteligência artificial também fizesse o upscaling de todas as texturas de 512x512 para 2K usando redimensionamento inteligente!', 23, 'pending', 'v0.3.0-debug'),
('Bart_Skater', 'general', 'Adorei a velocidade do port, caramba! Rodou a 60fps no meu Snapdragon 8 Gen 1 perfeitamente, o controle de toques ficou ótimo!', 8, 'implemented', 'v0.2.2-debug')
ON CONFLICT DO NOTHING;

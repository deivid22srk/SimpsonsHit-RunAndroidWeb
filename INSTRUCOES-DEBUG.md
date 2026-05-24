# Guia de Preparação e Envio de Versões de Debug (The Simpsons: Hit & Run Android Port)

Este documento explica de forma detalhada o fluxo de trabalho para compilar, assinar e registrar novas atualizações de depuração (debug) da modificação assistida por IA do jogo para Android.

---

## 📌 Requisitos Próximos
1. **Código Fonte / Workspace de Compilação**: Ambiente configurado com o compilador cruzado C++ (Android NDK) e SDK Android correspondente ao port.
2. **MT MANAGER**: Aplicativo Android crucial para realizar a assinatura do APK final caso esteja compilando ou modificando arquivos diretamente em aparelhos móveis.
3. **Acesso ao Supabase**: Credenciais de gravação ou uso do formulário administrativo integrado no Dashboard Web.

---

## 🛠️ Passo 1: Compilação & Assinatura (CRÍTICO)

O sistema operacional Android bloqueia a instalação de APKs que não contenham uma assinatura criptográfica válida. Versões brutas de debug geradas diretamente por compiladores ou editores de recursos muitas vezes vêm com assinaturas ausentes ou corrompidas.

### Por que usar o MT MANAGER?
Se você estiver modificando os arquivos do jogo, inserindo traduções feitas por IA, atualizando modelos de script compilados, ou mexendo no arquivo `.so` nativo:
- O Android recusará a instalação exibindo o erro *"O aplicativo não foi instalado"* ou *"Erro de análise (Parse Error)"*.
- O **MT MANAGER** reconstrói o manifesto e assina digitalmente o APK usando uma chave de teste que o Android aceita para depuração local.

### Como assinar com o MT MANAGER:
1. Transfira o APK gerado da modificação (`.apk`) para o armazenamento interno do seu aparelho Android.
2. Abra o aplicativo **MT MANAGER** e navegue até a pasta onde o APK está localizado.
3. Toque em cima do arquivo APK.
4. No menu que aparecer, selecione a opção **"Assinar"** (ou **"Sign"**).
5. Escolha a assinatura padrão **"testkey"** (chave de teste compatível universalmente).
6. Toque em **OK**. Um novo arquivo com o sufixo `_signed.apk` (ou ícone verde) será gerado na mesma pasta.
7. **Instale apenas o APK assinado!** Desinstale qualquer versão anterior do jogo para evitar conflito de assinaturas.

---

## 🚀 Passo 2: Hospedagem dos Arquivos do APK

Atualmente, o portal não hospeda gigabytes de arquivos APK diretamente para economizar tráfego. Siga o fluxo de hospedagem:
1. Faça o upload do APK assinado (`_signed.apk`) em um servidor estável, de preferência com link de download direto:
   - **Google Drive** (certificando-se de que o link esteja aberto como "Qualquer pessoa com o link")
   - **MediaFire**
   - **Mega**
   - **GitHub Releases** (Altamente recomendado por manter histórico de tags)

---

## 📝 Passo 3: Registrar a Nova Versão no Portal

Você pode registrar uma nova versão de teste de duas maneiras:

### Método A: Usando a Interface Administrativa do Portal (Recomendado)
O site possui um painel administrativo integrado (comutável por modo de desenvolvedor) que se conecta em tempo real ao Supabase. 
1. Acesse o portal.
2. Ative o **"Modo Desenvolvedor" / "Modo Admin"** na barra superior ou configurações.
3. Clique em **"Cadastrar Nova Versão"**.
4. Preencha os campos requisitados:
   - **Código da Versão**: Ex: `v0.4.0-debug`
   - **Título**: Ex: `Ajuste na renderização de sombras e HUD`
   - **Descrição**: Detalhe o foco desta versão de debug.
   - **Registo de Mudanças (Changelog)**: Insira as novidades encontradas.
   - **Envolvimento da IA**: Detalhe qual prompt ou trecho de código foi reescrito pela IA (por exemplo, *"Adaptação do tamanho de tela feito pela IA usando redes neurais de layouts"*).
   - **URL de Download**: O link obtido no Passo 2.
   - **Estável**: Marcar se passou em testes básicos.
5. Salve. As informações serão gravadas na tabela `versions` instantaneamente e estarão disponíveis para a comunidade baixar e relatar feedbacks!

### Método B: Inserindo Diretamente no Banco SQL do Supabase
Caso prefira inserções manuais, você pode executar uma instrução SQL na aba **SQL Editor** do seu console Supabase:

```sql
INSERT INTO public.versions (version_code, title, description, change_log, ai_involvement, download_url, is_stable)
VALUES (
    'v0.4.0-debug',
    'Ajustes nos Shaders do Céu e Sol',
    'Esta build de debug visa consertar a iluminação volumétrica estridente que ocorria no Level 2.',
    ARRAY[
        'Reconstrução do shader sky_dome_fragment.glsl',
        'Configurado mapeamento correto das texturas de Springfield à noite',
        'Redução do lag ao passar perto do Kwik-E-Mart'
    ],
    'A IA otimizou o laço do fragment shader do sol que estava calculando brilho fora do clip plane, reduzindo em 34% as instruções redundantes de GPU.',
    'https://github.com/exemplo/hit-and-run-port/releases/download/v0.4.0/simpsons-hr-v0.4.0-signed.apk',
    false
);
```

---

## ⚠️ Mensagem de Consciência de Desenvolvimento

Lembre-se sempre de reiterar para a comunidade de testadores:
> **As modificações estão sendo assistidas por processos de Inteligência Artificial Generativa. Erros bizarros de colisão, distorções de áudio e travamentos imprevisíveis fazem parte da jornada experimental. Não espere um serviço profissional impecável em termos de reengenharia lógica.**

# Envio Automatizado de Versões de Debug via YAML

Este guia orienta sobre como padronizar, formatar e submeter novas versões de depuração (debug) do port de **The Simpsons: Hit & Run** utilizando arquivos de configuração na linguagem **YAML**. 

Esta abordagem é ideal para integrar com pipelines de Integração Contínua (CI/CD) no GitHub Actions, ou para uso de scripts automatizados de publicação direta no banco de dados **Supabase**.

---

## 📋 Estrutura do Arquivo YAML (`version.yaml`)

O arquivo YAML deve seguir rigorosamente a estrutura relacional mapeada na tabela `public.versions` do Supabase. Todos os campos requerem preenchimento legível.

```yaml
# Modelo de especificação da nova versão
version_code: "v0.4.0-debug"
title: "Integração do Mini-Mapa e Otimização do Level 1"
description: "Esta compilação experimental adiciona o radar de navegação do HUD e otimiza a colisão física ao redor da casa dos Simpsons."
is_stable: false
download_url: "https://github.com/exemplo/hit-and-run-port/releases/download/v0.4.0/simpsons-hr-v0.4.0-signed.apk"

# Envolvimento da Inteligência Artificial no código
ai_involvement: >
  A IA foi utilizada para recalcular a projeção de matrizes do mini-mapa ortográfico no canvas de sobreposição (HUD) em OpenGL ES 3.0,
  reduzindo artefatos visuais de cintilação e garantindo sincronia perfeita com a rotação espacial do jogador.

# Lista de alterações inseridas (Changelog)
change_log:
  - "Renderização funcional e em tempo real do HUD / Minimapa no canto inferior esquerdo"
  - "Mapeamento aprimorado de colisão física estática do celeiro e garagem dos Simpsons"
  - "Correção no vazamento de memória do rasterizador de fontes ao exibir diálogos rápidos"
  - "Otimização geral de chamadas de desenho (draw calls) de Springfield à noite"
```

---

## 🚀 Como Integrar e Enviar via Automação

Uma vez que você escreveu os detalhes no formato YAML, você pode realizar a publicação das seguintes formas:

### Opção A: Script Node.js de Envios (Recomendado)

Você pode usar o script de automação abaixo que lê o seu arquivo `.yaml`, analisa a sintaxe e insere a nova versão diretamente nos endpoints do Supabase.

#### 1. Instalar dependências necessárias
```bash
npm install yaml @supabase/supabase-js dotenv
```

#### 2. Criar o script de envio (`scripts/publish-version.js`)
```javascript
const fs = require('fs');
const path = require('path');
const yaml = require('yaml');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Inicializa cliente do Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

async function publishFromYaml() {
  try {
    const yamlPath = path.join(__dirname, '../version.yaml');
    if (!fs.existsSync(yamlPath)) {
      console.error('❌ Erro: Arquivo version.yaml não foi encontrado!');
      process.exit(1);
    }

    // Carregar e reformatar conteúdo do YAML
    const fileContent = fs.readFileSync(yamlPath, 'utf8');
    const versionData = yaml.parse(fileContent);

    console.log(`📡 Enviando versão ${versionData.version_code} para o Supabase...`);

    // Inserir registro na tabela
    const { data, error } = await supabase
      .from('versions')
      .insert([
        {
          version_code: versionData.version_code,
          title: versionData.title,
          description: versionData.description,
          change_log: Array.isArray(versionData.change_log) ? versionData.change_log : [],
          ai_involvement: versionData.ai_involvement,
          download_url: versionData.download_url,
          is_stable: !!versionData.is_stable
        }
      ])
      .select();

    if (error) {
      throw error;
    }

    console.log('✅ Versão cadastrada com sucesso no banco de dados remoto!');
    console.log(data[0]);

  } catch (err) {
    console.error('❌ Erro ao publicar versão do YAML:', err.message || err);
    process.exit(1);
  }
}

publishFromYaml();
```

---

### Opção B: Pipeline no GitHub Actions (`.github/workflows/deploy-version.yml`)

Automatize o registro sempre que você publicar uma tag ou release no repositório:

```yaml
name: Publish Debug Version from YAML

on:
  push:
    paths:
      - 'version.yaml'
    branches:
      - main

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Repository
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - name: Install dependencies
        run: npm install yaml @supabase/supabase-js

      - name: Run Publish Automation
        env:
          SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          SUPABASE_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
        run: node scripts/publish-version.js
```

---

## 🛠️ Validações Importantes Antes de Enviar

1. **Assinatura Requisitada**: Garanta que o link de download (`download_url`) seja de um APK assinado com a chave `testkey` usando o utilitário **MT Manager**, garantindo que nenhum testador encare o pop-up de inconsistência de integridade do Android.
2. **Duplicidade**: O campo `version_code` possui índice de unicidade (`UNIQUE`) no Supabase. O banco de dados recusará a inserção se você reenviar uma tag de versão idêntica sem deletá-la previamente.
3. **Escapes de String Multiline**: Para textos de descrição ou envolvimento de IA longos, utilize o indicador `>` ou `|` no YAML para manter a formatação do parágrafo legível.

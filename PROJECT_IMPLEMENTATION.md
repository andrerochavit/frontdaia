# Documentação de Implementação — Projeto Effie

Este documento detalha as principais implementações, refatorações e melhorias de UX realizadas no projeto **Effie**.

---

## Refatoração e Arquitetura

### 1. Sistema de Chat e Memória Inteligente
- **Contexto Expandido**: O chat foi configurado para utilizar todo o contexto disponível do usuário (incluindo perfil DISC e dados de Onboarding) sem truncamento de caracteres, garantindo respostas mais precisas.
- **Memória de Curto Prazo**: Implementada uma janela de contexto de **4 mensagens** (mensagens mais recentes) para manter o fio da meada sem sobrecarregar o processamento de tokens.
- **Integração Multiserviço**: O sistema está preparado para alternar entre OpenAI, Gemini e Anthropic, com fallback configurado.

### 2. Navegação Global e Sidebar
- **AppLayout Unificado**: Refatoração do layout para garantir que a barra lateral esteja disponível em todas as páginas internas (exceto Dashboard para uma experiência limpa).
- **Deep Linking de Conversas**: O `ChatSidebar` detecta se o usuário está fora da `ChatPage` e realiza o redirecionamento automático com o envio do estado da sessão via React Router, permitindo transições fluidas entre ferramentas.

---

## Interface e Experiência do Usuário (UX)

### 1. Design System — Glassmorphism
- Implementação de um sistema visual baseado em **Glassmorphism**, utilizando variáveis CSS customizadas para suporte a Temas Claro e Escuro.
- **Glow Orbs**: Adição de elementos decorativos ("orbes") que se movem ou brilham sutilmente no fundo das páginas Dashboard e Landing Page.

### 2. Otimização Mobile
- **Discretização de Elementos**: Ajuste do botão do "Quadro de Tarefas" no mobile para ser visível mas não intrusivo.
- **Sheet Integration**: No mobile, componentes densos (como o Quadro de Tarefas do Chat ou o Menu Lateral) utilizam o componente `Sheet` da Radix UI, que desliza de forma nativa e melhora a usabilidade em telas pequenas.

### 3. Animações
- **Landing Page Hero**: Implementação de uma animação CSS personalizada que simula um chat dinâmico na seção principal, mostrando o valor do produto em segundos.
- **Framer Motion**: Transições suaves de entrada e saída em cards, modais e ao alternar entre conversas.

---

## Segurança e Configuração

- **Padronização de Ambiente**: Configuração do projeto para detecção automática de chaves de API (`.env`) tanto com prefixo `VITE_` quanto sem, facilitando diferentes ambientes de deploy.
- **Acessibilidade**: Correção de avisos de `DialogContent` no console, garantindo que todos os Sheets (painéis laterais) possuam títulos e descrições para leitores de tela.

---

## Páginas Principais

- `LandingPage`: Vitrine com animações e CTA.
- `Dashboard`: Hub central com gráficos de rede e ações rápidas.
- `ChatPage`: Interface de mentoria AI em tempo real.
- `NetworkPage`: Ferramenta para gerenciar parceiros e importar contatos via CSV/PDF.
- `MvpPage`: Guia para construção do Produto Mínimo Viável.
- `DiscFormPage`: Avaliação de perfil empreendedor.

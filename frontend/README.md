# Effie

O Effie é um assistente impulsionado por IA projetado para ajudar empreendedores a transformarem suas ideias em negócios de sucesso. Construído sobre os princípios do **Effectuation**, ele oferece orientação estruturada, sugestões personalizadas e ferramentas para ajudar você a navegar em sua jornada empreendedora.

---

## Funcionalidades

- **Princípios de Effectuation**: Aprenda e aplique os 5 princípios do Effectuation ao seu negócio.
- **Respostas Focadas no Empreendedor**: Conselhos personalizados para proprietários de pequenas empresas e startups.
- **Painel Interativo**: Acompanhe seu progresso, organize suas ideias e receba próximos passos práticos.
- **Perguntas Guiadas**: Receba perguntas específicas para cada estágio do desenvolvimento do seu negócio.
- **Design Moderno**: Construído com uma interface elegante e responsiva para uma experiência de usuário envolvente.

---

## 🔄 Workflow do Projeto

O Effie guia o empreendedor através de uma jornada estruturada baseada no método **Effectuation**:

1.  **Avaliação Inicial**: O usuário começa realizando o teste de perfil **DISC** e o formulário de **Onboarding**. Isso permite que o Effie entenda "Quem você é", "O que você sabe" e "Quem você conhece".
2.  **Painel de Controle (Dashboard)**: Uma visão geral do progresso, acesso rápido a ações e insights sobre o perfil do empreendedor.
3.  **Mentoria com Effie (Chat)**: A interação principal. O chat utiliza o contexto do perfil e das últimas conversas para dar dicas práticas e guiar os próximos passos.
4.  **Construção do MVP**: Ferramentas para definir o produto mínimo viável focado em recursos disponíveis.
5.  **Rede de Contatos (Network)**: Gestão estratégica de parceiros e contatos que podem acelerar o negócio.
6.  **Quadro de Tarefas**: Um quadro dinâmico (Whiteboard) integrado ao chat para organizar as ações pendentes.

---

## Navegação

A navegação no projeto é intuitiva e centralizada:

-   **Dashboard**: O seu "Home". De onde você parte para todas as outras ferramentas.
-   **Barras Laterais (Sidebars)**:
    -   No desktop, fica fixa ou recolhível à esquerda para acesso rápido.
    -   No mobile, é acessível através do menu superior ("hambúrguer").
    -   Permite alternar entre **Conversas**, **MVP**, **Rede de Contatos** e **Perfil**.
-   **Navegação Inteligente**: Ao clicar em uma conversa antiga na barra lateral enquanto estiver em outras páginas (como o MVP), o sistema redireciona você automaticamente para o Chat com o histórico carregado.
-   **Painel de Tarefas**: No chat, você pode abrir o painel de tarefas lateral (ou via menu inferior no mobile) para visualizar o "Quadro Branco" sem sair da conversa.

---


## 🛠️ Stack Tecnológica

Este projeto foi construído com uma stack moderna e de alta performance:

- **Core**: [React 18](https://reactjs.org/) + [Vite](https://vitejs.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Estilização**: [Tailwind CSS](https://tailwindcss.com/)
- **Componentes de UI**: [shadcn/ui](https://ui.shadcn.com/) (baseado no [Radix UI](https://www.radix-ui.com/))
- **Animações**: [Framer Motion](https://www.framer.com/motion/)
- **Ícones**: [Lucide React](https://lucide.dev/)
- **Gerenciamento de Estado**: [TanStack Query v5](https://tanstack.com/query/latest)
- **Formulários e Validação**: [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/)
- **Banco de Dados e Autenticação**: [Supabase](https://supabase.com/)
- **Integração de IA**: [OpenAI](https://openai.com/) e [Anthropic](https://anthropic.com/)
- **Visualização de Dados**: [Recharts](https://recharts.org/) e [React Flow](https://reactflow.dev/)
- **Feedback**: [Sonner](https://sonner.emilkowal.ski/) (Toasts) e [Vaul](https://vaul.emilkowal.ski/) (Drawers/Menus inferiores)
- **Utilitários**: [date-fns](https://date-fns.org/), [clsx](https://github.com/lukeed/clsx), [tailwind-merge](https://github.com/dcastil/tailwind-merge)

---

## 🖥️ Como Rodar o Projeto Localmente

Siga estes passos para configurar e executar o projeto em sua máquina:

### Pré-requisitos

- **Node.js**: Certifique-se de ter o Node.js instalado. [Instalar via nvm](https://github.com/nvm-sh/nvm#installing-and-updating)
- **npm**: Já vem incluso com o Node.js.

### Passo a passo:

```sh
# Passo 1: Clone o repositório usando a URL Git do projeto.
git clone https://github.com/CIIA-DF/effectuation-assistant-ai

# Passo 2: Navegue até o diretório do projeto.
cd effectuation-assistant-ai

# Passo 3: Instale as dependências necessárias.
npm i

# Passo 4: Inicie o servidor de desenvolvimento com auto-recarregamento e pré-visualização instantânea.
npm run dev
# Plano de Melhorias & Refinamentos - VIDA360 (2026)

Este documento centraliza as solicitações de melhorias e ajustes futuros para o projeto, organizados por prioridade e área de impacto.

## 1. UI/UX & Layout

### 1.1. Comportamento do Menu Lateral (Sidebar)
*   [x] **Reverter Sidebar Fixa no Desktop** ✅ **CONCLUÍDO**
    *   **Solicitação:** O menu lateral deve ser retrátil (estilo gaveta/overlay) **apenas no mobile**.
    *   **Comportamento Desktop:** Deve voltar a ser fixo/persistente na tela (Visível por padrão), ocupando seu espaço dedicado e ajustando o conteúdo principal para o lado (sem sobrepor).
    *   **Comportamento Mobile:** Manter como está (Overlay/Gaveta) acionado pelo botão de menu.
    *   **Status:** Layout já implementado corretamente em `AppLayout.tsx` com sidebar fixa em desktop (`lg:flex`) e overlay em mobile.

### 1.2. Reorganização de Menu e Perfil
*   [x] **Migração de Configurações para o Perfil** ✅ **CONCLUÍDO**
    *   **Solicitação:** A aba "Configurações" (Aparência, Notificações, Suporte) deve ser removida do menu lateral principal.
    *   **Novo Local:** As configurações devem ser acessadas dentro da página de "Perfil" (ex: como uma nova aba ou seção interna).
    *   **Status:** `ProfilePreferences` component criado e integrado. Rota `/app/settings` removida.
*   [x] **Enriquecimento de Perfil e Preferências** ✅ **CONCLUÍDO**
    *   **Novos Campos:** Adicionar campos para coletar mais dados do lead/usuário: Idade, Profissão, Rotina (descritivo ou tags), Telefone.
    *   **Segurança:** Implementar a funcionalidade real de "Alterar Senha" (atualmente está como "Em breve" ou inativa).
    *   **Internacionalização (i18n):** Criar uma seção de "Idioma" nas preferências do perfil, permitindo trocar a língua do app (iniciar com suporte a PT-BR e EN).
    *   **Status:** Migration 0033 aplicada, campos adicionados ao ProfilePage, ChangePasswordDialog implementado.

## 2. Bugs & Correções

### 2.1. Criação de Tarefas
*   [x] **Correção na Exibição de Anexos e Subtarefas** ✅ **CONCLUÍDO**
    *   **Problema:** Ao criar uma tarefa, ela é salva, mas os anexos e subtarefas adicionados no formulário não aparecem visualmente na lista/detalhes imediatamente ou não estão sendo salvos corretamente.
    *   **Ação:** Verificar o fluxo de persistência (`useTasks` / `createTask`) e garantir que as relações (subtarefas e metadata de anexos) sejam salvas e retornadas na query de atualização.
    *   **Status:** Migration 0034 criada e aplicada. Tabela `task_attachments` criada, RLS policies corrigidas.

### 2.2. Calendário e Agenda
*   [x] **Correção da Cor do Evento (Preview)** ✅ **CONCLUÍDO**
    *   **Problema:** A cor selecionada durante a criação do evento não está sendo refletida no preview imediato no calendário.
    *   **Ação:** Garantir que o componente de visualização do calendário utilize a propriedade de cor correta (e.g., `event.color` ou `event.categoryColor`) renderizada dinamicamente.
    *   **Status:** `EVENT_COLOR_MAP` implementado em `CalendarPage.tsx` para evitar purging do Tailwind.
*   [x] **Detalhes do Evento na Home** ✅ **CONCLUÍDO**
    *   **Problema:** Ao clicar em um evento no widget de "Agenda de Hoje" da Home, abre-se o modal de *criação* ou edição genérica, em vez de um modal de *detalhes* (visualização) com as informações do evento.
    *   **Ação:** Alterar o `onClick` do item da agenda na Home para abrir o `EventDetailsDialog` `EventDetailsModal` (ou equivalente de leitura) em vez do formulário de criação.
    *   **Status:** `EventDetailsDialog` component criado e integrado em `Home.tsx` e `CalendarPage.tsx`.

### 2.3. Hábitos
*   [x] **Estado Inicial Incorreto (Progresso Fantasma)** ✅ **CONCLUÍDO**
    *   **Problema:** Ao criar um novo hábito, ele já aparece com algum progresso visual ou "preenchido" (barra de progresso > 0%) mesmo sem nenhum registro de execução.
    *   **Ação:** Resetar corretamente o estado inicial do componente de hábito ou verificar se o cálculo de progresso está considerando dados antigos/indevidos (ex: datas incorretas ou array não inicializado).
    *   **Status:** Valores hardcoded (23%, streak 0/12) substituídos por cálculos reais em `HabitsPage.tsx`.

### 2.4. Metas
*   [x] **Atualização de Progresso em Tempo Real** ✅ **CONCLUÍDO**
    *   **Problema:** Ao adicionar um novo progresso (valor/quantidade) em uma meta através do modal, o gráfico de progresso e os valores "Atual/Restante" não são atualizados imediatamente, exigindo um refresh ou reabertura do modal para refletir a mudança.
    *   **Ação:** Implementar invalidação de query (`queryClient.invalidateQueries`) ou atualização otimista local após o sucesso da mutação de adição de progresso no `GoalDetailsDialog`.
    *   **Status:** Query interna `useGoal` adicionada ao `GoalDetailsDialog` para buscar dados atualizados.

### 2.5. Finanças
*   [x] **Correção na Criação de Transações (Categorias e Submit)** ✅ **CONCLUÍDO**
    *   **Problema:**
        1.  Ao tentar criar uma nova transação financeira, o campo de seleção de "Categoria" aparece vazio.
        2.  **Erro Crítico:** Ao salvar, ocorre erro de banco de dados: `null value in column "date" of relation "transactions" violates not-null constraint`.
    *   **Ação:**
        *   Verificar o `CategorySelect` para garantir o carregamento das opções.
        *   Corrigir o envio do campo `date` no payload da transação. Provavelmente o formato da data do componente `DatePicker` ou `Input type="date"` não está sendo convertido corretamente para o formato esperado pelo Supabase (`YYYY-MM-DD` ou ISO string) ou está sendo enviado como `null`.
    *   **Status:** Auto-seeding de categorias implementado, campo `date` defensivo adicionado ao payload.

### 2.6. Área Administrativa (ADM)
*   [ ] **Botões Funcionais e Novas Páginas**
    *   **Problema:** Os botões "Gerenciar", "Ver Logs" e "Ajustar" na `AdminPage` são puramente visuais e as páginas de destino não existem.
    *   **Ação:**
        1.  Criar as páginas/rotas reais:
            *   `/admin/users` (Gestão de Usuários e Permissões)
            *   `/admin/logs` (Logs do Sistema e Auditoria)
            *   `/admin/settings` (Configurações Globais)
        2.  Implementar o `React Router` (`<Link />`) nos botões para redirecionar corretamente.
*   [x] **Controle de Acesso (RBAC)** ✅ **CONCLUÍDO**
    *   **Problema:** A aba e a página de "Administração" estão visíveis para todos os usuários, independentemente do nível de permissão.
    *   **Ação:**
        1.  Ocultar o item "Administração" da Sidebar se o usuário não for `admin` ou `super_admin`.
        2.  Implementar proteção de rota (`PrivateRoute` ou regra no loader) para impedir acesso direto via URL.
    *   **Status:** `useUserRole` e `useIsAdmin` hooks criados, `AdminGuard` implementado, Sidebar atualizada.

### 2.7. WhatsApp e Mensageria
*   [ ] **Onboarding e Configuração**
    *   **Problema:**
        1.  A interface atual assume que o usuário já está conectado, sem oferecer instruções ou fluxo de configuração real (QR Code, instância, etc).
        2.  O botão de "Configurações" (ícone de engrenagem) na página do WhatsApp não executa nenhuma ação.
    *   **Ação:**
        *   Implementar um passo-a-passo de conexão (wizard) que exiba o QR Code da API do WhatsApp ou instruções claras de pareamento.
        *   Fazer o botão de configurações abrir um modal de preferências (ex: selecionar quais notificações receber) ou redirecionar para uma rota de settings específica do módulo.
*   [ ] **Chat Funcional**
    *   **Problema:** O chat atual é uma interface estática (mock) que não envia nem recebe mensagens reais.
    *   **Ação:** Integrar o componente de chat com o backend (Supabase/Edge Functions + API WhatsApp) para permitir o envio real de mensagens e receber webhooks de respostas.
*   [ ] **Estratégia de Identificação por Telefone**
    *   **Definição:** O sistema identificará o usuário unicamente pelo número de telefone salvo no perfil.
    *   **Fluxo:**
        1.  Usuário cadastra/salva seu número no perfil ou onboarding.
        2.  Sistema recebe webhook do WhatsApp (Twilio/Meta).
        3.  Backend busca usuário pelo `phone_number`.
        4.  Se encontrado, processa a mensagem no contexto daquele usuário.
        5.  Se não encontrado, ignora ou cria lead.
*   [ ] **Configuração de Horários de Notificação**
    *   **Funcionalidade:** Permitir que o usuário defina janelas de horário permitidas para receber mensagens/pushs via WhatsApp (ex: "Apenas entre 09:00 e 18:00").
    *   **Implementação:** Adicionar campos de `notification_start_time` e `notification_end_time` (ou `quiet_hours`) nas configurações do usuário e respeitar isso no job de envio.

### 2.8. Gamificação e Conquistas
*   [ ] **Correção de Progresso Falso (100%)**
    *   **Problema:** As conquistas estão sendo exibidas como 100% concluídas visualmente, mesmo quando o usuário ainda não atingiu o objetivo.
    *   **Ação:** Ajustar a lógica de cálculo de progresso no componente de Achievements para refletir o status real (`current_value / target_value`).
*   [ ] **Visualização de Conquistas Bloqueadas (Locked State)**
    *   **Solicitação:** O usuário deve conseguir ver todas as medalhas/badges disponíveis no sistema, mesmo as que ainda não conquistou.
    *   **Implementação:** Exibir as conquistas não desbloqueadas em estado "bloqueado" (escala de cinza, ícone de cadeado ou opacidade reduzida), criando um "Showcase" do que é possível alcançar.

## 3. Funcionalidades (Backlog)

*   *(Aguardando novos itens...)*

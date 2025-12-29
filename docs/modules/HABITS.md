# Documentação de Hábitos - VIDA360

## Visão Geral
O módulo de hábitos permite rastrear rotinas diárias ou semanais.

## Estrutura
-   **Frequência**: Pode ser diária ou em dias específicos da semana.
-   **Metas**: Cada hábito pode ter uma meta de "vezes por período".
-   **Check-ins**: O registro é feito na tabela `habit_checkins` vinculado ao dia.

## Gamificação
-   Cada check-in concede XP (ajustável em `XP_REWARDS`).
-   Sequências (streaks) são calculadas em tempo real para exibir badges de fogo.

## Integração
-   Hábitos podem ser vinculados a `Goals` para que o progresso da meta seja atualizado automaticamente ao realizar check-ins.

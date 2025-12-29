# Documentação Financeira - VIDA360

## Fluxos
-   **Lançamentos**: Simples (Entrada/Saída).
-   **Parcelamentos**: Gerados automaticamente via RPC `generate_installment_parcels`.
-   **Categorias**: Sistema de categorias customizáveis com ícones e cores.

## Funcionalidades Especiais
-   **Metas Financeiras**: Reserva de emergência, economia para viagem, etc.
-   **Sincronização com Metas**: Lançamentos em categorias específicas podem abater valores de metas globais.
-   **Dashboard**: Visão mensal de saldo, total de receitas e despesas.

## Segurança
Os dados financeiros são os mais sensíveis e possuem RLS estrito ao `user_id`, não sendo compartilhados dentro da organização por padrão.

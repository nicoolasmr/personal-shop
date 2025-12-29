# Guia de Operações (RUNBOOK) - VIDA360

## Monitoramento
-   **Endpoint de Saúde**: `GET /functions/v1/health`
    - Retorna status do DB e latência.
-   **Logs**: Disponíveis no painel do Supabase (Edge Functions logs e Postgres logs).

## Troubleshooting Comum

### Usuário não consegue logar
1.  Verifique se o email foi confirmado (se o auto-confirm estiver desligado).
2.  Verifique se o perfil foi criado corretamente no hook de `on_auth_user_created`.

### Sincronização de Metas falhando
1.  Verifique a tabela `audit_log` para erros de trigger.
2.  Garanta que a meta financeira ou o hábito esteja "ativo".

### Notificações Push não chegam
1.  Verifique se as chaves VAPID estão configuradas no ambiente da Edge Function.
2.  Certifique-se de que o usuário aceitou a permissão no navegador (Check Settings page).

## Escalonamento
Para problemas críticos de banco de dados, utilize o console do Supabase para restaurar backups ou ajustar limites de recursos.

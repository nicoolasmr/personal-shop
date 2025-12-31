# Relatório de pendências para produção

## 1) Cobertura automatizada inexistente
- O comando `npm run test:run` concluiu sem rodar qualquer teste (`No test files found`). Isso deixa o produto sem rede de segurança básica para regressões e impede validação automatizada de requisitos críticos.

## 2) Bundle inicial muito pesado
- O build de produção completa, porém o Vite alerta que alguns chunks ultrapassam o limite de 500 kB (bundle principal `index-DmxcNvdz.js` ~824 kB; `StatisticsPage` ~418 kB). Isso tende a degradar o tempo de carregamento inicial para usuários, especialmente em redes móveis.

## 3) Webhook do WhatsApp com fuso fixo
- As funções de agenda assumem fuso horário fixo UTC-3 tanto para listar quanto para criar eventos. Usuários em outros fusos ou com horário de verão terão horários incorretos e o filtro de busca pode omitir/duplicar eventos.

## 4) Criação de eventos por texto é frágil
- O parsing aceita apenas frases muito específicas (ex.: "agendar Reunião hoje 15h"). Qualquer variação fora do padrão falha ou gera horário errado (regex simples e remoção de palavras sem validação adicional). Isso pode gerar frustração para usuários reais.

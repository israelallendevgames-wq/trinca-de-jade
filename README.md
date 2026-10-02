# Trinca de Jade

Mahjong Solitaire + Jogo da Velha. React + TypeScript + Vite, sem backend.

```
npm install
npm run dev      # http://localhost:5173 (também acessível pelo celular na mesma rede)
npm run build    # produção em /dist
```

## Estrutura
- `src/game/` — lógica pura (sem React): `tiles.ts` (layouts, peça livre, geração solucionável), `rules.ts` (linhas), `state.ts` (reducer/turnos), `ai.ts` (níveis de IA), `fx.ts` (sons e partículas), `store.ts` (localStorage)
- `src/components/` — UI: `Game`, `MahjongBoard`, `TicTacToe`, `Screens`
- A campanha tem oito fases com layouts e força de IA crescentes; vitórias desbloqueiam a próxima fase, com progresso salvo no navegador.
- Para mudar layouts/dificuldade da campanha, edite `CAMPAIGN_STAGES` em `tiles.ts`. Para mudar pontos/regras dos especiais, edite `state.ts`.

## Celular (app nativo)
`npm i @capacitor/core @capacitor/cli && npx cap init && npm run build && npx cap add android`

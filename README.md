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

## Anúncios recompensados
Unidades extras de dica/embaralhamento e planos de fundo são creditados somente após `window.RewardedAdBridge.showRewardedAd(placement)` retornar `rewarded`. Os usos aceitos são `extra-hint`, `extra-shuffle` e `background-unlock`; cada anúncio de fundo libera somente o próximo tema da coleção. A ponte Android deve usar um anúncio recompensado do AdMob e confirmar conclusão pelo SDK. Fechar ou não carregar não concede recompensa. Esta versão Vite não inclui o plugin nativo nem IDs de anúncio; sem a ponte, a coleção continua bloqueada e a interface informa que anúncios estão indisponíveis.

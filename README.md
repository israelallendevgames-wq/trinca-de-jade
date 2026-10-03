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

## Android e Google Play

Requisitos locais: Node.js, JDK 21 e Android Studio com Android SDK instalado.

```sh
npm run android:sync   # atualiza o projeto Android com a versão web
npm run android:open   # abre o projeto no Android Studio
npm run android:run    # compila e executa em emulador/dispositivo conectado
npm run android:apk    # cria APK de depuração instalável
npm run android:bundle # cria o Android App Bundle de release
```

O APK de depuração fica em `android/app/build/outputs/apk/debug/app-debug.apk`. O AAB fica em `android/app/build/outputs/bundle/release/app-release.aab`. Antes de enviar o AAB à Play Store, configure a assinatura de release no Android Studio com uma chave de upload guardada com segurança. A publicação também exige uma conta Google Play Developer, ficha da loja, ícone, capturas de tela e o preenchimento das declarações de conteúdo e privacidade.

## Anúncios recompensados
Unidades extras de dica/embaralhamento e planos de fundo são creditados somente após `window.RewardedAdBridge.showRewardedAd(placement)` retornar `rewarded`. Os usos aceitos são `extra-hint`, `extra-shuffle` e `background-unlock`; cada anúncio de fundo libera somente o próximo tema da coleção. A ponte Android deve usar um anúncio recompensado do AdMob e confirmar conclusão pelo SDK. Fechar ou não carregar não concede recompensa. Esta versão Vite não inclui o plugin nativo nem IDs de anúncio; sem a ponte, a coleção continua bloqueada e a interface informa que anúncios estão indisponíveis.

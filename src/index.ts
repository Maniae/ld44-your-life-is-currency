import { Game } from "./game";

const pixiApp = new PIXI.Application(800, 600, { backgroundColor: 0xaaaaaa });

document.body.querySelector("#canvas")!.appendChild(pixiApp.view);

const game = new Game(pixiApp);

game.start();

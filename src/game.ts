import { GameManager } from "./gameManager";
import { Player } from "./entities/player";
import { Input } from "./input";

export class Game {
	private gameManager: GameManager;

	constructor(app: PIXI.Application) {
		Input.init();
		this.gameManager = new GameManager(app);
	}

	async start() {
		this.update(0);
	}

	update(time: number) {
		this.gameManager.update(time);
		requestAnimationFrame((time: number) => {
			this.update(time);
		});
	}
}

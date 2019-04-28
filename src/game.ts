import { GameManager } from "./gameManager";
import { Input } from "./input";
import theme from "../assets/themex4.mp3";

const music = new Audio(theme);

export class Game {
	private gameManager: GameManager;

	constructor(app: PIXI.Application) {
		Input.init();
		music.loop = true;
		music.volume = 0.1;
		music.play().catch(_ => {
			Input.onKeyPressed = () => {
				music.play();
				Input.onKeyPressed = null;
			};
		});

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

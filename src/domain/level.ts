import { Ennemy } from "../entities/ennemy";
import { Wall } from "../entities/wall";
import { TILE_SIZE, BANKER_TILE_X, ROOMS_GROUP_NUMBER, SAME_ROOM_MODULO } from "../config/constants";
import ennemiesTypes from "../config/ennemies.json";
import { Product } from "../entities/product";

export class Level {
	widthInTiles: number;
	heightInTiles: number;
	ennemies: Ennemy[];
	walls: Wall[];
	products: Product[];
	startX: number;
	startY: number;
	isShop: boolean;
	isBoss = false;

	constructor(
		widthInTiles: number,
		heightInTiles: number,
		walls: Wall[],
		ennemies: Ennemy[],
		products: Product[],
		startX: number,
		startY: number,
		isShop: boolean
	) {
		this.widthInTiles = widthInTiles;
		this.heightInTiles = heightInTiles;
		this.ennemies = ennemies;
		this.walls = walls;
		this.products = products;
		this.startX = startX;
		this.startY = startY;
		this.isShop = isShop;
	}

	static generate(difficulty: number) {
		const walls = [];
		const bossInterval = ROOMS_GROUP_NUMBER + 1;
		const bossDist = (4 + difficulty - ROOMS_GROUP_NUMBER) % bossInterval;

		const isBoss = bossDist === 0;
		const difficultyIncrement = bossDist > 2 ? 1 : 0;
		const ennemyCount = 1 + difficultyIncrement + Math.floor(difficulty / bossInterval);

		const width = isBoss ? 16 : Math.min(ennemyCount * 8, 24);
		const height = isBoss ? 16 : Math.min(ennemyCount * 8, 24);

		const doorSize = 2;

		const ennemies = [];

		if (isBoss) {
			const boss = Ennemy.fromJson(ennemiesTypes.boss, (width * TILE_SIZE) / 2, (height * TILE_SIZE) / 2);
			boss.health += difficulty;
			boss.fireRate -= difficulty * 20;
			boss.acceleration += difficulty / 10;
			boss.maxSpeed += difficulty / 10;
			ennemies.push(boss);
		} else {
			for (let i = 0; i < ennemyCount; i++) {
				const eX = Math.floor(Math.random() * (width - 2)) * TILE_SIZE + TILE_SIZE;
				const eY = Math.floor(Math.random() * (height - 2)) * TILE_SIZE + TILE_SIZE;
				ennemies.push(Ennemy.fromJson(Math.random() > 0.5 ? ennemiesTypes.crosser : ennemiesTypes.diagCrosser, eX, eY));
			}
		}

		walls.push(
			new Wall(0, -TILE_SIZE, (width / 2 - 1) * TILE_SIZE, TILE_SIZE),
			new Wall((width / 2 + 1) * TILE_SIZE, -TILE_SIZE, (width / 2 - 1) * TILE_SIZE, TILE_SIZE),
			new Wall(-TILE_SIZE, 0, TILE_SIZE, height * TILE_SIZE),
			new Wall(width * TILE_SIZE, 0, TILE_SIZE, height * TILE_SIZE),
			new Wall(0, height * TILE_SIZE, width * TILE_SIZE, TILE_SIZE),
			new Wall((width / 2 - 1) * TILE_SIZE, -TILE_SIZE, doorSize * TILE_SIZE, TILE_SIZE, true)
		);

		const startX = (width * TILE_SIZE) / 2;
		const startY = height * TILE_SIZE - TILE_SIZE;
		const level = new Level(width, height, walls, ennemies, [], startX, startY, false);
		level.isBoss = isBoss;
		return level;
	}

	static generateShop() {
		const walls = [];
		walls.push(
			new Wall(0, -TILE_SIZE, 7 * TILE_SIZE, TILE_SIZE),
			new Wall(9 * TILE_SIZE, -TILE_SIZE, 7 * TILE_SIZE, TILE_SIZE),
			new Wall(-TILE_SIZE, 0, TILE_SIZE, 16 * TILE_SIZE),
			new Wall(16 * TILE_SIZE, 0, TILE_SIZE, 16 * TILE_SIZE),
			new Wall(0, 16 * TILE_SIZE, 16 * TILE_SIZE, TILE_SIZE)
		);
		const products = [];
		products.push(new Product(BANKER_TILE_X * TILE_SIZE, 256, 3, 4));
		const [startX, startY] = [256, 512 - TILE_SIZE];

		return new Level(16, 16, walls, [], products, startX, startY, true);
	}
}

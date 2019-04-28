import bankerSprite from "../assets/banker.png";
import crosserSprite from "../assets/crosser.png";
import crosserDeathSound from "../assets/crosserDeath.wav";
import crosserDiagSprite from "../assets/crosserDiag.png";
import crosserDiagDeathSound from "../assets/crosserDiagDeath.wav";
import ennemyFireSprite from "../assets/ennemyFire.png";
import backgroundSprite from "../assets/ground3.png";
import floorSprite from "../assets/ground2.png";
import heartSprite from "../assets/heart.png";
import heartSound from "../assets/heart.wav";
import heartMissingSprite from "../assets/heartMissing.png";
import fullHeartSprite from "../assets/heartOver.png";
import hitSound from "../assets/hit.wav";
import playerSprite from "../assets/player.png";
import playerFireSprite from "../assets/playerFire.png";
import bossSprite from "../assets/boss.png";
import purchaseSound from "../assets/purchase.wav";
import stealSound from "../assets/steal.wav";
import theme from "../assets/themex4.mp3";
import {
	BANKER_TILE_X,
	BANKER_TILE_Y,
	HEIGHT,
	MIN_BANKER_STEAL,
	TILE_SIZE,
	WIDTH,
	INVULNERABILITY_DELAY,
	ROOMS_GROUP_NUMBER,
	RESTART_DELAY,
	SHOP_SIZE,
	PLAYER_FRAME_UPDATE,
	SPEED_EPSILON,
} from "./config/constants";
import { Level } from "./domain/level";
import { Banker } from "./entities/banker";
import { Ennemy } from "./entities/ennemy";
import { ColliderType, Entity } from "./entities/entity";
import { Player } from "./entities/player";
import { Product } from "./entities/product";
import { Projectile } from "./entities/projectile";
import { Wall } from "./entities/wall";
import { Input } from "./input";
import { circleIntersectRect, norm, Point, pointInRect, rectIntersectRect, vect, normalize } from "./math";

const stealAudio = new Audio(stealSound);
const crosserDeathAudio = new Audio(crosserDeathSound);
const crosserDiagDeathAudio = new Audio(crosserDiagDeathSound);
const hitAudio = new Audio(hitSound);
const heartAudio = new Audio(heartSound);
const purchaseAudio = new Audio(purchaseSound);

const music = new Audio(theme);

export class GameManager {
	music: HTMLAudioElement | null = null;

	levelCount = 0;
	level!: Level;

	deals = 0;

	gameOver = false;
	gameOverStart = 0;

	infosGraphics: PIXI.Container;
	infosText: PIXI.Text;
	typeInterval = 0;
	tutorial = true;

	player: Player | null = null;
	playerGraphic: PIXI.Sprite | null = null;
	lastPlayerFrameUpdate = 0;

	banker: Banker | null = null;
	bankerGraphic = PIXI.Sprite.fromImage(bankerSprite);
	lastBankerFrameUpdate = 0;

	projectiles: Set<Projectile> = new Set([]);
	projectilesGraphic = new Map<Projectile, PIXI.Sprite>();

	ennemies: Set<Ennemy> = new Set([]);
	ennemiesGraphic = new Map<Ennemy, PIXI.Sprite>();

	walls: Set<Wall> = new Set([]);
	wallsGraphic = new Map<Wall, PIXI.Graphics>();

	products: Set<Product> = new Set([]);
	productsGraphic = new Map<Product, PIXI.Container>();

	groundGraphic!: PIXI.Container;
	backgroundGraphic: PIXI.extras.TilingSprite;

	gameOverGraphic: PIXI.Container;
	gameOverText: PIXI.Text;

	constructor(private readonly app: PIXI.Application) {
		const backgroundTexture = PIXI.Texture.fromImage(backgroundSprite);
		this.backgroundGraphic = new PIXI.extras.TilingSprite(backgroundTexture, 768 + WIDTH, 768 + HEIGHT);
		this.backgroundGraphic.clampMargin = 32;
		app.stage.addChild(this.backgroundGraphic);

		this.player = new Player(0, 0);
		this.startShop();

		this.gameOverGraphic = new PIXI.Container();
		const gameOverBackground = new PIXI.Graphics()
			.beginFill(0x0f380e)
			.drawRect(0, 0, 600, 300)
			.endFill()
			.beginFill(0x306230)
			.drawRect(2, 2, 596, 296)
			.endFill()
			.beginFill(0xaaaaaa)
			.drawRect(4, 4, 592, 292)
			.endFill();
		this.gameOverText = new PIXI.Text("", { fontFamily: "Press Start 2P" });
		this.gameOverText.style.fill = 0x0f380f;
		this.gameOverText.anchor.set(0.5, 0.5);
		this.gameOverText.position.set(300, 150);
		this.gameOverGraphic.addChild(gameOverBackground);
		this.gameOverGraphic.addChild(this.gameOverText);
		this.gameOverGraphic.pivot.set(300, 150);
		this.gameOverGraphic.position.set(WIDTH / 2, HEIGHT / 2);
		this.gameOverText.vertexData;

		this.infosGraphics = new PIXI.Container();

		this.infosText = new PIXI.Text("", { fontFamily: "Press Start 2P" });
		this.infosText.style.fill = 0x0f380f;
		this.infosText.anchor.set(0.5, 0.5);
		this.infosText.position.set(300, 150);
		this.infosGraphics.addChild(gameOverBackground.clone());
		this.infosGraphics.addChild(this.infosText);
		this.infosGraphics.pivot.set(300, 150);
		this.infosGraphics.position.set(WIDTH / 2, HEIGHT / 2);

		// LOL
		setTimeout(() => {
			this.app.stage.addChild(this.infosGraphics);
		}, 1);

		this.type(
			"Welcome to my shop.\n\n" +
				"Before going furter,\n" +
				"You may need some\n" +
				"protection.\n\n" +
				"Just don't forget\n" +
				"to give it back...",
			() => {
				setTimeout(() => {
					this.type("With interests...", () => {
						setTimeout(() => {
							this.app.stage.removeChild(this.infosGraphics);
							this.tutorial = false;
						}, 2000);
					});
				}, 2500);
			}
		);

		this.playMusic();
	}

	restart() {
		this.player = new Player(0, 0);
		this.levelCount = 0;
		this.deals = 0;
		this.app.stage.removeChild(this.gameOverGraphic);
		this.gameOver = false;
		this.gameOverStart = 0;
		this.gameOverText.text = "";
		this.projectiles = new Set([]);
		this.startShop();
	}

	playMusic() {
		music.loop = true;
		music.volume = 0.1;
		music.play();
	}

	startShop() {
		const level = Level.generateShop();
		this.createGround(level);
		this.walls = new Set(level.walls);
		this.products = new Set(level.products);
		this.ennemies = new Set(level.ennemies);

		if (this.player) {
			this.player.position =
				this.levelCount === 0
					? { x: (SHOP_SIZE * TILE_SIZE) / 2, y: (SHOP_SIZE * TILE_SIZE) / 2 }
					: { x: level.startX, y: level.startY };
			this.player.velocity = { x: 0, y: 0 };
			if (this.player.debt) {
				this.player.maxSpeed = 0;
			}
		}
		this.banker = new Banker(BANKER_TILE_X * TILE_SIZE, BANKER_TILE_Y * TILE_SIZE);
		this.app.stage.addChild(this.bankerGraphic);
		this.bankerGraphic.anchor.set(0.5, 0.5);
		this.level = level;
	}

	startLevel(time: number) {
		const level = Level.generate(this.levelCount);
		this.createGround(level);
		this.walls = new Set(level.walls);
		this.products = new Set(level.products);
		this.ennemies = new Set(level.ennemies);
		this.ennemies.forEach(e => (e.lastShot = time));
		this.app.stage.removeChild(this.bankerGraphic);

		if (this.player) {
			this.player.position = { x: level.startX, y: level.startY };
			this.player.velocity = { x: 0, y: 0 };
		}
		this.banker = null;
		this.level = level;
		this.levelCount++;
	}

	createGround(level: Level) {
		const texture = PIXI.Texture.fromImage(floorSprite);
		if (this.groundGraphic) {
			this.groundGraphic.removeChildren();
		}
		if (!this.groundGraphic) {
			const container = new PIXI.Container();
			this.groundGraphic = container;
			this.app.stage.addChild(container);
		}
		for (let i = 0; i < level.widthInTiles; i++) {
			for (let j = 0; j < level.heightInTiles; j++) {
				const floorSquare = new PIXI.Sprite(texture);
				floorSquare.position.set(TILE_SIZE * i, TILE_SIZE * j);
				this.groundGraphic.addChild(floorSquare);
			}
		}
	}

	update(time: number) {
		if (this.player) {
			this.updatePlayerInputs(this.player, time);
		}

		this.checkRoom(time);

		this.updateEnnemies(time);
		this.updateBanker(time);
		this.updatePositionsAndVelocity();

		this.checkProjectileCollisions(time);
		this.checkPurchases();
		this.checkHealth();
		this.checkDoor();

		this.updateGraphics(time);

		this.clearProjectiles();
		this.clearDeads(time);

		this.updateHud();

		this.checkRestart(time);
	}

	updatePlayerInputs(player: Player, time: number) {
		if (this.tutorial) {
			return;
		}
		// Movement
		if (Input.isPressed(Input.Z) || Input.isPressed(Input.W)) {
			player.velocity.y = Math.max(player.velocity.y - player.acceleration, -player.maxSpeed);
		}
		if (Input.isPressed(Input.D)) {
			player.velocity.x = Math.min(player.velocity.x + player.acceleration, player.maxSpeed);
		}
		if (Input.isPressed(Input.S)) {
			player.velocity.y = Math.min(player.velocity.y + player.acceleration, player.maxSpeed);
		}
		if (Input.isPressed(Input.Q) || Input.isPressed(Input.A)) {
			player.velocity.x = Math.max(player.velocity.x - player.acceleration, -player.maxSpeed);
		}

		// Fire

		if (time > player.lastShot + player.fireRate) {
			if (Input.isPressed(Input.Up)) {
				const p = new Projectile(
					player.position.x,
					player.position.y,
					player.velocity.x / 2,
					-player.shotVelocity,
					20,
					"PLAYER"
				);
				this.projectiles.add(p);
				player.lastShot = time;
			} else if (Input.isPressed(Input.Right)) {
				const p = new Projectile(
					player.position.x,
					player.position.y,
					player.shotVelocity,
					player.velocity.y / 2,
					20,
					"PLAYER"
				);
				this.projectiles.add(p);
				player.lastShot = time;
			} else if (Input.isPressed(Input.Down)) {
				const p = new Projectile(
					player.position.x,
					player.position.y,
					player.velocity.x / 2,
					player.shotVelocity,
					20,
					"PLAYER"
				);
				this.projectiles.add(p);
				player.lastShot = time;
			} else if (Input.isPressed(Input.Left)) {
				const p = new Projectile(
					player.position.x,
					player.position.y,
					-player.shotVelocity,
					player.velocity.y / 2,
					20,
					"PLAYER"
				);
				this.projectiles.add(p);
				player.lastShot = time;
			}
		}
	}

	checkRoom(time: number) {
		if (this.level && this.player) {
			if (this.player.position.y < 0) {
				this.level.isShop
					? this.startLevel(time)
					: (this.levelCount > 0 && (this.levelCount + 1) % (ROOMS_GROUP_NUMBER + 1) === 0) || this.level.isBoss
					? this.startShop()
					: this.startLevel(time);
			}
		}
	}

	updateEnnemies(time: number) {
		this.ennemies.forEach(e => {
			if (time > e.lastShot + e.fireRate) {
				let projectilesDirections: Point[] = [];
				switch (e.shotType) {
					case "CROSS":
						projectilesDirections = [{ x: 0, y: -1 }, { x: 1, y: 0 }, { x: 0, y: 1 }, { x: -1, y: 0 }];
						break;
					case "DIAGCROSS":
						projectilesDirections = [
							{ x: Math.SQRT2, y: Math.SQRT2 },
							{ x: -Math.SQRT2, y: Math.SQRT2 },
							{ x: Math.SQRT2, y: -Math.SQRT2 },
							{ x: -Math.SQRT2, y: -Math.SQRT2 },
						];
						break;
					case "AIM":
						if (this.player) {
							const preshot = Math.random() > 0.85;
							const vec = vect(e.position, {
								x: this.player.position.x + (preshot ? this.player.velocity.x * 100 : 0),
								y: this.player.position.y + (preshot ? this.player.velocity.y * 100 : 0),
							});
							const angle = Math.atan2(vec.y, vec.x);
							projectilesDirections = [
								normalize({
									x: Math.cos(angle),
									y: Math.sin(angle),
								}),
							];
						}
						break;
				}

				projectilesDirections.map(({ x, y }) => {
					const p = new Projectile(e.position.x, e.position.y, e.shotVelocity * x, e.shotVelocity * y, 20, "ENNEMIES");
					this.projectiles.add(p);
					e.lastShot = time;
				});
			}
			if (time > e.lastMove + e.moveDelay) {
				if (e.moveOdds > Math.random()) {
					const moveX = Math.random() > 0.5;
					const factor = Math.random() > 0.5 ? 1 : -1;
					e.velocity = { x: e.maxSpeed * factor * +moveX, y: e.maxSpeed * factor * +!moveX };
				} else {
					e.velocity = { x: 0, y: 0 };
				}
				e.lastMove = time;
			}
		});
	}

	updateBanker(time: number) {
		if (this.banker && this.player && this.player.maxSpeed === 0) {
			if (this.player.debt > 0) {
				const vec = vect(this.banker.position, this.player.position);
				if (norm(vec) > MIN_BANKER_STEAL) {
					const angle = Math.atan2(vec.y, vec.x);
					this.banker.velocity = {
						x: Math.min(this.banker.velocity.x + Math.cos(angle) * this.banker.acceleration, this.banker.maxSpeed),
						y: Math.min(this.banker.velocity.y + Math.sin(angle) * this.banker.acceleration, this.banker.maxSpeed),
					};
				} else {
					if (time > this.banker.lastSteal + this.banker.stealDelay) {
						stealAudio.play();
						this.player.health--;
						this.player.debt--;
						this.banker.lastSteal = time;
					}
				}
			} else {
				const vec = vect(this.banker.position, { x: BANKER_TILE_X * TILE_SIZE, y: BANKER_TILE_Y * TILE_SIZE });
				if (norm(vec) > MIN_BANKER_STEAL) {
					const angle = Math.atan2(vec.y, vec.x);
					this.banker.velocity = {
						x: Math.min(this.banker.velocity.x + Math.cos(angle) * this.banker.acceleration, this.banker.maxSpeed),
						y: Math.min(this.banker.velocity.y + Math.sin(angle) * this.banker.acceleration, this.banker.maxSpeed),
					};
				} else {
					this.player.maxSpeed = 7;
				}
			}
		}
	}

	updateEntityPositionAndVelocity(e: Entity) {
		const nextX = e.position.x + e.velocity.x;
		const nextY = e.position.y + e.velocity.y;

		if (
			!this.checkCollideWithWalls(
				{
					x: nextX,
					y: e.position.y,
				},
				e.width,
				e.height,
				e.colliderType
			)
		) {
			e.position.x += e.velocity.x;

			e.velocity.x *= e.friction;
		} else {
			e.velocity.x = 0;
			if (e.fragile) {
				e.dead = true;
			}
		}

		if (
			!this.checkCollideWithWalls(
				{
					x: e.position.x,
					y: nextY,
				},
				e.width,
				e.height,
				e.colliderType
			)
		) {
			e.position.y += e.velocity.y;

			e.velocity.y *= e.friction;
		} else {
			e.velocity.y = 0;
			if (e.fragile) {
				e.dead = true;
			}
		}
	}

	checkCollideWithWalls(pos: Point, width: number, height: number, colliderType: ColliderType) {
		for (const w of this.walls) {
			const intersect =
				colliderType === "rect"
					? rectIntersectRect(w, {
							position: {
								x: pos.x - width / 2,
								y: pos.y - height / 2,
							},
							width,
							height,
					  })
					: circleIntersectRect(pos.x, pos.y, width / 2, w.position.x, w.position.y, w.width, w.height);
			if (intersect) {
				return true;
			}
		}
		return false;
	}

	updatePositionsAndVelocity() {
		if (this.player) {
			this.updateEntityPositionAndVelocity(this.player);
		}
		if (this.banker) {
			this.updateEntityPositionAndVelocity(this.banker);
		}

		this.projectiles.forEach(p => this.updateEntityPositionAndVelocity(p));
		this.ennemies.forEach(p => this.updateEntityPositionAndVelocity(p));
	}

	checkProjectileCollisions(time: number) {
		this.projectiles.forEach(p => {
			if (p.team === "ENNEMIES") {
				if (this.player) {
					if (time > this.player.lastHit + INVULNERABILITY_DELAY) {
						if (
							circleIntersectRect(
								p.position.x,
								p.position.y,
								p.width / 2,
								this.player.position.x,
								this.player.position.y,
								this.player.width,
								this.player.height
							)
						) {
							this.player.lastHit = time;
							hitAudio.play();
							this.player.health--;
							this.projectiles.delete(p);
						}
					}
				}
			} else {
				this.ennemies.forEach(e => {
					if (
						circleIntersectRect(
							p.position.x,
							p.position.y,
							p.width / 2,
							e.position.x - e.width / 2,
							e.position.y - e.height / 2,
							e.width,
							e.height
						)
					) {
						e.health--;
						this.projectiles.delete(p);
					}
				});
			}
		});
	}

	checkPurchases() {
		this.products.forEach(p => {
			if (this.player) {
				if (
					pointInRect(
						p.position.x,
						p.position.y,
						this.player.position.x - TILE_SIZE / 2,
						this.player.position.y - (TILE_SIZE * 1.5) / 2,
						TILE_SIZE,
						1.5 * TILE_SIZE
					)
				) {
					if (p.debt) {
						this.deals++;
					}
					p.debt ? purchaseAudio.play() : heartAudio.play();
					this.player.health += p.health;
					this.player.debt += p.debt;
					p.dead = true;
				}
			}
		});
	}

	checkHealth() {
		for (const e of this.ennemies) {
			if (e.health <= 0) {
				e.dead = true;
			}
		}
		if (this.player && this.player.health <= 0) {
			this.player.dead = true;
		}
	}

	checkDoor() {
		if (this.ennemies.size === 0) {
			for (const w of this.walls) {
				if (w.isRemovable) {
					this.walls.delete(w);
				}
			}
		}
	}

	updateGraphics(time: number) {
		// Background
		this.setGraphicPosition(this.backgroundGraphic, -WIDTH / 2, -HEIGHT / 2);
		// Ground
		this.setGraphicPosition(this.groundGraphic, 0, 0);
		// Walls
		this.walls.forEach(w => {
			if (!this.wallsGraphic.get(w)) {
				const wallGraphic = new PIXI.Graphics()
					.beginFill(0x0f380f)
					.drawRect(0, 0, w.width, w.height)
					.endFill();
				this.wallsGraphic.set(w, wallGraphic);
				this.app.stage.addChild(wallGraphic);
			}
			this.setGraphicPosition(this.wallsGraphic.get(w)!, w.position.x, w.position.y);
		});
		// Clear Walls
		for (const [wall, wallGraphic] of this.wallsGraphic.entries()) {
			if (!this.walls.has(wall)) {
				wallGraphic.destroy();
				this.wallsGraphic.delete(wall);
			}
		}

		// Projectiles
		this.projectiles.forEach(p => {
			if (!this.projectilesGraphic.get(p)) {
				const pGraphic = PIXI.Sprite.fromImage(p.team === "PLAYER" ? playerFireSprite : ennemyFireSprite);
				pGraphic.anchor.set(0.5, 0.5);
				this.projectilesGraphic.set(p, pGraphic);
				this.app.stage.addChild(pGraphic);
			}

			const proj = this.projectilesGraphic.get(p)!;
			proj.rotation += 0.1;
			this.setGraphicPosition(this.projectilesGraphic.get(p)!, p.position.x, p.position.y);
		});
		// Clear Projectiles
		for (const [projectile, projectileGraphic] of this.projectilesGraphic.entries()) {
			if (!this.projectiles.has(projectile)) {
				projectileGraphic.destroy();
				this.projectilesGraphic.delete(projectile);
			}
		}

		// Ennemies
		this.ennemies.forEach(e => {
			if (!this.ennemiesGraphic.get(e)) {
				let pGraphic = new PIXI.Sprite();
				switch (e.name) {
					case "crosser":
						pGraphic = PIXI.Sprite.fromImage(crosserSprite);
						break;
					case "diagcrosser":
						pGraphic = PIXI.Sprite.fromImage(crosserDiagSprite);
						break;
					case "boss":
						pGraphic = PIXI.Sprite.fromImage(bossSprite);
						break;
				}
				pGraphic.anchor.set(0.5, 0.5);
				this.ennemiesGraphic.set(e, pGraphic);
				this.app.stage.addChild(pGraphic);
			}
			if (e.name === "boss") {
				if (time > this.lastBankerFrameUpdate + PLAYER_FRAME_UPDATE) {
					this.ennemiesGraphic
						.get(e)!
						.scale.set(-this.ennemiesGraphic.get(e)!.scale.x, this.ennemiesGraphic.get(e)!.scale.y);
					this.lastBankerFrameUpdate = time;
				}
			}
			this.setGraphicPosition(this.ennemiesGraphic.get(e)!, e.position.x, e.position.y);
		});
		// Clear Ennemies
		for (const [ennemy, ennemyGraphic] of this.ennemiesGraphic.entries()) {
			if (!this.ennemies.has(ennemy)) {
				ennemyGraphic.destroy();
				this.ennemiesGraphic.delete(ennemy);
			}
		}

		// Products
		this.products.forEach(p => {
			if (!this.productsGraphic.get(p)) {
				const fullHeartTexture = PIXI.Texture.fromImage(fullHeartSprite);
				const costHeartTexture = PIXI.Texture.fromImage(heartMissingSprite);

				// Health
				const health = new PIXI.Container();
				for (let i = 0; i < p.health; i++) {
					const fullHeart = new PIXI.Sprite(fullHeartTexture);
					fullHeart.position.set(TILE_SIZE * i, 0);
					health.addChild(fullHeart);
				}
				health.pivot.set((p.health * TILE_SIZE) / 2, TILE_SIZE / 2);

				// Cost
				const debt = new PIXI.Container();
				for (let i = 0; i < p.debt; i++) {
					const debtHeart = new PIXI.Sprite(costHeartTexture);
					debtHeart.position.set(TILE_SIZE * i, TILE_SIZE);
					debt.addChild(debtHeart);
				}
				debt.pivot.set((p.debt * TILE_SIZE) / 2, TILE_SIZE / 2);

				const product = new PIXI.Container();
				product.addChild(health);
				product.addChild(debt);
				product.scale.set(0.5);
				this.productsGraphic.set(p, product);
				this.app.stage.addChild(product);
			}
			this.setGraphicPosition(this.productsGraphic.get(p)!, p.position.x, p.position.y);
		});
		// Clear Products
		for (const [product, productGraphic] of this.productsGraphic.entries()) {
			if (!this.products.has(product)) {
				productGraphic.destroy();
				this.productsGraphic.delete(product);
			}
		}

		// Player
		if (this.player) {
			if (!this.playerGraphic) {
				this.playerGraphic = PIXI.Sprite.fromImage(playerSprite);
				this.playerGraphic.anchor.set(0.5, 0.5);
				this.app.stage.addChild(this.playerGraphic);
				this.playerGraphic.position.set(WIDTH / 2 - 32 / 2, HEIGHT / 2 - 48 / 2);
			}
			if (time > this.lastPlayerFrameUpdate + PLAYER_FRAME_UPDATE && norm(this.player.velocity) > SPEED_EPSILON) {
				this.playerGraphic.scale.set(-this.playerGraphic.scale.x, this.playerGraphic.scale.y);
				this.lastPlayerFrameUpdate = time;
			}
		} else {
			if (this.playerGraphic) {
				this.app.stage.removeChild(this.playerGraphic);
				this.playerGraphic = null;
			}
		}

		// Banker
		if (this.level.isShop && this.banker) {
			this.setGraphicPosition(this.bankerGraphic, this.banker.position.x, this.banker.position.y);

			if (time > this.lastBankerFrameUpdate + PLAYER_FRAME_UPDATE) {
				this.bankerGraphic.scale.set(-this.bankerGraphic.scale.x, this.bankerGraphic.scale.y);
				this.lastBankerFrameUpdate = time;
			}
		}
	}

	clearProjectiles() {
		for (const p of this.projectiles) {
			if (norm(p.velocity) < SPEED_EPSILON) {
				p.dead = true;
			}
		}
	}

	clearDeads(time: number) {
		for (const p of this.projectiles) {
			if (p.dead) {
				this.projectiles.delete(p);
			}
		}

		for (const e of this.ennemies) {
			if (e.dead) {
				e.shotType === "CROSS" ? crosserDeathAudio.play() : crosserDiagDeathAudio.play();
				if (Math.random() < e.lootOdds) {
					for (let i = 0; i < e.lootNumber; i++) {
						if (this.products.size === 0 || (this.player && this.player.debt > 0)) {
							this.products.add(new Product(e.position.x + TILE_SIZE * i, e.position.y - TILE_SIZE * (i % 2), 1, 0));
						}
					}
				}

				this.ennemies.delete(e);
			}
		}

		for (const p of this.products) {
			if (p.dead) {
				this.products.delete(p);
			}
		}
		if (this.player && this.player.dead) {
			this.player = null;
			this.gameOverText.text =
				"GAME OVER\n\n" +
				`Rooms cleared: ${this.level.isShop ? this.levelCount : this.levelCount - 1}\n` +
				`Deals done: ${this.deals}\n\n` +
				`Press a key to retry`;
			this.app.stage.addChild(this.gameOverGraphic);
			this.gameOverStart = time;
			this.gameOver = true;
		}
	}

	updateHud() {
		document.querySelector("#hud")!.innerHTML = "";

		if (this.player) {
			let debtLeft = this.player.debt;
			for (let i = 0; i < this.player.health; i++) {
				const img = new Image();
				img.src = debtLeft > 0 ? heartSprite : fullHeartSprite;
				document.querySelector("#hud")!.appendChild(img);
				debtLeft--;
			}
			if (debtLeft > 0) {
				for (let i = 0; i < debtLeft; i++) {
					const img = new Image();
					img.src = heartMissingSprite;
					document.querySelector("#hud")!.appendChild(img);
				}
			}
		}
	}

	checkRestart(time: number) {
		if (this.gameOver) {
			if (time > this.gameOverStart + RESTART_DELAY) {
				if (
					Input.isPressed(Input.Z) ||
					Input.isPressed(Input.Q) ||
					Input.isPressed(Input.S) ||
					Input.isPressed(Input.D) ||
					Input.isPressed(Input.W) ||
					Input.isPressed(Input.A) ||
					Input.isPressed(Input.Up) ||
					Input.isPressed(Input.Right) ||
					Input.isPressed(Input.Down) ||
					Input.isPressed(Input.Left)
				) {
					this.restart();
				}
			}
		}
	}

	setGraphicPosition(graphic: PIXI.Container, x: number, y: number) {
		if (this.player) {
			graphic.position.set(
				x - (this.player.position.x - WIDTH / 2 + 32 / 2),
				y - (this.player.position.y - HEIGHT / 2 + 48 / 2)
			);
		}
	}

	type(text: string, cb: () => void) {
		let i = 0;
		this.infosText.text = "";
		this.typeInterval = setInterval(() => {
			if (text[i]) {
				if (this.infosText.text === " ") {
					this.infosText.text = text[i];
				} else {
					this.infosText.text += text[i];
				}
				i++;
			} else {
				clearInterval(this.typeInterval);
				cb();
			}
		}, 75);
	}
}

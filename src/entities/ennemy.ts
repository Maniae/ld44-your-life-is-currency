import { Point } from "../math";
import { Entity, ColliderType } from "./entity";
import { ShotType } from "../domain/shotType";

export type EnnemyName = "crosser" | "diagcrosser" | "boss";

export interface EnnemyJson {
	name: string;
	health: number;
	acceleration: number;
	friction: number;
	maxSpeed: number;
	shotVelocity: number;
	fireRate: number;
	moveDelay: number;
	moveOdds: number;
	lootOdds: number;
	lootNumber: number;
	shotType: string;
	width: number;
	height: number;
}

export class Ennemy implements Entity {
	name: EnnemyName;
	health: number;
	position: Point;
	velocity: Point;
	shotType: ShotType;
	acceleration: number;
	friction: number;
	maxSpeed: number;
	shotVelocity: number;
	fireRate: number;
	moveDelay: number;
	moveOdds: number;
	lootOdds: number;
	lootNumber: number;
	width: number;
	height: number;
	lastShot = 0;
	lastMove = 0;
	colliderType: ColliderType = "rect";
	dead = false;

	constructor(
		name: EnnemyName,
		health: number,
		acceleration: number,
		friction: number,
		maxSpeed: number,
		shotVelocity: number,
		fireRate: number,
		moveDelay: number,
		moveOdds: number,
		lootOdds: number,
		lootNumber: number,
		shotType: ShotType,
		width: number,
		height: number,
		x: number,
		y: number
	) {
		this.name = name;
		this.health = health;
		this.position = { x, y };
		this.acceleration = acceleration;
		this.friction = friction;
		this.maxSpeed = maxSpeed;
		this.shotVelocity = shotVelocity;
		this.fireRate = fireRate;
		this.moveDelay = moveDelay;
		this.moveOdds = moveOdds;
		this.lootOdds = lootOdds;
		this.lootNumber = lootNumber;
		this.shotType = shotType;
		this.width = width;
		this.height = height;
		this.velocity = { x: 0, y: 0 };
	}

	static fromJson(ennemyJson: EnnemyJson, x: number, y: number) {
		return new Ennemy(
			ennemyJson.name as EnnemyName,
			ennemyJson.health,
			ennemyJson.acceleration,
			ennemyJson.friction,
			ennemyJson.maxSpeed,
			ennemyJson.shotVelocity,
			ennemyJson.fireRate,
			ennemyJson.moveDelay,
			ennemyJson.moveOdds,
			ennemyJson.lootOdds,
			ennemyJson.lootNumber,
			ennemyJson.shotType as ShotType,
			ennemyJson.width,
			ennemyJson.height,
			x,
			y
		);
	}
}

import { Point } from "../math";
import { Entity, ColliderType } from "./entity";

export class Player implements Entity {
	health: number;
	position: Point;
	velocity: Point;
	acceleration = 2;
	friction = 0.8;
	maxSpeed = 7;
	shotVelocity = 10;
	fireRate = 300;
	lastShot = 0;
	width = 32;
	height = 48;
	colliderType: ColliderType = "rect";
	dead = false;
	debt = 0;
	lastHit = 0;

	constructor(x: number, y: number) {
		this.position = {
			x,
			y,
		};
		this.velocity = { x: 0, y: 0 };
		this.health = 1;
	}
}

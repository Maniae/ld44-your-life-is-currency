import { Point } from "../math";
import { Entity, ColliderType } from "./entity";

export class Banker implements Entity {
	position: Point;
	velocity: Point;
	acceleration = 1;
	friction = 0.7;
	maxSpeed = 5;
	width = 32;
	height = 48;
	colliderType: ColliderType = "rect";
	dead = false;
	stealDelay = 1000;
	lastSteal = 0;

	constructor(x: number, y: number) {
		this.position = {
			x,
			y,
		};
		this.velocity = { x: 0, y: 0 };
	}
}

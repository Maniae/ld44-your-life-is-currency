import { Point } from "../math";

export class Product {
	position: Point;
	health: number;
	debt: number;
	dead = false;

	constructor(x: number, y: number, health: number, debt: number) {
		this.position = { x, y };
		this.health = health;
		this.debt = debt;
	}
}

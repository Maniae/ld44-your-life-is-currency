import { Entity, ColliderType } from "./entity";
import { Point } from "../math";
import { Team } from "../domain/team";

export class Projectile implements Entity {
	position: Point;
	velocity: Point;
	acceleration = 0;
	friction = 0.995;
	maxSpeed = Infinity;
	team: Team;
	width: number;
	height: number;
	colliderType: ColliderType = "circle";
	fragile = true;
	dead = false;

	constructor(x: number, y: number, vX: number, vY: number, size: number, team: Team) {
		this.position = {
			x,
			y,
		};
		this.velocity = {
			x: vX,
			y: vY,
		};
		this.width = size;
		this.height = size;
		this.team = team;
	}
}

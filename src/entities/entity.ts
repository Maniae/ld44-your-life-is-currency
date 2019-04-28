import { Point } from "../math";

export type ColliderType = "rect" | "circle";

export interface Entity {
	position: Point;
	velocity: Point;
	width: number;
	height: number;
	acceleration: number;
	friction: number;
	maxSpeed: number;
	colliderType: ColliderType;
	fragile?: boolean;
	dead: boolean;
}

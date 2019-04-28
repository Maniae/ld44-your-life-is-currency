import { Point } from "../math";

export class Wall {
	position: Point;
	width: number;
	height: number;
	isRemovable: boolean;

	constructor(x: number, y: number, width: number, height: number, isRemovable = false) {
		this.position = { x, y };
		this.width = width;
		this.height = height;
		this.isRemovable = isRemovable;
	}
}

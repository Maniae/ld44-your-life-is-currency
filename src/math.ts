export interface Point {
	x: number;
	y: number;
}

export function norm(v: Point) {
	return Math.sqrt(v.x ** 2 + v.y ** 2);
}

export function circleIntersectRect(
	cX: number,
	cY: number,
	cR: number,
	rX: number,
	rY: number,
	rW: number,
	rH: number
) {
	const points: Point[] = [{ x: rX, y: rY }, { x: rX + rW, y: rY }, { x: rX + rW, y: rY + rH }, { x: rX, y: rY + rH }];
	return (
		pointInRect(cX, cY, rX, rY, rW, rH) ||
		lineIntersectCircle(points[0], points[1], { x: cX, y: cY }, cR) ||
		lineIntersectCircle(points[1], points[2], { x: cX, y: cY }, cR) ||
		lineIntersectCircle(points[2], points[3], { x: cX, y: cY }, cR) ||
		lineIntersectCircle(points[3], points[0], { x: cX, y: cY }, cR)
	);
}

export function pointInRect(x: number, y: number, rX: number, rY: number, rW: number, rH: number) {
	return rX <= x && x <= rX + rW && rY <= y && y <= rY + rH;
}

export function lineIntersectCircle(A: Point, B: Point, C: Point, radius: number) {
	let dist;
	const v1x = B.x - A.x;
	const v1y = B.y - A.y;
	const v2x = C.x - A.x;
	const v2y = C.y - A.y;
	// get the unit distance along the line of the closest point to
	// circle center
	const u = (v2x * v1x + v2y * v1y) / (v1y * v1y + v1x * v1x);

	// if the point is on the line segment get the distance squared
	// from that point to the circle center
	if (u >= 0 && u <= 1) {
		dist = (A.x + v1x * u - C.x) ** 2 + (A.y + v1y * u - C.y) ** 2;
	} else {
		// if closest point not on the line segment
		// use the unit distance to determine which end is closest
		// and get dist square to circle
		dist = u < 0 ? (A.x - C.x) ** 2 + (A.y - C.y) ** 2 : (B.x - C.x) ** 2 + (B.y - C.y) ** 2;
	}
	return dist < radius * radius;
}

export interface Rectangle {
	position: Point;
	width: number;
	height: number;
}

export function rectIntersectRect(r1: Rectangle, r2: Rectangle) {
	return !(
		r1.position.x > r2.position.x + r2.width ||
		r1.position.y > r2.position.y + r2.height ||
		r1.position.x + r1.width < r2.position.x ||
		r1.position.y + r1.height < r2.position.y
	);
}

export function vect(p1: Point, p2: Point) {
	return {
		x: p2.x - p1.x,
		y: p2.y - p1.y,
	};
}

export function normalize(p: Point) {
	if (norm(p) === 0) {
		return { x: 0, y: 0 };
	}
	return { x: p.x / norm(p), y: p.y / norm(p) };
}

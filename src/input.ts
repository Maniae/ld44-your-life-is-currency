export class Input {
	static onKeyPressed: (() => void) | null = null;

	private static _pressedKeys = new Map<string, boolean>();
	private static _justPressedKeys = new Map<string, boolean>();

	static Up = "ArrowUp";
	static Right = "ArrowRight";
	static Down = "ArrowDown";
	static Left = "ArrowLeft";
	static MouseLeft = "mouseLeft";
	static MouseRight = "mouseRight";
	static Z = "z";
	static Q = "q";
	static S = "s";
	static D = "d";
	static W = "w";
	static A = "a";

	static mousePosition = { x: 0, y: 0 };

	static init() {
		document.addEventListener("keydown", e => {
			// Prevent itch io scrolling
			if (e.keyCode == 32 || e.keyCode == 37 || e.keyCode == 38 || e.keyCode == 39 || e.keyCode == 40) {
				e.preventDefault();
			}
			Input._justPressedKeys.set(e.key, true);
			Input._pressedKeys.set(e.key, true);
			Input.onKeyPressed && Input.onKeyPressed();
		});
		document.addEventListener("keypress", e => {
			Input._justPressedKeys.set(e.key, false);
		});
		document.addEventListener("keyup", e => {
			Input._justPressedKeys.set(e.key, false);
			Input._pressedKeys.set(e.key, false);
		});
		document.addEventListener("mousedown", e => {
			Input.onKeyPressed && Input.onKeyPressed();
			if (e.button === 0) {
				Input._justPressedKeys.set(Input.MouseLeft, true);
				Input._pressedKeys.set(Input.MouseLeft, true);
			}
			if (e.button === 2) {
				Input._justPressedKeys.set(Input.MouseRight, true);
				Input._pressedKeys.set(Input.MouseRight, true);
			}
		});
		document.addEventListener("mouseup", e => {
			if (e.button === 0) {
				Input._justPressedKeys.set(Input.MouseLeft, false);
				Input._pressedKeys.set(Input.MouseLeft, false);
			}
			if (e.button === 2) {
				Input._justPressedKeys.set(Input.MouseRight, false);
				Input._pressedKeys.set(Input.MouseRight, false);
			}
		});
		document.addEventListener("mousemove", e => {
			const canvasRect = document.querySelector("#canvas")!.getClientRects()[0];
			Input.mousePosition = {
				x: e.clientX - canvasRect.left,
				y: e.clientY - canvasRect.top,
			};
		});
	}

	static isPressed(key: string) {
		return !!Input._pressedKeys.get(key);
	}

	static isJustPressed(key: string) {
		return !!Input._justPressedKeys.get(key);
	}
}

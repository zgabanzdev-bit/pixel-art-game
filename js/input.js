/* input.js — клавиатура: состояние «зажата» и «нажата в этом кадре» */
const Input = (() => {
  const down = {},
    pressedNow = {};
  const map = {
    ArrowLeft: ["left"],
    KeyA: ["left"],
    ArrowRight: ["right"],
    KeyD: ["right"],
    ArrowUp: ["up", "jump"],
    KeyW: ["up", "jump"],
    ArrowDown: ["down"],
    KeyS: ["down"],
    Space: ["jump", "enter"],
    Enter: ["enter"],
    KeyP: ["pause"],
    Escape: ["pause"],
    KeyM: ["mute"],
  };
  addEventListener("keydown", (e) => {
    const acts = map[e.code];
    if (!acts) return;
    e.preventDefault();
    acts.forEach((a) => {
      if (!down[a]) pressedNow[a] = true;
      down[a] = true;
    });
  });
  addEventListener("keyup", (e) => {
    const acts = map[e.code];
    if (!acts) return;
    acts.forEach((a) => {
      down[a] = false;
    });
  });
  addEventListener("blur", () => {
    for (const k in down) down[k] = false;
  });
  return {
    isDown: (a) => !!down[a],
    pressed: (a) => !!pressedNow[a],
    endFrame() {
      for (const k in pressedNow) delete pressedNow[k];
    },
    clear() {
      this.endFrame();
    },
  };
})();

const launchButton = document.querySelector(".rabbit-launch");
const gameDialog = document.querySelector("#rabbit-game");
const closeButton = document.querySelector(".game-close");
const canvas = document.querySelector("#rabbit-canvas");
const status = document.querySelector("#game-status");
const jumpButton = document.querySelector("#jump-button");
const restartButton = document.querySelector("#restart-button");
const motionPlayButton = document.querySelector("#motion-play-button");
const instructions = document.querySelector("#game-instructions");
const scoreForm = document.querySelector("#score-form");
const playerNameInput = document.querySelector("#player-name");
const scoreList = document.querySelector("#score-list");
const context = canvas.getContext("2d");

const canvasWidth = canvas.width;
const canvasHeight = canvas.height;
const groundY = 174;
const rabbit = { x: 92, width: 42, height: 48, offsetY: 0, velocityY: 0 };
const game = {
  running: false,
  over: false,
  score: 0,
  speed: 300,
  lastFrame: 0,
  spawnIn: 1.1,
  obstacles: [],
  frame: 0
};
let animationFrame = 0;
const scores = [];
const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
let motionOptIn = false;
let gamePausedForMotion = false;
const defaultInstructions = "Jump over the mushrooms! Press Space or ↑, tap the game, or use Jump.";

function needsMotionOptIn() {
  return motionPreference.matches && !motionOptIn;
}

function updateMotionControls() {
  const needsOptIn = needsMotionOptIn();
  motionPlayButton.hidden = !needsOptIn;
  jumpButton.disabled = needsOptIn;
  restartButton.disabled = needsOptIn;
  instructions.textContent = needsOptIn
    ? "Reduced motion is on. The runner is paused; choose Play animation to start."
    : defaultInstructions;
}

function renderScores() {
  scoreList.replaceChildren();
  if (scores.length === 0) {
    const emptyItem = document.createElement("li");
    emptyItem.className = "score-empty";
    emptyItem.textContent = "Play a run to add a score.";
    scoreList.append(emptyItem);
    return;
  }

  scores.forEach((entry, index) => {
    const item = document.createElement("li");
    const name = document.createElement("span");
    const value = document.createElement("strong");
    name.textContent = `${index + 1}. ${entry.name}`;
    value.textContent = String(entry.score);
    item.append(name, value);
    scoreList.append(item);
  });
}

function resetGame() {
  scoreForm.hidden = true;
  playerNameInput.value = "";
  playerNameInput.setCustomValidity("");
  game.running = false;
  game.over = false;
  game.score = 0;
  game.speed = 300;
  game.lastFrame = performance.now();
  game.spawnIn = 1.1;
  game.obstacles = [];
  game.frame = 0;
  rabbit.offsetY = 0;
  rabbit.velocityY = 0;
  if (needsMotionOptIn()) {
    gamePausedForMotion = true;
    status.textContent = "Reduced motion is on. Choose Play animation to start the runner.";
    updateMotionControls();
    draw();
    return;
  }

  gamePausedForMotion = false;
  updateMotionControls();
  game.running = true;
  status.textContent = "Game started. Press Space, Up Arrow, or Jump to hop.";
  draw();
  animationFrame = requestAnimationFrame(tick);
}

function stopGame() {
  game.running = false;
  cancelAnimationFrame(animationFrame);
}

function jump() {
  if (!gameDialog.open || needsMotionOptIn()) return;
  if (game.over) {
    resetGame();
    return;
  }
  if (game.running && rabbit.offsetY === 0) {
    rabbit.velocityY = -610;
  }
}

function drawRabbit(x, y) {
  context.fillStyle = "#fffaf0";
  context.fillRect(x + 9, y - 16, 8, 24);
  context.fillRect(x + 23, y - 24, 8, 32);
  context.fillRect(x + 7, y + 8, 28, 24);
  context.fillRect(x + 1, y + 22, 32, 19);
  context.fillRect(x + 26, y + 17, 15, 17);
  context.fillRect(x + 6, y + 40, 13, 7);
  context.fillRect(x + 24, y + 40, 13, 7);

  context.fillStyle = "#f3cada";
  context.fillRect(x + 11, y - 11, 3, 14);
  context.fillRect(x + 26, y - 19, 3, 20);
  context.fillRect(x + 35, y + 26, 4, 4);

  context.fillStyle = "#30314a";
  context.fillRect(x + 30, y + 22, 3, 3);
  context.fillRect(x + 38, y + 29, 3, 3);
}

function drawMushroom(x, height) {
  const top = groundY - height;
  context.fillStyle = "#e9a1a1";
  context.fillRect(x + 5, top, 24, 8);
  context.fillRect(x, top + 8, 34, 8);
  context.fillStyle = "#fffaf0";
  context.fillRect(x + 10, top + 6, 4, 4);
  context.fillRect(x + 23, top + 10, 4, 4);
  context.fillStyle = "#c29a84";
  context.fillRect(x + 10, top + 16, 14, height - 16);
  context.fillStyle = "#30314a";
  context.fillRect(x + 7, groundY - 2, 20, 2);
}

function drawScene() {
  context.clearRect(0, 0, canvasWidth, canvasHeight);
  context.fillStyle = "#dff2f7";
  context.fillRect(0, 0, canvasWidth, groundY);
  context.fillStyle = "#fffaf0";
  context.fillRect(102, 42, 44, 8);
  context.fillRect(92, 50, 64, 8);
  context.fillRect(540, 66, 32, 7);
  context.fillRect(532, 73, 48, 7);

  context.fillStyle = "#cde8cf";
  context.fillRect(0, groundY, canvasWidth, canvasHeight - groundY);
  context.fillStyle = "#88b991";
  context.fillRect(0, groundY, canvasWidth, 5);
  context.fillRect(24, groundY + 18, 8, 4);
  context.fillRect(210, groundY + 29, 12, 4);
  context.fillRect(446, groundY + 17, 10, 4);
  context.fillRect(632, groundY + 31, 8, 4);
  context.fillStyle = "#e8a9c2";
  context.fillRect(180, groundY + 8, 6, 6);
  context.fillRect(492, groundY + 25, 6, 6);

  context.fillStyle = "#30314a";
  context.font = "bold 12px monospace";
  context.textAlign = "right";
  context.fillText(`SCORE ${String(Math.floor(game.score)).padStart(4, "0")}`, canvasWidth - 16, 24);
}

function draw() {
  drawScene();
  const rabbitY = groundY - rabbit.height + rabbit.offsetY;
  drawRabbit(rabbit.x, rabbitY);
  for (const obstacle of game.obstacles) {
    drawMushroom(obstacle.x, obstacle.height);
  }

  if (game.over) {
    context.fillStyle = "rgba(48, 49, 74, 0.72)";
    context.fillRect(0, 0, canvasWidth, canvasHeight);
    context.fillStyle = "#fffaf0";
    context.textAlign = "center";
    context.font = "bold 22px monospace";
    context.fillText("RUN OVER!", canvasWidth / 2, 92);
    context.font = "bold 12px monospace";
    context.fillText("PRESS JUMP TO TRY AGAIN", canvasWidth / 2, 120);
  } else if (gamePausedForMotion) {
    context.fillStyle = "rgba(48, 49, 74, 0.72)";
    context.fillRect(0, 0, canvasWidth, canvasHeight);
    context.fillStyle = "#fffaf0";
    context.textAlign = "center";
    context.font = "bold 18px monospace";
    context.fillText("RUNNER PAUSED", canvasWidth / 2, 94);
    context.font = "bold 12px monospace";
    context.fillText("CHOOSE PLAY ANIMATION TO START", canvasWidth / 2, 120);
  }
}

function endGame() {
  game.over = true;
  game.running = false;
  scoreForm.hidden = false;
  status.textContent = `Game over. Your score was ${Math.floor(game.score)}. Enter your name to save it, or press Jump to try again.`;
  draw();
}

function tick(now) {
  if (!game.running || !gameDialog.open) return;
  const delta = Math.min((now - game.lastFrame) / 1000, 0.04);
  game.lastFrame = now;
  game.frame += delta;
  game.score += delta * 10;
  game.speed = Math.min(300 + game.score * 1.6, 520);
  game.spawnIn -= delta;

  if (game.spawnIn <= 0) {
    game.obstacles.push({ x: canvasWidth + 8, height: 26 + Math.floor(Math.random() * 12) });
    game.spawnIn = 1.05 + Math.random() * 0.8;
  }

  rabbit.velocityY += 1700 * delta;
  rabbit.offsetY = Math.min(0, rabbit.offsetY + rabbit.velocityY * delta);
  if (rabbit.offsetY === 0) rabbit.velocityY = 0;

  for (const obstacle of game.obstacles) {
    obstacle.x -= game.speed * delta;
    const rabbitBox = {
      left: rabbit.x + 8,
      right: rabbit.x + rabbit.width - 4,
      top: groundY - rabbit.height + rabbit.offsetY + 14,
      bottom: groundY - 3 + rabbit.offsetY
    };
    const obstacleBox = { left: obstacle.x + 4, right: obstacle.x + 29, top: groundY - obstacle.height + 8, bottom: groundY };
    if (rabbitBox.right > obstacleBox.left && rabbitBox.left < obstacleBox.right &&
        rabbitBox.bottom > obstacleBox.top && rabbitBox.top < obstacleBox.bottom) {
      endGame();
      return;
    }
  }
  game.obstacles = game.obstacles.filter((obstacle) => obstacle.x > -40);
  draw();
  animationFrame = requestAnimationFrame(tick);
}

launchButton.addEventListener("click", () => {
  scores.length = 0;
  renderScores();
  motionOptIn = false;
  gameDialog.showModal();
  resetGame();
});

closeButton.addEventListener("click", () => gameDialog.close());
gameDialog.addEventListener("close", () => {
  stopGame();
  scores.length = 0;
  renderScores();
  scoreForm.hidden = true;
  playerNameInput.value = "";
  motionOptIn = false;
  gamePausedForMotion = false;
});
jumpButton.addEventListener("click", jump);
restartButton.addEventListener("click", resetGame);
motionPlayButton.addEventListener("click", () => {
  motionOptIn = true;
  resetGame();
});
playerNameInput.addEventListener("input", () => playerNameInput.setCustomValidity(""));
scoreForm.addEventListener("submit", (event) => {
  event.preventDefault();
  if (!game.over) return;

  const name = playerNameInput.value.trim();
  if (!name) {
    playerNameInput.setCustomValidity("Enter a name to save your score.");
    playerNameInput.reportValidity();
    return;
  }

  scores.push({ name, score: Math.floor(game.score) });
  scores.sort((first, second) => second.score - first.score);
  scores.splice(5);
  renderScores();
  scoreForm.hidden = true;
  playerNameInput.value = "";
  status.textContent = `Score saved for ${name}. Press Jump to play again.`;
});
canvas.addEventListener("pointerdown", jump);
window.addEventListener("keydown", (event) => {
  if (!gameDialog.open || !["Space", "ArrowUp"].includes(event.code)) return;
  if (event.target.closest("input, textarea, select, button, a, [contenteditable]")) return;
  event.preventDefault();
  jump();
});

motionPreference.addEventListener("change", (event) => {
  if (event.matches) {
    motionOptIn = false;
    updateMotionControls();
    if (game.running) {
      stopGame();
      gamePausedForMotion = true;
      status.textContent = "Reduced motion was enabled. Choose Play animation to resume.";
      draw();
    }
    return;
  }

  updateMotionControls();
  if (gameDialog.open && gamePausedForMotion) {
    gamePausedForMotion = false;
    game.running = true;
    game.lastFrame = performance.now();
    status.textContent = "Reduced motion is off. Press Space, Up Arrow, or Jump to hop.";
    draw();
    animationFrame = requestAnimationFrame(tick);
  }
});

gameDialog.addEventListener("click", (event) => {
  if (event.target === gameDialog) gameDialog.close();
});

renderScores();

const gameArea = document.getElementById('gameArea');
const paddleEl = document.getElementById('paddle');
const ballEl   = document.getElementById('ball');
const bricksEl = document.getElementById('bricks');
const livesEl  = document.getElementById('livesVal');
const scoreEl  = document.getElementById('scoreVal');

const GAME_WIDTH  = 480;
const GAME_HEIGHT = 640;

const PADDLE_SPEED  = 7;
const BALL_SPEED    = 4;
const INITIAL_LIVES = 5;

const BRICK_ROWS    = 4;
const BRICK_COLS    = 7;
const BRICK_PADDING = 6;
const BRICK_HEIGHT  = 24;
const BRICK_OFFSET_TOP  = 50;
const BRICK_OFFSET_LEFT = 14;
const BRICK_WIDTH   = (GAME_WIDTH
    - BRICK_OFFSET_LEFT * 2
    - BRICK_PADDING * (BRICK_COLS - 1)) / BRICK_COLS;

const PADDLE_WIDTH  = paddleEl.offsetWidth;
const PADDLE_HEIGHT = paddleEl.offsetHeight;
const BALL_SIZE     = ballEl.offsetWidth;

const paddle = {
    x: GAME_WIDTH / 2 - PADDLE_WIDTH / 2,
    y: GAME_HEIGHT - 40,
    width: PADDLE_WIDTH,
    height: PADDLE_HEIGHT,
    speed: PADDLE_SPEED
};

const ball = {
    x: GAME_WIDTH / 2,
    y: GAME_HEIGHT - 60,
    vx: 0,
    vy: 0,
    radius: BALL_SIZE / 2
};

const keys = { ArrowLeft: false, ArrowRight: false, KeyA: false, KeyD: false };

let bricks = [];
let lives  = INITIAL_LIVES;
let score  = 0;

window.addEventListener('keydown', (e) => {
    if (keys.hasOwnProperty(e.code)) {
        keys[e.code] = true;
        e.preventDefault();
    }
});

window.addEventListener('keyup', (e) => {
    if (keys.hasOwnProperty(e.code)) keys[e.code] = false;
});

gameArea.addEventListener('mousemove', (e) => {
    const rect = gameArea.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    paddle.x = Math.max(0, Math.min(GAME_WIDTH - paddle.width, mouseX - paddle.width / 2));
});

function resetBall() {
    ball.x = GAME_WIDTH / 2;
    ball.y = GAME_HEIGHT - 60;
    const angle = (Math.random() * Math.PI * 2 / 3) + Math.PI / 6;
    ball.vx = BALL_SPEED * Math.cos(angle);
    ball.vy = -BALL_SPEED * Math.sin(angle);
}

function initBricks() {
    bricksEl.innerHTML = '';
    bricks = [];

    for (let r = 0; r < BRICK_ROWS; r++) {
        bricks[r] = [];
        for (let c = 0; c < BRICK_COLS; c++) {
            const x = BRICK_OFFSET_LEFT + c * (BRICK_WIDTH + BRICK_PADDING);
            const y = BRICK_OFFSET_TOP  + r * (BRICK_HEIGHT + BRICK_PADDING);

            const div = document.createElement('div');
            div.className = 'brick';
            div.style.width = BRICK_WIDTH + 'px';
            div.style.transform = `translate(${x}px, ${y}px)`;
            bricksEl.appendChild(div);

            bricks[r][c] = { x, y, hp: 1, status: 1, el: div };
        }
    }
}

function update() {
    if (keys.ArrowLeft  || keys.KeyA) paddle.x -= paddle.speed;
    if (keys.ArrowRight || keys.KeyD) paddle.x += paddle.speed;
    if (paddle.x < 0) paddle.x = 0;
    if (paddle.x + paddle.width > GAME_WIDTH) paddle.x = GAME_WIDTH - paddle.width;

    ball.x += ball.vx;
    ball.y += ball.vy;

    if (ball.x - ball.radius <= 0) {
        ball.x  = ball.radius;
        ball.vx = -ball.vx;
    } else if (ball.x + ball.radius >= GAME_WIDTH) {
        ball.x  = GAME_WIDTH - ball.radius;
        ball.vx = -ball.vx;
    }
    if (ball.y - ball.radius <= 0) {
        ball.y  = ball.radius;
        ball.vy = -ball.vy;
    }

    {
        const closestX = Math.max(paddle.x, Math.min(ball.x, paddle.x + paddle.width));
        const closestY = Math.max(paddle.y, Math.min(ball.y, paddle.y + paddle.height));
        const dx = ball.x - closestX;
        const dy = ball.y - closestY;

        if (dx * dx + dy * dy <= ball.radius * ball.radius && ball.vy > 0) {
            ball.y = paddle.y - ball.radius;
            const hitPoint = (ball.x - (paddle.x + paddle.width / 2)) / (paddle.width / 2);
            ball.vx = hitPoint * BALL_SPEED * 0.9;
            ball.vy = -Math.sqrt(Math.max(0.01, BALL_SPEED * BALL_SPEED - ball.vx * ball.vx));
        }
    }

    for (let r = 0; r < BRICK_ROWS; r++) {
        for (let c = 0; c < BRICK_COLS; c++) {
            const b = bricks[r][c];
            if (b.status !== 1) continue;

            const closestX = Math.max(b.x, Math.min(ball.x, b.x + BRICK_WIDTH));
            const closestY = Math.max(b.y, Math.min(ball.y, b.y + BRICK_HEIGHT));
            const dx = ball.x - closestX;
            const dy = ball.y - closestY;
            const distSq = dx * dx + dy * dy;

            if (distSq <= ball.radius * ball.radius) {
                if (Math.abs(dx) > Math.abs(dy)) {
                    ball.vx = -ball.vx;
                    ball.x += Math.sign(ball.vx) * (ball.radius - Math.abs(dx));
                } else {
                    ball.vy = -ball.vy;
                    ball.y += Math.sign(ball.vy) * (ball.radius - Math.abs(dy));
                }

                b.status = 0;
                b.el.remove();
                score += 10;
                break;
            }
        }
    }

    if (ball.y - ball.radius > GAME_HEIGHT) {
        lives--;
        if (lives <= 0) {
            alert('GAME OVER! Score: ' + score);
            lives = INITIAL_LIVES;
            score = 0;
            initBricks();
        }
        resetBall();
    }
}

function render() {
    paddleEl.style.transform = `translate(${paddle.x}px, ${paddle.y}px)`;
    ballEl.style.transform   = `translate(${ball.x - ball.radius}px, ${ball.y - ball.radius}px)`;
    livesEl.textContent = lives;
    scoreEl.textContent = score;
}

function gameLoop() {
    update();
    render();
    requestAnimationFrame(gameLoop);
}

initBricks();
resetBall();
requestAnimationFrame(gameLoop);
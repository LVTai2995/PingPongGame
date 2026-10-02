const gameArea = document.getElementById('gameArea');
const paddleEl = document.getElementById('paddle');
const ballEl = document.getElementById('ball');
const bricksEl = document.getElementById('bricks');
const livesEl = document.getElementById('livesVal');
const scoreEl = document.getElementById('scoreVal');
const overlayEl = document.getElementById('overlay');
const overlayTitle = document.getElementById('overlayTitle');
const overlayText = document.getElementById('overlayText');
const levelMenu = document.getElementById('levelMenu');

const GAME_WIDTH = 480;
const GAME_HEIGHT = 640;

const PADDLE_SPEED = 7;
const BALL_SPEED = 4;
const INITIAL_LIVES = 5;

const BRICK_COLS       = 7;
const BRICK_PADDING = 6;
const BRICK_HEIGHT = 24;
const BRICK_OFFSET_TOP = 50;
const BRICK_OFFSET_LEFT = 14;
const BRICK_WIDTH = (GAME_WIDTH
    - BRICK_OFFSET_LEFT * 2
    - BRICK_PADDING * (BRICK_COLS - 1)) / BRICK_COLS;

const PADDLE_WIDTH = paddleEl.offsetWidth;
const PADDLE_HEIGHT = paddleEl.offsetHeight;
const BALL_SIZE = ballEl.offsetWidth;

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

const LEVELS = [
    {
        name: 'Level 1',
        rows: [
            [1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1]
        ]
    },
    {
        name: 'Level 2',
        rows: [
            [1, 1, 1, 1, 1, 1, 1],
            [0, 2, 2, 2, 2, 2, 0],
            [0, 0, 3, 3, 3, 0, 0],
            [0, 0, 0, 4, 0, 0, 0]
        ]
    },
    {
        name: 'Level 3',
        rows: [
            [-1, -1, -1, -1, -1, -1, -1],
            [4,  4,  4,  4,  4,  4,  4],
            [1,  3,  0,  0,  0,  3,  1],
            [1,  0,  2,  1,  2,  0,  1],
            [-1, -1, -1, 1, -1, -1, -1]
        ]
    },
    {
        name: 'Level 4',
        rows: [
            [-1, -1, -1, -1, -1, -1, -1],
            [1,  1,  1,  1,  1,  1,  1],
            [1,  4,  3,  0,  3,  4,  1],
            [1,  4,  3,  0,  3,  4,  1],
            [-1,  4,  3,  0,  3,  4,  -1],
            [-1,  4, -1,  0, -1,  4,  -1],
            [-1, -1, -1, 0, -1, -1, -1]
        ]
    }
];

let currentLevel = 0;

const keys = {ArrowLeft: false, ArrowRight: false, KeyA: false, KeyD: false};

let bricks = [];
let lives = INITIAL_LIVES;
let score = 0;

const STATE = {READY: 0, PLAYING: 1, PAUSED: 2, GAME_OVER: 3,  WIN: 4};
let gameState = STATE.READY;

window.addEventListener('keydown', (e) => {
    if (e.code == 'Space') {
        e.preventDefault()
        toggleGameState();
        return
    }

    if (gameState === STATE.PAUSED) {
        const num = parseInt(e.key);
        if (!isNaN(num) && num >= 1 && num <= LEVELS.length) {
            e.preventDefault();
            selectLevel(num - 1);
            return;
        }
    }

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

levelMenu.addEventListener('click', (e) => {
    if (e.target.classList.contains('level-btn')) {
        e.preventDefault();
        const levelIndex = parseInt(e.target.dataset.level);
        selectLevel(levelIndex);
    }
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

    const level = LEVELS[currentLevel];
    const ROWS  = level.rows.length;
    const COLS  = level.rows[0].length;

    for (let r = 0; r < ROWS; r++) {
        bricks[r] = [];
        for (let c = 0; c < COLS; c++) {
            const cell = level.rows[r][c];

            if (cell === 0) {
                bricks[r][c] = { status: 0, indestructible: false };
                continue;
            }

            const x = BRICK_OFFSET_LEFT + c * (BRICK_WIDTH + BRICK_PADDING);
            const y = BRICK_OFFSET_TOP  + r * (BRICK_HEIGHT + BRICK_PADDING);

            const isIndestructible = (cell === -1);

            const div = document.createElement('div');
            div.className = 'brick';
            div.style.width = BRICK_WIDTH + 'px';
            div.style.transform = `translate(${x}px, ${y}px)`;

            if (isIndestructible) {
                div.classList.add('brick--indestructible');
                div.textContent = '';
            } else {
                const hp = cell;
                div.dataset.hp = hp;
                div.textContent = hp;
            }

            bricksEl.appendChild(div);

            bricks[r][c] = {
                x, y,
                hp: isIndestructible ? Infinity : cell,
                points: isIndestructible ? 0 : cell * 10,
                status: 1,
                indestructible: isIndestructible,
                el: div
            };
        }
    }
}

function setOverlay(state) {
    overlayEl.className = 'overlay';

    if (state === STATE.READY) {
        overlayEl.classList.add('overlay--ready');
        overlayTitle.textContent = 'READY';
        overlayText.textContent = 'Press SPACE to start';
    } else if (state === STATE.PAUSED) {
        overlayEl.classList.add('overlay--paused');
        overlayTitle.textContent = 'PAUSED';
        overlayText.textContent = 'Press SPACE to resume';
        levelMenu.style.display  = 'block';
        updateLevelMenu();
    } else if (state === STATE.GAME_OVER) {
        overlayEl.classList.add('overlay--gameover');
        overlayTitle.textContent = 'GAME OVER';
        overlayText.textContent = 'Score: ' + score + ' — Press SPACE to restart';
    } else if (state === STATE.WIN) {                       
        overlayEl.classList.add('overlay--gameover');         
        overlayTitle.textContent = 'YOU WIN!';
        overlayText.textContent  = 'Final Score: ' + score + ' — Press SPACE to play again';
        levelMenu.style.display  = 'none';
    }
}

function toggleGameState() {
    if (gameState === STATE.READY) {
        startGame();
    } else if (gameState === STATE.PLAYING) {
        gameState = STATE.PAUSED;
        setOverlay(STATE.PAUSED);
    } else if (gameState === STATE.PAUSED) {
        gameState = STATE.PLAYING;
        overlayEl.classList.add('overlay--playing');
        levelMenu.style.display = 'none';
    } else if (gameState === STATE.GAME_OVER || gameState === STATE.WIN) {
        resetGame();
    }
}

function startGame() {
    gameState = STATE.PLAYING;
    overlayEl.classList.add('overlay--playing');
    resetBall();
}

function resetGame() {
    lives         = INITIAL_LIVES;
    score         = 0;
    currentLevel  = 0;
    initBricks();
    resetBall();
    gameState = STATE.READY;
    overlayTitle.textContent = LEVELS[0].name;
    overlayText.textContent  = 'Press SPACE to start';
    setOverlay(STATE.READY);
}

function checkLevelComplete() {
    for (let r = 0; r < bricks.length; r++) {
        for (let c = 0; c < bricks[r].length; c++) {
            const b = bricks[r][c];
            if (b.status === 1 && !b.indestructible) {
                return;
            }
        }
    }

    if (currentLevel < LEVELS.length - 1) {
        currentLevel++;
        gameState = STATE.READY;
        initBricks();
        resetBall();
        setOverlay(STATE.READY);
        overlayTitle.textContent = LEVELS[currentLevel].name;
        overlayText.textContent  = 'Press SPACE to start';
    } else {
        gameState = STATE.WIN;
        overlayTitle.textContent = 'YOU WIN!';
        overlayText.textContent  = 'Final Score: ' + score + ' — Press SPACE to play again';
        setOverlay(STATE.WIN);
    }
}

function updateLevelMenu() {
    const buttons = levelMenu.querySelectorAll('.level-btn');
    buttons.forEach(btn => {
        const lv = parseInt(btn.dataset.level);
        btn.style.opacity = (lv === currentLevel) ? '0.5' : '1';
        btn.style.cursor  = (lv === currentLevel) ? 'default' : 'pointer';
        btn.disabled = (lv === currentLevel);
    });
}

function selectLevel(levelIndex) {
    if (levelIndex < 0 || levelIndex >= LEVELS.length) return;
    if (levelIndex === currentLevel) return;

    currentLevel = levelIndex;
    initBricks();
    resetBall();
    gameState = STATE.READY;
    setOverlay(STATE.READY);
}

function update() {
    if (gameState !== STATE.PLAYING) return;

    if (keys.ArrowLeft || keys.KeyA) paddle.x -= paddle.speed;
    if (keys.ArrowRight || keys.KeyD) paddle.x += paddle.speed;

    if (paddle.x < 0) paddle.x = 0;
    if (paddle.x + paddle.width > GAME_WIDTH) paddle.x = GAME_WIDTH - paddle.width;

    ball.x += ball.vx;
    ball.y += ball.vy;

    if (ball.x - ball.radius <= 0) {
        ball.x = ball.radius;
        ball.vx = -ball.vx;
    } else if (ball.x + ball.radius >= GAME_WIDTH) {
        ball.x = GAME_WIDTH - ball.radius;
        ball.vx = -ball.vx;
    }
    if (ball.y - ball.radius <= 0) {
        ball.y = ball.radius;
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

    for (let r = 0; r < bricks.length; r++) {
        for (let c = 0; c < bricks[r].length; c++) {
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

                if (b.indestructible) {
                    break;
                }

                b.hp--;
                if (b.hp <= 0) {
                    b.status = 0;
                    b.el.remove();
                    score += b.points;
                    checkLevelComplete()
                } else {
                    b.el.textContent = b.hp;
                    b.el.dataset.hp = b.hp;
                }
                break;
            }
        }
    }

    if (ball.y - ball.radius > GAME_HEIGHT) {
        lives--;
        if (lives <= 0) {
            gameState = STATE.GAME_OVER;
            setOverlay(STATE.GAME_OVER);
            return;
        }
        resetBall();
    }
}

function render() {
    paddleEl.style.transform = `translate(${paddle.x}px, ${paddle.y}px)`;
    ballEl.style.transform = `translate(${ball.x - ball.radius}px, ${ball.y - ball.radius}px)`;
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
overlayTitle.textContent = LEVELS[0].name;
overlayText.textContent  = 'Press SPACE to start';
setOverlay(STATE.READY);
requestAnimationFrame(gameLoop);
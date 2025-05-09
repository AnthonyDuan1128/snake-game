const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const socket = io();
const startButton = document.getElementById('startGame');
const pauseButton = document.getElementById('pauseGame');
const difficultySelect = document.getElementById('difficulty');
const scoreDisplay = document.getElementById('score');
const fullscreenBtn = document.getElementById('fullscreenBtn');

// 固定格子数
const tileCount = 20;

// Set initial canvas size
canvas.width = 600;
canvas.height = 600;

function getGridSize() {
    return Math.floor(Math.min(canvas.width, canvas.height) / tileCount);
}

// Game state
let snake = [];
let food = {};
let direction = 'right';
let nextDirection = 'right';
let gameLoop;
let score = 0;
let isPaused = false;
let gameSpeed = 200; // Default speed (ms)
let difficultyMultiplier = {
    'easy': 0.8,
    'normal': 1,
    'hard': 1.5
};

// Fullscreen functionality
function toggleFullscreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(err => {
            console.error(`Error attempting to enable fullscreen: ${err.message}`);
        });
    } else {
        document.exitFullscreen();
    }
}

// Update canvas size when entering/exiting fullscreen
document.addEventListener('fullscreenchange', () => {
    if (document.fullscreenElement) {
        // Entering fullscreen
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    } else {
        // Exiting fullscreen
        canvas.width = 600;
        canvas.height = 600;
    }
    draw(); // Redraw the game
});

// Initialize game
function initGame() {
    // Reset snake
    snake = [
        {x: 5, y: 5},
        {x: 4, y: 5},
        {x: 3, y: 5}
    ];
    
    // Reset direction
    direction = 'right';
    nextDirection = 'right';
    
    // Reset score
    score = 0;
    scoreDisplay.textContent = score;
    
    // Generate food
    generateFood();
    
    // Set game speed based on difficulty
    switch(difficultySelect.value) {
        case 'easy':
            gameSpeed = 200;
            break;
        case 'medium':
            gameSpeed = 150;
            break;
        case 'hard':
            gameSpeed = 100;
            break;
    }
}

// Generate food at random position
function generateFood() {
    food = {
        x: Math.floor(Math.random() * tileCount),
        y: Math.floor(Math.random() * tileCount)
    };
    
    // Make sure food doesn't spawn on snake
    for (let segment of snake) {
        if (segment.x === food.x && segment.y === food.y) {
            generateFood();
            break;
        }
    }
}

// Draw game
function draw() {
    // Clear canvas
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    const gridSize = getGridSize();
    // Draw snake
    ctx.fillStyle = '#00ff00';
    for (let segment of snake) {
        ctx.fillRect(segment.x * gridSize, segment.y * gridSize, gridSize - 2, gridSize - 2);
    }
    
    // Draw food
    ctx.fillStyle = '#ff0000';
    ctx.fillRect(food.x * gridSize, food.y * gridSize, gridSize - 2, gridSize - 2);
}

// Update game state
function update() {
    // Update direction
    direction = nextDirection;
    
    // Calculate new head position
    const head = {x: snake[0].x, y: snake[0].y};
    switch(direction) {
        case 'up':
            head.y--;
            break;
        case 'down':
            head.y++;
            break;
        case 'left':
            head.x--;
            break;
        case 'right':
            head.x++;
            break;
    }
    
    // Check for collisions
    if (head.x < 0 || head.x >= tileCount || head.y < 0 || head.y >= tileCount) {
        gameOver();
        return;
    }
    
    for (let segment of snake) {
        if (head.x === segment.x && head.y === segment.y) {
            gameOver();
            return;
        }
    }
    
    // Add new head
    snake.unshift(head);
    
    // Check for food
    if (head.x === food.x && head.y === food.y) {
        // Increase score
        score += 10;
        scoreDisplay.textContent = score;
        
        // Generate new food
        generateFood();
    } else {
        // Remove tail
        snake.pop();
    }
}

// Game over
function gameOver() {
    clearInterval(gameLoop);
    alert(`Game Over! Your score: ${score}`);
    startButton.style.display = 'block';
    pauseButton.style.display = 'none';
}

// Start game
function startGame() {
    initGame();
    gameLoop = setInterval(() => {
        if (!isPaused) {
            update();
            draw();
        }
    }, gameSpeed);
    
    startButton.style.display = 'none';
    pauseButton.style.display = 'block';
}

// Pause game
function togglePause() {
    isPaused = !isPaused;
    pauseButton.textContent = isPaused ? 'Resume' : 'Pause';
}

// Event listeners
startButton.addEventListener('click', startGame);
pauseButton.addEventListener('click', togglePause);
fullscreenBtn.addEventListener('click', toggleFullscreen);

document.addEventListener('keydown', (e) => {
    switch(e.key) {
        case 'ArrowUp':
            if (direction !== 'down') nextDirection = 'up';
            break;
        case 'ArrowDown':
            if (direction !== 'up') nextDirection = 'down';
            break;
        case 'ArrowLeft':
            if (direction !== 'right') nextDirection = 'left';
            break;
        case 'ArrowRight':
            if (direction !== 'left') nextDirection = 'right';
            break;
        case 'w':
            if (direction !== 'down') nextDirection = 'up';
            break;
        case 's':
            if (direction !== 'up') nextDirection = 'down';
            break;
        case 'a':
            if (direction !== 'right') nextDirection = 'left';
            break;
        case 'd':
            if (direction !== 'left') nextDirection = 'right';
            break;
        case 'f':
            toggleFullscreen();
            break;
    }
});

// 难度选择
difficultySelect.addEventListener('change', () => {
    const difficulty = difficultySelect.value;
    socket.emit('set_difficulty', { difficulty });
    updateGameSpeed();
});

function updateGameSpeed() {
    const difficulty = difficultySelect.value;
    gameSpeed = 200 / difficultyMultiplier[difficulty];
}

// Socket.IO 事件处理
socket.on('game_state', (state) => {
    snake = state.snake;
    food = state.food;
    difficultySelect.value = state.difficulty;
    updateGameSpeed();
});

// 触控按钮事件
const btnUp = document.getElementById('btn-up');
const btnDown = document.getElementById('btn-down');
const btnLeft = document.getElementById('btn-left');
const btnRight = document.getElementById('btn-right');
if (btnUp && btnDown && btnLeft && btnRight) {
    btnUp.addEventListener('touchstart', function(e) { e.preventDefault(); if (direction !== 'down') nextDirection = 'up'; });
    btnDown.addEventListener('touchstart', function(e) { e.preventDefault(); if (direction !== 'up') nextDirection = 'down'; });
    btnLeft.addEventListener('touchstart', function(e) { e.preventDefault(); if (direction !== 'right') nextDirection = 'left'; });
    btnRight.addEventListener('touchstart', function(e) { e.preventDefault(); if (direction !== 'left') nextDirection = 'right'; });
} 
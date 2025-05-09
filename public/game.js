const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const socket = io();

const gridSize = 20;
const tileSize = canvas.width / gridSize;

let snake = [
    {x: 10, y: 10}
];
let food = {x: 5, y: 5};
let direction = 'right';
let nextDirection = 'right';
let gameSpeed = 200;
let gameRunning = true;

// 监听键盘输入
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
    }
});

// 游戏主循环
function gameLoop() {
    if (!gameRunning) return;
    
    direction = nextDirection;
    moveSnake();
    checkCollision();
    draw();
    setTimeout(gameLoop, gameSpeed);
}

// 移动蛇
function moveSnake() {
    const head = {...snake[0]};
    
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
    
    snake.unshift(head);
    
    // 检查是否吃到食物
    if (head.x === food.x && head.y === food.y) {
        generateFood();
    } else {
        snake.pop();
    }
}

// 生成食物
function generateFood() {
    food = {
        x: Math.floor(Math.random() * gridSize),
        y: Math.floor(Math.random() * gridSize)
    };
    
    // 确保食物不会出现在蛇身上
    for (let segment of snake) {
        if (segment.x === food.x && segment.y === food.y) {
            generateFood();
            return;
        }
    }
}

// 碰撞检测
function checkCollision() {
    const head = snake[0];
    
    // 检查是否撞墙
    if (head.x < 0 || head.x >= gridSize || head.y < 0 || head.y >= gridSize) {
        gameOver();
        return;
    }
    
    // 检查是否撞到自己
    for (let i = 1; i < snake.length; i++) {
        if (head.x === snake[i].x && head.y === snake[i].y) {
            gameOver();
            return;
        }
    }
}

// 游戏结束
function gameOver() {
    gameRunning = false;
    alert('游戏结束! 按F5重新开始');
}

// 绘制游戏
function draw() {
    // 清空画布
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // 绘制蛇
    ctx.fillStyle = '#333';
    for (let segment of snake) {
        ctx.fillRect(segment.x * tileSize, segment.y * tileSize, tileSize, tileSize);
    }
    
    // 绘制食物
    ctx.fillStyle = '#f00';
    ctx.fillRect(food.x * tileSize, food.y * tileSize, 20, 20);
}

// 开始游戏
generateFood();
gameLoop();

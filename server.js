const express = require('express');
const socketio = require('socket.io');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// 设置静态文件目录
app.use(express.static(path.join(__dirname, 'public')));

// 启动服务器
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// 设置Socket.io
const io = socketio(server);

// 游戏状态
let gameState = {
  players: {},
  food: { x: 0, y: 0 },
  gridSize: 20
};

// 生成随机食物位置
function generateFood() {
  gameState.food = {
    x: Math.floor(Math.random() * gameState.gridSize),
    y: Math.floor(Math.random() * gameState.gridSize)
  };
}

// Socket连接处理
io.on('connection', (socket) => {
  console.log('New player connected:', socket.id);
  
  // 初始化新玩家
  gameState.players[socket.id] = {
    id: socket.id,
    snake: [{x: 10, y: 10}],
    direction: 'right'
  };

  // 生成初始食物
  if (Object.keys(gameState.players).length === 1) {
    generateFood();
  }

  // 发送当前游戏状态
  socket.emit('gameState', gameState);

  // 处理玩家移动
  socket.on('move', (direction) => {
    if (gameState.players[socket.id]) {
      gameState.players[socket.id].direction = direction;
    }
  });

  // 玩家断开连接
  socket.on('disconnect', () => {
    console.log('Player disconnected:', socket.id);
    delete gameState.players[socket.id];
  });
});

// 游戏循环
setInterval(() => {
  // 更新所有玩家蛇的位置
  Object.keys(gameState.players).forEach(id => {
    const player = gameState.players[id];
    const head = {...player.snake[0]};

    // 根据方向移动蛇头
    switch(player.direction) {
      case 'up': head.y--; break;
      case 'down': head.y++; break;
      case 'left': head.x--; break;
      case 'right': head.x++; break;
    }

    // 检查边界
    if (head.x < 0 || head.x >= gameState.gridSize || 
        head.y < 0 || head.y >= gameState.gridSize) {
      // 重置玩家
      player.snake = [{x: 10, y: 10}];
      player.direction = 'right';
      return;
    }

    // 检查是否吃到食物
    if (head.x === gameState.food.x && head.y === gameState.food.y) {
      player.snake.unshift(head);
      generateFood();
    } else {
      // 移动蛇
      player.snake.unshift(head);
      player.snake.pop();
    }
  });

  // 广播更新后的游戏状态
  io.emit('gameState', gameState);
}, 200);

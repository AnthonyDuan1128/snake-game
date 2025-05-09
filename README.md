# Snake Game

一个基于 Flask 和 Socket.IO 的多人贪吃蛇游戏。

## 功能特点

- 用户注册和登录系统
- 多种难度级别（简单、普通、困难）
- 实时分数追踪
- 全球排行榜
- 响应式设计

## 安装说明

1. 确保已安装 Python 3.7+
2. 使用清华镜像源安装依赖：
   ```bash
   pip install -i https://pypi.tuna.tsinghua.edu.cn/simple -r requirements.txt
   ```

3. 运行应用：
   ```bash
   python app.py
   ```

4. 在浏览器中访问 http://localhost:5000

## 游戏控制

- 使用方向键（↑↓←→）控制蛇的移动
- 在游戏页面选择难度级别
- 点击"Start New Game"开始新游戏

## 技术栈

- 后端：Flask, Flask-SQLAlchemy, Flask-Login, Flask-SocketIO
- 前端：HTML5 Canvas, JavaScript, Bootstrap 5
- 数据库：SQLite 
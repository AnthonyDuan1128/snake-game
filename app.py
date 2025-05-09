from flask import Flask, render_template, request, redirect, url_for, flash, session
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager, UserMixin, login_user, login_required, logout_user, current_user
from flask_socketio import SocketIO, emit
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime
import os
import re

app = Flask(__name__)
app.config['SECRET_KEY'] = os.urandom(24)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///snake.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)
socketio = SocketIO(app)
login_manager = LoginManager(app)
login_manager.login_view = 'login'

# Language support
LANGUAGES = {
    'en': {
        'title': 'Login',
        'username': 'Username',
        'password': 'Password',
        'confirm_password': 'Confirm Password',
        'submit': 'Login',
        'no_account': "Don't have an account?",
        'register_link': 'Register here',
        'welcome_title': 'Welcome to Snake Game',
        'welcome_message': 'Challenge yourself with different difficulty levels and compete with other players!',
        'play_now': 'Play Now',
        'login': 'Login',
        'register': 'Register',
        'home': 'Home',
        'play': 'Play',
        'leaderboard': 'Leaderboard',
        'logout': 'Logout',
        'game_title': 'Snake Game',
        'game_controls': 'Game Controls',
        'controls_arrow': 'Use arrow keys to control the snake',
        'controls_wasd': 'Or use WASD keys',
        'game_settings': 'Game Settings',
        'difficulty': 'Difficulty',
        'easy': 'Easy',
        'medium': 'Medium',
        'hard': 'Hard',
        'score': 'Score',
        'start_game': 'Start Game',
        'pause_game': 'Pause',
        'leaderboard_title': 'Leaderboard',
        'last_played': 'Last Played',
        'fullscreen': 'Fullscreen'
    },
    'zh': {
        'title': '登录',
        'username': '用户名',
        'password': '密码',
        'confirm_password': '确认密码',
        'submit': '登录',
        'no_account': '还没有账号？',
        'register_link': '立即注册',
        'welcome_title': '欢迎来到贪吃蛇游戏',
        'welcome_message': '挑战不同难度级别，与其他玩家一较高下！',
        'play_now': '开始游戏',
        'login': '登录',
        'register': '注册',
        'home': '首页',
        'play': '游戏',
        'leaderboard': '排行榜',
        'logout': '退出',
        'game_title': '贪吃蛇游戏',
        'game_controls': '游戏控制',
        'controls_arrow': '使用方向键控制蛇的移动',
        'controls_wasd': '或使用WASD键',
        'game_settings': '游戏设置',
        'difficulty': '难度',
        'easy': '简单',
        'medium': '中等',
        'hard': '困难',
        'score': '分数',
        'start_game': '开始游戏',
        'pause_game': '暂停',
        'leaderboard_title': '排行榜',
        'last_played': '最后游戏时间',
        'fullscreen': '全屏'
    }
}

# User model
class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password_hash = db.Column(db.String(120), nullable=False)
    high_score = db.Column(db.Integer, default=0)
    last_played = db.Column(db.DateTime, default=datetime.utcnow)

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

# Middleware to set default language
@app.before_request
def before_request():
    if 'lang' not in session:
        session['lang'] = 'zh'  # Default to Chinese

@app.route('/set_language/<lang>')
def set_language(lang):
    if lang in LANGUAGES:
        session['lang'] = lang
    return redirect(request.referrer or url_for('index'))

@app.route('/')
def index():
    return render_template('index.html', lang=LANGUAGES[session['lang']])

@app.route('/register', methods=['GET', 'POST'])
def register():
    if current_user.is_authenticated:
        return redirect(url_for('index'))
    
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']
        confirm_password = request.form['confirm_password']
        
        if not username or not password:
            flash('Username and password are required', 'danger')
            return redirect(url_for('register'))
        
        if password != confirm_password:
            flash('Passwords do not match', 'danger')
            return redirect(url_for('register'))
        
        if User.query.filter_by(username=username).first():
            flash('Username already exists', 'danger')
            return redirect(url_for('register'))
        
        user = User(username=username)
        user.set_password(password)
        db.session.add(user)
        db.session.commit()
        
        flash('Registration successful! Please login.', 'success')
        return redirect(url_for('login'))
    
    return render_template('register.html', lang=LANGUAGES[session['lang']])

@app.route('/login', methods=['GET', 'POST'])
def login():
    if current_user.is_authenticated:
        return redirect(url_for('index'))
    
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']
        user = User.query.filter_by(username=username).first()
        
        if user and user.check_password(password):
            login_user(user)
            return redirect(url_for('index'))
        
        flash('Invalid username or password', 'danger')
    
    return render_template('login.html', lang=LANGUAGES[session['lang']])

@app.route('/logout')
@login_required
def logout():
    logout_user()
    return redirect(url_for('index'))

@app.route('/game')
@login_required
def game():
    return render_template('game.html', lang=LANGUAGES[session['lang']])

@app.route('/leaderboard')
def leaderboard():
    users = User.query.order_by(User.high_score.desc()).limit(10).all()
    return render_template('leaderboard.html', users=users, lang=LANGUAGES[session['lang']])

@socketio.on('set_difficulty')
def handle_difficulty(data):
    difficulty = data['difficulty']
    emit('difficulty_set', {'difficulty': difficulty}, broadcast=True)

@socketio.on('update_score')
def handle_score(data):
    if current_user.is_authenticated:
        score = data['score']
        if score > current_user.high_score:
            current_user.high_score = score
            current_user.last_played = datetime.utcnow()
            db.session.commit()
            emit('score_updated', {'username': current_user.username, 'score': score}, broadcast=True)

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    socketio.run(app, debug=True) 
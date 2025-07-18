let score = 0;
const colors = ['#ff0000', '#ff69b4', '#ff1493', '#c71585'];
let heartInterval;
let bombInterval;
let freezeInterval;
let isGameRunning = false;
let isFrozen = false;
let freezeTimer = null;

const gameContainer = document.getElementById('game');
const scoreElement = document.getElementById('score');
const stopButton = document.getElementById('stopButt');
const popSound = document.getElementById('pop-sound');

function init() {
    startGame();
    setupEventListeners();
}

function setupEventListeners() {
    stopButton.addEventListener('click', stopGame);
    
    gameContainer.addEventListener('touchstart', handleTouch, { passive: false });
}

function handleTouch(e) {
    if (e.target.classList.contains('heart') || 
        e.target.classList.contains('bomb') || 
        e.target.classList.contains('freeze')) {
        e.preventDefault();
        const touch = e.touches[0] || e.changedTouches[0];
        const fakeEvent = {
            clientX: touch.clientX,
            clientY: touch.clientY,
            target: e.target
        };
        e.target.onclick(fakeEvent);
    }
}


function startGame() {
    if (!isGameRunning) {
        heartInterval = setInterval(createHeart, 800);
        bombInterval = setInterval(createBomb, 3000);
        freezeInterval = setInterval(createFreeze, 10000);
        isGameRunning = true;
        stopButton.innerHTML = '⏸️';
    }
}

function stopGame() {
    if (isGameRunning) {
        clearInterval(heartInterval);
        clearInterval(bombInterval);
        clearInterval(freezeInterval);
        if (freezeTimer) clearTimeout(freezeTimer);
        isGameRunning = false;
        stopButton.innerHTML = '▶️';
    } else {
        startGame();
    }
}

// Element creation functions
function createHeart() {
    if (isFrozen) return;

    const heart = document.createElement('div');
    heart.className = 'heart';
    heart.innerHTML = '❤️';
    heart.style.left = `${Math.random() * 90}vw`;
    
    const duration = 4; 
    heart.style.animationDuration = `${duration}s`;
    heart.addEventListener('animationend', () => {
        heart.remove();
    });

    setTimeout(() => {
        heart.style.opacity = '1';
    }, 50);
    
    
    heart.onclick = (e) => {
        score++;
        scoreElement.textContent = `${score} ❤️`;
        createExplosion(e.clientX, e.clientY, 'heart');
        playSound();
        heart.remove();
    };
    
    gameContainer.appendChild(heart);
    setTimeout(() => heart.remove(), 5000);
}

function createBomb() {
    if (isFrozen) return;
    
    const bomb = document.createElement('div');
    bomb.className = 'bomb';
    bomb.innerHTML = '💣';
    bomb.style.left = `${Math.random() * 90}vw`;
    bomb.style.animationDuration = `${Math.random() * 2 + 3}s`;
    
    bomb.onclick = (e) => {
        score = Math.max(0, score - 10);
        scoreElement.textContent = `${score} ❤️`;
        createExplosion(e.clientX, e.clientY, 'bomb');
        playSound();
        bomb.remove();
    };
    
    gameContainer.appendChild(bomb);
    setTimeout(() => bomb.remove(), 5000);
}

function createFreeze() {
    if (isFrozen) return;
    
    const freeze = document.createElement('div');
    freeze.className = 'freeze';
    freeze.innerHTML = '❄️';
    freeze.style.left = `${Math.random() * 90}vw`;
    freeze.style.animationDuration = `${Math.random() * 2 + 3}s`;
    
    freeze.onclick = (e) => {
        if (isFrozen) return;
        freezeGame();
        createExplosion(e.clientX, e.clientY, 'freeze');
        playSound();
        freeze.remove();
    };
    
    gameContainer.appendChild(freeze);
    setTimeout(() => freeze.remove(), 5000);
}

//Game effects
function freezeGame() {
    if (isFrozen) return;
    
    isFrozen = true;
    
    document.querySelectorAll('.heart, .bomb, .freeze').forEach(el => {
        const computedStyle = getComputedStyle(el);
        const matrix = new DOMMatrix(computedStyle.transform);
        const currentY = matrix.m42;
        
        const originalDuration = parseFloat(el.dataset.originalDuration || el.style.animationDuration || '3s');
        el.dataset.originalDuration = originalDuration;
        
        el.style.animationPlayState = 'paused';
        const newDuration = originalDuration * 1.67;
        el.style.animation = `fall ${newDuration}s linear`;
        el.style.transform = `translateY(${currentY}px)`;
        el.style.animationPlayState = 'running';
        el.classList.add('frozen-element');
    });
    
    const overlay = document.createElement('div');
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100%';
    overlay.style.height = '100%';
    overlay.style.backgroundColor = 'rgba(173, 216, 230, 0.3)';
    overlay.style.zIndex = '5';
    overlay.style.pointerEvents = 'none';
    overlay.id = 'freeze-overlay';
    gameContainer.appendChild(overlay);
    
    clearInterval(heartInterval);
    clearInterval(bombInterval);
    clearInterval(freezeInterval);
    
    freezeTimer = setTimeout(unfreezeGame, 5000);
}

function unfreezeGame() {
    if (!isFrozen) return;
    
    isFrozen = false;
    
    document.querySelectorAll('.heart, .bomb, .freeze').forEach(el => {
        const computedStyle = getComputedStyle(el);
        const matrix = new DOMMatrix(computedStyle.transform);
        const currentY = matrix.m42;
        
        const originalDuration = parseFloat(el.dataset.originalDuration || '3s');
        el.style.animation = `fall ${originalDuration}s linear`;
        el.style.transform = `translateY(${currentY}px)`;
        el.style.animationPlayState = 'running';
        el.classList.remove('frozen-element');
    });
    
    const overlay = document.getElementById('freeze-overlay');
    if (overlay) overlay.remove();
    
    if (isGameRunning) {
        heartInterval = setInterval(createHeart, 800);
        bombInterval = setInterval(createBomb, 3000);
        freezeInterval = setInterval(createFreeze, 10000);
    }
    
    if (freezeTimer) {
        clearTimeout(freezeTimer);
        freezeTimer = null;
    }
}

function createExplosion(x, y, type) {
    const explosion = document.createElement('div');
    explosion.className = 'explosion';
    explosion.style.left = `${x - 20}px`;
    explosion.style.top = `${y - 20}px`;
    
    if (type === 'bomb') {
        explosion.innerHTML = '💥';
        explosion.style.color = '#000000';
    } else if (type === 'freeze') {
        explosion.innerHTML = '❄️';
        explosion.style.color = '#00a8ff';
    } else {
        explosion.innerHTML = '❤️';
        explosion.style.color = colors[Math.floor(Math.random() * colors.length)];
    }
    
    gameContainer.appendChild(explosion);

    for (let i = 0; i < 15; i++) {
        createParticle(x, y, type);
    }
    
    setTimeout(() => explosion.remove(), 500);
}

function createParticle(x, y, type) {
    const particle = document.createElement('div');
    particle.className = 'particle';
    particle.style.left = `${x}px`;
    particle.style.top = `${y}px`;
    
    if (type === 'bomb') {
        particle.style.backgroundColor = '#333333';
    } else if (type === 'freeze' || isFrozen) {
        particle.classList.add('frozen-particle');
        particle.style.backgroundColor = '#00a8ff';
    } else {
        particle.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
    }
    
    const angle = Math.random() * Math.PI * 2;
    const velocity = 2 + Math.random() * 3;
    const lifetime = 800 + Math.random() * 400;
    
    gameContainer.appendChild(particle);
    
    let startTime = Date.now();
    
    function updateParticle() {
        const elapsed = Date.now() - startTime;
        const progress = elapsed / lifetime;
        
        if (progress >= 1) {
            particle.remove();
            return;
        }
        
        const distance = velocity * elapsed / 20;
        particle.style.transform = `translate(
            ${Math.cos(angle) * distance}px, 
            ${Math.sin(angle) * distance}px
        )`;
        particle.style.opacity = 1 - progress;
        
        requestAnimationFrame(updateParticle);
    }
    
    requestAnimationFrame(updateParticle);
}

function playSound() {
    popSound.currentTime = 0;
    popSound.play();
}

init();

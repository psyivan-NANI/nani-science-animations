// --- 專業醫學動畫級：心臟循環流體控制引擎 ---
const canvas = document.getElementById('heartFlowCanvas');
const ctx = canvas.getContext('2d');

let state = {
    isPaused: false,
    mode: 'all',          // all | systemic | pulmonary
    speed: 1.1,           // 動態速率倍率 1.1x
    showArrows: true,
    showLabels: true,
    globalTime: 0
};

// 完美匹配 3D 底圖的立體高階路徑定義 (Bezier 連續流體曲線)
const bloodPaths = {
    // 體循環：左心室 -> 主動脈(跨越右側) -> 全身微血管 -> 回流右心房
    systemic: [
        { x: 310, y: 150, type: 'move' },
        { x: 370, y: 50, cx1: 320, cy1: 80, cx2: 340, cy2: 50, type: 'bezier' }, // 主動脈弓
        { x: 500, y: 140, cx1: 440, cy1: 50, cx2: 480, cy2: 90, type: 'bezier' }, // 往下流向人體組織
        { x: 500, y: 220, type: 'line' },                                        // 組織微血管物質交換
        { x: 270, y: 180, cx1: 480, cy1: 270, cx2: 320, cy2: 240, type: 'bezier' }  // 經大靜脈回右心房
    ],
    // 肺循環：右心室 -> 肺動脈(跨越左側) -> 肺部交換 -> 回流左心房
    pulmonary: [
        { x: 250, y: 190, type: 'move' },
        { x: 210, y: 100, cx1: 240, cy1: 150, cx2: 220, cy2: 120, type: 'bezier' }, // 進入左側肺部
        { x: 130, y: 150, cx1: 190, cy1: 80, cx2: 150, cy2: 110, type: 'bezier' },
        { x: 130, y: 210, type: 'line' },                                        // 肺泡交換 (藍轉紅)
        { x: 290, y: 130, cx1: 130, cy1: 260, cx2: 240, cy2: 200, type: 'bezier' }  // 回流左心房
    ]
};

function resize() {
    const box = canvas.parentElement.getBoundingClientRect();
    canvas.width = box.width * window.devicePixelRatio;
    canvas.height = box.height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
}
window.addEventListener('resize', resize);
resize();

// --- 監聽現代 UI 操縱面板 ---
document.getElementById('slider-speed').addEventListener('input', (e) => {
    state.speed = parseFloat(e.target.value);
    document.getElementById('lbl-speed').textContent = state.speed.toFixed(1) + 'x';
    document.getElementById('lbl-heartrate').textContent = Math.round(65 * state.speed);
});

document.querySelectorAll('input[name="mode"]').forEach(radio => {
    radio.addEventListener('change', (e) => { state.mode = e.target.value; });
});

document.getElementById('chk-pause').addEventListener('change', (e) => { state.isPaused = e.target.checked; });
document.getElementById('chk-arrows').addEventListener('change', (e) => { state.showArrows = e.target.checked; });
document.getElementById('chk-labels').addEventListener('change', (e) => {
    state.showLabels = e.target.checked;
    document.querySelectorAll('.floating-label').forEach(el => el.style.display = state.showLabels ? 'block' : 'none');
});

document.getElementById('btn-toggle-flow').addEventListener('click', () => {
    state.isPaused = !state.isPaused;
    document.getElementById('chk-pause').checked = state.isPaused;
    document.getElementById('btn-toggle-flow').textContent = state.isPaused ? "▶ 播放循環" : "⏸ 暫停循環";
});

// --- 精確路徑演算矩陣 ---
function getBezierPoint(path, t) {
    const segments = path.length - 1;
    let index = Math.floor(t * segments);
    if (index >= segments) index = segments - 1;

    let localT = (t * segments) - index;
    let p0 = path[index];
    let p1 = path[index + 1];

    if (p1.type === 'line' || !p1.type) {
        return { x: p0.x + (p1.x - p0.x) * localT, y: p0.y + (p1.y - p0.y) * localT };
    } else if (p1.type === 'bezier') {
        let mt = 1 - localT;
        return {
            x: mt * mt * mt * p0.x + 3 * mt * mt * localT * p1.cx1 + 3 * mt * localT * localT * p1.cx2 + localT * localT * localT * p1.x,
            y: mt * mt * mt * p0.y + 3 * mt * mt * localT * p1.cy1 + 3 * mt * localT * localT * p1.cy2 + localT * localT * localT * p1.y
        };
    }
    return { x: p0.x, y: p0.y };
}

// --- 渲染發光流線粒子 ---
function drawStream(path, color, count, offset) {
    for (let i = 0; i < count; i++) {
        let p = (state.globalTime + (i / count) + offset) % 1;
        let pos = getBezierPoint(path, p);

        ctx.save();
        ctx.fillStyle = color;
        ctx.shadowColor = color;
        ctx.shadowBlur = 8; // 發光霓虹質感

        ctx.beginPath();
        ctx.arc(pos.x, pos.y, 4, 0, Math.PI * 2);
        ctx.fill();

        // 繪製前導高亮箭頭微粒
        if (state.showArrows && i % 2 === 0) {
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(pos.x, pos.y, 1.5, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    }
}

// --- 主渲染循環 ---
function renderLoop() {
    const w = canvas.width / window.devicePixelRatio;
    const h = canvas.height / window.devicePixelRatio;
    ctx.clearRect(0, 0, w, h);

    if (!state.isPaused) {
        state.globalTime += 0.006 * state.speed;
    }

    // 根據控制面板切換渲染軌跡
    if (state.mode === 'all' || state.mode === 'systemic') {
        drawStream(bloodPaths.systemic, '#ef4444', 16, 0); // 體循環(紅)
    }
    if (state.mode === 'all' || state.mode === 'pulmonary') {
        drawStream(bloodPaths.pulmonary, '#3b82f6', 12, 0.5); // 肺循環(藍)
    }

    // 底部步驟時間軸聯動亮燈
    let currentStep = Math.floor((state.globalTime * 5) % 5) + 1;
    document.querySelectorAll('.step-node').forEach(node => {
        node.classList.toggle('active', parseInt(node.dataset.step) === currentStep);
    });

    requestAnimationFrame(renderLoop);
}
requestAnimationFrame(renderLoop);

// --- 隨堂測驗引擎系統 (完美整合至 UI 卡片) ---
const quizData = {
    q: "當血液由右心室出發，經過肺部微血管完成氣體交換後，會轉變成何種血液？並首先流回哪一個腔室？",
    opts: ["(A) 缺氧血，流回左心房", "(B) 含氧血，流回左心房", "(C) 減氧血，流回右心房", "(D) 充氧血，流回左心室"],
    a: "B",
    r: "答對了！在肺部微血管完成二氧化碳與氧氣的交換後，血液會轉變為富含氧氣的『含氧血』，並透過肺靜脈首先送回心臟的『左心房』。"
};

function initQuiz() {
    document.getElementById('quiz-question').textContent = quizData.q;
    const optBox = document.getElementById('quiz-options');
    optBox.innerHTML = '';

    quizData.opts.forEach((opt, idx) => {
        const btn = document.createElement('button');
        btn.className = 'quiz-opt';
        btn.textContent = opt;
        btn.onclick = () => {
            const feedback = document.getElementById('quiz-feedback');
            feedback.classList.remove('hidden');
            if (idx === 1) { // (B) 是正確答案
                feedback.className = "quiz-feedback correct";
                feedback.innerHTML = `<strong>🟢 回答正確！</strong><br>${quizData.r}`;
            } else {
                feedback.className = "quiz-feedback wrong";
                feedback.innerHTML = `<strong>🔴 回答錯誤，再試一次！</strong><br>提示：肺部交換完會變紅，先回心房。`;
            }
        };
        optBox.appendChild(btn);
    });
}
initQuiz();
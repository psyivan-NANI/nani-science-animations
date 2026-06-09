const canvas = document.getElementById('heartCanvas');
const ctx = canvas.getContext('2d');

let isPlaying = true;
let heartRateBpm = 70; // 預設心跳 70 bpm
let pulsePhase = 0;    // 心臟搏動的週期相位
let particles = [];    // 血液粒子陣列

function resizeCanvas() {
    const rect = canvas.parentElement.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
}

// 建立血液循環路徑粒子指南群
function createParticle(type, pathType) {
    // pathType: 'body' (體循環) 或 'lung' (肺循環)
    return {
        type: type, // 'oxy' (紅) 或 'deoxy' (藍)
        pathType: pathType,
        progress: Math.random(), // 0 ~ 1 軌道進度
        speed: 0.003 + Math.random() * 0.002,
        size: 2.5 + Math.random() * 2,
        seedY: Math.random() * 15 - 7
    };
}

// 初始化粒子群
function initParticles() {
    particles = [];
    for (let i = 0; i < 45; i++) particles.push(createParticle('deoxy', 'lung')); // 肺循環粒子
    for (let i = 0; i < 55; i++) particles.push(createParticle('oxy', 'body'));   // 體循環粒子
}

// 計算心臟幾何結構與粒子軌道位置
function drawScene() {
    const w = canvas.width / window.devicePixelRatio;
    const h = canvas.height / window.devicePixelRatio;
    const cx = w / 2;
    const cy = h / 2 + 20;

    ctx.clearRect(0, 0, w, h);

    // 根據心跳速率計算搏動幅度和週期速率速度
    if (isPlaying) {
        let speedFactor = heartRateBpm / 60;
        pulsePhase += 0.05 * speedFactor;
        if (pulsePhase > Math.PI * 2) pulsePhase -= Math.PI * 2;
    }

    // 模擬心房心室交替收縮（心室大收縮時心房略微舒張）
    const ventricularContraction = Math.max(0, Math.sin(pulsePhase)); // 心室收縮期
    const atrialContraction = Math.max(0, Math.sin(pulsePhase + Math.PI)); // 心房收縮期

    const scaleRV = 1 - ventricularContraction * 0.08;
    const scaleLV = 1 - ventricularContraction * 0.09;
    const scaleRA = 1 - atrialContraction * 0.06;
    const scaleLA = 1 - atrialContraction * 0.06;

    // --- 1. 繪製幾何血管管線路徑 ---
    ctx.lineWidth = 14;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // [大靜脈路徑] 藍色
    ctx.strokeStyle = 'rgba(51, 136, 255, 0.25)';
    ctx.beginPath();
    ctx.moveTo(cx - 160, cy + 120);
    ctx.bezierCurveTo(cx - 140, cy + 120, cx - 110, cy, cx - 60, cy - 10);
    ctx.stroke();

    // [主動脈路徑] 紅色弓形
    ctx.strokeStyle = 'rgba(255, 51, 68, 0.25)';
    ctx.beginPath();
    ctx.moveTo(cx + 40, cy + 30);
    ctx.bezierCurveTo(cx + 40, cy - 110, cx - 40, cy - 120, cx - 80, cy - 90);
    ctx.stroke();

    // [肺動脈路徑] 藍色出右心室
    ctx.strokeStyle = 'rgba(51, 136, 255, 0.25)';
    ctx.beginPath();
    ctx.moveTo(cx - 30, cy + 20);
    ctx.quadraticCurveTo(cx - 40, cy - 80, cx - 100, cy - 70);
    ctx.stroke();

    // [肺靜脈路徑] 紅色入左心房
    ctx.strokeStyle = 'rgba(255, 51, 68, 0.25)';
    ctx.beginPath();
    ctx.moveTo(cx + 160, cy - 20);
    ctx.quadraticCurveTo(cx + 90, cy - 20, cx + 50, cy);
    ctx.stroke();


    // --- 2. 繪製四個心臟幾何主構造腔室 ---
    ctx.shadowBlur = 15;

    // 右心房 (RA)
    ctx.fillStyle = 'rgba(30, 70, 130, 0.85)';
    ctx.strokeStyle = '#3388ff';
    ctx.shadowColor = '#3388ff';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(cx - 60, cy - 10, 32 * scaleRA, 0, Math.PI * 2);
    ctx.fill(); ctx.stroke();

    // 左心房 (LA)
    ctx.fillStyle = 'rgba(140, 30, 45, 0.85)';
    ctx.strokeStyle = '#ff3344';
    ctx.shadowColor = '#ff3344';
    ctx.beginPath();
    ctx.arc(cx + 50, cy, 30 * scaleLA, 0, Math.PI * 2);
    ctx.fill(); ctx.stroke();

    // 右心室 (RV)
    ctx.fillStyle = 'rgba(25, 60, 110, 0.9)';
    ctx.strokeStyle = '#3388ff';
    ctx.shadowColor = '#3388ff';
    ctx.beginPath();
    ctx.ellipse(cx - 40, cy + 55, 42 * scaleRV, 52 * scaleRV, 0, 0, Math.PI * 2);
    ctx.fill(); ctx.stroke();

    // 左心室 (LV) - 心肌厚度較厚
    ctx.fillStyle = 'rgba(120, 20, 35, 0.9)';
    ctx.strokeStyle = '#ff3344';
    ctx.shadowColor = '#ff3344';
    ctx.lineWidth = 5; // 凸顯左心室壁厚考點
    ctx.beginPath();
    ctx.ellipse(cx + 35, cy + 60, 45 * scaleLV, 60 * scaleLV, 0, 0, Math.PI * 2);
    ctx.fill(); ctx.stroke();

    ctx.shadowBlur = 0; // 重置發光

    // --- 3. 繪製動態瓣膜運作 (房室瓣開閉) ---
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 4;
    // 當心室收縮(ventricularContraction > 0.3)時，瓣膜關閉避免倒流
    let isOpen = ventricularContraction < 0.4;

    // 右房室瓣 (三尖瓣模擬)
    ctx.beginPath();
    if (isOpen) {
        ctx.moveTo(cx - 65, cy + 15); ctx.lineTo(cx - 55, cy + 30);
        ctx.moveTo(cx - 35, cy + 15); ctx.lineTo(cx - 42, cy + 30);
    } else { // 緊閉狀態
        ctx.moveTo(cx - 65, cy + 22); ctx.lineTo(cx - 35, cy + 22);
    }
    ctx.stroke();

    // 左房室瓣 (二尖瓣模擬)
    ctx.beginPath();
    if (isOpen) {
        ctx.moveTo(cx + 30, cy + 15); ctx.lineTo(cx + 25, cy + 30);
        ctx.moveTo(cx + 55, cy + 15); ctx.lineTo(cx + 48, cy + 30);
    } else { // 緊閉狀態
        ctx.moveTo(cx + 30, cy + 20); ctx.lineTo(cx + 55, cy + 20);
    }
    ctx.stroke();


    // --- 4. 血液粒子核心軌道物理渲染 ---
    particles.forEach(p => {
        if (isPlaying) {
            let rateSpeedFactor = heartRateBpm / 70;
            p.progress += p.speed * rateSpeedFactor;
            if (p.progress > 1) p.progress = 0;
        }

        let px, py;
        let t = p.progress;

        if (p.pathType === 'lung') {
            // 肺循環幾何軌道：右心室 -> 肺動脈 -> 左心房
            if (t < 0.4) { // 在右心室向肺動脈擠壓
                let scaleT = t / 0.4;
                px = (cx - 40) + scaleT * (-60);
                py = (cy + 55) + scaleT * (-125) + p.seedY;
            } else { // 經肺部氣體交換(模擬為大圓弧繞回)進入左心房
                let scaleT = (t - 0.4) / 0.6;
                let angle = Math.PI + scaleT * Math.PI;
                px = (cx - 25) + 75 * Math.cos(angle);
                py = (cy - 10) + 40 * Math.sin(angle) + p.seedY;
            }
        } else {
            // 體循環幾何軌道：左心室 -> 主動脈弓 -> 繞向全身微血管 -> 大靜脈 -> 右心房
            if (t < 0.3) { // 左心室射向主動脈
                let scaleT = t / 0.3;
                px = (cx + 35) - scaleT * 75;
                py = (cy + 40) - scaleT * 120;
            } else if (t >= 0.3 && t < 0.7) { // 經全身微血管網群(大外環繞路徑)
                let scaleT = (t - 0.3) / 0.4;
                px = (cx - 40) - 100 * Math.sin(scaleT * Math.PI);
                py = (cy - 40) + scaleT * 150;
            } else { // 匯入大靜脈回流右心房
                let scaleT = (t - 0.7) / 0.3;
                px = (cx - 140) + scaleT * 80;
                py = (cy + 110) - scaleT * 120;
            }
        }

        // 繪製微光血流流動粒子
        ctx.fillStyle = p.type === 'oxy' ? 'rgba(255, 51, 68, 0.85)' : 'rgba(51, 136, 255, 0.85)';
        ctx.shadowBlur = 4;
        ctx.shadowColor = ctx.fillStyle;
        ctx.beginPath();
        ctx.arc(px, py, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
    });
}

function loop() {
    drawScene();
    requestAnimationFrame(loop);
}

// --- 控制面板事件監聽 ---
document.getElementById('slider-rate').addEventListener('input', (e) => {
    heartRateBpm = parseInt(e.target.value);
    let desc = "安靜狀態 (70 bpm)";
    let statusDescText = "光速在空氣中較快... 咳，心臟由堅韌的心肌構成。當心室收縮時，血液被壓入動脈；此時房室瓣會關閉以防止血液倒流回心房。";

    if (heartRateBpm < 60) {
        desc = `熟睡/冥想狀態 (${heartRateBpm} bpm)`;
        statusDescText = "此時副交感神經優勢，心跳趨緩，粒子流速下降，身體細胞新陳代謝需求處於最低基準。";
    } else if (heartRateBpm > 100) {
        desc = `劇烈運動/亢奮狀態 (${heartRateBpm} bpm)`;
        statusDescText = "此時交感神經亢奮！心肌大幅度且高頻率收縮。為了運送充足的氧氣給運動中的肌肉，血流粒子速度顯著加載暴增！";
    }

    document.getElementById('rate-text').textContent = desc;
    document.getElementById('status-title').textContent = desc;
    document.getElementById('status-desc').textContent = statusDescText;
});

document.getElementById('btn-play-pause').addEventListener('click', (e) => {
    isPlaying = !isPlaying;
    e.target.textContent = isPlaying ? '暫停跳動' : '恢復跳動';
    e.target.classList.toggle('active', !isPlaying);
});

window.addEventListener('resize', resizeCanvas);


// --- 核心 4: 結構化 10 題互動隨堂題庫大數據字典 ---
const quizData = [
    {
        q: "1. 關於人體心臟腔室壁的厚薄度比較，下列敘述何者正確？",
        opts: ["(A) 左心室壁最厚，因為需要將血液加壓輸送至全身", "(B) 右心室壁最厚，因為需要將血液送往肺部", "(C) 左心房壁最厚，因為要接收從肺部流回的充氧血", "(D) 四個腔室的心肌壁厚度完全相同"],
        a: "A",
        r: "正確！左心室負責「體循環」的發射起點，必須產生足夠壓力將血液推向全身微血管，因此心肌最為發達粗壯。"
    },
    {
        q: "2. 當我們在使用滑桿將心跳速率調到「運動亢奮狀態」時，心臟收縮引發的瓣膜開閉主要功能為何？",
        opts: ["(A) 促進血液在心房與心室間自由迴流", "(B) 防止血液倒流，確保血液能以單向向前流動", "(C) 加快二氧化碳進入左心室的速率", "(D) 降低血管內壁所承受的動脈血壓"],
        a: "B",
        r: "正確！瓣膜（如房室瓣、半月瓣）的唯一天職就是「防止血液倒流」，確保血流永遠是 房→室→動脈 的單向黃金路線。"
    },
    {
        q: "3. 國中生物考點口訣「房接靜脈，室接動脈」，請問下列哪一條大血管與「左心室」相連？",
        opts: ["(A) 大靜脈", "(B) 肺動脈", "(C) 主動脈（大動脈）", "(D) 肺靜脈"],
        a: "C",
        r: "正確！左心室收縮時，富含氧氣的充氧血會立刻被泵入「主動脈」，由此展開全身體循環。"
    },
    {
        q: "4. 小明在畫面上觀察紅色粒子（充氧血）與藍色粒子（缺氧血），請問下列哪一組血管中流動的是「缺氧血」？",
        opts: ["(A) 主動脈與肺靜脈", "(B) 肺動脈與大靜脈", "(C) 主動脈與大靜脈", "(D) 肺動脈與肺靜脈"],
        a: "B",
        r: "正確！大靜脈收集全身缺氧血回右心房，右心室再將其壓入「肺動脈」送往肺部進行氣體交換。這兩者裝的都是缺氧血。"
    },
    {
        q: "5. 醫生聽診時所聽到的「心音」，主要是由下列何種現象產生的撞擊聲？",
        opts: ["(A) 血液磨擦血管壁的聲音", "(B) 心肌收縮與舒張時瓣膜緊閉產生的震動", "(C) 肺部進行氣體交換的呼吸氣流聲", "(D) 紅血球與白血球互相碰撞的聲音"],
        a: "B",
        r: "正確！心音是心臟收縮與舒張時，「瓣膜迅速關閉」阻斷血液倒流、引起心室壁與血流震動而產生的交替聲音。"
    },
    {
        q: "6. 請選出人體「肺循環」的正確起點與微血管交換場所順序：",
        opts: ["(A) 左心室 → 全身組織微血管", "(B) 右心室 → 肺部微血管", "(C) 右心房 → 肺動脈微血管", "(D) 左心房 → 組織微血管"],
        a: "B",
        r: "正確！肺循環起點為「右心室」，收縮後經肺動脈進入「肺部微血管」排出二氧化碳、吸收新鮮氧氣。"
    },
    {
        q: "7. 血液流經下列哪一個器官或構造的微血管網後，缺氧血會轉化變成「充氧血」？",
        opts: ["(A) 腦部組織", "(B) 腎臟過濾網", "(C) 肺臟（肺泡周圍）", "(D) 小腸絨毛壁"],
        a: "C",
        r: "正確！只有流經「肺臟」微血管時，血液才能獲得剛吸入的氧氣，讓缺氧血（藍）重新變成鮮紅的充氧血（紅）。"
    },
    {
        q: "8. 若小明大腿受傷發炎，醫生在小明的「手臂靜脈」注射消炎藥劑，請問藥劑最先到達心臟的哪一個腔室？",
        opts: ["(A) 左心房", "(B) 左心室", "(C) 右心房", "(D) 右心室"],
        a: "C",
        r: "正確！全身靜脈回流最終都藉由上、下大靜脈匯入心臟的「右心房」，因此藥劑必先抵達右心房。"
    },
    {
        q: "9. 關於血液循環系統的流動動力源，下列敘述何者在生物學上完全正確？",
        opts: ["(A) 主要靠骨骼肌膨脹把血液抽回左心房", "(B) 靠肺部呼吸時產生的真空胸壓差抽動", "(C) 心肌有規律地收縮與舒張，扮演推動血流的幫浦（PUMP）", "(D) 血液是液體，全靠地心引力自然向下循環"],
        a: "C",
        r: "正確！心臟就像一台永不停歇的微型「生物幫浦」，透過心肌的交替收縮提供源源不絕的壓力，推動全身血流。"
    },
    {
        q: "10. 當心臟的「右心室」收縮時，房室瓣會關閉，此時血液會被推進哪一條血管？",
        opts: ["(A) 主動脈", "(B) 肺動脈", "(C) 大靜脈", "(D) 肺靜脈"],
        a: "B",
        r: "正確！右心室的出口接著「肺動脈」。右心室收縮時，血液就必須跨越半月瓣直衝肺動脈，向肺臟進發！"
    }
];

let currentQuizIndex = 0;

function initQuiz() {
    const container = document.getElementById('quiz-container');
    if (currentQuizIndex >= quizData.length) {
        container.innerHTML = "<div class='quiz-question' style='color:#00ffcc; text-align:center;'>🎉 恭喜完成本章節心臟循環所有檢測題！</div>";
        return;
    }

    const qItem = quizData[currentQuizIndex];
    document.getElementById('quiz-q').innerText = qItem.q;

    // 動態渲染包含完整描述內容的按鈕
    const optsWrapper = document.getElementById('quiz-opts');
    optsWrapper.innerHTML = "";

    const optKeys = ["A", "B", "C", "D"];
    qItem.opts.forEach((optText, idx) => {
        const btn = document.createElement('button');
        btn.className = "opt-btn";
        btn.innerText = optText;
        btn.onclick = () => checkAnswer(optKeys[idx]);
        optsWrapper.appendChild(btn);
    });

    document.getElementById('quiz-feedback').classList.add('hidden');
    document.getElementById('btn-next-quiz').classList.add('hidden');
}

function checkAnswer(userOpt) {
    const qItem = quizData[currentQuizIndex];
    const feedbackEl = document.getElementById('quiz-feedback');
    feedbackEl.classList.remove('hidden');

    const btns = document.querySelectorAll('.opt-btn');
    btns.forEach(b => b.disabled = true);

    if (userOpt === qItem.a) {
        feedbackEl.className = "quiz-feedback correct";
        feedbackEl.innerHTML = `<strong>🟢 回答正確！</strong><br>${qItem.r}`;
    } else {
        feedbackEl.className = "quiz-feedback wrong";
        feedbackEl.innerHTML = `<strong>🔴 回答錯誤（正確答案是 ${qItem.a}）</strong><br>${qItem.r}`;
    }
    document.getElementById('btn-next-quiz').classList.remove('hidden');
}

function nextQuestion() {
    currentQuizIndex++;
    initQuiz();
}

// 啟動系統
resizeCanvas();
initParticles();
loop();
window.addEventListener('DOMContentLoaded', initQuiz);
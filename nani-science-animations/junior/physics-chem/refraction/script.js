const canvas = document.getElementById('refractionCanvas');
const ctx = canvas.getContext('2d');

let isPlaying = true;
let incidentAngleDeg = 45; // 預設入射角 45 度
let currentMode = 'air-water'; // 'air-water' 或 'water-air'
let pOffset = 0; // 用於光束粒子流動效果的偏移量

function resizeCanvas() {
    const rect = canvas.parentElement.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
}

// 根據折射率計算折射角 (空氣 n1≒1.0, 水 n2≒1.33)
function calculateRefraction(angleDeg, mode) {
    const nAir = 1.0;
    const nWater = 1.33;
    const angleRad = (angleDeg * Math.PI) / 180;

    let sinR;
    if (mode === 'air-water') {
        // 空氣到水：sin(r) = sin(i) * nAir / nWater
        sinR = Math.sin(angleRad) * nAir / nWater;
        return Math.asin(sinR) * 180 / Math.PI;
    } else {
        // 水到空氣：sin(r) = sin(i) * nWater / nAir
        sinR = Math.sin(angleRad) * nWater / nAir;
        if (sinR > 1) return -1; // 產生全反射
        return Math.asin(sinR) * 180 / Math.PI;
    }
}

function drawScene() {
    const w = canvas.width / window.devicePixelRatio;
    const h = canvas.height / window.devicePixelRatio;
    const cx = w / 2;
    const cy = h / 2;
    const rOuter = w * 0.45; // 光束半徑长度

    ctx.clearRect(0, 0, w, h);

    // 1. 繪製半透明藍色「水介質」區域
    ctx.fillStyle = 'rgba(0, 168, 204, 0.15)';
    if (currentMode === 'air-water') {
        ctx.fillRect(0, cy, w, h - cy); // 下半部是水
    } else {
        ctx.fillRect(0, 0, w, cy); // 上半部是水
    }

    // 2. 繪製介面與法線
    // 水平交界面
    ctx.strokeStyle = '#00a8cc';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(0, cy); ctx.lineTo(w, cy); ctx.stroke();

    // 垂直法線
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([6, 4]);
    ctx.beginPath(); ctx.moveTo(cx, 10); ctx.lineTo(cx, h - 10); ctx.stroke();
    ctx.setLineDash([]);

    // 3. 計算並繪製光線幾何線條
    const iRad = (incidentAngleDeg * Math.PI) / 180;
    const rDeg = calculateRefraction(incidentAngleDeg, currentMode);

    // 入射光起點座標 (永遠自左方斜射入中心)
    let inX, inY;
    if (currentMode === 'air-water') {
        inX = cx - rOuter * Math.sin(iRad);
        inY = cy - rOuter * Math.cos(iRad);
    } else {
        inX = cx - rOuter * Math.sin(iRad);
        inY = cy + rOuter * Math.cos(iRad);
    }

    // 繪製入射光線
    ctx.strokeStyle = '#ff3333';
    ctx.lineWidth = 4;
    ctx.shadowColor = 'rgba(255, 51, 51, 0.5)';
    ctx.shadowBlur = 10;
    ctx.beginPath(); ctx.moveTo(inX, inY); ctx.lineTo(cx, cy); ctx.stroke();

    // 繪製折射或全反射光線
    let refX, refY;
    let isTotalReflection = (rDeg === -1);

    if (!isTotalReflection) {
        const rRad = (rDeg * Math.PI) / 180;
        if (currentMode === 'air-water') {
            refX = cx + rOuter * Math.sin(rRad);
            refY = cy + rOuter * Math.cos(rRad);
        } else {
            refX = cx + rOuter * Math.sin(rRad);
            refY = cy - rOuter * Math.cos(rRad);
        }
        // 繪製正常折射光
        ctx.strokeStyle = '#ff3333';
        ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(refX, refY); ctx.stroke();
    } else {
        // 全反射：反射角 = 入射角
        refX = cx + rOuter * Math.sin(iRad);
        refY = cy + rOuter * Math.cos(iRad);
        ctx.strokeStyle = '#ff9900'; // 全反射改用橘光警示
        ctx.shadowColor = 'rgba(255, 153, 0, 0.5)';
        ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(refX, refY); ctx.stroke();
    }
    ctx.shadowBlur = 0; // 重設發光

    // 4. 光束粒子動態流動視覺效果
    if (isPlaying) {
        pOffset += 1.5;
        if (pOffset > 30) pOffset = 0;
    }

    ctx.fillStyle = '#ffffff';
    // 入射光粒子
    for (let d = pOffset; d < rOuter; d += 30) {
        let t = d / rOuter;
        let px = inX + (cx - inX) * t;
        let py = inY + (cy - inY) * t;
        ctx.beginPath(); ctx.arc(px, py, 2.5, 0, Math.PI * 2); ctx.fill();
    }
    // 折射/全反射光粒子
    if (!isTotalReflection) {
        for (let d = pOffset; d < rOuter; d += 30) {
            let t = d / rOuter;
            let px = cx + (refX - cx) * t;
            let py = cy + (refY - cy) * t;
            ctx.beginPath(); ctx.arc(px, py, 2.5, 0, Math.PI * 2); ctx.fill();
        }
    } else {
        for (let d = pOffset; d < rOuter; d += 30) {
            let t = d / rOuter;
            let px = cx + (refX - cx) * t;
            let py = cy + (refY - cy) * t;
            ctx.beginPath(); ctx.arc(px, py, 2.5, 0, Math.PI * 2); ctx.fill();
        }
    }

    // 5. 動態校正標籤在畫面中的百分比相對座標與文字更新
    updateDynamicLabels(cx, cy, inX, inY, refX, refY, rDeg, isTotalReflection);
}

function updateDynamicLabels(cx, cy, inX, inY, refX, refY, rDeg, isTR) {
    const wrapper = document.getElementById('refraction-wrapper');
    const rect = wrapper.getBoundingClientRect();

    // 將 Canvas 座標轉換成 CSS 百分比
    const toPercentX = (canvasX) => (canvasX / (canvas.width / window.devicePixelRatio)) * 100;
    const toPercentY = (canvasY) => (canvasY / (canvas.height / window.devicePixelRatio)) * 100;

    // 更新入射光與折射光線文字標籤的中心點位置
    const lblIncident = document.getElementById('lbl-incident');
    lblIncident.style.left = `${toPercentX((inX + cx) / 2) - 10}%`;
    lblIncident.style.top = `${toPercentY((inY + cy) / 2) - 5}%`;

    const lblRefracted = document.getElementById('lbl-refracted');
    lblRefracted.style.left = `${toPercentX((cx + refX) / 2) - 10}%`;
    lblRefracted.style.top = `${toPercentY((cy + refY) / 2) - 5}%`;
    lblRefracted.textContent = isTR ? '全反射光線' : '折射光線';

    // 更新角度數值
    const lblI = document.getElementById('lbl-i-angle');
    lblI.textContent = `入射角: ${incidentAngleDeg}°`;

    const lblR = document.getElementById('lbl-r-angle');
    if (isTR) {
        lblR.textContent = `反射角: ${incidentAngleDeg}° (全反射)`;
        lblR.style.color = '#ff9900';
    } else {
        lblR.textContent = `折射角: ${Math.round(rDeg)}°`;
        lblR.style.color = '#fff';
    }
}

function loop() {
    drawScene();
    requestAnimationFrame(loop);
}

// --- 事件監聽器 ---
document.getElementById('slider-angle').addEventListener('input', (e) => {
    incidentAngleDeg = parseInt(e.target.value);
    document.getElementById('angle-text').textContent = `${incidentAngleDeg}°`;
});

document.getElementById('btn-play-pause').addEventListener('click', (e) => {
    isPlaying = !isPlaying;
    e.target.textContent = isPlaying ? '暫停光束' : '播放光束';
    e.target.classList.toggle('active', isPlaying);
});

document.getElementById('mode-air-water').addEventListener('click', (e) => {
    currentMode = 'air-water';
    document.getElementById('mode-water-air').classList.remove('active');
    e.target.classList.add('active');
    document.getElementById('status-title').textContent = '光從 空氣 進入 水 中';
    document.getElementById('status-desc').innerHTML = '光速在空氣中較快，在水中較慢。當光由「快介質」進入「慢介質」時，光線會<strong>偏向法線</strong>，此時折射角將小於入射角（∠r < ∠i）。';
});

document.getElementById('mode-water-air').addEventListener('click', (e) => {
    currentMode = 'water-air';
    document.getElementById('mode-air-water').classList.remove('active');
    e.target.classList.add('active');
    document.getElementById('status-title').textContent = '光從 水 進入 空氣 中';
    document.getElementById('status-desc').innerHTML = '光速在水中較慢，空氣中較快。當光由「慢介質」進入「快介質」時，光線會<strong>偏離法線</strong>，此時折射角將大於入射角（∠r > ∠i）。<br><br><span style="color:#ff9900;">💡 <strong>當入射角過大時，折射角會超過 90°，導致光線無法折射出去，全部反射回水中，這就是「全反射」現象！</strong></span>';
});

window.addEventListener('resize', resizeCanvas);

// 啟動
resizeCanvas();
loop();
// --- 10道自然科互動題庫大數據字典 ---
// --- 10道自然科互動題庫大數據字典（結構化拆分題目與選項） ---
const quizData = [
    {
        q: "1. 光從空氣斜射入水中，下列何種物理量「不會」改變？",
        opts: ["(A) 光速", "(B) 傳播方向", "(C) 折射角", "(D) 光的顏色（頻率）"],
        a: "D",
        r: "正確！光的顏色由頻率決定，頻率由光源決定，在不同介質中傳播時頻率絕對不會改變。"
    },
    {
        q: "2. 當光由空氣垂直（入射角 0°）射入玻璃中，其傳播路徑為何？",
        opts: ["(A) 偏向法線", "(B) 偏離法線", "(C) 沿直線前進而不偏折", "(D) 發生全反射"],
        a: "C",
        r: "正確！入射角為 0° 時折射角也為 0°，光線沿直線穿過不偏折，但傳播速度依然會變慢。"
    },
    {
        q: "3. 理化課口訣「快大、慢小」，請問這裡的「大」和「小」指的是什麼？",
        opts: ["(A) 光速的大與小", "(B) 角度與法線夾角的大與小", "(C) 鏡片厚度", "(D) 波動振幅"],
        a: "B",
        r: "正確！是指光線與法線產生的夾角。光速快的介質角度大，光速慢的介質角度小。"
    },
    {
        q: "4. 小明看見水中的錦鯉。請問他看到的錦鯉虛像位置，比實際錦鯉的位置如何？",
        opts: ["(A) 較深", "(B) 較淺", "(C) 位置完全相同", "(D) 忽深忽淺無法確定"],
        a: "B",
        r: "正確！光從水（慢）射入空氣（快）時偏離法線，折射光進入眼睛，大腦會誤以為物體在更靠近水面的虛像位置（看起來變淺）。"
    },
    {
        q: "5. 雷射光由水斜射入空氣中，隨著入射角逐漸「加大」，折射光線會有什麼變化？",
        opts: ["(A) 折射角越來越小", "(B) 越來越靠近法線", "(C) 越來越靠近兩介質的交界面", "(D) 完全沒有規則可循"],
        a: "C",
        r: "正確！折射角大於入射角，當入射角加大，折射角會更快接近 90°，導致光線越來越貼近水平交界面。"
    },
    {
        q: "6. 下列哪一項是發生「全反射」現象的「絕對必要條件」？",
        opts: ["(A) 光必須從空氣射入水中", "(B) 入射角必須小於臨界角", "(C) 光必須從光速慢的介質射向光速快的介質", "(D) 入射角必須剛好等於 0°"],
        a: "C",
        r: "正確！全反射必須在光從慢介質射向快介質（例如水到空氣），且入射角大於臨界角時才會發生。"
    },
    {
        q: "7. 水射入空氣的臨界角約是 48.8°。若將入射角調至 60°，畫面上會出現什麼現象？",
        opts: ["(A) 同時出現折射與反射", "(B) 折射角剛好等於 90°", "(C) 折射光完全消失，光線百分之百反射回水中", "(D) 光線完全穿透不發生任何反射"],
        a: "C",
        r: "正確！入射角（60°）大於臨界角，產生全反射，折射光完全消失，這就是你剛剛在畫面上拉到80°看到的現象！"
    },
    {
        q: "8. 「海市蜃樓」和沙漠綠洲的幻景，是空氣層導致光線不斷偏折所致。這屬於何種現象？",
        opts: ["(A) 光的直線傳播", "(B) 光的反射", "(C) 光的折射與全反射", "(D) 光的光電效應"],
        a: "C",
        r: "正確！這是光線穿過地面不均勻受熱的空氣層時，發生連續折射與全反射產生的自然奇景。"
    },
    {
        q: "9. 現代通訊使用的「光纖（Optical Fiber）」，能讓雷射訊號在玻璃導管中低損耗前進，是利用什麼原理？",
        opts: ["(A) 漫反射", "(B) 連續全反射", "(C) 透鏡會聚", "(D) 光的穿透"],
        a: "B",
        r: "正確！光纖內部利用核心與外殼的折射率差異，讓光在導管壁不斷發生全反射，鎖住光訊號高效前進。"
    },
    {
        q: "10. 光由空氣(n=1.0)射入某寶石(n=2.0)，入射角 30°（sin 30°=0.5），求折射角的 sin r 值？",
        opts: ["(A) 0.25", "(B) 0.5", "(C) 0.75", "(D) 1.0"],
        a: "A",
        r: "正確！依斯乃爾定律：sin 30° * 1.0 = sin r * 2.0 -> 0.5 = sin r * 2.0 -> sin r = 0.25。符合快大慢小！"
    }
];

let currentQuizIndex = 0;

function initQuiz() {
    const container = document.getElementById('quiz-container');
    if (currentQuizIndex >= quizData.length) {
        container.innerHTML = "<div class='quiz-question' style='color:#00ffcc; text-align:center;'>🎉 恭喜完成本章節所有理化檢測題！</div>";
        return;
    }

    const qItem = quizData[currentQuizIndex];

    // 渲染題目文字
    document.getElementById('quiz-q').innerText = qItem.q;

    // 動態清空並建立帶有完整內容的選項按鈕
    const optsWrapper = document.getElementById('quiz-opts');
    optsWrapper.innerHTML = "";

    const optKeys = ["A", "B", "C", "D"];
    qItem.opts.forEach((optText, idx) => {
        const btn = document.createElement('button');
        btn.className = "opt-btn";
        btn.innerText = optText;
        // 點擊選項內容按鈕，直接帶入 "A"、"B"、"C" 或 "D" 進行核對
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

    // 鎖定所有動態產生的選項按鈕
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

// 確保網頁載入時初始化第一題
window.addEventListener('DOMContentLoaded', initQuiz);
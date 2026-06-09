const canvas = document.getElementById('windsCanvas');
const ctx = canvas.getContext('2d');

let isRotating = true; // 預設為地球自轉模式(三圈環流)
let particles = []; // 流體粒子軌跡陣列

function resizeCanvas() {
    const rect = canvas.parentElement.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
}

// 核心重置機制：讓微粒生命週期無限循環
function resetParticle(p) {
    if (!isRotating) {
        // 單圈模式：隨機在赤道(起點)或高空重置
        p.lat = (Math.random() - 0.5) * 0.1;
        p.alt = Math.random() * 0.1;
    } else {
        // 三圈模式：隨機分配到三個環流圈的起點區域
        const rand = Math.random();
        if (rand < 0.4) {
            // 哈德里圈起點：赤道附近上升區
            p.lat = (Math.random() - 0.5) * 0.05;
            p.alt = Math.random() * 0.1;
        } else if (rand < 0.7) {
            // 費雷爾圈起點：緯度60度上升區或30度下沉區
            p.lat = (Math.random() > 0.5 ? 1 : -1) * (30 + Math.random() * 5) * Math.PI / 180;
            p.alt = Math.random();
        } else {
            // 極地圈起點：緯度60度上升區
            p.lat = (Math.random() > 0.5 ? 1 : -1) * (60 + Math.random() * 5) * Math.PI / 180;
            p.alt = Math.random() * 0.2;
        }
    }
    p.speed = 0.003 + Math.random() * 0.004;
    p.life = 200 + Math.random() * 300; // 賦予隨機壽命，防止粒子集體集散
}

// 初始化流體流線粒子
function initParticles() {
    particles = [];
    // 生成150個高質感大氣流體微粒，維持教學畫面的飽滿度
    for (let i = 0; i < 150; i++) {
        const p = {
            lat: (Math.random() - 0.5) * Math.PI,
            alt: Math.random(),
            speed: 0.003 + Math.random() * 0.004,
            color: Math.random() > 0.5 ? '#38bdf8' : '#f97316',
            life: Math.random() * 400
        };
        particles.push(p);
    }
}

// 核心大氣環流幾何渲染繪圖引擎
function drawScene() {
    const w = canvas.width / window.devicePixelRatio;
    const h = canvas.height / window.devicePixelRatio;

    const cx = w * 0.45;
    const cy = h * 0.5;
    const earthRadius = 130;
    const atmosphereHeight = 45;

    // 建立半透明覆蓋層，讓粒子流動產生優雅的動態尾跡（動態殘影效果）
    ctx.fillStyle = 'rgba(7, 12, 20, 0.25)';
    ctx.fillRect(0, 0, w, h);

    // --- 1. 繪製地球半圓球體與緯度底線 ---
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(cx, cy, earthRadius, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.lineWidth = 1;
    [0, 30, 60, -30, -60].forEach(lat => {
        const rad = (lat * Math.PI) / 180;
        const y = cy - earthRadius * Math.sin(rad);
        const r = earthRadius * Math.cos(rad);
        ctx.beginPath();
        ctx.moveTo(cx - r, y);
        ctx.lineTo(cx + r, y);
        ctx.stroke();
    });

    // 繪製赤道中軸線與地軸
    ctx.strokeStyle = 'rgba(234, 179, 8, 0.15)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath(); ctx.moveTo(cx - earthRadius - 20, cy); ctx.lineTo(cx + earthRadius + 40, cy); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx, cy - earthRadius - 20); ctx.lineTo(cx, cy + earthRadius + 20); ctx.stroke();
    ctx.setLineDash([]);

    // --- 2. 環流流體微粒運算與動態控制 ---
    particles.forEach(p => {
        p.life--;

        // 壽命用盡或跑出常理範疇，立刻強制重置循環
        if (p.life <= 0 || Math.abs(p.lat) > Math.PI / 2 || p.alt < 0 || p.alt > 1.2) {
            resetParticle(p);
        }

        const deg = (p.lat * 180) / Math.PI;
        const absDeg = Math.abs(deg);

        if (!isRotating) {
            // 【單圈環流模式】：赤道受熱上升 -> 向兩極高空流動 -> 極地冷卻下沉 -> 地表流回赤道
            if (p.alt >= 0.95) {
                p.lat += p.speed * (p.lat > 0 ? 1 : -1);
                if (absDeg >= 88) p.alt = 0.94;
            } else if (p.alt <= 0.05) {
                p.lat -= p.speed * (p.lat > 0 ? 1 : -1);
                if (absDeg <= 2) p.alt = 0.06;
            } else {
                if (absDeg <= 5) p.alt += 0.015;
                else if (absDeg >= 85) p.alt -= 0.015;
                else p.lat += p.speed * (p.alt > 0.5 ? (p.lat > 0 ? 1 : -1) : (p.lat > 0 ? -1 : 1));
            }
        } else {
            // 【三圈環流模式】
            if (absDeg <= 30) {
                // 1. 哈德里環流 (0° - 30°)：赤道上升，30度下沉
                if (p.alt >= 0.95) { p.lat += p.speed * (deg > 0 ? 1 : -1); if (absDeg >= 29) p.alt = 0.94; }
                else if (p.alt <= 0.05) { p.lat -= p.speed * (deg > 0 ? 1 : -1); if (absDeg <= 1) p.alt = 0.06; }
                else { if (absDeg <= 3) p.alt += 0.015; else if (absDeg >= 27) p.alt -= 0.015; else p.lat += p.speed * (p.alt > 0.5 ? (deg > 0 ? 1 : -1) : (deg > 0 ? -1 : 1)); }
            } else if (absDeg > 30 && absDeg <= 60) {
                // 2. 費雷爾環流 (30° - 60°)：30度下沉，60度上升 (動力逆向)
                if (p.alt >= 0.95) { p.lat -= p.speed * (deg > 0 ? 1 : -1); if (absDeg <= 31) p.alt = 0.94; }
                else if (p.alt <= 0.05) { p.lat += p.speed * (deg > 0 ? 1 : -1); if (absDeg >= 59) p.alt = 0.06; }
                else { if (absDeg >= 57) p.alt += 0.015; else if (absDeg <= 33) p.alt -= 0.015; else p.lat += p.speed * (p.alt > 0.5 ? (deg > 0 ? -1 : 1) : (deg > 0 ? 1 : -1)); }
            } else {
                // 3. 極地環流 (60° - 90°)：60度上升，極地沉降
                if (p.alt >= 0.95) { p.lat += p.speed * (deg > 0 ? 1 : -1); if (absDeg >= 89) p.alt = 0.94; }
                else if (p.alt <= 0.05) { p.lat -= p.speed * (deg > 0 ? 1 : -1); if (absDeg <= 61) p.alt = 0.06; }
                else { if (absDeg <= 63) p.alt += 0.015; else if (absDeg >= 87) p.alt -= 0.015; else p.lat += p.speed * (p.alt > 0.5 ? (deg > 0 ? 1 : -1) : (deg > 0 ? -1 : 1)); }
            }
        }

        // 幾何座標安全鎖定
        if (p.alt > 1) p.alt = 1; if (p.alt < 0) p.alt = 0;
        if (p.lat > Math.PI / 2) p.lat = Math.PI / 2; if (p.lat < -Math.PI / 2) p.lat = -Math.PI / 2;

        // 投影 2D 座標
        const currentRadius = earthRadius + p.alt * atmosphereHeight;
        const pX = cx + currentRadius * Math.cos(p.lat);
        const pY = cy - currentRadius * Math.sin(p.lat);

        // 繪製粒子本體
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(pX, pY, 2.5, 0, Math.PI * 2);
        ctx.fill();

        // --- 繪製地表三維科氏力偏轉風向線 (在近地面 0.35 內強效呈現) ---
        if (p.alt < 0.35) {
            const eX = cx + earthRadius * Math.cos(p.lat);
            const eY = cy - earthRadius * Math.sin(p.lat);

            ctx.lineWidth = 2; // 加粗線條，方便後排學生觀看
            ctx.beginPath();
            ctx.moveTo(eX, eY);

            if (!isRotating) {
                ctx.strokeStyle = 'rgba(255,255,255,0.4)';
                ctx.lineTo(eX - 10 * Math.sin(p.lat), eY);
            } else {
                ctx.strokeStyle = '#f97316'; // 顯眼的風帶橘
                if (deg > 0 && deg < 30) {
                    // 北半球東北信風：由東北吹向西南（側視向左下偏）
                    ctx.lineTo(eX - 14, eY + 8);
                } else if (deg >= 30 && deg < 60) {
                    // 北半球盛行西風：由西南吹向東北（側視向右上偏）
                    ctx.lineTo(eX + 14, eY - 8);
                } else if (deg >= 60) {
                    // 北半球極地東風
                    ctx.lineTo(eX - 10, eY + 4);
                } else if (deg < 0 && deg > -30) {
                    // 南半球東南信風：由東南吹向西北（側視向左上偏）
                    ctx.lineTo(eX - 14, eY - 8);
                } else if (deg <= -30 && deg > -60) {
                    // 南半球盛行西風：由西北吹向東南（側視向右下偏）
                    ctx.lineTo(eX + 14, eY + 8);
                } else if (deg <= -60) {
                    // 南半球極地東風
                    ctx.lineTo(eX - 10, eY - 4);
                }
            }
            ctx.stroke();
        }
    });

    // 繪製對流層頂虛擬外圈邊界
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.12)';
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.arc(cx, cy, earthRadius + atmosphereHeight, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    requestAnimationFrame(drawScene);
}

// 動態更新標籤與介面鎖定
function updateLabelsAndInterface() {
    const tradeWind = document.querySelector('.id-wind-trade');
    const westerly = document.querySelector('.id-wind-westerly');
    const polarWind = document.querySelector('.id-wind-polar');

    const hadley = document.querySelector('.id-hadley');
    const ferrel = document.querySelector('.id-ferrel');
    const polarCell = document.querySelector('.id-polar');

    const subhp = document.querySelector('.lbl-subhp-n');
    const sublp = document.querySelector('.lbl-sublp-n');

    if (!isRotating) {
        document.getElementById('model-title').textContent = "當前狀態：單圈環流模式 (不自轉)";
        document.getElementById('model-desc').innerHTML = "由於地球不自轉、沒有科氏力，大氣僅受熱力作用驅動：赤道受熱上升，一路高空直達極地；極地冷卻下沉，地表筆直吹回赤道，形成<strong>單圈對流</strong>。";

        [tradeWind, westerly, polarWind, ferrel, polarCell, subhp, sublp].forEach(el => {
            if (el) el.style.opacity = '0';
        });
        if (hadley) hadley.textContent = "單圈大環流";
    } else {
        document.getElementById('model-title').textContent = "當前狀態：三圈環流模式 (自轉)";
        document.getElementById('model-desc').innerHTML = "地球自轉所產生的<strong>科氏力</strong>偏轉了氣流，使單圈環流在緯度30°與60°發生斷裂與堆積，進而分化出哈德里、費雷爾與極地三圈環流，並催生出地表的副熱帶高壓與盛行西風等風帶。";

        [tradeWind, westerly, polarWind, ferrel, polarCell, subhp, sublp].forEach(el => {
            if (el) el.style.opacity = '1';
        });
        if (hadley) hadley.textContent = "哈德里環流";
    }
}

// 控制切換按鈕事件
document.getElementById('btn-single-cell').addEventListener('click', (e) => {
    isRotating = false;
    document.getElementById('btn-three-cell').classList.remove('active');
    e.target.classList.add('active');
    updateLabelsAndInterface();
});

document.getElementById('btn-three-cell').addEventListener('click', (e) => {
    isRotating = true;
    document.getElementById('btn-single-cell').classList.remove('active');
    e.target.classList.add('active');
    updateLabelsAndInterface();
});

window.addEventListener('resize', () => { resizeCanvas(); });

// 初始啟動
resizeCanvas();
initParticles();
drawScene();
updateLabelsAndInterface();

// --- 隨堂測驗資料結構（維持10題不變） ---
const quizData = [
    {
        q: "1. 如果地球『完全停止自轉』且地表皆為均勻海洋，則全球大氣環流將退化為單圈模式。此時北半球地表的盛行風向將會變成什麼？",
        opts: ["(A) 東北信風", "(B) 盛行西風", "(C) 正北風", "(D) 正南風"],
        a: "C",
        r: "正確！若地球不自轉，則完全沒有科氏力發生偏轉。北半球高緯度的極地高壓氣流將筆直向南吹向赤道低壓，因此地表風向會是極其單純的『正北風』。"
    },
    {
        q: "2. 在三圈環流模型中，位於緯度 30° 附近的「副熱帶高壓帶」在成因上屬於哪一種機制？全球主要的熱帶沙漠大多分布於此的原因為何？",
        opts: ["(A) 熱力因素；因該處常年受熱、空氣劇烈膨脹上升少雨", "(B) 動力因素；因高空暖空氣在此處堆積被迫下沉，氣流絕熱增溫導致乾燥少雨", "(C) 熱力因素；因高緯度冷空氣南下在此沉降形成高壓", "(D) 地形因素；因皆位於巨大山脈的背風坡阻擋水氣"],
        a: "B",
        r: "正確！副熱帶高壓帶是『動力高壓』。哈德里環流的高空氣流向極地前進時在緯度30°堆積下沉，下沉氣流絕熱增溫使得相對濕度極低，因而締造了撒哈拉等全球大沙漠。"
    },
    {
        q: "3. 關於赤道低壓帶（又稱間熱帶輻合區，ITCZ）的垂直氣流與天氣特徵描述，下列何者在地球科學上完全正確？",
        opts: ["(A) 垂直氣流下沉，天氣晴朗酷熱乾燥", "(B) 垂直氣流上升，對流旺盛，多雷陣雨與午後強降雨", "(C) 水平風力極強，常年颳起狂暴的西風", "(D) 位於冷暖氣團交界，鋒面活動極為頻繁"],
        a: "B",
        r: "正確！赤道因太陽直射受熱最多，盛行強烈的『熱力上升氣流』，水氣在高空冷凝，因此常年對流旺盛，是地球上著名的多雨無風帶。"
    },
    {
        q: "4. 台灣（約北緯22°至25°）位於行星風系的哪兩個氣壓帶或風帶的季節移動交界範圍內？",
        opts: ["(A) 極地高壓帶與極地東風帶", "(B) 盛行西風帶與副極地低壓帶", "(C) 副熱帶高壓帶與東北信風帶", "(D) 赤道低壓帶與盛行西風帶"],
        a: "C",
        r: "正確！台灣位處副熱帶。冬季副熱帶高壓帶隨太陽直射點南移，台灣主要受東北信風（配合季風）影響；夏季高壓帶北抬，台灣則常受副熱帶高壓壟罩。"
    },
    {
        q: "5. 某架由台灣飛往美國舊金山的民航客機，在高空中常可藉由順風來節省燃料與飛行時間。請問該飛機是利用了哪一個風帶的高空強風？",
        opts: ["(A) 地表東北信風", "(B) 中緯度高空的盛行西風（噴流）", "(C) 低緯度的赤道東風", "(D) 極地環流的東風"],
        a: "B",
        r: "正確！中緯度地區（30°~60°）不論地表或高空，皆盛行由西向東吹的『西風』。高空的西風噴流極為強勁，東行客機順風逆行可大幅縮短航程。"
    },
    {
        q: "6. 關於「費雷爾環流（Ferrel Cell）」的敘述，下列哪一項是它與哈德里環流、極地環流最顯著的不同之處？",
        opts: ["(A) 它是由赤道熱力直接驅動的對流圈", "(B) 它的垂直氣流在緯度60°下沉、30°上升", "(C) 它屬於動力引發的『逆向環流』，夾在兩個熱力環流之間被動運轉", "(D) 它是全球規模最大、垂直高度最高的大氣胞"],
        a: "C",
        r: "正確！費雷爾環流是間接的『動力逆向環流』。它夾在哈德里與極地環流之間，就像一個被動帶動的齒輪，在緯度30°隨堆積氣流下沉、在60°隨鋒面氣流上升。"
    },
    {
        q: "7. 在副極地低壓帶（北緯60°）附近，來自南方的盛行西風與來自北方的極地東風在此交會。請問這兩股氣團交會時會產生何種地科現象？",
        opts: ["(A) 形成下沉乾冷氣流，造成大範圍乾旱", "(B) 冷暖氣團交會形成極鋒（Polar Front），氣流輻合上升激發多雨天氣", "(C) 氣流完全抵消，地表呈現完全無風狀態", "(D) 引發熱帶對流，形成強烈的颱風"],
        a: "B",
        r: "正確！來自中緯度的溫暖西風與極地的寒冷東風在60°相遇，暖空氣沿冷空氣斜面被迫爬升，形成『極鋒』與動力低壓帶，多溫帶鋒面雨。"
    },
    {
        q: "8. 住在南半球澳洲雪梨（約南緯34°）的小明，觀測當地地表的行星風系風向，其盛行西風偏轉後的精確風向應該為何？",
        opts: ["(A) 西南風", "(B) 東北風", "(C) 西北風", "(D) 東南風"],
        a: "C",
        r: "正確！大氣由副熱帶高壓（南緯30°）向南吹向副極地低壓（南緯60°）。氣流向南前進時，南半球的科氏力會使前進方向『向左偏』，因此西風會偏轉為由西北吹向東南的『西北風』。"
    },
    {
        q: "9. 行星風系隨季節調整的「風帶季移」現象，其最根本的推手與成因是什麼？",
        opts: ["(A) 地球公轉且地軸傾斜，導致太陽直射點在南北回歸線之間週期移動", "(B) 海陸比熱差異導致夏天陸地熱、冬天海洋熱", "(C) 聖嬰現象引發太平洋海溫異常起伏", "(D) 月球引潮力對大氣層的拖拽效應"],
        a: "A",
        r: "正確！由於地軸傾斜 23.5° 公轉，太陽直射點會隨季節在南北回歸線間移動。全球氣壓帶與風帶也會隨直射點的軌跡，在夏季集體北移、冬季集體南移。"
    },
    {
        q: "10. 下列哪一項全球氣候類型的成因，與『副熱帶高壓帶與盛行西風帶的季節交替控制』有最直接、密不可分的因果關係？",
        opts: ["(A) 赤道雨林氣候", "(B) 中緯度溫帶大陸性氣候", "(C) 夏乾冬雨的地中海型氣候", "(D) 全年多雨的溫帶海洋性氣候"],
        a: "C",
        r: "正確！地中海型氣候位於緯度30°~40°大陸西岸。夏季風帶北移，受乾燥的副熱帶高壓壟罩而炎熱少雨；冬季風帶南移，迎來多雨的盛行西風與鋒面，形成夏乾冬雨的獨特特徵。"
    }
];

let currentQuizIndex = 0;

function initQuiz() {
    const container = document.getElementById('quiz-container');
    if (!container) return;

    if (currentQuizIndex >= quizData.length) {
        container.innerHTML = "<div class='quiz-question' style='color:#00ffcc; text-align:center;'>🎉 太神了！全球行星風系與三圈環流大魔王全套題庫，你已完美通關！</div>";
        return;
    }

    const qItem = quizData[currentQuizIndex];
    document.getElementById('quiz-q').innerText = qItem.q;

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

window.addEventListener('DOMContentLoaded', initQuiz);
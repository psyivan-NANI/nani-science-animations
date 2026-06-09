const canvas = document.getElementById('moonCanvas');
const ctx = canvas.getContext('2d');

let lunarDate = 15; // 預設農曆十五 (滿月)

function resizeCanvas() {
    const rect = canvas.parentElement.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
}

// 根據天體幾何公式流暢繪製雙視角聯動
function drawScene() {
    const w = canvas.width / window.devicePixelRatio;
    const h = canvas.height / window.devicePixelRatio;

    ctx.clearRect(0, 0, w, h);

    // 計算月球繞地球公轉的夾角弧度 (農曆初一角度為 0，十五為 Math.PI)
    // 考慮到逆時針公轉與太陽光方向，給予幾何映射
    const angle = ((lunarDate - 1) / 30) * Math.PI * 2;

    // --- 區塊一：左側「太空俯視圖幾何」 (佔據左半邊) ---
    const sCx = w * 0.26;
    const sCy = h * 0.5;
    const orbitRadius = 65;

    // 繪製平行太陽光指示線
    ctx.strokeStyle = 'rgba(255, 153, 0, 0.15)';
    ctx.lineWidth = 2;
    for (let i = -4; i <= 4; i++) {
        ctx.beginPath();
        ctx.moveTo(10, sCy + i * 25);
        ctx.lineTo(sCx - 35, sCy + i * 25);
        ctx.stroke();
    }

    // 繪製月球公轉軌道虛線
    ctx.strokeStyle = 'rgba(0, 210, 255, 0.25)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.arc(sCx, sCy, orbitRadius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // 繪製中央地球（固定一半藍一半黑，因為太陽光從左邊來）
    ctx.save();
    ctx.translate(sCx, sCy);
    // 亮面（左側）
    ctx.fillStyle = '#1d4ed8';
    ctx.beginPath();
    ctx.arc(0, 0, 18, Math.PI * 0.5, Math.PI * 1.5);
    ctx.fill();
    // 暗面（右側）
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.arc(0, 0, 18, Math.PI * 1.5, Math.PI * 0.5);
    ctx.fill();
    ctx.restore();

    // 計算月球在軌道上的太空座標位置
    // 用 -angle 使其呈自然逆時針公轉
    const mX = sCx + orbitRadius * Math.cos(-angle);
    const mY = sCy + orbitRadius * Math.sin(-angle);

    // 繪製軌道上的小月球（在太空中不論在哪，永遠是左亮右暗！）
    ctx.save();
    ctx.translate(mX, mY);
    ctx.fillStyle = '#ffee55'; // 太空亮面
    ctx.beginPath();
    ctx.arc(0, 0, 8, Math.PI * 0.5, Math.PI * 1.5);
    ctx.fill();
    ctx.fillStyle = '#334155'; // 太空暗面
    ctx.beginPath();
    ctx.arc(0, 0, 8, Math.PI * 1.5, Math.PI * 0.5);
    ctx.fill();
    ctx.restore();


    // --- 區塊二：右側「人眼夜空主觀視角月相」 (佔據右半邊) ---
    const vCx = w * 0.74;
    const vCy = h * 0.5;
    const vRadius = 65; // 主視角大月球半徑

    // 背景星空微光圈
    ctx.fillStyle = 'rgba(255,255,255,0.03)';
    ctx.beginPath();
    ctx.arc(vCx, vCy, vRadius + 15, 0, Math.PI * 2);
    ctx.fill();

    // 依據日地月三點幾何，計算從地球看亮面的反射投影係數 (phase)
    // 經典月相幾何核心演算法：使用餘弦公式計算亮面厚度
    const phase = Math.cos(angle);

    ctx.save();
    ctx.translate(vCx, vCy);

    // 預設先鋪滿黑色暗面底圓
    ctx.fillStyle = '#111827';
    ctx.beginPath();
    ctx.arc(0, 0, vRadius, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffee55'; // 亮面金黃色
    ctx.shadowBlur = 20;
    ctx.shadowColor = '#ffee55';

    if (lunarDate >= 1 && lunarDate <= 15) {
        // 上半月：亮面從右側逐漸往左擴張
        // 1. 先畫右半邊半圓亮面
        ctx.beginPath();
        ctx.arc(0, 0, vRadius, Math.PI * 1.5, Math.PI * 0.5);
        ctx.fill();

        // 2. 幾何投影補償線：利用半徑乘上 phase (從 -1 到 1 漸變)
        ctx.beginPath();
        ctx.ellipse(0, 0, vRadius * Math.abs(phase), vRadius, 0, Math.PI * 1.5, Math.PI * 0.5);
        if (lunarDate <= 8) {
            // 初一 到 初八（新月到上弦月）：亮面被左側黑影蠶食，因此用暗色蓋住
            ctx.fillStyle = '#111827';
            ctx.fill();
        } else {
            // 初八 到 十五（上弦月到滿月）：亮面鼓起凸出，用黃色填滿
            ctx.fillStyle = '#ffee55';
            ctx.fill();
        }
    } else {
        // 下半月：亮面從右側開始退去，左側保持發亮
        // 1. 先畫左半邊半圓亮面
        ctx.beginPath();
        ctx.arc(0, 0, vRadius, Math.PI * 0.5, Math.PI * 1.5);
        ctx.fill();

        // 2. 幾何下半月投影補償
        ctx.beginPath();
        ctx.ellipse(0, 0, vRadius * Math.abs(phase), vRadius, 0, Math.PI * 0.5, Math.PI * 1.5);
        if (lunarDate <= 23) {
            // 十五 到 二二（滿月到下弦月）：亮面仍然鼓起，填滿黃色
            ctx.fillStyle = '#ffee55';
            ctx.fill();
        } else {
            // 二二 到 三十（下弦月到殘月）：亮面縮小，用暗色覆蓋
            ctx.fillStyle = '#111827';
            ctx.fill();
        }
    }
    ctx.restore();
    ctx.shadowBlur = 0; // 重置外發光
}

// 根據日期時間軸動態更新說明卡與狀態
function updateInterface() {
    let name = "";
    let title = "";
    let desc = "";

    if (lunarDate === 1) {
        name = "朔（新月）";
        title = "農曆初一：月球位於日地之間";
        desc = "此時月球亮面完全背對地球（日月地順序），且與太陽同時升落，因此在夜空中完全不可見，這天稱為「朔」。";
    } else if (lunarDate > 1 && lunarDate < 8) {
        name = "眉月 / 蛾眉月";
        title = "農曆初四：亮面逐漸顯現";
        desc = "月球向逆時針公轉移開，地球人開始可以看到右側邊緣的一抹微光。亮面形如眉毛。";
    } else if (lunarDate === 8) {
        name = "上弦月";
        title = "農曆初八：日地月呈直角 90°";
        desc = "此時我們可以看見月球的<strong>右半邊發亮</strong>。上弦月在中午正東方升起，黃昏正值頭頂，半夜由西方落下。";
    } else if (lunarDate > 8 && lunarDate < 15) {
        name = "盈凸月";
        title = "農曆十二：亮面超過半圓";
        desc = "月球持續往滿月邁進，此時亮面已超過一半，右側大面積發光，在黃昏時早已出現在東方天空。";
    } else if (lunarDate === 15) {
        name = "望（滿月）";
        title = "農曆十五：日地月排成一直線";
        desc = "月球公轉到與太陽相反的方向，亮面全部朝向地球。滿月在黃昏東升，清晨西落，整夜散發璀璨金光。引力疊加形成<strong>大潮</strong>。";
    } else if (lunarDate > 15 && lunarDate < 23) {
        name = "虧凸月";
        title = "農曆十九：亮面開始從右側虧損";
        desc = "滿月過後，右側亮面開始被陰影覆蓋，發亮區域逐漸往左側縮減，月出時間也延後到深夜。";
    } else if (lunarDate === 23) {
        name = "下弦月";
        title = "農曆二二：日地月再次呈 90° 直角";
        desc = "月球繞到軌道另一側，此時只有<strong>左半邊發亮</strong>。下弦月在半夜子時才從東方東升，清晨時高掛在正頭頂。";
    } else {
        name = "殘月 / 殘蛾眉月";
        title = "農曆二七：僅剩左側一絲微光";
        desc = "亮面即將完全消失，僅剩左方邊緣如鐮刀般的微光，必須在清晨天亮前的東方低空才能勉強觀測到。";
    }

    document.getElementById('date-text').textContent = `農曆 ${lunarDate} 日 (${name})`;
    document.getElementById('moon-phase-name').textContent = name;
    document.getElementById('geo-title').textContent = title;
    document.getElementById('geo-desc').innerHTML = desc;
}

// 監聽時間軸拖拽事件
document.getElementById('slider-date').addEventListener('input', (e) => {
    lunarDate = parseInt(e.target.value);
    updateInterface();
    drawScene();
});

window.addEventListener('resize', () => {
    resizeCanvas();
    drawScene();
});


// --- 核心 4: 結構化 10 題互動隨堂地科題庫大數據字典 ---
const quizData = [
    {
        q: "1. 綠色植物光合作用需要照光，而地球人觀測月亮也有圓缺。請問造成「月相變化」的絕對根本原因為何？",
        opts: ["(A) 地球的影子遮擋了射向月球的太陽光", "(B) 太陽、地球、月球三者的相對位置隨月球公轉而改變，導致地球人看到的月球亮面比例不同", "(C) 月球本身是一顆會發光的恆星，其發光強度具有週期性起伏", "(D) 宇宙中的星際雲霧定期飄過月球表面造成遮蔽"],
        a: "B",
        r: "正確！月相變化是「日地月相對幾何位置改變」所致。請注意，(A)選項描述的是「月食」，而非日常的月相變化，這是地科最經典的陷阱題！"
    },
    {
        q: "2. 國中理化教過光的直線傳播。在上弦月時，地球人可以看到月球的右半邊發亮。請問當天是農曆大約幾號？",
        opts: ["(A) 農曆初一", "(B) 農曆初八", "(C) 農曆十五", "(D) 農曆廿二"],
        a: "B",
        r: "正確！農曆初八前後，日地月互成 90 度直角，月球亮面剛好有一半面朝地球，此時我們看到「右半邊」發亮，稱為上弦月。"
    },
    {
        q: "3. 小明在清晨天剛亮、準備上學時，抬頭看見西方高空中掛著一個「左半邊發亮」的半圓形月亮。請推測當天最接近農曆哪一天？",
        opts: ["(A) 初一新月", "(B) 初八上弦月", "(C) 十五滿月", "(D) 廿二下弦月"],
        a: "D",
        r: "正確！「左邊亮」是下半月的特徵。下弦月大約在半夜 12 點自東方升起，到了清晨 6 點剛好運行到西方天空（或正頭頂），這完全符合地科運算規律！"
    },
    {
        q: "4. 當月相呈現「朔」的時候，月球正運行到太陽與地球之間。請問這一天月球大約在什麼時間從東方地平線升起？",
        opts: ["(A) 清晨清晨（與太陽幾乎同時東升）", "(B) 中午正午時分", "(C) 黃昏傍晚", "(D) 半夜子時"],
        a: "A",
        r: "正確！「朔（新月）」出現在農曆初一，此時月球與太陽在同一方向，因此會在清晨與太陽一同升起，黃昏一同落下，整夜不可見。"
    },
    {
        q: "5. 地球科學著名的「大潮」是指滿潮時水位特別高、乾潮時水位特別低的現象。請問每個月大潮通常發生在哪些月相的日期？",
        opts: ["(A) 上弦月與下弦月（初八、二二）", "(B) 新月與滿月（初一、十五）", "(C) 只有農曆十五滿月當天", "(D) 每個月的初十與二十號"],
        a: "B",
        r: "正確！初一（朔）與十五（望）時，太陽、月球與地球排成一直線，兩者的萬有引力互相疊加，對海水的拉力最大，形成大潮。"
    },
    {
        q: "6. 如果今天晚上小明想帶女朋友去海邊賞月，並且希望能夠看到「整夜都能觀賞到、最大最圓的明月」，他應該選擇農曆哪一天？",
        opts: ["(A) 農曆初一", "(B) 農曆初八", "(C) 農曆十五", "(D) 農曆廿二"],
        a: "C",
        r: "正確！農曆十五「望（滿月）」當天，月球在黃昏 6 點從東方升起，半夜 12 點高掛中央，清晨 6 點在西方落下，剛好整夜可見！"
    },
    {
        q: "7. 下列關於月球與地球相對運動的基礎地科常識，何者敘述正確？",
        opts: ["(A) 月球由西向東圍繞地球公轉，週期大約為一個月", "(B) 地球圍繞月球公轉，週期為一年", "(C) 月球本身完全沒有自轉", "(D) 月球繞地公轉的軌道形狀是完美的正圓形"],
        a: "A",
        r: "正確！月球是地球的衛星，以「由西向東」的逆時針方向圍繞地球公轉，公轉一圈的週期大約就是農曆的一個月（約29.5天）。"
    },
    {
        q: "8. 住在台灣的小華發現，不論是在農曆初八還是十五，我們在地球上看到的月球表面陰影花紋（如吳剛伐桂）幾乎都一模一樣，這是因為什麼科學原理？",
        opts: ["(A) 月球表面花紋是投影在地球大氣層上的幻覺", "(B) 月球的自轉週期與公轉週期剛好同步（皆約27.3天）", "(C) 月球在太空中完全被鎖定、完全不轉動", "(D) 太陽光永遠只照射在同一個有花紋的面"],
        a: "B",
        r: "正確！這稱為「潮汐鎖定」。因為月球的自轉與公轉週期完全相同，導致它永遠以「同一面」朝向地球，我們在地球上永遠看不到它的背面。"
    },
    {
        q: "9. 關於上弦月（農曆初八）當天月球在天空中的軌跡，下列哪一項敘述在考題觀念上完全正確？",
        opts: ["(A) 它會在半夜 12 點才從東方升起", "(B) 它會在黃昏 18 點左右出現在我們的正頭頂（中天）", "(C) 它會在清晨天亮時在正東方升起", "(D) 當天整夜都看不到月亮"],
        a: "B",
        r: "正確！上弦月中午 12 點從東方升起（此時陽光太強看不到），到了黃昏 6 點太陽西落，它剛好走到正頭頂，最適合觀測！"
    },
    {
        q: "10. 農曆下半月的月相會由滿月逐漸轉變成下弦月，最後變成殘月。請問此時我們在地球上所看到的月球亮面，其形狀是如何變化的？",
        opts: ["(A) 亮面從右側邊緣開始虧損，最後只剩下左側的一絲微光", "(B) 亮面從左側邊緣開始虧損，最後只剩下右側的一絲微光", "(C) 亮面由中間裂開，向兩側縮小", "(D) 亮面面積完全不變，只是亮度變暗"],
        a: "A",
        r: "正確！月球公轉時陰影從右向左逐漸覆蓋。下半月的亮面會從右側開始消退，到了農曆二十七左右，只剩左邊像鐮刀一樣的殘月。"
    }
];

let currentQuizIndex = 0;

function initQuiz() {
    const container = document.getElementById('quiz-container');
    if (currentQuizIndex >= quizData.length) {
        container.innerHTML = "<div class='quiz-question' style='color:#00ffcc; text-align:center;'>🎉 恭喜企劃長官！已順利通關 10 題月相幾何核心檢測！</div>";
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

// 系統初始化
resizeCanvas();
drawScene();
updateInterface();
window.addEventListener('DOMContentLoaded', initQuiz);
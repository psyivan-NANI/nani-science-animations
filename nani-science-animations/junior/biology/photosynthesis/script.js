const canvas = document.getElementById('photoCanvas');
const ctx = canvas.getContext('2d');

let gearAngle = 0;
let isLightActive = false;
let isDarkActive = false;

// 原料收集追踪器
let hasPhoton = false;
let hasH2O = false;
let hasCO2 = false;

function resizeCanvas() {
    const rect = canvas.parentElement.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
}

// 繪製精緻的工業風雙齒輪反應流水線模型
function drawScene() {
    const w = canvas.width / window.devicePixelRatio;
    const h = canvas.height / window.devicePixelRatio;
    const cx = w / 2;
    const cy = h / 2;

    ctx.clearRect(0, 0, w, h);

    // 齒輪持續微幅慢速運轉，當原料投入時轉速加快
    let speed = 0.01;
    if (isLightActive || isDarkActive) speed = 0.04;
    gearAngle += speed;

    // --- 1. 繪製左側「光反應大齒輪」（基粒代表） ---
    const g1x = cx - 90;
    const g1y = cy - 40;
    const g1Radius = 65;

    ctx.save();
    ctx.translate(g1x, g1y);
    ctx.rotate(gearAngle);
    drawGear(g1Radius, 12, 'rgba(0, 198, 255, 0.2)', '#00c6ff');
    ctx.restore();

    // --- 2. 繪製右側「暗反應大齒輪」（基質代表） ---
    const g2x = cx + 90;
    const g2y = cy + 40;
    const g2Radius = 65;

    ctx.save();
    ctx.translate(g2x, g2y);
    ctx.rotate(-gearAngle); // 齒輪嚙合反向旋轉
    drawGear(g2Radius, 12, 'rgba(249, 212, 35, 0.15)', '#f9d423');
    ctx.restore();

    // --- 3. 繪製中間傳導能量流（ATP / NADPH 傳輸線） ---
    ctx.lineWidth = 3;
    ctx.setLineDash([6, 6]);
    ctx.strokeStyle = (isLightActive) ? '#00ff66' : '#38444d';
    ctx.beginPath();
    ctx.moveTo(g1x, g1y + 20);
    ctx.quadraticCurveTo(cx, cy, g2x, g2y - 20);
    ctx.stroke();
    ctx.setLineDash([]); // 恢復實線

    // 連續動畫繪製
    requestAnimationFrame(drawScene);
}

// 精確齒輪繪製函式
function drawGear(radius, numTeeth, fillColor, strokeColor) {
    ctx.fillStyle = fillColor;
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 3;

    ctx.beginPath();
    ctx.arc(0, 0, radius - 10, 0, Math.PI * 2);
    ctx.fill();

    // 繪製齒輪凸齒
    for (let i = 0; i < numTeeth; i++) {
        ctx.save();
        ctx.rotate((Math.PI * 2 / numTeeth) * i);
        ctx.fillRect(-6, -radius - 2, 12, 14);
        ctx.strokeRect(-6, -radius - 2, 12, 14);
        ctx.restore();
    }

    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.stroke();

    // 內軸心
    ctx.fillStyle = varColor('--bg-dark');
    ctx.beginPath();
    ctx.arc(0, 0, 15, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
}

function varColor(varName) {
    return getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
}

// --- 核心 2: 拖拽機制與反應觸發邏輯 ---
const draggables = document.querySelectorAll('.draggable-item');
const zoneLight = document.getElementById('zone-light');
const zoneDark = document.getElementById('zone-dark');
const statusBadge = document.getElementById('factory-status');

draggables.forEach(item => {
    item.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('text/plain', e.target.id);
    });
});

[zoneLight, zoneDark].forEach(zone => {
    zone.addEventListener('dragover', (e) => { e.preventDefault(); zone.classList.add('drag-over'); });
    zone.addEventListener('dragleave', () => { zone.classList.remove('drag-over'); });
});

zoneLight.addEventListener('drop', (e) => {
    e.preventDefault();
    zoneLight.classList.remove('drag-over');
    const id = e.dataTransfer.getData('text/plain');

    if (id === 'photon') { hasPhoton = true; document.getElementById('photon').style.opacity = '0.4'; }
    if (id === 'h2o') { hasH2O = true; document.getElementById('h2o').style.opacity = '0.4'; }

    checkLightReaction();
});

zoneDark.addEventListener('drop', (e) => {
    e.preventDefault();
    zoneDark.classList.remove('drag-over');
    const id = e.dataTransfer.getData('text/plain');

    if (id === 'co2') {
        if (!isLightActive) {
            statusBadge.innerText = "❌ 警告：光反應尚未提供能量，暗反應無法運作！";
            return;
        }
        hasCO2 = true;
        document.getElementById('co2').style.opacity = '0.4';
        triggerDarkReaction();
    }
});

function checkLightReaction() {
    if (hasPhoton && hasH2O) {
        isLightActive = true;
        statusBadge.innerText = "🟢 光反應成功！水分子已分解，釋出氧氣！";
        document.getElementById('spawn-o2').classList.remove('hidden');
        document.getElementById('log-title').innerText = "光反應完成";
        document.getElementById('log-desc').innerHTML = "葉綠素吸收光能成功將<strong>水分解</strong>，產生了<strong>氧氣</strong>並向下游輸送ATP高能分子！請接下來在暗反應點投入二氧化碳。";
    } else {
        statusBadge.innerText = "⚡ 光反應還缺少原料（需要光子與水）";
    }
}

function triggerDarkReaction() {
    if (hasCO2 && isLightActive) {
        isDarkActive = true;
        statusBadge.innerText = "🎉 暗反應啟動！能量成功將二氧化碳合成為葡萄糖！";
        document.getElementById('spawn-glucose').classList.remove('hidden');
        document.getElementById('log-title').innerText = "工廠全線運作";
        document.getElementById('log-desc').innerHTML = "暗反應利用光反應產生的能量，成功將<strong>二氧化碳</strong>轉換成富含能量的<strong>葡萄糖</strong>與水！";
    }
}

// 收集產物點擊事件
document.getElementById('spawn-o2').addEventListener('click', (e) => {
    e.target.classList.add('hidden');
    statusBadge.innerText = "✨ 成功收集：氧氣 (釋放到大氣中供生物呼吸)";
});

document.getElementById('spawn-glucose').addEventListener('click', (e) => {
    e.target.classList.add('hidden');
    statusBadge.innerText = "🏆 成功收集：葡萄糖 (儲存為澱粉供植物生長)";
});

document.getElementById('btn-reset').addEventListener('click', () => {
    hasPhoton = hasH2O = hasCO2 = isLightActive = isDarkActive = false;
    document.querySelectorAll('.draggable-item').forEach(i => i.style.opacity = '1');
    document.getElementById('spawn-o2').classList.add('hidden');
    document.getElementById('spawn-glucose').classList.add('hidden');
    statusBadge.innerText = "等待投入原料...";
    document.getElementById('log-title').innerText = "雙階段生產線";
    document.getElementById('log-desc').innerText = "光合作用在葉綠體中進行。分為兩大階段：在基粒進行的光反應，以及在基質進行的暗反應（碳反應）。";
});


// --- 核心 4: 結構化 10 題互動隨堂題庫大數據字典 ---
const quizData = [
    {
        q: "1. 關於植物進行光合作用的主要「場所」與其構造，下列敘述何者完全正確？",
        opts: ["(A) 在液胞中進行，因為裡面含有大量水分", "(B) 在葉綠體中進行，包含基粒（光反應）與基質（暗反應）", "(C) 在粒線體中進行，因為需要燃燒葡萄糖", "(D) 在細胞核中進行，由DNA指揮合成"],
        a: "B",
        r: "正確！光合作用是葉綠體的專屬特權。基粒負責捕捉光能（光反應），基質負責碳固定（暗反應）。"
    },
    {
        q: "2. 在剛才的微觀工廠實驗中，當我們投入「光子」和「水分子」觸發了光反應，請問此時產生的「氣體產物」是什麼？",
        opts: ["(A) 二氧化碳", "(B) 水蒸氣", "(C) 氧氣", "(D) 氮氣"],
        a: "C",
        r: "正確！光反應的核心考點就是「水的分解」，水被光能切開後會產生「氧氣」，並直接擴散釋放到大氣中。"
    },
    {
        q: "3. 關於「暗反應（碳反應）」的敘述，下列哪一項是國中生物課堂上最容易混淆的正確觀念？",
        opts: ["(A) 暗反應必須在完全漆黑的深夜才能進行", "(B) 暗反應不需要光能，但絕對需要光反應提供的化學能量與二氧化碳", "(C) 暗反應的主要產物是分解水並釋放氧氣", "(D) 暗反應由始至終不需要任何能量加入"],
        a: "B",
        r: "正確！暗反應雖然「不需要直接照光」，但它必須消耗光反應在白天做好的化學能量，因此植物在夜晚通常無法持續進行暗反應。"
    },
    {
        q: "4. 植物進行光合作用最終合成的最初有機物是葡萄糖，請問植物通常會將葡萄糖轉化為何種形式儲存起來？",
        opts: ["(A) 蛋白質", "(B) 澱粉", "(C) 脂肪", "(D) 礦物質"],
        a: "B",
        r: "正確！葡萄糖分子小、易溶於水，不利於長期大量儲存，因此植物會將其串成巨大的「澱粉」顆粒進行儲藏。"
    },
    {
        q: "5. 國中生物經典實驗「光合作用產物檢驗」中，將葉片放入盛有「酒精」的燒杯中並隔水加熱，其主要目的為何？",
        opts: ["(A) 溶解葉片內的澱粉以方便觀察", "(B) 溶出葉片中的葉綠素，使葉片脫色便於後續碘液顯色", "(C) 殺死葉片上的細菌避免發霉", "(D) 利用酒精的藍色反應直接檢驗葡萄糖"],
        a: "B",
        r: "正確！葉綠素的綠色太深會遮蔽後面化學試劑的顏色變化，因此必須用酒精隔水加熱，將「葉綠素溶出脫色」。"
    },
    {
        q: "6. 承上題，在葉片脫色實驗中，為什麼酒精必須採用「隔水加熱」，而不能用火直接加熱燒杯？",
        opts: ["(A) 因為酒精太冷，直接加熱無法沸騰", "(B) 酒精具有易燃性且沸點低，直接加熱極易引發火災危險", "(C) 隔水加熱才能保持葉綠素的完整結構", "(D) 這是課本硬性規定，在科學上沒有任何安全考量"],
        a: "B",
        r: "正確！酒精是高度易燃的揮發性液體，直接接觸火源會瞬間起火，因此必須採取安全第一的「隔水加熱」。"
    },
    {
        q: "7. 經過完整脫色處理後的葉片，若滴加「碘液」進行檢驗，結果發現照光部分呈現「藍黑色」，這證明照光部分含有什麼物質？",
        opts: ["(A) 葡萄糖", "(B) 蛋白質", "(C) 澱粉", "(D) 二氧化碳"],
        a: "C",
        r: "正確！黃褐色的「碘液」只要遇到「澱粉」，就會發生極為顯著的化學反應，轉變成「藍黑色」。"
    },
    {
        q: "8. 若將一盆植物用黑紙將其中一片葉子的中央部分正反面封死（不照光），數天後拔下檢驗，發現黑紙遮蓋區滴加碘液後保持「黃褐色」，這說明了什麼？",
        opts: ["(A) 光合作用不需要光也能製造澱粉", "(B) 光照是光合作用製造澱粉的必要條件", "(C) 遮光區製造了更多的葡萄糖", "(D) 黑紙本身含有大量黃褐色化學毒素"],
        a: "B",
        r: "正確！遮光區沒有照到光，光反應停擺，無法製造澱粉，因此碘液保持原來的黃褐色，證明光照是必需條件。"
    },
    {
        q: "9. 地球大氣中的氧氣含量得以長期維持在約 21%，主要歸功於生物圈中何種生理機制的穩定運作？",
        opts: ["(A) 動物進行呼吸作用消耗二氧化碳", "(B) 綠色植物廣泛進行光合作用的水分解", "(C) 火山噴發釋放大量高壓氧氣", "(D) 海水蒸發時物理自然解離"],
        a: "B",
        r: "正確！植物與藻類的光合作用是地球上最龐大的「氧氣製造機」，源源不絕地藉由光反應分解水為生物提供呼吸氧氣。"
    },
    {
        q: "10. 關於光合作用中「水」與「二氧化碳」在總反應式中的定位，下列歸納何者在生物學上完全正確？",
        opts: ["(A) 水是原料，二氧化碳是最終產物", "(B) 兩者皆是光合作用的必需反應原料", "(C) 兩者皆是暗反應結束後釋放的廢棄氣體", "(D) 水由空氣吸入，二氧化碳由根部吸收"],
        a: "B",
        r: "正確！水（根部吸收）與二氧化碳（氣孔吸入）是整個光合作用最核心的兩大「化學原料」。"
    }
];

let currentQuizIndex = 0;

function initQuiz() {
    const container = document.getElementById('quiz-container');
    if (currentQuizIndex >= quizData.length) {
        container.innerHTML = "<div class='quiz-question' style='color:#00ffcc; text-align:center;'>🎉 恭喜完成本章節光合作用所有檢測題！</div>";
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

// 啟動系統
resizeCanvas();
drawScene();
window.addEventListener('DOMContentLoaded', initQuiz);
window.addEventListener('resize', resizeCanvas);
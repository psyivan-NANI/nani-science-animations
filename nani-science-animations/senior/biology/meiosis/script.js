const canvas = document.getElementById('meiosisCanvas');
const ctx = canvas.getContext('2d');

let currentStage = 0; // 0:間期, 1:減I前期(聯會互換), 2:減I中後期(同源分離), 3:減I末期(形成雙細胞), 4:減II中後期(姊妹分離), 5:減II末期(四個配子)
let isCrossoverTriggered = false; // 是否發生基因片段互換

function resizeCanvas() {
    const rect = canvas.parentElement.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
}

// 核心繪圖與幾何渲染引擎
function drawScene() {
    const w = canvas.width / window.devicePixelRatio;
    const h = canvas.height / window.devicePixelRatio;
    const cx = w / 2;
    const cy = h / 2;

    ctx.clearRect(0, 0, w, h);

    // 建立精緻的細胞背景網格
    ctx.strokeStyle = 'rgba(255,255,255,0.02)';
    ctx.lineWidth = 1;
    for (let i = 0; i < w; i += 30) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, h); ctx.stroke(); }
    for (let j = 0; j < h; j += 30) { ctx.beginPath(); ctx.moveTo(0, j); ctx.lineTo(w, j); ctx.stroke(); }

    // 定義基礎色彩
    const cDad = '#0099ff';
    const cMom = '#ff3366';
    const cSpindle = 'rgba(234, 179, 8, 0.4)';

    // 依據不同分裂進度進行幾何演算渲染
    switch (currentStage) {
        case 0: // 間期：染色質鬆散狀態
            drawCellOutline(cx, cy, 140);
            drawChromatin(cx - 20, cy - 20, cDad);
            drawChromatin(cx + 20, cy + 20, cMom);
            break;

        case 1: // 減I前期：凝聚、聯會配對、互換
            drawCellOutline(cx, cy, 140);
            // 兩條同源染色體靠攏在一起，形成四分體
            drawChromosomeX(cx - 22, cy, 50, cDad, isCrossoverTriggered ? 'momBottom' : 'none');
            drawChromosomeX(cx + 22, cy, 50, cMom, isCrossoverTriggered ? 'dadBottom' : 'none');
            break;

        case 2: // 減I中後期：紡錘絲牽引，同源染色體分離！
            drawCellOutline(cx, cy, 140);
            // 繪製兩側中心體與紡錘絲
            drawCentrosome(cx - 120, cy);
            drawCentrosome(cx + 120, cy);
            drawSpindleLines(cx - 120, cy, cx - 45, cy, 4);
            drawSpindleLines(cx + 120, cy, cx + 45, cy, 4);

            // 同源染色體被拉向兩側（左Dad, 右Mom）
            drawChromosomeX(cx - 45, cy, 50, cDad, isCrossoverTriggered ? 'momBottom' : 'none');
            drawChromosomeX(cx + 45, cy, 50, cMom, isCrossoverTriggered ? 'dadBottom' : 'none');
            break;

        case 3: // 減I末期：縊縮形成兩個子細胞 (2n->n)
            drawCellOutline(cx - 80, cy, 75);
            drawCellOutline(cx + 80, cy, 75);
            // 此時左細胞只有Dad染色體(帶有互換片段)，右細胞只有Mom
            drawChromosomeX(cx - 80, cy, 45, cDad, isCrossoverTriggered ? 'momBottom' : 'none');
            drawChromosomeX(cx + 80, cy, 45, cMom, isCrossoverTriggered ? 'dadBottom' : 'none');
            break;

        case 4: // 減II中後期：姊妹染色分體分離！
            // 上下分裂或者左右分流。這裡採左右雙細胞，各自進行垂直紡錘絲牽引
            drawCellOutline(cx - 80, cy, 75);
            drawCellOutline(cx + 80, cy, 75);

            // 左細胞紡錘絲(垂直牽引)
            drawCentrosome(cx - 80, cy - 60); drawCentrosome(cx - 80, cy + 60);
            drawSpindleLines(cx - 80, cy - 60, cx - 80, cy - 25, 2);
            drawSpindleLines(cx - 80, cy + 60, cx - 80, cy + 25, 2);

            // 右細胞紡錘絲
            drawCentrosome(cx + 80, cy - 60); drawCentrosome(cx + 80, cy + 60);
            drawSpindleLines(cx + 80, cy - 60, cx + 80, cy - 25, 2);
            drawSpindleLines(cx + 80, cy + 60, cx + 80, cy + 25, 2);

            // 姊妹染色分體被拆開，變成單條染色體型態
            // 左細胞分離
            drawSingleChromatid(cx - 80, cy - 25, 35, true, cDad); // 往上拉
            drawSingleChromatid(cx - 80, cy + 25, 35, false, cDad, isCrossoverTriggered ? cMom : cDad); // 往下拉(帶有互換色)

            // 右細胞分離
            drawSingleChromatid(cx + 80, cy - 25, 35, true, cMom, isCrossoverTriggered ? cDad : cMom); // 往上
            drawSingleChromatid(cx + 80, cy + 25, 35, false, cMom); // 往下
            break;

        case 5: // 減II末期：最終大功告成，產出 4 個單倍體配子細胞 (n, C)
            const rCell = 45;
            drawCellOutline(cx - 100, cy - 60, rCell);
            drawCellOutline(cx - 100, cy + 60, rCell);
            drawCellOutline(cx + 100, cy - 60, rCell);
            drawCellOutline(cx + 100, cy + 60, rCell);

            // 四個精子/卵細胞內各自包含獨一無二的單條染色單體組合
            drawSingleChromatid(cx - 100, cy - 65, 30, true, cDad);
            drawSingleChromatid(cx - 100, cy + 55, 30, false, cDad, isCrossoverTriggered ? cMom : cDad);

            drawSingleChromatid(cx + 100, cy - 65, 30, true, cMom, isCrossoverTriggered ? cDad : cMom);
            drawSingleChromatid(cx + 100, cy + 55, 30, false, cMom);
            break;
    }
}

// 繪製高質感細胞邊界
function drawCellOutline(x, y, r) {
    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.lineWidth = 3;
    ctx.fillStyle = 'rgba(255,255,255,0.02)';
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill(); ctx.stroke();
}

// 模擬間期的染色質微觀鬆散絲線
function drawChromatin(x, y, color) {
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x, y);
    for (let i = 0; i < 30; i++) {
        ctx.lineTo(x + Math.sin(i) * 15 + i * 0.5, y + Math.cos(i) * 15);
    }
    ctx.stroke();
}

// 精準繪製 X 形雙分體染色體 (包含互換突變區塊控制)
function drawChromosomeX(x, y, height, coreColor, crossoverType) {
    ctx.lineCap = 'round';
    ctx.lineWidth = 9;

    const armLen = height * 0.45;
    const cOxy = '#ff3366';
    const cDeoxy = '#0099ff';

    // 繪製左上與右上臂
    ctx.strokeStyle = coreColor;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - armLen * 0.6, y - armLen); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + armLen * 0.6, y - armLen); ctx.stroke();

    // 繪製左下臂
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - armLen * 0.6, y + armLen); ctx.stroke();

    // 繪製右下臂（最容易發生聯會互換的幾何熱區位置）
    ctx.beginPath();
    ctx.moveTo(x, y);
    if (crossoverType === 'momBottom') {
        // 本身是藍色，但下半截變紅色
        ctx.lineTo(x + armLen * 0.3, y + armLen * 0.5); ctx.stroke();
        ctx.strokeStyle = cOxy;
        ctx.beginPath(); ctx.moveTo(x + armLen * 0.3, y + armLen * 0.5); ctx.lineTo(x + armLen * 0.6, y + armLen); ctx.stroke();
    } else if (crossoverType === 'dadBottom') {
        // 本身是紅色，下半截變藍色
        ctx.lineTo(x - armLen * 0.3, y + armLen * 0.5); ctx.stroke();
        ctx.strokeStyle = cDeoxy;
        ctx.beginPath(); ctx.moveTo(x - armLen * 0.3, y + armLen * 0.5); ctx.lineTo(x - armLen * 0.6, y + armLen); ctx.stroke();
    } else {
        ctx.lineTo(x + armLen * 0.6, y + armLen); ctx.stroke();
    }

    // 繪製中央著絲點（Centromere）
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(x, y, 5, 0, Math.PI * 2); ctx.fill();
}

// 繪製分離後的單條染色分體
function drawSingleChromatid(x, y, height, isUpward, baseColor, tipColor) {
    ctx.lineCap = 'round';
    ctx.lineWidth = 8;
    const endY = isUpward ? y - height : y + height;
    const midY = (y + endY) / 2;

    ctx.strokeStyle = baseColor;
    ctx.beginPath();
    ctx.moveTo(x, y);
    if (tipColor && tipColor !== baseColor) {
        ctx.lineTo(x, midY); ctx.stroke();
        ctx.strokeStyle = tipColor;
        ctx.beginPath(); ctx.moveTo(x, midY); ctx.lineTo(x, endY); ctx.stroke();
    } else {
        ctx.lineTo(x, endY); ctx.stroke();
    }

    // 著絲點
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(x, y, 4, 0, Math.PI * 2); ctx.fill();
}

// 繪製中心體
function drawCentrosome(x, y) {
    ctx.fillStyle = '#eab308';
    ctx.beginPath(); ctx.arc(x, y, 6, 0, Math.PI * 2); ctx.fill();
}

// 繪製放射狀流暢紡錘絲
function drawSpindleLines(px, py, tx, ty, numLines) {
    ctx.strokeStyle = 'rgba(234, 179, 8, 0.35)';
    ctx.lineWidth = 1.5;
    for (let i = 0; i < numLines; i++) {
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(tx, ty - (numLines * 3) + (i * 7));
        ctx.stroke();
    }
}

// 配合滑桿更新介面說明、標籤相對定位與細胞套數
function updateStageInterface() {
    let title = "";
    let desc = "";
    let ploidy = "";

    const lblHomo = document.getElementById('lbl-homo');
    const lblSpindle = document.getElementById('lbl-spindle');
    const lblChiasma = document.getElementById('lbl-chiasma');

    // 重置所有標籤位置與顯示狀態
    lblHomo.style.display = 'block';
    lblSpindle.style.display = 'block';
    lblChiasma.classList.add('hidden');

    switch (currentStage) {
        case 0:
            title = "階段 0：間期（DNA 複製期）";
            desc = "細胞準備進行分裂。此時DNA進行複製，染色質呈細絲狀散佈在細胞核內，肉眼尚無法看見獨立的染色體棒狀結構。";
            ploidy = "染色體套數：2n = 2 | DNA 含量：2C → 4C";
            lblHomo.style.display = 'none';
            lblSpindle.style.display = 'none';
            break;
        case 1:
            title = "階段 1：減數分裂 I 前期（聯會與互換）";
            desc = "同源染色體相互靠攏配對，這個神聖的生理動作稱為<strong>「聯會」</strong>。此時非姊妹染色分體會發生交叉，並可點擊上方按鈕觸發<strong>基因互換</strong>！";
            ploidy = "染色體套數：2n = 2 | DNA 含量：4C（已複製）";
            lblChiasma.classList.remove('hidden');
            // 動態鎖定標籤至 Canvas 相對四分體中央座標
            lblHomo.style.top = "42%"; lblHomo.style.left = "12%";
            break;
        case 2:
            title = "階段 2：減數分裂 I 中後期（同源染色體分離）";
            desc = "由紡錘絲強烈牽引，<strong>同源染色體正式宣告分離</strong>，分別移向細胞的兩極。請密切注意：此時『姊妹染色分體』依然緊密黏合在一起，尚未拆開！";
            ploidy = "染色體套數：2n = 2 | DNA 含量：4C";
            lblHomo.style.top = "30%"; lblHomo.style.left = "28%";
            lblSpindle.style.top = "20%"; lblSpindle.style.right = "24%";
            break;
        case 3:
            title = "階段 3：減數分裂 I 末期（首度減半）";
            desc = "細胞質發生縊縮，分裂成兩個子細胞。這是整個減數分裂最關鍵的時刻——<strong>染色體套數在此刻正式由 2n 減半為 n</strong>！";
            ploidy = "染色體套數：n = 1 (個別細胞) | DNA 含量：2C";
            lblHomo.style.display = 'none';
            lblSpindle.style.display = 'none';
            break;
        case 4:
            title = "階段 4：減數分裂 II 中後期（姊妹分體分離）";
            desc = "兩個子細胞同步展開第二次分裂。此時沒有同源染色體，紡錘絲直接牢牢扣住著絲點，將<strong>姊妹染色分體一分為二</strong>拆開！";
            ploidy = "染色體套數：n = 1 → 暫時變為 2n → n | DNA 含量：2C";
            lblSpindle.style.top = "18%"; lblSpindle.style.right = "44%";
            lblHomo.style.display = 'none';
            break;
        case 5:
            title = "階段 5：減數分裂 II 末期（四個單倍體配子）";
            desc = "大功告成！最終縊縮產出<strong>四個配子細胞（如精子或卵細胞）</strong>。每個細胞僅包含一條單線染色體，基因組合因互換而各自不相同！";
            ploidy = "染色體套數：n = 1 | DNA 含量：C（完成黃金減半）";
            lblHomo.style.display = 'none';
            lblSpindle.style.display = 'none';
            break;
    }

    document.getElementById('stage-text').textContent = title.split('：')[1];
    document.getElementById('status-title').textContent = title;
    document.getElementById('status-desc').innerHTML = desc;
    document.getElementById('ploidy-display').textContent = ploidy;
}

// --- 事件監聽器設定 ---
document.getElementById('slider-stage').addEventListener('input', (e) => {
    currentStage = parseInt(e.target.value);
    updateStageInterface();
    drawScene();
});

document.getElementById('btn-crossover').addEventListener('click', (e) => {
    if (currentStage !== 1) {
        alert("💡 提示：請先將進度滑桿切換到『階段 1：聯會與互換』，才能親眼觀測到互換的分子奇蹟喔！");
        return;
    }
    isCrossoverTriggered = !isCrossoverTriggered;
    e.target.classList.toggle('active', isCrossoverTriggered);
    e.target.textContent = isCrossoverTriggered ? "✨ 基因已互換完成！" : "💥 觸發基因互換";
    drawScene();
});

window.addEventListener('resize', () => { resizeCanvas(); drawScene(); });


// --- 核心 4: 高中生物 10 題減數分裂結構化高難度題庫 ---
const quizData = [
    {
        q: "1. 某生物細胞內具有 2n=40 條染色體，在進行減數分裂第一期（減I）中期時，細胞內可觀察到多少個「四分體」與多少條「染色單體」？",
        opts: ["(A) 20個四分體，40條染色單體", "(B) 20個四分體，80條染色單體", "(C) 40個四分體，80條染色單體", "(D) 10個四分體，40條染色單體"],
        a: "B",
        r: "正確！同源染色體兩兩配對形成聯會。四分體個數 = 同源染色體對數 = 40/2 = 20 個；每對四分體內含 4 條染色單體，故共有 20 × 4 = 80 條染色單體。"
    },
    {
        q: "2. 高中生物核心考點：減數分裂中，染色體套數由「2n 減半為 n」與 DNA 含量由「2C 減半為 C」，分別發生在什麼時期？",
        opts: ["(A) 皆發生在減數分裂第一次分裂結束時", "(B) 皆發生在減數分裂第二次分裂結束時", "(C) 套數減半在減I結束，DNA含量最終減半在減II結束", "(D) 套數減半在減II結束，DNA含量減半在減I結束"],
        a: "C",
        r: "正確！染色體套數是在減I末期因為「同源染色體分離」而由 2n→n；而DNA含量在複製後為4C，減I結束分到兩細胞變2C，減II結束「姊妹分體分離」後才徹底減半為 C。"
    },
    {
        q: "3. 在剛才的 Canvas 模擬中，如果我們點擊「觸發基因互換」，請問在真實細胞內，互換主要發生在減數分裂的哪一個子階段？",
        opts: ["(A) 間期，當DNA正在瘋狂複製時", "(B) 第一次分裂前期，同源染色體聯會時", "(C) 第一次分裂後期，同源染色體分離時", "(D) 第二次分裂後期，姊妹分體分離時"],
        a: "B",
        r: "正確！基因互換（Crossing over）的前提是同源染色體必須緊密貼合（聯會），這專屬於「第一次分裂前期（減I前期）」。"
    },
    {
        q: "4. 下列關於「同源染色體」與「姊妹染色分體」的分離順序，何者在生物學的描述完全正確？",
        opts: ["(A) 減I後期姊妹分體分離，減II後期同源染色體分離", "(B) 減I後期同源染色體分離，減II後期姊妹分體分離", "(C) 減I與減II後期皆為同源染色體分離", "(D) 減I與減II後期皆為姊妹分體分離"],
        a: "B",
        r: "正確！口訣必背：『減I分同源，減II分姊妹』。這是所有遺傳學與細胞分裂考題的根基。"
    },
    {
        q: "5. 若某一個正在進行分裂的動物細胞內「沒有同源染色體」，且「著絲點剛好排列在細胞中央的赤道面上」，請推斷此細胞正處於哪一個時期？",
        opts: ["(A) 有絲分裂中期", "(B) 減數分裂第一次分裂中期", "(C) 減數分裂第二次分裂中期", "(D) 減數分裂第二次分裂後期"],
        a: "C",
        r: "正確！沒有同源染色體代表已經完成了減I，進入了單倍體（n）階段；著絲點整齊排在中央赤道面，則完全符合「中期」的特徵，故為減II中期。"
    },
    {
        q: "6. 高中經典圖表題：若將細胞內的 DNA 含量變化繪製成折線圖，減數分裂的圖表波形會呈現何種走勢？",
        opts: ["(A) 2C → 4C → 2C → C", "(B) 2C → 4C → 8C → 4C", "(C) 2C → 2C → C → 0.5C", "(D) 2C → 4C → 4C → 2C"],
        a: "A",
        r: "正確！間期複製（2C→4C），減I結束同源分離細胞一分為二（4C→2C），減II結束姊妹分離再度一分為二（2C→C），完成完美的兩次減半。"
    },
    {
        q: "7. 設某植物的 A 基因與 B 基因位於同一條同源染色體上（完全連鎖）。若在減數分裂過程中「完全沒有發生任何互換」，則一個基因型為 AaBb 的大母細胞最終產生的四個配子中，共有幾種基因組合？",
        opts: ["(A) 1種", "(B) 2種", "(C) 3種", "(D) 4種"],
        a: "B",
        r: "正確！在沒有互換的完全連鎖狀況下，同一條染色體上的基因會共同進退。因此四個配子中，左側兩個會完全相同，右側兩個也完全相同，最終只會有 2 種基因配子組合。"
    },
    {
        q: "8. 承上題，若該細胞在聯會時發生了互換，使得非姊妹染色分體交換片段，則這一個大母細胞最終可以產生幾種基因組合的配子？",
        opts: ["(A) 2種", "(B) 4種", "(C) 8種", "(D) 16種"],
        a: "B",
        r: "正確！一旦在四分體時期發生互換，4 條染色單體的基因序列將會各自變得不同（一條母本原生、一條母本互換、一條父本互換、一條父本原生），因此會產生 4 種不同的配子組合！"
    },
    {
        q: "9. 某位科學家觀測精巢切片，發現某細胞內染色體有 20 條，且著絲點正在分裂，姊妹染色分體分離並向兩極移動。已知該動物體細胞染色體數為 2n=20。請問此細胞處於什麼時期？",
        opts: ["(A) 有絲分裂後期", "(B) 減數分裂第一分裂後期", "(C) 減數分裂第二分裂後期", "(D) 間期"],
        a: "C",
        r: "正確！體細胞 2n=20。如果是減II後期，因為姊妹分體剛被拆開、暫時各自獨立為一條染色體，此時細胞內的總數會翻倍變成 20 條（原本減I結束時是 10 條），符合題意，故為減II後期。"
    },
    {
        q: "10. 下列哪一種生理機制或現象，『不屬於』減數分裂與有性生殖能夠為後代創造龐大遺傳多樣性的主要原因？",
        opts: ["(A) 減I前期非姊妹染色分體發生非隨機的精準基因互換", "(B) 減I後期同源染色體自由組合分離至兩極", "(C) 受精作用時精子與卵細胞的隨機結合", "(D) 間期複製時 DNA 聚合酶進行完全百分之百複製而不產生變異"],
        a: "D",
        r: "正確！(D) 選項描述的是高度保真的精準複製，它本身是為了維持遺傳穩定性，而非創造『遺傳多樣性』。其餘三者皆是生物演化的多樣性推手。"
    }
];

let currentQuizIndex = 0;

function initQuiz() {
    const container = document.getElementById('quiz-container');
    if (currentQuizIndex >= quizData.length) {
        container.innerHTML = "<div class='quiz-question' style='color:#00ffcc; text-align:center;'>🎉 太厲害了！你已成功攻克高中生物減數分裂大魔王全套題庫！</div>";
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
updateStageInterface();
window.addEventListener('DOMContentLoaded', initQuiz);
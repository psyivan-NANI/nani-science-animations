const canvas = document.getElementById('microCanvas');
const ctx = canvas.getContext('2d');

// 電池核心狀態
let isSwitchedOn = false; // 是否開啟開關
let isBridgePresent = true; // 鹽橋是否存在

// 微觀微粒陣列
let zincAtoms = [];    // 負極板上的鋅原子
let zincIons = [];     // 溶液中的鋅離子
let copperIons = [];   // 溶液中的銅離子
let copperAtoms = [];  // 正極板析出的銅原子
let electrons = [];    // 高空與電極中的移動電子
let bridgeAnions = []; // 鹽橋流向負極的硝酸根離子
let bridgeCations = [];// 鹽橋流向正極的鉀離子

function resizeCanvas() {
    const rect = canvas.parentElement.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
}

// 初始化微觀微粒
function initMicroParticles() {
    const w = canvas.width / window.devicePixelRatio;
    const h = canvas.height / window.devicePixelRatio;
    const midX = w / 2;

    zincAtoms = []; zincIons = []; copperIons = []; copperAtoms = []; electrons = [];
    bridgeAnions = []; bridgeCations = [];

    // 1. 左側：鋅極板表面原子群 (X 軸 35-50)
    for (let y = 20; y < h - 20; y += 18) {
        zincAtoms.push({ x: 45, originalX: 45, y: y, type: 'Zn' });
        zincAtoms.push({ x: 30, originalX: 30, y: y + 8, type: 'Zn' });
    }

    // 2. 左側：初始溶液中的鋅離子
    for (let i = 0; i < 8; i++) {
        zincIons.push({
            x: 60 + Math.random() * (midX - 90),
            y: 30 + Math.random() * (h - 60),
            vx: (Math.random() - 0.5) * 0.5,
            vy: (Math.random() - 0.5) * 0.5
        });
    }

    // 3. 右側：鋅極板表面原子群 (X 軸 w-50 到 w-35)
    for (let y = 20; y < h - 20; y += 18) {
        copperAtoms.push({ x: w - 45, y: y, type: 'Cu' });
    }

    // 4. 右側：溶液中的藍色銅離子
    for (let i = 0; i < 12; i++) {
        copperIons.push({
            x: midX + 30 + Math.random() * (w - midX - 80),
            y: 30 + Math.random() * (h - 60),
            vx: (Math.random() - 0.5) * 0.6,
            vy: (Math.random() - 0.5) * 0.6,
            isTargeting: false,
            targetY: 0
        });
    }
}

// 核心微觀物理與反應引擎
function drawScene() {
    const w = canvas.width / window.devicePixelRatio;
    const h = canvas.height / window.devicePixelRatio;
    const midX = w / 2;

    // 建立半透明覆蓋，賦予流體微粒漂亮的動態微殘影
    ctx.fillStyle = 'rgba(11, 19, 41, 0.25)';
    ctx.fillRect(0, 0, w, h);

    // 繪製微觀左右邊界中線分隔
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);
    ctx.beginPath(); ctx.moveTo(midX, 0); ctx.lineTo(midX, h); ctx.stroke();
    ctx.setLineDash([]);

    // 檢查通路狀態：必須開關開啟且有鹽橋
    const isFlowing = isSwitchedOn && isBridgePresent;

    // --- 【左側：負極氧化反應運算】 ---
    // 繪製鋅極板基底
    ctx.fillStyle = '#475569';
    ctx.fillRect(0, 0, 40, h);

    // 處理鋅原子解離
    zincAtoms.forEach((atom, index) => {
        ctx.fillStyle = '#94a3b8';
        ctx.beginPath(); ctx.arc(atom.x, atom.y, 7, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#0f172a'; ctx.fontSize = '9px'; ctx.fillText('Zn', atom.x - 6, atom.y + 3);

        // 如果處於接通狀態，且有機率發生氧化反應解離
        if (isFlowing && Math.random() < 0.003 && zincAtoms.length > 5) {
            // 釋放兩個電子進入極板內部向上走
            electrons.push({ x: atom.x, y: atom.y, dest: 'wire-left', speedY: 1.5 });
            electrons.push({ x: atom.x - 5, y: atom.y + 4, dest: 'wire-left', speedY: 1.5 });

            // 原子轉化為離子衝入溶液
            zincIons.push({
                x: atom.x + 15,
                y: atom.y,
                vx: 0.5 + Math.random() * 0.5,
                vy: (Math.random() - 0.5) * 0.5
            });
            // 從極板原子列中移除
            zincAtoms.splice(index, 1);
        }
    });

    // 鋅離子運動與渲染
    zincIons.forEach(ion => {
        if (isFlowing) {
            ion.x += ion.vx; ion.y += ion.vy;
            // 碰撞邊界彈回
            if (ion.x < 45 || ion.x > midX - 10) ion.vx *= -1;
            if (ion.y < 10 || ion.y > h - 10) ion.vy *= -1;
        }
        ctx.fillStyle = '#38bdf8';
        ctx.beginPath(); ctx.arc(ion.x, ion.y, 6, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#000'; ctx.font = 'bold 8px sans-serif'; ctx.fillText('Zn²', ion.x - 6, ion.y + 3);
    });


    // --- 【右側：正極還原反應運算】 ---
    // 繪製銅極板基底
    ctx.fillStyle = '#7c2d12';
    ctx.fillRect(w - 40, 0, 40, h);

    // 繪製現有銅原子
    copperAtoms.forEach(atom => {
        ctx.fillStyle = '#ea580c';
        ctx.beginPath(); ctx.arc(atom.x, atom.y, 7, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#fff'; ctx.font = '8px sans-serif'; ctx.fillText('Cu', atom.x - 6, atom.y + 3);
    });

    // 銅離子運動與還原捕捉
    copperIons.forEach((ion, index) => {
        if (isFlowing) {
            // 如果電子流到位，銅離子開始向左側電極表面靠攏
            if (!ion.isTargeting && Math.random() < 0.02) {
                ion.isTargeting = true;
                ion.targetY = 15 + Math.random() * (h - 30);
            }

            if (ion.isTargeting) {
                ion.x += (w - 52 - ion.x) * 0.03;
                ion.y += (ion.targetY - ion.y) * 0.03;

                // 抵達極板表面，捕捉到電子，析出還原為銅原子
                if (ion.x >= w - 55) {
                    copperAtoms.push({ x: w - 48 - (Math.random() * 4), y: ion.y });
                    copperIons.splice(index, 1);
                    // 隨機在中央補充新的銅離子，象徵溶液深處流過來
                    if (copperIons.length < 15) {
                        copperIons.push({
                            x: midX + 20 + Math.random() * 40, y: 20 + Math.random() * (h - 40),
                            vx: (Math.random() - 0.5) * 0.6, vy: (Math.random() - 0.5) * 0.6,
                            isTargeting: false, targetY: 0
                        });
                    }
                    return;
                }
            } else {
                ion.x += ion.vx; ion.y += ion.vy;
                if (ion.x < midX + 10 || ion.x > w - 48) ion.vx *= -1;
                if (ion.y < 10 || ion.y > h - 10) ion.vy *= -1;
            }
        }

        // 渲染亮藍色高彩度銅離子
        ctx.fillStyle = '#0284c7';
        ctx.shadowColor = '#00ffff'; ctx.shadowBlur = isFlowing ? 4 : 0;
        ctx.beginPath(); ctx.arc(ion.x, ion.y, 6, 0, Math.PI * 2); ctx.fill();
        ctx.shadowBlur = 0; // 重置光暈
        ctx.fillStyle = '#fff'; ctx.font = 'bold 8px sans-serif'; ctx.fillText('Cu²', ion.x - 6, ion.y + 3);
    });


    // --- 【高空電子流與導線粒子動力學】 ---
    electrons.forEach((e, index) => {
        if (isFlowing) {
            if (e.dest === 'wire-left') {
                e.y -= e.speedY; // 負極板內向上走
                if (e.y <= 15) { e.dest = 'wire-top'; }
            } else if (e.dest === 'wire-top') {
                e.x += 2; // 跨越導線流向右側
                if (e.x >= w - 45) { e.dest = 'wire-right'; }
            } else if (e.dest === 'wire-right') {
                e.y += 1.8; // 正極板內向下走供銅離子捕捉
                if (e.y >= h) { electrons.splice(index, 1); return; }
            }
        }
        ctx.fillStyle = '#eab308';
        ctx.beginPath(); ctx.arc(e.x, e.y, 3, 0, Math.PI * 2); ctx.fill();
    });

    // 定期在接通時自動在左側補充導線流動電子視覺效果
    if (isFlowing && Math.random() < 0.08) {
        electrons.push({ x: 45, y: h - 10, dest: 'wire-left', speedY: 1 + Math.random() });
    }


    // --- 【鹽橋內部離子平衡對流】 ---
    if (isBridgePresent && isFlowing) {
        // 模擬陰離子 (NO₃⁻) 移向負極 (左側)
        if (Math.random() < 0.04) bridgeAnions.push({ x: midX + 20, y: 15, vx: -0.8 });
        // 模擬陽離子 (K⁺) 移向正極 (右側)
        if (Math.random() < 0.04) bridgeCations.push({ x: midX - 20, y: 15, vx: 0.8 });
    }

    // 渲染鹽橋硝酸根
    bridgeAnions.forEach((ani, idx) => {
        if (isFlowing) ani.x += ani.vx;
        ctx.fillStyle = '#f43f5e';
        ctx.font = 'bold 8px sans-serif';
        ctx.fillText('NO₃⁻', ani.x, ani.y);
        if (ani.x < 55) bridgeAnions.splice(idx, 1);
    });

    // 渲染鹽橋鉀離子
    bridgeCations.forEach((cat, idx) => {
        if (isFlowing) cat.x += cat.vx;
        ctx.fillStyle = '#10b981';
        ctx.font = 'bold 8px sans-serif';
        ctx.fillText('K⁺', cat.x, cat.y);
        if (cat.x > w - 55) bridgeCations.splice(idx, 1);
    });

    requestAnimationFrame(drawScene);
}

// 核心狀態調度與 UI 更新
function updateInterface() {
    const pointer = document.getElementById('meter-pointer');
    const lblEFlow = document.getElementById('lbl-e-flow');
    const domBridge = document.getElementById('dom-bridge');
    const titleEl = document.getElementById('model-title');
    const descEl = document.getElementById('model-desc');

    // 鹽橋 DOM 視覺變色切換
    if (!isBridgePresent) {
        domBridge.style.borderColor = 'rgba(239, 68, 68, 0.15)';
    } else {
        domBridge.style.borderColor = 'rgba(226, 232, 240, 0.8)';
    }

    // 判定最終完整通路
    if (isSwitchedOn && isBridgePresent) {
        pointer.style.transform = 'rotate(28deg)'; // 檢流計偏向正極(右偏)
        lblEFlow.style.opacity = '1';
        titleEl.textContent = "當前狀態：放電中 (全通路閉路)";
        descEl.innerHTML = "外導線有<strong>電子由左(鋅)吹向右(銅)</strong>；內部鹽橋則發生離子定向移動，硝酸根向左維持電中性，指針右偏放電中。";
    } else {
        pointer.style.transform = 'rotate(0deg)'; // 指針歸零
        lblEFlow.style.opacity = '0';
        if (!isBridgePresent) {
            titleEl.textContent = "當前狀態：斷路 (鹽橋已被拔除)";
            descEl.innerHTML = "鹽橋一旦拔除，溶液內部無法靠離子對流維持兩極的<strong>電中性</strong>，外導線電子流瞬間卡死，電流歸零。";
        } else {
            titleEl.textContent = "當前狀態：斷路 (開關未開啟)";
            descEl.innerHTML = "雖然鹽橋完好，但外導線開關尚未接通，化學能無法轉化為電能輸出。請點擊上方開啟開關。";
        }
    }
}

// 事件綁定
document.getElementById('btn-toggle-switch').addEventListener('click', (e) => {
    isSwitchedOn = !isSwitchedOn;
    e.target.classList.toggle('active', isSwitchedOn);
    e.target.innerText = isSwitchedOn ? "關閉開關 (外導線斷開)" : "開啟開關 (導線接通)";
    updateInterface();
});

document.getElementById('btn-toggle-bridge').addEventListener('click', (e) => {
    isBridgePresent = !isBridgePresent;
    // 拔除鹽橋按鈕 active 代表「有鹽橋」
    e.target.classList.toggle('active', isBridgePresent);
    e.target.innerText = isBridgePresent ? "拔除鹽橋" : "置入鹽橋";
    updateInterface();
});

window.addEventListener('resize', () => { resizeCanvas(); });

// 啟動生產線
resizeCanvas();
initMicroParticles();
drawScene();
updateInterface();


// --- 核心 4: 高中化學鋅銅電池 10 道核心結構化測驗題庫 ---
const quizData = [
    {
        q: "1. 在標準鋅銅電池中，關於負極（Zn）極板表面所發生的微觀化學反應與巨觀變化，下列敘述何者完全正確？",
        opts: ["(A) 鋅離子得到電子還原成鋅原子，極板質量增加", "(B) 鋅原子失去電子氧化成鋅離子，極板質量減輕", "(C) 鉀離子在此處得到電子析出", "(D) 發生還原反應，溶液顏色逐漸變藍"],
        a: "B",
        r: "正確！負極（陽極）由活性大的金屬鋅組成。微觀上，鋅原子會失去電子發生氧化反應（Zn → Zn²⁺ + 2e⁻）並衝入溶液中，因此宏觀上極板質量會逐漸減輕。"
    },
    {
        q: "2. 當鋅銅電池正常接通放電一段時間後，關於右側燒杯（銅半電池）內溶液顏色的起伏變化，下列分析何者正確？",
        opts: ["(A) 因為銅片溶解，深藍色變深", "(B) 因為 Zn²⁺ 離子流入，溶液轉變為無色", "(C) 因為藍色的 Cu²⁺ 離子不斷在極板得到電子還原析出，溶液藍色逐漸變淡", "(D) 顏色完全不變"],
        a: "C",
        r: "正確！正極溶液中的水合銅離子（Cu²⁺）呈現美麗的藍色。放電時，它們會趨向銅極板表面捕捉電子並還原成金屬銅析出，隨著濃度 [Cu²⁺] 逐漸下降，溶液的藍色會由深變淡。"
    },
    {
        q: "3. 關於鋅銅電池裝置中「鹽橋（以盛裝 KNO₃ 為例）」的核心科學功能與離子流向，下列哪一項敘述是正確的？",
        opts: ["(A) 導引電子由鹽橋內部直接穿過兩燒杯", "(B) 陰離子（NO₃⁻）移向正極，陽離子（K⁺）移向負極", "(C) 陰離子（NO₃⁻）移向負極以平衡增加的 Zn²⁺，陽離子（K⁺）移向正極以補充減少的 Cu²⁺", "(D) 鹽橋只作裝飾，拔除後依然能有穩定大電流"],
        a: "C",
        r: "正確！鹽橋的核心功能是維持電中性與串聯內電路。負極因產生 Zn²⁺ 導致正電荷過剩，故吸引硝酸根（NO₃⁻）移向負極；正極因 Cu²⁺ 減少導致正電荷不足，故吸引鉀離子（K⁺）移向正極。"
    },
    {
        q: "4. 將鋅銅電池中的鹽橋從兩燒杯中驟然拔除的瞬間，實驗裝置上的檢流計指針與微觀電子流會發生什麼變化？",
        opts: ["(A) 指針偏轉角度不變，電子流維持不變", "(B) 電流瞬間斷路歸零，指針返回正中央，微觀電子流與化學反應卡死停滯", "(C) 指針發生反向劇烈偏轉", "(D) 電流強度突然放大兩倍"],
        a: "B",
        r: "正確！拔除鹽橋後，兩燒杯溶液將無法藉由離子移動來維持電中性，瞬間產生強大的靜電阻礙，使得化學反應與電子流動立刻卡死停滯，指針立刻歸零斷路。"
    },
    {
        q: "5. 在外導線上，關於鋅銅電池的「電子流向」與檢流計「指針偏轉方向」的科學原則描述，何者正確？",
        opts: ["(A) 電子由銅極流向鋅極；檢流計指針偏向鋅極", "(B) 電子由鋅極流向銅極；常規檢流計指針會偏向電子流到的方向（即正極/銅極）", "(C) 電子與傳統電流的流向完全相同", "(D) 電子流由鹽橋內部跨越對流"],
        a: "B",
        r: "正確！活性大的鋅釋出電子，故電子流在外導線上是由負極（鋅）流向正極（銅）。高中實驗室常用的檢流計（G），其指針偏轉方向即為電流流入方向（亦即電子流出、流到的正極方向，指針右偏）。"
    },
    {
        q: "6. 若要計算該標準鋅銅電池的標準電動勢（已知標準還原電位：Cu²⁺/Cu 為 +0.34V，Zn²⁺/Zn 為 -0.76V），標準狀態下的理論電壓應為何？",
        opts: ["(A) 0.42 V", "(B) -0.42 V", "(C) 1.10 V", "(D) 1.50 V"],
        a: "C",
        r: "正確！電池理論電壓 E° = 正極還原電位 - 負極還原電位 = 0.34V - (-0.76V) = 1.10 V。"
    },
    {
        q: "7. 下列哪一種處置，可以使一盞已經快要沒電的鋅銅電池「瞬間提升其輸出電壓與放電功率」？",
        opts: ["(A) 大幅調高左側燒杯的 [Zn²⁺] 離子濃度", "(B) 大幅調高右側燒杯的 [Cu²⁺] 離子濃度", "(C) 將鹽橋換成純水膠凍", "(D) 換成更細更長的導線"],
        a: "B",
        r: "正確！依據勒沙特列原理或能斯特方程式，提高反應物濃度（正極的 Cu²⁺）或降低產物濃度（負極的 Zn²⁺），皆能驅進化學反應向右移動，從而提高電池的輸出電壓。"
    },
    {
        q: "8. 鋅銅電池運作時，化學能會轉化為什麼能量形式？兩燒杯的總質量或溶液變化規律為何？",
        opts: ["(A) 光能；溶液總質量不變", "(B) 電能；負極板減輕的質量必定『不等於』正極板增加的質量", "(C) 核能；兩極板質量等量增減", "(D) 熱能；兩杯中離子總數永遠完全相等"],
        a: "B",
        r: "正確！原電池是將化學能轉化為電能。由於鋅的原子量（65.4）大於銅的原子量（63.5），根據 1:1 的莫耳數反應（每溶出1莫耳鋅即析出1莫耳銅），負極減輕的質量會大於正極增加的質量。"
    },
    {
        q: "9. 如果將左側負極板換成活性更強的金屬「鎂（Mg）」，其餘條件不變，則重新組裝後的電池與原鋅銅電池相比，會發生什麼變化？",
        opts: ["(A) 電壓完全降為零", "(B) 理論電壓會顯著上升，因為鎂與銅的活性電位差更大", "(C) 電子流向發生反轉，改由銅流向鎂", "(D) 鹽橋內的硝酸根改流向正極"],
        a: "B",
        r: "正確！鎂的活性比鋅更強（標準還原電位更負，約-2.37V）。當與銅搭配時，兩極的氧化還原電位差值大幅拉開，因此理論輸出電壓會大幅飆升。"
    },
    {
        q: "10. 為什麼鹽橋內部不適合盛裝含有氯化鋇（BaCl₂）或硝酸銀（AgNO₃）的飽和溶液？",
        opts: ["(A) 因為它們的價格太便宜", "(B) 因為這兩者與燒杯中的硫酸鋅（ZnSO₄）或硫酸銅（CuSO₄）接觸時會產生沉澱，堵塞鹽橋微孔導致導電失效", "(C) 因為這兩種溶液不具備任何陽離子", "(D) 因為它們會直接讓極板燃燒"],
        a: "B",
        r: "正確！鹽橋內的電解質必須是『不與兩端溶液離子發生沉澱反應』的強電解質（如 KNO₃）。若用 BaCl₂，會與溶液中的 SO₄²⁻ 結合成難溶的 BaSO₄ 沉澱，直接把鹽橋的玻璃砂芯微孔完全堵死，導致電池快速斷路。"
    }
];

let currentQuizIndex = 0;

function initQuiz() {
    const container = document.getElementById('quiz-container');
    if (!container) return;

    if (currentQuizIndex >= quizData.length) {
        container.innerHTML = "<div class='quiz-question' style='color:#00ffcc; text-align:center;'>🎉 恭喜你！鋅銅電池電化學 10 題核心考點大會戰，已全數完美通關！</div>";
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
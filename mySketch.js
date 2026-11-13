let fft, song;
let downloadButton;
let accumulatedScore = 0; // 累計分數
let lifePoints;           // 生命值，將由輸入序號決定
let inputButton;          // 錄音按鈕
let currentScore = 0;     // 當次分數
let timer;                // 計時器變數
let recordingGif;
let finalDisplay = false;  // 用於標記最終定格狀態
let previousAccumulatedScore = 0;
let cam = null;  // 用來儲存相機捕捉物件
let infoModal, infoIcon;
let cnv;
let webCenter;
let numSpokes = 12;
let numRings = 5;
let ringRadius = [];
let spokeAngles = [];
let playerLevel = 1;
let playerLabel = "小蜘蛛";  // 对应等级 1 的文字说明
let spiderX, spiderY, spiderSpeed;
let spiderActive = false;
let showSpiderLabel = false;
let lowE = 0, highE = 0;
const VALID_SERIALS = [ "5555", "0001", "1990","1954"];  // 在这里添加、移除你想要的任意序号


// 麥克風、錄音器與錄音檔變數
let mic, recorder, recordedSound;
let recordingTimeout;
let isRecording = false;
let recordingSession = 0;
let finalWebImage = null;
let webBuffer;
let songEnded = false;    // 標記音檔是否播放完成

// 遊戲狀態變數
let gameOver = false;
let gameStarted = false;
let downloadReady = false;

// 啟動頁面的 UI 元件
let codeInput, submitButton;
let startBg;              // 啟動畫面的背景圖片

// 載入背景圖片（請將 URL 換成你自己的圖片路徑）
function preload() {
  startBg = loadImage('https://i.imgur.com/FddDYzu.jpeg'); // 這裡使用範例圖片
}

function setup() {
	cnv = createCanvas(windowWidth, windowHeight);
  fft = new p5.FFT(0.8, 512);
	webBuffer = createGraphics(windowWidth, windowHeight);
  
  // 建立啟動頁面的輸入框與提交按鈕
  codeInput = createInput();
  codeInput.position(windowWidth/2 - 50, windowHeight - 120);
  codeInput.size(100);
  
  submitButton = createButton("GAME START");
  submitButton.position(windowWidth/2 - 50, windowHeight - 90);
  submitButton.mousePressed(checkCode);
  
  // 建立錄音按鈕，但先隱藏（待遊戲啟動後再顯示）
  inputButton = createButton("Catch Sound");
  inputButton.position(windowWidth * 0.35, windowHeight * 0.9);
  inputButton.style('font-size', '16px');
  inputButton.style('padding', '5px');
  inputButton.mousePressed(startRecording);
  inputButton.hide();
// 建立下載 Icon
downloadButton = createButton("⬇️");
downloadButton.position(windowWidth * 0.68, windowHeight * 0.9);
downloadButton.style('font-size', '24px');
downloadButton.style('background', 'transparent');
downloadButton.style('border', 'none');
downloadButton.style('padding', '0');
downloadButton.style('margin', '0');
downloadButton.style('cursor', 'pointer');
downloadButton.style('appearance', 'none');
downloadButton.style('-webkit-appearance', 'none');

downloadButton.mousePressed(handleDownload);
downloadButton.hide();
  // 請將 'path/to/recording.gif' 換成你實際的 GIF 路徑
  recordingGif = createImg('https://media.tenor.com/Nj67rAcy710AAAAi/spidergame.gif', '錄音中');
  // 調整位置：絕對定位、放在畫面中央或你希望的位置
  recordingGif.style('position', 'fixed'); 
  recordingGif.style('top', '50%'); 
  recordingGif.style('left', '50%'); 
  recordingGif.style('transform', 'translate(-50%, -50%)'); 
  recordingGif.style('z-index', '100'); 
  recordingGif.hide(); // 初始隱藏
  // 其他初始化程式碼…
  // 初始化遊戲參數
  accumulatedScore = 0;
  currentScore = 0;
  // lifePoints 由 checkCode() 設定
	 
	// —— 创建 Modal 弹窗（一个全屏半透明的 div） ——
  infoModal = createDiv(`
  <div id="modalContent" style="
    display: flex;
    flex-direction: column;
    align-items: center;
    background: white;
    padding: 20px;
    border-radius: 20px;
    max-width: 80%;
    margin: 50px auto;
    font-size: 13px;
    line-height: 1.5;
  ">
    <h2 style="margin: 0 0 20px;">遊戲說明</h2>
    <ul style="text-align: left; margin-bottom: 20px;">
      <li>你將扮演一隻敏銳的蜘蛛，捕捉周遭環境的各種聲音</li>
			<li>精確捕捉高頻的聲音，獲取遊戲分數，捕捉到低頻的聲音將會耗損你的生命值</li>
			<li>在生命值歸零之前，盡可能累積你的遊戲分數</li>
			<li>請先將手機音量調到最大聲，避免靜音模式</li>
			<li>按下「Catch Sound」即可開始捕捉聲音</li>
			<li>你的等級愈高，聲音可以捕捉愈久</li>
      <li>點擊畫面可以下載蜘蛛網與聲音檔案</li>
			<li>累積分數：<span id="scoreSpan">0</span> ; 你目前捕捉聲音得到的遊戲分數</li>
			<li>剩餘生命值：<span id="lifeSpan">0</span> ; 你目前剩下的血量</li>			

    </ul>
    <button id="closeModal" style="
      padding: 8px 16px;
      font-size: 16px;
      border: none;
      border-radius: 10px;
      cursor: pointer;
    ">知道了</button>
  </div>`)
  .id('infoModal')
  .style(`
    display: none;
    position: fixed; top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(0,0,0,0.6);
    z-index: 1000;
  `);

// 关闭按钮的事件绑定保持不变
select('#closeModal').mousePressed(() => {
  infoModal.style('display', 'none');
});

  // —— 创建信息图标 ℹ️，并隐藏，后面再 show() —— 
  infoIcon = createDiv('ℹ️')
    .style(`
      font-size: 24px;
      cursor: pointer;
      display: none;
    `)
    .mousePressed(() => {
      infoModal.style('display', 'block');
		  showInfo();
    });
}

function showInfo() {
  // 更新分数与生命值
  select('#scoreSpan').html(Math.round(accumulatedScore));
  select('#lifeSpan').html(Math.round(lifePoints));
  // 再显示 Modal
  infoModal.style('display', 'block');
}

function checkCode() {
	getAudioContext().resume();  // 解鎖音頻上下文（只需呼叫一次）
  let codeStr = codeInput.value();
    // 只要输入的 codeStr 在 VALID_SERIALS 里，就通过
  if (VALID_SERIALS.includes(codeStr)) {
    let sumDigits = 0;
    for (let i = 0; i < 4; i++) {
      sumDigits += int(codeStr.charAt(i));
    }
    lifePoints = sumDigits * random(40, 60); // 設定生命值
    gameStarted = true;
    codeInput.hide();
    submitButton.hide();
    inputButton.show();  // 顯示錄音按鈕
		// 1️⃣ 自动弹出游戏说明窗
    infoModal.style('display', 'block');
		// 第一次弹窗
    showInfo();
    // 2️⃣ 在录音按钮左侧显示信息图标
    const x = inputButton.x - 40;  // 或 windowWidth*..., 根据你的布局调整
    const y = inputButton.y;
    infoIcon.position(x, y).show();
  } else {
    alert("請輸入正確的序號");
  }
}

function draw() {
  // 尚未啟動遊戲：顯示啟動頁面
  if (!gameStarted) {
    background(0);
    if (startBg) {
      image(startBg, 0, 0, width, height);
    }
    fill(255);
    textSize(14);
    textAlign(CENTER, CENTER);
		textLeading(20);
    text("請輸入序號來啟動遊戲\nPlease enter the serial number to start the game", width/2, height/2 - 60);
    return;
  }
 // 每 60 幀（約 1 秒）扣一次生命
  if (frameCount % 60 === 0 && gameStarted && !gameOver) {
    lifePoints--;
    if (lifePoints <= 0) {
      lifePoints = 0;
      gameOver = true;
    }
  }
	
  // 遊戲結束畫面
  if (gameOver) {
    fill(255);
    textSize(24);
    textAlign(CENTER, CENTER);
    text("蜘蛛死亡了，遊戲結束。", width/2, height/2 - 20);
    textSize(24);
    text("累計分數: " + Math.round(accumulatedScore), width/2, height/2 + 20);
		
		// 建立分享按鈕
    shareButton = createButton("分享 FB");
    shareButton.position(windowWidth / 2 -50, windowHeight / 2 + 90);
    shareButton.mousePressed(shareToSocial);
    // --- Instagram 分享按鈕 (Web Share API) ---
    shareIGButton = createButton("分享 IG");
    shareIGButton.position(windowWidth/2 + 10, windowHeight/2 + 90);
    shareIGButton.mousePressed(shareToInstagram);

    // 隐藏 info icon
	  inputButton.hide();
    infoIcon.hide();

    noLoop();
    return;
}

// Facebook 分享函数（保持你原来的实现）
  function shareToSocial() {
  let shareText = `我在玩蜘蛛遊戲🕷️！來挑戰看看吧！`;
  let shareUrl = encodeURIComponent("https://spidergame.wuaze.com/");
  let facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${shareUrl}&quote=${encodeURIComponent(shareText)}`;
  window.open(facebookUrl, "_blank");
}

// Instagram 分享（Web Share API）
function shareToInstagram() {
  const shareData = {
    title: '蜘蛛遊戲',
    text: `我在蜘蛛遊戲中🕷️`,
    url: 'https://spidergame.wuaze.com/'
  };

  if (navigator.canShare && navigator.canShare(shareData)) {
    navigator.share(shareData)
      .catch(err => console.error('分享失败：', err));
  } else {
    // 回退：告诉用户不支持 Web Share，或者提供复制链接
    alert('抱歉，你的瀏覽器不支援直接分享到 Instagram。請手動複製連結並分享到 IG。');
  }
}
	
  // 遊戲進行中
  // 如果相機存在，先將相機畫面作為背景畫出
  if (cam) {
    image(cam, 0, 0, width, height);
  } else {
    // 沒有相機時，可以用背景顏色填滿
    background(0, 0, 45);
  }
  
  if (songEnded && finalWebImage) {
	image(finalWebImage, 0, 0);
	// 第一次进入这里，就初始化蜘蛛
    if (!spiderActive) {
      spiderActive    = true;
      showSpiderLabel = false;
      spiderX         = width * 0.3;
      spiderY         = height * 0.8;
      spiderSpeed     = 0.5 +  playerLevel * 0.1; // 等级越高跑得越快
		  spiderDir       = 1; 
    }
 
// 更新位置
spiderX += spiderSpeed * spiderDir;
// 边界反弹
if (spiderX < width * 0.2 || spiderX > width * 0.8) {
  spiderDir *= -1;
}

// —— 3. 计算基础朝向角 + 微摆头偏角 ——
  // 基础角度：右 90°，左 -90°
  let baseAngle = spiderDir > 0 ? HALF_PI : -HALF_PI;
  // 微摆头：sin 随时间变化，振幅 ±0.2 弧度
  let tiltFreq = 0.1;        // 摆头速度
  let tiltAmp  = 0.2;        // 摆头幅度
  let tiltmov     = sin(frameCount * tiltFreq) * tiltAmp;
  let angle    = baseAngle + tiltmov;

  // —— 4. 绘制蜘蛛 Emoji ——
  push();
    translate(spiderX, spiderY);
    rotate(angle);
    textSize(24 + playerLevel * 8);
    textAlign(CENTER, CENTER);
    text('🕷️', 0, 0);
  pop();

    // 点击后显示等级文字
    if (showSpiderLabel) {
      textSize(16);
      text(playerLabel, width / 2, height * 0.86);
			setTimeout(() => {
      showSpiderLabel = false;
      redraw();
    }, 3000);
    }
	if (finalDisplay) {
	textSize(16);
  text("太好了，捉到獵物了！", windowWidth/2, windowHeight * 0.83);
  setTimeout(() => {
      finalDisplay = false;
      redraw();
    }, 3000);
  }
    return;
				 // 停止 draw() 循环
    noLoop();
  }
  
  if (song && song.isPlaying()) {
		    computeWebParams();    // 保持动态变化
    renderWeb(webBuffer);
    let spectrum = fft.analyze();
    let level = fft.getEnergy(20, 2000) / 255;
    
    // 計算低頻與高頻能量
    let lowFreqEnergy = 0;
    let highFreqEnergy = 0;
    let lowFreqRange = [0, 500];
    let highFreqRange = [500, 5000];
    for (let i = 0; i < spectrum.length; i++) {
      let currentFreq = map(i, 0, spectrum.length, 0, 22050);
      if (currentFreq <= lowFreqRange[1]) {
        lowFreqEnergy += spectrum[i];
      }
      if (currentFreq >= highFreqRange[0]) {
        highFreqEnergy += spectrum[i];
				
      }
    }
    
    currentScore = (highFreqEnergy - lowFreqEnergy * 3) * 0.00005;
    if (currentScore > 0) {
      accumulatedScore += currentScore;
    } else {
      lifePoints += currentScore * 0.1;
    }
		
    // 顯示分數與生命值
    fill(255);
    textSize(16);
    textAlign(CENTER);
    text("本次分數: " + currentScore.toFixed(0), width / 2, height - 70);
    text("累積分數: " + Math.round(accumulatedScore), width / 2, height - 50);
    text("剩餘生命值: " + lifePoints.toFixed(0), width / 2, height - 30);
    
    // 繪製生命條
    let barWidth = width * 0.8;
    let barHeight = 20;
    let lifeRatio = map(lifePoints, 0, 1000, 0, barWidth);
    fill(0, 0, 0);
    rect(width / 2 - barWidth / 2, height - 20, barWidth, barHeight);
    fill(250, 250, 250);
    rect(width / 2 - barWidth / 2, height - 20, lifeRatio, barHeight);
    
  }
  
  if (song && !song.isPlaying() && !songEnded) {
    songEnded = true;
		updatePlayerLevel();  // ← 更新等级和标签
    console.log("累積分數: " + round(accumulatedScore));
    console.log("剩餘生命值: " + round(lifePoints));
		

		
   // 如果這次錄音有正分
    if (accumulatedScore > previousAccumulatedScore) {
      finalDisplay = true;
      setTimeout(() => {
        finalDisplay = false;
      }, 5000);
    }
		  // 關閉相機，結束 AR 效果
  if (cam) {
    cam.remove();
    cam = null;
  }
    inputButton.html("Catch Sound");
    inputButton.show();
		infoIcon.show();
  }
}

function startRecording() {

  // 避免錄音期間重複觸發
  if (isRecording || gameOver) return;

  // 建立新的錄音識別碼
  const session = ++recordingSession;

  // 清除前一次可能殘留的計時器
  if (recordingTimeout) {
    clearTimeout(recordingTimeout);
    recordingTimeout = null;
  }

  // 停止上一段播放
  if (song && song.isPlaying()) {
    song.stop();
  }
  // 清除上一輪聲音狀態
  song = null;
  recordedSound = null;
  songEnded = false;

  finalWebImage = null;
  spiderActive = false;
  showSpiderLabel = false;

  downloadReady = false;
  downloadButton.hide();

  // 開啟相機
  let constraints = {
    video: {
      facingMode: { ideal: "environment" }
    }
  };

  if (!cam) {
    cam = createCapture(constraints);
    cam.size(windowWidth, windowHeight);
    cam.hide();
  }
  // 解鎖音訊
  getAudioContext().resume().then(() => {
    // 第一次才啟動麥克風
    if (!mic) {
      mic = new p5.AudioIn();
      mic.start(
        () => {
          console.log("麥克風已啟動");
          beginRecording(session);
        },
        err => {
          console.error("麥克風啟動失敗：", err);
        }
      );
    } else {
      beginRecording(session);
    }
  });
  loop();
}

function beginRecording(session) {
  // 確認這仍然是目前最新的一次錄音
  if (session !== recordingSession || isRecording) return;

  previousAccumulatedScore = accumulatedScore;

  infoIcon.hide();

  // 建立新的錄音器
  recorder = new p5.SoundRecorder();
  recorder.setInput(mic);

  // 每次建立全新的 SoundFile
  recordedSound = new p5.SoundFile();

  let duration = 5 + playerLevel;

  isRecording = true;
  inputButton.html(`Recording ${duration} Sec.`);
  recordingGif.show();

  // 正式錄音
  recorder.record(
    recordedSound,
    duration,
    () => finishedRecording(session)
  );

  // 保險機制：如果自動停止沒有觸發，
  // 延遲停止 Recorder，而不是直接執行完成函式。
  recordingTimeout = setTimeout(() => {

    if (
      session === recordingSession &&
      isRecording &&
      recorder
    ) {
      console.log("執行錄音保險停止");
      recorder.stop();
    }
  }, (duration + 1) * 1000);
}


function finishedRecording(session) {
  // 防止舊錄音或重複 callback
  if (session !== recordingSession || !isRecording) {
    return;
  }
  // 標記錄音結束
  isRecording = false;

  // 清除保險計時器
  if (recordingTimeout) {
    clearTimeout(recordingTimeout);
    recordingTimeout = null;
  }
  console.log("錄音完成");
  recordingGif.hide();
  inputButton.hide();
  // 使用本次新錄製的聲音
  song = recordedSound;
  songEnded = false;

  if (song && song.buffer && song.buffer.length > 0) {
    downloadReady = true;
    downloadButton.show();
    setupWeb();
    // 開始播放本次錄音
    song.play();
    loop();

  } else {
    console.error("錄音檔案尚未載入完成");
    inputButton.html("Catch Sound");
    inputButton.show();
  }
}

function handleFile(file) {
  console.log("handleFile is disabled");
}

function handleDownload() {
  if (!downloadReady) return;

  // 下載蜘蛛網 PNG
  saveCanvas('Spiderweb', 'png');

  // 下載錄音 WAV
  setTimeout(function() {
    if (recordedSound) {
      saveSound(recordedSound, 'recording.wav');
    } else {
      console.error("沒有錄音檔案可以下載");
    }

    downloadReady = false;
    downloadButton.hide();
  }, 1000);
}

function setupWeb() {
  // 一轮游戏开始时只调用一次
  baseCenter = createVector(
    random(width * 0.3, width * 0.7),
    random(height * 0.3, height * 0.7)
  );
  webCenter = baseCenter.copy();
  // （可选）根据首帧音量设个初始值
  computeWebParams();
}
function computeWebParams() {
  // 每帧都调用，从 FFT 读数据并更新参数
  highE = fft.getEnergy(1000,10000) / 255;
  lowE  = fft.getEnergy(   20,1000) / 255;
  numSpokes = floor(map(highE, 0, 1, 20, 120));
  numRings  = floor(map(lowE,  0, 1, 8,  40));
  maxJitter = map(highE, 0, 1, 10, 70) + map(lowE, 0, 1, 10, 30);
  segments  = floor(map(highE, 0, 1, 20, 80));

  ringRadius = Array.from({length: numRings}, (_, i) =>
    min(width, height)*1.1 * pow((i+1)/numRings, 1.0)
  );
  spokeAngles = Array.from({length: numSpokes}, (_, i) =>
    (TWO_PI/numSpokes) * i
  );
}
// 在 draw() 或音频触发后调用
function renderWeb(buf) {
  // 中心漂移
  let drift = 30;
  webCenter.x = baseCenter.x + map(noise(frameCount*0.5),0,1,-drift,drift);
  webCenter.y = baseCenter.y + map(noise(frameCount*0.6),0,1,-drift,drift);

  buf.clear();
  buf.stroke(255); buf.noFill();
  // 绘制辐射线
  buf.beginShape();
  for (let angle of spokeAngles) {
    for (let i = 0; i <= segments; i++) {
      let t = pow(i/segments,1.3),
          base = p5.Vector.fromAngle(angle)
                       .mult(ringRadius[numRings-1] * t),
          nx   = noise(angle*5,  t*10, frameCount*0.02),
          ny   = noise(angle*7,  t*10, frameCount*0.02),
          jx   = map(nx,0,1,-maxJitter,maxJitter),
          jy   = map(ny,0,1,-maxJitter,maxJitter),
          x    = webCenter.x + base.x + jx,
          y    = webCenter.y + base.y + jy;
      buf.vertex(x,y);
    }
    buf.endShape();
    buf.beginShape();
  }
  buf.endShape();
  
  // 绘制同心环
  for (let r=0; r<numRings; r++) {
    buf.strokeWeight(map(lowE,0,1,1,3));
    buf.beginShape();
    let jitterR = maxJitter * map(r,0,numRings-1,0.2,1.2),
        rad = ringRadius[r], first;
    for (let i=0; i<=segments; i++) {
      let t = i/segments, angle = TWO_PI*t,
          base = p5.Vector.fromAngle(angle).mult(rad),
          nx   = noise(angle*3,r*2,frameCount*0.01),
          ny   = noise(angle*5,r*2,frameCount*0.01),
          jx   = map(nx,0,1,-jitterR,jitterR),
          jy   = map(ny,0,1,-jitterR,jitterR),
          x    = webCenter.x + base.x + jx,
          y    = webCenter.y + base.y + jy;
      buf.curveVertex(x,y);
      if (i==0) first = {x,y}, buf.curveVertex(x,y);
    }
    buf.curveVertex(first.x, first.y);
    buf.curveVertex(first.x, first.y);
    buf.endShape();
  }
  // 然后把离屏画布「贴」到主画布最底层
  image(buf, 0, 0);
	finalWebImage = buf.get();  // 只取离屏的蜘蛛网
}

function updatePlayerLevel() {
  // 计算等级：每 1000 分一个等级，最低 1 级、最高 5 级
  let lvl = floor(accumulatedScore / 1000) + 1;
  playerLevel = constrain(lvl, 1, 5);

  // 根据等级设置对应的文字标签
  switch (playerLevel) {
    case 1:
      playerLabel = "等級1-小蜘蛛; 錄音時間6秒";
      break;
    case 2:
      playerLabel = "等級2-大蜘蛛; 錄音時間7秒";
      break;
    case 3:
      playerLabel = "等級3-毒蜘蛛; 錄音時間8秒";
      break;
    case 4:
      playerLabel = "等級4-惡蜘蛛; 錄音時間9秒";
      break;
    case 5:
      playerLabel = "等級5-蜘蛛王; 錄音時間10秒";
      break;
  }
}

function mouseClicked() {
  // 只有在蜘蛛网定格后，点到蜘蛛附近才触发显示文字
  if (spiderActive) {
    let d = dist(mouseX, mouseY, spiderX, spiderY);
    if (d < 30) showSpiderLabel = true;
  }
  
  // … 你原有的下载／重录逻辑 …
}

// 其他程式碼區段
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  // 重新定位 DOM 元件，例如：
  codeInput.position(windowWidth/2 - 50, windowHeight - 120);
  submitButton.position(windowWidth/2 - 50, windowHeight - 90);
  inputButton.position(windowWidth * 0.35, windowHeight * 0.9);
  downloadButton.position(inputButton.x + 60, inputButton.y);  // 依需求調整其他元素
}

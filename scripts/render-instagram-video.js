/**
 * Standalone Node.js script to render a 30-second 1080x1920 Instagram Reel video
 * using headless Chrome and MediaRecorder.
 */

const http = require("http");
const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");

const PORT = 8492;
const OUTPUT_FILE = path.join(__dirname, "../public/videos/auramind_instagram_reel_30s.webm");

// Ensure output directory exists
const dir = path.dirname(OUTPUT_FILE);
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

console.log("==================================================");
console.log("  AURAMIND 30s INSTAGRAM REEL VIDEO RENDERER      ");
console.log("==================================================");

// Minimal HTML with full 1080x1920 canvas animation and recorder
function getRecorderHtml() {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>AuraMind 30s Reel</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: #000; overflow: hidden; display: flex; align-items: center; justify-content: center; width: 100vw; height: 100vh; }
    canvas { width: 1080px; height: 1920px; background: #070707; }
  </style>
</head>
<body>
  <canvas id="canvas" width="1080" height="1920"></canvas>
  <script>
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');
    const W = 1080, H = 1920;
    const DURATION = 30.0; // 30 seconds
    const FPS = 30;
    let startTime = null;

    // Star/particle field
    const particles = [];
    for (let i = 0; i < 70; i++) {
      particles.push({
        x: Math.random() * W,
        y: Math.random() * H,
        r: Math.random() * 2.5 + 1,
        vx: (Math.random() - 0.5) * 0.4,
        vy: -Math.random() * 0.8 - 0.2,
        alpha: Math.random() * 0.7 + 0.3
      });
    }

    function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }
    function easeInOutQuad(t) { return t < 0.5 ? 2*t*t : 1 - Math.pow(-2*t + 2, 2)/2; }

    function draw(timeSec) {
      ctx.fillStyle = '#070707';
      ctx.fillRect(0, 0, W, H);

      // Radial background glow
      const bgGrad = ctx.createRadialGradient(W/2, H*0.4, 50, W/2, H*0.4, 900);
      bgGrad.addColorStop(0, 'rgba(255, 214, 0, 0.08)');
      bgGrad.addColorStop(1, 'rgba(7, 7, 7, 1)');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, W, H);

      // Particles
      ctx.fillStyle = '#FFD600';
      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.y < 0) p.y = H;
        if (p.x < 0) p.x = W;
        if (p.x > W) p.x = 0;
        ctx.globalAlpha = p.alpha * (0.6 + 0.4 * Math.sin(timeSec * 2 + p.r));
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1.0;

      // Top Brand Header
      ctx.save();
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.font = '700 28px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('A U R A M I N D', W / 2, 120);

      // Gold line under brand
      ctx.strokeStyle = '#FFD600';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(W/2 - 60, 140);
      ctx.lineTo(W/2 + 60, 140);
      ctx.stroke();
      ctx.restore();

      // SCENE 1: (0s - 5s) THE VIRAL HOOK
      if (timeSec >= 0 && timeSec < 5.0) {
        const sTime = timeSec;
        const enterProgress = Math.min(1, sTime / 0.8);
        const scale = 0.85 + 0.15 * easeOutCubic(enterProgress);

        ctx.save();
        ctx.translate(W/2, H/2 - 100);
        ctx.scale(scale, scale);

        // Warning badge
        ctx.fillStyle = 'rgba(239, 68, 68, 0.2)';
        ctx.strokeStyle = '#EF4444';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(-160, -280, 320, 60, 30);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#EF4444';
        ctx.font = '800 26px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('⚠️ HARSH TRUTH', 0, -240);

        // Giant Hook Text
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '900 78px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('WHY DO 92%', 0, -120);
        
        ctx.fillStyle = '#FFD600';
        ctx.fillText('OF GOALS FAIL', 0, -30);

        ctx.fillStyle = '#EF4444';
        ctx.fillText('BY DAY 4?', 0, 60);

        // Subtext box
        ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.beginPath();
        ctx.roundRect(-420, 160, 840, 180, 20);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#E5E5E5';
        ctx.font = '500 36px sans-serif';
        ctx.fillText('Traditional to-do apps assume', 0, 225);
        ctx.fillText('you are a robot.', 0, 275);
        ctx.fillStyle = '#FFD600';
        ctx.font = '700 34px sans-serif';
        ctx.fillText('Life happens. You miss 1 day. You quit.', 0, 320);

        ctx.restore();
      }

      // SCENE 2: (5s - 10s) THE PARADIGM SHIFT
      else if (timeSec >= 5.0 && timeSec < 10.0) {
        const sTime = timeSec - 5.0;
        const enterProgress = Math.min(1, sTime / 0.8);
        const scale = 0.9 + 0.1 * easeOutCubic(enterProgress);

        ctx.save();
        ctx.translate(W/2, H/2 - 80);
        ctx.scale(scale, scale);

        // Glowing Core Logo Reticle
        ctx.save();
        ctx.rotate(timeSec * 0.4);
        ctx.strokeStyle = 'rgba(255, 214, 0, 0.3)';
        ctx.lineWidth = 4;
        ctx.setLineDash([20, 15]);
        ctx.beginPath();
        ctx.arc(0, -220, 110, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();

        // Inner Golden Circle
        ctx.fillStyle = '#FFD600';
        ctx.beginPath();
        ctx.arc(0, -220, 75, 0, Math.PI * 2);
        ctx.fill();

        // Target arrow
        ctx.strokeStyle = '#070707';
        ctx.lineWidth = 14;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(-25, -195);
        ctx.lineTo(25, -245);
        ctx.lineTo(10, -245);
        ctx.moveTo(25, -245);
        ctx.lineTo(25, -230);
        ctx.stroke();

        // Title
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '900 76px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('ENTER AURAMIND', 0, -40);

        // Subtitle
        ctx.fillStyle = '#FFD600';
        ctx.font = '700 34px sans-serif';
        ctx.fillText('YOUR AI ACCOUNTABILITY OPERATING SYSTEM', 0, 25);

        // Creed Card
        ctx.fillStyle = '#141414';
        ctx.strokeStyle = 'rgba(255, 214, 0, 0.4)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(-440, 90, 880, 240, 24);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#FFD600';
        ctx.font = '800 30px sans-serif';
        ctx.fillText('💡 THE CORE PRINCIPLE', 0, 145);

        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'italic 700 40px serif';
        ctx.fillText('“Don’t plan a perfect day.', 0, 215);
        ctx.fillStyle = '#FFD600';
        ctx.fillText('Build a system that learns your real one.”', 0, 275);

        ctx.restore();
      }

      // SCENE 3: (10s - 15s) 30-DAY ADAPTIVE TIMETABLE
      else if (timeSec >= 10.0 && timeSec < 15.0) {
        const sTime = timeSec - 10.0;
        const enterProgress = Math.min(1, sTime / 0.6);

        ctx.save();
        ctx.translate(W/2, H/2 - 100);

        // Badge
        ctx.fillStyle = 'rgba(255, 214, 0, 0.15)';
        ctx.strokeStyle = '#FFD600';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(-210, -320, 420, 56, 28);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#FFD600';
        ctx.font = '800 24px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('⚡ 60-SECOND SYNTHESIS', 0, -284);

        // Main Title
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '900 68px sans-serif';
        ctx.fillText('30-DAY ADAPTIVE', 0, -190);
        ctx.fillStyle = '#FFD600';
        ctx.fillText('TIMETABLE', 0, -115);

        // 4 Phase Cards
        const phases = [
          { name: 'Week 1: Foundations', stat: 'Day 1–7 ✓', color: '#10B981', prog: 1.0 },
          { name: 'Week 2: Core Mechanics', stat: 'Day 8–14 [ACTIVE]', color: '#FFD600', prog: 0.65 },
          { name: 'Week 3: Real Synthesis', stat: 'Day 15–22', color: '#FFFFFF', prog: 0 },
          { name: 'Week 4: Final Mastery', stat: 'Day 23–30', color: '#38BDF8', prog: 0 },
        ];

        phases.forEach((ph, idx) => {
          const cardY = -30 + idx * 115;
          ctx.fillStyle = '#141414';
          ctx.strokeStyle = ph.color === '#FFD600' ? '#FFD600' : 'rgba(255, 255, 255, 0.1)';
          ctx.lineWidth = ph.color === '#FFD600' ? 2 : 1;
          ctx.beginPath();
          ctx.roundRect(-420, cardY, 840, 95, 18);
          ctx.fill();
          ctx.stroke();

          ctx.textAlign = 'left';
          ctx.fillStyle = '#FFFFFF';
          ctx.font = '700 32px sans-serif';
          ctx.fillText(ph.name, -380, cardY + 58);

          ctx.textAlign = 'right';
          ctx.fillStyle = ph.color;
          ctx.font = '800 26px monospace';
          ctx.fillText(ph.stat, 380, cardY + 58);
        });

        // Bottom alert
        ctx.textAlign = 'center';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.font = '600 30px sans-serif';
        ctx.fillText('Missed a day? AI recalibrates Days 9–30 instantly.', 0, 480);

        ctx.restore();
      }

      // SCENE 4: (15s - 20s) WHATSAPP + AI CALLING AGENT
      else if (timeSec >= 15.0 && timeSec < 20.0) {
        ctx.save();
        ctx.translate(W/2, H/2 - 100);

        // Title
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '900 64px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('PROACTIVE ACCOUNTABILITY', 0, -250);
        ctx.fillStyle = '#10B981';
        ctx.font = '700 34px sans-serif';
        ctx.fillText('NO MORE SILENT, PASSIVE APPS', 0, -185);

        // 1. WhatsApp Card
        ctx.fillStyle = '#0F261C';
        ctx.strokeStyle = '#10B981';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(-420, -110, 840, 200, 20);
        ctx.fill();
        ctx.stroke();

        ctx.textAlign = 'left';
        ctx.fillStyle = '#10B981';
        ctx.font = '800 28px sans-serif';
        ctx.fillText('💬 HOURLY WHATSAPP CHECK-IN', -380, -60);

        ctx.fillStyle = '#FFFFFF';
        ctx.font = '500 32px sans-serif';
        ctx.fillText('"Hey Alex! Did you finish your 90-min', -380, -10);
        ctx.fillText('Python deep work sprint?"', -380, 30);

        ctx.textAlign = 'right';
        ctx.fillStyle = '#A7F3D0';
        ctx.font = '600 24px monospace';
        ctx.fillText('Delivered at 2:00 PM ✓✓', 380, 65);

        // 2. Incoming AI Call Card
        ctx.fillStyle = '#1C1608';
        ctx.strokeStyle = '#FFD600';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(-420, 130, 840, 230, 20);
        ctx.fill();
        ctx.stroke();

        // Pulsing phone icon
        const pRadius = 36 + 6 * Math.sin(timeSec * 8);
        ctx.fillStyle = '#FFD600';
        ctx.beginPath();
        ctx.arc(-340, 220, pRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#000000';
        ctx.font = '36px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('📞', -340, 232);

        ctx.textAlign = 'left';
        ctx.fillStyle = '#FFD600';
        ctx.font = '800 28px sans-serif';
        ctx.fillText('AI CALLING AGENT (HINDI & ENGLISH)', -270, 185);

        ctx.fillStyle = '#FFFFFF';
        ctx.font = '700 34px sans-serif';
        ctx.fillText('“Aapka agla task ready hai!”', -270, 240);

        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.font = '500 26px sans-serif';
        ctx.fillText('Checks completed tasks & briefs next action.', -270, 290);

        ctx.restore();
      }

      // SCENE 5: (20s - 25s) GAMIFIED FOCUS & COMMUNITY
      else if (timeSec >= 20.0 && timeSec < 25.0) {
        ctx.save();
        ctx.translate(W/2, H/2 - 80);

        // Title
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '900 68px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('FOCUS TIMER & XP', 0, -250);
        ctx.fillStyle = '#FFD600';
        ctx.font = '700 32px sans-serif';
        ctx.fillText('TURN INVISIBLE WORK INTO MOMENTUM', 0, -185);

        // Circular Timer Visual
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = 16;
        ctx.beginPath();
        ctx.arc(0, -20, 130, 0, Math.PI * 2);
        ctx.stroke();

        ctx.strokeStyle = '#FFD600';
        ctx.lineWidth = 16;
        ctx.lineCap = 'round';
        ctx.beginPath();
        const arcProgress = ((timeSec - 20) / 5) * Math.PI * 2;
        ctx.arc(0, -20, 130, -Math.PI / 2, -Math.PI / 2 + arcProgress);
        ctx.stroke();

        ctx.fillStyle = '#FFFFFF';
        ctx.font = '900 64px monospace';
        ctx.fillText('25:00', 0, -5);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.font = '700 22px sans-serif';
        ctx.fillText('DEEP FOCUS SPRINT', 0, 35);

        // Level Up Badge
        ctx.fillStyle = '#141414';
        ctx.strokeStyle = '#38BDF8';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(-420, 170, 840, 140, 20);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#38BDF8';
        ctx.font = '900 34px sans-serif';
        ctx.fillText('🏆 LEVEL 8 ACHIEVED • +120 XP', 0, 230);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.font = '500 26px sans-serif';
        ctx.fillText('Circle of 50 Friends • Zero-Abuse World Chat', 0, 275);

        ctx.restore();
      }

      // SCENE 6: (25s - 30s) CALL TO ACTION & NEW DOMAIN
      else {
        const sTime = timeSec - 25.0;
        const enterProgress = Math.min(1, sTime / 0.6);

        ctx.save();
        ctx.translate(W/2, H/2 - 50);

        // Target Logo
        ctx.fillStyle = '#FFD600';
        ctx.beginPath();
        ctx.arc(0, -220, 70, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#070707';
        ctx.lineWidth = 12;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(-22, -198);
        ctx.lineTo(22, -242);
        ctx.lineTo(8, -242);
        ctx.moveTo(22, -242);
        ctx.lineTo(22, -228);
        ctx.stroke();

        // CTA Header
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '900 74px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('START DAY 1 TODAY', 0, -70);

        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.font = '600 32px sans-serif';
        ctx.fillText('Stop putting your goals on hold.', 0, -10);

        // Giant Official Domain Button
        ctx.fillStyle = '#FFD600';
        ctx.beginPath();
        ctx.roundRect(-440, 60, 880, 140, 24);
        ctx.fill();

        ctx.fillStyle = '#070707';
        ctx.font = '900 48px monospace';
        ctx.fillText('theauramind.dpdns.org', 0, 145);

        // Link in Bio
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '800 38px sans-serif';
        ctx.fillText('🔗 LINK IN BIO', 0, 260);

        // Sub features
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.font = '500 28px sans-serif';
        ctx.fillText('AI Timetable in 60s • Hourly Check-ins • WhatsApp • AI Calling', 0, 320);

        ctx.restore();
      }

      // Bottom Progress Bar (0% to 100% over 30s)
      const prog = Math.min(1, timeSec / DURATION);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.fillRect(80, H - 90, W - 160, 12);

      ctx.fillStyle = '#FFD600';
      ctx.fillRect(80, H - 90, (W - 160) * prog, 12);

      // Timestamp
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.font = '600 24px monospace';
      ctx.textAlign = 'right';
      const curSec = Math.floor(timeSec);
      const curMs = Math.floor((timeSec % 1) * 10);
      ctx.fillText('00:' + (curSec < 10 ? '0' + curSec : curSec) + ' / 00:30', W - 80, H - 120);
    }

    // Capture and MediaRecorder
    async function startRecording() {
      const stream = canvas.captureStream(FPS);
      const mime = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
        ? 'video/webm;codecs=vp9'
        : 'video/webm';
      
      const recorder = new MediaRecorder(stream, {
        mimeType: mime,
        videoBitsPerSecond: 8000000 // 8 Mbps high quality
      });

      const chunks = [];
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = async () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        console.log("Recorded blob size:", blob.size);

        // Send blob to local Node server
        const buffer = await blob.arrayBuffer();
        await fetch('/save-video', {
          method: 'POST',
          headers: { 'Content-Type': 'application/octet-stream' },
          body: buffer
        });

        document.title = "DONE";
      };

      recorder.start();

      let currentSec = 0;
      const intervalMs = 1000 / FPS;

      function renderFrame() {
        if (currentSec <= DURATION) {
          draw(currentSec);
          currentSec += intervalMs / 1000;
          setTimeout(renderFrame, intervalMs);
        } else {
          recorder.stop();
        }
      }

      renderFrame();
    }

    window.onload = () => {
      startRecording();
    };
  </script>
</body>
</html>`;
}

// Start temporary local HTTP server to receive the recorded video buffer
const server = http.createServer((req, res) => {
  if (req.url === "/" || req.url === "/record") {
    res.writeHead(200, { "Content-Type": "text/html" });
    res.end(getRecorderHtml());
  } else if (req.url === "/save-video" && req.method === "POST") {
    const chunks = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => {
      const buffer = Buffer.concat(chunks);
      fs.writeFileSync(OUTPUT_FILE, buffer);
      console.log(`\n✔ [SUCCESS] Video recorded and saved successfully!`);
      console.log(`File: ${OUTPUT_FILE}`);
      console.log(`Size: ${(buffer.length / (1024 * 1024)).toFixed(2)} MB`);
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ ok: true, size: buffer.length }));

      setTimeout(() => {
        server.close();
        process.exit(0);
      }, 1000);
    });
  } else {
    res.writeHead(404);
    res.end();
  }
});

server.listen(PORT, () => {
  console.log(`Local video capture server listening on http://localhost:${PORT}`);
  console.log(`Launching Chrome headless to render 30s video at 1080x1920 (9:16)...`);

  const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
  const edgePath = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
  const browserBinary = fs.existsSync(chromePath) ? chromePath : edgePath;

  const chromeProcess = spawn(
    browserBinary,
    [
      "--headless=new",
      "--disable-gpu",
      "--no-sandbox",
      "--autoplay-policy=no-user-gesture-required",
      "--window-size=1080,1920",
      `http://localhost:${PORT}/record`,
    ],
    { stdio: "ignore" }
  );

  chromeProcess.on("exit", (code) => {
    console.log(`Browser exited with code ${code}`);
  });

  // Timeout guard (35s)
  setTimeout(() => {
    if (fs.existsSync(OUTPUT_FILE)) {
      console.log("Finished recording.");
      process.exit(0);
    } else {
      console.log("Capture in progress...");
    }
  }, 35000);
});

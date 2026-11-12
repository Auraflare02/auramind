/**
 * Professional Studio Renderer for AuraMind 30s Instagram Reel
 * - 60 FPS Buttery-Smooth Animation (1800 perfectly timed frames)
 * - 16 Mbps Ultra-High Bitrate (Crystal-Clear 1080x1920)
 * - Crystal-Clear Spoken Hindi Voiceover
 * - 100% English Visuals, Kinetic Typography & UI
 * - Pre-scaled Cinematic Background Clips
 * - Dual Export: Smooth 60 FPS WebM + Universal High-Quality MP4
 */

const http = require("http");
const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");

const PORT = 8492;
const OUTPUT_WEBM = path.join(__dirname, "../public/videos/auramind_instagram_reel_30s.webm");
const OUTPUT_MP4 = path.join(__dirname, "../public/videos/auramind_instagram_reel_30s.mp4");
const ASSETS_DIR = path.join(__dirname, "../public/videos/assets");
const AUDIO_DIR = path.join(ASSETS_DIR, "audio");
const FFMPEG_PATH = "C:\\Users\\RIDHAM\\AppData\\Local\\CapCut\\Apps\\8.6.0.3667\\ffmpeg.exe";

// Clear previous files to ensure fresh render
[OUTPUT_WEBM, OUTPUT_MP4].forEach(f => {
  if (fs.existsSync(f)) fs.unlinkSync(f);
});

console.log("==================================================");
console.log("  AURAMIND 30s 60FPS SMOOTH STUDIO RENDER         ");
console.log("  60 FPS Smooth Motion • 16 Mbps Crystal Clear    ");
console.log("  Audio: Fluent Hindi Voiceover + SFX + Music     ");
console.log("  Visuals: 100% English Kinetic Typography & UI   ");
console.log("==================================================");

function getRecorderHtml() {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>AuraMind 30s 60FPS Reel</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: #000; overflow: hidden; display: flex; align-items: center; justify-content: center; width: 100vw; height: 100vh; }
    canvas { width: 1080px; height: 1920px; background: #070707; }
  </style>
</head>
<body>
  <canvas id="canvas" width="1080" height="1920"></canvas>
  <script>
    function log(msg) {
      fetch('/log', { method: 'POST', body: msg }).catch(() => {});
    }
    window.onerror = (msg, url, line) => {
      log('CLIENT ERROR: ' + msg + ' line: ' + line);
    };

    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');
    const W = 1080, H = 1920;
    const DURATION = 30.0; // 30 seconds
    const FPS = 60; // 60 FPS buttery-smooth motion!

    // Load Real-Person Cinematic Clips
    const clipSources = {
      overwhelmed: '/assets/clip1_overwhelmed.jpg',
      phoneCall: '/assets/clip2_whatsapp_phone.jpg',
      deepFocus: '/assets/clip3_deep_focus.jpg',
      success: '/assets/clip4_success.jpg'
    };

    const preloadedCanvases = {};

    function preloadAndScaleImages() {
      const keys = Object.keys(clipSources);
      return Promise.all(keys.map(key => {
        return new Promise(resolve => {
          const img = new Image();
          img.src = clipSources[key];
          img.onload = () => {
            // Draw into pre-scaled offscreen canvas for instantaneous 60fps blitting
            const oc = document.createElement('canvas');
            oc.width = W;
            oc.height = H;
            const octx = oc.getContext('2d');
            octx.imageSmoothingEnabled = true;
            octx.imageSmoothingQuality = 'high';

            // Cover fit
            const scale = Math.max(W / img.naturalWidth, H / img.naturalHeight);
            const sw = img.naturalWidth * scale;
            const sh = img.naturalHeight * scale;
            const sx = (W - sw) / 2;
            const sy = (H - sh) / 2;
            octx.drawImage(img, sx, sy, sw, sh);

            preloadedCanvases[key] = oc;
            resolve();
          };
          img.onerror = resolve;
        });
      }));
    }

    // Deterministic mathematical particle field (continuous analytic trajectory)
    const particles = [];
    for (let i = 0; i < 65; i++) {
      particles.push({
        initX: Math.random() * W,
        initY: Math.random() * H,
        r: Math.random() * 2.5 + 1.2,
        vx: (Math.random() - 0.5) * 45,
        vy: -Math.random() * 70 - 25,
        phase: Math.random() * Math.PI * 2,
        alpha: Math.random() * 0.65 + 0.35
      });
    }

    function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }

    function drawCinematicBackground(key, progress, darken) {
      const oc = preloadedCanvases[key];
      if (!oc) return;
      ctx.save();
      // Smooth 60fps Ken Burns zoom
      const zoom = 1.0 + 0.08 * progress;
      const w = W * zoom;
      const h = H * zoom;
      const x = (W - w) / 2 + (Math.sin(progress * Math.PI) * 15);
      const y = (H - h) / 2;
      ctx.drawImage(oc, x, y, w, h);

      const grad = ctx.createLinearGradient(0, 0, 0, H);
      grad.addColorStop(0, 'rgba(7, 7, 7, ' + (darken + 0.18) + ')');
      grad.addColorStop(0.35, 'rgba(7, 7, 7, ' + darken + ')');
      grad.addColorStop(0.7, 'rgba(7, 7, 7, ' + (darken + 0.08) + ')');
      grad.addColorStop(1, 'rgba(7, 7, 7, ' + (darken + 0.28) + ')');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);
      ctx.restore();
    }

    function draw(timeSec) {
      ctx.fillStyle = '#070707';
      ctx.fillRect(0, 0, W, H);

      // Smooth background based on scene
      if (timeSec >= 0 && timeSec < 5.0) {
        drawCinematicBackground('overwhelmed', timeSec / 5.0, 0.58);
      } else if (timeSec >= 15.0 && timeSec < 20.0) {
        drawCinematicBackground('phoneCall', (timeSec - 15.0) / 5.0, 0.65);
      } else if (timeSec >= 20.0 && timeSec < 25.0) {
        drawCinematicBackground('deepFocus', (timeSec - 20.0) / 5.0, 0.60);
      } else if (timeSec >= 25.0) {
        drawCinematicBackground('success', (timeSec - 25.0) / 5.0, 0.60);
      } else {
        const bgGrad = ctx.createRadialGradient(W/2, H*0.4, 50, W/2, H*0.4, 900);
        bgGrad.addColorStop(0, 'rgba(255, 214, 0, 0.09)');
        bgGrad.addColorStop(1, 'rgba(7, 7, 7, 1)');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, W, H);
      }

      // Smooth mathematical particles
      ctx.fillStyle = '#FFD600';
      particles.forEach(p => {
        const px = ((p.initX + p.vx * timeSec) % W + W) % W;
        const py = ((p.initY + p.vy * timeSec) % H + H) % H;
        const alpha = p.alpha * (0.6 + 0.4 * Math.sin(timeSec * 3 + p.phase));
        ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
        ctx.beginPath();
        ctx.arc(px, py, p.r, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1.0;

      // Top Brand Header (Clean English)
      ctx.save();
      ctx.fillStyle = 'rgba(255, 255, 255, 0.88)';
      ctx.font = '800 28px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('A U R A M I N D', W / 2, 120);

      ctx.strokeStyle = '#FFD600';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(W/2 - 60, 140);
      ctx.lineTo(W/2 + 60, 140);
      ctx.stroke();
      ctx.restore();

      // SCENE 1: (0s - 5s) THE VIRAL HOOK (100% ENGLISH ON SCREEN)
      if (timeSec >= 0 && timeSec < 5.0) {
        const sTime = timeSec;
        const enterProgress = Math.min(1, sTime / 0.8);
        const scale = 0.88 + 0.12 * easeOutCubic(enterProgress);

        ctx.save();
        ctx.translate(W/2, H/2 - 80);
        ctx.scale(scale, scale);

        ctx.fillStyle = 'rgba(239, 68, 68, 0.3)';
        ctx.strokeStyle = '#EF4444';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(-170, -280, 340, 60, 30);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#EF4444';
        ctx.font = '800 26px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('⚠️ HARSH TRUTH', 0, -240);

        ctx.fillStyle = '#FFFFFF';
        ctx.font = '900 80px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('WHY DO 92%', 0, -120);
        
        ctx.fillStyle = '#FFD600';
        ctx.fillText('OF GOALS FAIL', 0, -30);

        ctx.fillStyle = '#EF4444';
        ctx.fillText('BY DAY 4?', 0, 60);

        ctx.fillStyle = 'rgba(10, 10, 10, 0.88)';
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(-420, 160, 840, 180, 24);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#E5E5E5';
        ctx.font = '600 36px sans-serif';
        ctx.fillText('Traditional to-do apps assume', 0, 225);
        ctx.fillText('you are a robot.', 0, 275);
        ctx.fillStyle = '#FFD600';
        ctx.font = '700 34px sans-serif';
        ctx.fillText('Life happens. You miss 1 day. You quit.', 0, 320);

        ctx.restore();
      }

      // SCENE 2: (5s - 10s) THE PARADIGM SHIFT (100% ENGLISH ON SCREEN)
      else if (timeSec >= 5.0 && timeSec < 10.0) {
        const sTime = timeSec - 5.0;
        const enterProgress = Math.min(1, sTime / 0.8);
        const scale = 0.9 + 0.1 * easeOutCubic(enterProgress);

        ctx.save();
        ctx.translate(W/2, H/2 - 80);
        ctx.scale(scale, scale);

        // Smooth 60fps rotation
        ctx.save();
        ctx.rotate(timeSec * 0.5);
        ctx.strokeStyle = 'rgba(255, 214, 0, 0.35)';
        ctx.lineWidth = 4;
        ctx.setLineDash([20, 15]);
        ctx.beginPath();
        ctx.arc(0, -220, 110, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();

        ctx.fillStyle = '#FFD600';
        ctx.beginPath();
        ctx.arc(0, -220, 75, 0, Math.PI * 2);
        ctx.fill();

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

        ctx.fillStyle = '#FFFFFF';
        ctx.font = '900 76px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('ENTER AURAMIND', 0, -40);

        ctx.fillStyle = '#FFD600';
        ctx.font = '700 34px sans-serif';
        ctx.fillText('YOUR AI ACCOUNTABILITY OPERATING SYSTEM', 0, 25);

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

      // SCENE 3: (10s - 15s) 30-DAY ADAPTIVE TIMETABLE (100% ENGLISH ON SCREEN)
      else if (timeSec >= 10.0 && timeSec < 15.0) {
        ctx.save();
        ctx.translate(W/2, H/2 - 100);

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

        ctx.fillStyle = '#FFFFFF';
        ctx.font = '900 68px sans-serif';
        ctx.fillText('30-DAY ADAPTIVE', 0, -190);
        ctx.fillStyle = '#FFD600';
        ctx.fillText('TIMETABLE', 0, -115);

        const phases = [
          { name: 'Week 1: Foundations', stat: 'Day 1–7 ✓', color: '#10B981' },
          { name: 'Week 2: Core Mechanics', stat: 'Day 8–14 [ACTIVE]', color: '#FFD600' },
          { name: 'Week 3: Real Synthesis', stat: 'Day 15–22', color: '#FFFFFF' },
          { name: 'Week 4: Final Mastery', stat: 'Day 23–30', color: '#38BDF8' },
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

        ctx.textAlign = 'center';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.font = '600 30px sans-serif';
        ctx.fillText('Missed a day? AI recalibrates Days 9–30 instantly.', 0, 480);

        ctx.restore();
      }

      // SCENE 4: (15s - 20s) REAL PERSON: WHATSAPP + AI CALLING (100% ENGLISH ON SCREEN)
      else if (timeSec >= 15.0 && timeSec < 20.0) {
        ctx.save();
        ctx.translate(W/2, H/2 - 100);

        ctx.fillStyle = '#FFFFFF';
        ctx.font = '900 64px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('PROACTIVE ACCOUNTABILITY', 0, -250);
        ctx.fillStyle = '#10B981';
        ctx.font = '700 34px sans-serif';
        ctx.fillText('NO MORE SILENT, PASSIVE APPS', 0, -185);

        // WhatsApp Card
        ctx.fillStyle = 'rgba(15, 38, 28, 0.92)';
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
        ctx.font = '600 32px sans-serif';
        ctx.fillText('"Hey Alex! Did you finish your 90-min', -380, -10);
        ctx.fillText('Python deep work sprint?"', -380, 30);

        ctx.textAlign = 'right';
        ctx.fillStyle = '#A7F3D0';
        ctx.font = '600 24px monospace';
        ctx.fillText('Delivered at 2:00 PM ✓✓', 380, 65);

        // AI Call Card
        ctx.fillStyle = 'rgba(28, 22, 8, 0.94)';
        ctx.strokeStyle = '#FFD600';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(-420, 130, 840, 230, 20);
        ctx.fill();
        ctx.stroke();

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

        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.font = '500 26px sans-serif';
        ctx.fillText('Checks completed tasks & briefs next action.', -270, 290);

        ctx.restore();
      }

      // SCENE 5: (20s - 25s) REAL PERSON: DEEP FOCUS & XP (100% ENGLISH ON SCREEN)
      else if (timeSec >= 20.0 && timeSec < 25.0) {
        ctx.save();
        ctx.translate(W/2, H/2 - 80);

        ctx.fillStyle = '#FFFFFF';
        ctx.font = '900 68px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('FOCUS TIMER & XP', 0, -250);
        ctx.fillStyle = '#FFD600';
        ctx.font = '700 32px sans-serif';
        ctx.fillText('TURN INVISIBLE WORK INTO MOMENTUM', 0, -185);

        ctx.fillStyle = 'rgba(10, 10, 10, 0.82)';
        ctx.beginPath();
        ctx.arc(0, -20, 140, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.lineWidth = 16;
        ctx.beginPath();
        ctx.arc(0, -20, 130, 0, Math.PI * 2);
        ctx.stroke();

        ctx.strokeStyle = '#FFD600';
        ctx.lineWidth = 16;
        ctx.lineCap = 'round';
        ctx.beginPath();
        // Smooth 60fps arc progress
        const arcProgress = ((timeSec - 20) / 5) * Math.PI * 2;
        ctx.arc(0, -20, 130, -Math.PI / 2, -Math.PI / 2 + arcProgress);
        ctx.stroke();

        ctx.fillStyle = '#FFFFFF';
        ctx.font = '900 64px monospace';
        ctx.fillText('25:00', 0, -5);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.font = '700 22px sans-serif';
        ctx.fillText('DEEP FOCUS SPRINT', 0, 35);

        ctx.fillStyle = 'rgba(20, 20, 20, 0.92)';
        ctx.strokeStyle = '#38BDF8';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(-420, 170, 840, 140, 20);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#38BDF8';
        ctx.font = '900 34px sans-serif';
        ctx.fillText('🏆 LEVEL 8 ACHIEVED • +120 XP', 0, 230);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
        ctx.font = '500 26px sans-serif';
        ctx.fillText('Circle of 50 Friends • Zero-Abuse World Chat', 0, 275);

        ctx.restore();
      }

      // SCENE 6: (25s - 30s) REAL PERSON: SUCCESS & CTA (100% ENGLISH ON SCREEN)
      else {
        ctx.save();
        ctx.translate(W/2, H/2 - 50);

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

        ctx.fillStyle = '#FFFFFF';
        ctx.font = '900 74px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('START DAY 1 TODAY', 0, -70);

        ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
        ctx.font = '600 32px sans-serif';
        ctx.fillText('Stop putting your goals on hold.', 0, -10);

        ctx.fillStyle = '#FFD600';
        ctx.beginPath();
        ctx.roundRect(-440, 60, 880, 140, 24);
        ctx.fill();

        ctx.fillStyle = '#070707';
        ctx.font = '900 48px monospace';
        ctx.fillText('theauramind.dpdns.org', 0, 145);

        ctx.fillStyle = '#FFFFFF';
        ctx.font = '800 38px sans-serif';
        ctx.fillText('🔗 LINK IN BIO', 0, 260);

        ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
        ctx.font = '600 28px sans-serif';
        ctx.fillText('AI Timetable in 60s • Hourly Check-ins • WhatsApp • AI Calling', 0, 320);

        ctx.restore();
      }

      // Smooth Bottom Progress Bar
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
      ctx.fillText('00:' + (curSec < 10 ? '0' + curSec : curSec) + ' / 00:30', W - 80, H - 120);
    }

    // ==========================================
    // AUDIO ENGINE (CRYSTAL-CLEAR HINDI VOICEOVER)
    // ==========================================
    async function setupAudioEngine(actx, dest, baseT) {
      log("Loading 6 Hindi voiceover tracks...");
      const voiceFiles = [
        '/audio/voice_scene1.mp3',
        '/audio/voice_scene2.mp3',
        '/audio/voice_scene3.mp3',
        '/audio/voice_scene4.mp3',
        '/audio/voice_scene5.mp3',
        '/audio/voice_scene6.mp3'
      ];

      const voiceBuffers = await Promise.all(
        voiceFiles.map(url =>
          fetch(url)
            .then(r => r.arrayBuffer())
            .then(buf => actx.decodeAudioData(buf))
        )
      );
      log("All 6 Hindi voiceover tracks decoded!");

      const voiceGain = actx.createGain();
      voiceGain.gain.value = 1.65;
      voiceGain.connect(dest);

      const sfxGain = actx.createGain();
      sfxGain.gain.value = 0.65;
      sfxGain.connect(dest);

      const musicGain = actx.createGain();
      musicGain.gain.value = 0.18;
      musicGain.connect(dest);

      const sceneStarts = [0.15, 5.15, 10.15, 15.15, 20.15, 25.15];
      voiceBuffers.forEach((vBuf, i) => {
        const src = actx.createBufferSource();
        src.buffer = vBuf;
        src.playbackRate.value = 1.15;
        src.connect(voiceGain);
        src.start(baseT + sceneStarts[i]);
      });

      // Sound Effect Triggers
      function triggerKick(time) {
        const osc = actx.createOscillator();
        const gain = actx.createGain();
        osc.frequency.setValueAtTime(140, baseT + time);
        osc.frequency.exponentialRampToValueAtTime(38, baseT + time + 0.08);
        gain.gain.setValueAtTime(0.7, baseT + time);
        gain.gain.exponentialRampToValueAtTime(0.001, baseT + time + 0.12);
        osc.connect(gain);
        gain.connect(musicGain);
        osc.start(baseT + time);
        osc.stop(baseT + time + 0.15);
      }

      function triggerHiHat(time) {
        const bufferSize = actx.sampleRate * 0.04;
        const buffer = actx.createBuffer(1, bufferSize, actx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
        const noise = actx.createBufferSource();
        noise.buffer = buffer;
        const filter = actx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.value = 7500;
        const gain = actx.createGain();
        gain.gain.setValueAtTime(0.20, baseT + time);
        gain.gain.exponentialRampToValueAtTime(0.001, baseT + time + 0.04);
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(musicGain);
        noise.start(baseT + time);
        noise.stop(baseT + time + 0.05);
      }

      function triggerBass(time, freq, duration) {
        const osc = actx.createOscillator();
        const filter = actx.createBiquadFilter();
        const gain = actx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, baseT + time);
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(800, baseT + time);
        filter.frequency.exponentialRampToValueAtTime(180, baseT + time + duration);
        gain.gain.setValueAtTime(0.32, baseT + time);
        gain.gain.exponentialRampToValueAtTime(0.001, baseT + time + duration);
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(musicGain);
        osc.start(baseT + time);
        osc.stop(baseT + time + duration);
      }

      function triggerSubDrop(time) {
        const osc = actx.createOscillator();
        const gain = actx.createGain();
        osc.frequency.setValueAtTime(120, baseT + time);
        osc.frequency.exponentialRampToValueAtTime(32, baseT + time + 1.2);
        gain.gain.setValueAtTime(0.7, baseT + time);
        gain.gain.exponentialRampToValueAtTime(0.001, baseT + time + 1.2);
        osc.connect(gain);
        gain.connect(sfxGain);
        osc.start(baseT + time);
        osc.stop(baseT + time + 1.3);
      }

      function triggerWhoosh(time) {
        const bufferSize = Math.floor(actx.sampleRate * 0.6);
        const buffer = actx.createBuffer(1, bufferSize, actx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
        const noise = actx.createBufferSource();
        noise.buffer = buffer;
        const filter = actx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(300, baseT + time);
        filter.frequency.exponentialRampToValueAtTime(3500, baseT + time + 0.35);
        filter.frequency.exponentialRampToValueAtTime(400, baseT + time + 0.6);
        const gain = actx.createGain();
        gain.gain.setValueAtTime(0.01, baseT + time);
        gain.gain.linearRampToValueAtTime(0.35, baseT + time + 0.3);
        gain.gain.exponentialRampToValueAtTime(0.001, baseT + time + 0.6);
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(sfxGain);
        noise.start(baseT + time);
        noise.stop(baseT + time + 0.65);
      }

      function triggerWhatsAppPing(time) {
        [1800, 2400].forEach((freq, idx) => {
          const osc = actx.createOscillator();
          const gain = actx.createGain();
          const t = baseT + time + idx * 0.08;
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, t);
          gain.gain.setValueAtTime(0.40, t);
          gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
          osc.connect(gain);
          gain.connect(sfxGain);
          osc.start(t);
          osc.stop(t + 0.15);
        });
      }

      function triggerPhoneRing(time) {
        [440, 480].forEach(freq => {
          const osc = actx.createOscillator();
          const gain = actx.createGain();
          osc.frequency.setValueAtTime(freq, baseT + time);
          gain.gain.setValueAtTime(0.22, baseT + time);
          gain.gain.setValueAtTime(0.22, baseT + time + 0.4);
          gain.gain.exponentialRampToValueAtTime(0.001, baseT + time + 0.5);
          osc.connect(gain);
          gain.connect(sfxGain);
          osc.start(baseT + time);
          osc.stop(baseT + time + 0.55);
        });
      }

      function triggerLevelUpChime(time) {
        const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51];
        notes.forEach((freq, idx) => {
          const osc = actx.createOscillator();
          const gain = actx.createGain();
          const t = baseT + time + idx * 0.07;
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, t);
          gain.gain.setValueAtTime(0.35, t);
          gain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
          osc.connect(gain);
          gain.connect(sfxGain);
          osc.start(t);
          osc.stop(t + 0.55);
        });
      }

      function triggerVictoryChord(time) {
        const chord = [349.23, 440.00, 523.25, 698.46];
        chord.forEach(freq => {
          const osc = actx.createOscillator();
          const gain = actx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, baseT + time);
          gain.gain.setValueAtTime(0.28, baseT + time);
          gain.gain.exponentialRampToValueAtTime(0.001, baseT + time + 2.0);
          osc.connect(gain);
          gain.connect(sfxGain);
          osc.start(baseT + time);
          osc.stop(baseT + time + 2.2);
        });
      }

      triggerSubDrop(0.2);
      triggerWhoosh(5.0);
      triggerWhoosh(10.0);
      triggerWhoosh(15.0);
      triggerWhatsAppPing(15.3);
      triggerPhoneRing(16.6);
      triggerPhoneRing(18.2);
      triggerWhoosh(20.0);
      triggerLevelUpChime(22.8);
      triggerWhoosh(25.0);
      triggerVictoryChord(25.1);

      const beatDuration = 0.5;
      const bassProgression = [
        73.42, 73.42, 73.42, 73.42, // D2
        82.41, 82.41, 82.41, 82.41, // E2
        110.0, 110.0, 110.0, 110.0, // A2
        87.31, 87.31, 87.31, 87.31, // F2
        98.00, 98.00, 98.00, 98.00, // G2
        65.41, 65.41, 65.41, 65.41, // C2
        87.31, 87.31, 87.31, 87.31, // F2
        110.0, 110.0, 110.0, 110.0, // A2
        98.00, 98.00, 98.00, 98.00, // G2
        65.41, 65.41, 65.41, 65.41, // C2
        87.31, 87.31, 87.31, 87.31, // F2
        110.0, 110.0, 110.0, 110.0, // A2
        98.00, 98.00, 98.00, 98.00, // G2
        87.31, 87.31, 87.31, 87.31, // F2
        65.41, 65.41, 65.41, 65.41  // C2
      ];

      for (let b = 0; b < 60; b++) {
        const t = b * beatDuration;
        triggerKick(t);
        triggerHiHat(t + 0.25);
        const bassFreq = bassProgression[Math.min(b, bassProgression.length - 1)];
        triggerBass(t, bassFreq, 0.22);
        triggerBass(t + 0.25, bassFreq * 1.5, 0.20);
      }
      log("All audio scheduled successfully!");
    }

    // Capture and MediaRecorder (Combined Video + Audio Stream)
    async function startRecording() {
      try {
        log("Preloading and scaling images...");
        await preloadAndScaleImages();
        log("Images preloaded and scaled!");

        const actx = new (window.AudioContext || window.webkitAudioContext)();
        await actx.resume();
        const audioDest = actx.createMediaStreamDestination();

        const baseT = actx.currentTime + 0.1;
        await setupAudioEngine(actx, audioDest, baseT);

        // 60 FPS Capture Stream
        const canvasStream = canvas.captureStream(FPS);
        const combinedStream = new MediaStream([
          ...canvasStream.getVideoTracks(),
          ...audioDest.stream.getAudioTracks()
        ]);

        log("Combined stream tracks: " + combinedStream.getTracks().map(t => t.kind).join(", "));

        // Use VP8 for ultra-lightweight, 0-stutter playback across all devices
        const mime = MediaRecorder.isTypeSupported('video/webm;codecs=vp8,opus')
          ? 'video/webm;codecs=vp8,opus'
          : 'video/webm';
        log("Using High-Quality 60fps MIME: " + mime);

        const recorder = new MediaRecorder(combinedStream, {
          mimeType: mime,
          videoBitsPerSecond: 16000000, // 16 Mbps Crystal-Clear Bitrate!
          audioBitsPerSecond: 256000
        });

        const chunks = [];
        recorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) chunks.push(e.data);
        };

        recorder.onstop = async () => {
          log("Recorder stopped, chunks: " + chunks.length);
          const blob = new Blob(chunks, { type: mime });
          log("Recorded blob size: " + blob.size);

          const buffer = await blob.arrayBuffer();
          log("Sending " + buffer.byteLength + " bytes to /save-video...");
          await fetch('/save-video', {
            method: 'POST',
            headers: { 'Content-Type': 'application/octet-stream' },
            body: buffer
          });

          document.title = "DONE";
        };

        recorder.start();
        log("60 FPS Recorder started!");

        let lastLoggedSec = -1;

        function renderFrame() {
          const currentSec = actx.currentTime - baseT;
          if (currentSec <= DURATION) {
            if (currentSec >= 0) {
              draw(currentSec);
            }
            const secInt = Math.floor(currentSec);
            if (secInt % 5 === 0 && secInt !== lastLoggedSec) {
              lastLoggedSec = secInt;
              log("Progress: " + currentSec.toFixed(1) + "s / 30.0s (60 FPS)");
            }
            requestAnimationFrame(renderFrame);
          } else {
            log("Reached 30s! Stopping recorder...");
            recorder.stop();
          }
        }

        requestAnimationFrame(renderFrame);
      } catch (err) {
        log("START RECORDING ERROR: " + err.message + " stack: " + err.stack);
      }
    }

    window.onload = () => {
      startRecording();
    };
  </script>
</body>
</html>`;
}

// HTTP server
const server = http.createServer((req, res) => {
  if (req.url === "/log" && req.method === "POST") {
    let body = "";
    req.on("data", (c) => (body += c));
    req.on("end", () => {
      console.log(`[BROWSER]: ${body}`);
      res.writeHead(200);
      res.end("ok");
    });
  } else if (req.url === "/" || req.url === "/record") {
    res.writeHead(200, { "Content-Type": "text/html" });
    res.end(getRecorderHtml());
  } else if (req.url.startsWith("/assets/")) {
    const assetName = path.basename(req.url);
    const assetPath = path.join(ASSETS_DIR, assetName);
    if (fs.existsSync(assetPath)) {
      const data = fs.readFileSync(assetPath);
      res.writeHead(200, { "Content-Type": "image/jpeg" });
      res.end(data);
    } else {
      res.writeHead(404);
      res.end("Asset not found");
    }
  } else if (req.url.startsWith("/audio/")) {
    const audioName = path.basename(req.url);
    const audioPath = path.join(AUDIO_DIR, audioName);
    if (fs.existsSync(audioPath)) {
      const data = fs.readFileSync(audioPath);
      const ext = path.extname(audioName);
      const contentType = ext === ".mp3" ? "audio/mpeg" : "audio/wav";
      res.writeHead(200, { "Content-Type": contentType });
      res.end(data);
    } else {
      res.writeHead(404);
      res.end("Audio not found");
    }
  } else if (req.url === "/save-video" && req.method === "POST") {
    const chunks = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => {
      const buffer = Buffer.concat(chunks);
      fs.writeFileSync(OUTPUT_WEBM, buffer);
      console.log(`\n✔ [SUCCESS] 60 FPS WebM saved successfully!`);
      console.log(`File: ${OUTPUT_WEBM}`);
      console.log(`Size: ${(buffer.length / (1024 * 1024)).toFixed(2)} MB`);

      // Transcode to high-quality universal MP4 using CapCut's ffmpeg
      console.log(`Converting to Butter-Smooth Universal MP4 (60 FPS / High Bitrate)...`);
      const ffArgs = [
        "-y",
        "-i", OUTPUT_WEBM,
        "-filter:v", "fps=fps=60",
        "-c:v", "mpeg4",
        "-q:v", "2",
        "-c:a", "aac",
        "-b:a", "192k",
        OUTPUT_MP4
      ];

      const ff = spawn(FFMPEG_PATH, ffArgs);
      ff.on("close", (code) => {
        if (code === 0 && fs.existsSync(OUTPUT_MP4)) {
          const mp4Stat = fs.statSync(OUTPUT_MP4);
          console.log(`✔ [SUCCESS] Universal 60 FPS MP4 created successfully!`);
          console.log(`File: ${OUTPUT_MP4}`);
          console.log(`Size: ${(mp4Stat.size / (1024 * 1024)).toFixed(2)} MB`);
        } else {
          console.log(`FFmpeg conversion finished with code ${code}`);
        }

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ ok: true, webmSize: buffer.length }));

        setTimeout(() => {
          server.close();
          process.exit(0);
        }, 1000);
      });
    });
  } else {
    res.writeHead(404);
    res.end();
  }
});

server.listen(PORT, () => {
  console.log(`Local video capture server listening on http://localhost:${PORT}`);
  console.log(`Launching Chrome headless to render 30s 60FPS video at 1080x1920 (9:16)...`);

  const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
  const edgePath = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
  const browserBinary = fs.existsSync(chromePath) ? chromePath : edgePath;

  const chromeProcess = spawn(
    browserBinary,
    [
      "--headless=new",
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

  // Timeout guard (50s)
  setTimeout(() => {
    if (fs.existsSync(OUTPUT_WEBM)) {
      console.log("Finished recording guard check.");
      process.exit(0);
    } else {
      console.log("Capture timed out without output file.");
      process.exit(1);
    }
  }, 50000);
});

/**
 * Standalone Node.js script to render a 30-second 1080x1920 Instagram Reel video
 * featuring:
 * 1. Crystal-clear spoken Hindi voiceover across all 6 scenes.
 * 2. Real-person cinematic footage clips matched to each scene's vibe.
 * 3. High-energy electronic synth background music (120 BPM driving beat).
 * 4. Realistic sound effects (bass drops, whooshes, WhatsApp pings, AI phone rings, XP level-up fanfare, and victory chord).
 * Synchronized with Web Audio API hardware clock and MediaRecorder.
 */

const http = require("http");
const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");

const PORT = 8492;
const OUTPUT_FILE = path.join(__dirname, "../public/videos/auramind_instagram_reel_30s.webm");
const ASSETS_DIR = path.join(__dirname, "../public/videos/assets");
const AUDIO_DIR = path.join(ASSETS_DIR, "audio");

// Clear existing file before starting render
if (fs.existsSync(OUTPUT_FILE)) {
  fs.unlinkSync(OUTPUT_FILE);
  console.log("Cleared old video file to ensure fresh render.");
}

console.log("==================================================");
console.log("  AURAMIND 30s HINDI REEL STUDIO RENDER           ");
console.log("  Voiceover: Fluent & Crystal-Clear Hindi         ");
console.log("  Video: 1080x1920 • Real-Person Cinematic Clips  ");
console.log("==================================================");

function getRecorderHtml() {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>AuraMind 30s Hindi Reel</title>
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
    const FPS = 30;

    // Load Real-Person Cinematic Clips
    const clips = {
      overwhelmed: new Image(),
      phoneCall: new Image(),
      deepFocus: new Image(),
      success: new Image()
    };

    clips.overwhelmed.src = '/assets/clip1_overwhelmed.jpg';
    clips.phoneCall.src = '/assets/clip2_whatsapp_phone.jpg';
    clips.deepFocus.src = '/assets/clip3_deep_focus.jpg';
    clips.success.src = '/assets/clip4_success.jpg';

    // Particle field
    const particles = [];
    for (let i = 0; i < 65; i++) {
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

    function drawCinematicBackground(img, progress, darken) {
      if (!img || !img.complete || !img.naturalWidth) return;
      ctx.save();
      const zoom = 1.0 + 0.12 * progress;
      const w = W * zoom;
      const h = H * zoom;
      const x = (W - w) / 2 + (Math.sin(progress * Math.PI) * 20);
      const y = (H - h) / 2;
      ctx.drawImage(img, x, y, w, h);

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

      // Scene-specific backgrounds
      if (timeSec >= 0 && timeSec < 5.0) {
        drawCinematicBackground(clips.overwhelmed, timeSec / 5.0, 0.58);
      } else if (timeSec >= 15.0 && timeSec < 20.0) {
        drawCinematicBackground(clips.phoneCall, (timeSec - 15.0) / 5.0, 0.65);
      } else if (timeSec >= 20.0 && timeSec < 25.0) {
        drawCinematicBackground(clips.deepFocus, (timeSec - 20.0) / 5.0, 0.60);
      } else if (timeSec >= 25.0) {
        drawCinematicBackground(clips.success, (timeSec - 25.0) / 5.0, 0.60);
      } else {
        const bgGrad = ctx.createRadialGradient(W/2, H*0.4, 50, W/2, H*0.4, 900);
        bgGrad.addColorStop(0, 'rgba(255, 214, 0, 0.09)');
        bgGrad.addColorStop(1, 'rgba(7, 7, 7, 1)');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, W, H);
      }

      // Floating gold ambient particles
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
      ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
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

      // SCENE 1: (0s - 5s) THE VIRAL HOOK
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
        ctx.roundRect(-200, -280, 400, 60, 30);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#EF4444';
        ctx.font = '800 26px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('⚠️ कड़वा सच • HARSH TRUTH', 0, -240);

        ctx.fillStyle = '#FFFFFF';
        ctx.font = '900 78px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('92% GOALS', 0, -120);
        
        ctx.fillStyle = '#FFD600';
        ctx.fillText('4 दिन में FAIL', 0, -30);

        ctx.fillStyle = '#EF4444';
        ctx.fillText('क्यों होते हैं?', 0, 60);

        ctx.fillStyle = 'rgba(10, 10, 10, 0.88)';
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(-420, 160, 840, 180, 24);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#E5E5E5';
        ctx.font = '600 36px sans-serif';
        ctx.fillText('पुराने टू-डू ऐप्स आपको रोबोट समझते हैं।', 0, 225);
        ctx.fillText('एक दिन मिस हुआ, और आप छोड़ देते हैं।', 0, 275);
        ctx.fillStyle = '#FFD600';
        ctx.font = '700 32px sans-serif';
        ctx.fillText('अब समय है एक नए स्मार्ट सिस्टम का!', 0, 320);

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

        ctx.save();
        ctx.rotate(timeSec * 0.4);
        ctx.strokeStyle = 'rgba(255, 214, 0, 0.3)';
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
        ctx.font = '700 32px sans-serif';
        ctx.fillText('आपका पर्सनल AI अकाउंटेबिलिटी पार्टनर', 0, 25);

        ctx.fillStyle = '#141414';
        ctx.strokeStyle = 'rgba(255, 214, 0, 0.4)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(-440, 90, 880, 240, 24);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#FFD600';
        ctx.font = '800 28px sans-serif';
        ctx.fillText('💡 मुख्य नियम • THE GOLDEN RULE', 0, 145);

        ctx.fillStyle = '#FFFFFF';
        ctx.font = '700 38px sans-serif';
        ctx.fillText('“परफेक्ट दिन मत प्लान करो।', 0, 215);
        ctx.fillStyle = '#FFD600';
        ctx.fillText('काम करने वाला सिस्टम बनाओ!”', 0, 275);

        ctx.restore();
      }

      // SCENE 3: (10s - 15s) 30-DAY ADAPTIVE TIMETABLE
      else if (timeSec >= 10.0 && timeSec < 15.0) {
        ctx.save();
        ctx.translate(W/2, H/2 - 100);

        ctx.fillStyle = 'rgba(255, 214, 0, 0.15)';
        ctx.strokeStyle = '#FFD600';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(-240, -320, 480, 56, 28);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#FFD600';
        ctx.font = '800 24px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('⚡ 60-सेकंड में AI टाइमटेबल', 0, -284);

        ctx.fillStyle = '#FFFFFF';
        ctx.font = '900 68px sans-serif';
        ctx.fillText('30-DAY ADAPTIVE', 0, -190);
        ctx.fillStyle = '#FFD600';
        ctx.fillText('TIMETABLE', 0, -115);

        const phases = [
          { name: 'हफ़्ता 1: बुनियादी शुरुआत', stat: 'Day 1–7 ✓', color: '#10B981' },
          { name: 'हफ़्ता 2: कोर मोमेंटम', stat: 'Day 8–14 [ACTIVE]', color: '#FFD600' },
          { name: 'हफ़्ता 3: गहरा फोकस', stat: 'Day 15–22', color: '#FFFFFF' },
          { name: 'हफ़्ता 4: लक्ष्य पूरा!', stat: 'Day 23–30', color: '#38BDF8' },
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
          ctx.font = '700 30px sans-serif';
          ctx.fillText(ph.name, -380, cardY + 58);

          ctx.textAlign = 'right';
          ctx.fillStyle = ph.color;
          ctx.font = '800 26px monospace';
          ctx.fillText(ph.stat, 380, cardY + 58);
        });

        ctx.textAlign = 'center';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.font = '600 28px sans-serif';
        ctx.fillText('एक दिन मिस हुआ? AI अपने आप टाइमटेबल एडजस्ट करेगा!', 0, 480);

        ctx.restore();
      }

      // SCENE 4: (15s - 20s) REAL PERSON: WHATSAPP + AI CALLING
      else if (timeSec >= 15.0 && timeSec < 20.0) {
        ctx.save();
        ctx.translate(W/2, H/2 - 100);

        ctx.fillStyle = '#FFFFFF';
        ctx.font = '900 64px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('PROACTIVE ACCOUNTABILITY', 0, -250);
        ctx.fillStyle = '#10B981';
        ctx.font = '700 32px sans-serif';
        ctx.fillText('व्हाट्सएप चेक-इन + AI कॉलिंग एजेंट', 0, -185);

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
        ctx.fillText('💬 हर घंटे व्हाट्सएप चेक-इन', -380, -60);

        ctx.fillStyle = '#FFFFFF';
        ctx.font = '600 32px sans-serif';
        ctx.fillText('"नमस्ते राहुल! क्या आपने 90 मिनट का', -380, -10);
        ctx.fillText('स्टडी / कोडिंग सेशन पूरा किया?"', -380, 30);

        ctx.textAlign = 'right';
        ctx.fillStyle = '#A7F3D0';
        ctx.font = '600 24px monospace';
        ctx.fillText('2:00 PM पर मिला ✓✓', 380, 65);

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
        ctx.fillText('AI कॉलिंग एजेंट (हिंदी और इंग्लिश)', -270, 185);

        ctx.fillStyle = '#FFFFFF';
        ctx.font = '700 34px sans-serif';
        ctx.fillText('“आपका अगला टास्क रेडी है!”', -270, 240);

        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.font = '500 26px sans-serif';
        ctx.fillText('काम चेक करता है और आगे का रास्ता बताता है।', -270, 290);

        ctx.restore();
      }

      // SCENE 5: (20s - 25s) REAL PERSON: DEEP FOCUS & XP
      else if (timeSec >= 20.0 && timeSec < 25.0) {
        ctx.save();
        ctx.translate(W/2, H/2 - 80);

        ctx.fillStyle = '#FFFFFF';
        ctx.font = '900 68px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('FOCUS TIMER & XP', 0, -250);
        ctx.fillStyle = '#FFD600';
        ctx.font = '700 32px sans-serif';
        ctx.fillText('डीप वर्क करो और लेवल अप करो', 0, -185);

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
        ctx.fillText('दोस्तों का सर्कल • वर्ल्ड चैट कम्युनिटी', 0, 275);

        ctx.restore();
      }

      // SCENE 6: (25s - 30s) REAL PERSON: SUCCESS & CTA
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
        ctx.fillText('आज ही शुरुआत करें, कल पर मत टालें।', 0, -10);

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
        ctx.fillText('AI टाइमटेबल • व्हाट्सएप चेक-इन • AI कॉलिंग एजेंट', 0, 320);

        ctx.restore();
      }

      // Bottom Progress Bar
      const prog = Math.min(1, timeSec / DURATION);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.fillRect(80, H - 90, W - 160, 12);

      ctx.fillStyle = '#FFD600';
      ctx.fillRect(80, H - 90, (W - 160) * prog, 12);

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

      // Gains: Louder, crisp voice + balanced background music
      const voiceGain = actx.createGain();
      voiceGain.gain.value = 1.65; // Crystal-clear, audible Hindi vocals
      voiceGain.connect(dest);

      const sfxGain = actx.createGain();
      sfxGain.gain.value = 0.65;
      sfxGain.connect(dest);

      const musicGain = actx.createGain();
      musicGain.gain.value = 0.18; // Subtle energetic bed beneath voice
      musicGain.connect(dest);

      // Play Voiceover at Scene Start Timestamps with 1.15x natural speed boost
      const sceneStarts = [0.15, 5.15, 10.15, 15.15, 20.15, 25.15];
      voiceBuffers.forEach((vBuf, i) => {
        const src = actx.createBufferSource();
        src.buffer = vBuf;
        src.playbackRate.value = 1.15; // Natural 15% pace boost for clarity & energy
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

      // Schedule SFX
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

      // Driving 120 BPM Background Tech Beat (60 Beats)
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
        log("Preloading images...");
        const imagePromises = Object.values(clips).map(img => {
          if (img.complete && img.naturalWidth) return Promise.resolve();
          return new Promise((resolve) => {
            img.onload = () => resolve();
            img.onerror = () => resolve();
          });
        });
        await Promise.all(imagePromises);
        log("Images preloaded!");

        const actx = new (window.AudioContext || window.webkitAudioContext)();
        await actx.resume();
        const audioDest = actx.createMediaStreamDestination();

        const baseT = actx.currentTime + 0.1;
        await setupAudioEngine(actx, audioDest, baseT);

        // Combine video and audio tracks
        const canvasStream = canvas.captureStream(FPS);
        const combinedStream = new MediaStream([
          ...canvasStream.getVideoTracks(),
          ...audioDest.stream.getAudioTracks()
        ]);

        log("Combined stream tracks: " + combinedStream.getTracks().map(t => t.kind).join(", "));

        const mime = MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')
          ? 'video/webm;codecs=vp9,opus'
          : 'video/webm';
        log("Using MIME: " + mime);

        const recorder = new MediaRecorder(combinedStream, {
          mimeType: mime,
          videoBitsPerSecond: 8000000,
          audioBitsPerSecond: 192000
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
        log("Recorder started recording!");

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
              log("Progress: " + currentSec.toFixed(1) + "s / 30.0s");
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
      fs.writeFileSync(OUTPUT_FILE, buffer);
      console.log(`\n✔ [SUCCESS] Video rendered with CLEAR HINDI AUDIO!`);
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
  console.log(`Launching Chrome headless to render 30s video with CLEAR HINDI AUDIO at 1080x1920 (9:16)...`);

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

  // Timeout guard (45s)
  setTimeout(() => {
    if (fs.existsSync(OUTPUT_FILE)) {
      console.log("Finished recording guard check.");
      process.exit(0);
    } else {
      console.log("Capture timed out without output file.");
      process.exit(1);
    }
  }, 45000);
});

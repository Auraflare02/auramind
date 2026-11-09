const https = require('https');
const fs = require('fs');
const path = require('path');

const AUDIO_DIR = path.join(__dirname, '../public/videos/assets/audio');

const hindiScenes = [
  {
    name: 'voice_scene1.mp3',
    text: 'बानवे परसेंट गोल्स चार दिन में क्यों फेल होते हैं? सोचिए।'
  },
  {
    name: 'voice_scene2.mp3',
    text: 'पेश है AuraMind। परफेक्ट दिन नहीं, काम करने वाला सिस्टम बनाओ।'
  },
  {
    name: 'voice_scene3.mp3',
    text: 'साठ सेकंड में AI आपके लिए तीस दिनों का टाइमटेबल बनाता है।'
  },
  {
    name: 'voice_scene4.mp3',
    text: 'व्हाट्सएप पर हर घंटे चेक-इन, और AI एजेंट से हिंदी में कॉलिंग।'
  },
  {
    name: 'voice_scene5.mp3',
    text: 'फोकस टाइमर से डीप वर्क करो, XP कमाओ और आगे बढ़ो।'
  },
  {
    name: 'voice_scene6.mp3',
    text: 'आज ही Day One शुरू करो। बायो में दिए लिंक पर तुरंत क्लिक करो!'
  }
];

function downloadHindiAudio(item) {
  return new Promise((resolve, reject) => {
    const encoded = encodeURIComponent(item.text);
    const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encoded}&tl=hi&client=tw-ob`;
    const outPath = path.join(AUDIO_DIR, item.name);

    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => {
        const buf = Buffer.concat(chunks);
        fs.writeFileSync(outPath, buf);
        console.log(`Saved ${item.name} (${buf.length} bytes)`);
        resolve(outPath);
      });
    }).on('error', reject);
  });
}

async function run() {
  console.log("Downloading articulate Hindi voiceover tracks...");
  for (const item of hindiScenes) {
    await downloadHindiAudio(item);
  }
  console.log("Done downloading Hindi tracks!");
}

run();

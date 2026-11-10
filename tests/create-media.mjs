// Makes the explicitly labeled silent sample film from a credited photograph.
import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { createEnvironment, waitFor, root } from './cdp.mjs';

const environment = await createEnvironment();
try {
  const { page, url } = environment;
  await page.call('Page.navigate', { url: url + '/#home' });
  await waitFor(page, "document.documentElement.dataset.ready === 'true'");
  const data = await page.evaluate(`(async () => {
    const image = new Image();
    image.src = 'assets/jeepney.jpg';
    await image.decode();
    const canvas = document.createElement('canvas');
    canvas.width = 960; canvas.height = 640;
    const context = canvas.getContext('2d');
    const stream = canvas.captureStream(12);
    const recorder = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp8', videoBitsPerSecond: 1000000 });
    const pieces = [];
    recorder.ondataavailable = event => { if (event.data.size) pieces.push(event.data); };
    const finished = new Promise(resolve => { recorder.onstop = resolve; });
    recorder.start(250);
    const started = performance.now();
    await new Promise(resolve => {
      function draw(now) {
        const progress = Math.min((now - started) / 8000, 1);
        const scale = Math.max(960 / image.width, 640 / image.height) * (1.04 + progress * .07);
        const width = image.width * scale, height = image.height * scale;
        context.drawImage(image, (960 - width) / 2, (640 - height) / 2, width, height);
        context.fillStyle = 'rgba(21,43,32,.8)';
        context.fillRect(0, 470, 960, 170);
        context.fillStyle = '#f6f3eb';
        context.font = '14px Arial';
        context.fillText('REMEMBERING / SAMPLE VISUAL STUDY', 42, 510);
        context.font = '31px Georgia';
        context.fillText('An ordinary day. A familiar kind of home.', 42, 559);
        context.font = '12px Arial';
        context.fillText('Illustrative photograph: Sadia Afreen / Unsplash. No audio.', 42, 604);
        if (progress < 1) requestAnimationFrame(draw); else resolve();
      }
      requestAnimationFrame(draw);
    });
    recorder.stop();
    await finished;
    stream.getTracks().forEach(track => track.stop());
    const blob = new Blob(pieces, { type: 'video/webm' });
    return await new Promise(resolve => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result.split(',')[1]);
      reader.readAsDataURL(blob);
    });
  })()`);
  await writeFile(path.join(root, 'assets/remembering.webm'), Buffer.from(data, 'base64'));
  console.log('Created the eight-second silent SAMPLE film.');
} finally { await environment.stop(); }

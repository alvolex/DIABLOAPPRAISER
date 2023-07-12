import { createRoot } from 'react-dom/client';
import { Word, createWorker } from 'tesseract.js';
import App from './App';
import image from '../testImages/unique.jpg';

const container = document.getElementById('root') as HTMLElement;
const root = createRoot(container);
root.render(<App />);

const findItemRect = (words: Word[]) => {
  let x0 = 0;
  let y0 = 0;
  let x1 = 0;
  let y1 = 0;

  console.log(words);

  let hasStart = false;
  const foundPositions = words.some((word, idx) => {
    if (!hasStart && word.text === 'Item' && words[idx + 1].text === 'Power') {
      x0 = word.bbox.x0 - 40;
      y0 = word.bbox.y0 - 5;
      hasStart = true;
    }

    if (
      hasStart &&
      word.text === 'Requires' &&
      words[idx + 1].text === 'Level'
    ) {
      x1 = words[idx + 1].bbox.x1 + 30;
      y1 = words[idx + 1].bbox.y1 + 5;
      return true;
    }
    return false;
  });

  return foundPositions ? { x0, y0, x1, y1 } : null;
};

const getTextFromTesseract = async () => {
  const worker = await createWorker();
  (async () => {
    await worker.loadLanguage('eng');
    await worker.initialize('eng');
    const { data } = await worker.recognize(image);

    const words = data.words.filter((word) => word.confidence > 40);
    const positions = findItemRect(words);

    if (!positions) {
      // eslint-disable-next-line no-alert
      alert('Could not find item level');
      await worker.terminate();
      return;
    }

    const { x0, y0, x1, y1 } = positions;

    const {
      data: { text },
    } = await worker.recognize(image, {
      rectangle: { top: y0, left: x0, width: x1 - x0, height: y1 - y0 },
    });

    await worker.terminate();

    console.log(text);
    alert(text);
  })();
};

// calling IPC exposed from preload script
window.electron.ipcRenderer.once('ipc-example', (arg) => {
  // eslint-disable-next-line no-console
  console.log(arg);
});
window.electron.ipcRenderer.sendMessage('ipc-example', ['ping']);

window.electron.ipcRenderer.on('tesseract', (arg) => {
  // eslint-disable-next-line no-console
  console.log(arg);

  getTextFromTesseract();
});

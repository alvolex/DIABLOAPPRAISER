import { createRoot } from 'react-dom/client';
import { createWorker } from 'tesseract.js';
import App from './App';
import image from '../testImages/gloves.png';

const container = document.getElementById('root') as HTMLElement;
const root = createRoot(container);
root.render(<App />);

const getTextFromTesseract = async () => {
  const worker = await createWorker();
  (async () => {
    await worker.loadLanguage('eng');
    await worker.initialize('eng');
    const {
      data: { text },
    } = await worker.recognize(image);
    await worker.terminate();

    // eslint-disable-next-line no-console
    console.log(text);

    // eslint-disable-next-line no-alert
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

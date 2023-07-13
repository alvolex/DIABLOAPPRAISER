// import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';

const sendIpc = () => {
  window.electron.ipcRenderer.sendMessage(
    'run-tesseract',
    'Started from app.tsx'
  );
};

function App() {
  return (
    <div>
      <button type="button" onClick={sendIpc}>
        Send ipc
      </button>
    </div>
  );

  /* return (
    <Router>
      <Routes>
        <Route path="/" element={<Hello />} />
      </Routes>
    </Router>
  ); */
}

export default App;

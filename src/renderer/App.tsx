// import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';
import React from 'react';
import './App.css';
import ResizableGrid from './components/ResizableGrid';

const sendIpc = () => {
  window.electron.ipcRenderer.sendMessage(
    'run-tesseract',
    'Started from app.tsx'
  );
};

const gridMouseOverCallback = (row: any, col: number) => {
  console.log(`row: ${row}, col: ${col}`);
}

const App = () => {
  return (
    <div>
      <button type="button" onClick={sendIpc}>
        Send ipc
      </button>
      <ResizableGrid gridCols={11} gridRows={3} callback={gridMouseOverCallback} />
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

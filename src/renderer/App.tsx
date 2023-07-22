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

const screenShotIpc = (
  row: number,
  col: number,
  mousePos: {
    x: number;
    y: number;
  }
) => {
  window.electron.ipcRenderer.sendMessage(
    'take-screenshot',
    'Started from app.tsx',
    { row, col },
    mousePos
  );
};

const gridMouseOverCallback = (
  row: any,
  col: number,
  event: React.MouseEvent<HTMLDivElement, MouseEvent>
) => {
  console.log(`row: ${row}, col: ${col}`);

  const mousePos = {
    x: event.clientX,
    y: event.clientY,
  };

  screenShotIpc(row, col, mousePos);
};

const App = () => {
  return (
    <div>
      <button type="button" onClick={sendIpc}>
        Send ipc
      </button>
      <ResizableGrid
        gridCols={11}
        gridRows={3}
        callback={gridMouseOverCallback}
      />
    </div>
  );

  /* return (
    <Router>
      <Routes>
        <Route path="/" element={<Hello />} />
      </Routes>
    </Router>
  ); */
};

export default App;

// import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';
import React, { useEffect, useState } from 'react';
import './App.css';
import ResizableGrid from './components/ResizableGrid';

const toggleClickthroughIpc = (bool: boolean) => {
  window.electron.ipcRenderer.sendMessage(
    'toggle-clickthrough',
    'Started from app.tsx',
    bool
  );
};

const gridMouseOverCallback = (
  row: any,
  col: number,
  event: React.MouseEvent<HTMLDivElement, MouseEvent>
) => {
  const mousePos = {
    x: event.clientX,
    y: event.clientY,
  };

  //take screenshot in main process
  window.electron.ipcRenderer.sendMessage(
    'take-screenshot',
    'Started from app.tsx',
    { row, col },
    mousePos
  );
};

const App = () => {
  const [editMode, setEditMode] = useState(false);
  const [counter, setCounter] = useState(0);

  const runTesseractIpc = (image: string) => {
    window.electron.ipcRenderer.sendMessage(
      'run-tesseract',
      'Started from app.tsx',
      image
    );

    setCounter(counter + 1); //just for debugging tesseract with multiple images
  };

  const sendIpc = () => {
    window.electron.ipcRenderer.sendMessage(
      'toggle-clickthrough',
      'Started from app.tsx',
      null
    );

    setEditMode(!editMode);
  };

  return (
    <div>
      <button
        type="button"
        onClick={sendIpc}
        onMouseEnter={() => toggleClickthroughIpc(false)}
        onMouseLeave={() => {
          toggleClickthroughIpc(true);
        }}
      >
        Toggle edit mode
      </button>
      {/* //todo call runTesseractIpc when the screenshot is taken instead */}
      <button
        type="button"
        onClick={() => runTesseractIpc('row-0 col-' + counter + '.png')}
      >
        Run Tesseract
      </button>
      
      <ResizableGrid
        gridCols={11}
        gridRows={3}
        callback={gridMouseOverCallback}
        editMode={editMode}
        name="Inventory"
      />

      <ResizableGrid
        gridCols={4}
        gridRows={1}
        callback={gridMouseOverCallback}
        editMode={editMode}
        name="StashSlot"
      />

      <ResizableGrid
        gridCols={11}
        gridRows={9}
        callback={gridMouseOverCallback}
        editMode={editMode}
        name="StashTab"
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

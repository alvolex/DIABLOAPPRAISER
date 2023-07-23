// import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';
import React, { useEffect, useState } from 'react';
import './App.css';
import ResizableGrid from './components/ResizableGrid';
import { getTextFromTesseract } from 'renderer';

const sendIpc = () => {
  /* window.electron.ipcRenderer.sendMessage(
    'ipc-example',
    'Started from app.tsx'
  ); */

  window.electron.ipcRenderer.sendMessage(
    'toggle-clickthrough',
    'Started from app.tsx',
    null
  );
};

const runTesseractIpc = (image: string) => {
  window.electron.ipcRenderer.sendMessage(
    'run-tesseract',
    'Started from app.tsx',
    image
  );
};

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
  //todo ! refactor moveable grid
  const [dragging, setDragging] = useState(false);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  const handleMouseDown = (e: any) => {
    if (e.target.classList.contains('moveHandle')) {
      e.preventDefault();
      setDragging(true);
      setOffset({
        x: e.clientX - e.target.getBoundingClientRect().left,
        y: e.clientY - e.target.getBoundingClientRect().top,
      });
    }
  };

  const handleMouseMove = (e: any) => {
    if (dragging) {
      e.preventDefault();
      const x = e.clientX - offset.x;
      const y = e.clientY - offset.y;
      const movableGrid = document.querySelector('.movableGrid') as HTMLElement;
      if (movableGrid) {
        movableGrid.style.left = x + 'px';
        movableGrid.style.top = y + 'px';
      }
    }
  };

  const handleMouseUp = () => {
    setDragging(false);
  };

  useEffect(() => {
    if (dragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    } else {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragging]);

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
      <button type="button" onClick={() => runTesseractIpc('row-2 col-10.png')}>
        Run Tesseract
      </button>
      <div className="movableGrid" onMouseDown={handleMouseDown}>
        <div className="moveHandle"></div>
        <ResizableGrid
          gridCols={11}
          gridRows={3}
          callback={gridMouseOverCallback}
        />
      </div>
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

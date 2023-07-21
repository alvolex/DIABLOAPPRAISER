import React from 'react';
import '../styles/ResizableGrid.css';

/* callback with either no arguments or an arbitrary amount of any */
export interface GridProps {
  gridRows: number;
  gridCols: number;
  callback?: (...args: any) => any;
}

const ResizableGrid: React.FC<GridProps> = ({ gridCols, gridRows, callback }) => {
  const grid: any[][] = Array(gridRows).fill(Array(gridCols).fill(0));

  return (
    <div className="grid-container">
      {grid.map((row, idx) => (
        <div key={idx.toString()} className="grid-row" style={{height: (100/gridRows) + '%'}}>
          {row.map((col, idx2) => (
            callback ? <div key={idx2.toString()} className="grid-cell" onMouseEnter={() => callback(idx, idx2)}/> : <div key={idx2.toString()} className="grid-cell"/>
          ))}
        </div>
      ))}
    </div>
  );
};

export default ResizableGrid;

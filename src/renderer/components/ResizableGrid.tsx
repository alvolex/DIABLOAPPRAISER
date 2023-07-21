import React from 'react';
import '../styles/ResizableGrid.css';

interface Props {
  gridRows: number;
  gridCols: number;
}

const ResizableGrid: React.FC<Props> = ({ gridCols, gridRows }) => {
  const grid = Array(gridRows).fill(Array(gridCols).fill(0));

  return (
    <div className="grid-container">
      {grid.map((row, idx) => (
        <div key={idx.toString()} className="grid-row" style={{height: (100/gridRows) + '%'}}>
          {row.map((col: any, idx2: any) => (
            <div key={idx2.toString()} className="grid-cell" />
          ))}
        </div>
      ))}
    </div>
  );
};

export default ResizableGrid;

import React, { useEffect, useState } from 'react';
import '../styles/ResizableGrid.css';

/* callback with either no arguments or an arbitrary amount of any */
export interface GridProps {
  gridRows: number;
  gridCols: number;
  editMode?: boolean;
  name: string;
  callback?: (...args: any) => any;
}

//todo: add the name to the movable names so that several grids can be moved independently
const ResizableGrid: React.FC<GridProps> = ({
  gridCols,
  gridRows,
  callback,
  editMode = false,
  name
}) => {
  const [firstRender, setFirstRender] = useState(true);
  const [gridContainerWidth, setGridContainerWidth] = useState<string | null>( null);
  const [gridContainerHeight, setGridContainerHeight] = useState<string | null>( null);
  const [dragging, setDragging] = useState(false);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const grid: any[][] = Array(gridRows).fill(Array(gridCols).fill(0));

  useEffect(() => {
    let height = localStorage.getItem(`gridContainerHeight${name}`);
    let width = localStorage.getItem(`gridContainerWidth${name}`);

    if(height === null) {
      localStorage.setItem(`gridContainerHeight${name}`, '100');
      height = '100';
    }

    if(width === null) {
      localStorage.setItem(`gridContainerWidth${name}`, '100');
      width = '100';
    }

    setGridContainerHeight(height);
    setGridContainerWidth(width);
  }, []);

  useEffect(() => {
    if (editMode === false && firstRender === true) {
      //get grid-container size from localstorage and set it
      const gridContainer = document.querySelector(
        '.grid-container.' + name
      ) as HTMLElement;

      if (gridContainerWidth && gridContainerHeight) {
        gridContainer.style.width = gridContainerWidth + 'px';
        gridContainer.style.height = gridContainerHeight + 'px';
        setFirstRender(false);
      }
    }
  }, [gridContainerWidth]);

  useEffect(() => {
    console.log(firstRender)
    if (editMode === false && firstRender === false) {
      //get grid-container size and save to localsoage
      const gridContainer = document.querySelector(
        '.grid-container.' + name
      ) as HTMLElement;

      localStorage.setItem(`gridContainerWidth${name}`, gridContainer.offsetWidth.toString());
      localStorage.setItem(`gridContainerHeight${name}`, (gridContainer.offsetHeight - 10).toString());
    }
  }, [editMode]);

  //Make draggable
  const handleMouseDown = (e: any) => {
    if (e.target.classList.contains('moveHandle') && (e.target.classList.contains(name))) {
      e.preventDefault();
      setDragging(true);
      setOffset({
        x: e.clientX - e.target.getBoundingClientRect().left,
        y: e.clientY - e.target.getBoundingClientRect().top,
      });
    }
  };

  const movableGrid = document.querySelector('.movableGrid.' + name) as HTMLElement;
  const handleMouseMove = (e: any) => {
    if (dragging) {
      e.preventDefault();
      const x = e.clientX - offset.x;
      const y = e.clientY - offset.y;
      if (movableGrid) {
        movableGrid.style.left = x + 'px';
        movableGrid.style.top = y + 'px';
      }
    }
  };
  const handleMouseUp = () => {
    setDragging(false);

    const x = parseInt(movableGrid.style.left);
    const y = parseInt(movableGrid.style.top);
    localStorage.setItem('movableGrid' + name, JSON.stringify({ x, y }));
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

  useEffect(() => {
    const movableGrid = document.querySelector('.movableGrid.'+name) as HTMLElement;
    const movableGridPosition = localStorage.getItem('movableGrid'+name);
    if (movableGrid && movableGridPosition) {
      const { x, y } = JSON.parse(movableGridPosition);
      movableGrid.style.left = x + 'px';
      movableGrid.style.top = y + 'px';
    }
  });

  return (
    <div className={"movableGrid " + name} onMouseDown={handleMouseDown}>
      <div className={"moveHandle " + name} style={{ opacity: editMode ? 1 : 0 }}>
        {name}
      </div>
      <div className={"grid-container " + name} style={{ opacity: editMode ? 1 : 0 }}>
        {grid.map((row, idx) => (
          <div
            key={idx.toString()}
            className="grid-row"
            style={{ height: 100 / gridRows + '%' }}
          >
            {row.map((col, idx2) =>
              callback ? (
                <div
                  key={idx2.toString()}
                  className="grid-cell"
                  onMouseEnter={(e) => callback(idx, idx2, e)}
                />
              ) : (
                <div key={idx2.toString()} className="grid-cell" />
              )
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ResizableGrid;

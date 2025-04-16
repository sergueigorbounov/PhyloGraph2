/**

 * @file AnimatedSplitPane.jsx

 * @description Advanced split pane component with smooth transitions

 */

import React, { useState, useEffect, useRef } from 'react';

import { motion } from 'framer-motion';


export default function AnimatedSplitPane({

  leftPane,

  rightPane,

  direction = 'horizontal',

  initialSplit = 50,

  minSize = 20,

  animationSpeed = 0.3,

  onChange

}) {

  const [splitRatio, setSplitRatio] = useState(initialSplit);

  const [isDragging, setIsDragging] = useState(false);

  const [initialPos, setInitialPos] = useState(0);

  const [initialSplitRatio, setInitialSplitRatio] = useState(initialSplit);

  

  const containerRef = useRef(null);

  

  // Update split ratio when props change

  useEffect(() => {

    setSplitRatio(initialSplit);

  }, [initialSplit]);

  

  const startDragging = (e) => {

    setIsDragging(true);

    setInitialPos(direction === 'horizontal' ? e.clientX : e.clientY);

    setInitialSplitRatio(splitRatio);

  };

  

  const handleMouseMove = (e) => {

    if (!isDragging || !containerRef.current) return;

    

    const containerRect = containerRef.current.getBoundingClientRect();

    const containerSize = direction === 'horizontal' ? containerRect.width : containerRect.height;

    const currentPos = direction === 'horizontal' ? e.clientX : e.clientY;

    const delta = currentPos - initialPos;

    const deltaPct = (delta / containerSize) * 100;

    

    const newSplitRatio = Math.max(

      minSize, 

      Math.min(100 - minSize, initialSplitRatio + deltaPct)

    );

    

    setSplitRatio(newSplitRatio);

    

    if (onChange) {

      onChange(newSplitRatio);

    }

  };

  

  const stopDragging = () => {

    setIsDragging(false);

  };

  

  useEffect(() => {

    if (isDragging) {

      window.addEventListener('mousemove', handleMouseMove);

      window.addEventListener('mouseup', stopDragging);

      document.body.style.cursor = direction === 'horizontal' ? 'col-resize' : 'row-resize';

      document.body.style.userSelect = 'none';

    } else {

      window.removeEventListener('mousemove', handleMouseMove);

      window.removeEventListener('mouseup', stopDragging);

      document.body.style.cursor = '';

      document.body.style.userSelect = '';

    }

    

    return () => {

      window.removeEventListener('mousemove', handleMouseMove);

      window.removeEventListener('mouseup', stopDragging);

      document.body.style.cursor = '';

      document.body.style.userSelect = '';

    };

  }, [isDragging, handleMouseMove, direction]);

  

  return (

    <div 

      ref={containerRef}

      className={`flex ${direction === 'horizontal' ? 'flex-row' : 'flex-col'} h-full w-full relative overflow-hidden`}

    >

      <motion.div 

        className="overflow-hidden"

        style={{

          [direction === 'horizontal' ? 'width' : 'height']: `${splitRatio}%`,

          transition: !isDragging ? `${direction === 'horizontal' ? 'width' : 'height'} ${animationSpeed}s ease-out` : 'none'

        }}

      >

        {leftPane}

      </motion.div>

      

      <div

        className={`absolute ${

          direction === 'horizontal' 

            ? 'cursor-col-resize top-0 bottom-0 w-1 hover:w-2' 

            : 'cursor-row-resize left-0 right-0 h-1 hover:h-2'

        } bg-zinc-600 hover:bg-green-500 z-10 transition-all ${isDragging ? 'bg-green-500' : ''}`}

        style={{

          [direction === 'horizontal' ? 'left' : 'top']: `${splitRatio}%`,

          transform: direction === 'horizontal' ? 'translateX(-50%)' : 'translateY(-50%)'

        }}

        onMouseDown={startDragging}

      />

      

      <motion.div 

        className="overflow-hidden"

        style={{

          [direction === 'horizontal' ? 'width' : 'height']: `${100 - splitRatio}%`,

          transition: !isDragging ? `${direction === 'horizontal' ? 'width' : 'height'} ${animationSpeed}s ease-out` : 'none'

        }}

      >

        {rightPane}

      </motion.div>

    </div>

  );

}

import React, { useEffect, useState } from 'react';

const AnimatedTechCube = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const cubeSize = isMobile ? 120 : 200;

  return (
    <div className="relative w-full h-64 bg-transparent">

      <style>
        {`
          @keyframes rotateCube {
            0% { transform: rotateX(0deg) rotateY(0deg); }
            100% { transform: rotateX(360deg) rotateY(360deg); }
          }

          .cube-container {
            perspective: ${isMobile ? '600px' : '1000px'};
          }

          .cube {
            transform-style: preserve-3d;
            animation: rotateCube 12s linear infinite;
          }

          .cube-face {
            position: absolute;
            width: ${cubeSize}px;
            height: ${cubeSize}px;
            background: rgba(126, 200, 227, 0.2);
            border: ${isMobile ? '1.5px' : '2px'} solid rgba(74, 158, 255, 0.4);
            backdrop-filter: blur(8px);
          }

          .front  { transform: rotateY(0deg) translateZ(${cubeSize/2}px); }
          .back   { transform: rotateY(180deg) translateZ(${cubeSize/2}px); }
          .right  { transform: rotateY(90deg) translateZ(${cubeSize/2}px); }
          .left   { transform: rotateY(-90deg) translateZ(${cubeSize/2}px); }
          .top    { transform: rotateX(90deg) translateZ(${cubeSize/2}px); }
          .bottom { transform: rotateX(-90deg) translateZ(${cubeSize/2}px); }
        `}
      </style>

      {/* Apenas o cubo */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div
          className="relative cube-container"
          style={{ width: cubeSize, height: cubeSize }}
        >
          <div className="cube w-full h-full">
            <div className="cube-face front" />
            <div className="cube-face back" />
            <div className="cube-face right" />
            <div className="cube-face left" />
            <div className="cube-face top" />
            <div className="cube-face bottom" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnimatedTechCube;

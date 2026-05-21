import { useEffect, useRef, useState } from 'react';

type Corner = 'left' | 'right';

const STORAGE_KEY = 'scrollBtnCorner';
const BUTTON_SIZE = 44;
const MARGIN = 20;
const DRAG_THRESHOLD = 5;

const loadCorner = (): Corner => {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored === 'left' ? 'left' : 'right';
};

export default function ScrollToTopButton() {
  const [visible, setVisible] = useState(false);
  const [corner, setCorner] = useState<Corner>(loadCorner);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);

  const draggingRef = useRef(false);
  const movedRef = useRef(false);
  const startPointRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 300);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const handleMove = (clientX: number, clientY: number) => {
      if (!draggingRef.current) return;
      const dx = clientX - startPointRef.current.x;
      const dy = clientY - startPointRef.current.y;
      if (!movedRef.current && Math.hypot(dx, dy) > DRAG_THRESHOLD) {
        movedRef.current = true;
        setIsDragging(true);
      }
      if (movedRef.current) setDragOffset({ x: dx, y: dy });
    };

    const handleEnd = (clientX: number) => {
      if (!draggingRef.current) return;
      draggingRef.current = false;

      if (movedRef.current) {
        const finalCorner: Corner = clientX < window.innerWidth / 2 ? 'left' : 'right';
        setCorner(finalCorner);
        localStorage.setItem(STORAGE_KEY, finalCorner);
        setIsDragging(false);
        setDragOffset({ x: 0, y: 0 });
      }
    };

    const onMouseMove = (e: MouseEvent) => handleMove(e.clientX, e.clientY);
    const onMouseUp = (e: MouseEvent) => handleEnd(e.clientX);
    const onTouchMove = (e: TouchEvent) => {
      const t = e.touches[0];
      if (t) handleMove(t.clientX, t.clientY);
    };
    const onTouchEnd = (e: TouchEvent) => {
      const t = e.changedTouches[0];
      if (t) handleEnd(t.clientX);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', onTouchEnd);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
    };
  }, []);

  const startDrag = (clientX: number, clientY: number) => {
    draggingRef.current = true;
    movedRef.current = false;
    startPointRef.current = { x: clientX, y: clientY };
  };

  const handleClick = () => {
    if (movedRef.current) {
      movedRef.current = false;
      return;
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const positionStyles =
    corner === 'right'
      ? { right: `${MARGIN}px`, bottom: `${MARGIN}px` }
      : { left: `${MARGIN}px`, bottom: `${MARGIN}px` };

  const transformStyle = isDragging
    ? `translate(${dragOffset.x}px, ${dragOffset.y}px)`
    : undefined;

  return (
    <button
      type="button"
      onClick={handleClick}
      onMouseDown={(e) => startDrag(e.clientX, e.clientY)}
      onTouchStart={(e) => {
        const t = e.touches[0];
        if (t) startDrag(t.clientX, t.clientY);
      }}
      aria-label="Scroll to top (drag left or right to reposition)"
      title="Click to scroll up. Drag to bottom-left or bottom-right."
      style={{
        ...positionStyles,
        width: `${BUTTON_SIZE}px`,
        height: `${BUTTON_SIZE}px`,
        transform: transformStyle,
        transition: isDragging ? 'none' : 'all 0.25s ease',
        touchAction: 'none',
        userSelect: 'none',
      }}
      className={`fixed z-40 rounded-full bg-gray-900 hover:bg-gray-800 text-white dark:bg-white dark:hover:bg-gray-100 dark:text-gray-900 shadow-lg flex items-center justify-center cursor-grab active:cursor-grabbing ${
        visible ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={2.5}
        stroke="currentColor"
        className="w-5 h-5 pointer-events-none"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 15.75 7.5-7.5 7.5 7.5" />
      </svg>
    </button>
  );
}

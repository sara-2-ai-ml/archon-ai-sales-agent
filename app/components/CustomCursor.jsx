"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";

export default function CustomCursor() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);

  useEffect(() => {
    const updateMousePosition = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    const handleMouseOver = (e) => {
      // Check if we are hovering over an interactive element
      if (
        e.target.tagName.toLowerCase() === "button" ||
        e.target.tagName.toLowerCase() === "a" ||
        e.target.closest("button") ||
        e.target.closest("a") ||
        e.target.classList.contains("archon-feat-card")
      ) {
        setIsHovering(true);
      } else {
        setIsHovering(false);
      }
    };

    window.addEventListener("mousemove", updateMousePosition);
    window.addEventListener("mouseover", handleMouseOver);

    return () => {
      window.removeEventListener("mousemove", updateMousePosition);
      window.removeEventListener("mouseover", handleMouseOver);
    };
  }, []);

  return (
    <>
      <motion.div
        className="archon-liquid-cursor"
        animate={{
          x: mousePosition.x - 100,
          y: mousePosition.y - 100,
          scale: isHovering ? 1.5 : 1,
          opacity: isHovering ? 1 : 0.85,
        }}
        // Instant tracking for position, only animate scale/opacity
        transition={{ scale: { duration: 0.2 }, opacity: { duration: 0.2 }, default: { duration: 0 } }}
      />
      {/* Small dot tracks instantly 1:1 like a real cursor */}
      <motion.div
        className="archon-cursor-inner"
        animate={{
          x: mousePosition.x - 5, // centered for 10px width
          y: mousePosition.y - 5,
          opacity: isHovering ? 0 : 1,
        }}
        transition={{ duration: 0 }}
      />
    </>
  );
}

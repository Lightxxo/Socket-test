import React, { useEffect, useState, useRef } from "react";

const Countdown = ({ initialSeconds, onComplete }) => {
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds);
  const endTimeRef = useRef(Date.now() + initialSeconds * 1000);

  useEffect(() => {
    const interval = setInterval(() => {
      const remaining = Math.round((endTimeRef.current - Date.now()) / 1000);
      setSecondsLeft(remaining);

      if (remaining <= 0) {
        clearInterval(interval);
        onComplete();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [onComplete]);

  const formatTime = (secs) => {
    const h = String(Math.floor(secs / 3600)).padStart(2, "0");
    const m = String(Math.floor((secs % 3600) / 60)).padStart(2, "0");
    const s = String(secs % 60).padStart(2, "0");
    return `${h}:${m}:${s}`;
  };

  return (
    <div
      style={{
        backgroundColor: "red",
        color: "white",
        padding: "20px 40px",
        borderRadius: "8px",
        fontSize: "2rem",
        fontFamily: "monospace",
      }}
    >
      {formatTime(Math.max(0, secondsLeft))}
    </div>
  );
};

export default Countdown;

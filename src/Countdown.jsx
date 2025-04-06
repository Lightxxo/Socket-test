import React, { useEffect, useState } from "react";

const Countdown = ({ initialSeconds, onComplete }) => {
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds);

  // Format seconds into hh:mm:ss
  const formatTime = (secs) => {
    const h = String(Math.floor(secs / 3600)).padStart(2, "0");
    const m = String(Math.floor((secs % 3600) / 60)).padStart(2, "0");
    const s = String(secs % 60).padStart(2, "0");
    return `${h}:${m}:${s}`;
  };

  useEffect(() => {
    if (secondsLeft <= 0) {
      onComplete();
      return;
    }
    const interval = setInterval(() => {
      setSecondsLeft((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [secondsLeft, onComplete]);

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
      {formatTime(secondsLeft)}
    </div>
  );
};

export default Countdown;

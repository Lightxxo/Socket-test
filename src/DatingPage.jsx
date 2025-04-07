import React, { useContext, useEffect, useRef, useState } from "react";
import { SocketContext } from "./SocketContext";
import { AppContext } from "./AppContext";
import Countdown from "./countdown";
import config from "./config";
import { on } from "events";

const { API } = config;

const DatingPage = ({ goToPage }) => {
  const timerControlsRef = useRef(null);
  const socket = useContext(SocketContext);
  const { sharedData, updateSharedData } = useContext(AppContext);
  const [remainingTime, setRemainingTime] = useState(sharedData.timer);
  const [isConfirmed, setIsConfirmed] = useState(null);
  const [matched, setMatched] = useState(false);

  useEffect(() => {
    if (sharedData.timerActive) {
      console.log("✅ Cancelling timeout since user arrived in dating room");

      // Cancel timeout if it's still active when user arrives in dating room
      if (sharedData.timeoutRef) {
        clearTimeout(sharedData.timeoutRef);
        updateSharedData({ timeoutRef: null }); // Clear the reference from sharedData
      }

      updateSharedData({ timerActive: false });
    }
  }, [sharedData, updateSharedData]);

  async function onLeave() {
    try {
      const response = await fetch(`${API}join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event_id: sharedData.event_id,
          user: sharedData.user,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log("Join response:", data);

        // Emit join events via socket
        socket.emit("switch_room", {
          from: sharedData.dateRoomId,
          to: sharedData.event_id,
        });

        // Navigate to waiting page
        goToPage("waiting");
      } else {
        console.error(
          "Failed to join, server responded with status:",
          response.status
        );
      }
    } catch (error) {
      console.error("Error submitting join form:", error);
    }
  }
  const onExtendRequest = async (data) => {
    setIsConfirmed(data.user_id);
    console.log("Received extend request:", data);
  };

  const onClicked = async (data) => {
    timerControlsRef.current?.addSeconds(30);
  };

  // Listen to the socket connect event
  useEffect(() => {
    socket.on("has_left", onLeave);
    socket.on("extend_request", onExtendRequest);
    socket.on("clicked", onClicked);

    return () => {
      socket.off("has_left", onLeave);
    };
  }, [socket]);

  const leaveDating = async () => {
    console.log("Timer finished — calling completion API");
    try {
      const res = await fetch(`${API}leaveDatingRoom`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event_id: sharedData.event_id,
          user_id: sharedData.user.user_id,
        }),
      });
    } catch (err) {
      console.error("Error calling dateComplete:", err);
    }
  };

  const extendFunc = async () => {
    console.log("Extending timer");
    try {
      const res = await fetch(`${API}extend`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dateRoomId: sharedData.dateRoomId,
          event_id: sharedData.event_id,
          user_id: sharedData.user.user_id,
        }),
      });
    } catch (err) {
      console.error("Error extending timer:", err);
    }
  };

  if (typeof sharedData.timer !== "number") {
    return (
      <div style={{ padding: "20px" }}>
        <h1>Dating Page</h1>
        <p>Loading timer…</p>
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        justifyContent: "center",
        alignItems: "center",
        padding: "20px",
      }}
    >
      <h1>Dating Page</h1>

      <Countdown
        initialSeconds={sharedData.timer}
        onComplete={leaveDating}
        bindControls={(controls) => (timerControlsRef.current = controls)}
        setRemainingTime={setRemainingTime}
      />
      {/* {remainingTime < 15 && (
        <button onClick={() => timerControlsRef.current?.addSeconds(10)}>
          Add 10 Seconds
        </button>
      )} */}

      {remainingTime < 25 && <button onClick={extendFunc}>Extend</button>}

      {isConfirmed !== null &&
        (isConfirmed === sharedData.user.user_id ? (
          <p>Waiting for confirmation...</p>
        ) : (
          <p>Other user has extended</p>
        ))}

      <button
        onClick={leaveDating}
        style={{
          marginTop: "20px",
          padding: "10px 20px",
          color: "white",
          backgroundColor: "red",
          border: "none",
          borderRadius: "5px",
        }}
      >
        Leave
      </button>
    </div>
  );
};

export default DatingPage;

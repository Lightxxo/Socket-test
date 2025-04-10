import React, { useContext, useEffect, useRef, useState } from "react";
import { SocketContext } from "./SocketContext";
import { AppContext } from "./AppContext";
import Countdown from "./countdown";
import config from "./config";

const { API } = config;

const DatingPage = ({ goToPage }) => {
  const timerControlsRef = useRef(null);
  const socket = useContext(SocketContext);
  const { sharedData } = useContext(AppContext);

  // ← guard state
  const [hasLeft, setHasLeft] = useState(false);

  const [remainingTime, setRemainingTime] = useState(sharedData.timer);
  const [isConfirmed, setIsConfirmed] = useState(null);
  const [matched, setMatched] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [isExtendDisabled, setIsExtendDisabled] = useState(false);



  // unified leave logic
  const leaveDating = async () => {
    // ← guard against multiple calls
    if (hasLeft) return;
    setHasLeft(true);

    console.log("Leaving dating room…");

    // 1) notify server that date is complete
    try {
      await fetch(`${API}leaveDatingRoom`, {
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

  // socket-driven “has_left”
  const onLeave = async () => {
    socket.emit("switch_room", {
      from: sharedData.dateRoomId,
      to: sharedData.event_id,
    });
    goToPage("waiting");
    try {
      const response = await fetch(`${API}join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event_id: sharedData.event_id,
          user: sharedData.user,
        }),
      });
      if (!response.ok) {
        console.error("Join failed:", response.status);
        goToPage("join");
      }
    } catch (error) {
      console.error("Error submitting join form:", error);
    }
  };

  const onExtendRequest = (data) => {
    setIsConfirmed(data.user_id);
  };

  const onClicked = (data) => {
    timerControlsRef.current?.addSeconds(30);
    setMatched(true);
    setShowModal(true);
  };

  useEffect(() => {


    socket.on("has_left", onLeave);
    socket.on("extend_request", onExtendRequest);
    socket.on("clicked", onClicked);

    
    return () => {
      socket.off("has_left", onLeave);
      socket.off("extend_request", onExtendRequest);
      socket.off("clicked", onClicked);
    };
  }, [socket, hasLeft]);

  const extendFunc = async () => {
    if (hasLeft) return;
    setIsExtendDisabled(true);
    try {
      await fetch(`${API}extend`, {
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
        minHeight: "100vh",
        justifyContent: "center",
        alignItems: "center",
        padding: "20px",
      }}
    >
      <h1 style={{ marginBottom: "20px" }}>Dating Page</h1>

      <Countdown
        initialSeconds={sharedData.timer}
        onComplete={leaveDating} // ← timer calls same leaveDating
        bindControls={(c) => (timerControlsRef.current = c)}
        setRemainingTime={setRemainingTime}
      />

      {!matched && remainingTime < 25 && (
        <button
          onClick={extendFunc}
          disabled={isExtendDisabled}
          style={{
            marginTop: 20,
            padding: "10px 20px",
            borderRadius: 5,
            border: "none",
            backgroundColor: isExtendDisabled ? "grey" : "#007bff",
            color: "white",
            cursor: isExtendDisabled ? "not-allowed" : "pointer",
          }}
        >
          Extend
        </button>
      )}

      {!matched && isConfirmed !== null && (
        <div style={{ marginTop: 20 }}>
          {isConfirmed === sharedData.user.user_id ? (
            <p style={{ color: "yellow" }}>Waiting for confirmation…</p>
          ) : (
            <p style={{ color: "green" }}>Other user has extended</p>
          )}
        </div>
      )}

      <button
        onClick={leaveDating}
        style={{
          marginTop: 20,
          padding: "10px 20px",
          color: "white",
          backgroundColor: "red",
          border: "none",
          borderRadius: 5,
          cursor: "pointer",
        }}
      >
        Leave
      </button>

      {matched && showModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            backgroundColor: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              backgroundColor: "black",
              padding: 30,
              borderRadius: 10,
              boxShadow: "0 2px 10px rgba(0,0,0,0.2)",
              textAlign: "center",
              minWidth: 250,
            }}
          >
            <h2 style={{ marginBottom: 20 }}>Clicked!</h2>
            <button
              onClick={() => setShowModal(false)}
              style={{
                padding: "10px 20px",
                borderRadius: 5,
                border: "none",
                backgroundColor: "#28a745",
                color: "white",
                cursor: "pointer",
              }}
            >
              Ok
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DatingPage;

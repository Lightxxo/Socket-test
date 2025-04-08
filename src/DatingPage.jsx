import React, { useContext, useEffect, useRef, useState } from "react";
import { SocketContext } from "./SocketContext";
import { AppContext } from "./AppContext";
import Countdown from "./countdown";
import config from "./config";

const { API } = config;

const DatingPage = ({ goToPage }) => {
  const timerControlsRef = useRef(null);
  const socket = useContext(SocketContext);
  const { sharedData, updateSharedData } = useContext(AppContext);
  const [remainingTime, setRemainingTime] = useState(sharedData.timer);
  const [isConfirmed, setIsConfirmed] = useState(null);
  const [matched, setMatched] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [isExtendDisabled, setIsExtendDisabled] = useState(false);

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
        goToPage("join");
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
    setMatched(true);
    setShowModal(true);
  };

  // Listen to the socket events
  useEffect(() => {
    socket.on("has_left", onLeave);
    socket.on("extend_request", onExtendRequest);
    socket.on("clicked", onClicked);

    return () => {
      socket.off("has_left", onLeave);
      socket.off("extend_request", onExtendRequest);
      socket.off("clicked", onClicked);
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
    // Disable the extend button once pressed
    setIsExtendDisabled(true);
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
        minHeight: "100vh",
        justifyContent: "center",
        alignItems: "center",
        padding: "20px",
      }}
    >
      <h1 style={{ marginBottom: "20px" }}>Dating Page</h1>

      <Countdown
        initialSeconds={sharedData.timer}
        onComplete={leaveDating}
        bindControls={(controls) => (timerControlsRef.current = controls)}
        setRemainingTime={setRemainingTime}
      />

      {/* Extend Button: Only show if not matched and remainingTime < 25 */}
      {!matched && remainingTime < 25 && (
        <button
          onClick={extendFunc}
          disabled={isExtendDisabled}
          style={{
            marginTop: "20px",
            padding: "10px 20px",
            borderRadius: "5px",
            border: "none",
            backgroundColor: isExtendDisabled ? "grey" : "#007bff",
            color: "white",
            cursor: isExtendDisabled ? "not-allowed" : "pointer",
          }}
        >
          Extend
        </button>
      )}

      {/* Conditional Text - Hidden when matched is true */}
      {!matched && isConfirmed !== null && (
        <div style={{ marginTop: "20px" }}>
          {isConfirmed === sharedData.user.user_id ? (
            <p style={{ color: "yellow", margin: "0" }}>
              Waiting for confirmation...
            </p>
          ) : (
            <p style={{ color: "green", margin: "0" }}>
              Other user has extended
            </p>
          )}
        </div>
      )}

      {/* Leave Button */}
      <button
        onClick={leaveDating}
        style={{
          marginTop: "20px",
          padding: "10px 20px",
          color: "white",
          backgroundColor: "red",
          border: "none",
          borderRadius: "5px",
          cursor: "pointer",
        }}
      >
        Leave
      </button>

      {/* Modal */}
      {matched && showModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              backgroundColor: "black",
              padding: "30px",
              borderRadius: "10px",
              boxShadow: "0 2px 10px rgba(0,0,0,0.2)",
              textAlign: "center",
              minWidth: "250px",
            }}
          >
            <h2 style={{ marginBottom: "20px" }}>Clicked!</h2>
            <button
              onClick={() => setShowModal(false)}
              style={{
                padding: "10px 20px",
                borderRadius: "5px",
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

// App.js
import React, { useRef, useState } from "react";
import { io } from "socket.io-client";
import config from "./config";
import { SocketContext } from "./SocketContext";
import { AppProvider } from "./AppContext";
import JoinPage from "./JoinPage";
import WaitingPage from "./WaitingPage";
import DatingPage from "./DatingPage";

const { API } = config;

const App = () => {
  // Use a ref to store the socket instance so it is created only once.
  const socketRef = useRef();
  if (!socketRef.current) {
    socketRef.current = io(API);
  }
  const socket = socketRef.current;

  const [currentPage, setCurrentPage] = useState("join");

  const goToPage = (page) => {
    setCurrentPage(page);
  };

  const renderPage = () => {
    switch (currentPage) {
      case "join":
        return <JoinPage goToPage={goToPage} />;
      case "waiting":
        return <WaitingPage goToPage={goToPage} />;
      case "dating":
        return <DatingPage goToPage={goToPage} />;
      default:
        return <JoinPage goToPage={goToPage} />;
    }
  };

  return (
    <AppProvider>
      <SocketContext.Provider value={socket}>
        <div>
          {renderPage()}
          {/* Global Navigation */}
          <div style={{ padding: "20px", borderTop: "1px solid #ccc" }}>
            <button
              onClick={() => goToPage("join")}
              style={{ marginRight: "10px" }}
            >
              Join
            </button>
            <button
              onClick={() => goToPage("waiting")}
              style={{ marginRight: "10px" }}
            >
              Waiting
            </button>
            <button onClick={() => goToPage("dating")}>Dating</button>
          </div>
        </div>
      </SocketContext.Provider>
    </AppProvider>
  );
};

export default App;

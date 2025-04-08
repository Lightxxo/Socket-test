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
    socketRef.current = io(API, {
      query: {
        event_id: 1,
        user_id: 1,
        gender: "F",
        interested: "M",
      },
    });
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
        <div>{renderPage()}</div>
      </SocketContext.Provider>
    </AppProvider>
  );
};

export default App;

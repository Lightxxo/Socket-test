import React, { useState } from "react";
import JoinPage from "./JoinPage";
import WaitingPage from "./WaitingPage";
import DatingPage from "./DatingPage";
import { SocketProvider } from "./SocketContext";
import { AppProvider } from "./AppContext";

const App = () => {
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
      <SocketProvider>
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
      </SocketProvider>
    </AppProvider>
  );
};

export default App;

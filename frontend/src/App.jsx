
import { useState } from "react";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";

import { useAuth } from "./context/AuthContext";

function App() {
  const { user, loading } = useAuth();

  const [showRegister, setShowRegister] = useState(false);

  if (loading) {
    return <h1>Loading...</h1>;
  }

  if (user) {
    return <Dashboard />;
  }

  if (showRegister) {
    return (
      <Register
        onLogin={() => setShowRegister(false)}
      />
    );
  }

  return (
    <Login
      onRegister={() => setShowRegister(true)}
    />
  );
}

export default App;


import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";

import { useAuth } from "./context/AuthContext";

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return <h1>Loading...</h1>;
  }

  if (user) {
    return <Dashboard />;
  }

  return (
    <div>
      <Login />

      <hr />

      <Register />
    </div>
  );
}

export default App;

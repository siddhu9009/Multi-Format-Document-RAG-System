
import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import {
  loginUser,
  getCurrentUser,
} from "../services/api";


const AuthContext = createContext();


export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);


  // -------------------------
  // Login
  // -------------------------

  async function login(email, password) {
    const data = await loginUser({
      email,
      password,
    });

    localStorage.setItem(
      "access_token",
      data.access_token
    );

    localStorage.setItem(
      "user",
      JSON.stringify(data.user)
    );

    setUser(data.user);

    return data;
  }


  // -------------------------
  // Logout
  // -------------------------

  function logout() {
    localStorage.removeItem("access_token");
    localStorage.removeItem("user");

    setUser(null);
  }


  // -------------------------
  // Check authentication
  // -------------------------

  useEffect(() => {
    async function checkAuthentication() {
      const token = localStorage.getItem("access_token");

      // No token means user is not logged in
      if (!token) {
        setLoading(false);
        return;
      }


      try {
        // Ask FastAPI to verify the JWT
        const data = await getCurrentUser();

        // JWT is valid
        setUser(data.user);

        // Update stored user information
        localStorage.setItem(
          "user",
          JSON.stringify(data.user)
        );

      } catch (error) {
        // JWT is invalid or expired

        console.error("Authentication check failed:", error);

        setUser(null);

      } finally {
        setLoading(false);
      }
    }


    checkAuthentication();
  }, []);


  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}


export function useAuth() {
  return useContext(AuthContext);
}



import { useState } from "react";
import { useAuth } from "../context/AuthContext";

function Login({ onRegister }) {
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleLogin(event) {
    event.preventDefault();

    setMessage("");
    setError("");

    try {
      await login(email, password);

      setMessage("Login successful");
    } catch (error) {
      setError(error.message);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">

        <div className="auth-header">
          <div className="auth-logo">
            <svg width="18" height="22" viewBox="0 0 16 20" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round">
              <path d="M1.5 3A1.5 1.5 0 013 1.5h6.5L14.5 6v11A1.5 1.5 0 0113 18.5H3A1.5 1.5 0 011.5 17V3z" />
              <path d="M9.5 1.5V6h5" strokeLinecap="round" />
              <line x1="4.5" y1="10.5" x2="11" y2="10.5" strokeWidth="1" opacity=".4" strokeLinecap="round" />
              <line x1="4.5" y1="13.5" x2="9" y2="13.5" strokeWidth="1" opacity=".4" strokeLinecap="round" />
            </svg>
          </div>

          <h1>Welcome back</h1>

          <p>
            Sign in to your document workspace.
          </p>
        </div>

        <form
          className="auth-form"
          onSubmit={handleLogin}
        >
          <div className="form-group">
            <label htmlFor="login-email">
              Email
            </label>

            <input
              id="login-email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(event) =>
                setEmail(event.target.value)
              }
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="login-password">
              Password
            </label>

            <input
              id="login-password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(event) =>
                setPassword(event.target.value)
              }
              required
            />
          </div>

          <button
            className="auth-button"
            type="submit"
          >
            Continue to workspace
          </button>
        </form>

        {message && (
          <p className="success-message">
            {message}
          </p>
        )}

        {error && (
          <p className="auth-error">
            {error}
          </p>
        )}

        <div className="auth-switch">
          <span>
            Don't have an account?
          </span>

          <button
            type="button"
            className="auth-link"
            onClick={onRegister}
          >
            Create account
          </button>
        </div>

      </div>
    </div>
  );
}

export default Login;

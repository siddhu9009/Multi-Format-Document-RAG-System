
import { useState } from "react";
import { registerUser } from "../services/api";

function Register({ onLogin }) {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleRegister(event) {
    event.preventDefault();

    setMessage("");
    setError("");

    try {
      const data = await registerUser({
        username,
        email,
        password,
      });

      setMessage(data.message);

      setUsername("");
      setEmail("");
      setPassword("");
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

          <h1>Create your workspace</h1>

          <p>
            Set up a private workspace for your
            documents and conversations.
          </p>
        </div>

        <form
          className="auth-form"
          onSubmit={handleRegister}
        >
          <div className="form-group">
            <label htmlFor="register-username">
              Username
            </label>

            <input
              id="register-username"
              type="text"
              placeholder="Choose a username"
              value={username}
              onChange={(event) =>
                setUsername(event.target.value)
              }
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="register-email">
              Email
            </label>

            <input
              id="register-email"
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
            <label htmlFor="register-password">
              Password
            </label>

            <input
              id="register-password"
              type="password"
              placeholder="Create a secure password"
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
            Create account
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
            Already have an account?
          </span>

          <button
            type="button"
            className="auth-link"
            onClick={onLogin}
          >
            Sign in
          </button>
        </div>

      </div>
    </div>
  );
}

export default Register;

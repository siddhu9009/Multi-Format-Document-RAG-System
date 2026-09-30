import { useState } from "react";
import { useAuth } from "../context/AuthContext";

function Login({ onRegister }) {
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleLogin(event) {
    event.preventDefault();

    setMessage("");
    setError("");
    setLoading(true);

    try {
      await login(email, password);

      setMessage("Login successful");
    } catch (error) {
      setError(error.message || "Unable to sign in. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">

        {/* Logo + Header */}
        <div className="auth-header">

          <div className="auth-logo">
            {/* Replace logo.png with your final logo */}
            <img
              src="/logo.png"
              alt="Document AI"
            />
          </div>

          <div className="auth-brand">
            <span>Document AI</span>
          </div>

          <h1>Welcome back</h1>

          <p>
            Sign in to continue working with your documents.
          </p>
        </div>

        {/* Login Form */}
        <form className="auth-form" onSubmit={handleLogin}>

          <div className="form-group">
            <label htmlFor="login-email">
              Email address
            </label>

            <input
              id="login-email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              required
            />
          </div>

          <div className="form-group">
            <div className="form-label-row">
              <label htmlFor="login-password">
                Password
              </label>
            </div>

            <div className="password-input-wrapper">
              <input
                id="login-password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
                required
              />

              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={
                  showPassword
                    ? "Hide password"
                    : "Show password"
                }
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          <button
            className="auth-button"
            type="submit"
            disabled={loading}
          >
            {loading ? "Signing in..." : "Continue to workspace"}
          </button>

        </form>

        {/* Status Messages */}
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

        {/* Register */}
        <div className="auth-switch">
          <span>Don't have an account?</span>

          <button
            type="button"
            className="auth-link"
            onClick={onRegister}
          >
            Create account
          </button>
        </div>

        {/* Security Note */}
        <div className="auth-security">
          <span className="security-dot"></span>
          Your documents and conversations are private to your account.
        </div>

      </div>
    </div>
  );
}

export default Login;
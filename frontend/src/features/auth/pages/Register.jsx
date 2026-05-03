import React, { useState, useMemo } from "react";
import "../auth.form.scss";
import { Link, useNavigate } from "react-router";
import { useAuth } from "../hooks/useAuth.js";
import { Eye, EyeOff, Mail, Lock, User, ArrowRight, Sparkles, Loader2, Check } from "lucide-react";

const Register = () => {
  const navigate = useNavigate();
  const { loading, handleRegister } = useAuth();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const passwordStrength = useMemo(() => {
    if (!password) return { score: 0, label: "", color: "" };
    let score = 0;
    if (password.length >= 6) score++;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    const levels = [
      { label: "", color: "" },
      { label: "Weak", color: "#ef4444" },
      { label: "Fair", color: "#f59e0b" },
      { label: "Good", color: "#f59e0b" },
      { label: "Strong", color: "#22c55e" },
      { label: "Excellent", color: "#10b981" },
    ];
    return { score, ...levels[score] };
  }, [password]);

  const passwordsMatch = confirmPassword && password === confirmPassword;
  const formValid = username && email && password.length >= 6 && passwordsMatch;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formValid) return;
    const success = await handleRegister(username, email, password);
    if (success) navigate("/login");
  };

  return (
    <div className="auth-page">
      <div className="auth-card-container">
        
        <div className="auth-brand-center">
          <div className="brand-icon"><Sparkles size={24} /></div>
          <h1>InterviewAI</h1>
        </div>

        <div className="auth-card">
          <div className="auth-header">
            <h2>Create account</h2>
            <p>Get started with your free account</p>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-field">
              <label htmlFor="reg-username">Full name</label>
              <div className="input-wrapper">
                <User size={18} className="input-icon" />
                <input
                  onChange={(e) => setUsername(e.target.value)}
                  value={username}
                  type="text"
                  id="reg-username"
                  placeholder="John Doe"
                  required
                  autoComplete="name"
                />
              </div>
            </div>

            <div className="form-field">
              <label htmlFor="reg-email">Email address</label>
              <div className="input-wrapper">
                <Mail size={18} className="input-icon" />
                <input
                  onChange={(e) => setEmail(e.target.value)}
                  value={email}
                  type="email"
                  id="reg-email"
                  placeholder="you@example.com"
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="form-field">
              <label htmlFor="reg-password">Password</label>
              <div className="input-wrapper">
                <Lock size={18} className="input-icon" />
                <input
                  onChange={(e) => setPassword(e.target.value)}
                  value={password}
                  type={showPassword ? "text" : "password"}
                  id="reg-password"
                  placeholder="Min 6 characters"
                  required
                  minLength={6}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="toggle-password"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              
              {password && (
                <div className="strength-meter">
                  <div className="strength-meter-header">
                    <span>Password strength</span>
                    <span style={{ color: passwordStrength.color }}>{passwordStrength.label}</span>
                  </div>
                  <div className="strength-bar-container">
                    {[1, 2, 3, 4, 5].map((level) => (
                      <div 
                        key={level} 
                        className="strength-segment"
                        style={{ 
                          background: level <= passwordStrength.score ? passwordStrength.color : '#e2e8f0',
                          opacity: level <= passwordStrength.score ? 1 : 0.5
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="form-field">
              <label htmlFor="reg-confirm">Confirm password</label>
              <div className={`input-wrapper ${confirmPassword ? (passwordsMatch ? 'valid' : 'invalid') : ''}`}>
                <Lock size={18} className="input-icon" />
                <input
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  value={confirmPassword}
                  type={showConfirm ? "text" : "password"}
                  id="reg-confirm"
                  placeholder="Re-enter password"
                  required
                  autoComplete="new-password"
                />
                {confirmPassword && passwordsMatch && <Check size={18} className="match-icon" />}
                <button
                  type="button"
                  className="toggle-password"
                  onClick={() => setShowConfirm(!showConfirm)}
                  tabIndex={-1}
                  aria-label={showConfirm ? "Hide password" : "Show password"}
                >
                  {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {confirmPassword && !passwordsMatch && (
                <span className="field-error">Passwords do not match</span>
              )}
            </div>

            <button type="submit" className="auth-submit" disabled={loading || !formValid}>
              {loading ? (
                <><Loader2 size={18} className="spin" /> Creating account...</>
              ) : (
                <>Create Account <ArrowRight size={18} /></>
              )}
            </button>
          </form>

          <div className="auth-footer">
            <p>Already have an account? <Link to="/login">Sign in</Link></p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Register;

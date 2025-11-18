import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

// CSS-only single-file React component (no Tailwind required)
// Drop this file into your React project (e.g. src/LoginPage.jsx) and import it where needed.

function LoginPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const COLORS = {
    primary: '#f0ceaa',
    secondary: '#e0be9c',
    textDark: '#8b6655',
    textMuted: 'rgba(139,102,85,0.7)',
    link: '#c19a82',
    error: '#d97757',
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:8080/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const text = await response.text();
      let data = null;
      try { data = text ? JSON.parse(text) : null; } catch (_) { data = null; }

      if (response.ok) {
        if (data && data.token) {
          localStorage.setItem('token', data.token);
          setIsSuccess(true);
          setTimeout(() => navigate('/'), 1200);
        } else {
          // success status but no token
          alert('로그인 성공했지만 토큰이 없습니다. 콘솔을 확인하세요.');
          console.warn('No token in response:', data, text);
          navigate('/');
        }
      } else {
        const msg = data?.message || text || `로그인 실패 (status ${response.status})`;
        setError(msg);
        alert(msg);
      }
    } catch (err) {
      console.error('로그인 중 에러 발생:', err);
      setError('네트워크 오류가 발생했습니다.');
      alert('네트워크 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = () => setShowPassword((s) => !s);

  return (
    <div className="lp-root">
      <style>{`
        /* Root page */
        .lp-root { min-height:100vh; display:flex; align-items:center; justify-content:center; padding:24px; background:linear-gradient(135deg,#faf9f6 0%, #f0ede8 100%); font-family:Inter, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial; }

        /* Soft floating blobs (decorative) */
        .lp-blob { position:fixed; filter:blur(60px); pointer-events:none; opacity:0.6; }
        .lp-blob.b1 { width:360px; height:200px; left:-60px; top:-40px; background:linear-gradient(45deg, rgba(240,206,170,0.35), rgba(224,190,156,0.22)); border-radius:48%; }
        .lp-blob.b2 { width:260px; height:160px; right:-40px; top:220px; background:linear-gradient(45deg, rgba(210,180,140,0.28), rgba(195,165,125,0.18)); border-radius:46%; }

        /* Card container (fixed max width 420px) */
        .lp-card-wrap { width:100%; max-width:420px; margin:0 auto; padding:0 12px; z-index:2; }
        .lp-card { background:rgba(255,255,255,0.92); backdrop-filter:blur(8px); border-radius:28px; padding:36px; box-shadow:0 14px 40px rgba(20,20,20,0.06); border:1px solid rgba(255,255,255,0.5); position:relative; overflow:hidden; }

        /* Header */
        .lp-logo-wrap { text-align:center; margin-bottom:18px; }
        .lp-logo-circle { width:64px; height:64px; margin:0 auto 10px; border-radius:50%; display:flex; align-items:center; justify-content:center; background:linear-gradient(135deg, ${COLORS.primary}, ${COLORS.secondary}); box-shadow:0 8px 18px rgba(240,206,170,0.25); }
        .lp-logo { width:32px; height:32px; color:${COLORS.textDark}; opacity:0.9; }
        .lp-title { font-size:20px; color:${COLORS.textDark}; font-weight:600; margin:0 0 6px; }
        .lp-sub { margin:0; color:${COLORS.textMuted}; font-size:13px; }

        /* Form */
        .lp-form { width:100%; margin-top:8px; }
        .lp-field {
  position: relative;
  margin-bottom: 16px;
  display: flex;
  align-items: center; /* input과 label 세로 중앙 정렬 */
}

.lp-input {
  width: 100%;
  padding: 14px 44px 14px 12px;
  border-radius: 12px;
  border: 1px solid rgba(200,170,140,0.35);
  background: rgba(255,255,255,0.8);
  font-size: 15px;
  color: ${COLORS.textDark};
  outline: none;
}

.lp-label {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 15px;
  color: ${COLORS.textMuted};
  pointer-events: none;
  transition: all .18s;
}

/* input에 값이 들어가거나 focus 되었을 때 label 위치 위로 이동 */
.lp-input:not(:placeholder-shown) + .lp-label,
.lp-input:focus + .lp-label {
  top: 6px;        /* 중앙보다 조금 위로 */
  font-size: 12px;  /* 글자 크기 축소 */
  color: ${COLORS.textDark};
}

        .lp-error { color:${COLORS.error}; font-size:12px; margin-top:6px; min-height:16px; }

        /* password toggle */
        .lp-toggle { position:absolute; right:8px; top:50%; transform:translateY(-50%); width:36px; height:36px; border-radius:8px; display:flex; align-items:center; justify-content:center; background:transparent; border:none; cursor:pointer; }

        /* options row */
        .lp-options { display:flex; justify-content:space-between; align-items:center; gap:12px; margin-bottom:18px; font-size:13px; color:${COLORS.textDark}; }
        .lp-remember { display:flex; align-items:center; gap:8px; }
        .lp-remember input { width:16px; height:16px; }
        .lp-forgot { color:${COLORS.link}; text-decoration:none; }

        /* submit button */
        .lp-submit { width:100%; padding:14px; border-radius:12px; border:none; cursor:pointer; font-weight:600; font-size:15px; background:linear-gradient(90deg, ${COLORS.primary}, ${COLORS.secondary}); color:${COLORS.textDark}; box-shadow:0 8px 18px rgba(240,206,170,0.22); transition:transform .12s, opacity .12s; }
        .lp-submit:disabled { opacity:0.7; cursor:not-allowed; transform:none; }
        .lp-submit:not(:disabled):active { transform:translateY(1px); }

        /* alternative login */
        .lp-divider { display:flex; align-items:center; gap:10px; margin:20px 0; }
        .lp-divider-line { flex:1; height:1px; background:linear-gradient(90deg, transparent, rgba(200,170,140,0.25), transparent); }
        .lp-divider-text { font-size:12px; color:${COLORS.textMuted}; }
        .lp-socials { display:flex; gap:10px; }
        .lp-social-btn { flex:1; padding:10px; border-radius:10px; border:1px solid rgba(200,170,140,0.28); background:rgba(255,255,255,0.85); display:flex; align-items:center; justify-content:center; gap:8px; cursor:pointer; }

        /* success state */
        .lp-success { text-align:center; padding:8px 0; }
        .lp-check { width:48px; height:48px; margin:0 auto 10px; color:${COLORS.textDark}; }

        /* small screens adjustments */
        @media (max-width:420px) {
          .lp-card { padding:24px; border-radius:20px; }
        }
      `}</style>

      {/* decorative blobs */}
      <div className="lp-blob b1" aria-hidden />
      <div className="lp-blob b2" aria-hidden />

      <div className="lp-card-wrap">
        <div className="lp-card">
          {!isSuccess && (
            <div className="lp-logo-wrap">
              <div className="lp-logo-circle" aria-hidden>
                {/* fixed SVG size (32x32) */}
                <svg className="lp-logo" viewBox="0 0 32 32" width="32" height="32" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M16 2C8.3 2 2 8.3 2 16s6.3 14 14 14 14-6.3 14-14S23.7 2 16 2z" stroke="currentColor" strokeWidth="1.2" />
                  <path d="M12 16a4 4 0 108 0" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                </svg>
              </div>
              <h2 className="lp-title">로그인</h2>
              <p className="lp-sub">Welcome back</p>
            </div>
          )}

          {isSuccess ? (
            <div className="lp-success">
              <svg className="lp-check" viewBox="0 0 28 28" width="48" height="48" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M8 14l5 5 11-11" />
              </svg>
              <h3 style={{ margin: '6px 0', color: COLORS.textDark }}>Welcome!</h3>
              <p style={{ margin:0, color: COLORS.textMuted }}>Taking you to your dashboard...</p>
            </div>
          ) : (
            <form className="lp-form" onSubmit={handleSubmit} noValidate>
              <div className="lp-field">
                <input
                  id="username"
                  name="username"
                  className="lp-input"
                  placeholder=" "
                  value={formData.username}
                  onChange={handleChange}
                />
                <label htmlFor="username" className="lp-label">사용자 이름 (Username)</label>
                <div className="lp-error" aria-live="polite">{error ? error : ''}</div>
              </div>

              <div className="lp-field">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  className="lp-input"
                  placeholder=" "
                  value={formData.password}
                  onChange={handleChange}
                />
                <label htmlFor="password" className="lp-label">비밀번호 (Password)</label>
                <button type="button" className="lp-toggle" onClick={togglePasswordVisibility} aria-label="Toggle password visibility">
                  {showPassword ? (
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.4"><path d="M3 3l14 14" /></svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.4"><path d="M10 3c-4.5 0-8.3 3.8-9 7 .7 3.2 4.5 7 9 7s8.3-3.8 9-7c-.7 3.2-4.5-7-9-7z" /><circle cx="10" cy="10" r="3" /></svg>
                  )}
                </button>
              </div>

              <div className="lp-options">
                <label className="lp-remember"><input type="checkbox" /> Remember me</label>
                <a className="lp-forgot" href="#">Forgot password?</a>
              </div>

              <button className="lp-submit" type="submit" disabled={isLoading}>
                {isLoading ? 'Signing...' : 'Sign in'}
              </button>

              <div className="lp-divider">
                <div className="lp-divider-line" />
                <div className="lp-divider-text">or continue with</div>
                <div className="lp-divider-line" />
              </div>

              <div className="lp-socials">
                <button type="button" className="lp-social-btn" onClick={() => alert('Google 로그인 (모의)')}>
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M9 7.4v3.2h4.6c-.2 1-.8 1.8-1.6 2.4v2h2.6c1.5-1.4 2.4-3.4 2.4-5.8 0-.6 0-1.1-.1-1.6H9z" fill="#4285F4"/></svg>
                  <span>Google</span>
                </button>
                <button type="button" className="lp-social-btn" onClick={() => alert('Facebook 로그인 (모의)')}>
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="#1877F2"><path d="M18 9C18 4.03 13.97 0 9 0S0 4.03 0 9c0 4.49 3.29 8.21 7.59 9v-6.37H5.31V9h2.28V7.02c0-2.25 1.34-3.49 3.39-3.49.98 0 2.01.18 2.01.18v2.21h-1.13c-1.11 0-1.46.69-1.46 1.4V9h2.49l-.4 2.63H10.4V18C14.71 17.21 18 13.49 18 9z"/></svg>
                  <span>Facebook</span>
                </button>
              </div>

              <div style={{ textAlign: 'center', marginTop: 14, fontSize:13, color: COLORS.textMuted }}>
                <span>계정이 없으신가요? </span>
                <a href="/register" style={{ color: COLORS.link, fontWeight:600 }}>회원가입</a>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
// frontend/src/pages/CreateDiaryPage.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function CreateDiaryPage() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({ title: '', content: '' });
  const [imageFile, setImageFile] = useState(null);
  const [isPublic, setIsPublic] = useState(false); // 전체 공개 여부
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

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
    if (error) setError(null);
    if (successMsg) setSuccessMsg(null);
  };

  const handleFileChange = (e) => {
    setImageFile(e.target.files?.[0] ?? null);
    if (error) setError(null);
    if (successMsg) setSuccessMsg(null);
  };

  const handlePublicChange = (e) => {
    setIsPublic(e.target.checked);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    const dataToSend = new FormData();
    dataToSend.append('title', formData.title);
    dataToSend.append('content', formData.content);
    dataToSend.append('isPublic', isPublic); // 전체 공개 여부
    if (imageFile) dataToSend.append('image', imageFile);

    try {
      const token = localStorage.getItem('token');

      const res = await fetch('http://localhost:8080/api/diary/', {
        method: 'POST',
        headers: {
          Authorization: token ? `Bearer ${token}` : '',
        },
        body: dataToSend,
      });

      const txt = await res.text();
      let body = null;
      try { body = txt ? JSON.parse(txt) : null; } catch (_) { body = null; }

      if (res.ok) {
        setSuccessMsg('일기가 성공적으로 작성되었습니다!');
        setTimeout(() => navigate('/'), 900);
      } else {
        const msg = body?.message || txt || `일기 작성 실패 (status ${res.status})`;
        setError(msg);
      }
    } catch (err) {
      console.error('일기 작성 중 에러:', err);
      setError('네트워크 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="lp-root">
      <style>{`
        .lp-root { min-height:100vh; display:flex; align-items:center; justify-content:center; padding:24px; background:linear-gradient(135deg,#faf9f6 0%, #f0ede8 100%); font-family:Inter, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial;}
        .lp-blob { position:fixed; filter:blur(60px); pointer-events:none; opacity:0.6; }
        .lp-blob.b1 { width:360px; height:200px; left:-60px; top:-40px; background:linear-gradient(45deg, rgba(240,206,170,0.35), rgba(224,190,156,0.22)); border-radius:48%; }
        .lp-blob.b2 { width:260px; height:160px; right:-40px; top:220px; background:linear-gradient(45deg, rgba(210,180,140,0.28), rgba(195,165,125,0.18)); border-radius:46%; }

        .lp-card-wrap { width:100%; max-width:420px; margin:0 auto; padding:0 12px; z-index:2; }
        .lp-card { background:rgba(255,255,255,0.92); backdrop-filter:blur(8px); border-radius:28px; padding:36px; box-shadow:0 14px 40px rgba(20,20,20,0.06); border:1px solid rgba(255,255,255,0.5); position:relative; overflow:hidden; }

        .lp-logo-wrap { text-align:center; margin-bottom:18px; }
        .lp-logo-circle { width:64px; height:64px; margin:0 auto 10px; border-radius:50%; display:flex; align-items:center; justify-content:center; background:linear-gradient(135deg, ${COLORS.primary}, ${COLORS.secondary}); box-shadow:0 8px 18px rgba(240,206,170,0.25); }
        .lp-logo { width:32px; height:32px; color:${COLORS.textDark}; opacity:0.9; }
        .lp-title { font-size:20px; color:${COLORS.textDark}; font-weight:600; margin:0 0 6px; }
        .lp-sub { margin:0; color:${COLORS.textMuted}; font-size:13px; }

        .lp-form { width:100%; margin-top:8px; }
        .lp-field { position:relative; margin-bottom:16px; }
        .lp-input, .lp-textarea { width:100%; box-sizing:border-box; padding:14px 44px 14px 12px; border-radius:12px; border:1px solid rgba(200,170,140,0.35); background:rgba(255,255,255,0.8); font-size:15px; color:${COLORS.textDark}; outline:none; transition:box-shadow .18s, border-color .18s; }
        .lp-textarea { padding:12px; min-height:120px; resize:vertical; }
        .lp-input:focus, .lp-textarea:focus { box-shadow:0 6px 18px rgba(240,206,170,0.18); border-color:${COLORS.primary}; }
        .lp-label { position:absolute; left:12px; top:50%; transform:translateY(-50%); pointer-events:none; font-size:15px; color:${COLORS.textMuted}; transition:all .18s; }
        .lp-input:not(:placeholder-shown) + .lp-label, .lp-input:focus + .lp-label,
        .lp-textarea:not(:placeholder-shown) + .lp-label, .lp-textarea:focus + .lp-label { top:8px; font-size:12px; color:${COLORS.textDark}; }

        .lp-error { color:${COLORS.error}; font-size:12px; margin-top:6px; min-height:16px; }
        .lp-success { color: ${COLORS.primary}; font-size:13px; margin-top:6px; min-height:16px; }

        .lp-file { padding:10px 12px; border-radius:12px; border:1px dashed rgba(200,170,140,0.25); background:rgba(255,255,255,0.85); color:${COLORS.textDark}; }

        .lp-toggle { position:absolute; right:8px; top:50%; transform:translateY(-50%); width:36px; height:36px; border-radius:8px; display:flex; align-items:center; justify-content:center; background:transparent; border:none; cursor:pointer; }

        .lp-options { display:flex; justify-content:space-between; align-items:center; gap:12px; margin-bottom:18px; font-size:13px; color:${COLORS.textDark}; }

        .lp-submit { width:100%; padding:14px; border-radius:12px; border:none; cursor:pointer; font-weight:600; font-size:15px; background:linear-gradient(90deg, ${COLORS.primary}, ${COLORS.secondary}); color:${COLORS.textDark}; box-shadow:0 8px 18px rgba(240,206,170,0.22); transition:transform .12s, opacity .12s; }
        .lp-submit:disabled { opacity:0.7; cursor:not-allowed; transform:none; }
        .lp-submit:not(:disabled):active { transform:translateY(1px); }

        /* 체크박스 스타일 */
        .lp-label-checkbox {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 12px;
          font-size: 14px;
          color: ${COLORS.textDark};
          border-radius: 12px;
          border: 1px solid rgba(200,170,140,0.25);
          background: rgba(255,255,255,0.85);
          cursor: pointer;
          user-select: none;
          transition: background .15s, border-color .15s;
        }
        .lp-label-checkbox::before {
          content: '';
          display: inline-block;
          width: 16px;
          height: 16px;
          border: 1.5px solid ${COLORS.textMuted};
          border-radius: 4px;
          background-color: white;
        }
        input[type="checkbox"]:checked + .lp-label-checkbox::before {
          background-color: ${COLORS.primary};
          border-color: ${COLORS.primary};
        }

        @media (max-width:420px) { .lp-card { padding:24px; border-radius:20px; } }
      `}</style>

      <div className="lp-blob b1" aria-hidden />
      <div className="lp-blob b2" aria-hidden />

      <div className="lp-card-wrap">
        <div className="lp-card">
          <div className="lp-logo-wrap">
            <div className="lp-logo-circle" aria-hidden>
              <svg className="lp-logo" viewBox="0 0 32 32" width="32" height="32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M16 2C8.3 2 2 8.3 2 16s6.3 14 14 14 14-6.3 14-14S23.7 2 16 2z" stroke="currentColor" strokeWidth="1.2" />
                <path d="M12 16a4 4 0 108 0" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
              </svg>
            </div>
            <h2 className="lp-title">새 일기 작성</h2>
            <p className="lp-sub">강아지와의 추억을 기록해보세요</p>
          </div>

          <form className="lp-form" onSubmit={handleSubmit} noValidate>
            <div className="lp-field">
              <input
                id="title"
                name="title"
                className="lp-input"
                placeholder=" "
                value={formData.title}
                onChange={handleChange}
                required
                autoComplete="off"
              />
              <label htmlFor="title" className="lp-label">제목</label>
            </div>

            <div className="lp-field">
              <textarea
                id="content"
                name="content"
                className="lp-textarea"
                placeholder=" "
                value={formData.content}
                onChange={handleChange}
                required
              />
              <label htmlFor="content" className="lp-label">내용</label>
            </div>

            <div className="lp-field">
              <div style={{ marginBottom: 8, color: COLORS.textMuted, fontSize: 13 }}>강아지 사진</div>
              <input
                id="image"
                name="image"
                type="file"
                accept="image/*"
                className="lp-file"
                onChange={handleFileChange}
              />
              {imageFile && <div style={{ marginTop:8, fontSize:13, color: COLORS.textDark }}>{imageFile.name}</div>}
            </div>

            {/* 공개 설정 */}
            <div className="edp-field" style={{ marginBottom: 6 }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:12 }}>
                <div style={{ color: COLORS.textMuted, fontSize:13 }}>공개 설정</div>
                <label style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer', userSelect:'none' }}>
                  <input 
                    type="checkbox" 
                    checked={isPublic} 
                    onChange={(e) => setIsPublic(e.target.checked)} 
                    style={{ display: 'none' }} // 숨기고 커스텀 스타일 적용
                  />
                  <span style={{
                    width:18,
                    height:18,
                    border: '1.5px solid rgba(0,0,0,0.3)',
                    borderRadius:4,
                    display:'inline-block',
                    position:'relative',
                    backgroundColor: isPublic ? '#3b82f6' : 'transparent', // 체크 시 파란색
                  }}>
                    {isPublic && (
                      <svg 
                        width="12" 
                        height="12" 
                        viewBox="0 0 24 24" 
                        fill="none" 
                        stroke="white" 
                        strokeWidth="3" 
                        strokeLinecap="round" 
                        strokeLinejoin="round"
                        style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)' }}
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </span>
                  <span style={{ color: COLORS.textDark }}>공개</span>
                </label>
              </div>
            </div>



            <div className="lp-error" role="alert" aria-live="polite">{error ?? ''}</div>
            {successMsg && <div className="lp-success" role="status">{successMsg}</div>}

            <button className="lp-submit" type="submit" disabled={loading}>
              {loading ? '작성 중...' : '일기 생성'}
            </button>

            <div style={{ textAlign: 'center', marginTop: 14, fontSize:13, color: COLORS.textMuted }}>
              <span>작성 후 바로 목록으로 이동합니다.</span>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default CreateDiaryPage;

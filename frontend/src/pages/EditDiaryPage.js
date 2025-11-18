// frontend/src/pages/EditDiaryPage.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

function EditDiaryPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [diary, setDiary] = useState(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [imagePreview, setImagePreview] = useState(null); // 기존 이미지 보여주기 / 변경 시 미리보기
  const [newImageFile, setNewImageFile] = useState(null); // 수정 시 새로 선택한 파일

  const API_BASE_URL = 'http://localhost:8080/api/diary';
  const COLORS = {
    primary: '#f0ceaa',
    secondary: '#e0be9c',
    textDark: '#8b6655',
    textMuted: 'rgba(139,102,85,0.7)',
    link: '#c19a82',
    error: '#d97757',
  };

  useEffect(() => {
    const fetchDiary = async () => {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('token');
      if (!token || !id) {
        navigate('/login');
        return;
      }

      try {
        const response = await fetch(`${API_BASE_URL}/${id}`, {
          method: 'GET',
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.ok) {
          const data = await response.json();
          setDiary(data);
          setTitle(data.title || '');
          setContent(data.content || '');
          setIsPublic(Boolean(data.isPublic));
          setImagePreview(data.imageUrl || data.image || null);
        } else if (response.status === 401 || response.status === 403) {
          localStorage.removeItem('token');
          alert('수정 권한이 없거나 세션이 만료되었습니다.');
          navigate('/login');
        } else {
          setError('일기 정보를 불러오는 데 실패했습니다.');
        }
      } catch (err) {
        console.error(err);
        setError('네트워크 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchDiary();
  }, [id, navigate]);

  const handleFileChange = (e) => {
    const f = e.target.files?.[0] ?? null;
    setNewImageFile(f);
    if (f) {
      const url = URL.createObjectURL(f);
      setImagePreview(url);
    } else {
      // if removed file, revert to original (if diary had one)
      setImagePreview(diary?.imageUrl || diary?.image || null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    if (!token) {
      alert('로그인이 필요합니다.');
      navigate('/login');
      return;
    }

    if (!title.trim() || !content.trim()) {
      alert('제목과 내용을 모두 입력해 주세요.');
      return;
    }

    // 판단: 백엔드가 multipart를 기대하면 FormData, 그렇지 않으면 JSON.
    // 원본 로직은 JSON PUT을 사용하므로 기본은 JSON. 그러나 이미지 변경이 있으면 multipart로 전송.
    try {
      let response;
      if (newImageFile) {
        const fd = new FormData();
        fd.append('title', title);
        fd.append('content', content);
        fd.append('isPublic', isPublic ? 'true' : 'false');
        fd.append('image', newImageFile);

        response = await fetch(`${API_BASE_URL}/${id}`, {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
            // Content-Type 없음 (브라우저가 boundary 포함해서 자동 설정)
          },
          body: fd,
        });
      } else {
        response = await fetch(`${API_BASE_URL}/${id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ title, content, isPublic }),
        });
      }

      if (response.ok) {
        alert('일기가 성공적으로 수정되었습니다!');
        navigate('/');
      } else if (response.status === 401 || response.status === 403) {
        alert('수정 권한이 없습니다.');
        localStorage.removeItem('token');
        navigate('/login');
      } else {
        const txt = await response.text();
        let errObj = null;
        try { errObj = txt ? JSON.parse(txt) : null; } catch (_) { errObj = null; }
        alert(errObj?.message || txt || `수정 실패 (status ${response.status})`);
      }
    } catch (err) {
      console.error('수정 중 에러:', err);
      alert('네트워크 오류로 수정에 실패했습니다.');
    }
  };

  const handleCancel = () => {
    // 메인으로 돌아가기
    navigate('/');
  };

  if (loading) {
    return (
      <div className="edp-root">
        <style>{edpStyles(COLORS)}</style>
        <div className="edp-card-wrap">
          <div className="edp-card">
            <div style={{ textAlign: 'center', padding: 30 }}>
              <p style={{ color: COLORS.textMuted }}>일기 정보를 불러오는 중...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="edp-root">
        <style>{edpStyles(COLORS)}</style>
        <div className="edp-card-wrap">
          <div className="edp-card">
            <div style={{ textAlign: 'center', padding: 30 }}>
              <p style={{ color: COLORS.error }}>{error}</p>
              <button className="edp-btn" onClick={() => window.location.reload()}>다시 시도</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!diary) {
    return (
      <div className="edp-root">
        <style>{edpStyles(COLORS)}</style>
        <div className="edp-card-wrap">
          <div className="edp-card">
            <div style={{ textAlign: 'center', padding: 30 }}>
              <p style={{ color: COLORS.error }}>수정할 일기를 찾을 수 없습니다.</p>
              <button className="edp-btn" onClick={() => navigate('/')}>목록으로</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 렌더링: 통일된 카드 UI + 라벨 애니메이션 + 이미지 미리보기
  return (
    <div className="edp-root">
      <style>{edpStyles(COLORS)}</style>

      <div className="edp-blob b1" aria-hidden />
      <div className="edp-blob b2" aria-hidden />

      <div className="edp-card-wrap">
        <div className="edp-card">
          <div className="edp-header">
            <div>
              <h2 className="edp-title">일기 수정</h2>
              <p className="edp-sub">제목, 내용, 공개 여부, 이미지를 편집할 수 있습니다.</p>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="edp-ghost" onClick={() => navigate('/')}>목록</button>
              <button className="edp-ghost" onClick={() => navigate('/create')}>새 일기</button>
            </div>
          </div>

          <form className="edp-form" onSubmit={handleSubmit} noValidate>
            <div className="edp-field">
              <input
                id="title"
                name="title"
                className="edp-input"
                placeholder=" "
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                autoComplete="off"
              />
              <label htmlFor="title" className="edp-label">제목</label>
            </div>

            <div className="edp-field">
              <textarea
                id="content"
                name="content"
                className="edp-textarea"
                placeholder=" "
                value={content}
                onChange={(e) => setContent(e.target.value)}
                required
              />
              <label htmlFor="content" className="edp-label">내용</label>
            </div>

            <div className="edp-field" style={{ marginBottom: 6 }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:12 }}>
                <div style={{ color: COLORS.textMuted, fontSize:13 }}>공개 설정</div>
                <label style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <input type="checkbox" checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} />
                  <span style={{ color: COLORS.textDark }}>공개</span>
                </label>
              </div>
            </div>

        

            {imagePreview && (
              <div style={{ marginTop:10, marginBottom:6 }}>
                <div style={{ color: COLORS.textMuted, fontSize: 12, marginBottom:6 }}>미리보기</div>
                <div style={{ width:'100%', maxHeight:800, overflow:'hidden', borderRadius:10, border:'1px solid rgba(200,170,140,0.12)' }}>
                  <img src={imagePreview} alt="preview" style={{ width:'100%', objectFit:'cover', display:'block' }} onError={(e)=>{ e.currentTarget.style.display='none'; }} />
                </div>
              </div>
            )}

            <div style={{ display:'flex', gap:10, marginTop:16 }}>
              <button type="submit" className="edp-btn">수정 저장</button>
              <button type="button" className="edp-ghost" onClick={handleCancel}>취소</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default EditDiaryPage;

/* ---------- styles ---------- */
function edpStyles(COLORS) {
  return `
  .edp-root { min-height:100vh; display:flex; align-items:center; justify-content:center; padding:28px; background:linear-gradient(135deg,#faf9f6 0%, #f0ede8 100%); font-family: Inter, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial; }
  .edp-blob { position:fixed; filter:blur(60px); pointer-events:none; opacity:0.6; }
  .edp-blob.b1 { width:360px; height:200px; left:-60px; top:-40px; background:linear-gradient(45deg, rgba(240,206,170,0.35), rgba(224,190,156,0.22)); border-radius:48%; }
  .edp-blob.b2 { width:260px; height:160px; right:-40px; top:220px; background:linear-gradient(45deg, rgba(210,180,140,0.28), rgba(195,165,125,0.18)); border-radius:46%; }

  .edp-card-wrap { width:100%; max-width:720px; margin:0 auto; padding:0 12px; z-index:2; }
  .edp-card { background:rgba(255,255,255,0.94); backdrop-filter:blur(6px); border-radius:20px; padding:28px; box-shadow:0 18px 50px rgba(20,20,20,0.06); border:1px solid rgba(255,255,255,0.6); position:relative; overflow:hidden; }

  .edp-header { display:flex; justify-content:space-between; align-items:flex-start; gap:16px; margin-bottom:18px; }
  .edp-title { margin:0; color:${COLORS.textDark}; font-size:20px; }
  .edp-sub { margin:4px 0 0; color:${COLORS.textMuted}; font-size:13px; }

  .edp-form { width:100%; margin-top:8px; }
  .edp-field { position:relative; margin-bottom:16px; }
  .edp-input, .edp-textarea { width:100%; box-sizing:border-box; padding:14px 44px 14px 12px; border-radius:12px; border:1px solid rgba(200,170,140,0.35); background:rgba(255,255,255,0.9); font-size:15px; color:${COLORS.textDark}; outline:none; transition:box-shadow .18s, border-color .18s; }
  .edp-textarea { padding:12px; min-height:120px; resize:vertical; }
  .edp-input:focus, .edp-textarea:focus { box-shadow:0 6px 18px rgba(240,206,170,0.18); border-color:${COLORS.primary}; }
  .edp-label { position:absolute; left:12px; top:50%; transform:translateY(-50%); pointer-events:none; font-size:15px; color:${COLORS.textMuted}; transition:all .18s; }
  .edp-input:not(:placeholder-shown) + .edp-label, .edp-input:focus + .edp-label,
  .edp-textarea:not(:placeholder-shown) + .edp-label, .edp-textarea:focus + .edp-label { top:8px; font-size:12px; color:${COLORS.textDark}; }

  .edp-file { padding:10px 12px; border-radius:12px; border:1px dashed rgba(200,170,140,0.25); background:rgba(255,255,255,0.9); color:${COLORS.textDark}; }

  .edp-btn { background:linear-gradient(90deg, ${COLORS.primary}, ${COLORS.secondary}); border:none; padding:10px 14px; border-radius:12px; color:${COLORS.textDark}; font-weight:600; cursor:pointer; box-shadow:0 8px 18px rgba(240,206,170,0.18); }
  .edp-ghost { background:transparent; border:1px solid rgba(200,170,140,0.24); padding:9px 12px; border-radius:10px; cursor:pointer; color:${COLORS.textDark}; }
  .edp-btn:hover, .edp-ghost:hover { transform: translateY(-2px); transition: transform .12s; }

  .edp-error { color:${COLORS.error}; font-weight:600; }
  .edp-success { color:${COLORS.primary}; }

  @media (max-width:640px) {
    .edp-card { padding:18px; border-radius:14px; }
    .edp-card-wrap { max-width:420px; }
  }
  `;
}

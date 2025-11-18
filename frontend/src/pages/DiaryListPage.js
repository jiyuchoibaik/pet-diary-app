// frontend/src/pages/DiaryListPage.js
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

function DiaryListPage() {
  const navigate = useNavigate();
  const [diaries, setDiaries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const COLORS = {
    primary: '#f0ceaa',
    secondary: '#e0be9c',
    textDark: '#8b6655',
    textMuted: 'rgba(139,102,85,0.7)',
    link: '#c19a82',
    error: '#d97757',
  };

  const fetchDiaries = useCallback(async () => {
    setLoading(true);
    setError(null);

    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    try {
      const res = await fetch('http://localhost:8080/api/diary/', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        setDiaries(Array.isArray(data) ? data : []);
      } else if (res.status === 401) {
        localStorage.removeItem('token');
        alert('세션이 만료되었습니다. 다시 로그인해 주세요.');
        navigate('/login');
      } else {
        const err = await res.json().catch(() => null);
        setError(err?.message || `일기 목록을 불러오는 데 실패했습니다. (status ${res.status})`);
      }
    } catch (err) {
      console.error('API 호출 에러:', err);
      setError('서버 연결 또는 처리 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchDiaries();
  }, [fetchDiaries]);

  const handleEdit = (diaryId) => {
    navigate(`/edit/${diaryId}`);
  };

  const handleDelete = async (diaryId) => {
    if (!window.confirm('정말로 이 일기를 삭제하시겠습니까?')) return;

    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`http://localhost:8080/api/diary/${diaryId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        alert('일기가 성공적으로 삭제되었습니다.');
        fetchDiaries();
      } else if (res.status === 401 || res.status === 403) {
        alert('인증 오류 또는 권한이 없습니다.');
        localStorage.removeItem('token');
        navigate('/login');
      } else {
        const err = await res.json().catch(() => null);
        alert(err?.message || `일기 삭제에 실패했습니다. (status ${res.status})`);
      }
    } catch (err) {
      console.error('삭제 중 에러 발생:', err);
      alert('네트워크 오류로 삭제에 실패했습니다.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    alert('로그아웃 되었습니다.');
    navigate('/login');
  };

  // ---------- UI ----------
  if (loading) {
    return (
      <div className="dlp-root">
        <style>{styles(COLORS)}</style>
        <div className="dlp-card-wrap">
          <div className="dlp-card">
            <div className="dlp-header">
              <h2>우리 강아지 일기장 🐶</h2>
            </div>
            <div style={{ padding: '24px 0', textAlign: 'center', color: COLORS.textMuted }}>일기를 불러오는 중...</div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dlp-root">
        <style>{styles(COLORS)}</style>
        <div className="dlp-card-wrap">
          <div className="dlp-card">
            <div className="dlp-header">
              <h2>우리 강아지 일기장 🐶</h2>
              <div className="dlp-header-actions">
                <button onClick={() => navigate('/create')} className="dlp-btn">새 일기 작성</button>
                <button onClick={handleLogout} className="dlp-ghost">로그아웃</button>
              </div>
            </div>

            <div style={{ padding: '18px 0', textAlign: 'center' }}>
              <p className="dlp-error">오류: {error}</p>
              <button onClick={() => fetchDiaries()} className="dlp-btn" style={{ marginTop: 12 }}>다시 시도</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dlp-root">
      <style>{styles(COLORS)}</style>

      {/* decorative blobs */}
      <div className="dlp-blob b1" aria-hidden />
      <div className="dlp-blob b2" aria-hidden />

      <div className="dlp-card-wrap">
        <div className="dlp-card">
          <div className="dlp-header">
            <div>
              <h2>우리 강아지 일기장 🐶</h2>
              <p className="dlp-sub">강아지와의 소중한 순간들을 기록해보세요</p>
            </div>

            <div className="dlp-header-actions">
              <button onClick={() => navigate('/public')} className="dlp-ghost">전체 공개 피드</button>
              <button onClick={() => navigate('/create')} className="dlp-btn">새 일기 작성</button>
              <button onClick={handleLogout} className="dlp-ghost">로그아웃</button>
            </div>
          </div>

          {diaries.length === 0 ? (
            <div className="dlp-empty">
              <p>아직 작성된 일기가 없습니다. 첫 일기를 작성해 보세요!</p>
              <button onClick={() => navigate('/create')} className="dlp-btn" style={{ marginTop: 12 }}>일기 작성하러 가기</button>
            </div>
          ) : (
            <div className="dlp-grid">
              {diaries.map((d) => {
                const id = d._id || d.id;
                return (
                  <article className="dlp-card-item" key={id}>
                    { (d.imageUrl || d.image) && (
                      <div className="dlp-thumb-wrap">
                        <img
                          src={d.imageUrl || d.image}
                          alt={d.title || 'diary image'}
                          className="dlp-thumb"
                          onError={(e) => { e.currentTarget.style.display = 'none'; }}
                        />
                      </div>
                    )}

                    <div className="dlp-item-body">
                      <h3 className="dlp-item-title">{d.title}</h3>
                      <p className="dlp-item-content">{(d.content || '').slice(0, 120)}{(d.content && d.content.length > 120) ? '...' : ''}</p>
                      <div className="dlp-item-meta">
                        <time dateTime={d.createdAt}>{new Date(d.createdAt).toLocaleDateString()}</time>
                        <div className="dlp-actions">
                          <button onClick={() => handleEdit(id)} className="dlp-small">수정</button>
                          <button onClick={() => handleDelete(id)} className="dlp-del">삭제</button>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default DiaryListPage;

/* ---------- styles as function for easy color injection ---------- */
function styles(COLORS) {
  return `
  /* Root + blobs */
  .dlp-root { min-height:100vh; display:flex; align-items:center; justify-content:center; padding:28px; background:linear-gradient(135deg,#faf9f6 0%, #f0ede8 100%); font-family: Inter, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial; }
  .dlp-blob { position:fixed; filter:blur(60px); pointer-events:none; opacity:0.6; }
  .dlp-blob.b1 { width:360px; height:200px; left:-60px; top:-40px; background:linear-gradient(45deg, rgba(240,206,170,0.35), rgba(224,190,156,0.22)); border-radius:48%; }
  .dlp-blob.b2 { width:260px; height:160px; right:-40px; top:220px; background:linear-gradient(45deg, rgba(210,180,140,0.28), rgba(195,165,125,0.18)); border-radius:46%; }

  /* Card */
  .dlp-card-wrap { width:100%; max-width:980px; margin:0 auto; padding:0 12px; z-index:2; }
  .dlp-card { background:rgba(255,255,255,0.95); backdrop-filter:blur(6px); border-radius:20px; padding:28px; box-shadow:0 18px 50px rgba(20,20,20,0.06); border:1px solid rgba(255,255,255,0.6); position:relative; overflow:hidden; }

  /* Header */
  .dlp-header { display:flex; justify-content:space-between; align-items:center; gap:16px; margin-bottom:18px; }
  .dlp-header h2 { margin:0; color:${COLORS.textDark}; font-size:20px; }
  .dlp-sub { margin:4px 0 0; color:${COLORS.textMuted}; font-size:13px; }

  .dlp-header-actions { display:flex; gap:10px; align-items:center; }
  .dlp-btn { background:linear-gradient(90deg, ${COLORS.primary}, ${COLORS.secondary}); border:none; padding:10px 14px; border-radius:12px; color:${COLORS.textDark}; font-weight:600; cursor:pointer; box-shadow:0 8px 18px rgba(240,206,170,0.18); }
  .dlp-ghost { background:transparent; border:1px solid rgba(200,170,140,0.24); padding:9px 12px; border-radius:10px; cursor:pointer; color:${COLORS.textDark}; }
  .dlp-ghost:hover, .dlp-btn:hover { transform: translateY(-2px); transition: transform .12s; }

  /* Empty */
  .dlp-empty { padding:36px 6px; text-align:center; color:${COLORS.textMuted}; }

  /* Grid of diaries */
  .dlp-grid { display:grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap:16px; margin-top:8px; }
  .dlp-card-item { background: #fff; border-radius:12px; overflow:hidden; border:1px solid rgba(200,170,140,0.12); box-shadow: 0 6px 20px rgba(20,20,20,0.04); display:flex; flex-direction:column; min-height:160px; }
  .dlp-thumb-wrap { width:100%; height:140px; overflow:hidden; display:flex; align-items:center; justify-content:center; background:linear-gradient(180deg, rgba(240,230,220,0.6), rgba(250,248,245,0.6)); }
  .dlp-thumb { 
    width:100%; 
    height:100%; 
    object-fit: contain; /* cover → contain */
    background-color: #f9f6f2; /* 사진 비율이 안 맞을 때 여백 */
    display:block; 
  }

  .dlp-item-body { padding:12px; display:flex; flex-direction:column; gap:8px; flex:1; }
  .dlp-item-title { margin:0; font-size:16px; color:${COLORS.textDark}; }
  .dlp-item-content { margin:0; color:${COLORS.textMuted}; font-size:13px; line-height:1.4; flex:1; }
  .dlp-item-meta { display:flex; align-items:center; justify-content:space-between; gap:10px; margin-top:8px; font-size:12px; color:${COLORS.textMuted}; }

  .dlp-actions { display:flex; gap:8px; }
  .dlp-small { padding:6px 8px; border-radius:8px; border:1px solid rgba(200,170,140,0.18); background:transparent; cursor:pointer; font-size:13px; }
  .dlp-del { padding:6px 8px; border-radius:8px; border:none; background:${COLORS.error}; color:white; cursor:pointer; font-size:13px; }

  .dlp-error { color:${COLORS.error}; font-weight:600; }
  
  /* Responsive: narrow screens use single column */
  @media (max-width:640px) {
    .dlp-card { padding:18px; border-radius:14px; }
    .dlp-grid { grid-template-columns: 1fr; }
    .dlp-thumb-wrap { height:200px; }
  }
  `;
}

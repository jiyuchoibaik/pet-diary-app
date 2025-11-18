// frontend/src/pages/PublicFeedPage.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function PublicFeedPage() {
  const navigate = useNavigate();
  const [publicDiaries, setPublicDiaries] = useState([]);
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

  const fetchPublicDiaries = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('http://localhost:8080/api/diary/public');
      if (response.ok) {
        const data = await response.json();
        setPublicDiaries(data);
      } else {
        const errorData = await response.json();
        setError(errorData.message || '공개 일기 목록을 불러오는 데 실패했습니다.');
      }
    } catch (err) {
      setError('네트워크 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPublicDiaries();
  }, []);

  if (loading)
    return (
      <div className="pf-root">
        <style>{pfStyles(COLORS)}</style>
        <div className="pf-loading">전체 공개 피드를 불러오는 중...</div>
      </div>
    );

  if (error)
    return (
      <div className="pf-root">
        <style>{pfStyles(COLORS)}</style>
        <div className="pf-error">오류: {error}</div>
      </div>
    );

  return (
    <div className="pf-root">
      <style>{pfStyles(COLORS)}</style>
      <div className="pf-blob b1" aria-hidden />
      <div className="pf-blob b2" aria-hidden />

      <div className="pf-header">
        <h2 className="pf-title">🐶 강아지 일기 공개 피드 🌟</h2>
        <p className="pf-sub">다른 사용자들의 귀여운 강아지 일기를 구경하세요!</p>
      </div>

      {publicDiaries.length === 0 ? (
        <div className="pf-empty">아직 전체 공개된 일기가 없습니다.</div>
      ) : (
        <div className="pf-list-container">
          {publicDiaries.map((diary) => (
            <div key={diary._id} className="pf-card">
              {diary.imageUrl && diary.imageUrl !== 'placeholder_for_simple_upload' && (
                <img src={diary.imageUrl} alt={diary.title} className="pf-image" />
              )}
              <h3 className="pf-card-title">{diary.title}</h3>
              <p className="pf-card-author">by. {diary.user}</p>
              <p className="pf-card-content">{diary.content.substring(0, 120)}...</p>
              <span className="pf-card-date">{new Date(diary.createdAt).toLocaleDateString()}</span>
            </div>
          ))}
        </div>
      )}

      <button className="pf-btn-back" onClick={() => navigate('/')}>
        나의 일기로 돌아가기
      </button>
    </div>
  );
}

export default PublicFeedPage;

/* ---------- styles ---------- */
function pfStyles(COLORS) {
  return `
  .pf-root { min-height:100vh; padding:28px; background:linear-gradient(135deg,#faf9f6 0%, #f0ede8 100%); font-family: Inter, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial; }

  .pf-blob { position:fixed; filter:blur(60px); pointer-events:none; opacity:0.6; }
  .pf-blob.b1 { width:360px; height:200px; left:-60px; top:-40px; background:linear-gradient(45deg, rgba(240,206,170,0.35), rgba(224,190,156,0.22)); border-radius:48%; }
  .pf-blob.b2 { width:260px; height:160px; right:-40px; top:220px; background:linear-gradient(45deg, rgba(210,180,140,0.28), rgba(195,165,125,0.18)); border-radius:46%; }

  .pf-header { text-align:center; margin-bottom:20px; }
  .pf-title { font-size:22px; color:${COLORS.textDark}; margin-bottom:4px; text-shadow: 2px 2px 6px rgba(0,0,0,0.12); }
  .pf-sub { font-size:14px; color:${COLORS.textMuted}; margin:0; }

    .pf-list-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 16px;
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
}

  
    .pf-card {
  background: rgba(255,255,255,0.95);
  border-radius: 18px;
  padding: 16px;
  box-shadow: 0 12px 36px rgba(20,20,20,0.06);
  border: 1px solid rgba(255,255,255,0.6);
  display: flex;
  flex-direction: column;
  gap: 8px;
  transition: transform 0.2s ease;
}

.pf-card:hover {
  transform: translateY(-4px);
}
  .pf-image {
    width: 100%;
    height: 180px; 
    object-fit: contain; /* cover → contain */
    background-color: #f9f6f2;
    border-radius: 12px;
   }
  .pf-card-title { font-size:16px; font-weight:600; color:${COLORS.textDark}; margin:0; }
  .pf-card-author { font-size:12px; color:${COLORS.textMuted}; margin:0; }
  .pf-card-content { font-size:14px; color:${COLORS.textDark}; margin:0; }
  .pf-card-date { font-size:11px; color:${COLORS.textMuted}; }

  .pf-btn-back { margin-top:16px; padding:10px 16px; border:none; border-radius:12px; background:linear-gradient(90deg, ${COLORS.primary}, ${COLORS.secondary}); color:${COLORS.textDark}; font-weight:600; cursor:pointer; box-shadow:0 6px 18px rgba(240,206,170,0.18); }

  .pf-loading, .pf-error, .pf-empty { text-align:center; color:${COLORS.textMuted}; font-size:14px; margin-top:30px; }
  `;
}

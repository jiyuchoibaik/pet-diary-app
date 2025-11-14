// frontend/src/pages/DiaryListPage.js

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function DiaryListPage() {
  const navigate = useNavigate();
  const [diaries, setDiaries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDiaries = async () => {
      const token = localStorage.getItem('token');

      // 1. 토큰 검사: 토큰이 없으면 로그인 페이지로 이동
      if (!token) {
        navigate('/login');
        return;
      }

      try {
        // 2. 일기 목록 GET 요청 (인증 헤더 포함)
        const response = await fetch('http://localhost:8080/api/diary/', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`, // ⬅️ 인증 토큰 첨부
          },
        });

        if (response.ok) {
          const data = await response.json();
          // 데이터를 배열 상태에 저장
          setDiaries(data); 
        } else if (response.status === 401) {
          // 3. 인증 실패 시 (토큰 만료 등)
          localStorage.removeItem('token');
          alert('세션이 만료되었습니다. 다시 로그인해 주세요.');
          navigate('/login');
        } else {
          const errorData = await response.json();
          setError(errorData.message || '일기 목록을 불러오는 데 실패했습니다.');
        }
      } catch (err) {
        console.error('API 호출 에러:', err);
        setError('네트워크 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchDiaries();
  }, [navigate]);

  // 4. 로그아웃 기능 (편의를 위해 추가)
  const handleLogout = () => {
    localStorage.removeItem('token');
    alert('로그아웃 되었습니다.');
    navigate('/login');
  };

  // 로딩 중 상태 표시
  if (loading) {
    return (
      <div className="diary-list-container">
        <h2>일기 목록</h2>
        <p>일기를 불러오는 중...</p>
      </div>
    );
  }

  // 에러 발생 시 표시
  if (error) {
    return (
      <div className="diary-list-container">
        <h2>일기 목록</h2>
        <p className="error-message">오류: {error}</p>
        <button onClick={() => window.location.reload()}>다시 시도</button>
      </div>
    );
  }

  // 최종 렌더링
  return (
    <div className="diary-list-container">
      <div className="header">
        <h2>우리 강아지 일기장 🐶</h2>
        <div>
          <button onClick={() => navigate('/create')} className="create-button">새 일기 작성</button>
          <button onClick={handleLogout} className="logout-button">로그아웃</button>
        </div>
      </div>

      {diaries.length === 0 ? (
        <div className="no-diaries">
          <p>아직 작성된 일기가 없습니다. 첫 일기를 작성해 보세요!</p>
          <button onClick={() => navigate('/create')} className="create-link-button">일기 작성하러 가기</button>
        </div>
      ) : (
        <div className="diary-grid">
          {diaries.map((diary) => (
            // 5. 일기 카드 렌더링
            <div key={diary._id || diary.id} className="diary-card">
              {diary.imageUrl && (
                <img 
                  // 백엔드에서 '/uploads/...' 형태로 URL을 제공한다고 가정
                  src={`http://localhost:8080${diary.imageUrl}`} 
                  alt={diary.title} 
                  className="diary-image"
                />
              )}
              <h3 className="diary-title">{diary.title}</h3>
              {/* 내용 중 일부만 표시 */}
              <p className="diary-content">{diary.content.substring(0, 100)}...</p>
              <span className="diary-date">
                {new Date(diary.createdAt).toLocaleDateString()}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default DiaryListPage;
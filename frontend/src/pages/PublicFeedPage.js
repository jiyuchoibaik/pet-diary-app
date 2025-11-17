// frontend/src/pages/PublicFeedPage.js (새 파일)

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function PublicFeedPage() {
    const navigate = useNavigate();
    const [publicDiaries, setPublicDiaries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // 🌟 전체 공개 일기 목록을 불러오는 함수
    const fetchPublicDiaries = async () => {
        try {
            // 토큰 없이 공개 API를 호출합니다.
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

    if (loading) return <div className="loading-message">전체 공개 피드를 불러오는 중...</div>;
    if (error) return <div className="error-message">오류: {error}</div>;

    return (
        <div className="public-feed-container">
            <h2 className="feed-title">🐶 강아지 일기 공개 피드 🌟</h2>
            <p className="feed-description">다른 사용자들의 귀여운 강아지 일기를 구경하세요!</p>

            {publicDiaries.length === 0 ? (
                <div className="empty-feed">아직 전체 공개된 일기가 없습니다.</div>
            ) : (
                <div className="diary-grid">
                    {publicDiaries.map((diary) => (
                        <div key={diary._id} className="diary-card public-card">
                            {diary.imageUrl && diary.imageUrl !== 'placeholder_for_simple_upload' && (
                                <img 
                                    src={`http://localhost:8080${diary.imageUrl}`} 
                                    alt={diary.title} 
                                    className="diary-image"
                                />
                            )}
                            <h3 className="diary-title">{diary.title}</h3>
                            {/* 작성자 정보는 user 객체 안에 있습니다. */}
                            <p className="diary-author">
                                by. {diary.user}
                            </p>
                            <p className="diary-content">{diary.content.substring(0, 80)}...</p>
                            <span className="diary-date">
                                {new Date(diary.createdAt).toLocaleDateString()}
                            </span>
                        </div>
                    ))}
                </div>
            )}

            <button onClick={() => navigate('/')} className="back-to-my-diary-button">
                나의 일기로 돌아가기
            </button>
        </div>
    );
}

export default PublicFeedPage;
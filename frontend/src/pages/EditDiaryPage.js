// frontend/src/pages/EditDiaryPage.js (로직만 남김)

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import EditDiaryForm from '../components/EditDiaryForm'; // ⬅️ 새로 만든 UI 컴포넌트 임포트

function EditDiaryPage() {
  const { id } = useParams(); 
  const navigate = useNavigate();

  const [diary, setDiary] = useState(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isPublic, setIsPublic] = useState(false); // 💡 isPublic 상태 추가
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const API_BASE_URL = 'http://localhost:8080/api/diary';

  // 2. 초기 데이터 불러오기 로직 (변화 없음)
  useEffect(() => {
    // ... (기존 useEffect 로직 유지) ...
    const fetchDiary = async () => {
      const token = localStorage.getItem('token');
      if (!token || !id) {
        navigate('/login');
        return;
      }
      // ... (API 호출 및 상태 설정 로직 유지) ...
      try {
        const response = await fetch(`${API_BASE_URL}/${id}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setDiary(data);
          setTitle(data.title);
          setContent(data.content);
          setIsPublic(data.isPublic || false);
        } else if (response.status === 401 || response.status === 403) {
          localStorage.removeItem('token');
          alert('수정 권한이 없거나 세션이 만료되었습니다.');
          navigate('/login');
        } else {
          setError('일기 정보를 불러오는 데 실패했습니다.');
        }
      } catch (err) {
        setError('네트워크 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };
    fetchDiary();
  }, [id, navigate]);


  // 3. 수정된 데이터 저장 로직 (변화 없음)
  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    
    if (!title.trim() || !content.trim()) {
      alert('제목과 내용을 모두 입력해 주세요.');
      return;
    }
    // ... (PUT API 호출 로직 유지) ...
    try {
      const response = await fetch(`${API_BASE_URL}/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ title, content, isPublic }),
      });

      if (response.ok) {
        alert('일기가 성공적으로 수정되었습니다!');
        navigate('/'); 
      } else if (response.status === 401 || response.status === 403) {
        alert('수정 권한이 없습니다.');
      } else {
        const errorData = await response.json();
        alert(`수정 실패: ${errorData.message}`);
      }
    } catch (error) {
      alert('네트워크 오류로 수정에 실패했습니다.');
    }
  };

  // 4. 취소 핸들러
  const handleCancel = () => {
      navigate('/');
  };

  if (loading) return <div className="loading">일기 정보를 불러오는 중...</div>;
  if (error) return <div className="error">{error}</div>;
  if (!diary) return <div className="error">수정할 일기를 찾을 수 없습니다.</div>;

  // 5. 렌더링: 분리된 폼 컴포넌트에 필요한 데이터와 핸들러를 Props로 전달
  return (
    <EditDiaryForm
      title={title}
      setTitle={setTitle}
      content={content}
      setContent={setContent}
      imageUrl={diary.imageUrl}
      // 💡 isPublic 상태와 setState 함수 전달
      isPublic={isPublic}
      setIsPublic={setIsPublic}
      handleSubmit={handleSubmit}
      handleCancel={handleCancel}
    />
  );
}

export default EditDiaryPage;
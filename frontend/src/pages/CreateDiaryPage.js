// frontend/src/pages/CreateDiaryPage.js

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function CreateDiaryPage() {
  const navigate = useNavigate();
  
  // 1. 상태 관리: 제목, 내용, 이미지 파일을 위한 상태
  const [formData, setFormData] = useState({
    title: '',
    content: '',
  });
  const [imageFile, setImageFile] = useState(null); // 파일 객체 저장용 상태
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleFileChange = (e) => {
    // 2. 파일 입력 처리: 선택된 파일 객체를 상태에 저장
    setImageFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // 3. FormData 객체 생성 (multipart/form-data 형식)
    const dataToSend = new FormData();
    dataToSend.append('title', formData.title);
    dataToSend.append('content', formData.content);
    // 파일이 있다면 'image'라는 필드 이름으로 추가 (백엔드가 기대하는 필드명)
    if (imageFile) {
        dataToSend.append('image', imageFile); 
    }

    try {
      // 4. API 요청
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8080/api/diary/', {
        method: 'POST',
        // 🚨 중요: multipart/form-data를 사용할 때는 Content-Type 헤더를 명시하지 않습니다.
        // fetch가 FormData 객체를 보고 자동으로 Content-Type을 설정합니다.
        headers: {
          'Authorization': `Bearer ${token}`, // ⬅️ 인증 토큰 필수 첨부
        },
        body: dataToSend,
      });

      if (response.ok) {
        alert('일기가 성공적으로 작성되었습니다!');
        navigate('/'); // 일기 목록 페이지로 이동
      } else {
        const errorData = await response.json();
        setError(errorData.message || '일기 작성 실패');
      }
    } catch (err) {
      setError('네트워크 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="diary-create-container">
      <h2>새 일기 작성</h2>
      <form onSubmit={handleSubmit} className="diary-form">
        
        <div className="form-group">
          <label htmlFor="title">제목:</label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="content">내용:</label>
          <textarea
            id="content"
            name="content"
            rows="5"
            value={formData.content}
            onChange={handleChange}
            required
          ></textarea>
        </div>

        <div className="form-group">
          <label htmlFor="image">강아지 사진:</label>
          <input
            type="file"
            id="image"
            name="image"
            accept="image/*" // 이미지 파일만 허용
            onChange={handleFileChange}
          />
        </div>

        {error && <p className="error-message">{error}</p>}

        <button type="submit" className="submit-button" disabled={loading}>
          {loading ? '작성 중...' : '일기 생성'}
        </button>
      </form>
    </div>
  );
}

export default CreateDiaryPage;
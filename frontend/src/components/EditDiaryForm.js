// frontend/src/components/EditDiaryForm.js (수정)

import React from 'react';

// 💡 isPublic 상태와 setIsPublic 핸들러를 props로 받습니다.
function EditDiaryForm({ title, setTitle, content, setContent, imageUrl, isPublic, setIsPublic, handleSubmit, handleCancel }) {

  return (
    <div className="edit-diary-container">
      <h2>일기 수정하기</h2>
      
      <form onSubmit={handleSubmit}> 
        <div className="form-group">
          <label htmlFor="title">제목</label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="content">내용</label>
          <textarea
            id="content"
            rows="10"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
          ></textarea>
        </div>
        
        {/* 🌟 새로 추가된 전체 공개 체크박스 🌟 */}
        <div className="form-group">
          <label htmlFor="isPublic" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="checkbox"
              id="isPublic"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)} // 체크 상태를 상위 컴포넌트로 전달
            />
            **전체 공개** (다른 사용자에게 보여집니다.)
          </label>
        </div>
        
        {/* 이미지 표시 부분 */}
        {imageUrl && (
          <div className="current-image">
            <p>현재 이미지:</p>
            <img 
              src={`http://localhost:8080${imageUrl}`} 
              alt="Diary Image" 
              style={{ maxWidth: '300px', maxHeight: '300px' }} 
            />
          </div>
        )}

        <button type="submit" className="save-button">수정 완료</button>
        <button type="button" onClick={handleCancel} className="cancel-button">취소</button>
      </form>
    </div>
  );
}

export default EditDiaryForm;
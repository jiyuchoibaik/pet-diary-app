// frontend/src/pages/LoginPage.js
import { useNavigate } from 'react-router-dom';
import React, { useState } from 'react';



function LoginPage() {

  const navigate = useNavigate();

  // 1. 상태 관리: 이메일과 비밀번호를 위한 상태를 정의합니다.
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });

  // 2. 입력값 변경 처리: 모든 입력 필드의 변경을 처리합니다.
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value, // 해당 필드의 상태를 업데이트합니다.
    });
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      // 1. API 요청
      const response = await fetch('http://localhost:8080/api/auth/login', { // 🚨 Nginx 포트 8080 사용
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        // 2. 토큰 저장 및 리디렉션
        localStorage.setItem('token', data.token); // 받은 토큰을 저장
        navigate('/'); // 메인 페이지로 이동
        console.log('로그인 성공! 토큰 저장 완료.');
      } else {
        // 3. 오류 처리
        alert(data.message || '로그인 실패: 서버 오류');
      }
    } catch (error) {
      console.error('로그인 중 에러 발생:', error);
      alert('네트워크 오류가 발생했습니다.');
    }
  };

  

  return (
   
    <div className="auth-container">
      <h2>로그인</h2>
      <form onSubmit={handleSubmit} className="auth-form">
        
        <div className="form-group">
          <label htmlFor="username">사용자 이름:</label>
          <input
            // 🚨 id와 name을 'username'으로 변경
            type="text" 
            id="username"
            name="username" 
            value={formData.username}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="password">비밀번호:</label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
          />
        </div>

        <button type="submit" className="auth-button">로그인</button>
      </form>
      {/* <span>계정이 없으신가요? <a href="/register">회원가입</a></span> */}
    </div>
  );
}

export default LoginPage;
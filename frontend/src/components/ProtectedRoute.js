// frontend/src/components/ProtectedRoute.js

import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
  // 1. localStorage에서 토큰을 가져옵니다.
  const token = localStorage.getItem('token');

  // 2. 토큰이 없는 경우 (인증 실패)
  if (!token) {
    // 사용자를 '/login' 경로로 강제 이동시킵니다.
    return <Navigate to="/login" replace />;
  }

  // 3. 토큰이 있는 경우 (인증 성공)
  // 자식 컴포넌트 (요청된 페이지)를 렌더링합니다.
  return children;
};

export default ProtectedRoute;
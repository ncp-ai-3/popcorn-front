import { useState } from 'react';
import './LoginPage.css';
import { apiFetch } from '../api';

export function LoginPage({ onLogin }) {
  const [isLoading, setIsLoading] = useState(false);

  const handleNaverLogin = async () => {
    if (isLoading) return;

    setIsLoading(true);

    try {
      const data = await apiFetch('/api/v1/auth/login/naver/authorization-url');
      const authorizationUrl = data?.result?.authorizationUrl;

      if (!authorizationUrl) {
        throw new Error('네이버 로그인 URL이 응답에 없습니다.');
      }

      window.location.href = authorizationUrl;
    } catch (error) {
      alert(error.message || '로그인 URL을 불러오는데 실패했습니다.');
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <div className="login-logo">📍</div>
        <h1 className="login-title">서울 팝업 추천</h1>
        <p className="login-subtitle">AI 기반 맞춤형 팝업 경로 추천</p>
        <button
          className="naver-login-btn"
          onClick={handleNaverLogin}
          disabled={isLoading}
        >
          <span className="naver-icon">N</span>
          {isLoading ? '로그인 페이지로 이동 중...' : '네이버로 로그인'}
        </button>
        <button
          type="button"
          className="chat-preview-btn"
          onClick={onLogin}
        >
          채팅 화면 보기
        </button>
      </div>
    </div>
  );
}

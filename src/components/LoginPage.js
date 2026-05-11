import { useState } from 'react';
import './LoginPage.css';
import { apiFetch } from '../api';

export function LoginPage() {
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
    <div className="login-page">
      <div className="login-background" />
      <main className="login-main">
        <section className="login-card">
          <img className="login-logo" src="/popcorn_brand_logo.png" alt="POPCORN Logo" />
          <div className="login-copy">
            <h1 className="login-title">
              <span>AI가 골라주는</span>
              <strong>나만의 팝업 코스</strong>
            </h1>
            <p className="login-subtitle">
              대화만으로 나에게 맞는 팝업스토어를 추천받고, 경로까지 확인하는 AI 팝업 추천 서비스
            </p>
          </div>
        <button
          className="naver-login-btn"
          onClick={handleNaverLogin}
          disabled={isLoading}
        >
            <span className="naver-icon">N</span>
            {isLoading ? '로그인 페이지로 이동 중...' : '네이버로 시작하기'}
        </button>
          <p className="login-support">
            New to POPCORN? <a href="/">Request Invitation</a>
          </p>
        </section>
      </main>
      <footer className="login-footer">
        <div className="login-footer-links">
          <a href="/">Terms of Service</a>
          <a href="/">Privacy Policy</a>
        </div>
        <p>© 2026 POPCORN. CURATED EXPERIENCES.</p>
      </footer>
    </div>
  );
}

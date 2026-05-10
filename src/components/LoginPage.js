import './LoginPage.css';

export function LoginPage({ onLogin }) {
  const handleNaverLogin = async () => {
    try {
      // Spring에 네이버 로그인 URL 요청
      const response = await fetch('http://localhost:8080/api/v1/auth/login/naver/authorization-url');
      const data = await response.json();

      // 받은 URL로 사용자 이동 (네이버 로그인 페이지로)
      window.location.href = data.result.authorizationUrl;

    } catch (error) {
      alert('로그인 URL을 불러오는데 실패했습니다.');
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <div className="login-logo">📍</div>
        <h1 className="login-title">서울 팝업 추천</h1>
        <p className="login-subtitle">AI 기반 맞춤형 팝업 경로 추천</p>
        <button className="naver-login-btn" onClick={handleNaverLogin}>
          <span className="naver-icon">N</span>
          네이버로 로그인
        </button>
      </div>
    </div>
  );
}
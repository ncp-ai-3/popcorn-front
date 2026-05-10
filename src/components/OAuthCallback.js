import { useEffect, useRef } from 'react';
import { apiFetch, saveAuthTokens } from '../api';

export function OAuthCallback({ onLoginSuccess }) {
  const hasHandledCallback = useRef(false);

  useEffect(() => {
    if (hasHandledCallback.current) return;

    hasHandledCallback.current = true;

    const pickTokenPayload = (payload = {}) => {
      const result = payload.result || payload.data || payload;

      return {
        accessToken:
          result.accessToken ||
          result.access_token ||
          result.token ||
          result.jwt,
        refreshToken: result.refreshToken || result.refresh_token,
        memberId: result.memberId || result.member_id || result.userId,
      };
    };

    const completeLogin = (tokens) => {
      saveAuthTokens(tokens);
      onLoginSuccess();
    };

    const handleCallback = async () => {
      const params = new URLSearchParams(window.location.search);
      const queryTokens = pickTokenPayload({
        accessToken: params.get('accessToken') || params.get('access_token'),
        refreshToken: params.get('refreshToken') || params.get('refresh_token'),
        memberId: params.get('memberId') || params.get('member_id') || params.get('userId'),
      });

      if (queryTokens.accessToken) {
        completeLogin(queryTokens);
        return;
      }

      if (params.get('code') && params.get('state')) {
        const data = await apiFetch('/api/v1/auth/login/naver', {
          method: 'POST',
          body: JSON.stringify({
            code: params.get('code'),
            state: params.get('state'),
          }),
        });
        const exchangedTokens = pickTokenPayload(data);

        if (!exchangedTokens.accessToken) {
          throw new Error('로그인 토큰이 응답에 없습니다.');
        }

        completeLogin(exchangedTokens);
        return;
      }

      throw new Error('로그인에 필요한 정보가 없습니다.');
    };

    handleCallback().catch((error) => {
      alert(error.message || '로그인에 실패했습니다. 다시 시도해주세요.');
      window.history.replaceState({}, '', '/');
      onLoginSuccess(false);
    });
  }, [onLoginSuccess]);

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
      <p>로그인 처리 중...</p>
    </div>
  );
}

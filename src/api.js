const DEFAULT_API_BASE_URL = '';

export const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL || DEFAULT_API_BASE_URL;

export const TOKEN_STORAGE_KEYS = {
  accessToken: 'accessToken',
  refreshToken: 'refreshToken',
  memberId: 'memberId',
};

export function getStoredTokens() {
  return {
    accessToken: localStorage.getItem(TOKEN_STORAGE_KEYS.accessToken),
    refreshToken: localStorage.getItem(TOKEN_STORAGE_KEYS.refreshToken),
    memberId: localStorage.getItem(TOKEN_STORAGE_KEYS.memberId),
  };
}

export function saveAuthTokens({ accessToken, refreshToken, memberId }) {
  if (accessToken) {
    localStorage.setItem(TOKEN_STORAGE_KEYS.accessToken, accessToken);
  }

  if (refreshToken) {
    localStorage.setItem(TOKEN_STORAGE_KEYS.refreshToken, refreshToken);
  }

  if (memberId) {
    localStorage.setItem(TOKEN_STORAGE_KEYS.memberId, String(memberId));
  }
}

function clearAuthTokens() {
  localStorage.removeItem(TOKEN_STORAGE_KEYS.accessToken);
  localStorage.removeItem(TOKEN_STORAGE_KEYS.refreshToken);
  localStorage.removeItem(TOKEN_STORAGE_KEYS.memberId);
}

function normalizeApiPath(path) {
  return API_BASE_URL.endsWith('/api') && path.startsWith('/api/')
    ? path.replace('/api', '')
    : path;
}

function redirectToLogin() {
  clearAuthTokens();
  window.history.replaceState({}, '', '/');
  window.location.reload();
}

async function request(path, options = {}) {
  const { accessToken } = getStoredTokens();
  const headers = {
    ...(options.body ? { 'Content-Type': 'application/json' } : {}),
    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE_URL}${normalizeApiPath(path)}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => null);
  return { response, data };
}

async function reissueTokens() {
  const { refreshToken } = getStoredTokens();
  if (!refreshToken) return false;

  const { response, data } = await request('/api/v1/auth/reissue', {
    method: 'POST',
    body: JSON.stringify({ refreshToken }),
  });

  if (!response.ok || data?.success === false) return false;

  const result = data?.result || data;
  saveAuthTokens({
    accessToken: result.accessToken,
    refreshToken: result.refreshToken,
  });

  return !!result.accessToken;
}

export async function apiFetch(path, options = {}) {
  let { response, data } = await request(path, options);

  if (response.status === 401 && path !== '/api/v1/auth/reissue') {
    const reissued = await reissueTokens().catch(() => false);

    if (reissued) {
      ({ response, data } = await request(path, options));
    } else {
      redirectToLogin();
      throw new Error('로그인이 만료되었습니다. 다시 로그인해주세요.');
    }
  }

  if (!response.ok || data?.success === false) {
    throw new Error(data?.message || 'API 요청에 실패했습니다.');
  }

  return data;
}

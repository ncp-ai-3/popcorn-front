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

export async function apiFetch(path, options = {}) {
  const { accessToken, refreshToken } = getStoredTokens();
  const headers = {
    ...(options.body ? { 'Content-Type': 'application/json' } : {}),
    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    ...(refreshToken ? { 'Refresh-Token': refreshToken } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => null);

  if (!response.ok || data?.success === false) {
    throw new Error(data?.message || 'API 요청에 실패했습니다.');
  }

  return data;
}

import { useState, useRef, useEffect, useCallback } from 'react';
import { ChatMessage } from './components/ChatMessage';
import { ChatInput } from './components/ChatInput';
import { MapView } from './components/MapView';
import { LoginPage } from './components/LoginPage';
import { OAuthCallback } from './components/OAuthCallback';
import { PopupDetailModal } from './components/PopupDetailModal';
import { BookmarkPage } from './components/BookmarkPage';
import { apiFetch } from './api';
import './App.css';

const BOOKMARK_STORAGE_KEY = 'bookmarkedPopups';
const CHAT_STORAGE_KEY = 'popcorn_chat_messages';

function normalizePopup(popup) {
  const categories = popup.categories || [];

  return {
    ...popup,
    id: String(popup.id || popup.popupId),
    name: popup.title || popup.name,
    location: popup.address || popup.location,
    theme: categories.map((category) => category.name).filter(Boolean).join(', ') || popup.theme,
    period: popup.period || `${popup.startDate || ''} - ${popup.endDate || ''}`,
    image: popup.imageUrl || popup.image,
    lat: popup.latitude || popup.lat,
    lng: popup.longitude || popup.lng,
  };
}

const INITIAL_MESSAGES = [
  {
    id: '1',
    text: '안녕하세요! 서울의 팝업 경로를 추천해드립니다. 가고 싶은 지역과 팝업 테마를 알려주세요!',
    isBot: true,
  },
];

function loadBookmarks() {
  try {
    return JSON.parse(localStorage.getItem(BOOKMARK_STORAGE_KEY)) || [];
  } catch (error) {
    return [];
  }
}

function saveBookmarks(bookmarks) {
  localStorage.setItem(BOOKMARK_STORAGE_KEY, JSON.stringify(bookmarks));
}

function getChatStorageKey() {
  const memberId = localStorage.getItem('memberId');
  return memberId ? `${CHAT_STORAGE_KEY}_${memberId}` : CHAT_STORAGE_KEY;
}

function loadChatMessages() {
  try {
    const saved = sessionStorage.getItem(getChatStorageKey());
    const parsed = saved ? JSON.parse(saved) : null;
    return Array.isArray(parsed)
      ? parsed.filter((message) => !['featured-popup', 'demo-route-popups'].includes(message.id))
      : INITIAL_MESSAGES;
  } catch (error) {
    return INITIAL_MESSAGES;
  }
}

function normalizeBookmark(bookmark) {
  if (bookmark.popup) return bookmark;

  return {
    bookmarkId: bookmark.bookmarkId,
    popupId: bookmark.popupId,
    popup: normalizePopup(bookmark),
  };
}

function getRoutePayloadFromSearch(search) {
  const searchParams = new URLSearchParams(search);
  const popupId = Number(searchParams.get('popupId'));
  const targetPopupIds = (searchParams.get('targets') || '')
    .split(',')
    .map(Number)
    .filter(Boolean);

  if (!popupId || targetPopupIds.length === 0) return null;

  return {
    startPopupId: popupId,
    targetPopupIds,
  };
}

function mapOrderedPopup(popup) {
  return {
    id: String(popup.popupId || popup.id),
    name: popup.title || popup.name,
    location: popup.address || popup.location,
    image: popup.imageUrl || popup.image,
    lat: popup.latitude || popup.lat,
    lng: popup.longitude || popup.lng,
    period: `${popup.startDate || ''} - ${popup.endDate || ''}`,
    reservationUrl: popup.reservationUrl,
    openTime: popup.openTime,
    closeTime: popup.closeTime,
    order: popup.order || popup.routeOrder || popup.sequence,
  };
}

export default function App() {

  const [isLoggedIn, setIsLoggedIn] = useState(
    !!localStorage.getItem('accessToken')
  );
  const [currentPath, setCurrentPath] = useState(window.location.pathname);

  const isCallback = ['/callback', '/login/oauth2/code/naver'].includes(currentPath);
  const isChatPath = currentPath === '/chat';
  const isBookmarkPath = currentPath === '/bookmarks';
  const isMapPath = currentPath === '/map';

  const [messages, setMessages] = useState(loadChatMessages);
  const [isLoading, setIsLoading] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [mapMode, setMapMode] = useState('route');
  const [selectedPopups, setSelectedPopups] = useState([]);
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [routeError, setRouteError] = useState(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeRequestKey, setRouteRequestKey] = useState(window.location.search);
  const [selectedPopupDetail, setSelectedPopupDetail] = useState(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [bookmarks, setBookmarks] = useState(loadBookmarks);
  const [isBookmarking, setIsBookmarking] = useState(false);
  const messagesEndRef = useRef(null);
  const isMountedRef = useRef(true);
  const chatAbortRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadRoute = useCallback(async (payload) => {
    setMapMode('route');
    setSelectedPopups([]);
    setSelectedRoute(null);
    setSelectedPopupDetail(null);
    setRouteError(null);
    setRouteLoading(true);

    if (process.env.NODE_ENV === 'development') {
      console.log('[route] click popupId:', payload.startPopupId);
      console.log('[route] request payload:', payload);
    }

    try {
      const data = await apiFetch('/api/popups/routes/optimize', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      const result = data.result || data;
      const orderedPopups = (result.orderedPopups || []).map(mapOrderedPopup);

      if (process.env.NODE_ENV === 'development') {
        console.log('[route] response item count:', orderedPopups.length);
      }

      setSelectedPopups(orderedPopups);
      setSelectedRoute(result.route || null);
    } catch (error) {
      setSelectedPopups([]);
      setSelectedRoute(null);
      setRouteError(error);
    } finally {
      setRouteLoading(false);
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isChatPath && !showMap) {
      setTimeout(scrollToBottom, 0);
    }
  }, [isChatPath, showMap]);

  useEffect(() => {
    try {
      sessionStorage.setItem(getChatStorageKey(), JSON.stringify(messages));
    } catch {
      return;
    }
  }, [messages]);

  useEffect(() => {
    const handlePopState = () => {
      const nextPath = window.location.pathname;
      setCurrentPath(nextPath);

      if (nextPath !== '/map') {
        setShowMap(false);
      } else {
        const params = new URLSearchParams(window.location.search);
        setMapMode(params.get('mode') || 'route');
        setRouteRequestKey(window.location.search);
        setShowMap(true);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      chatAbortRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    if (isLoggedIn && !isCallback && !isChatPath && !isBookmarkPath && !isMapPath) {
      window.history.replaceState({}, '', '/chat');
      setCurrentPath('/chat');
    }
  }, [isLoggedIn, isCallback, isChatPath, isBookmarkPath, isMapPath]);

  useEffect(() => {
    if (!isLoggedIn || currentPath !== '/map') return;

    const params = new URLSearchParams(routeRequestKey);
    const mode = params.get('mode') || 'route';
    setMapMode(mode);
    setShowMap(true);

    if (mode === 'route') {
      const payload = getRoutePayloadFromSearch(routeRequestKey);

      if (payload) {
        loadRoute(payload);
      } else {
        setSelectedPopups([]);
        setSelectedRoute(null);
        setRouteError(new Error('경로 정보가 없습니다.'));
      }
    }
  }, [currentPath, isLoggedIn, loadRoute, routeRequestKey]);

  const handleSendMessage = async (text) => {
    chatAbortRef.current?.abort();
    const controller = new AbortController();
    chatAbortRef.current = controller;
    const userMessage = {
      id: Date.now().toString(),
      text,
      isBot: false,
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const data = await apiFetch('/api/v1/chats', {
        method: 'POST',
        signal: controller.signal,
        body: JSON.stringify({
          question: text,
        }),
      });

      if (!isMountedRef.current) return;

      const result = data.result || data;
      const popups = (result.recommendedPopups || []).map(normalizePopup);

      const botMessage = {
        id: (Date.now() + 1).toString(),
        text: result.answer,
        isBot: true,
        popups: popups,
      };

      setMessages((prev) => [...prev, botMessage]);

    } catch (error) {
      if (!isMountedRef.current || error.name === 'AbortError') return;

      setMessages((prev) => [...prev, {
        id: (Date.now() + 1).toString(),
        text: '아직 채팅 API가 연결되지 않았어요. 지금은 채팅 화면 확인용으로 입력만 보여드리고 있습니다.',
        isBot: true,
      }]);

    } finally {
      if (chatAbortRef.current === controller) {
        chatAbortRef.current = null;
      }
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  };

  const handleShowRoute = (clickedPopup, parentMessagePopups = []) => {
    const startPopupId = Number(clickedPopup.id);
    const targetPopupIds = parentMessagePopups
      .map((popup) => Number(popup.id))
      .filter(Boolean);

    if (!startPopupId || targetPopupIds.length === 0) return;

    const search = `?mode=route&popupId=${startPopupId}&targets=${targetPopupIds.join(',')}`;
    window.history.pushState({}, '', `/map${search}`);
    setCurrentPath('/map');
    setRouteRequestKey(search);
    setShowMap(true);
  };

  const handleShowPopupDetail = async (popup) => {
    setSelectedPopupDetail(popup);

    if (!Number.isFinite(Number(popup.id))) {
      return;
    }

    setIsDetailLoading(true);

    try {
      const data = await apiFetch(`/api/v1/popups/${popup.id}`);
      const detail = data.result || data;
      setSelectedPopupDetail(normalizePopup(detail));
    } catch (error) {
      setSelectedPopupDetail({
        ...popup,
        description: popup.description || '상세 정보를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.',
      });
    } finally {
      setIsDetailLoading(false);
    }
  };

  const handleAddBookmark = async (popup) => {
    if (!popup?.id) return;

    const normalizedPopup = normalizePopup(popup);
    const popupId = Number(normalizedPopup.id);
    const existingBookmark = bookmarks.find(
      (bookmark) => String(bookmark.popupId) === String(normalizedPopup.id)
    );

    if (existingBookmark) return;

    setIsBookmarking(true);

    try {
      const data = await apiFetch('/api/v1/bookmarks', {
        method: 'POST',
        body: JSON.stringify({ popupId }),
      });
      const result = data.result || data;
      const nextBookmarks = [
        ...bookmarks,
        {
          bookmarkId: result.id,
          popupId: normalizedPopup.id,
          popup: normalizedPopup,
        },
      ];

      setBookmarks(nextBookmarks);
      saveBookmarks(nextBookmarks);
    } catch (error) {
      const nextBookmarks = [
        ...bookmarks,
        {
          bookmarkId: null,
          popupId: normalizedPopup.id,
          popup: normalizedPopup,
        },
      ];

      setBookmarks(nextBookmarks);
      saveBookmarks(nextBookmarks);
      alert(error.message || '서버 북마크 등록은 실패했지만 화면에는 저장했습니다.');
    } finally {
      setIsBookmarking(false);
    }
  };

  const handleRemoveBookmark = async (bookmark) => {
    const nextBookmarks = bookmarks.filter(
      (item) => String(item.popupId) !== String(bookmark.popupId)
    );

    setBookmarks(nextBookmarks);
    saveBookmarks(nextBookmarks);

    if (!bookmark.bookmarkId) return;

    try {
      await apiFetch(`/api/v1/bookmarks/${bookmark.bookmarkId}`, {
        method: 'DELETE',
      });
    } catch (error) {
      alert(error.message || '서버 북마크 삭제에 실패했습니다.');
    }
  };

  const handleOpenBookmarks = useCallback(async () => {
    window.history.pushState({}, '', '/bookmarks');
    setCurrentPath('/bookmarks');
    setSelectedPopupDetail(null);
    setShowMap(false);

    try {
      const data = await apiFetch('/api/v1/bookmarks');
      const result = data.result || data;
      const nextBookmarks = (Array.isArray(result) ? result : result.bookmarks || [])
        .map(normalizeBookmark);

      setBookmarks(nextBookmarks);
      saveBookmarks(nextBookmarks);
    } catch (error) {
      alert(error.message || '북마크 목록을 불러오지 못했습니다.');
    }
  }, []);

  const handleOpenMap = useCallback(async () => {
    setMapMode('bookmark');
    setSelectedRoute(null);
    setSelectedPopupDetail(null);
    window.history.pushState({}, '', '/map?mode=bookmark');
    setCurrentPath('/map');

    try {
      const data = await apiFetch('/api/v1/bookmarks');
      const result = data.result || data;
      const bookmarkList = Array.isArray(result) ? result : result.bookmarks || [];
      setSelectedPopups(bookmarkList.map(normalizeBookmark).map((bookmark) => bookmark.popup));
    } catch (error) {
      setSelectedPopups(bookmarks.map((bookmark) => bookmark.popup).filter(Boolean));
    }

    setShowMap(true);
  }, [bookmarks]);

  const handleBackToChat = useCallback(() => {
    window.history.back();
    setSelectedPopupDetail(null);
  }, []);

  const handleLoginSuccess = useCallback((success = true) => {
    const nextPath = success ? '/chat' : '/';
    window.history.replaceState({}, '', nextPath);
    setCurrentPath(nextPath);
    setIsLoggedIn(success);
    setShowMap(false);
    setSelectedPopupDetail(null);
  }, []);

  const handleLocalLogin = useCallback(() => {
    window.history.replaceState({}, '', '/chat');
    setCurrentPath('/chat');
    setIsLoggedIn(true);
  }, []);

  if (isCallback) {
    return <OAuthCallback onLoginSuccess={handleLoginSuccess} />;
  }

  if (!isLoggedIn) {
    return <LoginPage onLogin={handleLocalLogin} />;
  }

  if (showMap) {
    return (
      <>
        <MapView
          mode={mapMode}
          popups={selectedPopups}
          onBack={() => {
            window.history.back();
          }}
          route={selectedRoute}
          routeError={routeError}
          routeLoading={routeLoading}
          onShowDetail={handleShowPopupDetail}
        />
        <PopupDetailModal
          popup={selectedPopupDetail}
          isLoading={isDetailLoading}
          isBookmarked={bookmarks.some(
            (bookmark) => String(bookmark.popupId) === String(selectedPopupDetail?.id)
          )}
          isBookmarking={isBookmarking}
          onAddBookmark={handleAddBookmark}
          onClose={() => setSelectedPopupDetail(null)}
        />
      </>
    );
  }

  if (isBookmarkPath) {
    return (
      <>
        <BookmarkPage
          bookmarks={bookmarks}
          onBack={handleBackToChat}
          onRemoveBookmark={handleRemoveBookmark}
          onShowDetail={handleShowPopupDetail}
        />
        <PopupDetailModal
          popup={selectedPopupDetail}
          isLoading={isDetailLoading}
          isBookmarked={bookmarks.some(
            (bookmark) => String(bookmark.popupId) === String(selectedPopupDetail?.id)
          )}
          isBookmarking={isBookmarking}
          onAddBookmark={handleAddBookmark}
          onClose={() => setSelectedPopupDetail(null)}
        />
      </>
    );
  }

  return (
    <div className={`app-container ${selectedPopupDetail ? 'app-container--detail-open' : ''}`}>
      <div className="app-header">
        <div className="header-inner">
          <div />
          <div className="header-brand">POPCORN</div>
          <div className="header-actions">
            <button
              className="header-icon-btn"
              onClick={handleOpenBookmarks}
              aria-label="북마크"
            >
              북마크
            </button>
            <button className="header-icon-btn" onClick={handleOpenMap} aria-label="지도">
              지도
            </button>
          </div>
        </div>
      </div>

      <div className="messages-area">
        <div className="messages-inner">
          {messages.map((message) => (
            <ChatMessage
              key={message.id}
              message={message.text}
              isBot={message.isBot}
              popups={message.popups}
              onShowRoute={handleShowRoute}
              onShowDetail={handleShowPopupDetail}
            />
          ))}

          {isLoading && (
            <div className="loading-row">
              <div className="loading-bubble">
                <span className="dot" style={{ animationDelay: '0ms' }} />
                <span className="dot" style={{ animationDelay: '150ms' }} />
                <span className="dot" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      <ChatInput onSendMessage={handleSendMessage} disabled={isLoading} />
      <p className="chat-disclaimer">AI-generated recommendations may not be perfect.</p>
      <PopupDetailModal
        popup={selectedPopupDetail}
        isLoading={isDetailLoading}
        isBookmarked={bookmarks.some(
          (bookmark) => String(bookmark.popupId) === String(selectedPopupDetail?.id)
        )}
        isBookmarking={isBookmarking}
        onAddBookmark={handleAddBookmark}
        onClose={() => setSelectedPopupDetail(null)}
      />
    </div>
  );
}

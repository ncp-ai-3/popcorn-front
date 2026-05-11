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

const FEATURED_POPUP = normalizePopup({
  id: 40,
  imageUrl: 'https://d8nffddmkwqeq.cloudfront.net/store/df67eaea%2Ce484%2C44e2%2Ca2ca%2C8f3c5f3361d3',
  title: '베르디 전시 - I Believe in Me',
  mainBrand: 'VERDY',
  hashtags: '베르디 전시,베르디,롯데뮤지엄,I Believe in Me,VERDY,전시',
  description: '동시대 유스 컬처를 대표하는 아티스트 VERDY의 첫 미술관 개인전입니다.',
  address: '서울 송파구 올림픽로 300 롯데월드타워 7층 롯데뮤지엄',
  startDate: '2026-04-24',
  endDate: '2026-07-19',
  openTime: '10:30:00',
  closeTime: '19:00:00',
  reservationUrl: null,
  status: 'open',
  categories: [{ id: 3, name: '전시' }],
  showRoute: false,
});

const DEMO_ROUTE_POPUPS = [
  normalizePopup({
    id: 1,
    imageUrl: 'https://d8nffddmkwqeq.cloudfront.net/store/c1929a3e%2Cf195%2C4e0c%2C89f5%2Cc7755380eb09',
    title: 'THE GATHERING SEOUL 2026',
    mainBrand: 'X THE LEAGUE',
    address: '서울 성동구 연무장15길 11 SFACTORY D동',
    startDate: '2026-05-10',
    endDate: '2026-05-10',
    openTime: '12:30:00',
    closeTime: '20:00:00',
    reservationUrl: 'https://xtheleague.com/xtl/about',
    status: 'done',
    latitude: 37.54283,
    longitude: 127.0589872,
    lat: 37.54283,
    lng: 127.0589872,
    categories: [{ id: 1, name: '연예/크리에이터' }],
  }),
  normalizePopup({
    id: 30,
    imageUrl: 'https://d8nffddmkwqeq.cloudfront.net/store/936fb19b%2C5d81%2C429f%2C9569%2Cdb4083eb77a4',
    title: '리즈다 팝업',
    mainBrand: 'LIZDA',
    address: '서울 성동구 성수이로7가길 20-1',
    startDate: '2026-04-15',
    endDate: '2026-05-17',
    openTime: '10:00:00',
    closeTime: '21:00:00',
    status: 'open',
    latitude: 37.5419341,
    longitude: 127.0555625,
    lat: 37.5419341,
    lng: 127.0555625,
    categories: [{ id: 2, name: '뷰티/헬스' }],
  }),
  normalizePopup({
    id: 61,
    imageUrl: 'https://d8nffddmkwqeq.cloudfront.net/store/de50a43d%2C1bed%2C492c%2Cbf70%2Cbefb2320d205',
    title: '후아유 팝업스토어',
    mainBrand: 'WHO.A.U',
    address: '서울 중구 명동8길 40 에이랜드 명동 본점',
    startDate: '2025-12-03',
    endDate: '2026-06-02',
    openTime: '09:00:00',
    closeTime: '18:00:00',
    status: 'open',
    latitude: 37.5619002,
    longitude: 126.9847445,
    lat: 37.5619002,
    lng: 126.9847445,
    categories: [{ id: 4, name: '패션' }],
  }),
];

function createFallbackRoute(popups) {
  return {
    totalDistanceMeter: 0,
    totalDurationMinute: 0,
    totalDurationMs: 0,
    path: popups
      .map((popup) => ({
        latitude: popup.lat || popup.latitude,
        longitude: popup.lng || popup.longitude,
      }))
      .filter((point) => point.latitude && point.longitude),
  };
}

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

function normalizeBookmark(bookmark) {
  if (bookmark.popup) return bookmark;

  return {
    bookmarkId: bookmark.bookmarkId,
    popupId: bookmark.popupId,
    popup: normalizePopup(bookmark),
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

  const [messages, setMessages] = useState([
    {
      id: '1',
      text: '안녕하세요! 서울의 팝업 경로를 추천해드립니다. 가고 싶은 지역과 팝업 테마를 알려주세요!',
      isBot: true,
    },
    {
      id: 'featured-popup',
      text: '추천 팝업입니다.',
      isBot: true,
      popups: [FEATURED_POPUP],
    },
    {
      id: 'demo-route-popups',
      text: '경로 시연용 추천 팝업입니다.',
      isBot: true,
      popups: DEMO_ROUTE_POPUPS,
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [mapMode, setMapMode] = useState('route');
  const [selectedPopups, setSelectedPopups] = useState([]);
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [selectedPopupDetail, setSelectedPopupDetail] = useState(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [bookmarks, setBookmarks] = useState(loadBookmarks);
  const [isBookmarking, setIsBookmarking] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isLoggedIn && !isCallback && !isChatPath && !isBookmarkPath) {
      window.history.replaceState({}, '', '/chat');
      setCurrentPath('/chat');
    }
  }, [isLoggedIn, isCallback, isChatPath, isBookmarkPath]);

  const handleSendMessage = async (text) => {
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
        body: JSON.stringify({
          question: text,
        }),
      });

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
      setMessages((prev) => [...prev, {
        id: (Date.now() + 1).toString(),
        text: '아직 채팅 API가 연결되지 않았어요. 지금은 채팅 화면 확인용으로 입력만 보여드리고 있습니다.',
        isBot: true,
      }]);

    } finally {
      setIsLoading(false);
    }
  };

  const handleShowRoute = async (popupId) => {
    const currentMessage = messages.find((msg) =>
      msg.popups?.some((p) => p.id === popupId)
    );
    if (currentMessage?.popups) {
      const targetPopupIds = currentMessage.popups.map((popup) => Number(popup.id));

      try {
        const data = await apiFetch('/api/popups/routes/optimize', {
          method: 'POST',
          body: JSON.stringify({
            startPopupId: Number(popupId),
            targetPopupIds,
          }),
        });
        const result = data.result || data;
        const orderedPopups = (result.orderedPopups || []).map((popup) => ({
          id: String(popup.popupId),
          name: popup.title,
          location: popup.address,
          image: popup.imageUrl,
          lat: popup.latitude,
          lng: popup.longitude,
          period: `${popup.startDate || ''} - ${popup.endDate || ''}`,
          reservationUrl: popup.reservationUrl,
          openTime: popup.openTime,
          closeTime: popup.closeTime,
        }));

        setSelectedPopups(orderedPopups.length > 0 ? orderedPopups : currentMessage.popups);
        setSelectedRoute(result.route || null);
      } catch (error) {
        setSelectedPopups(currentMessage.popups);
        setSelectedRoute(createFallbackRoute(currentMessage.popups));
      } finally {
        setMapMode('route');
        window.history.replaceState({}, '', `/map?mode=route&popupId=${popupId}`);
        setShowMap(true);
      }
    }
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
    window.history.replaceState({}, '', '/bookmarks');
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
    window.history.replaceState({}, '', '/map?mode=bookmark');

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
    window.history.replaceState({}, '', '/chat');
    setCurrentPath('/chat');
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
            window.history.replaceState({}, '', '/chat');
            setShowMap(false);
          }}
          route={selectedRoute}
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
              <div className="bot-avatar">✨</div>
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

import { useState, useRef, useEffect, useCallback } from 'react';
import { ChatMessage } from './components/ChatMessage';
import { ChatInput } from './components/ChatInput';
import { MapView } from './components/MapView';
import { LoginPage } from './components/LoginPage';
import { OAuthCallback } from './components/OAuthCallback';
import { apiFetch } from './api';
import './App.css';

export default function App() {

  const [isLoggedIn, setIsLoggedIn] = useState(
    !!localStorage.getItem('accessToken')
  );
  const [currentPath, setCurrentPath] = useState(window.location.pathname);

  const isCallback = ['/callback', '/login/oauth2/code/naver'].includes(currentPath);
  const isChatPath = currentPath === '/chat';

  const [messages, setMessages] = useState([
    {
      id: '1',
      text: '안녕하세요! 서울의 팝업 경로를 추천해드립니다. 가고 싶은 지역과 팝업 테마를 알려주세요!',
      isBot: true,
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [selectedPopups, setSelectedPopups] = useState([]);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isLoggedIn && !isCallback && !isChatPath) {
      window.history.replaceState({}, '', '/chat');
      setCurrentPath('/chat');
    }
  }, [isLoggedIn, isCallback, isChatPath]);

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
      const popups = (result.recommendedPopups || []).map((popup) => ({
        id: String(popup.id),
        name: popup.title,
        location: popup.address,
        theme: popup.categories.map((c) => c.name).join(', '),
        period: `${popup.startDate} - ${popup.endDate}`,
        image: popup.imageUrl,
        lat: popup.latitude,
        lng: popup.longitude,
        naverPlaceId: popup.naverPlaceId,
        reservationUrl: popup.reservationUrl,
        openTime: popup.openTime,
        closeTime: popup.closeTime,
      }));

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

  const handleShowRoute = (popupId) => {
    const currentMessage = messages.find((msg) =>
      msg.popups?.some((p) => p.id === popupId)
    );
    if (currentMessage?.popups) {
      setSelectedPopups(currentMessage.popups);
      setShowMap(true);
    }
  };

  const handleLoginSuccess = useCallback((success = true) => {
    const nextPath = success ? '/chat' : '/';
    window.history.replaceState({}, '', nextPath);
    setCurrentPath(nextPath);
    setIsLoggedIn(success);
    setShowMap(false);
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
      <MapView
        popups={selectedPopups}
        onBack={() => setShowMap(false)}
        totalDuration={90}
        routeSegments={[
          { distance: 1.2, duration: 15 },
          { distance: 0.8, duration: 10 },
        ]}
      />
    );
  }

  return (
    <div className="app-container">
      <div className="app-header">
        <div className="header-inner">
          <div className="header-avatar">✨</div>
          <div>
            <h1 className="header-title">서울 팝업 추천</h1>
            <p className="header-subtitle">AI 기반 맞춤형 팝업 경로 추천</p>
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
    </div>
  );
}

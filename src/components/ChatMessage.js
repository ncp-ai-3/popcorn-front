import './ChatMessage.css';

export function ChatMessage({ message, isBot, popups, onShowRoute }) {
  return (
    <div className={`message-row ${isBot ? 'message-row--bot' : 'message-row--user'}`}>
      {isBot && (
        <div className="bot-avatar">🤖</div>
      )}

      <div className="message-body">
        <div className={`bubble ${isBot ? 'bubble--bot' : 'bubble--user'}`}>
          <p className="bubble-text">{message}</p>
        </div>

        {popups && popups.length > 0 && (
          <div className="popup-list">
            {popups.map((popup) => (
              <div key={popup.id} className="popup-card">
                <div className="popup-card-inner">
                  <img
                    src={popup.image}
                    alt={popup.name}
                    className="popup-image"
                  />
                  <div className="popup-info">
                    <h3 className="popup-name">{popup.name}</h3>
                    <p className="popup-detail"><span>위치:</span> {popup.location}</p>
                    <p className="popup-detail"><span>테마:</span> {popup.theme}</p>
                    <p className="popup-detail"><span>기간:</span> {popup.period}</p>
                  </div>
                </div>
                <button
                  className="route-btn"
                  onClick={() => onShowRoute?.(popup.id)}
                >
                  경로보기
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {!isBot && (
        <div className="user-avatar">🙋</div>
      )}
    </div>
  );
}
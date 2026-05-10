import { useState } from 'react';
import './ChatInput.css';

export function ChatInput({ onSendMessage, disabled }) {
  const [message, setMessage] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (message.trim() && !disabled) {
      onSendMessage(message);
      setMessage('');
    }
  };

  return (
    <form className="chat-input-form" onSubmit={handleSubmit}>
      <div className="chat-input-inner">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="가고 싶은 지역과 팝업 테마를 알려주세요..."
          disabled={disabled}
          className="chat-input-field"
        />
        <button
          type="submit"
          disabled={!message.trim() || disabled}
          className="chat-send-btn"
        >
          ➤
        </button>
      </div>
    </form>
  );
}
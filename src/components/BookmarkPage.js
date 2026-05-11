import './BookmarkPage.css';

export function BookmarkPage({ bookmarks, onBack, onRemoveBookmark, onShowDetail }) {
  return (
    <div className="bookmark-page">
      <header className="bookmark-header">
        <div>
          <h1>북마크</h1>
          <p>저장한 팝업을 모아봤어요.</p>
        </div>
        <button className="bookmark-back-btn" onClick={onBack}>
          채팅으로
        </button>
      </header>

      {bookmarks.length === 0 ? (
        <div className="bookmark-empty">
          <h2>아직 북마크한 팝업이 없어요.</h2>
          <p>팝업 상세 정보에서 북마크 추가를 눌러 저장해보세요.</p>
        </div>
      ) : (
        <div className="bookmark-grid">
          {bookmarks.map((bookmark) => {
            const popup = bookmark.popup;

            return (
              <article className="bookmark-card" key={bookmark.popupId}>
                {popup.image && (
                  <img className="bookmark-image" src={popup.image} alt={popup.name} />
                )}
                <div className="bookmark-content">
                  <h2>{popup.name}</h2>
                  <p><span>위치</span>{popup.location}</p>
                  <p><span>테마</span>{popup.theme}</p>
                  <p><span>기간</span>{popup.period}</p>
                </div>
                <div className="bookmark-actions">
                  <button onClick={() => onShowDetail(popup)}>상세 정보보기</button>
                  <button
                    className="bookmark-remove-btn"
                    onClick={() => onRemoveBookmark(bookmark)}
                  >
                    북마크 제거
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

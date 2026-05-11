import './PopupDetailModal.css';

function formatTime(time) {
  if (!time) return null;

  if (typeof time === 'string') {
    return time.slice(0, 5);
  }

  const hour = String(time.hour ?? 0).padStart(2, '0');
  const minute = String(time.minute ?? 0).padStart(2, '0');
  return `${hour}:${minute}`;
}

function formatDateRange(startDate, endDate) {
  if (!startDate && !endDate) return null;
  if (!startDate) return endDate;
  if (!endDate) return startDate;
  return `${startDate} - ${endDate}`;
}

function categoryText(categories) {
  if (!categories?.length) return null;
  return categories.map((category) => category.name).filter(Boolean).join(', ');
}

export function PopupDetailModal({
  popup,
  isLoading,
  isBookmarked,
  isBookmarking,
  onAddBookmark,
  onClose,
}) {
  if (!popup && !isLoading) return null;

  const title = popup?.title || popup?.name || '팝업 상세 정보';
  const imageUrl = popup?.imageUrl || popup?.image;
  const period = formatDateRange(popup?.startDate, popup?.endDate) || popup?.period;
  const openTime = formatTime(popup?.openTime);
  const closeTime = formatTime(popup?.closeTime);
  const hours = openTime && closeTime ? `${openTime} - ${closeTime}` : null;
  const categories = categoryText(popup?.categories) || popup?.theme;
  const hashtags = popup?.hashtags
    ?.split(',')
    .map((tag) => tag.trim())
    .filter(Boolean);

  return (
    <div className="popup-detail-overlay" onClick={onClose}>
      <aside
        className="popup-detail-panel"
        aria-label="팝업 상세 정보"
        onClick={(event) => event.stopPropagation()}
      >
      <div className="popup-detail-header">
        <div>
          <p className="popup-detail-eyebrow">상세 정보</p>
          <h2>{title}</h2>
        </div>
        <button className="popup-detail-close" onClick={onClose} aria-label="닫기">
          ×
        </button>
      </div>

      {isLoading ? (
        <div className="popup-detail-loading">상세 정보를 불러오는 중...</div>
      ) : (
        <>
          {imageUrl && (
            <img className="popup-detail-hero" src={imageUrl} alt={title} />
          )}

          <div className="popup-detail-content">
            {popup?.mainBrand && (
              <div className="popup-detail-row">
                <span>브랜드</span>
                <strong>{popup.mainBrand}</strong>
              </div>
            )}
            {categories && (
              <div className="popup-detail-row">
                <span>카테고리</span>
                <strong>{categories}</strong>
              </div>
            )}
            {period && (
              <div className="popup-detail-row">
                <span>운영 기간</span>
                <strong>{period}</strong>
              </div>
            )}
            {hours && (
              <div className="popup-detail-row">
                <span>운영 시간</span>
                <strong>{hours}</strong>
              </div>
            )}
            {(popup?.address || popup?.location) && (
              <div className="popup-detail-row">
                <span>주소</span>
                <strong>{popup.address || popup.location}</strong>
              </div>
            )}
            {popup?.status && (
              <div className="popup-detail-row">
                <span>상태</span>
                <strong>{popup.status}</strong>
              </div>
            )}
          </div>

          {popup?.description && (
            <p className="popup-detail-description">{popup.description}</p>
          )}

          {hashtags?.length > 0 && (
            <div className="popup-detail-tags">
              {hashtags.map((tag) => (
                <span key={tag}>{tag.startsWith('#') ? tag : `#${tag}`}</span>
              ))}
            </div>
          )}

          {popup?.reservationUrl && (
            <a
              className="popup-detail-link"
              href={popup.reservationUrl}
              target="_blank"
              rel="noreferrer"
            >
              예약 페이지 열기
            </a>
          )}

          <button
            className="popup-detail-bookmark"
            type="button"
            onClick={() => onAddBookmark?.(popup)}
            disabled={isBookmarked || isBookmarking}
          >
            {isBookmarking
              ? '북마크 추가 중...'
              : isBookmarked
                ? '북마크에 추가됨'
                : '북마크 추가'}
          </button>
        </>
      )}
      </aside>
    </div>
  );
}

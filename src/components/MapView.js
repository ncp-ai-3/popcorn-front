import './MapView.css';

export function MapView({ popups, onBack, totalDuration = 120, routeSegments }) {
  const segments = routeSegments || popups.slice(0, -1).map(() => ({
    distance: Math.random() * 2 + 0.5,
    duration: Math.floor(Math.random() * 15 + 5),
  }));

  return (
    <div className="mapview-container">
      <div className="mapview-header">
        <div className="mapview-header-inner">
          <button className="back-btn" onClick={onBack}>←</button>
          <h2 className="mapview-title">팝업 경로</h2>
        </div>
      </div>

      <div className="map-area">
        <div className="map-placeholder">
          <div className="map-placeholder-icon">📍</div>
          <p className="map-placeholder-text">지도가 여기에 표시됩니다</p>
          <p className="map-placeholder-sub">Google Maps API 또는 Kakao Maps API 연동 필요</p>
        </div>
      </div>

      <div className="route-panel">
        <div className="route-panel-inner">
          <div className="route-panel-header">
            <h3 className="route-panel-title">🗺️ 추천 경로</h3>
            <div className="total-time-badge">🕐 총 {totalDuration}분</div>
          </div>

          <div className="route-list">
            {popups.map((popup, index) => (
              <div key={popup.id}>
                <div className="route-item">
                  <div className="route-number">{index + 1}</div>
                  <div className="route-info">
                    <p className="route-name">{popup.name}</p>
                    <p className="route-location">{popup.location}</p>
                  </div>
                </div>

                {index < popups.length - 1 && segments[index] && (
                  <div className="segment-info">
                    <span>↓</span>
                    <span className="segment-distance">{segments[index].distance.toFixed(1)}km</span>
                    <span className="segment-dot">•</span>
                    <span>🕐</span>
                    <span className="segment-duration">{segments[index].duration}분</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
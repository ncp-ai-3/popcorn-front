import { useEffect, useMemo, useRef, useState } from 'react';
import './MapView.css';

const NAVER_MAP_SCRIPT_ID = 'naver-map-script';

function loadNaverMapScript(ncpKeyId) {
  if (window.naver?.maps) return Promise.resolve();

  return new Promise((resolve, reject) => {
    const existingScript = document.getElementById(NAVER_MAP_SCRIPT_ID);

    if (existingScript) {
      existingScript.addEventListener('load', resolve, { once: true });
      existingScript.addEventListener('error', reject, { once: true });
      return;
    }

    const script = document.createElement('script');
    script.id = NAVER_MAP_SCRIPT_ID;
    script.src = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${ncpKeyId}`;
    script.async = true;
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

function toLatLng(point) {
  if (!point?.latitude || !point?.longitude) return null;
  return new window.naver.maps.LatLng(point.latitude, point.longitude);
}

function escapeHtml(value) {
  return String(value || '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[char]));
}

export function MapView({ mode = 'route', popups, onBack, route, onShowDetail }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const overlaysRef = useRef([]);
  const [mapError, setMapError] = useState('');
  const ncpKeyId = process.env.REACT_APP_NAVER_MAP_NCP_KEY_ID;

  const routePath = useMemo(
    () => (route?.path || []).filter((point) => point.latitude && point.longitude),
    [route]
  );
  const markerPopups = useMemo(
    () => popups.filter((popup) => popup.lat && popup.lng),
    [popups]
  );

  useEffect(() => {
    if (!ncpKeyId) {
      setMapError('네이버 지도 키가 필요합니다. REACT_APP_NAVER_MAP_NCP_KEY_ID를 설정해주세요.');
      return;
    }

    let isMounted = true;

    loadNaverMapScript(ncpKeyId)
      .then(() => {
        if (!isMounted || !mapRef.current) return;

        const firstMarkerPoint = markerPopups[0]
          ? { latitude: markerPopups[0].lat, longitude: markerPopups[0].lng }
          : null;
        const firstPoint = routePath[0] || firstMarkerPoint;
        const center = toLatLng(firstPoint) || new window.naver.maps.LatLng(37.5665, 126.9780);
        const map = new window.naver.maps.Map(mapRef.current, {
          center,
          zoom: 13,
          zoomControl: true,
        });

        mapInstanceRef.current = map;
        overlaysRef.current.forEach((overlay) => overlay.setMap(null));
        overlaysRef.current = [];

        markerPopups.forEach((popup, index) => {
          const markerPosition = new window.naver.maps.LatLng(popup.lat, popup.lng);
          const marker = new window.naver.maps.Marker({
            position: markerPosition,
            map,
            title: popup.name,
            icon: mode === 'bookmark' ? {
              content: `
                <button class="map-popup-marker" type="button">
                  <span class="map-popup-pin"></span>
                  <span class="map-popup-label">${escapeHtml(popup.name)}</span>
                </button>
              `,
              anchor: new window.naver.maps.Point(18, 42),
            } : undefined,
          });
          const infoWindow = new window.naver.maps.InfoWindow({
            content: `<div style="padding:8px 10px;font-size:12px;font-weight:700;">${index + 1}. ${popup.name}</div>`,
          });

          window.naver.maps.Event.addListener(marker, 'click', () => {
            if (mode === 'route') {
              infoWindow.open(map, marker);
            }
            onShowDetail?.(popup);
          });

          overlaysRef.current.push(marker, infoWindow);
        });

        const path = routePath.map(toLatLng).filter(Boolean);

        if (path.length > 1) {
          const polyline = new window.naver.maps.Polyline({
            map,
            path,
            strokeColor: '#8a6800',
            strokeWeight: 5,
            strokeOpacity: 0.9,
          });
          overlaysRef.current.push(polyline);
        }

        const boundPoints = [
          ...path,
          ...markerPopups.map((popup) => new window.naver.maps.LatLng(popup.lat, popup.lng)),
        ];

        if (boundPoints.length > 0) {
          const bounds = new window.naver.maps.LatLngBounds();
          boundPoints.forEach((latLng) => bounds.extend(latLng));
          map.fitBounds(bounds, { top: 60, right: 60, bottom: 60, left: 60 });
        }
      })
      .catch(() => {
        if (isMounted) {
          setMapError('네이버 지도를 불러오지 못했습니다.');
        }
      });

    return () => {
      isMounted = false;
      overlaysRef.current.forEach((overlay) => overlay.setMap?.(null));
      overlaysRef.current = [];
    };
  }, [mode, ncpKeyId, markerPopups, onShowDetail, routePath]);

  return (
    <div className="mapview-container">
      <div className="mapview-header">
        <div className="mapview-header-inner">
          <button className="back-btn" onClick={onBack}>←</button>
          <h2 className="mapview-title">{mode === 'bookmark' ? '북마크 지도' : '팝업 경로'}</h2>
        </div>
      </div>

      <div className="map-area">
        <div ref={mapRef} className="naver-map" />
        {mapError && (
          <div className="map-placeholder">
            <div className="map-placeholder-icon">지도</div>
            <p className="map-placeholder-text">{mapError}</p>
          </div>
        )}
      </div>

      <div className="route-panel">
        <div className="route-panel-inner">
          <div className="route-panel-header">
            <h3 className="route-panel-title">{mode === 'bookmark' ? '북마크 팝업' : '추천 경로'}</h3>
            {mode === 'route' && (
              <div className="total-time-badge">총 {route?.totalDurationMinute || 0}분</div>
            )}
          </div>

          <div className="route-list">
            {popups.map((popup, index) => (
              <button
                className={`route-item ${mode === 'bookmark' ? 'route-item--clickable' : ''}`}
                key={popup.id}
                type="button"
                onClick={() => mode === 'bookmark' && onShowDetail?.(popup)}
              >
                <div className="route-number">{index + 1}</div>
                {mode === 'bookmark' && popup.image && (
                  <img className="route-thumb" src={popup.image} alt={popup.name} />
                )}
                <div className="route-info">
                  <p className="route-name">{popup.name}</p>
                  <p className="route-location">{popup.location}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { useAdvancedBoardControls, type BookmarkData, type Point2D } from '../hooks/useAdvancedBoardControls';
import { Camera } from '../core/models/Camera';

interface BoardControlsPanelProps {
  cameraModel: Camera;
  containerRef: React.RefObject<HTMLElement>;
  className?: string;
}

export const BoardControlsPanel: React.FC<BoardControlsPanelProps> = ({
  cameraModel,
  containerRef,
  className = ''
}) => {
  const [newBookmarkName, setNewBookmarkName] = useState('');
  const [showBookmarks, setShowBookmarks] = useState(false);
  const [teleportX, setTeleportX] = useState('');
  const [teleportY, setTeleportY] = useState('');

  const controls = useAdvancedBoardControls(cameraModel, {
    enableKeyboardControls: true,
    enableSmoothAnimations: true,
    containerRef
  });

  const handleAddBookmark = () => {
    if (newBookmarkName.trim()) {
      controls.addBookmark(newBookmarkName.trim());
      setNewBookmarkName('');
    }
  };

  const handleTeleport = () => {
    const x = parseFloat(teleportX);
    const y = parseFloat(teleportY);
    
    if (!isNaN(x) && !isNaN(y)) {
      controls.teleportTo({ x, y });
      setTeleportX('');
      setTeleportY('');
    }
  };

  const currentPos = controls.getCurrentPosition();
  const currentZoom = controls.getCurrentZoom();

  return (
    <div className={`board-controls-panel ${className}`} style={{
      position: 'absolute',
      top: '10px',
      right: '10px',
      background: 'rgba(0, 0, 0, 0.8)',
      color: 'white',
      padding: '15px',
      borderRadius: '8px',
      minWidth: '280px',
      fontSize: '12px',
      fontFamily: 'Arial, sans-serif',
      zIndex: 1000
    }}>
      
      {/* Status Atual */}
      <div style={{ marginBottom: '15px', fontSize: '11px', color: '#ccc' }}>
        <div><strong>Posição:</strong> X: {currentPos.x.toFixed(1)}, Y: {currentPos.y.toFixed(1)}</div>
        <div><strong>Zoom:</strong> {(currentZoom * 100).toFixed(0)}%</div>
        {controls.isFollowing && <div style={{ color: '#4CAF50' }}>🎯 Auto-seguimento ativo</div>}
        {controls.isAnimating && <div style={{ color: '#2196F3' }}>🌟 Animando...</div>}
      </div>

      {/* Controles Básicos */}
      <div style={{ marginBottom: '15px' }}>
        <h4 style={{ margin: '0 0 8px 0', fontSize: '13px' }}>Controles Básicos</h4>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px' }}>
          <button 
            onClick={controls.centerCamera}
            style={buttonStyle}
            disabled={controls.isAnimating}
          >
            🏠 Centro
          </button>
          <button 
            onClick={controls.resetZoom}
            style={buttonStyle}
            disabled={controls.isAnimating}
          >
            🔍 Reset Zoom
          </button>
        </div>
      </div>

      {/* Teleporte */}
      <div style={{ marginBottom: '15px' }}>
        <h4 style={{ margin: '0 0 8px 0', fontSize: '13px' }}>Teleporte</h4>
        <div style={{ display: 'flex', gap: '5px', marginBottom: '5px' }}>
          <input
            type="number"
            placeholder="X"
            value={teleportX}
            onChange={(e) => setTeleportX(e.target.value)}
            style={inputStyle}
          />
          <input
            type="number"
            placeholder="Y"
            value={teleportY}
            onChange={(e) => setTeleportY(e.target.value)}
            style={inputStyle}
          />
          <button 
            onClick={handleTeleport}
            style={buttonStyle}
            disabled={controls.isAnimating}
          >
            ⚡ Ir
          </button>
        </div>
      </div>

      {/* Bookmarks */}
      <div style={{ marginBottom: '15px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <h4 style={{ margin: 0, fontSize: '13px' }}>Bookmarks ({controls.bookmarks.length})</h4>
          <button 
            onClick={() => setShowBookmarks(!showBookmarks)}
            style={{ ...buttonStyle, padding: '2px 6px', fontSize: '10px' }}
          >
            {showBookmarks ? '▲' : '▼'}
          </button>
        </div>
        
        {showBookmarks && (
          <>
            {/* Adicionar Bookmark */}
            <div style={{ display: 'flex', gap: '5px', marginBottom: '8px' }}>
              <input
                type="text"
                placeholder="Nome do bookmark"
                value={newBookmarkName}
                onChange={(e) => setNewBookmarkName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddBookmark()}
                style={{ ...inputStyle, flex: 1 }}
              />
              <button 
                onClick={handleAddBookmark}
                style={buttonStyle}
                disabled={!newBookmarkName.trim()}
              >
                + Add
              </button>
            </div>

            {/* Lista de Bookmarks */}
            <div style={{ maxHeight: '120px', overflowY: 'auto' }}>
              {controls.bookmarks.length === 0 ? (
                <div style={{ color: '#888', textAlign: 'center', padding: '10px' }}>
                  Nenhum bookmark salvo
                </div>
              ) : (
                controls.bookmarks.map((bookmark) => (
                  <div key={bookmark.id} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '4px 6px',
                    margin: '2px 0',
                    background: 'rgba(255, 255, 255, 0.1)',
                    borderRadius: '4px',
                    fontSize: '11px'
                  }}>
                    <div style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      <div style={{ fontWeight: 'bold' }}>{bookmark.name}</div>
                      <div style={{ color: '#ccc', fontSize: '10px' }}>
                        ({bookmark.position.x.toFixed(0)}, {bookmark.position.y.toFixed(0)}) • {(bookmark.zoom * 100).toFixed(0)}%
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '2px' }}>
                      <button
                        onClick={() => controls.goToBookmark(bookmark.id)}
                        style={{ ...buttonStyle, padding: '2px 4px', fontSize: '10px' }}
                        disabled={controls.isAnimating}
                      >
                        📍
                      </button>
                      <button
                        onClick={() => controls.removeBookmark(bookmark.id)}
                        style={{ ...buttonStyle, padding: '2px 4px', fontSize: '10px', background: '#dc3545' }}
                      >
                        ×
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </div>

      {/* Auto-seguimento */}
      <div style={{ marginBottom: '15px' }}>
        <h4 style={{ margin: '0 0 8px 0', fontSize: '13px' }}>Auto-seguimento</h4>
        {controls.isFollowing ? (
          <div>
            <button 
              onClick={controls.stopFollowing}
              style={{ ...buttonStyle, background: '#dc3545', width: '100%' }}
            >
              🛑 Parar seguimento
            </button>
            <div style={{ fontSize: '10px', color: '#ccc', marginTop: '4px' }}>
              Seguindo: ({controls.followTarget?.x.toFixed(0)}, {controls.followTarget?.y.toFixed(0)})
            </div>
          </div>
        ) : (
          <button 
            onClick={() => controls.startFollowing(currentPos)}
            style={{ ...buttonStyle, background: '#28a745', width: '100%' }}
          >
            🎯 Seguir posição atual
          </button>
        )}
      </div>

      {/* Atalhos de Teclado */}
      <div style={{ fontSize: '10px', color: '#999', lineHeight: '1.3' }}>
        <strong>Atalhos:</strong><br />
        WASD/Setas: Navegação<br />
        +/- : Zoom • Shift: Rápido<br />
        C/Space: Centro • R/0: Reset Zoom
      </div>
    </div>
  );
};

const buttonStyle: React.CSSProperties = {
  background: '#007bff',
  color: 'white',
  border: 'none',
  padding: '6px 10px',
  borderRadius: '4px',
  cursor: 'pointer',
  fontSize: '11px',
  transition: 'background 0.2s'
};

const inputStyle: React.CSSProperties = {
  background: 'rgba(255, 255, 255, 0.1)',
  color: 'white',
  border: '1px solid rgba(255, 255, 255, 0.3)',
  padding: '6px 8px',
  borderRadius: '4px',
  fontSize: '11px'
};

export default BoardControlsPanel; 
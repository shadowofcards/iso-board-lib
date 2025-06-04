import React, { useState } from 'react';
import { BasePanelComponent, type BasePanelProps, type PanelAction } from './BasePanelComponent';
import { useAdvancedBoardControls } from '../../hooks/useAdvancedBoardControls';
import { Camera } from '../../core/models/Camera';

interface BoardControlsPanelProps extends Partial<BasePanelProps> {
  cameraModel: Camera;
  containerRef: React.RefObject<HTMLElement>;
  onCameraMove?: () => void;
  // Configurações específicas do painel
  showBasicControls?: boolean;
  showTeleport?: boolean;
  showBookmarks?: boolean;
  showFollowControls?: boolean;
  enableAdvancedFeatures?: boolean;
}

export const BoardControlsPanel: React.FC<BoardControlsPanelProps> = ({
  cameraModel,
  containerRef,
  onCameraMove,
  
  // Configurações específicas
  showBasicControls = true,
  showTeleport = true,
  showBookmarks = true,
  showFollowControls = true,
  enableAdvancedFeatures = true,
  
  // Props do BasePanel
  id = 'board-controls',
  title = 'Controles do Board',
  icon = '🎮',
  position = 'top-right',
  size = 'md',
  collapsible = true,
  draggable = true,
  priority = 'high',
  ...basePanelProps
}) => {
  const [bmName, setBmName] = useState('');
  const [tpX, setTpX] = useState('');
  const [tpY, setTpY] = useState('');
  const [showBMDetails, setShowBMDetails] = useState(false);

  const ctl = useAdvancedBoardControls(cameraModel, {
    enableKeyboardControls: enableAdvancedFeatures,
    enableSmoothAnimations: enableAdvancedFeatures,
    containerRef,
    onCameraMove,
  });

  // ==================== HANDLERS ====================

  const addBookmark = () => {
    if (bmName.trim()) {
      ctl.addBookmark(bmName.trim());
      setBmName('');
    }
  };

  const teleport = () => {
    const x = parseFloat(tpX);
    const y = parseFloat(tpY);
    if (!Number.isNaN(x) && !Number.isNaN(y)) {
      ctl.teleportTo({ x, y });
      setTpX('');
      setTpY('');
    }
  };

  // ==================== STATUS INFO ====================

  const pos = ctl.getCurrentPosition();
  const zoom = ctl.getCurrentZoom();

  // ==================== HEADER ACTIONS ====================

  const headerActions: PanelAction[] = [
    {
      id: 'refresh',
      icon: '🔄',
      label: 'Atualizar',
      tooltip: 'Atualizar informações',
      onClick: () => {
        // Força atualização dos controles
        ctl.centerCamera();
      },
    },
    ...(enableAdvancedFeatures ? [{
      id: 'settings',
      icon: '⚙️',
      label: 'Configurações',
      tooltip: 'Configurações avançadas',
      onClick: () => {
        console.log('Configurações do board');
      },
    }] : []),
  ];

  // ==================== CUSTOM CONTENT RENDERER ====================

  const renderContent = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {/* Status Display */}
      <StatusSection 
        pos={pos}
        zoom={zoom}
        isFollowing={ctl.isFollowing}
        isAnimating={ctl.isAnimating}
      />

      {/* Basic Controls */}
      {showBasicControls && (
        <ControlSection title="Básico">
          <ControlButton 
            onClick={ctl.centerCamera} 
            disabled={ctl.isAnimating}
            icon="🏠"
          >
            Centro
          </ControlButton>
          <ControlButton 
            onClick={ctl.resetZoom} 
            disabled={ctl.isAnimating}
            icon="🔍"
          >
            Reset Zoom
          </ControlButton>
        </ControlSection>
      )}

      {/* Teleport */}
      {showTeleport && (
        <ControlSection title="Teleporte">
          <div style={{ display: 'flex', gap: '4px', marginBottom: '6px' }}>
            <ControlInput
              type="number"
              placeholder="X"
              value={tpX}
              onChange={e => setTpX(e.target.value)}
            />
            <ControlInput
              type="number"
              placeholder="Y"
              value={tpY}
              onChange={e => setTpY(e.target.value)}
            />
          </div>
          <ControlButton 
            onClick={teleport} 
            disabled={ctl.isAnimating}
            icon="⚡"
            variant="primary"
          >
            Ir para Posição
          </ControlButton>
        </ControlSection>
      )}

      {/* Bookmarks */}
      {showBookmarks && (
        <ControlSection 
          title={`Bookmarks (${ctl.bookmarks.length})`}
          collapsible
          collapsed={!showBMDetails}
          onToggle={() => setShowBMDetails(!showBMDetails)}
        >
          {showBMDetails && (
            <>
              <div style={{ display: 'flex', gap: '4px', marginBottom: '8px' }}>
                <ControlInput
                  placeholder="Nome do bookmark"
                  value={bmName}
                  onChange={e => setBmName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addBookmark()}
                  style={{ flex: 1 }}
                />
                <ControlButton 
                  onClick={addBookmark} 
                  disabled={!bmName.trim()}
                  icon="+"
                  size="sm"
                >
                  Adicionar
                </ControlButton>
              </div>

              <BookmarksList
                bookmarks={ctl.bookmarks}
                onGoTo={ctl.goToBookmark}
                onRemove={ctl.removeBookmark}
                isAnimating={ctl.isAnimating}
              />
            </>
          )}
        </ControlSection>
      )}

      {/* Follow Controls */}
      {showFollowControls && (
        <ControlSection title="Auto-seguimento">
          {ctl.isFollowing ? (
            <ControlButton 
              onClick={ctl.stopFollowing}
              icon="🛑"
              variant="danger"
            >
              Parar Seguimento
            </ControlButton>
          ) : (
            <ControlButton 
              onClick={() => ctl.startFollowing(pos)}
              icon="🎯"
              variant="secondary"
            >
              Seguir Posição Atual
            </ControlButton>
          )}
        </ControlSection>
      )}
    </div>
  );

  // ==================== RENDER ====================

  return (
    <BasePanelComponent
      {...basePanelProps}
      id={id}
      title={title}
      subtitle={`Pos: ${pos.x.toFixed(0)}, ${pos.y.toFixed(0)} | Zoom: ${(zoom * 100).toFixed(0)}%`}
      icon={icon}
      position={position}
      size={size}
      collapsible={collapsible}
      draggable={draggable}
      priority={priority}
      headerActions={headerActions}
      renderContent={renderContent}
    />
  );
};

// ==================== HELPER COMPONENTS ====================

const StatusSection: React.FC<{
  pos: { x: number; y: number };
  zoom: number;
  isFollowing: boolean;
  isAnimating: boolean;
}> = ({ pos, zoom, isFollowing, isAnimating }) => (
  <div style={{
    padding: '8px',
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: '4px',
    fontSize: '11px',
    lineHeight: 1.3,
  }}>
    <div><strong>Posição:</strong> {pos.x.toFixed(0)}, {pos.y.toFixed(0)}</div>
    <div><strong>Zoom:</strong> {(zoom * 100).toFixed(0)}%</div>
    {isFollowing && <div style={{ color: '#4caf50' }}>🎯 Seguindo</div>}
    {isAnimating && <div style={{ color: '#2196f3' }}>⏳ Animando</div>}
  </div>
);

const ControlSection: React.FC<{
  title: string;
  children: React.ReactNode;
  collapsible?: boolean;
  collapsed?: boolean;
  onToggle?: () => void;
}> = ({ title, children, collapsible, collapsed, onToggle }) => (
  <div style={{ marginBottom: '8px' }}>
    <div 
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        fontSize: '12px',
        fontWeight: 'bold',
        marginBottom: '6px',
        cursor: collapsible ? 'pointer' : 'default',
      }}
      onClick={collapsible ? onToggle : undefined}
    >
      <span>{title}</span>
      {collapsible && <span>{collapsed ? '▼' : '▲'}</span>}
    </div>
    {!collapsed && (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {children}
      </div>
    )}
  </div>
);

const ControlButton: React.FC<{
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
  icon?: string;
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md';
}> = ({ 
  onClick, 
  disabled, 
  children, 
  icon, 
  variant = 'secondary',
  size = 'md' 
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return { backgroundColor: '#007bff', color: 'white' };
      case 'danger':
        return { backgroundColor: '#dc3545', color: 'white' };
      default:
        return { backgroundColor: '#6c757d', color: 'white' };
    }
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        ...getVariantStyles(),
        border: 'none',
        cursor: disabled ? 'not-allowed' : 'pointer',
        padding: size === 'sm' ? '4px 8px' : '6px 12px',
        borderRadius: '4px',
        fontSize: size === 'sm' ? '10px' : '11px',
        opacity: disabled ? 0.6 : 1,
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        justifyContent: 'center',
        transition: 'opacity 0.2s ease',
      }}
    >
      {icon && <span>{icon}</span>}
      {children}
    </button>
  );
};

const ControlInput: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (props) => (
  <input
    {...props}
    style={{
      flex: 1,
      padding: '4px 6px',
      background: 'rgba(255, 255, 255, 0.1)',
      border: '1px solid rgba(255, 255, 255, 0.3)',
      borderRadius: '4px',
      color: 'inherit',
      fontSize: '11px',
      ...props.style,
    }}
  />
);

const BookmarksList: React.FC<{
  bookmarks: Array<{ id: string; name: string }>;
  onGoTo: (id: string) => void;
  onRemove: (id: string) => void;
  isAnimating: boolean;
}> = ({ bookmarks, onGoTo, onRemove, isAnimating }) => (
  <div style={{ maxHeight: '120px', overflow: 'auto' }}>
    {bookmarks.length === 0 ? (
      <div style={{ 
        color: '#888', 
        textAlign: 'center', 
        fontSize: '10px',
        padding: '8px' 
      }}>
        Nenhum bookmark salvo
      </div>
    ) : (
      bookmarks.map(bookmark => (
        <div
          key={bookmark.id}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '4px 6px',
            margin: '2px 0',
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '4px',
            fontSize: '10px',
          }}
        >
          <span 
            style={{ 
              flex: 1, 
              overflow: 'hidden', 
              textOverflow: 'ellipsis', 
              whiteSpace: 'nowrap' 
            }}
            title={bookmark.name}
          >
            {bookmark.name}
          </span>
          <div style={{ display: 'flex', gap: '2px' }}>
            <ControlButton 
              onClick={() => onGoTo(bookmark.id)} 
              disabled={isAnimating}
              icon="📍"
              size="sm"
            >
              Ir
            </ControlButton>
            <ControlButton 
              onClick={() => onRemove(bookmark.id)}
              icon="×"
              variant="danger"
              size="sm"
            >
              Remover
            </ControlButton>
          </div>
        </div>
      ))
    )}
  </div>
);

export default BoardControlsPanel; 
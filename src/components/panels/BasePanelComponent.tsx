import React, { useEffect, useRef, useState, useMemo } from 'react';
import { useLayout, type PanelConfig } from '../layout/LayoutManager';
import type { IsoBoardTheme } from '../../core/types/Configuration';

// ==================== TYPES ====================

export interface BasePanelProps {
  id: string;
  title?: string;
  subtitle?: string;
  icon?: React.ReactNode | string;
  children?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  
  // Configuração de layout
  position?: PanelConfig['position'];
  size?: PanelConfig['size'];
  visible?: boolean;
  collapsible?: boolean;
  draggable?: boolean;
  resizable?: boolean;
  priority?: PanelConfig['priority'];
  
  // Callbacks
  onToggle?: (collapsed: boolean) => void;
  onMove?: (position: PanelConfig['position']) => void;
  onResize?: (size: { width: number; height: number }) => void;
  onClose?: () => void;
  
  // Custom render functions para extensibilidade total
  renderHeader?: (props: PanelHeaderProps) => React.ReactNode;
  renderContent?: (props: PanelContentProps) => React.ReactNode;
  renderFooter?: (props: PanelFooterProps) => React.ReactNode;
  
  // Estados customizáveis
  headerActions?: PanelAction[];
  theme?: 'light' | 'dark' | 'auto';
  variant?: 'default' | 'minimal' | 'bordered' | 'floating' | 'glass';
}

export interface PanelAction {
  id: string;
  icon: React.ReactNode | string;
  label?: string;
  tooltip?: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  disabled?: boolean;
}

export interface PanelHeaderProps {
  id: string;
  title?: string;
  subtitle?: string;
  icon?: React.ReactNode | string;
  collapsed: boolean;
  collapsible: boolean;
  draggable: boolean;
  actions: PanelAction[];
  theme: IsoBoardTheme;
  onToggle: () => void;
  onClose?: () => void;
}

export interface PanelContentProps {
  id: string;
  collapsed: boolean;
  theme: IsoBoardTheme;
  children?: React.ReactNode;
}

export interface PanelFooterProps {
  id: string;
  theme: IsoBoardTheme;
}

// ==================== COMPONENTE BASE ====================

export const BasePanelComponent: React.FC<BasePanelProps> = ({
  id,
  title,
  subtitle,
  icon,
  children,
  className = '',
  style = {},
  
  // Layout config
  position = 'top-right',
  size = 'md',
  visible = true,
  collapsible = true,
  draggable = false,
  resizable = false,
  priority = 'medium',
  
  // Callbacks
  onToggle,
  onMove,
  onResize,
  onClose,
  
  // Custom renderers
  renderHeader,
  renderContent,
  renderFooter,
  
  // Customização
  headerActions = [],
  theme: themeVariant = 'auto',
  variant = 'default',
}) => {
  const layout = useLayout();
  const panelRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  // ==================== REGISTRATION ====================

  useEffect(() => {
    layout.registerPanel(id, {
      position,
      size,
      visible,
      collapsible,
      draggable,
      resizable,
      priority,
      style,
      className,
    });

    return () => layout.unregisterPanel(id);
  }, []);

  // Sync props com layout manager
  const panelConfig = useMemo(() => ({
    position,
    size,
    visible,
    collapsible,
    draggable,
    resizable,
    priority,
    style,
    className,
  }), [position, size, visible, collapsible, draggable, resizable, priority, style, className]);

  useEffect(() => {
    layout.updatePanel(id, panelConfig);
  }, [id, layout, panelConfig]);

  // ==================== HANDLERS ====================

  const handleToggle = () => {
    const newCollapsed = !collapsed;
    setCollapsed(newCollapsed);
    layout.updatePanel(id, { collapsed: newCollapsed });
    onToggle?.(newCollapsed);
  };

  const handleClose = () => {
    layout.updatePanel(id, { visible: false });
    onClose?.();
  };

  // ==================== DRAG FUNCTIONALITY ====================

  const handleDragStart = (e: React.MouseEvent) => {
    if (!draggable) return;
    
    setIsDragging(true);
    const startX = e.clientX;
    const startY = e.clientY;
    const rect = panelRef.current?.getBoundingClientRect();
    
    if (!rect) return;

    const handleDragMove = (e: MouseEvent) => {
      if (!panelRef.current) return;
      
      const deltaX = e.clientX - startX;
      const deltaY = e.clientY - startY;
      
      panelRef.current.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
    };

    const handleDragEnd = () => {
      setIsDragging(false);
      document.removeEventListener('mousemove', handleDragMove);
      document.removeEventListener('mouseup', handleDragEnd);
      
      if (panelRef.current) {
        panelRef.current.style.transform = '';
      }
    };

    document.addEventListener('mousemove', handleDragMove);
    document.addEventListener('mouseup', handleDragEnd);
  };

  // ==================== COMPUTED PROPERTIES ====================

  const computedStyle = layout.getPanelStyle(id);
  const isVisible = layout.isPanelVisible(id);
  const currentTheme = layout.theme;

  // Panel variant styles
  const variantStyles = getVariantStyles(variant, currentTheme);

  // ==================== RENDER ====================

  if (!isVisible && !visible) {
    return null;
  }

  const finalStyle: React.CSSProperties = {
    ...computedStyle,
    ...variantStyles,
    ...style,
    cursor: isDragging ? 'grabbing' : draggable ? 'grab' : 'default',
  };

  const panelProps = {
    id,
    title,
    subtitle,
    icon,
    collapsed,
    collapsible,
    draggable,
    actions: [
      ...headerActions,
      ...(onClose ? [{
        id: 'close',
        icon: '✕',
        label: 'Fechar',
        onClick: handleClose,
        variant: 'ghost' as const,
      }] : []),
    ],
    theme: currentTheme,
    onToggle: handleToggle,
    onClose: onClose ? handleClose : undefined,
  };

  return (
    <div
      ref={panelRef}
      className={`iso-panel iso-panel--${variant} ${className}`}
      style={finalStyle}
      data-panel-id={id}
      data-collapsed={collapsed}
      data-draggable={draggable}
    >
      {/* Header */}
      {renderHeader ? (
        renderHeader(panelProps)
      ) : (
        <DefaultPanelHeader 
          {...panelProps}
          onDragStart={handleDragStart}
        />
      )}

      {/* Content */}
      {!collapsed && (renderContent ? (
        renderContent({ id, collapsed, theme: currentTheme, children })
      ) : (
        <DefaultPanelContent id={id} collapsed={collapsed} theme={currentTheme}>
          {children}
        </DefaultPanelContent>
      ))}

      {/* Footer */}
      {!collapsed && renderFooter && (
        renderFooter({ id, theme: currentTheme })
      )}
    </div>
  );
};

// ==================== DEFAULT COMPONENTS ====================

const DefaultPanelHeader: React.FC<PanelHeaderProps & { onDragStart?: (e: React.MouseEvent) => void }> = ({
  title,
  subtitle,
  icon,
  collapsed,
  collapsible,
  draggable,
  actions,
  theme,
  onToggle,
  onDragStart,
}) => (
  <div 
    className="iso-panel__header"
    style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: `${theme.spacing.sm}px ${theme.spacing.md}px`,
      borderBottom: collapsed ? 'none' : `1px solid ${theme.colors.border}`,
      cursor: draggable ? 'grab' : 'default',
      backgroundColor: theme.colors.background,
      borderTopLeftRadius: theme.borderRadius.md,
      borderTopRightRadius: theme.borderRadius.md,
    }}
    onMouseDown={onDragStart}
  >
    <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm }}>
      {icon && (
        <span className="iso-panel__icon" style={{ fontSize: '16px', opacity: 0.8 }}>
          {icon}
        </span>
      )}
      <div>
        {title && (
          <div className="iso-panel__title" style={{
            fontSize: '14px',
            fontWeight: 'bold',
            color: theme.colors.text,
            lineHeight: 1.2,
          }}>
            {title}
          </div>
        )}
        {subtitle && (
          <div className="iso-panel__subtitle" style={{
            fontSize: '12px',
            color: theme.colors.textSecondary,
            opacity: 0.7,
            lineHeight: 1.2,
          }}>
            {subtitle}
          </div>
        )}
      </div>
    </div>

    <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.xs }}>
      {actions.map(action => (
        <button
          key={action.id}
          onClick={action.onClick}
          disabled={action.disabled}
          title={action.tooltip || action.label}
          style={{
            background: 'none',
            border: 'none',
            color: theme.colors.textSecondary,
            cursor: action.disabled ? 'not-allowed' : 'pointer',
            padding: `${theme.spacing.xs}px`,
            borderRadius: theme.borderRadius.sm,
            fontSize: '12px',
            opacity: action.disabled ? 0.5 : 0.7,
            transition: 'opacity 0.2s ease',
          }}
          onMouseEnter={e => {
            if (!action.disabled) {
              e.currentTarget.style.opacity = '1';
              e.currentTarget.style.backgroundColor = theme.colors.border;
            }
          }}
          onMouseLeave={e => {
            e.currentTarget.style.opacity = action.disabled ? '0.5' : '0.7';
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
        >
          {action.icon}
        </button>
      ))}
      
      {collapsible && (
        <button
          onClick={onToggle}
          style={{
            background: 'none',
            border: 'none',
            color: theme.colors.textSecondary,
            cursor: 'pointer',
            padding: `${theme.spacing.xs}px`,
            borderRadius: theme.borderRadius.sm,
            fontSize: '12px',
            opacity: 0.7,
            transition: 'opacity 0.2s ease',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.opacity = '1';
            e.currentTarget.style.backgroundColor = theme.colors.border;
          }}
          onMouseLeave={e => {
            e.currentTarget.style.opacity = '0.7';
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
        >
          {collapsed ? '▼' : '▲'}
        </button>
      )}
    </div>
  </div>
);

const DefaultPanelContent: React.FC<PanelContentProps> = ({ theme, children }) => (
  <div 
    className="iso-panel__content"
    style={{
      padding: theme.spacing.md,
      fontSize: '12px',
      lineHeight: 1.4,
      color: theme.colors.text,
      overflow: 'auto',
      flex: 1,
    }}
  >
    {children}
  </div>
);

// ==================== VARIANT STYLES ====================

function getVariantStyles(variant: string, theme: IsoBoardTheme): React.CSSProperties {
  const base: React.CSSProperties = {
    backgroundColor: theme.colors.surface,
    color: theme.colors.text,
    border: `1px solid ${theme.colors.border}`,
    borderRadius: theme.borderRadius.md,
    boxShadow: theme.shadows.md,
    overflow: 'hidden',
  };

  switch (variant) {
    case 'minimal':
      return {
        ...base,
        border: 'none',
        boxShadow: 'none',
        backgroundColor: 'transparent',
      };
      
    case 'bordered':
      return {
        ...base,
        border: `2px solid ${theme.colors.accent}`,
        boxShadow: theme.shadows.lg,
      };
      
    case 'floating':
      return {
        ...base,
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
        backdropFilter: 'blur(10px)',
        backgroundColor: `${theme.colors.surface}e6`,
      };
      
    case 'glass':
      return {
        ...base,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)',
      };
      
    default:
      return base;
  }
}

export default BasePanelComponent; 
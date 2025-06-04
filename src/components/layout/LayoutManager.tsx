import React, { useState, useCallback, useMemo, createContext, useContext } from 'react';
import type { IsoBoardTheme } from '../../core/types/Configuration';

// ==================== TIPOS DE LAYOUT ====================

export type PanelPosition = 
  | 'top-left' | 'top-center' | 'top-right'
  | 'center-left' | 'center-center' | 'center-right'
  | 'bottom-left' | 'bottom-center' | 'bottom-right'
  | 'floating' | 'docked-left' | 'docked-right' | 'docked-bottom';

export type PanelSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'auto' | 'custom';

export interface PanelConfig {
  id: string;
  position: PanelPosition;
  size?: PanelSize;
  zIndex?: number;
  visible?: boolean;
  collapsible?: boolean;
  collapsed?: boolean;
  draggable?: boolean;
  resizable?: boolean;
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;
  customPosition?: { x: number; y: number };
  customSize?: { width: number; height: number };
  className?: string;
  style?: React.CSSProperties;
  priority?: 'high' | 'medium' | 'low'; // Para resolução de conflitos
}

export interface LayoutSlot {
  position: PanelPosition;
  panels: string[];
  spacing: number;
  alignment: 'start' | 'center' | 'end';
  direction: 'row' | 'column';
  maxPanels?: number;
  overflow?: 'visible' | 'hidden' | 'scroll' | 'auto';
}

// ==================== CONTEXTO DE LAYOUT ====================

interface LayoutContextType {
  panels: Map<string, PanelConfig>;
  slots: Map<PanelPosition, LayoutSlot>;
  theme: IsoBoardTheme;
  registerPanel: (id: string, config: Partial<PanelConfig>) => void;
  unregisterPanel: (id: string) => void;
  updatePanel: (id: string, updates: Partial<PanelConfig>) => void;
  togglePanel: (id: string) => void;
  movePanel: (id: string, newPosition: PanelPosition) => void;
  getPanelStyle: (id: string) => React.CSSProperties;
  isPanelVisible: (id: string) => boolean;
  getZIndex: (id: string) => number;
}

const LayoutContext = createContext<LayoutContextType | null>(null);

export const useLayout = () => {
  const context = useContext(LayoutContext);
  if (!context) {
    throw new Error('useLayout deve ser usado dentro de um LayoutProvider');
  }
  return context;
};

// ==================== CONFIGURAÇÕES DE LAYOUT ====================

const DEFAULT_SLOTS: Record<PanelPosition, LayoutSlot> = {
  'top-left': { position: 'top-left', panels: [], spacing: 8, alignment: 'start', direction: 'column' },
  'top-center': { position: 'top-center', panels: [], spacing: 8, alignment: 'center', direction: 'row' },
  'top-right': { position: 'top-right', panels: [], spacing: 8, alignment: 'end', direction: 'column' },
  'center-left': { position: 'center-left', panels: [], spacing: 8, alignment: 'center', direction: 'column' },
  'center-center': { position: 'center-center', panels: [], spacing: 8, alignment: 'center', direction: 'column' },
  'center-right': { position: 'center-right', panels: [], spacing: 8, alignment: 'center', direction: 'column' },
  'bottom-left': { position: 'bottom-left', panels: [], spacing: 8, alignment: 'start', direction: 'column' },
  'bottom-center': { position: 'bottom-center', panels: [], spacing: 8, alignment: 'center', direction: 'row' },
  'bottom-right': { position: 'bottom-right', panels: [], spacing: 8, alignment: 'end', direction: 'column' },
  'floating': { position: 'floating', panels: [], spacing: 0, alignment: 'start', direction: 'column' },
  'docked-left': { position: 'docked-left', panels: [], spacing: 0, alignment: 'start', direction: 'column' },
  'docked-right': { position: 'docked-right', panels: [], spacing: 0, alignment: 'start', direction: 'column' },
  'docked-bottom': { position: 'docked-bottom', panels: [], spacing: 0, alignment: 'start', direction: 'row' },
};

const PANEL_SIZES = {
  xs: { width: 120, height: 80 },
  sm: { width: 200, height: 120 },
  md: { width: 300, height: 200 },
  lg: { width: 400, height: 300 },
  xl: { width: 500, height: 400 },
  auto: { width: 'auto', height: 'auto' },
  custom: { width: 'auto', height: 'auto' },
};

// ==================== BASE Z-INDEX ====================

const BASE_Z_INDEX = {
  'docked-left': 1100,
  'docked-right': 1100,
  'docked-bottom': 1100,
  'bottom-left': 1200,
  'bottom-center': 1200,
  'bottom-right': 1200,
  'center-left': 1300,
  'center-center': 1300,
  'center-right': 1300,
  'top-left': 1400,
  'top-center': 1400,
  'top-right': 1400,
  'floating': 1500,
};

// ==================== LAYOUT PROVIDER ====================

interface LayoutProviderProps {
  children: React.ReactNode;
  theme: IsoBoardTheme;
  className?: string;
  style?: React.CSSProperties;
}

export const LayoutProvider: React.FC<LayoutProviderProps> = ({
  children,
  theme,
  className = '',
  style = {},
}) => {
  const [panels, setPanels] = useState<Map<string, PanelConfig>>(new Map());
  const [slots, setSlots] = useState<Map<PanelPosition, LayoutSlot>>(
    new Map(Object.entries(DEFAULT_SLOTS) as [PanelPosition, LayoutSlot][])
  );

  // ==================== PANEL MANAGEMENT ====================

  const registerPanel = useCallback((id: string, config: Partial<PanelConfig>) => {
    const fullConfig: PanelConfig = {
      id,
      position: 'top-right',
      size: 'md',
      visible: true,
      collapsible: false,
      collapsed: false,
      draggable: false,
      resizable: false,
      priority: 'medium',
      ...config,
    };

    setPanels(prev => new Map(prev).set(id, fullConfig));

    // Adicionar ao slot apropriado
    setSlots(prev => {
      const newSlots = new Map(prev);
      const slot = newSlots.get(fullConfig.position);
      if (slot && !slot.panels.includes(id)) {
        newSlots.set(fullConfig.position, {
          ...slot,
          panels: [...slot.panels, id]
        });
      }
      return newSlots;
    });
  }, []);

  const unregisterPanel = useCallback((id: string) => {
    const panel = panels.get(id);
    if (!panel) return;

    setPanels(prev => {
      const newPanels = new Map(prev);
      newPanels.delete(id);
      return newPanels;
    });

    // Remover do slot
    setSlots(prev => {
      const newSlots = new Map(prev);
      const slot = newSlots.get(panel.position);
      if (slot) {
        newSlots.set(panel.position, {
          ...slot,
          panels: slot.panels.filter(panelId => panelId !== id)
        });
      }
      return newSlots;
    });
  }, [panels]);

  const updatePanel = useCallback((id: string, updates: Partial<PanelConfig>) => {
    const currentPanel = panels.get(id);
    if (!currentPanel) return;

    // 🔧 CORREÇÃO: Verificar se há mudanças reais antes de atualizar
    const hasRealChanges = Object.keys(updates).some(key => {
      const currentValue = currentPanel[key as keyof PanelConfig];
      const newValue = updates[key as keyof PanelConfig];
      
      // Comparação especial para objetos
      if (typeof currentValue === 'object' && typeof newValue === 'object') {
        return JSON.stringify(currentValue) !== JSON.stringify(newValue);
      }
      
      return currentValue !== newValue;
    });

    if (!hasRealChanges) {
      console.debug(`[LayoutManager] Ignorando updatePanel sem mudanças para ${id}`);
      return;
    }

    console.debug(`[LayoutManager] Atualizando painel ${id}:`, updates);

    const newPanel = { ...currentPanel, ...updates };

    // Se a posição mudou, atualizar slots
    if (updates.position && updates.position !== currentPanel.position) {
      setSlots(prev => {
        const newSlots = new Map(prev);
        
        // Remover do slot antigo
        const oldSlot = newSlots.get(currentPanel.position);
        if (oldSlot) {
          newSlots.set(currentPanel.position, {
            ...oldSlot,
            panels: oldSlot.panels.filter(panelId => panelId !== id)
          });
        }

        // Adicionar ao novo slot
        const newSlot = newSlots.get(updates.position!);
        if (newSlot && !newSlot.panels.includes(id)) {
          newSlots.set(updates.position!, {
            ...newSlot,
            panels: [...newSlot.panels, id]
          });
        }

        return newSlots;
      });
    }

    setPanels(prev => new Map(prev).set(id, newPanel));
  }, [panels]);

  const togglePanel = useCallback((id: string) => {
    const panel = panels.get(id);
    if (!panel) return;

    updatePanel(id, { 
      collapsed: panel.collapsible ? !panel.collapsed : false,
      visible: !panel.visible 
    });
  }, [panels, updatePanel]);

  const movePanel = useCallback((id: string, newPosition: PanelPosition) => {
    updatePanel(id, { position: newPosition });
  }, [updatePanel]);

  // ==================== STYLE CALCULATION ====================

  const getPanelStyle = useCallback((id: string): React.CSSProperties => {
    const panel = panels.get(id);
    if (!panel) return {};

    const slot = slots.get(panel.position);
    const positionIndex = slot?.panels.indexOf(id) || 0;

    const baseStyle: React.CSSProperties = {
      position: panel.position === 'floating' ? 'fixed' : 'absolute',
      zIndex: getZIndex(id),
      transition: 'all 0.2s ease',
      fontFamily: theme.name === 'MINIMAL' ? 'system-ui, sans-serif' : 'inherit',
    };

    // Tamanho
    if (panel.size && panel.size !== 'custom') {
      const size = PANEL_SIZES[panel.size];
      if (size.width !== 'auto') baseStyle.width = size.width;
      if (size.height !== 'auto') baseStyle.height = size.height;
    }

    if (panel.customSize) {
      baseStyle.width = panel.customSize.width;
      baseStyle.height = panel.customSize.height;
    }

    if (panel.minWidth) baseStyle.minWidth = panel.minWidth;
    if (panel.minHeight) baseStyle.minHeight = panel.minHeight;
    if (panel.maxWidth) baseStyle.maxWidth = panel.maxWidth;
    if (panel.maxHeight) baseStyle.maxHeight = panel.maxHeight;

    // Posicionamento
    if (panel.position === 'floating' && panel.customPosition) {
      baseStyle.left = panel.customPosition.x;
      baseStyle.top = panel.customPosition.y;
    } else {
      const positionStyles = calculatePositionStyle(panel.position, positionIndex, slot?.spacing || 8);
      Object.assign(baseStyle, positionStyles);
    }

    // Estados
    if (panel.collapsed) {
      baseStyle.height = 32; // Altura mínima quando colapsado
      baseStyle.overflow = 'hidden';
    }

    if (!panel.visible) {
      baseStyle.display = 'none';
    }

    // Tema
    baseStyle.backgroundColor = theme.colors.surface;
    baseStyle.color = theme.colors.text;
    baseStyle.border = `1px solid ${theme.colors.border}`;
    baseStyle.borderRadius = theme.borderRadius.md;
    baseStyle.boxShadow = theme.shadows.md;

    // Custom overrides
    if (panel.style) {
      Object.assign(baseStyle, panel.style);
    }

    return baseStyle;
  }, [panels, slots, theme]);

  const getZIndex = useCallback((id: string): number => {
    const panel = panels.get(id);
    if (!panel) return 0;

    if (panel.zIndex !== undefined) return panel.zIndex;

    const baseZ = BASE_Z_INDEX[panel.position] || 100;
    const slot = slots.get(panel.position);
    const positionIndex = slot?.panels.indexOf(id) || 0;
    const priorityBonus = panel.priority === 'high' ? 50 : panel.priority === 'low' ? -50 : 0;

    return baseZ + positionIndex + priorityBonus;
  }, [panels, slots]);

  const isPanelVisible = useCallback((id: string): boolean => {
    const panel = panels.get(id);
    return panel?.visible === true && !panel.collapsed;
  }, [panels]);

  // ==================== CONTEXT VALUE ====================

  const contextValue: LayoutContextType = useMemo(() => ({
    panels,
    slots,
    theme,
    registerPanel,
    unregisterPanel,
    updatePanel,
    togglePanel,
    movePanel,
    getPanelStyle,
    isPanelVisible,
    getZIndex,
  }), [
    panels,
    slots,
    theme,
    registerPanel,
    unregisterPanel,
    updatePanel,
    togglePanel,
    movePanel,
    getPanelStyle,
    isPanelVisible,
    getZIndex,
  ]);

  // ==================== RENDER ====================

  return (
    <LayoutContext.Provider value={contextValue}>
      <div 
        className={`iso-board-layout ${className}`}
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          overflow: 'hidden',
          fontFamily: theme.name === 'MINIMAL' ? 'system-ui, sans-serif' : 'inherit',
          ...style
        }}
      >
        {children}
      </div>
    </LayoutContext.Provider>
  );
};

// ==================== UTILITY FUNCTIONS ====================

function calculatePositionStyle(
  position: PanelPosition, 
  index: number, 
  spacing: number
): React.CSSProperties {
  const offset = index * spacing;

  switch (position) {
    case 'top-left':
      return { top: spacing + offset, left: spacing };
    case 'top-center':
      return { top: spacing, left: '50%', transform: `translateX(calc(-50% + ${offset}px))` };
    case 'top-right':
      return { top: spacing + offset, right: spacing };
    
    case 'center-left':
      return { top: '50%', left: spacing, transform: `translateY(calc(-50% + ${offset}px))` };
    case 'center-center':
      return { top: '50%', left: '50%', transform: `translate(calc(-50% + ${offset}px), -50%)` };
    case 'center-right':
      return { top: '50%', right: spacing, transform: `translateY(calc(-50% + ${offset}px))` };
    
    case 'bottom-left':
      return { bottom: spacing + offset, left: spacing };
    case 'bottom-center':
      return { bottom: spacing, left: '50%', transform: `translateX(calc(-50% + ${offset}px))` };
    case 'bottom-right':
      return { bottom: spacing + offset, right: spacing };
    
    case 'docked-left':
      return { top: 0, left: 0, height: '100%' };
    case 'docked-right':
      return { top: 0, right: 0, height: '100%' };
    case 'docked-bottom':
      return { bottom: 0, left: 0, width: '100%' };
    
    default:
      return {};
  }
}

export default LayoutProvider; 
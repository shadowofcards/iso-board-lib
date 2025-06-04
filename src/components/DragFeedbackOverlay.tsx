import React, { useMemo } from 'react';
import type { PositionValidationEvent } from '../core/types/Events';

interface DragFeedbackOverlayProps {
  // Posição atual do drag (coordenadas de tela)
  dragPosition: { x: number; y: number } | null;
  
  // Resultado da validação mais recente
  validationResult: PositionValidationEvent['validationResult'] | null;
  
  // Configurações visuais
  showAnimations?: boolean;
  feedbackSize?: 'small' | 'medium' | 'large';
  opacity?: number;
}

const FEEDBACK_ICONS = {
  plus: '✅',
  minus: '❌', 
  blocked: '🚫',
  warning: '⚠️',
  info: 'ℹ️',
  star: '⭐',
  chain: '🔗',
} as const;

const FEEDBACK_COLORS = {
  positive: '#00ff00',
  negative: '#ff0000',
  neutral: '#ffaa00',
  blocked: '#ff6600',
} as const;

const ANIMATION_STYLES = {
  pulse: {
    animation: 'pulse 1.5s ease-in-out infinite',
  },
  glow: {
    animation: 'glow 2s ease-in-out infinite alternate',
    filter: 'drop-shadow(0 0 8px currentColor)',
  },
  shake: {
    animation: 'shake 0.8s ease-in-out infinite',
  },
  bounce: {
    animation: 'bounce 1s ease infinite',
  },
} as const;

export const DragFeedbackOverlay: React.FC<DragFeedbackOverlayProps> = ({
  dragPosition,
  validationResult,
  showAnimations = true,
  feedbackSize = 'medium',
  opacity = 0.9,
}) => {
  
  const feedbackStyle = useMemo(() => {
    if (!dragPosition || !validationResult) return null;
    
    const { visualFeedback } = validationResult;
    if (!visualFeedback) return null;
    
    const size = feedbackSize === 'small' ? '24px' : feedbackSize === 'large' ? '48px' : '32px';
    const fontSize = feedbackSize === 'small' ? '16px' : feedbackSize === 'large' ? '32px' : '24px';
    
    const baseStyle: React.CSSProperties = {
      position: 'fixed',
      left: dragPosition.x + 20,
      top: dragPosition.y - 20,
      width: size,
      height: size,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize,
      color: visualFeedback.color || FEEDBACK_COLORS[validationResult.feedback],
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      borderRadius: '50%',
      border: `2px solid ${visualFeedback.color || FEEDBACK_COLORS[validationResult.feedback]}`,
      zIndex: 10000,
      opacity,
      pointerEvents: 'none',
      userSelect: 'none',
      transition: 'all 0.2s ease',
    };
    
    // Aplicar animações se habilitadas
    if (showAnimations && visualFeedback.animation) {
      Object.assign(baseStyle, ANIMATION_STYLES[visualFeedback.animation]);
    }
    
    return baseStyle;
  }, [dragPosition, validationResult, showAnimations, feedbackSize, opacity]);
  
  const feedbackIcon = useMemo(() => {
    if (!validationResult?.visualFeedback) return null;
    return FEEDBACK_ICONS[validationResult.visualFeedback.icon] || '❓';
  }, [validationResult]);
  
  const benefitsTooltip = useMemo(() => {
    if (!validationResult?.benefits?.length && !validationResult?.penalties?.length) return null;
    
    const benefits = validationResult.benefits || [];
    const penalties = validationResult.penalties || [];
    
    return (
      <div
        style={{
          position: 'fixed',
          left: (dragPosition?.x || 0) + 60,
          top: (dragPosition?.y || 0) - 20,
          backgroundColor: 'rgba(0, 0, 0, 0.9)',
          color: 'white',
          padding: '8px 12px',
          borderRadius: '8px',
          fontSize: '12px',
          maxWidth: '300px',
          zIndex: 10001,
          pointerEvents: 'none',
          border: '1px solid #333',
        }}
      >
        {benefits.length > 0 && (
          <div style={{ marginBottom: penalties.length > 0 ? '8px' : '0' }}>
            <div style={{ color: '#00ff00', fontWeight: 'bold', marginBottom: '4px' }}>
              ✅ Benefícios:
            </div>
            {benefits.map((benefit, index) => (
              <div key={index} style={{ fontSize: '11px', marginLeft: '8px' }}>
                • {benefit.description}
                {benefit.value && <span style={{ color: '#aaffaa' }}> (+{benefit.value})</span>}
              </div>
            ))}
          </div>
        )}
        
        {penalties.length > 0 && (
          <div>
            <div style={{ color: '#ff6666', fontWeight: 'bold', marginBottom: '4px' }}>
              ❌ Problemas:
            </div>
            {penalties.map((penalty, index) => (
              <div key={index} style={{ fontSize: '11px', marginLeft: '8px' }}>
                • {penalty.description}
                {penalty.value && <span style={{ color: '#ffaaaa' }}> (-{penalty.value})</span>}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }, [validationResult, dragPosition]);
  
  const suggestionsDisplay = useMemo(() => {
    if (!validationResult?.suggestions?.length) return null;
    
    return (
      <div
        style={{
          position: 'fixed',
          left: (dragPosition?.x || 0) - 150,
          top: (dragPosition?.y || 0) + 40,
          backgroundColor: 'rgba(0, 0, 0, 0.9)',
          color: 'white',
          padding: '12px',
          borderRadius: '8px',
          fontSize: '12px',
          maxWidth: '280px',
          zIndex: 10001,
          pointerEvents: 'none',
          border: '1px solid #333',
        }}
      >
        <div style={{ color: '#ffaa00', fontWeight: 'bold', marginBottom: '8px' }}>
          💡 Sugestões de Posição:
        </div>
        {validationResult.suggestions.slice(0, 3).map((suggestion, index) => (
          <div key={index} style={{ marginBottom: '6px', fontSize: '11px' }}>
            <div style={{ color: '#aaffaa' }}>
              📍 ({suggestion.position.x}, {suggestion.position.y})
            </div>
            <div style={{ marginLeft: '12px', color: '#cccccc' }}>
              {suggestion.reason}
            </div>
            <div style={{ marginLeft: '12px', color: '#ffaa00' }}>
              Score: {suggestion.score.toFixed(1)}
            </div>
          </div>
        ))}
      </div>
    );
  }, [validationResult, dragPosition]);
  
  const rangeIndicator = useMemo(() => {
    if (!validationResult?.visualFeedback?.showRange || !dragPosition) return null;
    
    const rangeColor = validationResult.visualFeedback.rangeColor || '#ffffff';
    const rangeRadius = 80; // pixels
    
    return (
      <div
        style={{
          position: 'fixed',
          left: dragPosition.x - rangeRadius,
          top: dragPosition.y - rangeRadius,
          width: rangeRadius * 2,
          height: rangeRadius * 2,
          border: `2px dashed ${rangeColor}`,
          borderRadius: '50%',
          opacity: 0.6,
          zIndex: 9999,
          pointerEvents: 'none',
          animation: showAnimations ? 'pulse 2s ease-in-out infinite' : undefined,
        }}
      />
    );
  }, [validationResult, dragPosition, showAnimations]);
  
  if (!dragPosition || !validationResult) {
    return null;
  }
  
  return (
    <>
      {/* CSS Animations */}
      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 0.8; }
          50% { transform: scale(1.1); opacity: 1; }
        }
        
        @keyframes glow {
          from { filter: drop-shadow(0 0 8px currentColor); }
          to { filter: drop-shadow(0 0 16px currentColor); }
        }
        
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-2px); }
          75% { transform: translateX(2px); }
        }
        
        @keyframes bounce {
          0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-10px); }
          60% { transform: translateY(-5px); }
        }
      `}</style>
      
      {/* Indicador de alcance/área */}
      {rangeIndicator}
      
      {/* Ícone principal de feedback */}
      {feedbackStyle && (
        <div style={feedbackStyle}>
          {feedbackIcon}
        </div>
      )}
      
      {/* Tooltip com benefícios/problemas */}
      {benefitsTooltip}
      
      {/* Sugestões de posição */}
      {suggestionsDisplay}
    </>
  );
};

export default DragFeedbackOverlay; 
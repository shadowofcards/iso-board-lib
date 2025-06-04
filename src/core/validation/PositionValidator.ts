/**
 * Sistema agnóstico de validação de posições - sem regras de negócio
 * Apenas estrutura dados e facilita comunicação com sistemas externos
 */

import type { TileData } from '../models/Tile';
import type { PositionValidationEvent } from '../types/Events';
import {
  findNearbyTiles,
  findAdjacentTiles,
  generatePositionSuggestions,
  type TilePosition,
  type ProximityTile,
} from '../math/proximityUtils';

export interface ValidationRule {
  id: string;
  name: string;
  description: string;
  
  // Função que valida se a regra se aplica
  applies: (draggedTile: TileData, targetPosition: { x: number; y: number }, nearbyTiles: ProximityTile[]) => boolean;
  
  // Função que executa a validação
  validate: (draggedTile: TileData, targetPosition: { x: number; y: number }, nearbyTiles: ProximityTile[]) => ValidationResult;
  
  // Prioridade (regras com prioridade maior são executadas primeiro)
  priority: number;
}

export interface ValidationResult {
  isValid: boolean;
  canPlace: boolean;
  feedback: 'positive' | 'negative' | 'neutral' | 'blocked';
  benefits?: Array<{
    type: string; // Agnóstico - pode ser qualquer string
    description: string;
    value?: number;
    source?: TileData;
  }>;
  penalties?: Array<{
    type: string; // Agnóstico - pode ser qualquer string
    description: string;
    value?: number;
    source?: TileData;
  }>;
  visualFeedback?: {
    icon: 'plus' | 'minus' | 'blocked' | 'warning' | 'info' | 'star' | 'chain';
    color: string;
    animation?: 'pulse' | 'glow' | 'shake' | 'bounce';
    showRange?: boolean;
    rangeColor?: string;
  };
}

/**
 * Validador agnóstico que apenas estrutura dados e facilita comunicação
 * NÃO contém regras de negócio - essas devem vir de sistemas externos
 */
export class PositionValidator {
  private rules: ValidationRule[] = [];
  private boardSize: { width: number; height: number };
  
  constructor(boardSize: { width: number; height: number }) {
    this.boardSize = boardSize;
  }
  
  /**
   * Adiciona uma regra de validação customizada (fornecida externamente)
   */
  addRule(rule: ValidationRule): void {
    this.rules.push(rule);
    // Ordenar por prioridade (maior primeiro)
    this.rules.sort((a, b) => b.priority - a.priority);
  }
  
  /**
   * Remove uma regra pelo ID
   */
  removeRule(ruleId: string): void {
    this.rules = this.rules.filter(rule => rule.id !== ruleId);
  }
  
  /**
   * Remove todas as regras
   */
  clearRules(): void {
    this.rules = [];
  }
  
  /**
   * Lista todas as regras ativas
   */
  getRules(): ValidationRule[] {
    return [...this.rules];
  }
  
  /**
   * Valida uma posição usando regras fornecidas externamente
   * Se não há regras, retorna resultado neutro
   */
  validatePosition(
    draggedTile: TileData,
    targetPosition: { x: number; y: number },
    allTiles: TilePosition[]
  ): PositionValidationEvent['validationResult'] {
    // Verificar limites básicos do board (única regra interna)
    if (targetPosition.x < 0 || targetPosition.x >= this.boardSize.width ||
        targetPosition.y < 0 || targetPosition.y >= this.boardSize.height) {
      return {
        isValid: false,
        canPlace: false,
        feedback: 'blocked',
        penalties: [{
          type: 'out-of-bounds',
          description: 'Posição fora dos limites do tabuleiro',
        }],
        visualFeedback: {
          icon: 'blocked',
          color: '#ff0000',
          animation: 'shake',
        },
      };
    }
    
    // Encontrar tiles próximos
    const nearbyTiles = findNearbyTiles(targetPosition, allTiles, 3);
    
    // Se não há regras customizadas, retornar resultado neutro
    if (this.rules.length === 0) {
      return this.getDefaultResult(draggedTile, targetPosition, nearbyTiles, allTiles);
    }
    
    // Aplicar regras fornecidas externamente
    const results: ValidationResult[] = [];
    
    for (const rule of this.rules) {
      if (rule.applies(draggedTile, targetPosition, nearbyTiles)) {
        const result = rule.validate(draggedTile, targetPosition, nearbyTiles);
        results.push(result);
      }
    }
    
    // Combinar resultados
    return this.combineResults(draggedTile, targetPosition, nearbyTiles, allTiles, results);
  }
  
  /**
   * Apenas estrutura dados de proximidade sem aplicar lógica de negócio
   */
  getProximityData(
    targetPosition: { x: number; y: number },
    allTiles: TilePosition[],
    radius: number = 3
  ): {
    nearbyTiles: ProximityTile[];
    adjacentTiles: ProximityTile[];
    statistics: {
      totalNearby: number;
      totalAdjacent: number;
      averageDistance: number;
      tileTypes: Record<string, number>;
      directions: Record<string, number>;
    };
  } {
    const nearbyTiles = findNearbyTiles(targetPosition, allTiles, radius);
    const adjacentTiles = findAdjacentTiles(targetPosition, allTiles);
    
    // Estatísticas básicas (sem interpretação)
    const statistics = {
      totalNearby: nearbyTiles.length,
      totalAdjacent: adjacentTiles.length,
      averageDistance: nearbyTiles.length > 0 
        ? nearbyTiles.reduce((sum, t) => sum + t.distance, 0) / nearbyTiles.length 
        : 0,
      tileTypes: nearbyTiles.reduce((acc, t) => {
        acc[t.tile.type] = (acc[t.tile.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      directions: nearbyTiles.reduce((acc, t) => {
        acc[t.direction] = (acc[t.direction] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
    };
    
    return {
      nearbyTiles,
      adjacentTiles,
      statistics,
    };
  }
  
  /**
   * Combina múltiplos resultados de validação em um resultado final
   * Lógica genérica sem interpretação de domínio específico
   */
  private combineResults(
    draggedTile: TileData,
    targetPosition: { x: number; y: number },
    nearbyTiles: ProximityTile[],
    allTiles: TilePosition[],
    results: ValidationResult[]
  ): PositionValidationEvent['validationResult'] {
    if (results.length === 0) {
      return this.getDefaultResult(draggedTile, targetPosition, nearbyTiles, allTiles);
    }
    
    // Verificar se alguma regra bloqueia completamente
    const blocked = results.find(r => r.feedback === 'blocked');
    if (blocked) {
      return {
        isValid: false,
        canPlace: false,
        feedback: 'blocked',
        penalties: blocked.penalties,
        visualFeedback: blocked.visualFeedback || {
          icon: 'blocked',
          color: '#ff6600',
          animation: 'shake',
        },
      };
    }
    
    // Combinar benefícios e penalidades
    const allBenefits = results.flatMap(r => r.benefits || []);
    const allPenalties = results.flatMap(r => r.penalties || []);
    
    // Determinar feedback geral baseado em contagem simples
    const positiveCount = results.filter(r => r.feedback === 'positive').length;
    const negativeCount = results.filter(r => r.feedback === 'negative').length;
    
    let feedback: 'positive' | 'negative' | 'neutral' | 'blocked';
    let icon: 'plus' | 'minus' | 'blocked' | 'warning' | 'info' | 'star' | 'chain';
    let color: string;
    let animation: 'pulse' | 'glow' | 'shake' | 'bounce';
    
    if (positiveCount > negativeCount) {
      feedback = 'positive';
      // Usar ícone do primeiro resultado positivo que tem feedback visual
      const positiveResult = results.find(r => r.feedback === 'positive' && r.visualFeedback);
      icon = positiveResult?.visualFeedback?.icon || 'plus';
      color = positiveResult?.visualFeedback?.color || '#00ff00';
      animation = positiveResult?.visualFeedback?.animation || 'glow';
    } else if (negativeCount > positiveCount) {
      feedback = 'negative';
      const negativeResult = results.find(r => r.feedback === 'negative' && r.visualFeedback);
      icon = negativeResult?.visualFeedback?.icon || 'minus';
      color = negativeResult?.visualFeedback?.color || '#ff0000';
      animation = negativeResult?.visualFeedback?.animation || 'pulse';
    } else {
      feedback = 'neutral';
      icon = 'info';
      color = '#ffaa00';
      animation = 'pulse';
    }
    
    // Gerar sugestões (algoritmo genérico sem lógica de domínio)
    const suggestions = generatePositionSuggestions(
      targetPosition,
      allTiles,
      this.boardSize,
      3
    );
    
    return {
      isValid: true,
      canPlace: !blocked,
      feedback,
      benefits: allBenefits.length > 0 ? allBenefits : undefined,
      penalties: allPenalties.length > 0 ? allPenalties : undefined,
      suggestions,
      visualFeedback: {
        icon,
        color,
        animation,
        showRange: nearbyTiles.length > 0,
        rangeColor: color,
      },
    };
  }
  
  /**
   * Resultado padrão quando nenhuma regra se aplica ou não há regras
   */
  private getDefaultResult(
    _draggedTile: TileData,
    targetPosition: { x: number; y: number },
    _nearbyTiles: ProximityTile[],
    allTiles: TilePosition[]
  ): PositionValidationEvent['validationResult'] {
    const suggestions = generatePositionSuggestions(
      targetPosition,
      allTiles,
      this.boardSize,
      3
    );
    
    return {
      isValid: true,
      canPlace: true,
      feedback: 'neutral',
      suggestions,
      visualFeedback: {
        icon: 'info',
        color: '#cccccc',
        animation: 'pulse',
      },
    };
  }
  
  /**
   * Atualiza o tamanho do board
   */
  updateBoardSize(width: number, height: number): void {
    this.boardSize = { width, height };
  }
  
  /**
   * Obtém o tamanho atual do board
   */
  getBoardSize(): { width: number; height: number } {
    return { ...this.boardSize };
  }
} 
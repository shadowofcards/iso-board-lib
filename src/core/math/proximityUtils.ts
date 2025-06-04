/**
 * Utilitários para calcular proximidade e direções entre tiles
 */

import type { TileData } from '../models/Tile';

export interface TilePosition {
  x: number;
  y: number;
  tile: TileData;
}

export interface ProximityTile {
  tile: TileData;
  position: { x: number; y: number };
  distance: number;
  direction: 'north' | 'south' | 'east' | 'west' | 'northeast' | 'northwest' | 'southeast' | 'southwest';
}

/**
 * Calcula a distância euclidiana entre duas posições
 */
export function calculateDistance(pos1: { x: number; y: number }, pos2: { x: number; y: number }): number {
  const dx = pos2.x - pos1.x;
  const dy = pos2.y - pos1.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Calcula a distância Manhattan (grid) entre duas posições
 */
export function calculateManhattanDistance(pos1: { x: number; y: number }, pos2: { x: number; y: number }): number {
  return Math.abs(pos2.x - pos1.x) + Math.abs(pos2.y - pos1.y);
}

/**
 * Determina a direção de um tile em relação a outro
 */
export function getDirection(from: { x: number; y: number }, to: { x: number; y: number }): ProximityTile['direction'] {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  
  // Normalizar para direções principais
  if (Math.abs(dx) > Math.abs(dy)) {
    // Movimento predominantemente horizontal
    if (dx > 0) {
      if (dy > 0) return 'southeast';
      if (dy < 0) return 'northeast';
      return 'east';
    } else {
      if (dy > 0) return 'southwest';
      if (dy < 0) return 'northwest';
      return 'west';
    }
  } else {
    // Movimento predominantemente vertical
    if (dy > 0) {
      if (dx > 0) return 'southeast';
      if (dx < 0) return 'southwest';
      return 'south';
    } else {
      if (dx > 0) return 'northeast';
      if (dx < 0) return 'northwest';
      return 'north';
    }
  }
}

/**
 * Encontra todos os tiles próximos dentro de um raio específico
 */
export function findNearbyTiles(
  targetPosition: { x: number; y: number },
  allTiles: TilePosition[],
  radius: number,
  useEuclidean: boolean = true
): ProximityTile[] {
  const nearbyTiles: ProximityTile[] = [];
  
  for (const tilePos of allTiles) {
    const distance = useEuclidean 
      ? calculateDistance(targetPosition, tilePos)
      : calculateManhattanDistance(targetPosition, tilePos);
      
    if (distance <= radius && distance > 0) { // Excluir posição exata
      const direction = getDirection(targetPosition, tilePos);
      
      nearbyTiles.push({
        tile: tilePos.tile,
        position: { x: tilePos.x, y: tilePos.y },
        distance,
        direction,
      });
    }
  }
  
  // Ordenar por distância (mais próximos primeiro)
  return nearbyTiles.sort((a, b) => a.distance - b.distance);
}

/**
 * Encontra tiles adjacentes (distância 1)
 */
export function findAdjacentTiles(
  targetPosition: { x: number; y: number },
  allTiles: TilePosition[]
): ProximityTile[] {
  return findNearbyTiles(targetPosition, allTiles, 1.5, false); // 1.5 para incluir diagonais
}

/**
 * Verifica se uma posição está em uma zona de influência específica
 */
export function isInInfluenceZone(
  position: { x: number; y: number },
  influenceCenter: { x: number; y: number },
  influenceRadius: number,
  influenceType: 'circle' | 'square' | 'diamond' = 'circle'
): boolean {
  switch (influenceType) {
    case 'circle':
      return calculateDistance(position, influenceCenter) <= influenceRadius;
    
    case 'square':
      const dx = Math.abs(position.x - influenceCenter.x);
      const dy = Math.abs(position.y - influenceCenter.y);
      return dx <= influenceRadius && dy <= influenceRadius;
    
    case 'diamond':
      return calculateManhattanDistance(position, influenceCenter) <= influenceRadius;
    
    default:
      return false;
  }
}

/**
 * Calcula o score de proximidade baseado em múltiplos fatores
 */
export function calculateProximityScore(
  _targetPosition: { x: number; y: number },
  nearbyTiles: ProximityTile[],
  weights: {
    distanceWeight?: number;
    adjacencyBonus?: number;
    typeMultiplier?: Record<string, number>;
  } = {}
): number {
  const {
    distanceWeight = 1,
    adjacencyBonus = 2,
    typeMultiplier = {},
  } = weights;
  
  let score = 0;
  
  for (const nearby of nearbyTiles) {
    // Base score inversamente proporcional à distância
    const baseScore = 1 / (nearby.distance * distanceWeight);
    
    // Bonus para tiles adjacentes
    const adjacentBonus = nearby.distance <= 1.5 ? adjacencyBonus : 1;
    
    // Multiplicador baseado no tipo de tile
    const typeMulti = typeMultiplier[nearby.tile.type] || 1;
    
    score += baseScore * adjacentBonus * typeMulti;
  }
  
  return score;
}

/**
 * Gera sugestões de posições melhores baseadas em proximidade
 */
export function generatePositionSuggestions(
  currentPosition: { x: number; y: number },
  allTiles: TilePosition[],
  boardSize: { width: number; height: number },
  maxSuggestions: number = 3
): Array<{ position: { x: number; y: number }; reason: string; score: number }> {
  const suggestions: Array<{ position: { x: number; y: number }; reason: string; score: number }> = [];
  
  // Testar posições em uma área ao redor da posição atual
  const searchRadius = 3;
  
  for (let x = Math.max(0, currentPosition.x - searchRadius); x < Math.min(boardSize.width, currentPosition.x + searchRadius + 1); x++) {
    for (let y = Math.max(0, currentPosition.y - searchRadius); y < Math.min(boardSize.height, currentPosition.y + searchRadius + 1); y++) {
      // Pular a posição atual
      if (x === currentPosition.x && y === currentPosition.y) continue;
      
      // Verificar se posição está ocupada
      const isOccupied = allTiles.some(t => t.x === x && t.y === y);
      if (isOccupied) continue;
      
      const testPosition = { x, y };
      const nearbyTiles = findNearbyTiles(testPosition, allTiles, 3);
      const score = calculateProximityScore(testPosition, nearbyTiles);
      
      if (score > 0) {
        let reason = `${nearbyTiles.length} tiles próximos`;
        
        // Analisar padrões específicos
        const adjacentCount = nearbyTiles.filter(t => t.distance <= 1.5).length;
        if (adjacentCount >= 2) {
          reason = `Ótima sinergia com ${adjacentCount} tiles adjacentes`;
        } else if (adjacentCount === 1) {
          reason = `Boa posição ao lado de ${nearbyTiles[0].tile.type}`;
        }
        
        suggestions.push({ position: testPosition, reason, score });
      }
    }
  }
  
  // Ordenar por score e retornar as melhores
  return suggestions
    .sort((a, b) => b.score - a.score)
    .slice(0, maxSuggestions);
} 
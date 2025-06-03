# 


```
iso-board-lib/
├── src/
│   ├── core/                        # 💡 Lógica pura e reutilizável (sem React)
│   │   ├── math/
│   │   │   ├── isoCoordinate.ts     # Conversão lógica <-> isométrica
│   │   │   ├── cameraMath.ts        # Zoom, panning e limites
│   │   │   └── tileUtils.ts         # Vizinhança, colisão, alinhamento
│   │   ├── models/
│   │   │   ├── Tile.ts              # Interface TileData
│   │   │   ├── Board.ts             # Board logic, vizinhança, busca
│   │   │   └── Camera.ts            # Estado da câmera e operações
│   │   ├── engine/
│   │   │   ├── BoardStateManager.ts # Aplica eventos, reconcilia mudanças
│   │   │   └── DragController.ts    # Gerencia estado de drag & preview
│
│   ├── components/                 # 🧩 Componentes React
│   │   ├── IsoBoardCanvas.tsx      # Canvas principal
│   │   ├── IsoTileInventory.tsx    # Lista de tiles disponíveis para arrastar
│   │   ├── PreviewOverlay.tsx      # Overlay do tile em drag
│   │   ├── CameraHandler.tsx       # Hook/controlador de panning e zoom
│   │   └── TileInteractionLayer.tsx# Detecta clique, hover, toque
│
│   ├── hooks/                      # 🔁 Reusáveis
│   │   ├── useBoardController.ts   # Coordena estado do board visual
│   │   └── useDragTile.ts          # Coordena drag & preview
│
│   └── index.ts                    # Exportações da lib
│
├── types/
│   └── public.d.ts                 # API externa: TileData, Events, etc.
├── package.json
├── README.md
└── tsconfig.json

```


```
POR ONDE COMEÇAR?
Etapas iniciais recomendadas:
Ordem	Nome	Motivo
✅ 1	Tile.ts	Base para tudo (tipagem do mundo do jogo)
✅ 2	isoCoordinate.ts	Essencial para renderização isométrica
✅ 3	Board.ts	Ajuda com regras de ocupação e vizinhança
✅ 4	IsoBoardCanvas.tsx	Primeira visualização, mesmo que simples
✅ 5	useBoardController.ts	Hook para isolar a lógica de controle do board

```
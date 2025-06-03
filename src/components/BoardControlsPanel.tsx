import React, { useState } from 'react';
import {
  useAdvancedBoardControls,
} from '../hooks/useAdvancedBoardControls';
import { Camera } from '../core/models/Camera';

interface Props {
  cameraModel : Camera;
  containerRef: React.RefObject<HTMLElement>;
  className?  : string;
}

/** Painel flutuante demonstrando as funções do hook. */
export const BoardControlsPanel: React.FC<Props> = ({
  cameraModel,
  containerRef,
  className = '',
}) => {
  const [bmName, setBmName] = useState('');
  const [tpX, setTpX] = useState('');
  const [tpY, setTpY] = useState('');
  const [showBM, setShowBM] = useState(false);

  const ctl = useAdvancedBoardControls(cameraModel, {
    enableKeyboardControls: true,
    enableSmoothAnimations: true,
    containerRef,
  });

  const addBm = () => {
    if (bmName.trim()) {
      ctl.addBookmark(bmName.trim());
      setBmName('');
    }
  };
  const teleport = () => {
    const x = parseFloat(tpX), y = parseFloat(tpY);
    if (!Number.isNaN(x) && !Number.isNaN(y)) {
      ctl.teleportTo({ x, y });
      setTpX(''); setTpY('');
    }
  };

  const pos  = ctl.getCurrentPosition();
  const zoom = ctl.getCurrentZoom();

  return (
    <div className={`board-controls-panel ${className}`} style={panelStyle}>
      {/* status */}
      <div style={statusStyle}>
        <div><b>Pos:</b> {pos.x.toFixed(0)}, {pos.y.toFixed(0)}</div>
        <div><b>Zoom:</b> {(zoom*100).toFixed(0)}%</div>
        {ctl.isFollowing && <div style={{ color: '#4caf50' }}>🎯 Following</div>}
        {ctl.isAnimating && <div style={{ color: '#2196f3' }}>⏳ Anim.</div>}
      </div>

      {/* básicos */}
      <Section title="Básico">
        <Button onClick={ctl.centerCamera} disabled={ctl.isAnimating}>🏠 Centro</Button>
        <Button onClick={ctl.resetZoom}   disabled={ctl.isAnimating}>🔍 Reset</Button>
      </Section>

      {/* teleporte */}
      <Section title="Teleporte">
        <input type="number" placeholder="X" value={tpX} onChange={e=>setTpX(e.target.value)} style={inputStyle}/>
        <input type="number" placeholder="Y" value={tpY} onChange={e=>setTpY(e.target.value)} style={inputStyle}/>
        <Button onClick={teleport} disabled={ctl.isAnimating}>⚡ Ir</Button>
      </Section>

      {/* bookmarks */}
      <Section title={`Bookmarks (${ctl.bookmarks.length})`}>
        <Button small onClick={()=>setShowBM(!showBM)}>{showBM?'▲':'▼'}</Button>
      </Section>

      {showBM && (
        <>
          <div style={{ display:'flex', gap:4 }}>
            <input
              placeholder="Nome" value={bmName}
              onChange={e=>setBmName(e.target.value)}
              style={{ ...inputStyle, flex:1 }}
              onKeyDown={e=>e.key==='Enter' && addBm()}
            />
            <Button onClick={addBm} disabled={!bmName.trim()}>＋</Button>
          </div>

          <div style={{ maxHeight:120, overflow:'auto', marginTop:4 }}>
            {ctl.bookmarks.length===0 && <div style={{ color:'#888', textAlign:'center' }}>– vazio –</div>}
            {ctl.bookmarks.map(b=>(
              <div key={b.id} style={bmRow}>
                <span title={b.name} style={{ flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                  {b.name}
                </span>
                <Button small onClick={()=>ctl.goToBookmark(b.id)} disabled={ctl.isAnimating}>📍</Button>
                <Button small danger onClick={()=>ctl.removeBookmark(b.id)}>×</Button>
              </div>
            ))}
          </div>
        </>
      )}

      {/* follow */}
      <Section title="Auto-seguimento">
        {ctl.isFollowing
          ? <Button danger onClick={ctl.stopFollowing}>🛑 Parar</Button>
          : <Button onClick={()=>ctl.startFollowing(pos)}>🎯 Seguir posição atual</Button>}
      </Section>
    </div>
  );
};

/* ---------- helpers ---------- */
const panelStyle: React.CSSProperties = {
  position:'absolute', top:10, right:10, background:'rgba(0,0,0,.8)',
  color:'#fff', padding:14, borderRadius:8, width:260, fontSize:12, zIndex:1000,
  fontFamily:'system-ui, sans-serif',
};
const statusStyle: React.CSSProperties = { marginBottom:12, fontSize:11, color:'#ccc' };

const inputStyle: React.CSSProperties = {
  flex:1, padding:'6px 8px', background:'rgba(255,255,255,.1)',
  border:'1px solid rgba(255,255,255,.3)', borderRadius:4, color:'#fff', fontSize:11,
};

const bmRow: React.CSSProperties = {
  display:'flex', gap:2, alignItems:'center',
  background:'rgba(255,255,255,.1)', padding:'2px 4px', borderRadius:4, margin:'2px 0',
};

const Button: React.FC<{ onClick:()=>void; disabled?:boolean; children:any; small?:boolean; danger?:boolean}> =
  ({ onClick, disabled, children, small, danger=false }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        background: danger ? '#dc3545' : '#007bff',
        color:'#fff', border:'none', cursor:'pointer',
        padding: small ? '2px 6px' : '6px 10px',
        borderRadius:4, fontSize: small ? 10 : 11,
        flexShrink:0,
      }}
    >
      {children}
    </button>
  );

const Section: React.FC<{ title:string; children?:any }> = ({ title, children }) => (
  <div style={{ marginBottom:12 }}>
    <div style={{ fontWeight:'bold', marginBottom:4 }}>{title}</div>
    <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>{children}</div>
  </div>
);

export default BoardControlsPanel;

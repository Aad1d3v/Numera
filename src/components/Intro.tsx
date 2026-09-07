import { LogoMark } from './Icons'
import { MODES } from '../modes/registry'

export default function Intro({ onDone }: { onDone: () => void }) {
  return (
    <div className="intro" aria-label="Welcome">
      <button className="intro-skip" onClick={onDone}>
        Skip
      </button>
      <div className="intro-inner">
        <div className="intro-logo anim d1">
          <LogoMark size={72} />
        </div>
        <h1 className="intro-title anim d2">Numera</h1>
        <p className="intro-tag anim d3">Every calculator you need, in one beautiful place.</p>

        <div className="intro-cards">
          {MODES.map((m, i) => (
            <div key={m.id} className="intro-card anim" style={{ animationDelay: `${0.35 + i * 0.09}s` }}>
              <span className="intro-card-icon" style={{ color: m.color }}>
                <m.Icon size={22} />
              </span>
              <b>{m.label}</b>
              <span className="intro-card-desc">{m.tagline}</span>
            </div>
          ))}
        </div>

        <button className="intro-cta anim d9" onClick={onDone}>
          Get started
        </button>
        <p className="intro-foot anim d10">No account · Keyboard friendly · Your data stays in your browser</p>
      </div>
    </div>
  )
}

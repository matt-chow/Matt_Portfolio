import { cards } from '../content/manifest';
import { achievements, DEFAULT_REWARDS, unlockedRewards } from '../engine/achievements';
import { equip } from '../engine/state';
import { act, useStore } from '../store';
import { Card } from './Card';

const sample = cards[0];

export function Medals() {
  const s = useStore();
  const backs = [DEFAULT_REWARDS.back, ...unlockedRewards(s, 'back')];
  const frames = [DEFAULT_REWARDS.frame, ...unlockedRewards(s, 'frame')];
  const done = achievements.filter((a) => s.achievements[a.id]).length;
  return (
    <div className="page medals">
      <div className="page-head">
        <div>
          <h1>Medals</h1>
          <p className="muted">{done} of {achievements.length} earned · rewards are card backs, frames and stickers.</p>
        </div>
      </div>
      <div className="medals-body scroll-y">
        <ul className="medal-grid" aria-label="All medals">
          {achievements.map((a) => {
            const got = s.achievements[a.id];
            const status = got ? `Earned ${new Date(got).toLocaleDateString()}` : 'Not yet earned';
            return (
              <li key={a.id} className={`medal-card ${got ? 'got' : 'locked'}`} title={`${a.name}: ${a.desc} ${status}.`}>
                <span className={`medal medal-${a.medal}`} aria-hidden="true"><span>{got ? '★' : '?'}</span></span>
                <div>
                  <h2>{a.name}</h2>
                  <p>{a.desc}</p>
                  <p className="small medal-status">
                    {got ? status : <span className="muted">Not yet</span>}
                    {a.reward && <span className="muted"> · Unlocks: {a.reward.label}</span>}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>

        <section className="equip">
          <h2>Display options</h2>
          <fieldset>
            <legend>Card back</legend>
            <div className="equip-row">
              {backs.map((b) => (
                <label key={b.id} className="equip-opt">
                  <input type="radio" name="back" checked={s.equipped.back === b.id} onChange={() => act((x) => equip(x, { back: b.id }))} />
                  <Card card={sample} tier="ink" back={b.id} faceDown tilt={false} className="card-sm" />
                  <span>{b.label}</span>
                </label>
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend>Frame</legend>
            <div className="equip-row">
              {frames.map((f) => (
                <label key={f.id} className="equip-opt">
                  <input type="radio" name="frame" checked={s.equipped.frame === f.id} onChange={() => act((x) => equip(x, { frame: f.id }))} />
                  <Card card={sample} tier="accent" frame={f.id} tilt={false} className="card-sm" />
                  <span>{f.label}</span>
                </label>
              ))}
            </div>
          </fieldset>
        </section>
      </div>
    </div>
  );
}

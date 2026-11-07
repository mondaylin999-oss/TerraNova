'use client';

import { useState } from 'react';
import { earthSources, type Topic } from '../lib/earth-sources';

const topics: { name: Topic; icon: string; description: string }[] = [
  { name: 'Weather', icon: '☂', description: 'Rainfall, atmospheric history, and the energy of the sun.' },
  { name: 'Ocean', icon: '≈', description: 'Surface temperature, ocean color, and life beneath the blue.' },
  { name: 'Forest', icon: '♧', description: 'Vegetation, land cover, and landscapes changing through time.' },
  { name: 'Air', icon: '≋', description: 'Aerosols and trace gases that help us understand our atmosphere.' },
];

export default function SourceExplorer() {
  const [topic, setTopic] = useState<Topic>('Weather');
  const [selected, setSelected] = useState('gpm');
  const [search, setSearch] = useState('');
  const [date, setDate] = useState('2024-01-15');
  const sources = earthSources.filter(s => s.topic === topic);
  const visible = sources.filter(s => `${s.name} ${s.measurement} ${s.detail}`.toLowerCase().includes(search.toLowerCase()));
  const source = sources.find(s => s.id === selected) ?? sources[0];
  return <section id="sources" className="sources-section" aria-labelledby="sources-heading">
    <div className="sources-heading"><div><div className="eyebrow">03 / EXPLORE THE EVIDENCE</div><h2 id="sources-heading">One planet. Many ways to understand it.</h2><p className="muted">Explore your NASA sources, see what each measures, and follow the data.</p></div><span className="pill">12 SOURCE GUIDES</span></div>
    <div className="topic-tabs" role="tablist" aria-label="Earth science topic">{topics.map(t => <button key={t.name} id={`tab-${t.name}`} role="tab" aria-selected={topic === t.name} aria-controls="source-panel" tabIndex={0} className={topic === t.name ? 'active' : ''} onClick={() => { setTopic(t.name); setSelected(earthSources.find(s => s.topic === t.name)!.id); setSearch(''); }}><span aria-hidden="true">{t.icon}</span>{t.name}<small>{earthSources.filter(s => s.topic === t.name).length} sources</small></button>)}</div>
    <div id="source-panel" role="tabpanel" aria-labelledby={`tab-${topic}`} className="source-panel">
      <div className="source-list"><p className="muted">{topics.find(t => t.name === topic)?.description}</p><label htmlFor="source-search">FIND A SOURCE</label><input id="source-search" type="search" value={search} placeholder="Search names or measurements" onChange={e => setSearch(e.target.value)} />{visible.map(s => <button className={`source-option ${s.id === source.id ? 'active' : ''}`} key={s.id} aria-pressed={s.id === source.id} onClick={() => setSelected(s.id)}><strong>{s.name}</strong><span>{s.measurement}</span></button>)}{visible.length === 0 && <p className="muted" role="status">No matching sources. Try another name or clear your search.</p>}</div>
      <article className="source-detail"><span className="pill">{topic.toUpperCase()} / SOURCE GUIDE</span><h3>{source.name}</h3><p className="source-measurement">{source.measurement}</p><p>{source.detail}</p><dl><div><dt>COVERAGE</dt><dd>{source.coverage}</dd></div><div><dt>TIME & DETAIL</dt><dd>{source.cadence}</dd></div></dl><div className="source-note"><strong>Reading the data</strong><p>{source.note}</p></div><div className="source-actions"><a href={source.url} target="_blank" rel="noreferrer">Read source documentation ↗</a><a href={`https://search.earthdata.nasa.gov/search?q=${encodeURIComponent(source.query)}`} target="_blank" rel="noreferrer">Find datasets ↗</a></div><p className="access-note">Source guides link to NASA and USGS services. Scientific downloads may require a free Earthdata or USGS account. These guides do not supply measurements to the sound player.</p></article>
    </div>
    <div className="explore-date"><div><strong>Explore a day on Earth</strong><p>Open NASA Worldview on your chosen date; select an available layer there.</p></div><label htmlFor="imagery-date">Imagery date<input id="imagery-date" type="date" required value={date} onChange={e => setDate(e.target.value)} /></label>{date && <a href={`https://worldview.earthdata.nasa.gov/?t=${encodeURIComponent(date)}`} target="_blank" rel="noreferrer">Explore imagery ↗</a>}</div>
  </section>;
}

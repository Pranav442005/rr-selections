import React, {useMemo, useState} from 'react';
import DATA from './data.json';

const fmt=(n,d=1)=>n===null||n===undefined||n===''?'—':Number(n).toLocaleString('en-IN',{maximumFractionDigits:d,minimumFractionDigits:d});
const pct=n=>n===null||n===undefined?'—':`${Number(n).toFixed(1)}%`;
const initials=s=>(s||'').split(' ').map(x=>x[0]).slice(0,2).join('').toUpperCase();
const scenarios=['Consensus','Base','Strict','Broad'];
const sourceNames={competitions:'Competitions',matches:'Matches',ball_by_ball:'Ball by ball',teams:'Teams',playing_eleven:'Playing eleven',competition_team_player_mapping:'Competition / player mapping'};
const sourceCharts={competitions:'source_competitions.png',matches:'source_matches.png',ball_by_ball:'source_ball_by_ball.png',teams:'source_teams.png',playing_eleven:'source_playing_eleven.png',competition_team_player_mapping:'source_player_mapping.png'};
const chart=(name,alt)=> <img className="chart-image" src={`/charts/${name}`} alt={alt}/>;

function Stat({label,value,note}){return <div className="stat"><span>{label}</span><strong>{value}</strong><small>{note}</small></div>}
function Panel({title,sub,children,extra}){return <section className="panel"><div className="panel-head"><div><h3>{title}</h3>{sub&&<p className="muted small">{sub}</p>}</div>{extra}</div>{children}</section>}
function Table({columns,rows,limit=20,onRow}) {
 const [q,setQ]=useState('');
 const filtered=useMemo(()=>rows.filter(r=>!q||columns.some(c=>String(r[c.key]??'').toLowerCase().includes(q.toLowerCase()))),[rows,q,columns]);
 return <div className="table-component"><div className="table-tools"><input value={q} onChange={e=>setQ(e.target.value)} placeholder="Filter displayed rows..."/><span>{fmt(filtered.length,0)} rows</span></div><div className="table-wrap"><table><thead><tr>{columns.map(c=><th key={c.key}>{c.label}</th>)}</tr></thead><tbody>{filtered.slice(0,limit).map((r,i)=><tr key={`${r.player_id??r.match_id??r.comp_id??'row'}-${r.format??''}-${r.season??''}-${i}`} onClick={()=>onRow&&onRow(r)}>{columns.map(c=><td key={c.key}>{c.render?c.render(r[c.key],r):String(r[c.key]??'—')}</td>)}</tr>)}</tbody></table>{filtered.length===0&&<div className="empty">No rows match this filter.</div>}</div><div className="table-foot">Showing {Math.min(limit,filtered.length)} of {filtered.length} matching rows. Use the CSV export for the complete dataset.</div></div>
}
function Score({value}){return <span className="score"><i style={{width:`${Math.max(2,Math.min(100,Number(value)||0))}%`}}/>{fmt(value)}</span>}
function App(){
 const [tab,setTab]=useState('Overview'),[kind,setKind]=useState('Batters'),[scenario,setScenario]=useState('Consensus');
 const [query,setQuery]=useState(''),[minBalls,setMinBalls]=useState(0),[sort,setSort]=useState('rank');
 const [selected,setSelected]=useState(null),[compareA,setCompareA]=useState('Shashank Singh'),[compareB,setCompareB]=useState('Rinku Singh');
 const [sourceKey,setSourceKey]=useState('competitions'),[metricScenario,setMetricScenario]=useState('Base'),[metricKind,setMetricKind]=useState('Batters');
 const [rrr,setRrr]=useState(10),[wkts,setWkts]=useState(5),[overs,setOvers]=useState(4),[phase,setPhase]=useState('Death');
 const batting=kind==='Batters';
 const rows=useMemo(()=>{
   const key=batting?(scenario==='Consensus'?'batters':`batters${scenario}`):(scenario==='Consensus'?'bowlers':`bowlers${scenario}`);
   return DATA.rankings[key]||[];
 },[batting,scenario]);
 const ranked=useMemo(()=>{
   let x=rows.filter(r=>(r.player||'').toLowerCase().includes(query.toLowerCase()));
   x=x.filter(r=>Number(batting?(r.pressure_balls??0):(r.pressure_legal_balls??0))>=minBalls);
   x=x.slice();
   if(scenario==='Consensus') x.sort((p,q)=>Number(p.final_rank)-Number(q.final_rank));
   else x.sort((p,q)=>Number(p.rank)-Number(q.rank));
   if(sort==='score') x.sort((p,q)=>Number(q.score)-Number(p.score));
   if(sort==='volume') x.sort((p,q)=>Number(batting?q.pressure_balls:q.pressure_legal_balls)-Number(batting?p.pressure_balls:p.pressure_legal_balls));
   if(sort==='name') x.sort((p,q)=>p.player.localeCompare(q.player));
   return x;
 },[rows,query,minBalls,sort,batting,scenario]);
 const topBat=DATA.rankings.batters.slice(0,10),topBowl=DATA.rankings.bowlers.slice(0,10);
 const players=batting?DATA.rankings.batters:DATA.rankings.bowlers;
 const playerA=players.find(p=>p.player===compareA)||players[0],playerB=players.find(p=>p.player===compareB)||players[1];
 const pressureScore=Math.min(100,Math.round((Math.min(rrr/16,1)*42)+(wkts/10*25)+(Math.max(0,6-overs)/6*23)+(phase==='Death'?10:phase==='Middle'?6:2)));
 const openPlayer=p=>{setSelected(p);setTab('Player profile')};
 const rank=r=>scenario==='Consensus'?r.final_rank:r.rank;
 const balls=r=>batting?r.pressure_balls:r.pressure_legal_balls;
 const metricRows=metricKind==='Batters'?DATA.rankings[`batterMetrics${metricScenario}`]:DATA.rankings[`bowlerMetrics${metricScenario}`];
 const source=DATA.sourceTables[sourceKey];
 const sourceMeta=DATA.sourceMeta.find(x=>x.key===sourceKey);
 const metricColumns=metricKind==='Batters'?[
  ['player','Player'],['format','Format'],['role','Role'],['pressure_balls','Pressure balls'],['pressure_runs','Pressure runs'],['pressure_dismissals','Dismissals'],['pressure_matches','Matches'],['pressure_sr','Pressure SR'],['normal_sr','Normal SR'],['sr_retention','SR retention'],['runs_per_dismissal_smooth','Runs/dismissal'],['boundary_pct','Boundary %'],['dot_pct','Dot %'],['consistency_cv','Consistency CV'],['eligible','Eligible']
 ]:[
  ['player','Player'],['format','Format'],['phase','Phase'],['pressure_legal_balls','Pressure legal balls'],['pressure_runs_conceded','Runs conceded'],['pressure_wickets','Wickets'],['pressure_matches','Matches'],['pressure_economy','Pressure economy'],['normal_economy','Normal economy'],['wickets_per6','Wickets / 6'],['dot_pct','Dot %'],['economy_improvement','Economy change'],['wicket_rate_delta','Wicket-rate change'],['consistency_cv','Consistency CV'],['eligible','Eligible']
 ];
 const metricData=metricRows||[];
 const sourceCols=(source?.columns||[]).map(c=>({key:c,label:c}));
 const deliveryCols=['match_id','season','format','innings','overid','over_ball_num','striker_name','bowler_name','score_before','wickets_before','legal_elapsed','balls_remaining','rrr','legal','team_runs','extras_type','is_wicket','pressure_scenario_label'].map(c=>({key:c,label:c.replaceAll('_',' ')}));
 const nav=['Overview','Rankings','Player profile','Clutch analytics','Format analysis','Player comparison','Pressure simulator','Delivery explorer','Data explorer','Data quality','Methodology','Downloads'];
 const title=tab==='Overview'?'Pressure intelligence':tab;
 const severity=pressureScore>=70?'Extreme pressure':pressureScore>=45?'High pressure':pressureScore>=25?'Building pressure':'Lower pressure';
 return <div className="app">
  <aside className="sidebar">
   <div className="brand">
    <div className="brand-logo-slot"><img src="/rr-logo.png" alt="Rajasthan Royals logo" onError={e=>{e.currentTarget.style.display='none'}}/><span>RR</span></div>
    <div><b>CLUTCH<span>BOARD</span></b><small>SUpeRR SELECTOR · S2</small></div>
   </div>
   <div className="nav-label">MENU</div>
   {nav.map(x=><button key={x} className={`nav ${tab===x?'active':''}`} onClick={()=>{setTab(x);setSelected(null)}}>{x}</button>)}
  </aside>
  <main className="main">
   <header className="topbar"><div><span className="eyebrow">IPL + T20I · 2022 ONWARD</span><h1>{title}</h1></div></header>

   {tab==='Overview'&&<>
    <section className="hero"><div><div className="eyebrow gold">THE CLUTCH INDEX · 2022–PRESENT</div><h2>Who delivers when<br/><em>the game gets tight?</em></h2><p>A transparent, scenario-tested review of IPL and T20I pressure performance. Explore player rankings, source data, delivery states, validation checks and the assumptions behind every score.</p><button className="primary" onClick={()=>setTab('Rankings')}>Explore player rankings <span>↗</span></button></div></section>
    <div className="stats-grid">
     <Stat label="MATCH RECORDS IN SCOPE" value={fmt(DATA.quality.match_records_in_scope,0)} note="371 IPL · 482 T20I"/>
     <Stat label="DELIVERY ROWS" value={fmt(DATA.quality.regulation_innings_delivery_rows,0)} note="Innings 1 and 2 only"/>
     <Stat label="BASE PRESSURE DELIVERIES" value={fmt(DATA.scenarioSummary.find(x=>x.scenario==='Base')?.pressure_deliveries,0)} note="30.21% of scoped deliveries"/>
     <Stat label="CONSENSUS CANDIDATES" value={`${DATA.rankings.batters.length} batters · ${DATA.rankings.bowlers.length} bowlers`} note="Eligible across all 3 scenarios"/>
    </div>
    <div className="section-head"><div><div className="eyebrow">THE SHORTLIST</div><h3>Consensus pressure performers</h3></div><button className="text-btn" onClick={()=>setTab('Rankings')}>Open full rankings →</button></div>
    <div className="leader-grid"><Leaderboard title="TOP 10 BATTERS" data={topBat} type="Batters" onOpen={openPlayer}/><Leaderboard title="TOP 10 BOWLERS" data={topBowl} type="Bowlers" onOpen={openPlayer}/></div>
    <div className="chart-grid"><Panel title="Scenario sensitivity" sub="The pressure share changes as the threshold definition broadens.">{chart('pressure_scenarios.png','Pressure deliveries across strict base broad definitions')}</Panel><Panel title="Data coverage" sub="Row counts across the six source tables.">{chart('source_table_volume.png','Source table record volume')}</Panel></div>
    <div className="notice"><b>Note</b><span>Exploratory, analyst-defined rankings, not official player ratings.</span></div>
   </>}

   {tab==='Rankings'&&<>
    <div className="toolbar"><div className="switch"><button className={batting?'selected':''} onClick={()=>{setKind('Batters');setQuery('')}}>Batters</button><button className={!batting?'selected':''} onClick={()=>{setKind('Bowlers');setQuery('')}}>Bowlers</button></div>
     <select value={scenario} onChange={e=>setScenario(e.target.value)}>{scenarios.map(s=><option key={s}>{s}</option>)}</select>
     <input placeholder="Search player..." value={query} onChange={e=>setQuery(e.target.value)}/>
     <select value={minBalls} onChange={e=>setMinBalls(Number(e.target.value))}><option value="0">Any sample</option><option value="100">100+ pressure balls</option><option value="200">200+ pressure balls</option><option value="400">400+ pressure balls</option></select>
     <select value={sort} onChange={e=>setSort(e.target.value)}><option value="rank">Rank order</option><option value="score">Model score</option><option value="volume">Sample volume</option><option value="name">Name A–Z</option></select>
    </div>
    <div className="table-wrap"><table><thead><tr><th>RANK</th><th>PLAYER</th><th>FORMAT</th><th>PRESSURE SAMPLE</th><th>{batting?'PRESSURE SR':'PRESSURE ECON'}</th><th>{batting?'RUNS':'WICKETS'}</th><th>MODEL SCORE</th></tr></thead><tbody>{ranked.map((r,i)=><tr key={`${r.player_id}-${r.formats??''}-${i}`} onClick={()=>openPlayer(r)}><td><b className="rank-num">{rank(r)||i+1}</b></td><td><div className="player-cell"><div className="mini-avatar">{initials(r.player)}</div><b>{r.player}</b></div></td><td><span className="format">{r.formats||'—'}</span></td><td>{fmt(balls(r),0)}</td><td className="gold-text">{batting?fmt(r.pressure_sr):fmt(r.pressure_economy,2)}</td><td>{batting?fmt(r.pressure_runs,0):fmt(r.pressure_wickets,0)}</td><td><Score value={r.score}/></td></tr>)}</tbody></table>{ranked.length===0&&<div className="empty">No players match these filters.</div>}</div>
    <p className="muted small">Consensus rank averages within-scenario rank percentiles for players eligible in all three scenarios. Scenario tabs show each full eligible ranking independently.</p>
   </>}

   {tab==='Player profile'&&<>{selected?<><div className="profile-hero"><div className="profile-avatar">{initials(selected.player)}</div><div><div className="eyebrow gold">PLAYER DOSSIER · {selected.formats||'IPL / T20I'}</div><h2>{selected.player}</h2><p>Player ID {selected.player_id} · pressure sample across {selected.pressure_matches} matches</p></div><div className="profile-score"><strong>{fmt(selected.score)}</strong><span>MODEL SCORE</span></div></div><div className="stats-grid">{(selected.pressure_balls!==undefined?[[selected.pressure_balls,'Pressure balls'],[selected.pressure_runs,'Pressure runs'],[fmt(selected.pressure_sr),'Pressure SR'],[selected.pressure_matches,'Matches']]:[[selected.pressure_legal_balls,'Legal balls'],[selected.pressure_runs_conceded,'Runs conceded'],[selected.pressure_wickets,'Wickets'],[fmt(selected.pressure_economy,2),'Pressure economy']]).map(([v,l])=><Stat key={l} label={l.toUpperCase()} value={v} note="Observed in pressure situations"/>)}</div><Panel title="Scenario robustness" sub="Rank across strict, base and broad pressure definitions."><div className="scenario-bars">{['Strict','Base','Broad'].map(s=>{let v=selected[s+'_rank'];return <div className="scenario-row" key={s}><span>{s}</span><div className="bar-bg"><div className="bar-fill" style={{width:`${Math.max(5,100-(v||100)*3)}%`}}/></div><b>#{v??'—'}</b></div>})}</div><p className="muted small">Lower rank is better. A missing rank means the player did not meet eligibility in that scenario.</p></Panel><button className="secondary" onClick={()=>setTab('Rankings')}>Back to rankings</button></>:<div className="empty">Choose a player from Rankings to view their dossier.</div>}</>}

   {tab==='Clutch analytics'&&<>
    <div className="section-head"><div><div className="eyebrow">PRESSURE METRIC DISTRIBUTIONS</div><h3>Batting and bowling performance</h3></div></div>
    <div className="chart-grid"><Panel title="Consensus batters · pressure strike rate" sub="Top-ranked batters, pressure strike rate.">{chart('top_batters_pressure_sr.png','Pressure strike rate for consensus top 10 batters')}</Panel><Panel title="Consensus bowlers · pressure economy" sub="Lower economy is better.">{chart('top_bowlers_pressure_economy.png','Pressure economy for consensus top 10 bowlers')}</Panel></div>
    <div className="toolbar"><div className="switch"><button className={metricKind==='Batters'?'selected':''} onClick={()=>setMetricKind('Batters')}>Batting metrics</button><button className={metricKind==='Bowlers'?'selected':''} onClick={()=>setMetricKind('Bowlers')}>Bowling metrics</button></div><select value={metricScenario} onChange={e=>setMetricScenario(e.target.value)}>{['Strict','Base','Broad'].map(x=><option key={x}>{x}</option>)}</select></div>
    <Panel title={`${metricScenario} scenario · complete player-format metric table`} sub="Includes eligible and ineligible player-format rows. Filter the table to inspect any player.">
      <Table columns={metricColumns.map(([key,label])=>({key,label,render:(v)=>typeof v==='number'?fmt(v,2):String(v??'—')}))} rows={metricData} limit={40}/>
    </Panel>
   </>}

   {tab==='Format analysis'&&<>
    <div className="sim-intro"><div className="eyebrow gold">IPL VS T20I</div><h2>Format-wise performance</h2><p>Eligible player-format rows in the Base pressure scenario. These are unweighted averages across player-format records, not adjusted for role or competition strength.</p></div>
    <div className="chart-grid"><Panel title="Batting · average pressure strike rate" sub="Eligible batter-format rows.">{chart('format_batting.png','Average pressure strike rate IPL versus T20I')}</Panel><Panel title="Bowling · average pressure economy" sub="Eligible bowler-format rows.">{chart('format_bowling.png','Average pressure economy IPL versus T20I')}</Panel></div>
    <Panel title="Batting format summary"><Table columns={Object.keys(DATA.formatSummary.batting[0]||{}).map(k=>({key:k,label:k.replaceAll('_',' '),render:v=>typeof v==='number'?fmt(v,2):v}))} rows={DATA.formatSummary.batting}/></Panel>
    <Panel title="Bowling format summary"><Table columns={Object.keys(DATA.formatSummary.bowling[0]||{}).map(k=>({key:k,label:k.replaceAll('_',' '),render:v=>typeof v==='number'?fmt(v,2):v}))} rows={DATA.formatSummary.bowling}/></Panel>
   </>}

   {tab==='Player comparison'&&<>
    <div className="toolbar"><select value={compareA} onChange={e=>setCompareA(e.target.value)}>{players.map((p,i)=><option key={`${p.player_id}-${p.formats??''}-${p.player}-${i}`}>{p.player}</option>)}</select><span className="vs">VS</span><select value={compareB} onChange={e=>setCompareB(e.target.value)}>{players.map((p,i)=><option key={`${p.player_id}-${p.formats??''}-${p.player}-${i}`}>{p.player}</option>)}</select><div className="switch"><button className={batting?'selected':''} onClick={()=>{setKind('Batters');setCompareA('Shashank Singh');setCompareB('Rinku Singh')}}>Batters</button><button className={!batting?'selected':''} onClick={()=>{setKind('Bowlers');setCompareA('Mohammad Nawaz');setCompareB('Jasprit Bumrah')}}>Bowlers</button></div></div>
    <div className="compare-grid">{[playerA,playerB].map((p,i)=><div className="panel compare-card" key={`${p?.player_id??'player'}-${p?.formats??''}-${i}`}><div className="profile-avatar">{initials(p?.player)}</div><h2>{p?.player}</h2><div className="big-score">{fmt(p?.score)}</div><span className="muted">MODEL SCORE</span><div className="compare-metrics">{(batting?[[p?.pressure_sr,'Pressure SR'],[p?.pressure_balls,'Pressure balls'],[p?.pressure_runs,'Runs'],[p?.pressure_matches,'Matches'],[p?.consensus_pct?`${(p.consensus_pct*100).toFixed(1)}%`:null,'Consensus percentile']]:[[p?.pressure_economy,'Pressure economy'],[p?.pressure_legal_balls,'Legal balls'],[p?.pressure_wickets,'Wickets'],[p?.wickets_per6&&fmt(p.wickets_per6,2),'Wickets / 6'],[p?.consensus_pct?`${(p.consensus_pct*100).toFixed(1)}%`:null,'Consensus percentile']]).map(([v,l])=><div key={l}><span>{l}</span><b>{v??'—'}</b></div>)}</div></div>)}</div>
   </>}

   {tab==='Pressure simulator'&&<>
    <div className="sim-intro"><div className="eyebrow gold">INTERACTIVE MATCH STATE</div><h2>Pressure situation lab</h2><p>Adjust the match state to see an illustrative pressure-severity indicator. This is a teaching aid, not a calibrated win-probability model and not the pressure classifier used to build the rankings.</p></div>
    <div className="sim-grid"><div className="panel controls"><Slider label="Required run rate" value={rrr} min={3} max={20} step={0.5} suffix=" runs/over" set={setRrr}/><Slider label="Wickets lost" value={wkts} min={0} max={10} step={1} suffix=" / 10" set={setWkts}/><Slider label="Overs remaining" value={overs} min={0.1} max={20} step={0.1} suffix=" overs" set={setOvers}/><label className="field-label">Match phase</label><select value={phase} onChange={e=>setPhase(e.target.value)}><option>Powerplay</option><option>Middle</option><option>Death</option></select></div><div className="panel gauge-panel"><div className="gauge" style={{'--p':pressureScore*3.6+'deg'}}><div><strong>{pressureScore}</strong><span>/ 100</span></div></div><div className="eyebrow gold">ILLUSTRATIVE SEVERITY</div><h3>{severity}</h3><p className="muted">RRR {rrr} · {wkts} wickets down · {overs} overs left · {phase} phase</p><div className="notice"><span>Severity is calculated from the displayed inputs using a simple weighted rule. It is not the pressure definition used to generate the player rankings.</span></div></div></div>
   </>}

   {tab==='Delivery explorer'&&<>
    <div className="sim-intro"><div className="eyebrow gold">BALL-BY-BALL EVIDENCE</div><h2>Delivery-level pressure explorer</h2><p>Each row records the match state immediately before the delivery, legal-ball state, required run rate and the three scenario flags. The sample below is drawn from Base-pressure deliveries; download the compressed full fact table for all 193,988 deliveries.</p></div>
    <div className="stats-grid"><Stat label="STRICT FLAGGED" value={fmt(DATA.scenarioSummary[0].pressure_deliveries,0)} note={`${DATA.scenarioSummary[0].pressure_share_pct}% of scoped deliveries`}/><Stat label="BASE FLAGGED" value={fmt(DATA.scenarioSummary[1].pressure_deliveries,0)} note={`${DATA.scenarioSummary[1].pressure_share_pct}% of scoped deliveries`}/><Stat label="BROAD FLAGGED" value={fmt(DATA.scenarioSummary[2].pressure_deliveries,0)} note={`${DATA.scenarioSummary[2].pressure_share_pct}% of scoped deliveries`}/><Stat label="BASE DELIVERY SAMPLE" value={fmt(DATA.pressureDeliverySampleCount,0)} note="Full export available below"/></div>
    <Panel title="Base pressure delivery sample" sub="First 100 rows of the Base pressure delivery fact table." extra={<a className="download-link" href="/data/base_pressure_deliveries.csv.gz" download>Download full Base pressure fact (.csv.gz)</a>}><Table columns={deliveryCols} rows={DATA.pressureDeliverySample} limit={100}/></Panel>
    <div className="notice warning"><b>State convention</b><span>Runs required, wickets lost and legal balls elapsed are measured before the current delivery. Wides and no-balls are retained as deliveries but excluded from the legal-ball denominator under the documented extras interpretation.</span></div>
   </>}

   {tab==='Data explorer'&&<>
    <div className="sim-intro"><div className="eyebrow gold">ORIGINAL DATA PACK</div><h2>Explore all six source CSVs</h2><p>Inspect the original supplied data tables, their schemas, row counts, missingness and sample records. Download any complete CSV from its own table view.</p></div>
    <div className="toolbar"><select value={sourceKey} onChange={e=>setSourceKey(e.target.value)}>{Object.keys(DATA.sourceTables).map(k=><option value={k} key={k}>{sourceNames[k]}</option>)}</select><a className="download-link" href={`/data/${sourceKey}.csv`} download>Download complete {sourceNames[sourceKey]} CSV</a></div>
    <div className="stats-grid"><Stat label="SOURCE ROWS" value={fmt(sourceMeta?.rows,0)} note={sourceNames[sourceKey]}/><Stat label="COLUMNS" value={fmt(sourceMeta?.columns,0)} note="Original fields retained"/><Stat label="MISSING CELLS" value={fmt(sourceMeta?.missing_cells,0)} note={`${sourceMeta?.missing_pct}% of table cells`}/><Stat label="DUPLICATE ROWS" value={fmt(sourceMeta?.duplicate_rows,0)} note="Exact duplicate rows"/></div>
    <Panel title={`${sourceNames[sourceKey]} · source chart`} sub="Seaborn summary chart generated from the selected original CSV.">{chart(sourceCharts[sourceKey],`${sourceNames[sourceKey]} source chart`)}</Panel>
    <Panel title={`${sourceNames[sourceKey]} · schema`}><div className="field-chips">{source.columns.map(c=><span key={c}>{c}</span>)}</div></Panel>
    <Panel title={`${sourceNames[sourceKey]} · sample rows`} sub="Filter visible rows. The full source table is available through the CSV download."><Table columns={sourceCols} rows={source.records} limit={20}/></Panel>
   </>}

   {tab==='Data quality'&&<>
    <div className="sim-intro"><div className="eyebrow gold">REPRODUCIBILITY AND AUDIT</div><h2>Data quality & validation</h2><p>Audit counts are calculated from the original six source tables. Match scope is based on match date from 1 January 2022, with IPL and T20I formats only.</p></div>
    <div className="stats-grid"><Stat label="MATCHES IN SCOPE" value={fmt(DATA.quality.match_records_in_scope,0)} note="371 IPL · 482 T20I"/><Stat label="MATCHES WITH BALL DATA" value={fmt(DATA.quality.matches_with_ball_data,0)} note={`${DATA.quality.matches_without_ball_data} without ball-by-ball data`}/><Stat label="DUPLICATE DELIVERY KEYS" value={fmt(DATA.quality.duplicate_delivery_keys,0)} note="match + innings + over + ball"/><Stat label="MISSING BATTER / BOWLER IDs" value={`${DATA.quality.missing_striker_ids} / ${DATA.quality.missing_bowler_ids}`} note="In-scope regulation innings"/></div>
    <div className="chart-grid"><Panel title="Source missingness" sub="Missing cells as a percentage of each source table.">{chart('source_missingness.png','Source table missingness chart')}</Panel><Panel title="Matches by year and format">{chart('matches_by_year_format.png','Match counts by year and format')}</Panel></div>
    <Panel title="Six-table validation summary"><Table columns={[{key:'key',label:'Source table',render:v=>sourceNames[v]||v},{key:'rows',label:'Rows'},{key:'columns',label:'Columns'},{key:'missing_cells',label:'Missing cells'},{key:'missing_pct',label:'Missing %'},{key:'duplicate_rows',label:'Duplicate rows'}]} rows={DATA.sourceMeta}/></Panel>
    <Panel title="Extras categories in scoped delivery data"><Table columns={[{key:'category',label:'Extras category'},{key:'count',label:'Rows'}]} rows={Object.entries(DATA.quality.extras_categories).map(([category,count])=>({category:category||'(none)',count}))}/></Panel>
    <div className="notice warning"><b>Known limitation</b><span>There is no data dictionary for extras_type = “other”. In the current model it is treated as an illegal delivery because the 259 in-scope rows have a one-run extra pattern. This is an explicit assumption, not a verified source definition. Sixteen in-scope matches have no ball-by-ball rows.</span></div>
   </>}

   {tab==='Methodology'&&<>
    <div className="sim-intro"><div className="eyebrow gold">TRANSPARENT MODEL SPECIFICATION</div><h2>Methodology and formulas</h2><p>Pressure is a modelled match state, not a directly observed label. Three definitions are run separately to test whether rankings remain stable when the pressure threshold changes.</p></div>
    <div className="method-grid">
     <Method title="01 · Data scope">IPL and T20I matches dated from 1 January 2022 onward. Regulation innings 1 and 2 are included; super overs (innings 3+) are excluded. 853 match records are in scope; 837 have ball-by-ball data.</Method>
     <Method title="02 · State before delivery">Chase required run rate = (runs required ÷ legal balls remaining) × 6. Use revised target when supplied; otherwise first-innings total + 1. Wickets lost and legal balls elapsed are measured before each delivery.</Method>
     <Method title="03 · First-innings pressure">Strict: final 12 legal balls with 5+ wickets lost, or final 6 regardless. Base: final 24 with 4+ wickets lost, or final 12 regardless. Broad: final 30 with 3+ wickets lost, or final 18 regardless. If all out early, count back from actual final legal ball; otherwise use scheduled/revised innings limit.</Method>
     <Method title="04 · Chase pressure">Strict: RRR ≥12 after 6 legal balls; or RRR ≥10 with 5+ wickets lost; or ≤18 balls remaining and RRR ≥9; or 8+ wickets lost and RRR ≥8. Base: 10.5/6; or 9/4 wickets; or ≤30 balls and RRR ≥8; or 7 wickets and RRR ≥7. Broad: 9/6; or 8/3 wickets; or ≤36 balls and RRR ≥7; or 6 wickets and RRR ≥6.5.</Method>
     <Method title="05 · Batter rating weights">Pressure strike rate 25%; smoothed pressure runs per dismissal 15%; boundary rate 10%; pressure-vs-normal strike-rate retention 20%; lower dot-ball rate 10%; match-level pressure strike-rate CV 20% (lower is better).</Method>
     <Method title="06 · Bowler rating weights">Pressure economy 25% (lower is better); credited wickets per six legal balls 20%; dot-ball rate 15%; normal-minus-pressure economy 15%; pressure-minus-normal wicket-rate 10%; match-level pressure-economy CV 15% (lower is better).</Method>
     <Method title="07 · Eligibility and peer groups">Per player-format: at least 60 pressure balls, 5 pressure innings, 3 pressure matches and 100 normal balls. Compare within format and dominant batting role or bowling phase; if fewer than 8 eligible peers, fall back to format-wide peers.</Method>
     <Method title="08 · Reliability and consensus">Reliability shrinkage uses pressure-ball and pressure-match sample sizes to pull extreme scores toward the peer midpoint. Cross-format scores are pressure-ball weighted. Consensus averages normalized rank percentiles across Strict, Base and Broad for players eligible in all three.</Method>
    </div>
    <Panel title="Scenario sensitivity"><Table columns={Object.keys(DATA.scenarioSummary[0]||{}).map(k=>({key:k,label:k.replaceAll('_',' '),render:v=>typeof v==='number'?fmt(v,2):v}))} rows={DATA.scenarioSummary}/></Panel>
    <div className="notice warning"><b>Limitations</b><span>Pressure thresholds and weights are analyst choices. First-innings closing-phase pressure is a proxy, not a complete match-context model. Venue, pitch, opponent strength, match importance and tactical context are not fully controlled. The extras_type “other” interpretation needs source-owner confirmation. Rankings are provisional until these assumptions are independently reviewed.</span></div>
   </>}

   {tab==='Downloads'&&<>
    <div className="sim-intro"><div className="eyebrow gold">SUBMISSION FILES</div><h2>Analysis download centre</h2><p>Download the full dashboard project, methodology report, analysis workbook, original six source tables and pressure-delivery fact exports.</p></div>
    <div className="download-grid">
     <DownloadCard title="Complete analysis workbook" desc="Rankings, all three scenario tables, format-level batting and bowling metrics, data quality and six source tables." href="/reports/SupeRR_Complete_Analysis.xlsx" label="Download Excel workbook"/>
     <DownloadCard title="Methodology report" desc="Scope, data cleaning, validation, pressure definitions, rating formulas, sensitivity results, rankings and limitations." href="/reports/SupeRR_Complete_Methodology_Report.pdf" label="Download PDF report"/>
     <DownloadCard title="Methodology document" desc="Editable DOCX version of the full analysis report." href="/reports/SupeRR_Complete_Methodology_Report.docx" label="Download DOCX report"/>
     <DownloadCard title="Original source data pack" desc="All six original CSV files, preserved for reproducibility." href="/data/SupeRR_Original_Six_CSVs.zip" label="Download six source CSVs"/>
     <DownloadCard title="All delivery pressure flags" desc="Every in-scope regulation delivery with Strict, Base and Broad flags." href="/data/delivery_pressure_all_scenarios.csv.gz" label="Download all pressure flags"/>
     <DownloadCard title="Base pressure deliveries" desc="Full delivery-level fact table for the Base pressure definition." href="/data/base_pressure_deliveries.csv.gz" label="Download Base pressure fact"/>
     <DownloadCard title="Top 10 batter rankings" desc="Consensus top-10 batter list." href="/data/final_consensus_batter_rankings.csv" label="Download batter CSV"/>
     <DownloadCard title="Top 10 bowler rankings" desc="Consensus top-10 bowler list." href="/data/final_consensus_bowler_rankings.csv" label="Download bowler CSV"/>
    </div>
   </>}
   <footer>CLUTCHBOARD <span>Based on the supplied SupeRR Selector data pack · Provisional model</span></footer>
  </main>
 </div>
}
function Method({title,children}){return <div className="panel method-card"><div className="eyebrow gold">{title}</div><p>{children}</p></div>}
function DownloadCard({title,desc,href,label}){return <div className="panel download-card"><div className="eyebrow gold">FILE</div><h3>{title}</h3><p>{desc}</p><a className="download-link" href={href} download>{label} →</a></div>}
function Leaderboard({title,data,type,onOpen}){return <div className="panel leaderboard"><div className="panel-head"><h3>{title}</h3><span>{type}</span></div>{data.map((p,i)=><button key={`${p.player_id}-${p.formats??''}-${i}`} className="leader-row" onClick={()=>onOpen(p)}><b className="leader-rank">{String(i+1).padStart(2,'0')}</b><div className="mini-avatar">{initials(p.player)}</div><div className="leader-name"><b>{p.player}</b><small>{type==='Batters'?`${fmt(p.pressure_balls,0)} balls · ${fmt(p.pressure_sr)} SR`:`${fmt(p.pressure_legal_balls,0)} balls · ${fmt(p.pressure_economy,2)} econ`}</small></div><strong>{fmt(p.score)}</strong></button>)}</div>}
function Slider({label,value,min,max,step,suffix,set}){return <div className="slider-field"><div><label>{label}</label><b>{value}{suffix}</b></div><input type="range" min={min} max={max} step={step} value={value} onChange={e=>set(Number(e.target.value))}/></div>}
export default App;

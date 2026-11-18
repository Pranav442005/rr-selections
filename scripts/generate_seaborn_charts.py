#!/usr/bin/env python3
"""Regenerate all dashboard charts with seaborn."""
from pathlib import Path
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
import shutil
ROOT=Path(__file__).resolve().parents[1]
D=ROOT/'public'/'data'; A=ROOT/'analysis'; P=ROOT/'public'/'charts'
P.mkdir(parents=True,exist_ok=True)
sns.set_theme(style='whitegrid',context='notebook')
plt.rcParams.update({'figure.facecolor':'#ffffff','axes.facecolor':'#ffffff','savefig.facecolor':'#ffffff',
'text.color':'#2a1f2d','axes.labelcolor':'#6b5a68','xtick.color':'#6b5a68','ytick.color':'#6b5a68',
'axes.titlecolor':'#c21e72','axes.titleweight':'bold','axes.titlesize':13,'grid.color':'#fbe3ef','grid.linewidth':0.8,
'axes.edgecolor':'#f6d3e5','axes.spines.top':False,'axes.spines.right':False,'font.family':'DejaVu Sans'})
# Pink-only palette: strong pink, soft pink, deep rose
PINK='#e8318a'; BLUE='#f7a8cf'; GOLD='#a3185f'; WHITE='#2a1f2d'
PINKS=['#e8318a','#f06fae','#f7a8cf','#c21e72','#fbc9df','#a3185f','#f48fb8','#d9468f']
def save(n): plt.tight_layout();plt.savefig(P/n,dpi=170,bbox_inches='tight');plt.close()

# Source-table record volume and missingness
source_files=['competitions','matches','ball_by_ball','teams','playing_eleven','competition_team_player_mapping']
meta=[]
for n in source_files:
    df=pd.read_csv(D/f'{n}.csv',low_memory=False)
    meta.append({'key':n,'rows':len(df),'missing_pct':df.isna().sum().sum()/max(1,df.size)*100})
m=pd.DataFrame(meta).sort_values('rows',ascending=False)
plt.figure(figsize=(10,4.6));sns.barplot(data=m,x='rows',y='key',hue='key',palette={k:c for k,c in zip(m.key,[PINK,BLUE,GOLD,'#c21e72','#f06fae','#fbc9df'])},legend=False)
plt.title('Six supplied source tables · record volume',loc='left',fontweight='bold');plt.xlabel('Rows (log scale)');plt.ylabel('');plt.xscale('log');save('source_table_volume.png')
m2=m.sort_values('missing_pct',ascending=False)
plt.figure(figsize=(9,4.3));sns.barplot(data=m2,x='missing_pct',y='key',hue='key',palette={k:c for k,c in zip(m2.key,[GOLD,BLUE,PINK,'#c21e72','#f06fae','#fbc9df'])},legend=False)
plt.title('Source table missingness',loc='left',fontweight='bold');plt.xlabel('Missing cells (%)');plt.ylabel('');save('source_missingness.png')

# Match counts by date-year and format
comp=pd.read_csv(D/'competitions.csv')
matches=pd.read_csv(D/'matches.csv').merge(comp[['comp_id','comp_name','match_format']],on='comp_id',how='left')
matches['date']=pd.to_datetime(matches.match_date,errors='coerce')
ipl=matches.comp_name.astype(str).str.upper().str.startswith('IPL')
t20i=matches.match_format.astype(str).str.upper().eq('T20I')
matches=matches[(ipl|t20i)&(matches.date>=pd.Timestamp('2022-01-01'))].copy()
matches['format']=matches.match_format.where(matches.match_format.eq('T20I'),'IPL')
matches['season']=matches.date.dt.year
md=matches.groupby(['season','format']).size().reset_index(name='matches')
plt.figure(figsize=(9,4.5));sns.barplot(data=md,x='season',y='matches',hue='format',palette={'IPL':BLUE,'T20I':PINK})
plt.title('Matches in scope by year and format',loc='left',fontweight='bold');plt.xlabel('Year');plt.ylabel('Matches');plt.legend(title='');save('matches_by_year_format.png');shutil.copy2(P/'matches_by_year_format.png',P/'source_matches.png')

# Pressure scenario volume
sc=pd.read_csv(A/'scenario_summary.csv')
plt.figure(figsize=(8,4.3));ax=sns.barplot(data=sc,x='scenario',y='pressure_deliveries',hue='scenario',palette={'Strict':BLUE,'Base':PINK,'Broad':GOLD},legend=False)
plt.title('Pressure deliveries under three definitions',loc='left',fontweight='bold');plt.xlabel('Pressure scenario');plt.ylabel('Deliveries')
for i,r in sc.iterrows():plt.text(i,r.pressure_deliveries+700,f"{r.pressure_share_pct:.1f}%",ha='center',color=WHITE,fontweight='bold')
save('pressure_scenarios.png')

# Consensus player charts
bat=pd.read_csv(A/'final_consensus_batter_rankings.csv').head(10).sort_values('pressure_sr')
plt.figure(figsize=(9,5.2));ax=sns.barplot(data=bat,x='pressure_sr',y='player',hue='player',palette={p:(PINK if i>=7 else BLUE) for i,p in enumerate(bat.player)},legend=False)
plt.title('Consensus top 10 batters · pressure strike rate',loc='left',fontweight='bold');plt.xlabel('Pressure strike rate');plt.ylabel('')
for c in ax.containers:ax.bar_label(c,fmt='%.1f',padding=3,color=WHITE,fontsize=8)
save('top_batters_pressure_sr.png')
bowl=pd.read_csv(A/'final_consensus_bowler_rankings.csv').head(10).sort_values('pressure_economy',ascending=False)
plt.figure(figsize=(9,5.2));ax=sns.barplot(data=bowl,x='pressure_economy',y='player',hue='player',palette={p:(PINK if i>=7 else BLUE) for i,p in enumerate(bowl.player)},legend=False)
plt.title('Consensus top 10 bowlers · pressure economy',loc='left',fontweight='bold');plt.xlabel('Pressure economy (lower is better)');plt.ylabel('')
for c in ax.containers:ax.bar_label(c,fmt='%.2f',padding=3,color=WHITE,fontsize=8)
save('top_bowlers_pressure_economy.png')

# Format-level summaries from eligible Base metric rows
b=pd.read_csv(A/'Base_batter_format_metrics.csv');b=b[b.eligible]
b=b.groupby('format').agg(avg_pressure_sr=('pressure_sr','mean')).reset_index()
plt.figure(figsize=(8,4.3));sns.barplot(data=b,x='format',y='avg_pressure_sr',hue='format',palette={'IPL':BLUE,'T20I':PINK},legend=False)
plt.title('Format comparison · average pressure strike rate',loc='left',fontweight='bold');plt.xlabel('Format');plt.ylabel('Average pressure SR');save('format_batting.png')
w=pd.read_csv(A/'Base_bowler_format_metrics.csv');w=w[w.eligible]
w=w.groupby('format').agg(avg_pressure_economy=('pressure_economy','mean')).reset_index()
plt.figure(figsize=(8,4.3));sns.barplot(data=w,x='format',y='avg_pressure_economy',hue='format',palette={'IPL':BLUE,'T20I':PINK},legend=False)
plt.title('Format comparison · average pressure economy',loc='left',fontweight='bold');plt.xlabel('Format');plt.ylabel('Average pressure economy');save('format_bowling.png')

# One source-specific chart for each original CSV table.
comp=pd.read_csv(D/'competitions.csv')
plt.figure(figsize=(8,4.2))
sns.countplot(data=comp,x='match_format',hue='match_format',palette={'T20I':PINK,'T20':BLUE},legend=False)
plt.title('Competitions by match format',loc='left',fontweight='bold');plt.xlabel('Match format');plt.ylabel('Competition records');save('source_competitions.png')

plt.figure(figsize=(9,4.5))
rawball=pd.read_csv(D/'ball_by_ball.csv',low_memory=False)
ex=rawball.extras_type.fillna('(none)').astype(str).value_counts().head(8).rename_axis('extras_type').reset_index(name='deliveries')
sns.barplot(data=ex,x='deliveries',y='extras_type',hue='extras_type',palette=[PINK,BLUE,GOLD,'#c21e72','#f06fae','#fbc9df','#d9468f','#f48fb8'][:len(ex)],legend=False)
plt.title('Ball-by-ball rows · extras type distribution',loc='left',fontweight='bold');plt.xlabel('Rows');plt.ylabel('Extras type');save('source_ball_by_ball.png')

teams=pd.read_csv(D/'teams.csv')
topteams=teams.groupby('comp_id').team_id.nunique().sort_values(ascending=False).head(12).rename('teams').reset_index()
plt.figure(figsize=(8,4.5))
sns.barplot(data=topteams,x='teams',y='comp_id',hue='comp_id',palette=[BLUE,PINK,GOLD,'#c21e72','#f06fae','#fbc9df','#d9468f','#f48fb8','#a3185f','#f7a8cf','#e8318a','#c21e72'],legend=False)
plt.title('Teams listed per competition · top 12',loc='left',fontweight='bold');plt.xlabel('Distinct teams');plt.ylabel('Competition ID');save('source_teams.png')

playing=pd.read_csv(D/'playing_eleven.csv')
flag_counts=pd.DataFrame({'flag':['Played','Captain','Wicketkeeper','Impact player','Impact off'],'count':[playing.is_played.fillna(False).astype(bool).sum(),playing.is_captain.fillna(False).astype(bool).sum(),playing.is_wk.fillna(False).astype(bool).sum(),playing.is_impact.fillna(False).astype(bool).sum(),playing.is_impact_off.fillna(False).astype(bool).sum()]})
plt.figure(figsize=(8,4.5))
sns.barplot(data=flag_counts,x='count',y='flag',hue='flag',palette=[BLUE,PINK,GOLD,'#c21e72','#f06fae'],legend=False)
plt.title('Playing XI table · player-role flags',loc='left',fontweight='bold');plt.xlabel('Flagged rows');plt.ylabel('');save('source_playing_eleven.png')

mapping=pd.read_csv(D/'competition_team_player_mapping.csv')
mptop=mapping.groupby('comp_id').player_id.nunique().sort_values(ascending=False).head(12).rename('players').reset_index()
plt.figure(figsize=(8,4.5))
sns.barplot(data=mptop,x='players',y='comp_id',hue='comp_id',palette=[BLUE,PINK,GOLD,'#c21e72','#f06fae','#fbc9df','#d9468f','#f48fb8','#a3185f','#f7a8cf','#e8318a','#c21e72'],legend=False)
plt.title('Competition-player mapping · players per competition',loc='left',fontweight='bold');plt.xlabel('Distinct mapped players');plt.ylabel('Competition ID');save('source_player_mapping.png')

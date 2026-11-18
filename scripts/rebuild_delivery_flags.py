#!/usr/bin/env python3
"""Rebuild delivery-level pressure flags from the six original source CSVs."""
from pathlib import Path
import pandas as pd
import numpy as np

ROOT=Path(__file__).resolve().parents[1]
DATA=ROOT/'public'/'data'
COMP=pd.read_csv(DATA/'competitions.csv')
MATCH=pd.read_csv(DATA/'matches.csv')
BALL=pd.read_csv(DATA/'ball_by_ball.csv',low_memory=False)

# Match-date scope avoids excluding cross-year competitions whose season label
# does not equal the calendar year of their match dates.
MATCH=MATCH.merge(COMP[['comp_id','comp_name','match_format']],on='comp_id',how='left')
MATCH['match_date']=pd.to_datetime(MATCH.match_date,errors='coerce')
is_ipl=MATCH.comp_name.astype(str).str.upper().str.startswith('IPL')
is_t20i=MATCH.match_format.astype(str).str.upper().eq('T20I')
MATCH=MATCH[(is_ipl|is_t20i)&(MATCH.match_date>=pd.Timestamp('2022-01-01'))].copy()
MATCH['format']=np.where(is_t20i.loc[MATCH.index],'T20I','IPL')
MATCH['season']=MATCH.match_date.dt.year

D=BALL[BALL.match_id.isin(MATCH.match_id)&BALL.innings.isin([1,2])].copy()
D=D.merge(MATCH[['match_id','format','season','first_inn_revised_overs','second_inn_revised_overs','revised_target']],on='match_id',how='inner')
D['extras_norm']=D.extras_type.fillna('').astype(str).str.strip().str.lower()
# Explicit interpretation: wide, Overstep and other are illegal.
D['legal']=~D.extras_norm.isin({'wide','overstep','other'})
for c in ['runs','extras1_runs','extras_2_runs']:
    D[c]=pd.to_numeric(D[c],errors='coerce').fillna(0)
D['team_runs']=D.runs+D.extras1_runs+D.extras_2_runs
D['wicket']=D.is_wicket.fillna(False).astype(bool)
D=D.sort_values(['match_id','innings','overid','over_ball_num'],kind='mergesort').reset_index(drop=True)
G=['match_id','innings']
D['legal_elapsed']=D.groupby(G).legal.cumsum()-D.legal.astype(int)
D['wickets_before']=D.groupby(G).wicket.cumsum()-D.wicket.astype(int)
D['score_before']=D.groupby(G).team_runs.cumsum()-D.team_runs
D['legal_total']=D.groupby(G).legal.transform('sum')
D['wickets_total']=D.groupby(G).wicket.transform('sum')
first_total=D[D.innings.eq(1)].groupby('match_id').team_runs.sum()
D['first_innings_total']=D.match_id.map(first_total)
D['target_calc']=pd.to_numeric(D.revised_target,errors='coerce')
D.loc[D.target_calc.isna(),'target_calc']=D.loc[D.target_calc.isna(),'first_innings_total']+1
D['limit_balls']=np.where(
    D.innings.eq(1),
    pd.to_numeric(D.first_inn_revised_overs,errors='coerce').fillna(120),
    pd.to_numeric(D.second_inn_revised_overs,errors='coerce').fillna(120)
).astype(int)
D['balls_remaining']=(D.limit_balls-D.legal_elapsed).clip(lower=0)
D['rrr']=np.where(D.innings.eq(2)&D.balls_remaining.gt(0),
                  (D.target_calc-D.score_before)/D.balls_remaining*6,np.nan)
D['all_out_early']=D.innings.eq(1)&D.wickets_total.ge(10)&D.legal_total.lt(D.limit_balls)
D['first_end_balls']=np.where(D.all_out_early,D.legal_total,D.limit_balls)
D['first_balls_to_end']=(D.first_end_balls-D.legal_elapsed).clip(lower=0)

def flags(df,scenario):
    if scenario=='Strict':
        chase=((df.rrr>=12)&(df.legal_elapsed>=6))|((df.rrr>=10)&(df.wickets_before>=5))|((df.balls_remaining<=18)&(df.rrr>=9))|((df.wickets_before>=8)&(df.rrr>=8))
        first=((df.first_balls_to_end<=12)&(df.wickets_before>=5))|(df.first_balls_to_end<=6)
    elif scenario=='Base':
        chase=((df.rrr>=10.5)&(df.legal_elapsed>=6))|((df.rrr>=9)&(df.wickets_before>=4))|((df.balls_remaining<=30)&(df.rrr>=8))|((df.wickets_before>=7)&(df.rrr>=7))
        first=((df.first_balls_to_end<=24)&(df.wickets_before>=4))|(df.first_balls_to_end<=12)
    else:
        chase=((df.rrr>=9)&(df.legal_elapsed>=6))|((df.rrr>=8)&(df.wickets_before>=3))|((df.balls_remaining<=36)&(df.rrr>=7))|((df.wickets_before>=6)&(df.rrr>=6.5))
        first=((df.first_balls_to_end<=30)&(df.wickets_before>=3))|(df.first_balls_to_end<=18)
    return np.where(df.innings.eq(2),chase,first)

for scenario in ['Strict','Base','Broad']:
    D['pressure_'+scenario.lower()]=flags(D,scenario).astype(bool)
D['pressure_any']=D[['pressure_strict','pressure_base','pressure_broad']].any(axis=1)
D.to_csv(DATA/'delivery_pressure_all_scenarios.csv.gz',index=False,compression='gzip')
D[D.pressure_base].to_csv(DATA/'base_pressure_deliveries.csv.gz',index=False,compression='gzip')
print('Rows:',len(D),'Strict:',int(D.pressure_strict.sum()),'Base:',int(D.pressure_base.sum()),'Broad:',int(D.pressure_broad.sum()))

# Analysis outputs

These CSVs are the corrected v4 ranking and metric outputs used by the dashboard.
They are separated by pressure scenario (Strict, Base, Broad), role (batter/bowler),
and format-level metric tables. `final_consensus_*` contains the consensus lists.
The dashboard's delivery-level pressure flags are independently rebuilt from the
original ball-by-ball data by `scripts/rebuild_delivery_flags.py`.

Important: the scoring outputs are the corrected v4 model outputs, not an official
rating. The exact smoothing prior constant used for `runs_per_dismissal_smooth`
is not documented in the exported methodology; this should be confirmed and added
before claiming exact end-to-end reproducibility.

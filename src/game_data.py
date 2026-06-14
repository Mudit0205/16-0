#!/usr/bin/env python3
"""Build the game's player list from the clean unified ratings."""
import json, os
from tags import OVERSEAS, KEEPERS
OUT="/sessions/nice-confident-galileo/mnt/outputs"
R=json.load(open(f"{OUT}/ratings.json"))
M={(x["name"],x["team"],x["season"]):x for x in json.load(open(f"{OUT}/master.json"))["players"]}

def zone(m):
    a,b,c=m["pos12"],m["pos35"],m["pos6"]
    if a==b==c==0:return "FLEX"
    return "TOP" if (a>=b and a>=c) else ("FINISH" if c>b else "FLEX")

def bat_floor(m,grole):
    """Highest batting position the player has CREDIBLY batted historically (1-based).
    They can be slotted at this position or anywhere lower, never higher."""
    z1,z3,z6=m["pos12"],m["pos35"],m["pos6"]; tot=z1+z3+z6
    if grole in ("PACE","SPIN"):                  # specialist bowlers stay lower order...
        if tot>0 and z1>=4 and z1/tot>=0.30: return 4   # ...unless a genuine pinch-hitter opener
        if tot>0 and z3>=5 and z3/tot>=0.30: return 6
        return 8
    if tot>0:                                     # batters / keepers / all-rounders
        if z1>=2 and z1/tot>=0.12: return 1       # has opened / batted top
        if z3>=2 and z3/tot>=0.12: return 3       # has batted 3-5
        if z6>=2 and z6/tot>=0.15: return 6       # has batted 6+
    return 6

mini=[]
for p in R:
    m=M.get((p["name"],p["team"],p["season"]))
    if not m: continue
    role=p["role"]; keeper=p["name"] in KEEPERS
    z=zone(m)
    if role.startswith("AR"): grole,pos="AR",None
    elif role=="Pace": grole,pos="PACE",None
    elif role=="Spin": grole,pos="SPIN",None
    else:  # batter
        grole="WK" if keeper else "BAT"; pos=z
    sr=round(100*m["runs"]/m["bf"],1) if m["bf"] else 0
    econ=round(6*m["conc"]/m["balls"],2) if m["balls"] else 0
    if grole in ("BAT","WK"): line=f"{m['runs']} runs @ SR {sr}"
    elif grole in ("PACE","SPIN"): line=f"{m['wkts']} wkts @ econ {econ}"
    else: line=f"{m['runs']} runs / {m['wkts']} wkts"
    mini.append({"name":p["name"],"team":p["team"],"season":p["season"],"role":grole,"pos":pos,
        "ovs":p["name"] in OVERSEAS,"r":p["rating"],"line":line,"bp":bat_floor(m,grole)})

json.dump(mini,open(f"{OUT}/players_game.json","w"))
import collections
print("game players:",len(mini),"| roles:",dict(collections.Counter(p["role"] for p in mini)))
print("rating range:",min(p["r"] for p in mini),"-",max(p["r"] for p in mini))
# coverage: each squad-season should have all slot roles fillable
sq=collections.defaultdict(lambda:collections.Counter())
for p in mini: sq[(p["team"],p["season"])][p["role"]]+=1
short=[k for k,v in sq.items() if not(v["WK"] and v["AR"] and v["PACE"] and v["SPIN"] and v["BAT"])]
print("squads missing a role:",len(short),"/",len(sq))

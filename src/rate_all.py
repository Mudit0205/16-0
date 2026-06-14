#!/usr/bin/env python3
"""UNIFIED season-rating engine: all 8 roles in one pipeline.
Anchor/Aggressor/Accelerator/Finisher (batting), Pace/Spin (bowling), All-Rounder."""
import json, os, statistics, collections
from tags import SPINNERS
OUT="/sessions/nice-confident-galileo/mnt/outputs"
M=json.load(open(f"{OUT}/master.json")); raw=M["players"]
TP=M["team_pts"]
clamp=lambda v,lo,hi:max(lo,min(hi,v))
# team success is a GENTLE modifier (Rule: never dominate; poor-team players can still be elite)
team_f=lambda r: clamp(TP.get(f"{r['team']}|{r['season']}",4)/10.0, 0.65, 1.0)
SR=lambda r:100*r["runs"]/r["bf"] if r["bf"] else 0
AVG=lambda r:(r["runs"]/r["outs"]) if r["outs"]>0 else r["runs"]
ECON=lambda r:6*r["conc"]/r["balls"] if r["balls"] else 12
BSR=lambda r:(r["balls"]/r["wkts"]) if r["wkts"]>0 else 40
is_spin=lambda r:r["name"] in SPINNERS

# ---- classification thresholds ----
def is_AR(r):  return r["bf"]>=90 and r["balls"]>=150 and r["wkts"]>=3    # genuine workload in BOTH
def can_bat(r):return r["bat_inn"]>=4 and r["bf"]>=60                    # lower bar so squads are fully draftable
def can_bowl(r):return r["balls"]>=48 and r["wkts"]>=1
def zone(r):
    a,b,c=r["pos12"],r["pos35"],r["pos6"]
    if a==b==c==0:return None
    return "OPENER" if (a>=b and a>=c) else ("MID" if b>=c else "FINISH")

BAT={"Anchor":{"run":30,"avg":25,"sr":20,"impact":15,"team":10},
     "Aggressor":{"sr":35,"run":25,"impact":20,"avg":10,"team":10},
     "Accelerator":{"sr":35,"run":20,"impact":20,"avg":15,"team":10},
     "Finisher":{"fimp":35,"sr":25,"run":10,"avg":10,"clutch":10,"team":10}}
BOWL={"Pace":{"wkt":25,"econ":25,"sr":15,"impact":15,"death":10,"team":10},
      "Spin":{"wkt":30,"econ":20,"impact":15,"midctrl":15,"vers":10,"team":10}}

# ---- field norms (era adjustment) ----
bn=collections.defaultdict(lambda:{"sr":[],"avg":[],"maxr":0})
on=collections.defaultdict(lambda:{"econ":[],"bsr":[],"maxw":0,"deco":[],"meco":[]})
for r in raw:
    if r["bat_inn"]>=6 and r["bf"]>=60:           # broader pool for stable field norms
        z=zone(r)
        if z: d=bn[(z,r["season"])]; d["sr"].append(SR(r)); d["avg"].append(AVG(r)); d["maxr"]=max(d["maxr"],r["runs"])
    if can_bowl(r):
        t="Spin" if is_spin(r) else "Pace"; d=on[(t,r["season"])]
        d["econ"].append(ECON(r)); d["maxw"]=max(d["maxw"],r["wkts"])
        if r["wkts"]>0: d["bsr"].append(BSR(r))
        if r["dth_b"]>=12: d["deco"].append(6*r["dth_r"]/r["dth_b"])
        if r["mid_b"]>=24: d["meco"].append(6*r["mid_r"]/r["mid_b"])
mn=lambda x,v:statistics.mean(x) if x else v
BN={k:{"sr":mn(v["sr"],130),"avg":mn(v["avg"],28),"maxr":v["maxr"] or 1} for k,v in bn.items()}
ON={k:{"econ":mn(v["econ"],8),"bsr":mn(v["bsr"],20),"maxw":v["maxw"] or 1,"deco":mn(v["deco"],9.5),"meco":mn(v["meco"],7.5)} for k,v in on.items()}

# ---- factor functions ----
f_sr  =lambda r,n:clamp(0.78+(SR(r)/n["sr"]-1)*0.95,0.40,1.0)
f_avg =lambda r,n:clamp(0.74+(AVG(r)/n["avg"]-1)*0.70,0.40,1.0)
f_run =lambda r,n:clamp((r["runs"]/n["maxr"])/0.92,0,1)
f_imp =lambda r:clamp(0.45+0.13*r["potm"]+0.05*r["s50"]+0.11*r["s100"]+0.10*min(1,r["runs_win"]/300),0.30,1.0)
def f_fimp(r): return clamp(0.40+0.30*min(1,r["bat_death_r"]/260)+0.20*min(1,r["runs_win"]/260)+0.10*min(1,r["s30"]/6),0.30,1.0)
f_clut=lambda r:clamp(0.62+0.38*min(1,r["runs_ko"]/130),0.62,1.0)   # playoffs = upside only, missing them doesn't crater
f_wkt =lambda r,n:clamp((r["wkts"]/n["maxw"])/0.9,0,1)
f_eco =lambda r,n:clamp(0.78+(n["econ"]/ECON(r)-1)*0.9,0.40,1.0)
f_bsr =lambda r,n:clamp(0.78+(n["bsr"]/BSR(r)-1)*0.8,0.40,1.0)
f_bimp=lambda r:clamp(0.45+0.14*r["potm"]+0.10*min(1,r["wkts_win"]/14),0.30,1.0)
def f_death(r,n):
    if r["dth_b"]<12:return 0.45
    return clamp(0.50+(n["deco"]/(6*r["dth_r"]/r["dth_b"])-1)*0.9+0.04*r["dth_w"],0.30,1.0)
def f_mid(r,n):
    # middle-overs CONTROL = wicket-taking + dot pressure in overs 7-15 (distinct from Economy)
    if r["mid_b"]<24:return 0.45
    wrate=r["mid_w"]/(r["mid_b"]/6.0)            # wickets per middle over
    dotpct=r["dots"]/r["balls"]
    return clamp(0.38+0.50*clamp(wrate/0.20,0,1)+0.40*clamp((dotpct-0.36)/0.14,0,1),0.30,1.0)
def f_vers_b(r):
    ph=sum(1 for x in (r["pp_b"],r["mid_b"],r["dth_b"]) if x>=18); return clamp(0.45+0.18*ph+(0.1 if r["bf"]>=60 else 0),0.30,1.0)

DEF_BN={"OPENER":{"sr":135,"avg":32,"maxr":600},"MID":{"sr":145,"avg":33,"maxr":550},"FINISH":{"sr":160,"avg":26,"maxr":340}}
def bat_raw(r,role,z):
    n=BN.get((z,r["season"]),DEF_BN[z]); w=BAT[role]
    fac={"run":f_run(r,n),"sr":f_sr(r,n),"avg":f_avg(r,n),"impact":f_imp(r),"fimp":f_fimp(r),"clutch":f_clut(r),"team":team_f(r)}
    return sum(w[c]*fac[c] for c in w)
def best_bat(r):
    z=zone(r)
    if z is None: return None,None
    roles={"OPENER":["Anchor","Aggressor"],"MID":["Anchor","Accelerator"],"FINISH":["Finisher"]}[z]
    b=max(roles,key=lambda ro:bat_raw(r,ro,z)); return b,bat_raw(r,b,z)
DEF_ON={"econ":8.5,"bsr":22,"maxw":25,"deco":9.5,"meco":7.8}
def bowl_raw(r):
    t="Spin" if is_spin(r) else "Pace"; n=ON.get((t,r["season"]),DEF_ON); w=BOWL[t]
    fac={"wkt":f_wkt(r,n),"econ":f_eco(r,n),"sr":f_bsr(r,n),"impact":f_bimp(r),"death":f_death(r,n),"midctrl":f_mid(r,n),"vers":f_vers_b(r),"team":team_f(r)}
    return t,sum(w[c]*fac[c] for c in w)

def bat_hv(r,z):   # historic-volume recognition, role-aware (finishers score huge volume rarely)
    if z=="FINISH":
        return clamp((r["runs"]-330)/230,0,1)*5.5 + clamp((r["sixes"]-28)/24,0,1)*4.5
    return clamp((r["runs"]-700)/300,0,1)*5.0
CAL=[(40,55),(60,72),(70,80),(82,86),(90,89),(96,93),(99,96),(100.5,99)]   # Kohli's 100.8 -> 99; 97 stays hard
def calib(x):
    if x<=CAL[0][0]:return CAL[0][1]
    if x>=CAL[-1][0]:return CAL[-1][1]
    for (x0,y0),(x1,y1) in zip(CAL,CAL[1:]):
        if x0<=x<=x1:return y0+(y1-y0)*(x-x0)/(x1-x0)

out=[]
for r in raw:
    role=None; rawsc=None; hv=0
    if is_AR(r):
        bb,bvs=best_bat(r)
        if bvs is None: bvs=40
        t,bovs=bowl_raw(r)
        # specialist rating in EACH discipline, then the weaker ADDS a bonus on top of the stronger
        bat_rt=calib(bvs+bat_hv(r,zone(r)))
        bowl_rt=calib(bovs+clamp((r["wkts"]-24)/12,0,1)*5.0)
        strong,weak=max(bat_rt,bowl_rt),min(bat_rt,bowl_rt)
        bonus=clamp((weak-70)/22,0,1)*4.0                     # 2nd-skill uplift: smaller, so peak discipline leads
        final=int(min(98,round(strong+bonus)))               # AR caps at 98 (99 reserved for a singular season)
        out.append({"name":r["name"],"team":r["team"],"season":r["season"],"role":f"AR ({bb}/{t})","rating":final,"runs":r["runs"],"wkts":r["wkts"],"_raw":round(strong+bonus,1)})
        continue
    elif can_bowl(r) and not can_bat(r):
        t,rawsc=bowl_raw(r); role=t; hv=clamp((r["wkts"]-24)/12,0,1)*5.0
    elif can_bat(r):
        b,rawsc=best_bat(r); role=b; hv=bat_hv(r,zone(r))
    elif can_bowl(r):
        t,rawsc=bowl_raw(r); role=t; hv=clamp((r["wkts"]-24)/12,0,1)*5.0
    else: continue
    final=int(round(calib(rawsc+hv)))
    out.append({"name":r["name"],"team":r["team"],"season":r["season"],"role":role,"rating":final,
        "runs":r["runs"],"wkts":r["wkts"],"_raw":round(rawsc+hv,1)})

json.dump(out,open(f"{OUT}/ratings.json","w"))
rs=sorted(p["rating"] for p in out)
print("total rated player-seasons:",len(out))
print("dist min/p10/p50/p90/max:",rs[0],rs[len(rs)//10],rs[len(rs)//2],rs[int(.9*len(rs))],rs[-1],"| 97+:",sum(x>=97 for x in rs),"| 95+:",sum(x>=95 for x in rs))
print("\nTop 20 OVERALL:")
for p in sorted(out,key=lambda x:-x["rating"])[:20]:
    print(f"  {p['rating']:3d}  {p['name']:16s} {p['season']} {p['role']:18s} {p['runs']}r {p['wkts']}w")
print("\nAll-rounder check:")
for nm,s in [("AD Russell",2019),("SP Narine",2018),("RA Jadeja",2022),("HH Pandya",2022),("SR Watson",2008),("Rashid Khan",2023)]:
    p=next((x for x in out if x["name"]==nm and x["season"]==s),None)
    if p: print(f"  {nm} {s}: {p['rating']} [{p['role']}]  {p['runs']}r {p['wkts']}w")

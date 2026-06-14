#!/usr/bin/env python3
"""ONE clean aggregation pass over every IPL match -> master.json (per player-season)."""
import json, glob, os, collections
SRC="/sessions/nice-confident-galileo/mnt/16-0"; OUT="/sessions/nice-confident-galileo/mnt/outputs"
tf={"Rising Pune Supergiants":"Rising Pune Supergiant"}
BOWLER_WK={"bowled","caught","lbw","stumped","caught and bowled","hit wicket"}
KO={"Qualifier 1","Qualifier 2","Eliminator","Final","Semi Final","Elimination Final","3rd Place Play-Off"}

def blank():
    return {"matches":set(),
        # batting
        "bat_inn":0,"runs":0,"bf":0,"outs":0,"sixes":0,"fours":0,
        "bat_death_r":0,"bat_death_b":0,"runs_win":0,"runs_ko":0,
        "s30":0,"s50":0,"s100":0,"notout_win":0,
        # bowling
        "balls":0,"conc":0,"wkts":0,"dots":0,
        "pp_b":0,"pp_r":0,"pp_w":0,"mid_b":0,"mid_r":0,"mid_w":0,"dth_b":0,"dth_r":0,"dth_w":0,
        "wkts_win":0,"wkts_ko":0,
        # fielding / misc
        "field":0,"stump":0,"potm":0,"final_motm":0,
        "pos12":0,"pos35":0,"pos6":0}
A=collections.defaultdict(blank)
champion={}
TINFO=collections.defaultdict(lambda:{"final":0,"final_win":0,"q2":0,"elim":0,"q1":0,"lwins":0,"lgames":0})

for f in glob.glob(os.path.join(SRC,"*.json")):
    try: d=json.load(open(f))
    except: continue
    if not isinstance(d,dict) or "info" not in d: continue
    info=d["info"]
    if info.get("match_type")!="T20": continue
    season=int(info["dates"][0][:4]); mid=os.path.basename(f)
    teams=[tf.get(t,t) for t in info["teams"]]
    winner=tf.get(info.get("outcome",{}).get("winner"),info.get("outcome",{}).get("winner"))
    stage=str((info.get("event") or {}).get("stage","")) if isinstance(info.get("event"),dict) else ""
    isko=stage in KO
    if stage=="Final" and winner: champion[season]=winner
    for t in teams:                                   # team playoff progression (for team-success points)
        ti=TINFO[(t,season)]
        if stage=="Final": ti["final"]=1; ti["final_win"]= (1 if winner==t else ti["final_win"])
        elif stage=="Qualifier 2": ti["q2"]=1
        elif stage in ("Eliminator","Elimination Final"): ti["elim"]=1
        elif stage=="Qualifier 1": ti["q1"]=1
        elif not isko:
            ti["lgames"]+=1
            if winner==t: ti["lwins"]+=1
    pbt=info.get("players",{})
    def team_of(n):
        for t,ps in pbt.items():
            if n in ps: return tf.get(t,t)
        return None
    for n in info.get("player_of_match") or []:
        t=team_of(n)
        if t: A[(n,t,season)]["potm"]+=1;  A[(n,t,season)]["final_motm"]+= (1 if stage=="Final" else 0)
    for inn in d.get("innings",[]):
        bteam=tf.get(inn.get("team"),inn.get("team")); fteam=teams[0] if teams[1]==bteam else teams[1]
        won_bat = winner==bteam; won_bowl = winner==fteam
        order=[]; seen=set(); mruns=collections.Counter(); mfaced=collections.Counter()
        for ov in inn.get("overs",[]):
            onum=ov.get("over",0)
            for b in ov.get("deliveries",[]):
                for who in (b["batter"],b.get("non_striker")):
                    if who and who not in seen: seen.add(who); order.append(who)
                bat=b["batter"]; bowl=b["bowler"]; ex=b.get("extras",{}); rb=b["runs"]["batter"]; tot=b["runs"]["total"]
                kb=(bat,bteam,season); kbo=(bowl,fteam,season)
                legal_bat = "wides" not in ex
                legal_bowl = "wides" not in ex and "noballs" not in ex
                conc = rb + ex.get("wides",0) + ex.get("noballs",0)
                # batting
                if legal_bat: A[kb]["bf"]+=1
                A[kb]["runs"]+=rb; mruns[bat]+=rb; mfaced[bat]+= (1 if legal_bat else 0)
                if rb==6: A[kb]["sixes"]+=1
                elif rb==4: A[kb]["fours"]+=1
                if won_bat: A[kb]["runs_win"]+=rb
                if isko: A[kb]["runs_ko"]+=rb
                if onum>=15:
                    A[kb]["bat_death_r"]+=rb
                    if legal_bat: A[kb]["bat_death_b"]+=1
                A[kb]["matches"].add(mid); A[kbo]["matches"].add(mid)
                # bowling
                if legal_bowl: A[kbo]["balls"]+=1
                A[kbo]["conc"]+=conc
                if tot==0: A[kbo]["dots"]+=1
                ph = "pp" if onum<6 else ("mid" if onum<15 else "dth")
                A[kbo][ph+"_b"]+= (1 if legal_bowl else 0); A[kbo][ph+"_r"]+=conc
                for w in b.get("wickets",[]):
                    if w["kind"] in BOWLER_WK:
                        A[kbo]["wkts"]+=1; A[kbo][ph+"_w"]+=1
                        if won_bowl: A[kbo]["wkts_win"]+=1
                        if isko: A[kbo]["wkts_ko"]+=1
                    if w["player_out"]==bat: A[kb]["outs"]+=1
                    for fl in w.get("fielders",[]):
                        nm=fl.get("name")
                        if nm: A[(nm,fteam,season)]["field"]+=1
                        if nm and w["kind"]=="stumped": A[(nm,fteam,season)]["stump"]+=1
        # per-innings batting summaries
        for who in seen:
            k=(who,bteam,season); rn=mruns[who]
            if mfaced[who]>=1:
                A[k]["bat_inn"]+=1
                if rn>=30: A[k]["s30"]+=1
                if rn>=50: A[k]["s50"]+=1
                if rn>=100: A[k]["s100"]+=1
        for pos,who in enumerate(order,1):
            z="pos12" if pos<=2 else ("pos35" if pos<=5 else "pos6")
            A[(who,bteam,season)][z]+=1

# team-success points (3-10) from playoff progression
season_np=collections.defaultdict(list)
for (t,s),v in TINFO.items():
    if not (v["final"] or v["q2"] or v["elim"] or v["q1"]): season_np[s].append(v["lwins"])
team_pts={}
for (t,s),v in TINFO.items():
    if v["final"]: pts=10 if v["final_win"] else 8
    elif v["q2"]: pts=7
    elif v["elim"]: pts=6
    elif v["q1"]: pts=7
    else:
        arr=season_np[s]; lo=min(arr) if arr else 0; hi=max(arr) if arr else 1
        pts=3+(2*(v["lwins"]-lo)/(hi-lo) if hi>lo else 1)
    team_pts[f"{t}|{s}"]=round(pts,2)

# materialise
recs=[]
for (nm,tm,s),v in A.items():
    v["matches"]=len(v["matches"]); v["name"]=nm; v["team"]=tm; v["season"]=s
    recs.append(v)
json.dump({"players":recs,"champion":champion,"team_pts":team_pts}, open(os.path.join(OUT,"master.json"),"w"))
print("player-seasons:",len(recs))
def g(nm,s):
    r=next((x for x in recs if x["name"]==nm and x["season"]==s),None); return r
for nm,s in [("V Kohli",2016),("JJ Bumrah",2020),("Rashid Khan",2020),("AD Russell",2019)]:
    r=g(nm,s)
    if r: print(nm,s,"| runs",r["runs"],"bf",r["bf"],"6s",r["sixes"],"| wkts",r["wkts"],"econ",round(6*r["conc"]/r["balls"],2) if r["balls"] else "-","death_w",r["dth_w"],"mid_b",r["mid_b"])

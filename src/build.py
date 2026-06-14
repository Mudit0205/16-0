#!/usr/bin/env python3
"""Stitch the split source modules into the single playable index.html."""
import json, os
HERE=os.path.dirname(os.path.abspath(__file__))
def r(p): return open(os.path.join(HERE,p)).read()
css = r("styles.css")
js  = "\n".join(r(f) for f in ["01-constants.js","02-engine.js","03-achievements.js","04-app.jsx"])
data= json.load(open(os.path.join(HERE,"players.json")))
html= r("index.template.html").replace("__CSS__",css).replace("__JS__",js)
html= html.replace("__DATA__", json.dumps(data, separators=(",",":")))
out = os.path.join(HERE,"..","index.html")
open(out,"w").write(html)
print("built ->", os.path.abspath(out), "|", len(html), "bytes")

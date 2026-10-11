# Injects one recorded search (from search.js) into ui.js -> assets/js/fcs1.js
import json,sys
run=json.load(open(sys.argv[1])); iters=int(sys.argv[2]); D='0123456789abcdefghijklmnopqrstuvwxyz'
b=lambda v:D[v//36]+D[v%36]
hist=[[h[0],round(h[1],2),h[2],h[3],''.join(str(o)+b(x)+b(y) for o,x,y in h[4])] for h in run['hist']]
data=json.dumps({'seed':run['seed'],'n':run['n'],'iters':iters,'hist':hist},separators=(',',':'))
src=open("bin/fcs1_search.js").read(); gen=src[src.index('function pkRng'):src.index('// Compaction search')].rstrip()
HUES=json.loads(sys.argv[4]) if len(sys.argv)>4 else [['#1a73e8','#d2e3fc'],['#8e5bef','#e6dcfd'],['#12a3a3','#cdeeed']]   # blue, violet, teal
open(sys.argv[3],'w').write(open("bin/fcs1_ui.js").read().replace('__DATA__',data).replace('__GEN__',gen).replace('__HUES__',json.dumps(HUES)))
print(len(hist),len(data))

import json
routes = {}
for g in range(11):
    f = open("V%d" % g, "r")
    data = json.loads(f.read())
    routes[g] = data['routes']
    
out = "var routes =" + json.dumps(routes) + ";"
print out

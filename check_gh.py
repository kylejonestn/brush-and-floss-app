import urllib.request
import json

url = "https://api.github.com/repos/kylejonestn/brush-and-floss-app/actions/runs"
req = urllib.request.Request(url)
try:
    with urllib.request.urlopen(req) as response:
        data = json.loads(response.read().decode())
        if data["workflow_runs"]:
            run = data["workflow_runs"][0]
            print(f"Latest run status: {run['status']}")
            print(f"Latest run conclusion: {run['conclusion']}")
            print(f"HTML URL: {run['html_url']}")
        else:
            print("No workflow runs found.")
except Exception as e:
    print(f"Error: {e}")

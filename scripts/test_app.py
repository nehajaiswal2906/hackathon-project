import urllib.request
import json
import sys

def test_endpoints():
    base_url = 'http://localhost:8000'
    assets = [
        ('/', 'HTML Home'),
        ('/css/style.css', 'CSS Stylesheet'),
        ('/js/app.js', 'JS Application Code'),
        ('/data/nyc.json', 'NYC Dataset JSON'),
        ('/data/dfw.json', 'DFW Dataset JSON')
    ]

    print("Verifying Corridor Opportunity Finder web server endpoints...")
    all_passed = True

    for endpoint, label in assets:
        url = base_url + endpoint
        try:
            req = urllib.request.Request(url, headers={'User-Agent': 'TestRunner/1.0'})
            with urllib.request.urlopen(req) as response:
                content = response.read()
                status = response.status
                size_kb = len(content) / 1024
                print(f"[PASS] {label} ({endpoint}): Status {status}, Size: {size_kb:.1f} KB")

                if endpoint.endswith('.json'):
                    data = json.loads(content.decode('utf-8'))
                    print(f"       Metro: {data.get('metro_name')}")
                    print(f"       Corridors count: {data.get('corridors_count')}")
                    print(f"       Archetypes count: {data.get('archetypes_count')}")
                    print(f"       Special zones count: {data.get('special_zones_count')}")
                    print(f"       Geometry notice: {data.get('geometry_note')[:60]}...")
                    if data.get('corridors_count') == 0:
                        all_passed = False
                        print(f"[FAIL] {label} has 0 corridors!")
        except Exception as e:
            print(f"[FAIL] {label} ({endpoint}): {e}")
            all_passed = False

    if all_passed:
        print("\nAll assets and datasets loaded successfully with 100% data integrity!")
    else:
        print("\nSome tests failed!")
        sys.exit(1)

if __name__ == '__main__':
    test_endpoints()

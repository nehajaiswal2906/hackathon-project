import http.server
import socketserver
import os
import sys
import webbrowser

PORT = int(os.environ.get("PORT", 8000))
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PUBLIC_DIR = os.path.join(BASE_DIR, 'public')

class QuietHTTPHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=PUBLIC_DIR, **kwargs)

    def log_message(self, format, *args):
        # Clean terminal logging
        sys.stdout.write(f"[{self.log_date_time_string()}] {format % args}\n")
        sys.stdout.flush()

def main():
    if hasattr(sys.stdout, 'reconfigure'):
        try:
            sys.stdout.reconfigure(encoding='utf-8')
        except Exception:
            pass

    if not os.path.exists(PUBLIC_DIR):
        print(f"Error: public directory '{PUBLIC_DIR}' not found!")
        sys.exit(1)

    port = PORT
    max_attempts = 10
    httpd = None

    for attempt in range(max_attempts):
        try:
            httpd = socketserver.TCPServer(("", port), QuietHTTPHandler)
            break
        except OSError:
            print(f"Port {port} is busy, trying port {port + 1}...")
            port += 1

    if not httpd:
        print(f"Could not bind to an open port between {PORT} and {PORT + max_attempts}.")
        sys.exit(1)

    url = f"http://localhost:{port}"
    print("=" * 68)
    print("   [+] CORRIDOR OPPORTUNITY FINDER - LOCAL DEV SERVER")
    print("=" * 68)
    print(f"   Status  : ACTIVE & RUNNING")
    print(f"   Local URL: {url}")
    print(f"   Datasets: 65 NYC Corridors + 72 Dallas-Fort Worth Corridors")
    print("=" * 68)
    print("   Press Ctrl + C in this terminal to stop the server.")
    print("=" * 68 + "\n")

    # Launch browser automatically if not in headless or CI
    try:
        webbrowser.open(url)
    except Exception:
        pass

    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nStopping Corridor Opportunity Finder server. Goodbye!")
        httpd.server_close()

if __name__ == '__main__':
    main()

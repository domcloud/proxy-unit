# proxy-unit

This simple app simply spawns another HTTP server with `PORT` env injected with another number, then proxying it for NGINX UNIT request.

Built primarily for integrating NGINX Unit with any apps in any language without modifying or even recompiling the code. HTTP 1.1 and Websocket is supported.

## Install & Use

Download from releases or build it yourself and place it in system files as `port` executable.

```bash
wget -qO- https://github.com/domcloud/proxy-unit/releases/download/v0.3.1/proxy-unit-linux-amd64.tar.gz | tar xz 
sudo mv index.js /usr/local/bin/port 
sudo mv build /usr/local/bin/build
```

Here's an example use it as NGINX UNIT application config:

```json
{
    "type": "external",
    "working_directory": "/home/www/app",
    "executable": "/usr/local/bin/port",
    "user": "www",
    "group": "www",
    "arguments": [
        "bash",
        "-lc",
        "node app.js"
    ]
}
```

That will execute `node app.js` with local environment in `www` user and `PORT` env that the app has to listen.

## Build

Use `Makefile` to build and run the app. Requires `make`, `go` and `bun` already installed.

```sh
make build
make run
```

## Testing

Use `curl` and `wscat` to test with [test/app.ts](./test/app.ts).

```
curl -vvv localhost:8080
wscat -c "ws://localhost:8080/ws"
```

# proxy-unit

This simple app simply spawns another HTTP server with `PORT` env injected with another number, then proxying it for NGINX UNIT request.

Built primarily for integrating NGINX Unit with any apps without recompiling. HTTP and Websocket is supported.

## Install

Download from releases or build it and place it to `~/.local/bin/proxy-unit`

## Usage

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

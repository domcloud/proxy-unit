.PHONY: build run

build:
	env go build -o ./build/proxy-unit ./...
	chmod +x ./build/proxy-unit

build-ci:
	env GOOS=linux GOARCH=amd64 go build -o ./build/proxy-unit-linux-amd64 -ldflags="-w -s" ./...
	env GOOS=linux GOARCH=arm64 go build -o ./build/proxy-unit-linux-arm64 -ldflags="-w -s" ./...
	cd ./build && tar -zcvf ./proxy-unit-linux-amd64.tar.gz ./proxy-unit-linux-amd64
	cd ./build && tar -zcvf ./proxy-unit-linux-arm64.tar.gz ./proxy-unit-linux-arm64

run:
	env go run . bun ./test/app.ts

.PHONY: build run

build-ci:
	npm ci
	npm i -g @vercel/ncc
	ncc build . -o build -m
	chmod +x ./build/index.js
	cd build && tar -zcvf ./proxy-unit-linux-amd64.tar.gz ./*

run:
	node . bun ./test/app.ts

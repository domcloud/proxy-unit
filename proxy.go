package main

import (
	"fmt"
	"io"
	"net"
	"net/http"
	"strings"
	"time"
)

type Proxy struct {
	DialTarget string
	connected  bool
}

func (proxy Proxy) ServeHTTP(w http.ResponseWriter, r *http.Request) {

	// Connect to the destination server
	destConn, err := proxy.handleDial()
	if err != nil {
		return
	}
	defer destConn.Close()

	// Write the modified request to the destination
	err = r.Write(destConn)
	if err != nil {
		fmt.Printf("Error writing request to destination: %v\n", err)
		return
	}

	he := w.(http.Hijacker)
	clientConn, _, err := he.Hijack()
	if err != nil {
		fmt.Printf("Error writing request to client: %v\n", err)
		return
	}

	// Check if this is a WebSocket upgrade request
	if isWebSocketUpgrade(r) {
		// Handle WebSocket connection
		handleWebSocket(destConn, clientConn)
	} else {
		// Handle HTTP connection as before
		handleHTTP(destConn, clientConn)
	}
}

func isWebSocketUpgrade(request *http.Request) bool {
	return strings.ToLower(request.Header.Get("Connection")) == "upgrade" &&
		strings.ToLower(request.Header.Get("Upgrade")) == "websocket"
}

func handleWebSocket(destConn net.Conn, clientConn net.Conn) {
	// Now, simply relay data between client and destination
	// Use goroutine to copy from client to destination
	go io.Copy(destConn, clientConn)
	// Copy from destination to client
	io.Copy(clientConn, destConn)
}

func handleHTTP(destConn net.Conn, clientConn net.Conn) {
	// Copy the response from the destination to the client
	io.Copy(clientConn, destConn)
}

func (proxy *Proxy) handleDial() (destConn net.Conn, err error) {
	retries := 0
retry:
	destConn, err = net.Dial("tcp", proxy.DialTarget)
	if err != nil {
		if retries < MAX_RETRY && !proxy.connected {
			retries += 1
			fmt.Printf("Retrying to connect for %d-th time\n", retries)
			time.Sleep(WAIT_RETRY)
			goto retry
		}
		fmt.Printf("Error connecting to destination: %v\n", err)
	}
	proxy.connected = true
	return
}

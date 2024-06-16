package main

import (
	"fmt"
	"os"
	"os/exec"

	"github.com/gorilla/websocket"
	unit "unit.nginx.org/go"
)

var outPort int

func init() {
	var err error
	outPort, err = getFreePort()
	if err != nil {
		panic("Can't get free port")
	}
	// Check if there are additional arguments
	if len(os.Args) > 1 {
		cmd := exec.Command(os.Args[1], os.Args[2:]...)
		cmd.Stdout = os.Stdout
		cmd.Stderr = os.Stderr
		cmd.Env = os.Environ()
		cmd.Env = append(cmd.Env, fmt.Sprintf("PORT=%d", outPort))

		// Start the specified command
		err := cmd.Start()
		if err != nil {
			fmt.Printf("Error starting command: %v\n", err)
			os.Exit(1)
		}

		fmt.Printf("Started process %s with PID %d\n", os.Args[1], cmd.Process.Pid)
	}
}

func main() {
	err := startProxy("0.0.0.0:")
	if err != nil {
		panic(err)
	}
}

func startProxy(address string) error {
	proxy := Proxy{
		DialTarget: fmt.Sprintf("localhost:%d", outPort),
		upgrader:   websocket.Upgrader{},
	}

	err := unit.ListenAndServe(address, proxy)
	if err != nil {
		return err
	}
	fmt.Printf("Proxy server listening on %s\n", address)
	return nil
}

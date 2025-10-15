package main

import (
	"fmt"
	"net/http"
	"os"
)

func main() {
	listen_addr := os.Getenv("LISTEN")
	if listen_addr == "" {
		fmt.Println("backend: missing LISTEN env variable")
		return
	}

	fmt.Printf("Listening on %s", listen_addr)
	http.ListenAndServe(listen_addr, nil)
}

package main

import (
	"fmt"
	"net/http"
	"os"

	"github.com/go-chi/chi/v5"
)

func main() {
	router := chi.NewRouter()

	router.Get("/", func(w http.ResponseWriter, r *http.Request) {
		fmt.Fprint(w, "Hello world")
	})

	listen_addr := os.Getenv("LISTEN")
	if listen_addr == "" {
		fmt.Println("backend: missing LISTEN env variable")
		return
	}
	fmt.Printf("Listening on %s", listen_addr)
	http.ListenAndServe(listen_addr, router)
}

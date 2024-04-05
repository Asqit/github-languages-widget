package utils

import (
	"encoding/json"
	"errors"
	"io"
	"net/http"
)

func ReadJSON[T any](r io.ReadCloser) (T, error) {
    var v T // declare a variable of type T
    err := json.NewDecoder(r).Decode(&v) // decode the JSON into v
    return v, errors.Join(err, r.Close()) // close the reader and return any errors.
}

// WriteJSON writes a JSON object to a http.ResponseWriter, setting the Content-Type header to application/json.
func WriteJSON(w http.ResponseWriter, v any) error {
    w.Header().Set("Content-Type", "application/json")
    return json.NewEncoder(w).Encode(v)
}
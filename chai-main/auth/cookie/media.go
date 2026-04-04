package cookie

import (
	"io"
	"mime/multipart"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/go-chi/chi/v5"
)

var (
	userMediaDir = filepath.Join(".", "images", "users")
	postMediaDir = filepath.Join(".", "images", "posts")
)

func ensureMediaDirs() error {
	if err := os.MkdirAll(userMediaDir, 0o755); err != nil {
		return err
	}

	if err := os.MkdirAll(postMediaDir, 0o755); err != nil {
		return err
	}

	return nil
}

func mediaMimeType(fileName string) string {
	lower := strings.ToLower(fileName)

	switch {
	case strings.HasSuffix(lower, ".png"):
		return "image/png"
	case strings.HasSuffix(lower, ".jpg"), strings.HasSuffix(lower, ".jpeg"):
		return "image/jpeg"
	case strings.HasSuffix(lower, ".webp"):
		return "image/webp"
	default:
		return "application/octet-stream"
	}
}

func safeMediaFileName(input string) string {
	base := strings.TrimSpace(strings.ToLower(input))
	base = strings.ReplaceAll(base, " ", "-")

	var out strings.Builder
	for _, r := range base {
		if (r >= 'a' && r <= 'z') || (r >= '0' && r <= '9') || r == '-' || r == '_' || r == '.' {
			out.WriteRune(r)
			continue
		}
		out.WriteByte('-')
	}

	cleaned := strings.Trim(out.String(), "-")
	if cleaned == "" {
		return "file"
	}

	return cleaned
}

func detectMediaExtension(contentType string, fileName string) string {
	lower := strings.ToLower(strings.TrimSpace(fileName))
	switch {
	case strings.HasSuffix(lower, ".png"):
		return ".png"
	case strings.HasSuffix(lower, ".jpg"), strings.HasSuffix(lower, ".jpeg"):
		return ".jpg"
	case strings.HasSuffix(lower, ".webp"):
		return ".webp"
	}

	switch strings.ToLower(strings.TrimSpace(contentType)) {
	case "image/png":
		return ".png"
	case "image/webp":
		return ".webp"
	default:
		return ".jpg"
	}
}

func saveUploadedFile(header *multipart.FileHeader, dir string, prefix string) (string, error) {
	src, err := header.Open()
	if err != nil {
		return "", err
	}
	defer src.Close()

	fileName := safeMediaFileName(prefix) + "-" + time.Now().Format("20060102150405.000000000") + detectMediaExtension(header.Header.Get("Content-Type"), header.Filename)
	fullPath := filepath.Join(dir, fileName)

	dst, err := os.Create(fullPath)
	if err != nil {
		return "", err
	}
	defer dst.Close()

	if _, err := io.Copy(dst, src); err != nil {
		return "", err
	}

	return fileName, nil
}

func removeMediaFile(dir string, dbPath string) {
	fileName := filepath.Base(strings.TrimSpace(dbPath))
	if fileName == "" || fileName == "." || fileName == "DEFAULT.png" {
		return
	}

	_ = os.Remove(filepath.Join(dir, fileName))
}

func (c *CookieAuth) ServeUserAvatar(w http.ResponseWriter, r *http.Request) {
	fileName := filepath.Base(strings.TrimSpace(chi.URLParam(r, "filename")))
	if fileName == "" || fileName == "." || fileName == "DEFAULT.png" {
		http.NotFound(w, r)
		return
	}

	filePath := filepath.Join(userMediaDir, fileName)
	file, err := os.ReadFile(filePath)
	if err != nil {
		http.NotFound(w, r)
		return
	}

	w.Header().Set("Content-Type", mediaMimeType(fileName))
	w.Header().Set("Cache-Control", "public, max-age=31536000, immutable")
	_, _ = w.Write(file)
}

func (c *CookieAuth) ServePostImage(w http.ResponseWriter, r *http.Request) {
	fileName := filepath.Base(strings.TrimSpace(chi.URLParam(r, "filename")))
	if fileName == "" || fileName == "." {
		http.NotFound(w, r)
		return
	}

	filePath := filepath.Join(postMediaDir, fileName)
	file, err := os.ReadFile(filePath)
	if err != nil {
		http.NotFound(w, r)
		return
	}

	w.Header().Set("Content-Type", mediaMimeType(fileName))
	w.Header().Set("Cache-Control", "public, max-age=31536000, immutable")
	_, _ = w.Write(file)
}

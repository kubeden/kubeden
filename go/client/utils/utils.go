package utils

import (
	"encoding/base64"

	"github.com/gomarkdown/markdown"
	"github.com/gomarkdown/markdown/parser"
)

func Base64Decode(encoded string) (string, error) {
	decoded, err := base64.StdEncoding.DecodeString(encoded)
	if err != nil {
		return "", err
	}
	return string(decoded), nil
}

func MarkdownToHTML(md string) string {
	extensions := parser.CommonExtensions | parser.AutoHeadingIDs
	p := parser.NewWithExtensions(extensions)
	html := markdown.ToHTML([]byte(md), p, nil)
	return string(html)
}

package handlers

import (
	"fmt"
	"html/template"
	"net/http"
	"path/filepath"
	"regexp"
	"strings"

	"github.com/kubeden/kubeden/go/client/services"
	"github.com/kubeden/kubeden/go/client/utils"

	"github.com/gorilla/mux"
)

func HandleIndex(w http.ResponseWriter, r *http.Request) {
	content, err := services.FetchGithubReadme("kubeden", "kubeden")
	if err != nil {
		http.Error(w, "Failed to fetch README.md from GitHub", http.StatusInternalServerError)
		fmt.Println(err)
		return
	}

	htmlContent := utils.MarkdownToHTML(content)

	renderTemplate(w, "index", map[string]interface{}{
		"Title":   "Welcome",
		"Content": template.HTML(htmlContent),
	})
}

func HandleBlog(w http.ResponseWriter, r *http.Request) {
	renderTemplate(w, "blog", map[string]interface{}{
		"Title": "GET api.kubeden.io/articles",
	})
}

func HandleAPIArticles(w http.ResponseWriter, r *http.Request) {
	articles, err := services.FetchArticles()
	if err != nil {
		http.Error(w, "Failed to fetch articles: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "text/html")
	var content strings.Builder
	for _, article := range articles {
		content.WriteString(fmt.Sprintf(`
			<div class="bg-gray-800 rounded-md p-6 pb-10 mb-4 shadow-md relative">
			<p class="absolute top-0 left-0 bg-black text-white px-2 py-1 text-xs rounded-md rounded-bl-none">ID: %d</p>
			<a href="/article/%d" class="absolute bottom-0 right-0 bg-black px-4 py-1 rounded-md text-white rounded-tr-none">Read More</a>
				<pre class="yaml-content"><code>
title: |
	<a href="/article/%d" class="hover:text-red-500 text-lime-500 font-bold text-xl">%s</a>

content: |
	%s</code></pre>
			</div>
		`,
			article.ID,
			article.ID,
			article.ID,
			article.Title,
			truncateContent(article.Content, 200)))
	}

	fmt.Fprint(w, content.String())
}

func truncateContent(content string, length int) string {
	space := regexp.MustCompile(`\s+`)
	content = space.ReplaceAllString(content, " ")
	content = strings.ReplaceAll(content, "#", "")

	if len(content) <= length {
		return content
	}
	truncated := content[:length]

	lastSpace := strings.LastIndex(truncated, " ")
	if lastSpace > 0 {
		truncated = truncated[:lastSpace]
	}

	return truncated + "..."
}

func HandleSingleArticle(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	articleID := vars["id"]

	article, err := services.FetchArticle(articleID)
	if err != nil {
		http.Error(w, "Failed to fetch article", http.StatusInternalServerError)
		return
	}

	htmlContent := utils.MarkdownToHTML(article.Content)

	renderTemplate(w, "single-article", map[string]interface{}{
		"Title":   article.Title,
		"Content": template.HTML(htmlContent),
	})
}

func HandleInfo(w http.ResponseWriter, r *http.Request) {
	renderTemplate(w, "info", map[string]interface{}{
		"Title": "GET api.kubeden.io/info",
	})
}

func HandleAPIInfo(w http.ResponseWriter, r *http.Request) {
	info, err := services.FetchInfo()
	if err != nil {
		http.Error(w, "Failed to fetch info", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "text/html")
	infoHTML := fmt.Sprintf(`
		<pre class="yaml-content"><code>
name: %s
age: %d
location: %s
current_role: %s
company: %s
bio: |
  %s
		</code></pre>
	`, info.Name, info.Age, info.Location, info.CurrentRole, info.Company, info.Bio)

	fmt.Fprint(w, infoHTML)
}

func renderTemplate(w http.ResponseWriter, tmpl string, data map[string]interface{}) {
	layoutFile := filepath.Join("template", "layout.html")
	pageFile := filepath.Join("pages", tmpl+".html")

	t, err := template.ParseFiles(layoutFile, pageFile)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	err = t.Execute(w, data)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
	}
}

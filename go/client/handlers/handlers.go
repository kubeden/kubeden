package handlers

import (
	"fmt"
	"html/template"
	"net/http"
	"path/filepath"

	"github.com/kubeden/kubeden/go/client/utils"

	"github.com/kubeden/kubeden/go/client/services"

	"github.com/gorilla/mux"
)

func HandleIndex(w http.ResponseWriter, r *http.Request) {
	renderTemplate(w, "index", map[string]interface{}{
		"Title": "Welcome",
	})
}

func HandleBlog(w http.ResponseWriter, r *http.Request) {
	renderTemplate(w, "blog", map[string]interface{}{
		"Title": "Blog",
	})
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
		"Title": "Info",
	})
}

func HandleArticles(w http.ResponseWriter, r *http.Request) {
	articles, err := services.FetchArticles()
	if err != nil {
		http.Error(w, "Failed to fetch articles", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "text/html")
	for _, article := range articles {
		fmt.Fprintf(w, "<div><h2><a href='/article/%d'>%s</a></h2></div>", article.ID, article.Title)
	}
}

func HandleAPIInfo(w http.ResponseWriter, r *http.Request) {
	info, err := services.FetchInfo()
	if err != nil {
		http.Error(w, "Failed to fetch info", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "text/html")
	infoHTML := fmt.Sprintf(`
		<div class="space-y-4">
			<h2 class="text-2xl font-bold">%s</h2>
			<p><strong>Age:</strong> %d</p>
			<p><strong>Location:</strong> %s</p>
			<p><strong>Current Role:</strong> %s</p>
			<p><strong>Company:</strong> %s</p>
			<h3 class="text-xl font-semibold mt-4">Bio</h3>
			<p>%s</p>
		</div>
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

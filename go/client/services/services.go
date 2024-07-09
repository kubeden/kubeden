package services

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"net/http"

	"github.com/kubeden/kubeden/go/client/models"
)

func FetchInfo() (*models.Info, error) {
	resp, err := http.Get("https://api.kubeden.io/info")
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	var info models.Info
	err = json.NewDecoder(resp.Body).Decode(&info)
	return &info, err
}

func FetchArticles() ([]models.Article, error) {
	resp, err := http.Get("https://api.kubeden.io/articles")
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	body, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	var articles []models.Article
	err = json.Unmarshal(body, &articles)
	if err != nil {
		return nil, err
	}

	return articles, nil
}

func FetchArticle(id string) (*models.Article, error) {
	resp, err := http.Get(fmt.Sprintf("https://api.kubeden.io/article/%s", id))
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	body, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	var article models.Article
	err = json.Unmarshal(body, &article)
	if err != nil {
		return nil, err
	}

	return &article, nil
}

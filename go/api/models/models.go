package models

type Article struct {
	ID      int    `json:"id"`
	Title   string `json:"title"`
	Content string `json:"content"`
}

type PersonalInfo struct {
	Name        string `json:"name"`
	Age         int    `json:"age"`
	Location    string `json:"location"`
	CurrentRole string `json:"current_role"`
	Company     string `json:"company"`
	Bio         string `json:"bio"`
}

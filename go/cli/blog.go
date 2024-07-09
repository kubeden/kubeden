package main

import (
	"fmt"
	"strconv"

	"github.com/spf13/cobra"
)

type BlogPost struct {
	Title   string
	Summary string
	URL     string
}

var blogPosts = []BlogPost{
	{
		Title:   "Introduction to Kubernetes",
		Summary: "A beginner's guide to understanding Kubernetes and its core concepts.",
		URL:     "https://kubeden.io/blog/intro-to-kubernetes",
	},
	{
		Title:   "Go vs. Python: A Comparison",
		Summary: "Comparing Go and Python for backend development in 2024.",
		URL:     "https://kubeden.io/blog/go-vs-python",
	},
	// Add more blog posts here
}

func NewBlogCommand() *cobra.Command {
	blogCmd := &cobra.Command{
		Use:   "blog",
		Short: "List and read blog posts",
		Run:   runBlogCommand,
	}

	blogCmd.Flags().BoolP("open", "o", false, "Open the blog post in a web browser")

	return blogCmd
}

func runBlogCommand(cmd *cobra.Command, args []string) {
	if len(args) == 0 {
		listBlogPosts()
		return
	}

	index, err := strconv.Atoi(args[0])
	if err != nil || index < 1 || index > len(blogPosts) {
		fmt.Println("Invalid blog post number. Please enter a valid number.")
		return
	}

	post := blogPosts[index-1]
	fmt.Printf("Title: %s\n", post.Title)
	fmt.Printf("Summary: %s\n", post.Summary)
	fmt.Printf("URL: %s\n", post.URL)

	openFlag, _ := cmd.Flags().GetBool("open")
	if openFlag {
		openBrowser(post.URL)
	}
}

func listBlogPosts() {
	fmt.Println("Available blog posts:")
	for i, post := range blogPosts {
		fmt.Printf("%d. %s\n", i+1, post.Title)
	}
	fmt.Println("\nUse 'kubeden blog <number>' to view a specific post.")
	fmt.Println("Add the '--open' or '-o' flag to open the post in your browser.")
}

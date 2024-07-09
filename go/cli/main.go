package main

import (
	"fmt"
	"os"
	"os/exec"
	"runtime"

	"github.com/spf13/cobra"
)

func main() {
	var rootCmd = &cobra.Command{Use: "kubeden"}

	var infoCmd = &cobra.Command{
		Use:   "info",
		Short: "Display information about kubeden",
		Run: func(cmd *cobra.Command, args []string) {
			fmt.Println("")
			fmt.Println("  Name: Dennis")
			fmt.Println("  Age: 25")
			fmt.Println("  Location: Bulgaria")
			fmt.Println("  Role: Platform Engineer")
			fmt.Println("")
			fmt.Println("")
			fmt.Println("  I have been mainly in operations through the years.")
			fmt.Println("  I write bad code that is often (somehow) shipped to production.")
			fmt.Println("  Nice to meet you!")
			fmt.Println("")
		},
	}

	var projectsCmd = &cobra.Command{
		Use:   "projects",
		Short: "List projects",
		Run: func(cmd *cobra.Command, args []string) {
			fmt.Println("Projects:")
			// Add logic to list projects
		},
	}

	rootCmd.AddCommand(infoCmd, NewBlogCommand(), NewSocialsCommand(), projectsCmd)

	if err := rootCmd.Execute(); err != nil {
		fmt.Println(err)
		os.Exit(1)
	}
}

func openBrowser(url string) {
	var err error

	switch runtime.GOOS {
	case "linux":
		err = exec.Command("xdg-open", url).Start()
	case "windows":
		err = exec.Command("rundll32", "url.dll,FileProtocolHandler", url).Start()
	case "darwin":
		err = exec.Command("open", url).Start()
	default:
		err = fmt.Errorf("unsupported platform")
	}

	if err != nil {
		fmt.Printf("Error opening browser: %v\n", err)
	}
}

package main

import (
	"fmt"

	"github.com/spf13/cobra"
)

type SocialMedia struct {
	Platform string
	URL      string
}

var socialMediaLinks = []SocialMedia{
	{
		Platform: "X (Twitter)",
		URL:      "https://x.com/kubeden",
	},
	{
		Platform: "GitHub",
		URL:      "https://github.com/kubeden",
	},
	{
		Platform: "LinkedIn",
		URL:      "https://www.linkedin.com/in/denislav-gavrilov-63a946155",
	},
	{
		Platform: "YouTube",
		URL:      "https://www.youtube.com/@kubeden",
	},
	{
		Platform: "Email",
		URL:      "mailto:dennis@kubeden.io",
	},
}

func NewSocialsCommand() *cobra.Command {
	socialsCmd := &cobra.Command{
		Use:   "socials",
		Short: "Display social media links",
		Run:   runSocialsCommand,
	}

	socialsCmd.Flags().BoolP("open", "o", false, "Open the social media link in a web browser")

	return socialsCmd
}

func runSocialsCommand(cmd *cobra.Command, args []string) {
	fmt.Println("Social media links:")
	for i, social := range socialMediaLinks {
		fmt.Printf("%d. %s: %s\n", i+1, social.Platform, social.URL)
	}

	if len(args) > 0 {
		index := 0
		fmt.Sscanf(args[0], "%d", &index)
		if index > 0 && index <= len(socialMediaLinks) {
			social := socialMediaLinks[index-1]
			openFlag, _ := cmd.Flags().GetBool("open")
			if openFlag {
				fmt.Printf("Opening %s in your default browser...\n", social.Platform)
				openBrowser(social.URL)
			}
		} else {
			fmt.Println("Invalid social media number. Please enter a valid number.")
		}
	}
}

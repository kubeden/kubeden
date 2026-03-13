# Mastering the DevOps Interview: A Guide for Junior Candidates

Lately I noticed the interviews about DevOps doesn't vary too much from company to company and what differs is the level of tasks about each seniority level (Junior, Mid-Level, and Senior).

In this blog post I want to share my observations from participating in 4 senior, 2 junior, and 4 mid-level interviews.

## Understanding the DevOps Interview Landscape

It is important to note DevOps interviews are not always the same. Although I strongly lean towards the idea they are very much alike. For what I've seen there are two types of interview processes:

- HR --> Technical Questions --> Offer
- HR --> Technical Questions --> Technical Task --> Offer

Some companies rely on questions/answers while others rely on technical tasks. I personally like the ones with tasks better.

But what can you expect? Well, I can't give you the exact questions you are going to face but I am positive I can help you prepare a little bit better.

Before proceeding with the actual questions and tasks it is important to understand what technologies are currently *hot* for a DevOps. From my interview experience, a huge number of companies are currently using the following:

**Infrastructure Tools:**
* Terraform, Ansible
* AWS, Azure

**Version Control & Automation:**
* Azure DevOps Pipelines, Github Workflows
* GitHub, Azure DevOps Repositories, GitLab

**Containerisation:**
* Kubernetes, Docker, Packer
* ArgoCD (most often with NGINX Ingress Controller, Cert Manager, Grafana, Prometheus, Loki, Thanos)

**Code: *(not required)***
* Python, Java

Of course, you should not consider the mentioned technologies "absolutes" but I am pretty sure you will find the majority of open DevOps positions to be looking for at least 70% of those.

And now with this good theory base, let's shed some light on what you can expect from the "technical questions" & "technical tasks" parts of your interview process.

### Technical Questions

I noticed technical questions are asked by the following people:
* HR: General questions about your experience & knowledge
* Management / Team Leads: More in-depth information about your experience & knowledge but still general
* Engineers: Situation-type questions (those turn into discussions), Quick technology-specific questions
* Architects: Raw theory questions, Harder-than-what-you-applied-for questions, Hard situation-type questions

To be prepared and able to feel comfortable in the different stages of the interview, I can advise you not to try and push yourself too far but rather talk about topics you understand or at least can make some connections to so you can think in real time.

### Technical Tasks

Technical tasks are a lot more comfortable (to me at least) since this is the part in which you can actually shine by proving you know something and are capable. So far I came across the following types of technical tasks:
* Do alone for certain time period: 3-7 days
* Do alone for certain time period: 1-3 hours
* Do together for a certain time period: 1 hour

Some companies will ask you questions on the already completed tasks you did in upcoming interviews so make sure to not delete (or ask them before you do) the resources (infra / code / etc) you have created until the interview process is over.

Great! You are now fully aware what a DevOps interview looks like most of the times. Now let's discuss the differences in the three seniority levels.

## Junior Level DevOps Interviews

Junior level DevOps interviews are my favourite. In my opinion those are both the easiest and the hardest to pass since very little is required from you to look impressive and on the other hand it is hard to get to that state if you don't have a mentor to help you get there. I have a Google doc I am sharing with all my friends who wants to go into DevOps and it always works. I will not be sharing it in this post because I want to create a comprehensive guide about it soon.

Anyway, here is what you need to know about Junior DevOps interviews.

### Skills Required

I believe because I made it happen with three of my friends that you can become a Junior DevOps Engineer without any prior tech experience. This is also a topic for another time but keep in mind there are companies willing to hire you and train you. With this being said, I will divide the skills required to become a Junior DevOps Engineer into two categories:
* No prior experience (Fresh out of high-school, university, or bootcamp)
* With prior experience (0-1y System Administrator, SRE, Tech Support, or Developer)

**No prior experience**

To impress the interviewer with no prior experience, you will first want to cover the bare minimum:

- Have a Github profile with a few projects (e.g. Bash script for Wordpress automatic deployment, Terraform Examples, Dockerfile examples)
- Know what the following technologies are (not have experience, just be able to tell what the technologies are)
	- Cloud (AWS, Azure): Cloud is the go-to solution for a lot of companies because it provides a convenient way to operate your infrastructure by utilising pay-as-you-go models, and have flexibility over the resources availability it provides. Two of the most used cloud providers are Amazon Web Services and Microsoft Azure.
	- Pipelines (CI/CD, Github Workflows, Gitlab CI/CD ): Pipelines are a way for engineers to automate specific tasks like building containers of their applications and automatically deploying those newly-built containers to their Kubernetes clusters. They can also use pipelines to run cronjob-type tasks. Some of the most used pipelines tools are Github Workflows, and Gitlab CI/CD. The different between CI (Continuous Integration) and CD (Continuous Delivery) is that *CI focuses on preparing code for release (build/test), whereas CD involves the actual release of code (release/deploy)*.
	- Infrastructure as Code (Terraform, Ansible): Infrastructure as code is a method of managing infrastructure by having it all in code, and keeping track of it by (most often) having a state file. An example for this is Terraform. It works by defining infrastructure resources, deploying them, and having all of this in a state file.
	- Containers (Docker, Kubernetes): Containers are a lightweight alternative to virtualisation allowing for  applications to run in an environment that consists only of compute resources that the application needs to run. Not like virtualisation where you have a full virtual machine, a container only contains the required software for a specific code to run. Kubernetes on the other hand is a container orchestration system that allows for management of containers in a more complex but surely better working environment.
	- Networking (OSI Model, Subnetting, Public/Private network access, NAT, DNS, Load Balancing): OSI Model is a model representing how packages travel from a client to a server and vice versa. Subnetting is the practice of dividing a network into smaller networks. Subnets can be public and private. A public subnet always contains a NAT gateway. DNS is the technology used to translate domain names into IP addresses. Load balancing is a method to distribute traffic so that a resource is always available.
	- Linux (Basic commands, Boot Process, What is a Kernel, Package Managers, Permissions): [25 linux commands](https://kubeden.io/blog/25-linux-commands-everybody-should-know), [top 10 skills for a linux admin](https://kubeden.io/blog/top-10-linux-skills-for-landing-a-linux-job), The Linux Kernel is the core of the operating system that handles memory, and generally manages the commands you send to your Linux system. A package manager is a tool that helps you install and uninstall software on your Linux machine. [linux permission](https://www.redhat.com/sysadmin/linux-file-permissions-explained)
- Create an eye-appealing and short but professional CV. I personally use resume.io. The resume you are going to apply with is very important. This is also a topic I want to touch on in my future content so make sure to follow me!
- If you can, get at least one certificate for either a programming language, or cloud (AWS Cloud Practitioner is a good start).

**With Prior Experience**

If you already have experience, make sure to cover everything from the "no prior experience" point but in your CV focus on what you have worked with. After that focus on what you did OUTSIDE of work (which in most cases would be the points from the previous section).

### What to expect in the interview

I noticed companies are keeping it light on the Junior DevOps candidates maybe mostly because to be a Junior DevOps engineer you could do very little and still provide value to a company (although I tend to think a lot of companies do DevOps wrong but yet again... a topic for another post).

Having that said, you can expect your interview to go a a little something like this:
- HR: Introduction, meet & greet, questions about your CV, schedule technical interview
-  Technical Interview: Introduction, Questions about your CV, technical questions:
	-   Questions about Cloud: AWS or Azure
	-    Questions about Automation: Infrastructure as Code, Terraform, CI/CD
	-    Questions about Networking: DNS, OSI Model, Subnetting
	-    Questions about Linux: Basic commands, Boot Process, What is a Kernel, Package Managers, Permissions, Bash
	-    Questions about Containers and Virtualisation: What is a container? What are the differences between a VM and a container? What is Kubernetes?

Again, remember you only need to be able to talk about the points mentioned in the technical interview. As a junior, you will be expected to be motivated and show you are able to exceed expectations. This is why you need a Github profile. Even if you don't know the answer to a specific question, you should be able to create a discussion and show your ability to think. Nobody is expecting you to be a specialist for a junior role.

And with this, we close the Junior DevOps interview topic!

## Conclusion

While tech interviews can be scary in the beginning, with a good base and a goal, remember for a Junior you are expected to "know what's up" rather than have experience and be able to do all kinds of fancy DevOps techniques.

Remember the words *"nobody expects you to be a specialist"*.

Make sure to read about the technologies mentioned, create your Github profile, populate with three simple projects, and go get that first DevOps job!

If you are interested in topics like:
* How to create your resume?
* How to master the Mid-Level and Senior-Level DevOps interview?
* What does a DevOps day look like?

follow me on [x/kubeden](https://x.com/kubeden) so you don't miss on my content.

And here is today's closing GIF:

![closingGif](https://media.giphy.com/media/3fxFL4EsxNvQ15VxVf/giphy.gif)
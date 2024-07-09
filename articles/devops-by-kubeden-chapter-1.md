# DevOps by Kubeden (Chapter 1: Company Types And What To Expect)

## Introduction

I am working as a Senior DevOps engineer / DevOps Lead. I became a senior in the 3rd year of my career. I spent 1 year as a Jr. Sysadmin, then 1 year from Junior to Mid-Level DevOps, and in the 3rd year I got hired as a Senior DevOps. I spent around two years being a Senior DevOps and started engaging in Team Lead and Solutions Architect activities.

I personally trained 10-15  people to become Junior DevOps or a Junior SysAdmins. 6 of them found jobs, the others decided tech is not for them (or remained in tech support roles). That’s just how it goes. Sometimes it’s not for you. The ones that made it are now mostly mid-level with one going strong and is (I assume) going to be a senior soon.

In this document I am going to note down the information I give every one personally so that I don’t have to spend hours explaining my views on the industry, and my experience from training guys and going through the ladder myself.

Keep in mind the contents of this document are my opinions and observations. That makes the information here not a hard and well-known truth. If you are a person just coming into tech, I hope this document helps you get over some of your fears and concerns. And if you are a practitioner or already in the industry and you don’t agree with my views - send me a personal message in the social media that I posted this or an email at dennis@kubeden.io. I would love to go into a discussion!

**And here is how the document is structured:**
- **Observations:** Here I share my observations from different DevOps roles, Company types, and patterns to keep an eye out for
- **Training:** Here I share some training sources like videos, blog posts, and hand-crafted tasks for you to execute during your training [ this part is coming next week ]

## Observations:

**What is the DevOps role?**

The DevOps role differs from company to company but in its core, DevOps is System Administration on steroids. You use code and tools from very talented programmers to manage infrastructure and make the developers’ lifes easier.

As a DevOps, you are often in one very sweet spot of having lots of power over an organization’s tech direction.
Once you spend some years in DevOps, you might find yourself in positions having to argue what DevOps is with developers.

For some DevOps is a role with well-defined responsibilities, for others - a philosophy / ideology. Do yourself a favor and look at DevOps as a philosophy / ideology. This opens many mind doors for you and broadens your vision about the industry.

Oh, and you will never be bored as a DevOps, I promise. 😉

### What companies are looking for a DevOps engineer?

There are three types of companies hiring Junior DevOps engineers:
- **Startup / SMB:** Looking for a DevOps engineer with no-experience (intern positions, tech-support to DevOps, just graduated university)
- **Startup / SMB:** Looking for a DevOps engineer with experience (1-2y+ as a SysAdmin or similar)
- **Enterprises** (Accenture, IBM, SAP)

The first type (no experience SMB) is most-likely an outsourcing / services agency that seems to have added DevOps to their services list a while ago. It is possible the company does not yet have a stable DevOps team and is still figuring it out.

The second type (experience required) is most-likely a company with experience with DevOps. Examples include:
- Operations-focused services company with DevOps / Cloud Architecture probably being their main area of focus
- Product company with a DevOps team in place.
- Development + DevOps services company

The third type (huge enterprise) is the worst. Keep in mind a business might be an enterprise but the technical team / division be at the early stages - that is fine. But generally don’t work for an enterprise if you are just starting out… I mean if it’s FAANG - ok. Otherwise, you will probably be forgotten in a week with no proper training provided.

### What differs in the different DevOps roles based on the company?

**Startup / SMB: Looking for a DevOps engineer with no-experience (intern positions, tech-support to DevOps, just graduated university)**

The Startup / SMB that is looking for DevOps engineers with no-experience is perfect for a newcomer to the tech world because it is an opportunity that is hard to top. If a company is fine hiring you in the DevOps domain with no prior experience, that is your golden egg. You can’t do any better than this. I think so because if you decided to go into development, you would not be able to find a job if you haven’t gone through some intensive (and probably paid) bootcamp. Examples in my country include Telerik and Softuni.

Here are the pros & cons for such company:

**Pros:**
- Companies with such requirements are perfect for a highly-motivated candidate. The biggest benefit with those companies is that if you manage to land such a position, you will start gaining experience in your resume as a DevOps engineer from day 1.
- You will most-likely be a part of the very foundation of the team and have the opportunity to observe how such a team is formed in an organization.
- You will most-likely get paid to be trained. Keep in mind the training is often not 1-2 weeks but months. Which, if we have to be honest, is an investment from the company towards you. Yes, the ROI for the company might be 13x but if you have no experience you are in no position to be greedy. Being greedy is the N1 career-killer in my opinion.

**Cons:**
- The company might not be a good choice for you to stay in when you hit mid-level due to the salary increase that comes with having more knowledge. Right or wrong, it is a fact that changing a company will give you 100%+ increases in salary. One example is 1000-2500 BGN to 3500-5000 BGN (from junior to mid-level when changing a job).

As I mentioned earlier, the roles vary from company to company. What one DevOps engineer does in a company might have absolutely nothing to do with one in another. With this in mind, here is a list of the activities you will most likely find yourself participating in:

**Theory:** Networking, System Administration, Cloud, Programming, Infrastructure as Code, Automation techniques, Architecture Blocks, Databases

**Git:** Being comfortable executing basic operations with GIT:
- Github, Gitlab, Azure DevOps, Bitbucket.

**CI/CD:** Setting up build and deploy pipelines. Platforms include
- Github Actions
- Azure DevOps
- Gitlab
- Jenkins

**Cloud:** Browsing around a cloud platform [AWS, Azure, GCP, Oracle (please don’t work with Oracle cloud, go for AWS and/or Azure)]. In the cloud platforms you will have to gain experience in the following areas:
- AWS:
	- Compute (EC2, EKS, Lambda, Fargate, etc.)
	- Storage (EBS, S3, EFS)
	- Databases (RDS, Aurora, DynamoDB, etc.)
	- Network (Route53, VPC, Subnets,Cloudfront, ELB)
	- Security (IAM, Cognito, Secrets Manager, WAF, Config, Control Tower)
	- Monitoring (Cloudwatch, Cloudtrail, AWS Cost Management)
- Azure:
	- Azure AD
	- Resource Management (Subscriptions, Resource Groups, Tenant)
	- Compute (Azure VMs, Azure Functions, Azure AKS, Azure Stack Edge)
	- Storage (Storage Accounts)
	- Databases (Managed SQL Instance, Azure SQL, CosmosDB, Azure Cache for Redis)
	- Network (Azure LB, Application Gateway, VPCs, Font Door, Firewall)
	- Security (Firewall, PIM Roles, Key Vault)

**Containerisation:** Understand what containerisation is and containerize applications. Technologies here include:
- Docker
- Packer
- Podman
- Docker Swarm

**Container Orchestration:** You are expected to work with containers and those containers should be running somewhere. This is where Kubernetes comes in. Keep in mind Kubernetes is an enormous platform with many components and to be considered a senior in Kubernetes, you will have to have worked your a$$ out for a few years. A perfect example of a senior Kubernetes person who is often saying he will never know everything about Kubernetes is [Nigel Poulton](https://nigelpoulton.com/books/). Technologies inside the Kubernetes ecosystem that you might find yourself work with are (assuming you have already deployed your cluster):
- Absolute Basics
	- Deployment, Ingress, Service, Secret, ConfigMap, Persistent Volume, Cronjobs
	- What Controllers and Operators are
	- ArgoCD
	- Nginx Ingress Controller
	- Cert Manager
	- Sealed Secrets
	- External Secrets
	- External DNS
	- Grafana
	- Prometheus
	- Kibana
	- More… It really depends on the company stack but that’s a good list.

**Infrastructure as Code:** You are expected to deploy and manage infrastructure with code. This is one of the core ideas of DevOps. Technologies include:
- Terraform
- Ansible
- Chef
- Puppet
- Pulumi
- Vagrant
- AWS CloudFormation

**Programming & Scripting:** You will also find that you may need to write scripts. Bash, Python, JavaScript and GoLang are the four most popular scripting choices. While many will argue the JavaScript is sh*t. Well, I don’t think so. JavaScript helped me feel comfortable around codebases and was the door for me to go write in other languages. Don’t get scared of programming and please don’t deny writing code. Being a good DevOps professional, you are required to be able to write code. You don’t have to be a full-stack engineer, just be able to write code. If you won’t write code, you will probably stay Junior to Mid-Level for many years to come.

This is a huge list of technologies and I understand it might seem too much for a first job.

Don’t worry. As a Junior in such places, a lot of the time you will be expected to simply understand a concept and the technologies you will work with are substantially less than that.

If the company you land your first job in is in the early stages of DevOpsing, you might find yourself hopping from tech to tech constantly. As you can imagine this is only in your plus.Trust me, they don’t know what’s going on either.

**Startup / SMB: Looking for a DevOps engineer with experience (1-2y+ as a SysAdmin or similar)**

While for me this is the absolute best place to be in, I am sorry to inform you that it might be near impossible for you to land a position with no prior experience in such a place.

Those golden companies that understand how to structure and keep a DevOps team alive understand that a person that works in DevOps is required to have experience in a broad area of technologies. Real experience that is unfortunately hard to acquire if you don’t get the chance to do it in the real world (System Administration / Some Tech Support roles).

Now, assuming you are a person that is just starting in tech, you are probably completely unmotivated and angry at my document. Great! Let’s note down why those companies are so good to be in. Hopefully you will turn your hatred against me into motivation and prove me wrong by landing that golden job as a first!

The tech stack from up top is still viable here. The difference is that a company with a well-defined DevOps team will have their tech stack standardized. This means the technologies you will get to work with from the previous chapter will be much more in-depth and you will be expected to become a professional at those.

And here are the pros and cons.

**Pros:**
- These types of companies often come with requirements towards you and those requirements will push you to be a professional. You will find yourself in an environment where you are required to constantly do tasks that will look like a task for a mid-level or even a senior.
- There is a high-chance you will meet a mentor or a person who will teach you a lot and will be considered a role-model in tech. This person might be a Team Leader, a Solutions Architect, a CTO, or a Senior Engineer.
- Higher chance to see what a real-world well-configured DevOps environment looks like.

**Cons:**
- No cons

**Enterprises (Accenture, IBM, HP, Salesforce)**

Okay.. enterprises. Here are the reasons why enterprises are a bad choice for a first job. 🙄

**Pros:**
- Honestly… no pros other than maybe having the ability to tell your friends you work in a corp… but you will find that none of them cares

**Cons:**
- There is an enormous chance the environment is stale
- People are often not motivated to do exceptional work
- Salary increases are near zero (1%/y; 3%/y)
- Tech stack is often legacy and tech debt is huge
- If you spend too many years in that place you will remain a junior until you go to an SMB with the drive required to grow

> *Note: I am reminding you this is my personal opinion. There are exceptions to this like VMWare and Siteground. Although I doubt VMWare is looking for Juniors. Siteground is cool 😎*

Now that you have a better understanding of what to expect in your first DevOps job, let’s talk training.

[ LINK HERE WHEN I AM DONE WITH THE TRAINING POST ]

**Discover More at Geeklore.io**

Welcome to my digital corner where technology meets lifestyle! On [Geeklore.io](https://geeklore.io)—a platform I crafted with passion during my weekends—I delve into the realms of tech, DevOps, community building, and the intertwining paths of our professional journeys. My aim? To ignite conversations and share insights that resonate.

Enjoyed the insights? Dive deeper into my collection of articles at [Geeklore.io](https://geeklore.io) and join our growing community of curious minds. Let's explore the possibilities together!

Feeling social? Drop a "hi" on [X/kubeden](https://x.com/kubeden). I cherish every interaction and personally respond to all messages. Let’s connect and collaborate!
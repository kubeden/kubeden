# Mastering the DevOps Interview: A Guide for Mid-Level Candidates

In the first part of the series [Mastering the DevOps Interview: A Guide for Junior Candidates](https://dev.to/kubeden/mastering-the-devops-interview-a-guide-for-junior-candidates-fe0) I shared the observations I collected over 10 interviews of the DevOps interviews, focusing on the Junior role.

In this part, I am going to share what I noticed overlaps in Mid-Level DevOps interviews, and hopefully help you feel more comfortable in your job hunt!

I highly recommend to go over the first post in the series even if you are past Junior as there I have pointed out what the DevOps Interview Landscape looks like.

This article will be shorter than the Junior-level one as I am solely going to focus on what the interview might look like, technologies, and example tasks you might be given.

## Interview Process

For Mid-Levels, I noticed the interview process most often goes as follows:

- HR --> Technical Questions --> Technical Task --> Offer

The technical tasks are mostly of 'real-time' or 'homework' types.

Two other possible interview processes are:

- HR --> Technical Questions --> Offer
- HR --> Technical Knowledge Test --> Technical Questions --> Offer

Some companies rely on questions/answers while others rely on technical tasks. If you ask me, you should search for technical tasks interviews as in those you can actually shine and don't fall victim to the "automated selection".

## Technical Questions

Strangely enough, the technical questions for mid-level roles do not differ too much from the junior ones. Although for mid-level roles how you answer matters more. While for a junior role you might say something along the lines of "Well, I am not quite sure but maybe ____," in mid-level interviews you are expected to be a way more confident and understand what the technical recruiter is talking about at all times. Sure, you might not be able to come up with a cloud architecture on the spot but you are expected to be able to swim freely in the DevOps world.

With this in mind, here are some of the most common topics you could face in your Mid-Level DevOps interviews:

**Cloud - AWS (Services you should be able to converse about)**

1. S3, EFS, EBS
2. ELB, NLB, ALB
3. RDS, Aurora, DynamoDB
4. ECS, EKS, Fargate, EC2
5. Cloudfront, Route53

**Cloud - Azure (Services you should be able to converse about)**

1. Keyvault, Storage Account
2. VNET, Subnets, NAT, Route Table, Load Balancer, DNS Zones
3. Virtual Machine, AKS
4. Managed Databases, Azure Databases
5. Application Gateway

**Automation: Pipelines, IaC**

1. Build Pipelines, Release Pipelines, Multi-stage pipelines
2. Dockerfiles, Multi-stage container builds
3. Terraform (init, plan, apply, workspaces, local vs remote state, aws state lock)
4. Ansible Playbooks

**Containerisation**

1. Kubernetes (Deployments, Services, Ingresses, Secrets, Nodes, PVCs, Storage Classes, ConfigMaps, Policies)
2. Nginx Ingress Controller, Cert-Manager, External Secrets, External-DNS, Grafana, Prometheus
3. ArgoCD (Projects, Policies, Roles, Repositories, Clusters, app-of-apps)
4. Microservice vs Monolith

**Linux**

1. [Basic Commands (this is a link to my other blog post with 25 linux commands)](https://kubeden.io/blog/25-linux-commands-everybody-should-know)
2. [Troubleshooting & Investigation Skills](https://kubeden.io/blog/top-10-linux-skills-for-landing-a-linux-job)

While this list might look too extensive, you will notice if you spent some even one year working as a junior (at a good and enabling place), you would have probably covered near to or even more than 80% of it.

And with this out of the way, let's explore what technical tasks you might be given in your interview.

## Technical Tasks

Similar to the technical questions, I noticed the technical tasks for Mid-Level DevOps do not differ that much than... wait for it... Senior level DevOps!

The difference comes in the extent of the tasks. How deep you go and how much material you cover.

Here is what you can expect as Mid-Level DevOps tasks in your interview:

1. Create a Dockerfile for an application (Python, Javascript, Dotnet)
2. Create a pipeline (Github / Gitlab / Azure DevOps) that builds the application and pushes it to a container registry
3. Create a pipeline that automatically updates an image version in a GIT repository
4. Deploy a simple application on Kubernetes (Deployment, Service)
5. Install and configure Nginx Ingress Controller (Ingresses) and Cert-Manager (Certificates, Secrets)
6. Create an Ansible Playbook that installs a LAMP stack on multiple hosts

Look! This is not that scary, right? I believe if you just do all of those tasks at home, and train so that you are able to replicate the results on any environment from scratch, you are a good mid-level DevOps engineer!

## Conclusion

While Mid-Level DevOps interviews might look scarier and cover a wider area of expertise, you are not expected to be a team leader, or a cloud architect. That means you are expected to have had experience in the topics from the "Technical Questions" section but not necessarily be a complete professional in all.

Be realistic about your experience and think about where you came from. This will for sure help you stay grounded in your interviews and not panic too much. If you are applying for a Mid-Level DevOps role, you definitely did your time in front of the screen so be proud of that and go proof your next employer you are worth the time!

I wish you luck with your interviews and as always - here is the closing GIF 😊

![daily-gif](https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExbW1zN3pkY2t4dDRzczQwbnYyZ2VldmlhdHY1NWVod2RleGNpa3YwYSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/GxMOE1Ns0fdy4bfhf6/giphy.gif)
# How to build a good container platform

## Description

Platform Engineering is the act of designing, provisioning, and maintaining a platform.

You provision resources.
You configure resources.
And you use your platform.

It sounds easy but it's not.
Most engineering teams fail.

## Blocks

In order to build a good platform, you need to build logically.

1. Base (Cloud / On-Prem / Hybrid Cloud / Multi-Cloud)
2. Application Engine [(k8s / vms / serverless) in our case k8s]
3. Platform Components (monitoring, application, recovery, automation)
4. Application Components (ci/cd, configuration repo)
5. Subtleties (secrets management & rotation, states, processes)

Organizations hire teams, often to do one thing. Which is wrong.
How one team does something, is often not how the others will.

Expertise is often different, which leads to "know-how drifts" and technical debt.

## Standartization

This is maybe the most important foundation block for a platform to thrive.

Standartization is almost always ignored:
- name suffixes & directory structures
- utility separation
- unified deployment methods
- documentation & knowledge transfers

These are the "atoms" in a good platform.

## Name Suffixes & Variability

Name suffixes are your map points.
Directory structures are your streets.

Every organization should have strictly defined name suffixes and directory structures that should be applied across:
- iac repositories
- application management repositories
- cloud resources
- secret namings
- service accounts
- and so on.. and so on..

A good name suffix system includes 3 to 7 matching variables.

Example:
- customer
- region
- environment
- iteration
- type

Continuing the example, this would translate to:

- e.g. directory structure: ${customer}/${region}/${environment}/${type}-[${iteration}?]
- e.g. terraform resource: ${customer}-${region}-${environment}-${iteration}-${type}

Imagine this at scale.
It is easy to navigate it now.
It is easy to understand.

It is.. nice to work with! :)

## Utility Separation

Many organizations don't separate.

They create a repository called `devops` and they put everything inside:

- terraform
- bash scripts
- yaml
- helm
- kustomize
- ansible
- and god know what else

Instead, you should be grouping logically:

- infrastructure provisioning: manage the lifecycle of your resources
- infrastructure configuration: manage the configuration on your "live" resources
- application deployment: application configuration
- application code: well... your application code

Here is an example of well-separated & logically-grouped repositories:

- infrastructure: terraform, bash (as few as possible)
- k8s-cluster-configuration: yaml, kustomize, helm, jsonnet
- [application]-k8s-configuration: standartized releases / deployments / libs

This way, you achieve the following:
- a single place to provision / depracate infra
- a single place to provision / depracate platform components
- a single place to provision / depracate applications

## Platform Resources: Provisioning

Regardless of the technology you choose, you should handle provisioning of resources as a standalone practice.

Here is an exapmle of a good Terraform set-up:

Repository: `infrastructure`
Directory structure:
- modules/
- base/
- .ci(or .github, or whatever the standard is)

Where in /modules, you treat it as "libs", a place where you manage the versioning of your modules (community or personal).
Example continuation of modules can looks like this:
- modules/
  - azure/
    - azurerm/
      - key-vault/
        - community/
        - personal/
      - acr/
        - ...
    - /azuread
      - ...
  - /aws
    - /control-tower
      - community/
      - personal/
    - /rds
      - ...
    - /s3
      - ...

And in base, you call these modules:

- base/
  - [customer]/
    - [ region ]/
      - [ environment]/
        - common/
          - locals.tf
          - provider.tf
          - key-vault.tf
          - acr.tf
          - ...

You never click in the cloud provider.
But you also don't configure here.
You do not "hack" yamls.
You do not apply hard-to-figure-out scripts.

You only spawn and delete. :)

## Platform Components: Configuration

In order to have a good platform, you need to be flexible, clear, and rock-solid in terms of its capabilities.

One of the most hardened platforms I've ever built (and I built it 3 separate times) is as follows:

Management:
- ArgoCD: Management, IAM, GitOps.

Routing:
- ingress-nginx: routing, one lb, reserve ips in your subnet, manage routing programmatically
- cert-manager: automated ssl
- external-dns: automated dns

Secrets Management:
- external-secrets: vaults, stores, you name it
- sealed-secrets: plain-text secrets in your repo (for stuff like the initial argocd secret)

Monitoring:
- grafana-operator: well.. grafana :) graphs and stats
- prometheus: metrics
- blackbox-exporter: alerts
- thanos (if multi-cluster): consolidation of metrics
- eck: elk :)

Backups:
- velero: backups

Scaling & State:
- reloader: re-apply configs
- keda: scale applications
- karpenter (if on AWS, Azure have it by default): scale nodes

All of this should be managed through a single ArgoCD application called "cluster-apps" or similar.

Tools like Jsonnet and Kustomize are your best friends here.

(read about the app-of-apps pattern too)
((no i do not like applicationsets))

## Application Configuration

Your application configuration repositories should be standartized.

A well-thought-of application configuration repository is no different than the infrastructure, or the platform repositories.

You should again think in the following direction:
- releases: packages
- libs: building blocks for /releases
- deployments: calling your packages

You see, the same concept applies over and over again -- manageability, readibility, and standartization.

I usually go for Jsonnet, but I wanted something simpler, so I went for Kustomize, only to find myself in a very thight situation, and ultimately decided upon with Helm.

Jsonnet is awesome, but it often requires a lot of special expertise and in case your main engineer leaves, it is possible you're going to have problems finding adequate peresonel.

## CI/CD

Since we are mostly relying on GitOps for our platform, the CI/CDs worth mentioning are:

- infrastructure:
  - terraform plan/apply: one pipeline per resource type (e.g. ${customer}/${region}/${environment}/${logical-group}/${resource-type}-${iteration}/pipeline.yml
  - pipeline-of-pipelines: a global pipeline to manage the update / management of the child pipelines
- application:
  - build & test: well, build and test
  - deploy: since we're relying on GitOps, our deploy is a single git line change :)
- k8s-cluster-configuration:
  - a pipeline to bootstrap the master argocd (optional, since you are *allowed* to do this through Terraform the first time :))
 
Notable mentions include:

- kubent: kube no trouble
- opa policy-bound pipelines: hard, but very rewarding if done correctly

## Preview Environments

Preview environments are environments that are automatically spun up.

In our case, we do this through Pull Requests.

On every pull request against a branch, a label kicks in, and ArgoCD (through ApplicationSets... *angry*) creates a new application and automatically syncs it. After that, through the use of ASO (Azure Service Operator) we provision a database.

Upon a pull request close, the application is automatically deleted, and with it, the resource managed through ASO, too.

Two other possible ways to achieve this are:
- cnpg operator: it connects to a live database, dumps the database, and provisions it. Authentication happens through external secrets.
- PVC + Snapshot

With preview (or dynamic as I like to call them) environments, developers have instant access to a staging environment, automatically provisioned for them, with their pull request. Very powerful.

## Subtleties

Here are important subtleties many engineering teams, even though good, often fail to deliver on:

- ArgoCD configuration: should happen programmatically, this is a common chicken-egg problem, which I personally solve by having the entire ArgoCD helm locally, pointing to it from inside the ArgoCD, which I provision through CI/CD manually the first time. This applies to the master CI/CD. In a child-instances configuration, all child ArgoCDs are managed through the master. Through GIT. Then the rest, like projects, groups, roles, policies... all should happen in your k8s repository.
- Cluster Apps: I use the app-of-apps pattern, which I achieve with either Kustomize or Jsonnet. Kustomize is often easier to maintain. I do not use ApplicationSets because it is harder to apply my name suffix & variability philosophies there.
- State: Always remote
- IAM: Always in either Terraform or the k8s (for ArgoCD) repos. Always add to groups. Do not apply one-time assignments.
- Secrets: I always strive to use OIDC. Expired secrets suck and OIDC is an incredible technology that solves this.

Another important thing is expertise. I personally have been shooting educational videos of how our entire platform works, every couple of months. I have also made the following docs:

- required-tools.md: kubectx/kubens, az cli, tf cli, etc. etc.
- onboarding.md: here I explain the concept of variability, the variables for our organization, and link to a short video where I demo the concept by finding a resource in both Azure and in the Terraform repository, and make a small application configuration through the k8s repo, and an application repo.

Those have proven to be very valuable as we onboarded 10+ people through them.

So.. the conclusion is, "find someone who is willing to teach".

## Closing

Thank you for reading and I hope you learned something, got inspired, or fired up. Either way, I enjoyed writing this.

---

Denis

out 🫡

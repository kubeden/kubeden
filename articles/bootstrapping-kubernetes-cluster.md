# Simple And Fully Automated Kubernetes Bootstrapping with DigitalOcean & Cloudflare

This is a straight to the point practical article about bootstrapping a Kubernetes cluster into a fully functional production environment using DigitalOcean and Cloudflare.

All of the files here are also available on my [Github repository](https://github.com/kubeden/kubeden) so you can use it as a mirror / template to compare to.

**Technologies Used:**
- Cloudflare
- DigitalOcean
- Kubernetes (1.29.0)
- ArgoCD (v2.9.18)
- Ingress Nginx (Helm 4.9.0)
- Cert Manager (v1.13.3)
- Grafana (Helm 8.3.2)
- Sealed Secrets (v2.16.0)
- External DNS (8.0.2)
- Terraform (CLI v1.9.2)

**Prerequisites:**
- Github Account
- Cloudflare account with at least 1 domain managed
- DigitalOcean account (you can get free $200 - [here](https://m.do.co/c/0afa6ab0aa5a)
- Terraform CLI installed - [install instructions](https://developer.hashicorp.com/terraform/tutorials/aws-get-started/install-cli)
- Kubectl Installed - [install instructions](https://kubernetes.io/docs/tasks/tools/)
- Kubectx/Kubens Installed [install instructions](https://github.com/ahmetb/kubectx?tab=readme-ov-file#installation)
- ArgoCD CLI installed [install instructions](https://argo-cd.readthedocs.io/en/stable/getting_started/#2-download-argo-cd-cli)
- Doctl CLI installed and authenticated [install instructions](https://docs.digitalocean.com/reference/doctl/how-to/install/)

## Initial Set Up (GitHub + API Keys)

Since we are going to introduce GitOps techniques to handle our Kubernetes bootstrapping, we need a GIT repository. Read more about [GitOps here](https://about.gitlab.com/topics/gitops/).

**DigitalOcean API Token:**
- Log into your account and navigate to [DigitalOcean API Tokens](https://cloud.digitalocean.com/account/api/tokens).
- Click **Generate New Token**
	- Token Name: [your_token_name]
	- Expiration: 30 days
	- Scopes: Full Access
- Click on **Generate Token**
- Copy the token and save it somewhere

> DO NOT SHARE THIS TOKEN WITH ANYONE! Anyone with the token is able to create resources in your account programmatically and this can generate a huge bill for you.

**Cloudflare API Token:**
- Log into your Cloudflare account and navigate to [Cloudflare API Tokens](https://dash.cloudflare.com/profile/api-tokens/) 

## Configure Terraform

In short, Terraform is an Infrastructure as Code tool to manage infrastructure in your codebase declaratively. Read more about Terraform on [this link](https://developer.hashicorp.com/terraform/intro).

Create a new directory named *terraform*. Inside the repository, create two files:

*terraform/kubernetes.tf*
```
resource  "digitalocean_kubernetes_cluster"  "cluster" {
	name  =  "kubeden"
	region  =  "fra1"
	version  =  "1.29.0-do.0"
	node_pool {
		name  =  "kubeden"
		size  =  "s-1vcpu-2gb"
		node_count  =  2
	}

}
```

*terraform/provider.tf*
```
terraform {
	required_providers {
		digitalocean  =  {
		source  =  "digitalocean/digitalocean"
		version  =  "~> 2.0"
		}
	}
}

provider  "digitalocean" {
	token  = var.do_token
}

variable  "do_token" {}
```

Go inside the directory and run the following commands:

```
terraform init
terraform apply
```

You will be prompted for your token, paste it there, and input *yes*.

And there you have it. Your cluster is now *(after 5 minutes)* up and running.

## Configure Kubernetes Manifests

For the Kubernetes configuration, we are going to use ArgoCD to introduce a GitOps approach to our cluster management. In short GitOps is a technique of introducing state into your application management and utilising GIT as a "single source of truth".

Now practice.

Create the following directory structure:

```
kubernetes/
├─ argocd/
│  ├─ platform/
│  │  ├─ cluster-app-of-apps.yml
│  │  ├─ sealed-secrets/
│  │  │  ├─ application.yml
│  │  │  ├─ values-override.yml
│  │  ├─ cert-manager/
│  │  │  ├─ application.yml
│  │  │  ├─ values-override.yml
│  │  ├─ external-dns/
│  │  │  ├─ application.yml
│  │  │  ├─ values-override.yml
│  │  ├─ grafana/
│  │  │  ├─ application.yml
│  │  │  ├─ values-override.yml
│  │  ├─ ingress-nginx/
│  │  │  ├─ values-override.yml
│  │  │  ├─ application.yml
```

*cluster-app-of-apps.yml*

```
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: cluster-app-of-apps
  namespace: argocd
spec:
  project: default
  source:
    repoURL: https://github.com/[your-github-username]/[your-repository].git
    targetRevision: HEAD
    path: kubernetes/argocd/platform
    directory:
      exclude: '**/configs/*'
      recurse: true
  destination:
    server: https://kubernetes.default.svc
    namespace: argocd
  ignoreDifferences:
    - group: argoproj.io
      kind: Application
      jsonPointers:
        - /spec/source/targetRevision
```

### Cert Manager

*kubernetes/argocd/platform/cert-manager/application.yaml*

```
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: cert-manager
  namespace: argocd
spec:
  project: default
  source:
    repoURL: https://charts.jetstack.io
    targetRevision: v1.13.3  # Replace with your desired version
    chart: cert-manager
    helm:
      releaseName: cert-manager
      valueFiles:
        - https://raw.githubusercontent.com/[your-github-username]/[your-repository]/main/kubernetes/argocd/platform/cert-manager/values-override.yaml
  destination:
    server: https://kubernetes.default.svc
    namespace: cert-manager
  syncPolicy:
    syncOptions:
      - CreateNamespace=true
```

*kubernetes/argocd/platform/cert-manager/values-override.yaml*

```
installCRDs: true
clusterIssuers:
  - name: letsencrypt-staging
    spec:
      acme:
        server: https://acme-staging-v02.api.letsencrypt.org/directory
        email: [your email address]
        privateKeySecretRef:
          name: letsencrypt-staging
        solvers:
        - http01:
            ingress:
              class: nginx
  - name: letsencrypt-prod
    spec:
      acme:
        server: https://acme-v02.api.letsencrypt.org/directory
        email: [your email address]
        privateKeySecretRef:
          name: letsencrypt-prod
        solvers:
        - http01:
            ingress:
              class: nginx
```

### External DNS

*kubernetes/argocd/platform/external-dns/application.yaml*

```
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: external-dns
  namespace: argocd
spec:
  project: default
  source:
    repoURL: https://charts.bitnami.com/bitnami
    targetRevision: 8.0.2
    chart: external-dns
    helm:
      releaseName: external-dns
      valueFiles:
        - https://raw.githubusercontent.com/pyour-github-username]/[your-repository]/main/kubernetes/argocd/platform/external-dns/values-override.yaml
  destination:
    server: https://kubernetes.default.svc
    namespace: external-dns
  syncPolicy:
    syncOptions:
      - CreateNamespace=true
```

*kubernetes/argocd/platform/external-dns/values-override.yaml*

```
provider: cloudflare
cloudflare:
  secretName: cloudflare-api-token
  proxied: true
  email: [your-cloudflare-email-address]
txtOwnerId: "[your-github-username]-k8s"
policy: sync
sources:
  - ingress
domainFilters:
  - [your-domain.com]
annotationFilter: kubernetes.io/ingress.class=nginx
rbac:
  create: true
  clusterRole: true
serviceAccount:
  create: true
  name: external-dns
```

### Grafana

*kubernetes/argocd/platform/grafana/application.yaml*

```
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: grafana
  namespace: argocd
spec:
  project: default
  source:
    repoURL: https://grafana.github.io/helm-charts
    targetRevision: 8.3.2
    chart: grafana
    helm:
      releaseName: grafana
      valueFiles:
        - https://raw.githubusercontent.com/[your-github-username]/[your-repository]/main/kubernetes/argocd/platform/grafana/values-override.yaml
  destination:
    server: https://kubernetes.default.svc
    namespace: monitoring
  syncPolicy:
    syncOptions:
      - CreateNamespace=true
```

### Ingress Nginx

*kubernetes/argocd/platform/ingress-nginx/application.yaml*

```
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: ingress-nginx
  namespace: argocd
spec:
  project: default
  source:
    repoURL: https://kubernetes.github.io/ingress-nginx
    targetRevision: 4.9.0
    chart: ingress-nginx
    helm:
      releaseName: ingress-nginx
  destination:
    server: https://kubernetes.default.svc
    namespace: nginx
```

### Sealed Secrets

*kubernetes/argocd/platform/sealed-secrets/application.yaml*

```
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: sealed-secrets
  namespace: argocd
spec:
  project: default
  source:
    repoURL: https://bitnami-labs.github.io/sealed-secrets
    targetRevision: v2.16.0
    chart: sealed-secrets
    helm:
      releaseName: sealed-secrets
      valueFiles:
        - https://raw.githubusercontent.com/[your-github-username]/[your-repository]/main/kubernetes/argocd/platform/sealed-secrets/values-override.yaml
  destination:
    server: https://kubernetes.default.svc
    namespace: sealed-secrets
  syncPolicy:
    syncOptions:
      - CreateNamespace=true
```

*kubernetes/argocd/platform/sealed-secrets/values-override.yaml*

```
fullnameOverride: "sealed-secrets-controller"

resources:
  requests:
    cpu: 50m
    memory: 64Mi
  limits:
    cpu: 200m
    memory: 256Mi

service:
  type: ClusterIP
  port: 8080

rbac:
  create: true

secretName: "sealed-secrets-key"

controller:
  replicas: 1
  logLevel: info

metrics:
  serviceMonitor:
    enabled: false
```

And with this you are ready to start deploying.

## Deploy Everything

Now. We are going to deploy and your application and your application will be broken. This is fine, we are going to handle it. Here is what is going to happen:

1. Connect to your cluster
2. Deploy ArgoCD on your cluster from your CLI
3. Port-Forward your ArgoCD service locally on localhost:8080
4. Deploy your *broken* apps
5. Create the external DNS secret & ArgoCD ingress

### Connect to your cluster

Open your DigitalOcean dashboard and navigate to your cluster. Copy the cluster name and open up your terminal. Input the following:

```
doctl kubernetes cluster kubeconfig save [your-cluster-name]
```

You now have your Kubernetes cluster's config merged into your local [.kube/config](https://rke.docs.rancher.com/kubeconfig#:~:text=A%20kubeconfig%20file%20is%20a,tool%20(or%20other%20clients).).

### Deploy ArgoCD on your Cluster

Open up your terminal and execute the following commands:

```
kubectx
```

The output of this command will contain one entry. This is your cluster name.

Continue with execution of the following commands:

```
kubectx [cluster name]
kubectl create namespace argocd
kubens argocd
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/v2.9.18/manifests/install.yaml
```

Now you are ready to deploy.

### Deploying Our Applications

Navigate to /kubernetes/argocd/platform and enter the following command:

```
kubectl apply -f cluster-app-of-apps.yaml
```

### ArgoCD Ingress & External DNS Secret

You need to create your own ingress and external secret for your ArgoCD cluster to work and be able to deploy DNS records into your Cloudflare DNS zone.

Create a file *argocd-ingress.yaml* and populate it with the following manifest:

```
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  annotations:
    cert-manager.io/cluster-issuer: letsencrypt-prod
    nginx.ingress.kubernetes.io/backend-protocol: HTTPS
    nginx.ingress.kubernetes.io/force-ssl-redirect: "true"
    external-dns.alpha.kubernetes.io/hostname:  argocd.[your-domain.com]
    kubernetes.io/ingress.class:  nginx
  name: argocd-ingress
  namespace: argocd
spec:
  rules:
  - host: argocd.[your-domain.com]
    http:
      paths:
      - backend:
          service:
            name: argocd-server
            port:
              number: 443
        path: /
        pathType: Prefix
  tls:
  - hosts:
    - argocd.[your-domain.com]
    secretName: argocd-[your-domain-without-the-extension]-tls
```

Now create a file named *external-dns-secret.yaml*:

> Note: your cloudflare API token should have the following permissions set in the Cloudflare dashboard:
> - Zone: Read
> - DNS: Write
> - DNS: Read

```
apiVersion: v1
kind: Secret
metadata:
  name: cloudflare-api-token
  namespace: external-dns
type: Opaque
stringData:
  cloudflare_api_token: [your-cloudflare-api-token]
```

Now apply the two files with:

```
kubectl apply -f argocd-ingress.yaml
kubectl apply -f external-dns-secret.yaml
```

### Monitor The Deployment

Now you need to port-forward your ArgoCD service and monitor the health status of your applications.

In your terminal execute the following command:

```
kubectl port-forward svc/argocd-server 8080:80 -n argocd
```

Open a browser and navigate to **localhost:8080**

You will be greeted with a login screen and to get the initial admin password, type the following command in your terminal:

```
kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | base64 -d
```

Copy the output and authenticate to your ArgoCD instance.

From here, watch your applications go green.

## Conclusion

Well, now you have a somewhat working cluster. Bootstrapped. Well, I apologise for what I am about to say but this is only the beginning. You need to introduce a better management of the cluster-app applications generation and add the functionality to be able to add up custom resources to your applications. You also need to add Kustomize or Jsonnet to handle multiple environments.

Anyway... the list could go on and on. I might turn this into a series if there is demand. In short, if you are required to work with concepts from this post, let me know on [X/Kuberdenis](https://x.com/kuberdenis) or by [email](dennis@kubeden.io) and I will prioritise this.

Thanks for your time and good luck forward!

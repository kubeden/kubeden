# Introduction to Jsonnet: The YAML/JSON templating language

Welcome to the first tutorial in my series on Jsonnet, a powerful tool that offers a unique approach to JSON and YAML templating. Jsonnet is particularly useful in scenarios like configuration management, especially when dealing with complex setups in Kubernetes. In this tutorial, we'll cover the basics of Jsonnet by building a simple Kubernetes application deployment.

## Prerequisites

- kubectl cli: [link](https://kubernetes.io/docs/tasks/tools/install-kubectl/)
- jsonnet cli: [link](https://github.com/google/jsonnet)
- code repository: [link](https://github.com/kubeden/tutorials/tree/main/jsonnet/introduction-to-jsonnet)

p.s. For this tutorial, you don't need a Kubernetes cluster as we will not be deploying anything. You will just be generating the manifests and learn how the programming language works.

## What is Jsonnet?

Jsonnet is a data templating language designed to enhance JSON. It allows you to write more concise and maintainable code for generating JSON (or YAML) configurations. The key features include functions, variables, conditionals, and arithmetic operations, which are not available in plain JSON.

## Our Example Project

We'll demonstrate Jsonnet's capabilities through a practical example: deploying a web application in Kubernetes. Our project structure is as follows:

> The code in this tutorial is stationed in my Github repository - [here](https://github.com/kubeden/tutorials/tree/main/jsonnet/introduction-to-jsonnet)

- */libs/deployment.libsonnet*: Defines a basic deployment template.
- */libs/ingress.libsonnet*: Sets up an ingress for our application.
- */libs/service.libsonnet*: Contains templates for ClusterIP and LoadBalancer services.
- */jsonnet-syntax/dev/apps.jsonnet & /jsonnet-syntax/prd/apps.jsonnet*: Application-specific deployment configurations for different environments (development and production).
- *parameters.libsonnet*: Holds parameters for our application, such as app name, environment, and image tags.

## Step 0: Sharing my way of structuring a Jsonnet project

As any other programming language, there are ways you can structure your project. I like to structure my Jsonnet projects in the following way:

- */libs*: Contains all the Jsonnet libraries that are shared across all applications.
- */application*: Contains all the Jsonnet files that are specific to an application.
- */application/environment*: Contains all the Jsonnet files that are specific to an application's environment.

Of course this could differ but I find this structure to be the easiest to follow.

When I start my project, I first create the */libs* folder and add all the Jsonnet libraries that are shared across all applications. I configure the libraries, test the syntax, and then move on to the application-specific Jsonnet files.

With this little theory in mind, let's start with the first step.

## Step 1: Understanding Jsonnet Templates

First, let's look at *'/libs/deployment.libsonnet'*:

```
{
  basicDeployment(p):: {
    // ... Kubernetes deployment JSON here ...
  },
}
```

This file defines a Jsonnet object with a function **'basicDeployment'** that takes a parameter **'p'**. This function generates a Kubernetes deployment configuration.

Next, let's look at *'/libs/service.libsonnet'*:

```
{
  ClusterIP(p):: {
    // ... Kubernetes ClusterIP service JSON here ...
  },
  LoadBalancer(p):: {
    // ... Kubernetes LoadBalancer service JSON here ...
  },
}
```

Notice how in this file we define two functions: **'ClusterIP'** and **'LoadBalancer'**. Each function takes a parameter **'p'** and generates a Kubernetes service configuration. This gives us the flexibility to generate different types of services from the same template.

Finally, let's look at *'/libs/ingress.libsonnet'*:

```
{
  basicIngress(p):: {
    // ... Kubernetes ingress JSON here ...
  },
}
```

This file defines a function **'basicIngress'** that takes a parameter **'p'** and generates a Kubernetes ingress configuration.

## Step 2: Using Parameters

If you look in all three libary files, you'll notice that passing parameters is as easy as:
    
```
{
    basicDeployment(p):: {
        // ... Kubernetes deployment JSON here ...
        name: p.appName,
        replicas: p.replicas,
        // ... more JSON here ...
        ports: [
        {
            containerPort: p.port
        }
        ],
    }
}
```

In **'/jsonnet-syntax/prd/parameters.libsonnet'**, we define our application parameters:

```
{
  appName: 'app1',
  environment: 'prd',
  replicas: 3,
  port: 8080,
  imageTag: 'latest',
}
```

These parameters are passed to our deployment templates to generate environment-specific configurations.

## Step 3: Generating Configuration Files

The /jsonnet-syntax/prd/apps.jsonnet file combines our templates and parameters:

```
local deployment = import '../../libs/deployment.libsonnet';
local service = import '../../libs/service.libsonnet';
local ingress = import '../../libs/ingress.libsonnet';
local params = import 'parameters.libsonnet';

{
  app1: {
    deployment: deployment.basicDeployment(params),
    service: service.ClusterIP(params),
    ingress: ingress.basicIngress(params),
  },
}
```

Here, we import our templates and parameters, then use them to define a complete set of configurations for our application.

## Running Jsonnet

To generate the JSON/YAML configurations from Jsonnet templates, you'll use the Jsonnet command-line tool. For example:

```
jsonnet /jsonnet-syntax/prd/apps.jsonnet

or respectively

jsonnet /jsonnet-syntax/dev/apps.jsonnet
```

Or if you want to generate YAML:

```
jsonnet -o yaml /jsonnet-syntax/prd/apps.jsonnet

or respectively

jsonnet -o yaml /jsonnet-syntax/dev/apps.jsonnet
```

## Conclusion

In this tutorial, we've introduced Jsonnet and demonstrated how it can simplify the process of creating complex JSON configurations, like those needed for Kubernetes deployments. 

We've covered the basics of Jsonnet syntax, templates, and parameterization. In upcoming tutorials, we'll jump deeper into Jsonnet's advanced features like functions, loops, and kubernetes plugins, and explore more complex use cases.

P.S.

I tried a more unconventional way of writing a blog post this time. I created my code, tested if it works, and fed it all to ChatGPT. I asked it to create the blog post for me and in my opinion it turned out quite dry. Although... I start to think that maybe for tutorials, it would be easier for you as a reader to understand if it is quick and straight to the point. Let me know what you think in the comments.

Follow me on [x](https://x.com/kubeden) for more tutorials on Jsonnet and Kubernetes!

Here's today's closing GIF:

![gif template](https://media.giphy.com/media/oyTDXyxVT9hMoOj5ID/giphy.gif)
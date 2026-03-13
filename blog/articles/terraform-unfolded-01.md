# Terraform unfolded: Variables, Locals, Outputs, Module (and cheatsheet)

## Prerequisites
* DigitalOcean account
* VS Code

## Introduction

Hi there, users! I recently made a blog post focused on [Terraform for beginners](https://dev.to/denislav__/terraform-for-beginners-installation-and-provisioning-a-resource-on-digitalocean-407c) where I went over what IAC (infrastructure as code) is, what Terraform is, and what Variables & Outputs are. In this post, we will dive a little deeper and turn you into a Terraform master!

I will be using [DigitalOcean](https://www.digitalocean.com/) as a cloud provider to test my Terraform code and input screenshots. You can support me by using my referral to register - [here](https://m.do.co/c/0afa6ab0aa5a). Thank you and I hope you enjoy the post & learn something!

## Variables

Variables are pretty self-explanatory. They are like children who always ask questions. They are always like "What is the name of this; What is the name of that?". And once you tell them what the name of the stuff they are asking for is, they can continue on with their day.

We usually use variables in modules when we want to re-use certain pieces of code but for N-number of resources. We define the variables IN the folder/directory our module is:

![variables-folder](https://dev-to-uploads.s3.amazonaws.com/i/3t1jmp9zpvnvqtlc5wwl.png) 

We are defining variable with the following block:

```
variable "some_variable" {
    default = ""
}
```

The *default* is the default value of the variable. Usually, when I am using variables, I am leaving the default a blank string and work it from there.

## Outputs

Outputs are basically information being exported once your script finishes (or after). You can export all kinds of data and for the sake of this tutorial, I will export the IPv4 address of my newly created droplet:

![outputs-cli](https://dev-to-uploads.s3.amazonaws.com/i/8d27oi4z7n6kbj4qoe8h.png) 

The syntax for writing outputs is the following:

```
output "output_name" {
    value = output.value
}
```

## Locals

Locals are (in my opinion) variables but when you don't need to change the variable (local) VALUE, however when you still need to re-use it. If we were to use variables, we are would be changing the value constantly to match our new resource. With locals, we understand we will have to use the same value more than an N-number of times, so we just create a local.

We are defining a local with the following block:

```
locals {
    local_name = "local_value"
}
```

Okay, I think you got it:
* Variables - key-value pair, with the value being changed.
* Locals    - key-value pair, with the key being changed.

## Modules

Oh, my. What a great topic - MODULES! Well, imagine you have to provision infrastructure with 10 VMs, each of which being paired with a load balancer. Oh god, your *main.tf* file's lines would be in the HUNDREDS, even in the thousands if you need to provision more. Well, user, there's a solution! It's called **creating a module**.

Modules are reusable pieces of code, where you make use of variables. To create a module, we first need to create a new folder in which we store our *main.tf* file for the module:

![module-folder-structure](https://dev-to-uploads.s3.amazonaws.com/i/zutqu2mr0ugdbrw0kdsr.png) 

Now, we have to **call** the module in our MAIN *main.tf* file. We do so by inserting the following block:

```
module "module_name" {
    source = "/path/to/module"
}
```

Okay, so if we want to create 2 different droplets, we will create a module, and we will create an N-number of variables in it. Then we will call it on our MAIN *main.tf* file. It goes like this:

```
module "droplet_01" {
    source = "/path/to/module"
    
    droplet_name = "droplet-name-1"
    droplet_region = "nyc1"
}

module "droplet_02" {
    source = "/path/to/module"

    droplet_name = "droplet-name-2"
    droplet_region = "nyc2"
}
```

What we did with the following code was to:
* Create a droplet in the Ney York City 1 region with the name being droplet-name-1.
* Create the second droplet, again in the New York City 1 region with its name being droplet-name-2.

And that's basically it. That's modules.

Take a look at a couple of screenshots to get to understand more about how they are being used:

Module creation - it happens in a different directory than the MAIN *main.tf* file:

![module-creation](https://dev-to-uploads.s3.amazonaws.com/i/epcwveqwpumibt7e03c7.png) 

Module variables:

![module-variables](https://dev-to-uploads.s3.amazonaws.com/i/hkltndcc2jy5staazmrh.png) 

Module definition:

![module-definition](https://dev-to-uploads.s3.amazonaws.com/i/pxc6yk4vcqs382055wnr.png) 

## Bonus

In the last section of my post, I want to give you a cheat-sheet so if you ever forget something, you will always be backed:

1. Variables - they are used when you want to reuse a module and you only want to change the value from the key-value pair. The syntax is the following:

```
variable "variable_name" {
    default = ""
}
```

2. Locals - they are used when you want to make use of a 'variable' N-number of times. You don't change the value, but you are using it in different places. The syntax is the following:

```
locals {
    local_name = "local_value"
}
```

3. Outputs - outputs are a way for you to extract information from your infrastructure in the terminal when (or after) you create a resource. The syntax is the following:

```
output "output_name" {
    value = output.value
}
```

4. Modules - modules are re-usable pieces of code. Example - I want to create 5 VMs, I create a module, and re-use it in my MAIN *main.tf* file. The syntax is the following:

```
module "module_name" {
    source = "/path/to/module"
}
```

Right, that's it, user. Once again, I hope you learned something today and if you want to know more about Terraform and IaC (Infrastructure as Code), make sure to check my other [post](https://dev.to/denislav__/terraform-for-beginners-installation-and-provisioning-a-resource-on-digitalocean-407c)

Stay safe!
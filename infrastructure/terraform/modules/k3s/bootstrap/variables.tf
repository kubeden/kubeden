variable "cluster_name" {
  description = "Cluster name used to derive Kubernetes node names."
  type        = string
}

variable "create_apps_node" {
  description = "Whether to bootstrap a dedicated applications node."
  type        = bool
  default     = true
}

variable "ssh_user" {
  description = "SSH user used to connect to the nodes."
  type        = string
  default     = "root"
}

variable "ssh_private_key_path" {
  description = "Path to the private SSH key used for node access."
  type        = string

  validation {
    condition     = fileexists(var.ssh_private_key_path)
    error_message = "Set ssh_private_key_path to an existing private key file."
  }
}

variable "system_public_ipv4" {
  description = "Public IPv4 of the k3s server node."
  type        = string
}

variable "system_private_ipv4" {
  description = "Private IPv4 of the k3s server node."
  type        = string
}

variable "apps_public_ipv4" {
  description = "Public IPv4 of the k3s agent node when enabled."
  type        = string
  default     = null
  nullable    = true
}

variable "apps_private_ipv4" {
  description = "Private IPv4 of the k3s agent node when enabled."
  type        = string
  default     = null
  nullable    = true
}

variable "k3s_channel" {
  description = "k3s release channel to install."
  type        = string
  default     = "stable"
}

variable "cluster_token" {
  description = "Optional fixed k3s cluster token. Leave null to let the server generate one."
  type        = string
  default     = null
  sensitive   = true
  nullable    = true
}

variable "server_extra_args" {
  description = "Additional flags appended to the k3s server install command."
  type        = string
  default     = ""
}

variable "agent_extra_args" {
  description = "Additional flags appended to the k3s agent install command."
  type        = string
  default     = ""
}

variable "ssh_timeout" {
  description = "Timeout for SSH connections used by Terraform provisioners."
  type        = string
  default     = "5m"
}

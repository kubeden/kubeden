variable "cluster_name" {
  description = "Cluster name used as a prefix for Hetzner resources."
  type        = string
}

variable "location" {
  description = "Hetzner location for both nodes."
  type        = string
}

variable "network_zone" {
  description = "Hetzner network zone for the private subnet."
  type        = string
}

variable "network_cidr" {
  description = "RFC1918 CIDR for the cluster private network."
  type        = string
}

variable "subnet_cidr" {
  description = "CIDR for the Hetzner cloud subnet attached to the nodes."
  type        = string
}

variable "system_private_ip" {
  description = "Private IPv4 for the system node."
  type        = string
}

variable "apps_private_ip" {
  description = "Private IPv4 for the applications node when enabled."
  type        = string
}

variable "create_apps_node" {
  description = "Whether to create a dedicated applications node."
  type        = bool
  default     = true
}

variable "ssh_key_names" {
  description = "Existing Hetzner Cloud SSH key names to inject into both servers."
  type        = list(string)

  validation {
    condition     = length(var.ssh_key_names) > 0
    error_message = "Set at least one Hetzner Cloud SSH key name in ssh_key_names."
  }
}

variable "server_image" {
  description = "Hetzner image used for both servers."
  type        = string
  default     = "ubuntu-24.04"
}

variable "system_server_type" {
  description = "Hetzner server type for the system node."
  type        = string
  default     = "cpx32"
}

variable "apps_server_type" {
  description = "Hetzner server type for the applications node when enabled."
  type        = string
  default     = "cpx32"
}

variable "enable_ipv6" {
  description = "Whether to enable public IPv6 on the nodes."
  type        = bool
  default     = false
}

variable "enable_backups" {
  description = "Whether to enable Hetzner backups on the servers."
  type        = bool
  default     = false
}

variable "enable_delete_protection" {
  description = "Whether to enable delete and rebuild protection on the servers and network."
  type        = bool
  default     = false
}

variable "admin_cidrs" {
  description = "Public CIDRs allowed to reach SSH and the k3s API."
  type        = list(string)
  default     = ["0.0.0.0/0", "::/0"]
}

variable "public_ingress_cidrs" {
  description = "Public CIDRs allowed to reach HTTP and HTTPS on the system node."
  type        = list(string)
  default     = ["0.0.0.0/0", "::/0"]
}

variable "labels" {
  description = "Additional labels applied to all resources."
  type        = map(string)
  default     = {}
}

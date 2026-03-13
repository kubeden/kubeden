output "cluster_name" {
  description = "Cluster name used for the Hetzner infrastructure."
  value       = local.cluster_name
}

output "create_apps_node" {
  description = "Whether the dedicated applications node is enabled."
  value       = local.create_apps_node
}

output "network_id" {
  description = "Hetzner network ID."
  value       = module.k3s.network_id
}

output "system_server_id" {
  description = "Hetzner server ID of the system node."
  value       = module.k3s.system_server_id
}

output "apps_server_id" {
  description = "Hetzner server ID of the applications node."
  value       = module.k3s.apps_server_id
}

output "system_public_ipv4" {
  description = "Public IPv4 of the system node."
  value       = module.k3s.system_public_ipv4
}

output "apps_public_ipv4" {
  description = "Public IPv4 of the applications node."
  value       = module.k3s.apps_public_ipv4
}

output "system_private_ipv4" {
  description = "Private IPv4 of the system node."
  value       = module.k3s.system_private_ipv4
}

output "apps_private_ipv4" {
  description = "Private IPv4 of the applications node."
  value       = module.k3s.apps_private_ipv4
}

output "system_ssh_command" {
  description = "Convenience SSH command for the system node."
  value       = module.k3s.system_ssh_command
}

output "apps_ssh_command" {
  description = "Convenience SSH command for the applications node."
  value       = module.k3s.apps_ssh_command
}

output "network_id" {
  description = "Hetzner network ID."
  value       = hcloud_network.cluster.id
}

output "system_server_id" {
  description = "Hetzner server ID of the system node."
  value       = hcloud_server.system.id
}

output "apps_server_id" {
  description = "Hetzner server ID of the applications node when enabled."
  value       = var.create_apps_node ? hcloud_server.apps[0].id : null
}

output "system_public_ipv4" {
  description = "Public IPv4 of the system node."
  value       = hcloud_primary_ip.system_ipv4.ip_address
}

output "apps_public_ipv4" {
  description = "Public IPv4 of the applications node when enabled."
  value       = var.create_apps_node ? hcloud_primary_ip.apps_ipv4[0].ip_address : null
}

output "system_private_ipv4" {
  description = "Private IPv4 of the system node."
  value       = var.system_private_ip
}

output "apps_private_ipv4" {
  description = "Private IPv4 of the applications node when enabled."
  value       = var.create_apps_node ? var.apps_private_ip : null
}

output "system_ssh_command" {
  description = "Convenience SSH command for the system node."
  value       = "ssh root@${hcloud_primary_ip.system_ipv4.ip_address}"
}

output "apps_ssh_command" {
  description = "Convenience SSH command for the applications node when enabled."
  value       = var.create_apps_node ? "ssh root@${hcloud_primary_ip.apps_ipv4[0].ip_address}" : null
}

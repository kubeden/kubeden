output "api_server_url" {
  description = "Public Kubernetes API endpoint."
  value       = "https://${var.system_public_ipv4}:6443"
}

output "kubeconfig_fetch_command" {
  description = "Command that fetches the k3s kubeconfig from the system node and rewrites it to the public API endpoint."
  value       = "ssh -i ${var.ssh_private_key_path} -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null ${var.ssh_user}@${var.system_public_ipv4} 'cat /etc/rancher/k3s/k3s.yaml' | sed 's/127.0.0.1/${var.system_public_ipv4}/'"
}

output "server_bootstrap_id" {
  description = "Terraform ID of the server bootstrap step."
  value       = terraform_data.system.id
}

output "agent_bootstrap_id" {
  description = "Terraform ID of the agent bootstrap step when enabled."
  value       = var.create_apps_node ? terraform_data.agent[0].id : null
}

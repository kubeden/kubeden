output "k3s_api_server_url" {
  description = "Public Kubernetes API endpoint."
  value       = module.k3s_bootstrap.api_server_url
}

output "k3s_kubeconfig_fetch_command" {
  description = "Command that fetches the kubeconfig from the system node."
  value       = module.k3s_bootstrap.kubeconfig_fetch_command
}

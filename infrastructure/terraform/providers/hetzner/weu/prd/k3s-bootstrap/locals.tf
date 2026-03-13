locals {
  ssh_user             = "root"
  ssh_private_key_path = pathexpand("~/.ssh/kubeden-hetzner")

  k3s_channel           = "stable"
  k3s_cluster_token     = null
  k3s_server_extra_args = ""
  k3s_agent_extra_args  = ""
}

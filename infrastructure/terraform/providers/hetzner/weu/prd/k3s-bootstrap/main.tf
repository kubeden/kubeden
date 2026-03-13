data "terraform_remote_state" "k3s" {
  backend = "s3"

  config = {
    bucket = "kubeden"
    key    = "infra/tf/state/weu/prd/k3s/terraform.tfstate"
    region = "fsn1"

    endpoints = {
      s3 = "https://fsn1.your-objectstorage.com"
    }

    use_path_style              = true
    skip_credentials_validation = true
    skip_region_validation      = true
    skip_requesting_account_id  = true
    skip_metadata_api_check     = true
  }
}

locals {
  k3s_state_outputs = data.terraform_remote_state.k3s.outputs
}

module "k3s_bootstrap" {
  source = "../../../../../modules/k3s/bootstrap"

  cluster_name         = local.k3s_state_outputs.cluster_name
  create_apps_node     = local.k3s_state_outputs.create_apps_node
  ssh_user             = local.ssh_user
  ssh_private_key_path = local.ssh_private_key_path
  system_public_ipv4   = local.k3s_state_outputs.system_public_ipv4
  system_private_ipv4  = local.k3s_state_outputs.system_private_ipv4
  apps_public_ipv4     = try(local.k3s_state_outputs.apps_public_ipv4, null)
  apps_private_ipv4    = try(local.k3s_state_outputs.apps_private_ipv4, null)
  k3s_channel          = local.k3s_channel
  cluster_token        = local.k3s_cluster_token
  server_extra_args    = local.k3s_server_extra_args
  agent_extra_args     = local.k3s_agent_extra_args
}

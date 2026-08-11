-- You can add your own plugins here or in other files in this directory!
--  I promise not to create any merge conflicts in this directory :)
--
-- See the kickstart.nvim README for more information
--
return {
  {
    'mattn/emmet-vim',
    ft = { 'html', 'css', 'javascript', 'javascriptreact', 'typescript', 'typescriptreact' },
    init = function()
      -- Must run BEFORE the plugin loads — emmet reads these at source time
      vim.g.user_emmet_mode = 'a' -- enable in all modes (normal, insert, visual)
      vim.g.user_emmet_leader_key = ',' -- change the default <C-Y> leader to ','
    end,
  },
  -- Your other custom plugins can be added here
}

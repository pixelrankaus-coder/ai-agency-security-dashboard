-- Add plugin_site_key to sites table for WordPress plugin integration
-- This allows sites to be linked via the plugin's auto-generated UUID

ALTER TABLE public.sites
ADD COLUMN IF NOT EXISTS plugin_site_key text UNIQUE;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_sites_plugin_site_key
  ON public.sites(plugin_site_key);

-- Add comment
COMMENT ON COLUMN public.sites.plugin_site_key IS 'Auto-generated UUID from WordPress plugin for linking plugin reports to sites';

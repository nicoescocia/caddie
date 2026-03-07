import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://xyruyxfcwxhdyzvrzxqg.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh5cnV5eGZjd3hoZHl6dnJ6eHFnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI3NDU3MDUsImV4cCI6MjA4ODMyMTcwNX0.TRimQGamjH66-LcDK3HKvFWXmUVIbpfr9Lx5Wt7ZWz4'

export const supabase = createClient(supabaseUrl, supabaseKey)
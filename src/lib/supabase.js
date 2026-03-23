import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://qjdgqiolcfmlkqibqcrk.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFqZGdxaW9sY2ZtbGtxaWJxY3JrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg4MzAzNDUsImV4cCI6MjA4NDQwNjM0NX0.Cp4BgbxE5e6GdD_8u9aMRdJpql5xthSDyPsbkgxhjyY'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

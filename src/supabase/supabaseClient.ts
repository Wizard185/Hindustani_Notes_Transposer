// supabaseClient.js
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://onrxwzgoqphpwqybsaim.supabase.co' // replace with your URL
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ucnh3emdvcXBocHdxeWJzYWltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEzNzE0ODYsImV4cCI6MjA2Njk0NzQ4Nn0.Cn1bgieI2ftKhAvs2WYQIuupJY14fyA0wjnYb8M1iWU'
export const supabase = createClient(supabaseUrl, supabaseKey)

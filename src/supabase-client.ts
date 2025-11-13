import { createClient } from '@supabase/supabase-js'


const supabaseUrl = 'https://xcmbsbanwhmpkebzirtf.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhjbWJzYmFud2htcGtlYnppcnRmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEyODU3NzUsImV4cCI6MjA3Njg2MTc3NX0.ouJY48DDqk3IrpZV0CvbdPrf3yyXoMSz8u8kKsRuQAE'


export const supabase = createClient(supabaseUrl, supabaseKey)
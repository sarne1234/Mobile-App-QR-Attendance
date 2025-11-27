import { createClient } from "@supabase/supabase-js";


const supabase_Project_Url = import.meta.env.VITE_SUPABASE_URL;
const supabase_Anon_Key = import.meta.env.VITE_SUPABASE_KEY;


export const supabase = createClient(supabase_Project_Url, supabase_Anon_Key);
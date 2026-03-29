import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://invwzyjqdggwgeqzbkop.supabase.co'
const supabaseKey = 'sb_publishable_6blacl2tjx7p-k--qp0DsQ_XGJhTRUQ'

export const supabase = createClient(supabaseUrl, supabaseKey)
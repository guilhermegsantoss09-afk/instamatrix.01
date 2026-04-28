import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = createClient()
  const { data: accounts } = await supabase
    .from('accounts')
    .select('id, username, display_name, profile_picture, is_active')
    .eq('is_active', true)
  return NextResponse.json({ accounts: accounts || [] })
}

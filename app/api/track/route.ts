import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { share_link_id, event_type, visitor_id, scroll_depth, time_spent_seconds } = body

    if (!share_link_id || !event_type || !visitor_id) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const supabase = await createClient()

    // Get client info
    const userAgent = request.headers.get('user-agent') || null
    const forwardedFor = request.headers.get('x-forwarded-for')
    const ip = forwardedFor ? forwardedFor.split(',')[0] : null
    const referer = request.headers.get('referer') || null

    // Determine device type
    let deviceType = 'desktop'
    if (userAgent) {
      if (/mobile/i.test(userAgent)) deviceType = 'mobile'
      else if (/tablet/i.test(userAgent)) deviceType = 'tablet'
    }

    const { error } = await supabase.from('analytics_events').insert({
      share_link_id,
      event_type,
      visitor_id,
      ip_address: ip,
      user_agent: userAgent,
      referrer: referer,
      device_type: deviceType,
      scroll_depth: scroll_depth || null,
      time_spent_seconds: time_spent_seconds || null,
    })

    if (error) {
      console.error('Analytics tracking error:', error)
      return NextResponse.json({ error: 'Failed to track event' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Analytics API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

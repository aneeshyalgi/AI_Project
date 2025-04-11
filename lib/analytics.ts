interface TrackAnalyticsParams {
  userId: string
  query: string
  responseTime: number
  category?: string
  satisfactionRating?: number
  supabase: any
}

export async function trackAnalytics({
  userId,
  query,
  responseTime,
  category,
  satisfactionRating,
  supabase,
}: TrackAnalyticsParams): Promise<void> {
  try {
    // Insert analytics data into the database
    await supabase.from("analytics").insert({
      user_id: userId,
      query,
      response_time_ms: responseTime,
      category,
      satisfaction_rating: satisfactionRating,
    })
  } catch (error) {
    console.error("Error tracking analytics:", error)
  }
}


import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4"

const VERIFY_TOKEN = Deno.env.get("VERIFY_TOKEN") || "tolla_webhook_verification"
const WHATSAPP_ACCESS_TOKEN = Deno.env.get("WHATSAPP_ACCESS_TOKEN")
const WHATSAPP_PHONE_NUMBER_ID = Deno.env.get("WHATSAPP_PHONE_NUMBER_ID")
const APP_URL = Deno.env.get("APP_URL") || "https://tolla.app"

const supabaseUrl = Deno.env.get("SUPABASE_URL") || ""
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
const supabase = createClient(supabaseUrl, supabaseServiceKey)

serve(async (req: Request) => {
  const { method } = req
  const url = new URL(req.url)

  // 1. Meta Webhook Verification Handshake (GET Request)
  if (method === "GET") {
    const mode = url.searchParams.get("hub.mode")
    const token = url.searchParams.get("hub.verify_token")
    const challenge = url.searchParams.get("hub.challenge")

    if (mode && token) {
      if (mode === "subscribe" && token === VERIFY_TOKEN) {
        console.log("Webhook verified successfully!")
        return new Response(challenge, { status: 200 })
      } else {
        console.error("Verification failed: token mismatch.")
        return new Response("Forbidden", { status: 403 })
      }
    }
    return new Response("Bad Request", { status: 400 })
  }

  // 2. Incoming Messages Webhook (POST Request)
  if (method === "POST") {
    try {
      const body = await req.json()
      
      // Check if this is a WhatsApp status update or actual message
      const entry = body.entry?.[0]
      const changes = entry?.changes?.[0]
      const value = changes?.value
      
      const message = value?.messages?.[0]
      if (!message) {
        // Return 200 to acknowledge status updates or delivery reports from Meta
        return new Response(JSON.stringify({ status: "acknowledged" }), {
          status: 200,
          headers: { "Content-Type": "application/json" }
        })
      }

      const senderPhone = message.from // User's WhatsApp number (e.g., 27833977936)
      const textBody = message.text?.body || ""

      console.log(`[WhatsApp Webhook] Message received from ${senderPhone}: "${textBody}"`)

      // Parse the pattern: "Join <business-slug> <location-id>"
      const match = textBody.match(/Join\s+(\S+)(?:\s+(\S+))?/i)
      if (match) {
        const businessSlug = match[1].trim().toLowerCase()
        const locationId = match[2] ? match[2].trim() : null

        console.log(`Parsed signup: businessSlug="${businessSlug}", locationId="${locationId}"`)

        // 1. Fetch business from Supabase
        const { data: business, error: bizError } = await supabase
          .from("businesses")
          .select("*")
          .eq("slug", businessSlug)
          .is("deleted_at", null)
          .maybeSingle()

        if (bizError || !business) {
          console.error(`Business with slug "${businessSlug}" not found in database.`, bizError)
          return new Response(JSON.stringify({ error: "business_not_found" }), { status: 200 })
        }

        // 2. Determine target Location
        let targetLocation = null
        if (locationId) {
          const { data: loc } = await supabase
            .from("locations")
            .select("*")
            .eq("id", locationId)
            .maybeSingle()
          targetLocation = loc
        }

        if (!targetLocation) {
          // Fallback to first location of this business
          const { data: locs } = await supabase
            .from("locations")
            .select("*")
            .eq("business_id", business.id)
            .limit(1)
          targetLocation = locs?.[0] || null
        }

        if (!targetLocation) {
          console.error(`No locations found for business "${business.name}"`)
          return new Response(JSON.stringify({ error: "location_not_found" }), { status: 200 })
        }

        // 3. Find or Create the Tolla User
        let tollaUser = null
        
        // Search by exact phone
        const { data: existingUser } = await supabase
          .from("tolla_users")
          .select("*")
          .eq("phone_number", `+${senderPhone}`)
          .maybeSingle()

        if (existingUser) {
          tollaUser = existingUser
        } else {
          // Check without the "+" if stored differently
          const { data: existingUserNoPlus } = await supabase
            .from("tolla_users")
            .select("*")
            .eq("phone_number", senderPhone)
            .maybeSingle()
          
          if (existingUserNoPlus) {
            tollaUser = existingUserNoPlus
          }
        }

        if (!tollaUser) {
          // Create new Tolla user
          const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
          let randomCode = ""
          for (let i = 0; i < 6; i++) {
            randomCode += chars.charAt(Math.floor(Math.random() * chars.length))
          }
          const newUserId = `TR-${randomCode}`

          const { data: newUser, error: insertError } = await supabase
            .from("tolla_users")
            .insert({
              id: newUserId,
              phone_number: `+${senderPhone}`,
              name: "Anonymous Advocate",
              marketing_consent: true, // Opt-in implied by scanning and initiating chat
              consent_timestamp: new Date().toISOString(),
              referral_code: newUserId
            })
            .select()
            .single()

          if (insertError) {
            console.error("Failed to insert new tolla_user:", insertError)
            throw insertError
          }
          tollaUser = newUser
        }

        // 4. Create customer business map if not present
        const { data: existingMap } = await supabase
          .from("customer_businesses")
          .select("*")
          .eq("tolla_user_id", tollaUser.id)
          .eq("business_id", business.id)
          .maybeSingle()

        if (!existingMap) {
          const { error: mapError } = await supabase
            .from("customer_businesses")
            .insert({
              tolla_user_id: tollaUser.id,
              business_id: business.id,
              location_id: targetLocation.id,
              referral_score: 0
            })

          if (mapError) {
            console.error("Failed to map customer_businesses:", mapError)
          }
        }

        // 5. Dispatch WhatsApp advocate invite template back to user
        if (WHATSAPP_PHONE_NUMBER_ID && WHATSAPP_ACCESS_TOKEN) {
          const referralLink = `${APP_URL}/r/${tollaUser.id}`
          console.log(`[WhatsApp Webhook] Dispatching welcome template to +${senderPhone}...`)

          const metaRes = await fetch(
            `https://graph.facebook.com/v18.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`,
            {
              method: "POST",
              headers: {
                "Authorization": `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
                "Content-Type": "application/json"
              },
              body: JSON.stringify({
                messaging_product: "whatsapp",
                recipient_type: "individual",
                to: senderPhone,
                type: "template",
                template: {
                  name: "advocate_invite",
                  language: { code: "en_US" },
                  components: [
                    {
                      type: "body",
                      parameters: [
                        { type: "text", text: targetLocation.name },
                        { type: "text", text: referralLink }
                      ]
                    }
                  ]
                }
              })
            }
          )
          
          if (!metaRes.ok) {
            const metaError = await metaRes.text()
            console.error("[WhatsApp Webhook] Meta API template dispatch failed:", metaError)
          } else {
            console.log(`[WhatsApp Webhook] Template invite successfully dispatched!`)
          }
        } else {
          console.error("[WhatsApp Webhook] Meta credentials (ID/Token) are not set inside Edge Function variables.")
        }
      }

      return new Response(JSON.stringify({ status: "processed" }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      })
    } catch (err) {
      console.error("[WhatsApp Webhook] Error processing request:", err)
      return new Response("Internal Server Error", { status: 500 })
    }
  }

  return new Response("Method Not Allowed", { status: 405 })
})

// src/mediqOneApi.js

const SUPABASE_URL = "https://rotbmaxzsdpyhgiacrfo.supabase.co"; // Your project URL
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJvdGJtYXh6c2RweWhnaWFjcmZvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU5OTcyOTYsImV4cCI6MjEwMTU3MzI5Nn0.5JYmpnw30VWTLIjq9aDHurD2A7JaTVETWGIjdo_Zo9g";         // Paste your public anon key here

export async function sendChatMessage(userMessage) {
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/mediq-one-brain`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({ message: userMessage }),
    });

    if (!response.ok) {
      throw new Error(`Server error: ${response.status}`);
    }

    const data = await response.json();
    return data.reply || "I received an empty response.";
  } catch (error) {
    console.error("Error communicating with MediQ One brain:", error);
    return "I'm having trouble connecting to the network right now. Please try again.";
  }
}
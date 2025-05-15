// This is a simple script to seed data
// Run with: node scripts/seed-data.js

const fetch = require("node-fetch")

async function seedData() {
  try {
    const response = await fetch("http://localhost:3000/api/seed-data", {
      method: "POST",
    })

    if (!response.ok) {
      throw new Error(`Failed to seed data: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    console.log("Seed successful:", data)
  } catch (error) {
    console.error("Error seeding data:", error)
  }
}

seedData()

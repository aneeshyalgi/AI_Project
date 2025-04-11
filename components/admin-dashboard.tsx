"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { createBrowserClient } from "@/lib/supabase/client"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

export default function AdminDashboard() {
  const [analyticsData, setAnalyticsData] = useState<any[]>([])
  const [companyData, setCompanyData] = useState<any[]>([])
  const [newDataTitle, setNewDataTitle] = useState("")
  const [newDataContent, setNewDataContent] = useState("")
  const [newDataCategory, setNewDataCategory] = useState("products")
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null)

  const supabase = createBrowserClient()

  // Load analytics data
  useEffect(() => {
    const fetchAnalyticsData = async () => {
      try {
        const { data, error } = await supabase
          .from("analytics")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(100)

        if (error) throw error

        // Process data for charts
        const processedData = processAnalyticsData(data || [])
        setAnalyticsData(processedData)
      } catch (error) {
        console.error("Error fetching analytics data:", error)
      }
    }

    const fetchCompanyData = async () => {
      try {
        const { data, error } = await supabase
          .from("company_data")
          .select("*")
          .order("updated_at", { ascending: false })

        if (error) throw error

        setCompanyData(data || [])
      } catch (error) {
        console.error("Error fetching company data:", error)
      }
    }

    fetchAnalyticsData()
    fetchCompanyData()
  }, [supabase])

  // Process analytics data for charts
  const processAnalyticsData = (data: any[]) => {
    // Group by category
    const categoryData = data.reduce((acc, item) => {
      const category = item.category || "uncategorized"
      if (!acc[category]) {
        acc[category] = 0
      }
      acc[category]++
      return acc
    }, {})

    // Convert to array format for charts
    return Object.entries(categoryData).map(([name, value]) => ({
      name,
      value,
    }))
  }

  // Add new company data
  const handleAddCompanyData = async () => {
    if (!newDataTitle || !newDataContent || !newDataCategory) {
      setMessage({ text: "Please fill in all fields", type: "error" })
      return
    }

    setIsLoading(true)
    setMessage(null)

    try {
      // Insert new company data
      const { error } = await supabase.from("company_data").insert({
        title: newDataTitle,
        content: newDataContent,
        category: newDataCategory,
        keywords: newDataContent.split(" ").slice(0, 5),
      })

      if (error) throw error

      // Generate embeddings by calling the API
      const response = await fetch("/api/seed-data", {
        method: "POST",
      })

      if (!response.ok) {
        throw new Error("Failed to generate embeddings")
      }

      setMessage({ text: "Company data added successfully", type: "success" })
      setNewDataTitle("")
      setNewDataContent("")

      // Refresh company data
      const { data: updatedData } = await supabase
        .from("company_data")
        .select("*")
        .order("updated_at", { ascending: false })

      setCompanyData(updatedData || [])
    } catch (error) {
      console.error("Error adding company data:", error)
      setMessage({ text: "Failed to add company data", type: "error" })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Tabs defaultValue="analytics" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="analytics">Analytics</TabsTrigger>
        <TabsTrigger value="knowledge">Knowledge Base</TabsTrigger>
        <TabsTrigger value="settings">Settings</TabsTrigger>
      </TabsList>

      <TabsContent value="analytics" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Customer Inquiries by Category</CardTitle>
            <CardDescription>Distribution of customer inquiries across different categories</CardDescription>
          </CardHeader>
          <CardContent className="h-[400px]">
            <ChartContainer
              config={{
                value: {
                  label: "Inquiries",
                  color: "hsl(var(--chart-1))",
                },
              }}
              className="h-full"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analyticsData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Legend />
                  <Bar dataKey="value" fill="var(--color-value)" name="Inquiries" />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="knowledge" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Add Knowledge Base Entry</CardTitle>
            <CardDescription>Add new information to the Swisscom knowledge base</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Input placeholder="Title" value={newDataTitle} onChange={(e) => setNewDataTitle(e.target.value)} />
            </div>
            <div className="space-y-2">
              <select
                className="w-full p-2 border rounded-md"
                value={newDataCategory}
                onChange={(e) => setNewDataCategory(e.target.value)}
              >
                <option value="products">Products</option>
                <option value="services">Services</option>
                <option value="support">Support</option>
                <option value="company">Company</option>
                <option value="billing">Billing</option>
              </select>
            </div>
            <div className="space-y-2">
              <Textarea
                placeholder="Content"
                value={newDataContent}
                onChange={(e) => setNewDataContent(e.target.value)}
                rows={5}
              />
            </div>
            {message && (
              <div
                className={`p-2 rounded-md ${message.type === "success" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
              >
                {message.text}
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button onClick={handleAddCompanyData} disabled={isLoading} className="w-full">
              {isLoading ? "Adding..." : "Add to Knowledge Base"}
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Knowledge Base Entries</CardTitle>
            <CardDescription>Current information in the Swisscom knowledge base</CardDescription>
          </CardHeader>
          <CardContent className="h-[400px] overflow-y-auto">
            <div className="space-y-4">
              {companyData.map((item) => (
                <div key={item.id} className="p-4 border rounded-md">
                  <div className="flex justify-between items-center">
                    <h3 className="font-bold">{item.title}</h3>
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">{item.category}</span>
                  </div>
                  <p className="mt-2 text-sm text-gray-600">{item.content}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="settings" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>System Settings</CardTitle>
            <CardDescription>Configure the AI assistant behavior</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-center text-muted-foreground py-6">
              Settings functionality will be implemented in a future update
            </p>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )
}


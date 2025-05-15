"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/use-toast"
import { AlertCircle, BarChart3, Database, FileText, Loader2, Plus, Search, Settings, Tag, Trash2 } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"

type CompanyData = {
  id: string
  category: string
  title: string
  content: string
  keywords: string[]
  created_at: string
}

type AppSettings = {
  voiceLanguage: string
  voiceRate: string
  aiModel: string
  temperature: string
}

export function AdminDashboard({ userId }: { userId: string }) {
  const [companyData, setCompanyData] = useState<CompanyData[]>([])
  const [filteredData, setFilteredData] = useState<CompanyData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null)
  const [newData, setNewData] = useState({
    category: "Products",
    title: "",
    content: "",
    keywords: "",
  })
  const [settings, setSettings] = useState<AppSettings>({
    voiceLanguage: "de-CH",
    voiceRate: "1",
    aiModel: "gpt-4o",
    temperature: "0.7",
  })
  const { toast } = useToast()
  const supabase = createClient()

  // Fetch company data
  const fetchCompanyData = async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase.from("company_data").select("*").order("created_at", { ascending: false })

      if (error) {
        throw error
      }

      setCompanyData(data || [])
      setFilteredData(data || [])
    } catch (error: any) {
      console.error("Error fetching company data:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to fetch company data",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Fetch settings
  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase.from("settings").select("*").eq("user_id", userId).single()

      if (error) {
        if (error.code !== "PGRST116") {
          // PGRST116 is "no rows returned" - not an error for us
          console.error("Error fetching settings:", error)
        }
        return
      }

      if (data) {
        setSettings({
          voiceLanguage: data.voice_language || "de-CH",
          voiceRate: data.voice_rate || "1",
          aiModel: data.ai_model || "gpt-4o",
          temperature: data.temperature || "0.7",
        })
      }
    } catch (error) {
      console.error("Error fetching settings:", error)
    }
  }

  // Filter data when search term or category filter changes
  useEffect(() => {
    if (searchTerm || categoryFilter) {
      const filtered = companyData.filter((item) => {
        const matchesSearch = searchTerm
          ? item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.keywords.some((k) => k.toLowerCase().includes(searchTerm.toLowerCase()))
          : true

        const matchesCategory = categoryFilter ? item.category === categoryFilter : true

        return matchesSearch && matchesCategory
      })

      setFilteredData(filtered)
    } else {
      setFilteredData(companyData)
    }
  }, [searchTerm, categoryFilter, companyData])

  // Load data on mount
  useEffect(() => {
    fetchCompanyData()
    fetchSettings()
  }, [])

  // Seed initial data
  const seedData = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/seed-data", {
        method: "POST", // Make sure this is POST
      })

      if (!response.ok) {
        throw new Error("Failed to seed data")
      }

      toast({
        title: "Success",
        description: "Sample data seeded successfully",
      })

      // Refresh data
      fetchCompanyData()
    } catch (error: any) {
      console.error("Error seeding data:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to seed data",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Add new company data
  const addCompanyData = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Convert keywords string to array
      const keywordsArray = newData.keywords
        .split(",")
        .map((keyword) => keyword.trim())
        .filter((keyword) => keyword)

      // Insert into company_data table
      const { data, error } = await supabase
        .from("company_data")
        .insert([
          {
            category: newData.category,
            title: newData.title,
            content: newData.content,
            keywords: keywordsArray,
          },
        ])
        .select()

      if (error) {
        throw error
      }

      // Generate embedding
      const response = await fetch("/api/generate-embedding", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: data[0].id,
          text: `${newData.title} ${newData.content}`,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to generate embedding")
      }

      toast({
        title: "Success",
        description: "Company data added successfully",
      })

      // Reset form
      setNewData({
        category: "Products",
        title: "",
        content: "",
        keywords: "",
      })

      // Refresh data
      fetchCompanyData()
    } catch (error: any) {
      console.error("Error adding company data:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to add company data",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Delete company data
  const deleteCompanyData = async (id: string) => {
    setIsLoading(true)
    try {
      // Delete embeddings first (due to foreign key constraint)
      const { error: embeddingError } = await supabase.from("embeddings").delete().eq("company_data_id", id)

      if (embeddingError) {
        throw embeddingError
      }

      // Delete company data
      const { error } = await supabase.from("company_data").delete().eq("id", id)

      if (error) {
        throw error
      }

      toast({
        title: "Success",
        description: "Data deleted successfully",
      })

      // Refresh data
      fetchCompanyData()
    } catch (error: any) {
      console.error("Error deleting company data:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to delete data",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Save settings
  const saveSettings = async () => {
    setIsSaving(true)
    try {
      // Check if settings already exist for this user
      const { data: existingSettings, error: checkError } = await supabase
        .from("settings")
        .select("id")
        .eq("user_id", userId)
        .single()

      if (checkError && checkError.code !== "PGRST116") {
        // PGRST116 is "no rows returned" - not an error for us
        throw checkError
      }

      // Prepare settings data
      const settingsData = {
        user_id: userId,
        voice_language: settings.voiceLanguage,
        voice_rate: settings.voiceRate,
        ai_model: settings.aiModel,
        temperature: settings.temperature,
        updated_at: new Date().toISOString(),
      }

      let error

      if (existingSettings) {
        // Update existing settings
        const { error: updateError } = await supabase
          .from("settings")
          .update(settingsData)
          .eq("id", existingSettings.id)
        error = updateError
      } else {
        // Insert new settings
        const { error: insertError } = await supabase.from("settings").insert([settingsData])
        error = insertError
      }

      if (error) {
        throw error
      }

      toast({
        title: "Success",
        description: "Settings saved successfully",
      })
    } catch (error: any) {
      console.error("Error saving settings:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to save settings",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  // Handle settings changes
  const handleSettingChange = (key: keyof AppSettings, value: string) => {
    setSettings((prev) => ({
      ...prev,
      [key]: value,
    }))
  }

  // Get category counts for analytics
  const getCategoryCounts = () => {
    const counts: Record<string, number> = {}
    companyData.forEach((item) => {
      counts[item.category] = (counts[item.category] || 0) + 1
    })
    return counts
  }

  const categoryCounts = getCategoryCounts()
  const totalItems = companyData.length

  return (
    <Tabs defaultValue="knowledge" className="space-y-4">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="knowledge" className="flex items-center gap-2">
          <Database className="h-4 w-4" />
          <span>Knowledge Base</span>
        </TabsTrigger>
        <TabsTrigger value="analytics" className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4" />
          <span>Analytics</span>
        </TabsTrigger>
        <TabsTrigger value="settings" className="flex items-center gap-2">
          <Settings className="h-4 w-4" />
          <span>Settings</span>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="knowledge" className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="md:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div>
                <CardTitle>Knowledge Base</CardTitle>
                <CardDescription>View and manage the Swisscom knowledge base</CardDescription>
              </div>
              <Button variant="outline" onClick={seedData} disabled={isLoading} className="flex items-center gap-2">
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Database className="h-4 w-4" />}
                Seed Sample Data
              </Button>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-4 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search knowledge base..."
                    className="pl-8 border-swisscom-blue/20"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <Select
                  value={categoryFilter || ""}
                  onValueChange={(value) => setCategoryFilter(value === "all" ? null : value)}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="All categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All categories</SelectItem>
                    <SelectItem value="Products">Products</SelectItem>
                    <SelectItem value="Services">Services</SelectItem>
                    <SelectItem value="Support">Support</SelectItem>
                    <SelectItem value="Company">Company</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {isLoading ? (
                <div className="py-8 text-center">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-swisscom-blue" />
                  <p className="text-muted-foreground">Loading knowledge base...</p>
                </div>
              ) : filteredData.length === 0 ? (
                <div className="py-8 text-center border rounded-lg">
                  <AlertCircle className="h-8 w-8 mx-auto mb-4 text-muted-foreground" />
                  <p className="font-medium">No data found</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {searchTerm || categoryFilter
                      ? "Try adjusting your search or filter"
                      : "Add new knowledge or seed sample data"}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredData.map((item) => (
                    <Card key={item.id} className="overflow-hidden transition-all hover:shadow-md">
                      <CardHeader className="py-3 bg-muted/50">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base flex items-center gap-2">
                            <FileText className="h-4 w-4 text-swisscom-blue" />
                            {item.title}
                          </CardTitle>
                          <Badge variant="outline">{item.category}</Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="py-3">
                        <p className="text-sm">{item.content}</p>
                        {item.keywords && item.keywords.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-3">
                            {item.keywords.map((keyword, index) => (
                              <Badge key={index} variant="secondary" className="flex items-center gap-1">
                                <Tag className="h-3 w-3" />
                                {keyword}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </CardContent>
                      <CardFooter className="py-2 bg-muted/30 flex justify-between">
                        <span className="text-xs text-muted-foreground">
                          Added: {new Date(item.created_at).toLocaleDateString()}
                        </span>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 text-red-500 hover:text-red-700 hover:bg-red-100"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently delete this knowledge base entry and its embeddings. This action
                                cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deleteCompanyData(item.id)}
                                className="bg-red-500 hover:bg-red-600"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Add Knowledge
              </CardTitle>
              <CardDescription>Add new information to the Swisscom knowledge base</CardDescription>
            </CardHeader>
            <form onSubmit={addCompanyData}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={newData.category}
                    onValueChange={(value) => setNewData({ ...newData, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Products">Products</SelectItem>
                      <SelectItem value="Services">Services</SelectItem>
                      <SelectItem value="Support">Support</SelectItem>
                      <SelectItem value="Company">Company</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={newData.title}
                    onChange={(e) => setNewData({ ...newData, title: e.target.value })}
                    className="border-swisscom-blue/20"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="content">Content</Label>
                  <Textarea
                    id="content"
                    rows={5}
                    value={newData.content}
                    onChange={(e) => setNewData({ ...newData, content: e.target.value })}
                    className="border-swisscom-blue/20"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="keywords">Keywords (comma separated)</Label>
                  <Input
                    id="keywords"
                    value={newData.keywords}
                    onChange={(e) => setNewData({ ...newData, keywords: e.target.value })}
                    className="border-swisscom-blue/20"
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-swisscom-blue hover:bg-swisscom-blue/90"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Add to Knowledge Base"
                  )}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>
      </TabsContent>

      <TabsContent value="analytics">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div>
                <CardTitle>Knowledge Base Stats</CardTitle>
                <CardDescription>Overview of your knowledge base</CardDescription>
              </div>
              <BarChart3 className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalItems}</div>
              <p className="text-xs text-muted-foreground">Total knowledge base entries</p>
              <div className="mt-4 space-y-2">
                {Object.entries(categoryCounts).map(([category, count]) => (
                  <div key={category}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">{category}</span>
                      <span className="text-sm text-muted-foreground">{count} entries</span>
                    </div>
                    <Progress value={(count / totalItems) * 100} className="h-2" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Usage Analytics</CardTitle>
              <CardDescription>AI assistant usage statistics</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px] flex items-center justify-center">
              <div className="text-center">
                <BarChart3 className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                <p className="font-medium">Analytics dashboard coming soon</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Detailed usage statistics will be available in a future update
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      <TabsContent value="settings">
        <Card>
          <CardHeader>
            <CardTitle>AI Assistant Settings</CardTitle>
            <CardDescription>Configure the AI assistant behavior</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="py-4">
                  <CardTitle className="text-base">Voice Settings</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Configure the voice and speech settings for the AI assistant
                  </p>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="voice-language">Voice Language</Label>
                      <Select
                        value={settings.voiceLanguage}
                        onValueChange={(value) => handleSettingChange("voiceLanguage", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select language" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="de-CH">German (Swiss)</SelectItem>
                          <SelectItem value="fr-CH">French (Swiss)</SelectItem>
                          <SelectItem value="it-CH">Italian (Swiss)</SelectItem>
                          <SelectItem value="en-US">English</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="voice-rate">Speech Rate</Label>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-muted-foreground">Slow</span>
                        <Input
                          id="voice-rate"
                          type="range"
                          min="0.5"
                          max="2"
                          step="0.1"
                          value={settings.voiceRate}
                          onChange={(e) => handleSettingChange("voiceRate", e.target.value)}
                          className="flex-1"
                        />
                        <span className="text-sm text-muted-foreground">Fast</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="py-4">
                  <CardTitle className="text-base">AI Model Settings</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">Configure the AI model behavior and parameters</p>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="model">AI Model</Label>
                      <Select value={settings.aiModel} onValueChange={(value) => handleSettingChange("aiModel", value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select model" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="gpt-4o">GPT-4o</SelectItem>
                          <SelectItem value="gpt-4">GPT-4</SelectItem>
                          <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="temperature">Temperature</Label>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-muted-foreground">Precise</span>
                        <Input
                          id="temperature"
                          type="range"
                          min="0"
                          max="1"
                          step="0.1"
                          value={settings.temperature}
                          onChange={(e) => handleSettingChange("temperature", e.target.value)}
                          className="flex-1"
                        />
                        <span className="text-sm text-muted-foreground">Creative</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="flex justify-end">
              <Button className="bg-swisscom-blue hover:bg-swisscom-blue/90" onClick={saveSettings} disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Settings"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )
}

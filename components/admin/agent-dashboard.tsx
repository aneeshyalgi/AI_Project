"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Users, Clock, CheckCircle, AlertCircle, UserCheck, Video, Phone, MessageSquare } from "lucide-react"

type AgentHandover = {
  id: string
  conversation_id: string
  user_id: string
  conversation_history: any[]
  status: "waiting" | "connected" | "completed"
  requested_at: string
  connected_at: string | null
  completed_at: string | null
  agent_id: string | null
  contact_method: "video" | "audio" | "chat"
  notes: string | null
}

type AgentAvailability = {
  id: number
  available_agents: number
  busy_agents: number
  estimated_wait_time: number
  updated_at: string
}

export function AgentDashboard() {
  const [handovers, setHandovers] = useState<AgentHandover[]>([])
  const [availability, setAvailability] = useState<AgentAvailability | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedHandover, setSelectedHandover] = useState<AgentHandover | null>(null)
  const [notes, setNotes] = useState("")
  const [availableAgents, setAvailableAgents] = useState(0)
  const [busyAgents, setBusyAgents] = useState(0)
  const [waitTime, setWaitTime] = useState(0)
  const [isUpdating, setIsUpdating] = useState(false)
  const supabase = createClient()

  // Fetch handovers and availability
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      try {
        // Fetch handovers
        const { data: handoverData, error: handoverError } = await supabase
          .from("agent_handovers")
          .select("*")
          .order("requested_at", { ascending: false })

        if (handoverError) throw handoverError

        // Fetch availability
        const { data: availabilityData, error: availabilityError } = await supabase
          .from("agent_availability")
          .select("*")
          .single()

        if (availabilityError && availabilityError.code !== "PGRST116") throw availabilityError

        setHandovers(handoverData || [])
        setAvailability(availabilityData || null)

        if (availabilityData) {
          setAvailableAgents(availabilityData.available_agents)
          setBusyAgents(availabilityData.busy_agents)
          setWaitTime(availabilityData.estimated_wait_time)
        }
      } catch (error) {
        console.error("Error fetching data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()

    // Set up real-time subscription for handovers
    const handoverSubscription = supabase
      .channel("agent_handovers_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "agent_handovers",
        },
        (payload: any) => {
          console.log("Handover change received:", payload)
          fetchData()
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(handoverSubscription)
    }
  }, [supabase])

  // Update availability settings
  const updateAvailability = async () => {
    setIsUpdating(true)
    try {
      const { error } = await supabase
        .from("agent_availability")
        .update({
          available_agents: availableAgents,
          busy_agents: busyAgents,
          estimated_wait_time: waitTime,
          updated_at: new Date().toISOString(),
        })
        .eq("id", availability?.id || 1)

      if (error) throw error
    } catch (error) {
      console.error("Error updating availability:", error)
    } finally {
      setIsUpdating(false)
    }
  }

  // Accept a handover
  const acceptHandover = async (handoverId: string) => {
    try {
      const { error } = await supabase
        .from("agent_handovers")
        .update({
          status: "connected",
          connected_at: new Date().toISOString(),
          agent_id: "agent-123", // In a real app, this would be the current agent's ID
        })
        .eq("id", handoverId)

      if (error) throw error

      // Update local state
      setHandovers((prev) =>
        prev.map((h) =>
          h.id === handoverId
            ? {
                ...h,
                status: "connected",
                connected_at: new Date().toISOString(),
                agent_id: "agent-123",
              }
            : h,
        ),
      )
    } catch (error) {
      console.error("Error accepting handover:", error)
    }
  }

  // Complete a handover
  const completeHandover = async (handoverId: string) => {
    try {
      const { error } = await supabase
        .from("agent_handovers")
        .update({
          status: "completed",
          completed_at: new Date().toISOString(),
          notes: notes,
        })
        .eq("id", handoverId)

      if (error) throw error

      // Update local state
      setHandovers((prev) =>
        prev.map((h) =>
          h.id === handoverId
            ? {
                ...h,
                status: "completed",
                completed_at: new Date().toISOString(),
                notes: notes,
              }
            : h,
        ),
      )

      setSelectedHandover(null)
      setNotes("")
    } catch (error) {
      console.error("Error completing handover:", error)
    }
  }

  // Format date
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A"
    return new Date(dateString).toLocaleString()
  }

  // Calculate wait time
  const calculateWaitTime = (requestedAt: string) => {
    const requestTime = new Date(requestedAt).getTime()
    const now = new Date().getTime()
    const waitTimeMs = now - requestTime
    const waitTimeMin = Math.floor(waitTimeMs / 60000)
    return waitTimeMin
  }

  return (
    <Tabs defaultValue="queue" className="space-y-4">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="queue" className="flex items-center gap-2">
          <Users className="h-4 w-4" />
          <span>Customer Queue</span>
        </TabsTrigger>
        <TabsTrigger value="active" className="flex items-center gap-2">
          <UserCheck className="h-4 w-4" />
          <span>Active Sessions</span>
        </TabsTrigger>
        <TabsTrigger value="settings" className="flex items-center gap-2">
          <Clock className="h-4 w-4" />
          <span>Availability Settings</span>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="queue" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Waiting Customers</CardTitle>
            <CardDescription>Customers waiting to be connected to an agent</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-swisscom-blue" />
              </div>
            ) : handovers.filter((h) => h.status === "waiting").length === 0 ? (
              <div className="text-center py-8 border rounded-lg">
                <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
                <p>No customers waiting in queue</p>
              </div>
            ) : (
              <div className="space-y-4">
                {handovers
                  .filter((h) => h.status === "waiting")
                  .map((handover) => (
                    <Card key={handover.id} className="overflow-hidden">
                      <CardHeader className="py-3 bg-muted/50 flex flex-row items-center justify-between space-y-0">
                        <div>
                          <CardTitle className="text-base">Customer Request</CardTitle>
                          <CardDescription>
                            Waiting for {calculateWaitTime(handover.requested_at)} minutes
                          </CardDescription>
                        </div>
                        <Badge
                          variant="outline"
                          className={
                            calculateWaitTime(handover.requested_at) > 5
                              ? "bg-red-100 text-red-800 border-red-200"
                              : "bg-yellow-100 text-yellow-800 border-yellow-200"
                          }
                        >
                          {calculateWaitTime(handover.requested_at) > 5 ? "High Wait" : "Waiting"}
                        </Badge>
                      </CardHeader>
                      <CardContent className="py-3">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm font-medium">Contact Method</p>
                            <div className="flex items-center mt-1">
                              {handover.contact_method === "video" && <Video className="h-4 w-4 mr-1 text-blue-500" />}
                              {handover.contact_method === "audio" && <Phone className="h-4 w-4 mr-1 text-green-500" />}
                              {handover.contact_method === "chat" && (
                                <MessageSquare className="h-4 w-4 mr-1 text-purple-500" />
                              )}
                              <span className="capitalize">{handover.contact_method}</span>
                            </div>
                          </div>
                          <div>
                            <p className="text-sm font-medium">Requested At</p>
                            <p className="text-sm">{formatDate(handover.requested_at)}</p>
                          </div>
                        </div>

                        <div className="mt-4">
                          <p className="text-sm font-medium mb-2">Conversation Preview</p>
                          <div className="max-h-32 overflow-y-auto border rounded-md p-2 bg-gray-50">
                            {handover.conversation_history && handover.conversation_history.length > 0 ? (
                              handover.conversation_history.slice(-3).map((msg: any, i: number) => (
                                <div key={i} className="mb-1 text-sm">
                                  <span className="font-medium">{msg.role}:</span> {msg.content.substring(0, 100)}
                                  {msg.content.length > 100 ? "..." : ""}
                                </div>
                              ))
                            ) : (
                              <p className="text-sm text-muted-foreground">No conversation history available</p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                      <CardFooter className="border-t bg-muted/30 py-2">
                        <Button
                          onClick={() => acceptHandover(handover.id)}
                          className="bg-swisscom-blue hover:bg-swisscom-blue/90"
                        >
                          Accept Request
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="active" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Active Sessions</CardTitle>
            <CardDescription>Currently active customer-agent sessions</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-swisscom-blue" />
              </div>
            ) : handovers.filter((h) => h.status === "connected").length === 0 ? (
              <div className="text-center py-8 border rounded-lg">
                <AlertCircle className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <p>No active sessions</p>
              </div>
            ) : (
              <div className="space-y-4">
                {handovers
                  .filter((h) => h.status === "connected")
                  .map((handover) => (
                    <Card key={handover.id} className="overflow-hidden">
                      <CardHeader className="py-3 bg-muted/50 flex flex-row items-center justify-between space-y-0">
                        <div>
                          <CardTitle className="text-base">Active Session</CardTitle>
                          <CardDescription>
                            Connected for{" "}
                            {handover.connected_at
                              ? Math.floor((new Date().getTime() - new Date(handover.connected_at).getTime()) / 60000)
                              : "?"}{" "}
                            minutes
                          </CardDescription>
                        </div>
                        <Badge className="bg-green-100 text-green-800 border-green-200">Active</Badge>
                      </CardHeader>
                      <CardContent className="py-3">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm font-medium">Contact Method</p>
                            <div className="flex items-center mt-1">
                              {handover.contact_method === "video" && <Video className="h-4 w-4 mr-1 text-blue-500" />}
                              {handover.contact_method === "audio" && <Phone className="h-4 w-4 mr-1 text-green-500" />}
                              {handover.contact_method === "chat" && (
                                <MessageSquare className="h-4 w-4 mr-1 text-purple-500" />
                              )}
                              <span className="capitalize">{handover.contact_method}</span>
                            </div>
                          </div>
                          <div>
                            <p className="text-sm font-medium">Connected At</p>
                            <p className="text-sm">{formatDate(handover.connected_at)}</p>
                          </div>
                        </div>

                        <div className="mt-4">
                          <Label htmlFor={`notes-${handover.id}`}>Session Notes</Label>
                          <Input
                            id={`notes-${handover.id}`}
                            value={selectedHandover?.id === handover.id ? notes : handover.notes || ""}
                            onChange={(e) => {
                              if (selectedHandover?.id === handover.id) {
                                setNotes(e.target.value)
                              } else {
                                setSelectedHandover(handover)
                                setNotes(e.target.value)
                              }
                            }}
                            placeholder="Add notes about this session..."
                            className="mt-1"
                          />
                        </div>
                      </CardContent>
                      <CardFooter className="border-t bg-muted/30 py-2">
                        <Button
                          onClick={() => completeHandover(handover.id)}
                          variant="outline"
                          className="border-red-300 text-red-600 hover:bg-red-50"
                        >
                          Complete Session
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="settings">
        <Card>
          <CardHeader>
            <CardTitle>Agent Availability Settings</CardTitle>
            <CardDescription>Configure agent availability and estimated wait times</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label htmlFor="available-agents">Available Agents</Label>
                <Input
                  id="available-agents"
                  type="number"
                  min="0"
                  value={availableAgents}
                  onChange={(e) => setAvailableAgents(Number.parseInt(e.target.value) || 0)}
                />
                <p className="text-xs text-muted-foreground">Number of agents currently available</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="busy-agents">Busy Agents</Label>
                <Input
                  id="busy-agents"
                  type="number"
                  min="0"
                  value={busyAgents}
                  onChange={(e) => setBusyAgents(Number.parseInt(e.target.value) || 0)}
                />
                <p className="text-xs text-muted-foreground">Number of agents currently with customers</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="wait-time">Estimated Wait Time (minutes)</Label>
                <Input
                  id="wait-time"
                  type="number"
                  min="0"
                  value={waitTime}
                  onChange={(e) => setWaitTime(Number.parseInt(e.target.value) || 0)}
                />
                <p className="text-xs text-muted-foreground">Average wait time for customers in queue</p>
              </div>
            </div>

            <div className="mt-6 p-4 bg-blue-50 rounded-md border border-blue-200">
              <h3 className="text-sm font-medium text-blue-800 mb-2">Current Status</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-white p-3 rounded-md border border-blue-100">
                  <p className="text-xs text-blue-600 mb-1">Available</p>
                  <p className="text-2xl font-bold text-blue-800">{availability?.available_agents || 0}</p>
                </div>
                <div className="bg-white p-3 rounded-md border border-blue-100">
                  <p className="text-xs text-blue-600 mb-1">Busy</p>
                  <p className="text-2xl font-bold text-blue-800">{availability?.busy_agents || 0}</p>
                </div>
                <div className="bg-white p-3 rounded-md border border-blue-100">
                  <p className="text-xs text-blue-600 mb-1">Wait Time</p>
                  <p className="text-2xl font-bold text-blue-800">{availability?.estimated_wait_time || 0} min</p>
                </div>
              </div>
              <p className="text-xs text-blue-600 mt-2">
                Last updated: {availability ? formatDate(availability.updated_at) : "Never"}
              </p>
            </div>
          </CardContent>
          <CardFooter>
            <Button
              onClick={updateAvailability}
              disabled={isUpdating}
              className="bg-swisscom-blue hover:bg-swisscom-blue/90"
            >
              {isUpdating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Update Availability
            </Button>
          </CardFooter>
        </Card>
      </TabsContent>
    </Tabs>
  )
}

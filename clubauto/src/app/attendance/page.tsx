/* eslint-disable react/no-unescaped-entities */
"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { SidebarTrigger } from "@/components/ui/sidebar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Users, Plus, Search, Calendar, TrendingUp, UserCheck, UserX } from "lucide-react"
import { useData } from "@/lib/data-context"

export default function Attendance() {
  const { members, attendanceRecords, addAttendanceRecord, updateMember, loading } = useData()
  const [searchTerm, setSearchTerm] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedMembers, setSelectedMembers] = useState<number[]>([])
  const [showAllRecords, setShowAllRecords] = useState(false)

  const [formData, setFormData] = useState({
    eventName: "",
    eventDate: "",
  })

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async () => {
    if (!formData.eventName || !formData.eventDate) {
      alert("Please fill in event name and date")
      return
    }

    try {
      await addAttendanceRecord({
        event_date: formData.eventDate,
        event_name: formData.eventName,
        present_count: selectedMembers.length,
        absent_count: members.length - selectedMembers.length,
        total_count: members.length,
      })

      // Update attendance percentage for each member based on their actual attendance
      const totalEvents = attendanceRecords.length + 1 // Including this new record

      for (const member of members) {
        const wasPresent = selectedMembers.includes(member.id)
        const currentPercentage = member.attendance_percentage || 0

        // Calculate new percentage based on whether they were present
        // This assumes equal weight for each event
        let newPercentage
        if (totalEvents === 1) {
          // First event
          newPercentage = wasPresent ? 100 : 0
        } else {
          // Calculate based on previous percentage and current attendance
          const previousTotal = (currentPercentage * (totalEvents - 1)) / 100
          const newTotal = previousTotal + (wasPresent ? 1 : 0)
          newPercentage = Math.round((newTotal / totalEvents) * 100)
        }

        // Update member's attendance percentage
        await updateMember(member.id, {
          attendance_percentage: newPercentage,
        })
      }

      // Reset form
      setFormData({ eventName: "", eventDate: "" })
      setSelectedMembers([])
      setIsDialogOpen(false)
    } catch (error) {
      console.error("Error adding attendance record:", error)
      alert("Failed to save attendance record. Please try again.")
    }
  }

  const filteredMembers = members.filter(
    (member) =>
      member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (member.email && member.email.toLowerCase().includes(searchTerm.toLowerCase())),
  )

  const handleMemberToggle = (memberId: number) => {
    setSelectedMembers((prev) => (prev.includes(memberId) ? prev.filter((id) => id !== memberId) : [...prev, memberId]))
  }

  const getAttendanceBadge = (percentage: number) => {
    if (percentage >= 90) return <Badge className="bg-green-500">Excellent</Badge>
    if (percentage >= 80) return <Badge className="bg-yellow-500">Good</Badge>
    return <Badge variant="destructive">Needs Improvement</Badge>
  }

  // Calculate real stats
  const averageAttendance =
    members.length > 0
      ? Math.round(members.reduce((sum, member) => sum + (member.attendance_percentage || 0), 0) / members.length)
      : 0
  const perfectAttendance = members.filter((member) => (member.attendance_percentage || 0) === 100).length
  const atRisk = members.filter((member) => (member.attendance_percentage || 0) < 80).length

  // Show only 3 most recent records unless "View All" is clicked
  const displayedRecords = showAllRecords ? attendanceRecords : attendanceRecords.slice(0, 3)

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen">
        <header className="flex items-center justify-between px-4 py-3 border-b">
          <div className="flex items-center gap-2">
            <SidebarTrigger />
            <h1 className="text-2xl font-bold">Attendance Tracking</h1>
          </div>
        </header>
        <div className="flex-1 p-6 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Loading attendance data...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen">
      <header className="flex items-center justify-between px-4 py-3 border-b">
        <div className="flex items-center gap-2">
          <SidebarTrigger />
          <h1 className="text-2xl font-bold">Attendance Tracking</h1>
        </div>
        <div className="flex items-center gap-2">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Take Attendance
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Take Attendance</DialogTitle>
                <DialogDescription>Mark attendance for today's meeting or event.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="event-name">Event/Meeting Name</Label>
                    <Input
                      id="event-name"
                      placeholder="Enter event name"
                      value={formData.eventName}
                      onChange={(e) => handleInputChange("eventName", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="event-date">Date</Label>
                    <Input
                      id="event-date"
                      type="date"
                      value={formData.eventDate}
                      onChange={(e) => handleInputChange("eventDate", e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Select Present Members</Label>
                  <div className="border rounded-lg p-4 max-h-60 overflow-y-auto">
                    <div className="space-y-3">
                      {members.map((member) => (
                        <div key={member.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`member-${member.id}`}
                            checked={selectedMembers.includes(member.id)}
                            onCheckedChange={() => handleMemberToggle(member.id)}
                          />
                          <label
                            htmlFor={`member-${member.id}`}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex-1"
                          >
                            {member.name} ({member.grade})
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {selectedMembers.length} of {members.length} members selected
                  </p>
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSubmit}>Save Attendance</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <div className="flex-1 p-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Attendance</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{averageAttendance}%</div>
              <p className="text-xs text-muted-foreground">Across all members</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Perfect Attendance</CardTitle>
              <UserCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{perfectAttendance}</div>
              <p className="text-xs text-muted-foreground">Members with 100% attendance</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">At Risk</CardTitle>
              <UserX className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{atRisk}</div>
              <p className="text-xs text-muted-foreground">Members below 80% attendance</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Member Attendance */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Member Attendance
              </CardTitle>
              <CardDescription>Individual attendance rates and status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search members..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>

                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {filteredMembers.map((member) => (
                    <div key={member.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <h4 className="font-medium">{member.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {member.grade} • {member.email}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{member.attendance_percentage || 0}%</span>
                        {getAttendanceBadge(member.attendance_percentage || 0)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Attendance Records */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Recent Records
              </CardTitle>
              <CardDescription>Latest attendance records by event</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {displayedRecords.length > 0 ? (
                  displayedRecords.map((record) => (
                    <div key={record.id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{record.event_name}</h4>
                        <span className="text-sm text-muted-foreground">
                          {new Date(record.event_date).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div className="text-center">
                          <div className="text-lg font-bold text-green-600">{record.present_count}</div>
                          <div className="text-muted-foreground">Present</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold text-red-600">{record.absent_count}</div>
                          <div className="text-muted-foreground">Absent</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold">{record.total_count}</div>
                          <div className="text-muted-foreground">Total</div>
                        </div>
                      </div>
                      <div className="mt-2">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-green-600 h-2 rounded-full"
                            style={{ width: `${(record.present_count / record.total_count) * 100}%` }}
                          ></div>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {Math.round((record.present_count / record.total_count) * 100)}% attendance rate
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No attendance records yet. Take your first attendance!
                  </div>
                )}

                {attendanceRecords.length > 3 && (
                  <Button
                    variant="outline"
                    className="w-full bg-transparent"
                    onClick={() => setShowAllRecords(!showAllRecords)}
                  >
                    {showAllRecords ? "Show Recent Only" : "View All Records"}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

import * as React from "react"
import { Github, MessagesSquare, Plus, Trash2 } from "lucide-react"
import Link from "next/link"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarSeparator,
} from "@/components/ui/sidebar"
import { ThreadList } from "./assistant-ui/thread-list"
import {
  getRegisteredAgents,
  addAgent,
  removeAgent,
  fetchAgentCard,
  type AgentCard,
} from "@/lib/agent-registry"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
  SheetClose,
} from "@/components/ui/sheet"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const [agents, setAgents] = React.useState<AgentCard[]>([])
  const [showAdd, setShowAdd] = React.useState(false)
  const [baseUrl, setBaseUrl] = React.useState("")
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [pendingAgent, setPendingAgent] = React.useState<AgentCard | null>(null)
  const [showConfirm, setShowConfirm] = React.useState(false)
  const [selectedAgent, setSelectedAgent] = React.useState<AgentCard | null>(null)

  React.useEffect(() => {
    setAgents(getRegisteredAgents())
  }, [])

  const handleAddAgent = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const card = await fetchAgentCard(baseUrl)
      setPendingAgent(card)
      setShowConfirm(true)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const handleConfirmAdd = () => {
    if (pendingAgent) {
      addAgent(pendingAgent)
      setAgents(getRegisteredAgents())
      setShowAdd(false)
      setBaseUrl("")
      setPendingAgent(null)
      setShowConfirm(false)
    }
  }

  const handleCancelAdd = () => {
    setPendingAgent(null)
    setShowConfirm(false)
  }

  const handleRemoveAgent = (url: string) => {
    removeAgent(url)
    setAgents(getRegisteredAgents())
  }

  return (
    <>
      <Sidebar {...props}>
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="lg" asChild>
                  <Link href="https://github.com/Agentopolis/kiosk" target="_blank">
                    <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                      <MessagesSquare className="size-4" />
                    </div>
                    <div className="flex flex-col gap-0.5 leading-none">
                      <span className="font-semibold">kiosk</span>
                    </div>
                  </Link>
                </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent>
          <ThreadList />
          <SidebarSeparator />
          <SidebarGroup>
            <SidebarGroupLabel>
              Registered Agents
              <button
                type="button"
                className="ml-auto p-1 hover:text-sidebar-accent-foreground"
                title="Add Agent"
                onClick={() => setShowAdd((v) => !v)}
              >
                <Plus className="size-4" />
              </button>
            </SidebarGroupLabel>
            <SidebarGroupContent>
              {showAdd && (
                <form onSubmit={handleAddAgent} className="flex flex-col gap-2 mb-2">
                  <input
                    type="text"
                    placeholder="Agent base URL"
                    value={baseUrl}
                    onChange={e => setBaseUrl(e.target.value)}
                    className="rounded border px-2 py-1 text-xs"
                    required
                    disabled={loading}
                  />
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      className="bg-sidebar-primary text-sidebar-primary-foreground rounded px-2 py-1 text-xs"
                      disabled={loading}
                    >
                      {loading ? "Adding..." : "Add"}
                    </button>
                    <button
                      type="button"
                      className="rounded px-2 py-1 text-xs border"
                      onClick={() => setShowAdd(false)}
                      disabled={loading}
                    >
                      Cancel
                    </button>
                  </div>
                  {error && <div className="text-red-500 text-xs">{error}</div>}
                </form>
              )}
              <ul className="flex flex-col gap-1">
                {agents.length === 0 && <li className="text-xs text-muted">No agents registered.</li>}
                {agents.map(agent => (
                  <li key={agent.url} className="flex items-center gap-2 text-xs">
                    <button
                      type="button"
                      className="truncate text-left flex-1 hover:underline"
                      title="View agent details"
                      onClick={() => setSelectedAgent(agent)}
                    >
                      {agent.name}
                    </button>
                    <button
                      type="button"
                      className="p-1 hover:text-red-500"
                      title="Remove Agent"
                      onClick={() => handleRemoveAgent(agent.url)}
                    >
                      <Trash2 className="size-3" />
                    </button>
                  </li>
                ))}
              </ul>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarRail />
        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="lg" asChild>
                <Link href="https://github.com/assistant-ui/assistant-ui" target="_blank">
                  <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                    <Github className="size-4" />
                  </div>
                  <div className="flex flex-col gap-0.5 leading-none">
                    <span className="font-semibold">GitHub</span>
                    <span className="">View Source</span>
                  </div>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
      <Sheet open={showConfirm} onOpenChange={setShowConfirm}>
        <SheetContent side="left">
          <SheetHeader>
            <SheetTitle>Confirm Add Agent</SheetTitle>
            <SheetDescription>
              Please review the agent details below and confirm you want to add this agent to your registry.
            </SheetDescription>
          </SheetHeader>
          {pendingAgent && (
            <div className="flex flex-col gap-2 p-2 text-xs">
              <div><strong>Name:</strong> {pendingAgent.name}</div>
              <div><strong>URL:</strong> {pendingAgent.url}</div>
              <div><strong>Version:</strong> {pendingAgent.version}</div>
              {pendingAgent.description && <div><strong>Description:</strong> {pendingAgent.description}</div>}
              <div><strong>Skills:</strong>
                <ul className="list-disc ml-4">
                  {pendingAgent.skills.map(skill => (
                    <li key={skill.id}><span className="font-medium">{skill.name}</span>{skill.description ? `: ${skill.description}` : ""}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
          <SheetFooter>
            <button
              type="button"
              className="bg-sidebar-primary text-sidebar-primary-foreground rounded px-2 py-1 text-xs"
              onClick={handleConfirmAdd}
            >
              Confirm
            </button>
            <SheetClose asChild>
              <button
                type="button"
                className="rounded px-2 py-1 text-xs border"
                onClick={handleCancelAdd}
              >
                Cancel
              </button>
            </SheetClose>
          </SheetFooter>
        </SheetContent>
      </Sheet>
      <Sheet open={!!selectedAgent} onOpenChange={(o) => !o && setSelectedAgent(null)}>
        <SheetContent side="left">
          <SheetHeader>
            <SheetTitle>Agent Details</SheetTitle>
          </SheetHeader>
          {selectedAgent && (
            <div className="flex flex-col gap-2 p-2 text-xs overflow-y-auto max-h-[80vh]">
              <div><strong>Name:</strong> {selectedAgent.name}</div>
              <div><strong>URL:</strong> {selectedAgent.url}</div>
              <div><strong>Version:</strong> {selectedAgent.version}</div>
              {selectedAgent.description && <div><strong>Description:</strong> {selectedAgent.description}</div>}
              <div>
                <strong>Skills:</strong>
                <ul className="list-disc ml-4">
                  {selectedAgent.skills.map(skill => (
                    <li key={skill.id} className="mb-1">
                      <span className="font-medium">{skill.name}</span>
                      {skill.description ? `: ${skill.description}` : ""}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </>
  )
}

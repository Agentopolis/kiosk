"use client";

import { AssistantRuntimeProvider } from "@assistant-ui/react";
import { useChatRuntime } from "@assistant-ui/react-ai-sdk";
import { Thread } from "@/components/assistant-ui/thread";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Separator } from "@/components/ui/separator";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { getRegisteredAgents, agentRegistryToToolsConfig } from "@/lib/agent-registry";
import * as React from "react";

// Patch global fetch to inject tools config for /api/chat
if (typeof window !== "undefined") {
  const originalFetch = window.fetch;
  window.fetch = async (input, init) => {
    if (typeof input === "string" && input.includes("/api/chat")) {
      let body = init?.body;
      if (typeof body === "string") {
        try {
          const json = JSON.parse(body);
          const agents = getRegisteredAgents();
          const tools = agentRegistryToToolsConfig(agents);
          json.tools = tools;
          body = JSON.stringify(json);
        } catch {
          // fallback: do nothing
        }
      }
      return originalFetch(input, { ...init, body });
    }
    return originalFetch(input, init);
  };
}

export const Assistant = () => {
  const runtime = useChatRuntime({
    api: "/api/chat",
  });

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
            <SidebarTrigger />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href="#">
                    Build Your Own ChatGPT UX
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>
                    Starter Template
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </header>
          <Thread />
        </SidebarInset>
      </SidebarProvider>
    </AssistantRuntimeProvider>
  );
};

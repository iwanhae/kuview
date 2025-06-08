import * as React from "react";
import { Home, Server, Rocket, Layers, Network } from "lucide-react";
import { NavMain } from "@/components/nav-main";
import { Sidebar, SidebarContent } from "@/components/ui/sidebar";
import { PREFIX } from "@/lib/const";

// This is sample data.
const data = {
  navMain: [
    {
      title: "Home",
      url: `${PREFIX}/`,
      icon: Home,
    },
    {
      title: "Node",
      url: `${PREFIX}/nodes`,
      icon: Server,
    },
    {
      title: "Pod",
      url: `${PREFIX}/pods`,
      icon: Rocket,
    },
    {
      title: "Service",
      url: `${PREFIX}/services`,
      icon: Network,
    },
    {
      title: "Namespace",
      url: `${PREFIX}/namespaces`,
      icon: Layers,
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarContent>
        <NavMain items={data.navMain} />
      </SidebarContent>
    </Sidebar>
  );
}

import { Route, Switch } from "wouter";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import Root from "./pages/root";
import Node from "./pages/node";
import Pod from "./pages/pod";
import KuviewBackground from "./backgrounds/kuview";
import Debug from "./pages/debug";
import { PREFIX } from "./lib/const";
import { AppSidebar } from "./components/app-sidebar";

export default function Page() {
  return (
    <SidebarProvider defaultOpen={false}>
      <KuviewBackground />
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
          </div>
        </header>
        <Switch>
          <Route path={`${PREFIX}/`} component={Root} />
          <Route path={`${PREFIX}/nodes`} component={Node} />
          <Route path={`${PREFIX}/pods`} component={Pod} />
          <Route path={`${PREFIX}/debug`} component={Debug} />
        </Switch>
      </SidebarInset>
    </SidebarProvider>
  );
}

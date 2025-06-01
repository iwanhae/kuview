import { AppSidebar } from "@/components/app-sidebar";
import { Route, Switch } from "wouter";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import Root from "./pages/root";

export default function Page() {
  return (
    <SidebarProvider defaultOpen={false}>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
          </div>
        </header>
        <Switch>
          <Route path="/" component={Root} />
        </Switch>
      </SidebarInset>
    </SidebarProvider>
  );
}

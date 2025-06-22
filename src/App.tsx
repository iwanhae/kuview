import { Route, Switch } from "wouter";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import Root from "./pages/root";
import Node from "./pages/node";
import Pod from "./pages/pod";
import Namespace from "./pages/namespace";
import Service from "./pages/service";
import PV from "./pages/pv";
import PVC from "./pages/pvc";
import KuviewBackground from "./backgrounds/kuview";
import Debug from "./pages/debug";
import { PREFIX } from "./lib/const";
import { AppSidebar } from "./components/app-sidebar";
import UserGroupsPage from "./pages/usergroups";

export default function Page() {
  return (
    <SidebarProvider defaultOpen={false}>
      <KuviewBackground />
      <AppSidebar />
      <SidebarInset>
        <div className="py-6">
          <Switch>
            <Route path={`${PREFIX}/`} component={Root} />
            <Route path={`${PREFIX}/nodes`} component={Node} />
            <Route path={`${PREFIX}/pods`} component={Pod} />
            <Route path={`${PREFIX}/namespaces`} component={Namespace} />
            <Route path={`${PREFIX}/services`} component={Service} />
            <Route path={`${PREFIX}/pv`} component={PV} />
            <Route path={`${PREFIX}/pvc`} component={PVC} />
            <Route path={`${PREFIX}/usergroups`} component={UserGroupsPage} />
            <Route path={`${PREFIX}/debug`} component={Debug} />
          </Switch>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

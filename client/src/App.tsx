import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import Composer from "@/pages/Composer";
import Viewer from "@/pages/Viewer";
import Signal from "@/pages/Signal";
import Implement from "@/pages/Implement";
import Whitepaper from "@/pages/Whitepaper";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/composer" component={Composer} />
      <Route path="/view" component={Viewer} />
      <Route path="/signal" component={Signal} />
      <Route path="/implement" component={Implement} />
      <Route path="/whitepaper" component={Whitepaper} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router />
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;

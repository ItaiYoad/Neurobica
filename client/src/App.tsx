import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BiometricsProvider } from "@/context/BiometricsContext";
import { NotificationsProvider } from "@/context/NotificationsContext";
import { AudioProvider } from "@/context/AudioContext";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import Configuration from "@/pages/Configuration";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/configuration" component={Configuration} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BiometricsProvider>
        <NotificationsProvider>
          <AudioProvider>
            <TooltipProvider>
              <Toaster />
              <Router />
            </TooltipProvider>
          </AudioProvider>
        </NotificationsProvider>
      </BiometricsProvider>
    </QueryClientProvider>
  );
}

export default App;

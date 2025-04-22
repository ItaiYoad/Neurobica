import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { InfoIcon, CheckCircleIcon, AlertCircleIcon } from "lucide-react";
import AudioSettingsTab from "@/components/settings/AudioSettings";
import { apiRequest } from "@/lib/queryClient";

const neuroBraveSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
  verboseSocketLog: z.boolean().default(false)
});

const neurospeedSchema = z.object({
  accountId: z.string().min(1, { message: "Account ID is required" }),
  username: z.string().min(1, { message: "Username is required" }),
  userPassword: z.string().min(6, { message: "Password must be at least 6 characters" }),
  hiaId: z.string().min(1, { message: "HIA ID is required" }),
  verboseSocketLog: z.boolean().default(false)
});

export default function Configuration() {
  const { toast } = useToast();
  const [testStatus, setTestStatus] = useState<{
    neuroBrave: 'idle' | 'testing' | 'success' | 'error';
    neurospeed: 'idle' | 'testing' | 'success' | 'error';
  }>({
    neuroBrave: 'idle',
    neurospeed: 'idle'
  });

  // NeuroBrave form
  const neuroBraveForm = useForm<z.infer<typeof neuroBraveSchema>>({
    resolver: zodResolver(neuroBraveSchema),
    defaultValues: {
      email: "",
      password: "",
      verboseSocketLog: false
    }
  });

  // NeurospeedOS form
  const neurospeedForm = useForm<z.infer<typeof neurospeedSchema>>({
    resolver: zodResolver(neurospeedSchema),
    defaultValues: {
      accountId: "",
      username: "",
      userPassword: "",
      hiaId: "user_data_hia_test_1", // Default value from example
      verboseSocketLog: false
    }
  });

  // Fetch current configurations when the component mounts
  useEffect(() => {
    // Fetch NeuroBrave config
    fetch('/api/config/neurobrave')
      .then(res => res.json())
      .then(data => {
        if (data.email) {
          neuroBraveForm.reset({
            email: data.email,
            password: "", // Don't populate password for security
            verboseSocketLog: data.verboseSocketLog || false
          });
        }
      })
      .catch(err => {
        console.error('Error loading NeuroBrave config:', err);
      });

    // Fetch NeurospeedOS config
    fetch('/api/config/neurospeed')
      .then(res => res.json())
      .then(data => {
        if (data.username) {
          neurospeedForm.reset({
            accountId: data.accountId || "",
            username: data.username,
            userPassword: "", // Don't populate password for security
            hiaId: data.hiaId || "user_data_hia_test_1",
            verboseSocketLog: data.verboseSocketLog || false
          });
        }
      })
      .catch(err => {
        console.error('Error loading NeurospeedOS config:', err);
      });
  }, [neuroBraveForm, neurospeedForm]);

  // Submit NeuroBrave config
  const onSubmitNeuroBrave = async (values: z.infer<typeof neuroBraveSchema>) => {
    try {
      const response = await fetch('/api/config/neurobrave', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(values)
      });

      const data = await response.json();
      
      if (data.success) {
        toast({
          title: "Configuration updated",
          description: "NeuroBrave configuration has been saved."
        });
      } else {
        toast({
          title: "Update failed",
          description: data.message || "Failed to update NeuroBrave configuration.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error saving NeuroBrave config:', error);
      toast({
        title: "Update failed",
        description: "Failed to update NeuroBrave configuration. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Submit NeurospeedOS config
  const onSubmitNeurospeed = async (values: z.infer<typeof neurospeedSchema>) => {
    try {
      const response = await fetch('/api/config/neurospeed', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(values)
      });

      const data = await response.json();
      
      if (data.success) {
        toast({
          title: "Configuration updated",
          description: "NeurospeedOS configuration has been saved."
        });
      } else {
        toast({
          title: "Update failed",
          description: data.message || "Failed to update NeurospeedOS configuration.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error saving NeurospeedOS config:', error);
      toast({
        title: "Update failed",
        description: "Failed to update NeurospeedOS configuration. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Test NeuroBrave connection
  const testNeuroBraveConnection = async () => {
    setTestStatus(prev => ({ ...prev, neuroBrave: 'testing' }));
    try {
      const response = await fetch('/api/config/neurobrave/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      
      if (data.success) {
        setTestStatus(prev => ({ ...prev, neuroBrave: 'success' }));
        toast({
          title: "Connection successful",
          description: "Successfully connected to NeuroBrave API."
        });
      } else {
        setTestStatus(prev => ({ ...prev, neuroBrave: 'error' }));
        toast({
          title: "Connection failed",
          description: data.message || "Failed to connect to NeuroBrave API.",
          variant: "destructive"
        });
      }
    } catch (error) {
      setTestStatus(prev => ({ ...prev, neuroBrave: 'error' }));
      toast({
        title: "Connection failed",
        description: "Failed to connect to NeuroBrave API. Please check your credentials.",
        variant: "destructive"
      });
    }
  };

  // Test NeurospeedOS connection
  const testNeurospeedConnection = async () => {
    setTestStatus(prev => ({ ...prev, neurospeed: 'testing' }));
    try {
      const response = await fetch('/api/config/neurospeed/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      
      if (data.success) {
        setTestStatus(prev => ({ ...prev, neurospeed: 'success' }));
        toast({
          title: "Connection successful",
          description: "Successfully connected to NeurospeedOS."
        });
      } else {
        setTestStatus(prev => ({ ...prev, neurospeed: 'error' }));
        toast({
          title: "Connection failed",
          description: data.message || "Failed to connect to NeurospeedOS.",
          variant: "destructive"
        });
      }
    } catch (error) {
      setTestStatus(prev => ({ ...prev, neurospeed: 'error' }));
      toast({
        title: "Connection failed",
        description: "Failed to connect to NeurospeedOS. Please check your credentials.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">Biometric Integration Configuration</h1>
      
      <Alert className="mb-6">
        <InfoIcon className="h-4 w-4" />
        <AlertTitle>Configuration Required</AlertTitle>
        <AlertDescription>
          To access real-time biometric data from wearable devices, you need to configure 
          your NeurospeedOS API credentials. This service by NeuroBrave enables Neurobica 
          to access and process your biometric data from connected sensors.
        </AlertDescription>
      </Alert>
      
      <Tabs defaultValue="neurospeed">
        <TabsList className="mb-4">
          <TabsTrigger value="neurospeed">NeurospeedOS Configuration</TabsTrigger>
          <TabsTrigger value="hiasettings">HIA Device Settings</TabsTrigger>
          <TabsTrigger value="audio">Voice & Audio Settings</TabsTrigger>
        </TabsList>
        
        <TabsContent value="hiasettings">
          <Card>
            <CardHeader>
              <CardTitle>HIA Device Settings</CardTitle>
              <CardDescription>
                HIA (Human Interface Adapter) scans your system for supported biometric sensors, 
                authenticates them, and streams raw sensor data to NeurospeedOS Cloud API.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="rounded-lg border p-4">
                  <h3 className="text-lg font-medium mb-2">Setting Up HIA Software</h3>
                  <ol className="list-decimal ml-6 space-y-2">
                    <li>Download HIA software from NeuroBrave dashboard</li>
                    <li>Run HIA_setup.exe and follow installation wizard</li>
                    <li>Input your NeurospeedOS user credentials when prompted</li>
                    <li>Connect your biometric sensors (Muse headband, Apple Watch, etc.)</li>
                    <li>Verify connection status in the HIA dashboard</li>
                  </ol>
                </div>
                
                <div className="rounded-lg border p-4">
                  <h3 className="text-lg font-medium mb-2">Supported Biometric Sensors</h3>
                  <ul className="list-disc ml-6 space-y-1">
                    <li>Muse EEG Headband (all models)</li>
                    <li>Apple Watch (Series 3 and newer)</li>
                    <li>Fitbit (Sense, Versa 3+)</li>
                    <li>Polar H10 Heart Rate Monitor</li>
                    <li>Empatica E4 Wristband</li>
                  </ul>
                </div>
                
                <div className="rounded-lg border p-4 bg-muted/50">
                  <h3 className="text-lg font-medium mb-2">More Information</h3>
                  <p>For detailed instructions on setting up specific sensors or troubleshooting connection issues, please visit the <a href="https://neurospeed.io/docs" target="_blank" rel="noopener noreferrer" className="text-primary underline">NeurospeedOS documentation</a>.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="neurospeed">
          <Card>
            <CardHeader>
              <CardTitle>NeurospeedOS API Credentials</CardTitle>
              <CardDescription>
                Connect to NeuroBrave's NeurospeedOS cloud platform to process real-time 
                biometric data from your wearable sensors. These credentials will allow 
                Neurobica to receive and respond to your emotional state.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...neurospeedForm}>
                <form onSubmit={neurospeedForm.handleSubmit(onSubmitNeurospeed)} className="space-y-4">
                  <FormField
                    control={neurospeedForm.control}
                    name="accountId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Account ID</FormLabel>
                        <FormControl>
                          <Input placeholder="neurospeed_acc_123" {...field} />
                        </FormControl>
                        <FormDescription>
                          Your NeurospeedOS account identifier
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={neurospeedForm.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Username</FormLabel>
                        <FormControl>
                          <Input placeholder="john.doe" {...field} />
                        </FormControl>
                        <FormDescription>
                          Your NeurospeedOS username
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={neurospeedForm.control}
                    name="userPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="••••••••" {...field} />
                        </FormControl>
                        <FormDescription>
                          Your NeurospeedOS account password
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={neurospeedForm.control}
                    name="hiaId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>HIA ID</FormLabel>
                        <FormControl>
                          <Input placeholder="user_data_hia_test_1" {...field} />
                        </FormControl>
                        <FormDescription>
                          Your NeurospeedOS HIA device identifier
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={neurospeedForm.control}
                    name="verboseSocketLog"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Verbose Logging</FormLabel>
                          <FormDescription>
                            Enable detailed WebSocket logging for debugging
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  <div className="flex items-center gap-4 pt-4">
                    <Button type="submit" disabled={neurospeedForm.formState.isSubmitting}>
                      Save Configuration
                    </Button>
                    <Button 
                      type="button" 
                      variant="secondary" 
                      onClick={testNeurospeedConnection}
                      disabled={testStatus.neurospeed === 'testing'}
                    >
                      {testStatus.neurospeed === 'testing' ? 'Testing...' : 'Test Connection'}
                    </Button>
                    
                    {testStatus.neurospeed === 'success' && (
                      <div className="text-green-500 flex items-center gap-1">
                        <CheckCircleIcon className="h-4 w-4" />
                        <span>Connection successful</span>
                      </div>
                    )}
                    
                    {testStatus.neurospeed === 'error' && (
                      <div className="text-red-500 flex items-center gap-1">
                        <AlertCircleIcon className="h-4 w-4" />
                        <span>Connection failed</span>
                      </div>
                    )}
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="audio">
          <AudioSettingsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
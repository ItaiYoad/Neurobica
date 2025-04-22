import React from 'react';
import { useAudio } from '@/context/AudioContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Loader2, Save } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const AudioSettings: React.FC = () => {
  const {
    settings,
    isLoading,
    error,
    toggleTTS,
    toggleSTT,
    setDefaultVoice,
    setDefaultSpeed,
    saveSettings
  } = useAudio();
  
  const [isSaving, setIsSaving] = React.useState(false);
  
  const handleSave = async () => {
    setIsSaving(true);
    try {
      await saveSettings();
      toast({
        title: 'Settings saved',
        description: 'Your audio settings have been updated.',
      });
    } catch (err: any) {
      toast({
        title: 'Error saving settings',
        description: err.message || 'Failed to save audio settings',
        variant: 'destructive'
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Audio Settings</CardTitle>
          <CardDescription>Loading your audio preferences...</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center py-6">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }
  
  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Audio Settings</CardTitle>
          <CardDescription className="text-destructive">
            {error}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" onClick={() => window.location.reload()}>
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Audio & Voice Settings</CardTitle>
        <CardDescription>
          Configure speech recognition and text-to-speech settings
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Speech Recognition Settings */}
        <div className="space-y-4">
          <h3 className="text-base font-medium">Speech Recognition</h3>
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="stt-enabled">Enable Voice Input</Label>
              <p className="text-sm text-muted-foreground">
                Allow microphone recording for speech-to-text
              </p>
            </div>
            <Switch
              id="stt-enabled"
              checked={settings.sttEnabled}
              onCheckedChange={toggleSTT}
            />
          </div>
        </div>
        
        {/* Text-to-Speech Settings */}
        <div className="space-y-4">
          <h3 className="text-base font-medium">Text-to-Speech</h3>
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="tts-enabled">Enable Voice Output</Label>
              <p className="text-sm text-muted-foreground">
                Read assistant responses aloud using text-to-speech
              </p>
            </div>
            <Switch
              id="tts-enabled"
              checked={settings.ttsEnabled}
              onCheckedChange={toggleTTS}
            />
          </div>
          
          {settings.ttsEnabled && (
            <>
              <div className="space-y-2">
                <Label htmlFor="voice-select">Voice</Label>
                <Select 
                  value={settings.defaultVoice} 
                  onValueChange={setDefaultVoice}
                >
                  <SelectTrigger id="voice-select" className="w-full">
                    <SelectValue placeholder="Select a voice" />
                  </SelectTrigger>
                  <SelectContent>
                    {settings.voiceOptions.map(voice => (
                      <SelectItem key={voice.id} value={voice.id}>
                        <div className="flex flex-col">
                          <span>{voice.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {voice.description}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label htmlFor="speed-slider">Speech Rate</Label>
                  <span className="text-sm text-muted-foreground">
                    {settings.speedOptions.find(
                      option => option.value === settings.defaultSpeed
                    )?.label || 'Normal'}
                  </span>
                </div>
                
                <Slider
                  id="speed-slider"
                  min={0.5}
                  max={2.0}
                  step={0.1}
                  value={[settings.defaultSpeed]}
                  onValueChange={values => setDefaultSpeed(values[0])}
                  className="w-full"
                />
                
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>Slower</span>
                  <span>Faster</span>
                </div>
              </div>
            </>
          )}
        </div>
        
        <Button
          className="w-full mt-6"
          onClick={handleSave}
          disabled={isSaving}
        >
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Settings
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};

export default AudioSettings;
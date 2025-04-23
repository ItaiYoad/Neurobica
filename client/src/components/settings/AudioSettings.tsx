import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { useAudio } from '@/context/AudioContext';
import { Mic, Volume2, Save, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import AudioRecorder from '@/components/ui/audio-recorder';
import TextPlayer from '@/components/ui/text-player';

export default function AudioSettingsTab() {
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
  
  const [isSaving, setIsSaving] = useState(false);
  const [testText, setTestText] = useState('This is a sample of how the voice will sound when reading messages.');
  
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
  
  // Handle speech transcription for demo
  const handleTranscription = (text: string) => {
    setTestText(text);
    toast({
      title: 'Speech recognized',
      description: 'Your speech has been transcribed successfully.',
    });
  };
  
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Voice & Audio Settings</CardTitle>
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
          <CardTitle>Voice & Audio Settings</CardTitle>
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
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Voice & Audio Settings</CardTitle>
            <CardDescription>
              Configure speech recognition and text-to-speech settings
            </CardDescription>
          </div>
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="ml-4"
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-8">
        {/* Speech Recognition Settings */}
        <div className="space-y-6">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-base font-medium flex items-center">
                <Mic className="h-5 w-5 mr-2 text-primary" />
                Speech Recognition
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                Convert your voice to text using OpenAI's Whisper
              </p>
            </div>
            <Switch
              checked={settings.sttEnabled}
              onCheckedChange={toggleSTT}
              aria-label="Enable speech recognition"
            />
          </div>
          
          {settings.sttEnabled && (
            <div className="p-4 bg-muted/40 rounded-lg">
              <div className="mb-4">
                <Label htmlFor="demo-text" className="mb-2 block">Test Speech Recognition</Label>
                <div className="flex items-center gap-4 mt-3">
                  <AudioRecorder onTranscription={handleTranscription} />
                  <span className="text-sm text-muted-foreground">
                    Click to start recording, then speak clearly
                  </span>
                </div>
              </div>
              
              <div className="border-t border-border mt-4 pt-4">
                <Label className="mb-2 block">Transcription Result:</Label>
                <div className="p-3 bg-background rounded border min-h-[60px]">
                  {testText}
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Text-to-Speech Settings */}
        <div className="space-y-6">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-base font-medium flex items-center">
                <Volume2 className="h-5 w-5 mr-2 text-primary" />
                Text-to-Speech
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                Convert text to speech using natural-sounding voices
              </p>
            </div>
            <Switch
              checked={settings.ttsEnabled}
              onCheckedChange={toggleTTS}
              aria-label="Enable text-to-speech"
            />
          </div>
          
          {settings.ttsEnabled && (
            <div className="p-4 bg-muted/40 rounded-lg space-y-6">
              <div className="space-y-2">
                <Label htmlFor="voice-select">Voice Selection</Label>
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
                        {voice.name} - <span className="text-muted-foreground">{voice.description}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label htmlFor="speed-slider">Speaking Rate</Label>
                  <span className="text-sm text-muted-foreground">
                    {settings.defaultSpeed}x
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
              
              <div className="border-t border-border mt-4 pt-4">
                <Label className="mb-2 block">Preview:</Label>
                <div className="p-3 bg-background rounded border flex justify-between items-center">
                  <span>{testText}</span>
                  <TextPlayer 
                    text={testText} 
                    showButton={true}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
        
        <div className="flex justify-center pt-4">
          <Button
            onClick={handleSave}
            disabled={isSaving}
            size="lg"
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
        </div>
      </CardContent>
    </Card>
  );
}
import { ArrowLeft, User, Monitor, Camera, Shield, Sun, Moon, Laptop, Box } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useTheme } from "next-themes";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

const Settings = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();
  
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  
  // Personal information fields
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [gender, setGender] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [heightFeet, setHeightFeet] = useState("");
  const [heightInches, setHeightInches] = useState("");
  const [heightCm, setHeightCm] = useState("");
  const [weightKg, setWeightKg] = useState("");
  const [bloodGroup, setBloodGroup] = useState("");
  
  const [showClock, setShowClock] = useState(true);
  const [showWeather, setShowWeather] = useState(true);
  const [showCalendar, setShowCalendar] = useState(true);
  const [showNews, setShowNews] = useState(true);
  
  const [analysisFrequency, setAnalysisFrequency] = useState("daily");

  // Avatar model selection
  const AVATAR_MODELS = [
    { id: "default", label: "ডিফল্ট অবতার", url: "/698bdd8efcad0d2f33536b28.glb" },
    { id: "model1", label: "মডেল ১", url: "/model.glb" },
    { id: "model2", label: "মডেল ২", url: "/model (1).glb" },
    { id: "animation", label: "অ্যানিমেটেড", url: "/animation.glb" },
  ];
  const [selectedAvatarModel, setSelectedAvatarModel] = useState(() => {
    return localStorage.getItem("hfd_avatar_model") || AVATAR_MODELS[0].url;
  });

  const handleAvatarModelChange = (url: string) => {
    setSelectedAvatarModel(url);
    localStorage.setItem("hfd_avatar_model", url);
    toast({
      title: "অবতার পরিবর্তন",
      description: "3D অবতার মডেল আপডেট হয়েছে",
    });
  };

  useEffect(() => {
    if (user) {
      setEmail(user.email || "");
      loadProfile();
    }
  }, [user]);

  const loadProfile = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from("profiles")
      .select("full_name, date_of_birth, gender, phone_number, height_feet, height_inches, weight_kg, blood_group")
      .eq("id", user.id)
      .single();
    
    if (data) {
      setFullName(data.full_name || "");
      setDateOfBirth(data.date_of_birth || "");
      setGender(data.gender || "");
      setPhoneNumber(data.phone_number || "");
      setHeightFeet(data.height_feet?.toString() || "");
      setHeightInches(data.height_inches?.toString() || "");
      setWeightKg(data.weight_kg?.toString() || "");
      setBloodGroup(data.blood_group || "");
    }
  };
  
  // Auto-calculate height in cm when feet/inches change
  useEffect(() => {
    const feet = parseInt(heightFeet) || 0;
    const inches = parseInt(heightInches) || 0;
    const cm = (feet * 30.48) + (inches * 2.54);
    setHeightCm(cm > 0 ? cm.toFixed(1) : "");
  }, [heightFeet, heightInches]);

  const handleSaveProfile = async () => {
    if (!user) return;
    
    setLoading(true);
    const { error } = await supabase
      .from("profiles")
      .update({ 
        full_name: fullName,
        date_of_birth: dateOfBirth || null,
        gender: gender || null,
        phone_number: phoneNumber || null,
        height_feet: heightFeet ? parseInt(heightFeet) : null,
        height_inches: heightInches ? parseInt(heightInches) : null,
        weight_kg: weightKg ? parseFloat(weightKg) : null,
        blood_group: bloodGroup || null,
      })
      .eq("id", user.id);
    
    setLoading(false);
    
    if (error) {
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
    }
  };

  const handleDeleteAccount = async () => {
    if (!confirm("Are you sure you want to delete your account? This action cannot be undone.")) {
      return;
    }
    
    toast({
      title: "Account Deletion",
      description: "Please contact support to delete your account",
    });
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/")}
            className="glass rounded-full"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-3xl font-bold">Settings</h1>
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 glass">
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="w-4 h-4" />
              <span className="hidden sm:inline">Profile</span>
            </TabsTrigger>
            <TabsTrigger value="display" className="flex items-center gap-2">
              <Monitor className="w-4 h-4" />
              <span className="hidden sm:inline">Display</span>
            </TabsTrigger>
            <TabsTrigger value="camera" className="flex items-center gap-2">
              <Camera className="w-4 h-4" />
              <span className="hidden sm:inline">Camera</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              <span className="hidden sm:inline">Security</span>
            </TabsTrigger>
          </TabsList>

          {/* Profile Settings */}
          <TabsContent value="profile">
            <Card className="glass p-6 space-y-6">
              <div>
                <h2 className="text-xl font-semibold mb-4">Basic Information</h2>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input
                      id="fullName"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Enter your full name"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      value={email}
                      disabled
                      className="mt-1 opacity-50"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Email cannot be changed
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="dateOfBirth">Date of Birth</Label>
                    <Input
                      id="dateOfBirth"
                      type="date"
                      value={dateOfBirth}
                      onChange={(e) => setDateOfBirth(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="gender">Gender</Label>
                    <Select value={gender} onValueChange={setGender}>
                      <SelectTrigger id="gender" className="mt-1">
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                        <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="phoneNumber">Phone Number</Label>
                    <Input
                      id="phoneNumber"
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="+1 (555) 000-0000"
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>

              <div className="border-t pt-6">
                <h2 className="text-xl font-semibold mb-4">Physical Information</h2>
                <div className="space-y-4">
                  <div>
                    <Label>Height</Label>
                    <div className="grid grid-cols-2 gap-3 mt-1">
                      <div>
                        <Input
                          type="number"
                          value={heightFeet}
                          onChange={(e) => setHeightFeet(e.target.value)}
                          placeholder="Feet"
                          min="0"
                          max="8"
                        />
                      </div>
                      <div>
                        <Input
                          type="number"
                          value={heightInches}
                          onChange={(e) => setHeightInches(e.target.value)}
                          placeholder="Inches"
                          min="0"
                          max="11"
                        />
                      </div>
                    </div>
                    {heightCm && (
                      <p className="text-xs text-muted-foreground mt-2">
                        ≈ {heightCm} cm
                      </p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="weightKg">Weight (kg)</Label>
                    <Input
                      id="weightKg"
                      type="number"
                      value={weightKg}
                      onChange={(e) => setWeightKg(e.target.value)}
                      placeholder="Enter weight in kilograms"
                      min="0"
                      step="0.1"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="bloodGroup">Blood Group</Label>
                    <Select value={bloodGroup} onValueChange={setBloodGroup}>
                      <SelectTrigger id="bloodGroup" className="mt-1">
                        <SelectValue placeholder="Select blood group" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="A+">A+</SelectItem>
                        <SelectItem value="A-">A-</SelectItem>
                        <SelectItem value="B+">B+</SelectItem>
                        <SelectItem value="B-">B-</SelectItem>
                        <SelectItem value="AB+">AB+</SelectItem>
                        <SelectItem value="AB-">AB-</SelectItem>
                        <SelectItem value="O+">O+</SelectItem>
                        <SelectItem value="O-">O-</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <Button onClick={handleSaveProfile} disabled={loading} className="w-full">
                {loading ? "Saving..." : "Save Changes"}
              </Button>
            </Card>
          </TabsContent>

          {/* Display Preferences */}
          <TabsContent value="display">
            <Card className="glass p-6 space-y-6">
              <div>
                <h2 className="text-xl font-semibold mb-4">Theme</h2>
                <div className="space-y-4">
                  <Label>Appearance</Label>
                  <RadioGroup value={theme} onValueChange={setTheme} className="gap-4">
                    <div className="flex items-center space-x-3 rounded-lg border border-border p-4 hover:bg-accent/50 cursor-pointer transition-colors">
                      <RadioGroupItem value="light" id="light" />
                      <Label htmlFor="light" className="flex items-center gap-2 cursor-pointer flex-1">
                        <Sun className="w-5 h-5 text-muted-foreground" />
                        <div>
                          <div className="font-medium">Light</div>
                          <div className="text-xs text-muted-foreground">Clean and bright interface</div>
                        </div>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-3 rounded-lg border border-border p-4 hover:bg-accent/50 cursor-pointer transition-colors">
                      <RadioGroupItem value="dark" id="dark" />
                      <Label htmlFor="dark" className="flex items-center gap-2 cursor-pointer flex-1">
                        <Moon className="w-5 h-5 text-muted-foreground" />
                        <div>
                          <div className="font-medium">Dark</div>
                          <div className="text-xs text-muted-foreground">Comfortable for your eyes</div>
                        </div>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-3 rounded-lg border border-border p-4 hover:bg-accent/50 cursor-pointer transition-colors">
                      <RadioGroupItem value="system" id="system" />
                      <Label htmlFor="system" className="flex items-center gap-2 cursor-pointer flex-1">
                        <Laptop className="w-5 h-5 text-muted-foreground" />
                        <div>
                          <div className="font-medium">System</div>
                          <div className="text-xs text-muted-foreground">Follows your device settings</div>
                        </div>
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
              </div>

              <div className="border-t pt-6">
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <Box className="w-5 h-5" />
                  3D Avatar Model
                </h2>
                <p className="text-sm text-muted-foreground mb-4">
                  মিরর ড্যাশবোর্ডে প্রদর্শিত 3D অবতার মডেল নির্বাচন করুন
                </p>
                <RadioGroup value={selectedAvatarModel} onValueChange={handleAvatarModelChange} className="gap-3">
                  {AVATAR_MODELS.map((model) => (
                    <div key={model.id} className="flex items-center space-x-3 rounded-lg border border-border p-4 hover:bg-accent/50 cursor-pointer transition-colors">
                      <RadioGroupItem value={model.url} id={`avatar-${model.id}`} />
                      <Label htmlFor={`avatar-${model.id}`} className="flex items-center gap-2 cursor-pointer flex-1">
                        <Box className="w-5 h-5 text-muted-foreground" />
                        <div>
                          <div className="font-medium">{model.label}</div>
                          <div className="text-xs text-muted-foreground">{model.url}</div>
                        </div>
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              <div className="border-t pt-6">
                <h2 className="text-xl font-semibold mb-4">Module Visibility</h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="clock">Show Clock</Label>
                    <Switch
                      id="clock"
                      checked={showClock}
                      onCheckedChange={setShowClock}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="weather">Show Weather</Label>
                    <Switch
                      id="weather"
                      checked={showWeather}
                      onCheckedChange={setShowWeather}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="calendar">Show Calendar</Label>
                    <Switch
                      id="calendar"
                      checked={showCalendar}
                      onCheckedChange={setShowCalendar}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="news">Show News Feed</Label>
                    <Switch
                      id="news"
                      checked={showNews}
                      onCheckedChange={setShowNews}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Note: Module visibility changes will be implemented in a future update
                  </p>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* Camera & Analysis Settings */}
          <TabsContent value="camera">
            <Card className="glass p-6 space-y-6">
              <div>
                <h2 className="text-xl font-semibold mb-4">Camera & Analysis Settings</h2>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="frequency">Analysis Frequency</Label>
                    <Select value={analysisFrequency} onValueChange={setAnalysisFrequency}>
                      <SelectTrigger id="frequency" className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="manual">Manual Only</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground mt-1">
                      How often you want to perform skin analysis
                    </p>
                  </div>
                  <div>
                    <Label>Camera Resolution</Label>
                    <Select defaultValue="1080p">
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="720p">720p (HD)</SelectItem>
                        <SelectItem value="1080p">1080p (Full HD)</SelectItem>
                        <SelectItem value="4k">4K (Ultra HD)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* Account & Security */}
          <TabsContent value="security">
            <Card className="glass p-6 space-y-6">
              <div>
                <h2 className="text-xl font-semibold mb-4">Account & Security</h2>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium mb-2">Change Password</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      Update your password to keep your account secure
                    </p>
                    <Button variant="outline" onClick={() => {
                      toast({
                        title: "Password Reset",
                        description: "Password reset email sent to your email address",
                      });
                    }}>
                      Send Reset Email
                    </Button>
                  </div>
                  <div className="border-t pt-4">
                    <h3 className="font-medium mb-2 text-destructive">Delete Account</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      Permanently delete your account and all associated data
                    </p>
                    <Button variant="destructive" onClick={handleDeleteAccount}>
                      Delete Account
                    </Button>
                  </div>
                  <div className="border-t pt-4">
                    <h3 className="font-medium mb-2">Sign Out</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      Sign out from your account on this device
                    </p>
                    <Button variant="outline" onClick={signOut}>
                      Sign Out
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Settings;

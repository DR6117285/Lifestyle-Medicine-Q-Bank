# LMQB Desktop Shortcut Instructions

## 🚀 One-Click Desktop Launcher for LMQB

### **Option 1: VBS Launcher (Recommended)**

1. **Copy the launcher to your desktop:**
   - Navigate to: `\\wsl.localhost\Ubuntu\home\dr6117285\lmqb\`
   - Copy `LMQB-Launcher.vbs` to your desktop: `C:\Users\saqib\Desktop\`

2. **Create a nice shortcut:**
   - Right-click `LMQB-Launcher.vbs` on your desktop
   - Select "Create shortcut"
   - Rename the shortcut to: `🎓 LMQB - Lifestyle Medicine Quiz`
   - Right-click the shortcut → Properties → Change Icon (optional)

3. **Double-click to launch!**
   - Starts all Supabase services
   - Launches React frontend 
   - Opens browsers automatically
   - Shows status messages

### **Option 2: PowerShell Launcher**

1. **Copy to desktop:**
   - Copy `start-lmqb.ps1` to: `C:\Users\saqib\Desktop\`

2. **Create shortcut:**
   - Right-click desktop → New → Shortcut
   - Location: `powershell.exe -ExecutionPolicy Bypass -File "C:\Users\saqib\Desktop\start-lmqb.ps1"`
   - Name: `LMQB Application`

### **Option 3: Batch File Launcher**

1. **Copy to desktop:**
   - Copy `start-lmqb.bat` to: `C:\Users\saqib\Desktop\`

2. **Double-click to run**
   - Simpler but less error handling

---

## 🎯 **What the Launcher Does**

1. ✅ **Starts Supabase Services** - Database, API, Auth, Admin Studio
2. ✅ **Launches React Frontend** - Development server on port 3000  
3. ✅ **Opens Browsers** - Automatically opens the app and admin panel
4. ✅ **Shows Status** - Progress messages and error handling
5. ✅ **Ready to Use** - 777 medical questions available immediately

## 🌐 **Application URLs (Auto-opened)**

- **Main App**: http://localhost:3000 (Student/learning interface)
- **Admin Studio**: http://127.0.0.1:54323 (Database management)
- **API**: http://127.0.0.1:54321 (Backend services)

## ⚠️ **Prerequisites**

Make sure you have:
- ✅ **WSL installed and working**
- ✅ **Docker running in WSL** 
- ✅ **LMQB project at the correct path**
- ✅ **Node.js dependencies installed** (frontend folder)

## 🔧 **Manual Startup (If Needed)**

If the one-click launcher doesn't work, you can start manually:

```bash
# Open WSL terminal and run:
cd /home/dr6117285/lmqb

# Start Supabase
~/.local/bin/supabase start

# In another terminal, start frontend
cd frontend && npm run dev
```

Then open browsers:
- http://localhost:3000
- http://127.0.0.1:54323

## 🎓 **Ready for Education!**

Once launched, the LMQB application provides:
- **777 Lifestyle Medicine Questions**
- **3 Quiz Modes** (Random, Section, Timed)
- **Instant Feedback** with detailed explanations
- **Progress Tracking** and performance analytics
- **User Authentication** and admin tools
- **Mobile Responsive** design

**Happy Learning! 📚✨**
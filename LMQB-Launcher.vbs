' LMQB Application Launcher
' Lifestyle Medicine Question Bank - One-Click Desktop Launcher

Dim shell, fso, scriptPath, projectPath

Set shell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")

' Get the directory where this script is located
scriptPath = fso.GetParentFolderName(WScript.ScriptFullName)
projectPath = "\\wsl.localhost\Ubuntu\home\dr6117285\lmqb"

' Show startup message
MsgBox "Starting LMQB Application..." & vbCrLf & vbCrLf & _
       "Lifestyle Medicine Question Bank" & vbCrLf & _
       "This will start Supabase and the React frontend." & vbCrLf & vbCrLf & _
       "Please wait while services initialize...", _
       vbInformation, "LMQB Launcher"

' Check if project exists
If Not fso.FolderExists(projectPath) Then
    MsgBox "Error: Project directory not found!" & vbCrLf & vbCrLf & _
           "Expected: " & projectPath & vbCrLf & vbCrLf & _
           "Please make sure the LMQB project is available in WSL.", _
           vbCritical, "LMQB Launcher Error"
    WScript.Quit
End If

' Run the PowerShell launcher
Dim psCommand
psCommand = "powershell.exe -ExecutionPolicy Bypass -File """ & projectPath & "\start-lmqb.ps1"""

On Error Resume Next
shell.Run psCommand, 1, False

If Err.Number <> 0 Then
    ' Fallback to batch file
    Dim batCommand
    batCommand = """" & projectPath & "\start-lmqb.bat"""
    shell.Run batCommand, 1, False
    
    If Err.Number <> 0 Then
        MsgBox "Error starting LMQB application!" & vbCrLf & vbCrLf & _
               "Please ensure:" & vbCrLf & _
               "1. WSL is installed and working" & vbCrLf & _
               "2. Docker is running in WSL" & vbCrLf & _
               "3. The LMQB project is in the correct location", _
               vbCritical, "LMQB Launcher Error"
    End If
End If
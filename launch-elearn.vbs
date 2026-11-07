Set WshShell = CreateObject("WScript.Shell")
WshShell.Run "cmd /c " & chr(34) & "D:\LEA\Workspace\antigravity workspace\ELearn\launch-elearn.bat" & chr(34), 0, False
Set WshShell = Nothing

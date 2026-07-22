Dim WshShell
Set WshShell = CreateObject("WScript.Shell")

' Cerrar cualquier proceso node que esté corriendo
WshShell.Run "taskkill /F /IM node.exe", 0, True

' Esperar un segundo
WScript.Sleep 1000

' Arrancar el backend de nuevo en segundo plano
WshShell.CurrentDirectory = "C:\Users\franp\OneDrive\Documentos\GitHub\ZENG\api"
WshShell.Run """C:\Program Files\nodejs\node.exe"" index.js", 0, False

' Avisar que ya está
MsgBox "Servidor ZENG reiniciado. Recargá la app en el navegador.", 64, "ZENG"

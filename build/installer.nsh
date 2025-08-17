!macro customInstall
  ; Set default installation directory
  StrCpy $INSTDIR "C:\Program Files\PatientManagement"
!macroend

;--------------------------------
; Custom page at the end
;--------------------------------
!macro customFinish
  ; Run postinstall.js to handle folder creation, config.json, etc.
  ; Assumes postinstall.js is copied to $INSTDIR\build\postinstall.js via extraResources
  ExecWait '"$INSTDIR\node_modules\.bin\node" "$INSTDIR\build\postinstall.js"' $0
  ; Check if postinstall succeeded
  StrCmp $0 0 +2
    MessageBox MB_ICONEXCLAMATION "Post-install script failed. Please check logs."  

  ; Show message box with Open App option
  MessageBox MB_ICONINFORMATION|MB_OKCANCEL "Installation Complete! Click OK to open Patient Management." IDOK OpenApp

  ; If user clicks OK, launch the installed app
  OpenApp:
    Exec "$INSTDIR\PatientManageme

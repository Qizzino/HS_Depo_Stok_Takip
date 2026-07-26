Attribute VB_Name = "modCore"
Option Explicit

' Ekran güncellemelerini ve hesaplamaları kapatarak makro hızını artırır
Public Sub FastMode(ByVal State As Boolean)
    On Error Resume Next
    With Application
        .ScreenUpdating = Not State
        .EnableEvents = Not State
        .DisplayAlerts = Not State
        If State Then
            .Calculation = xlCalculationManual
        Else
            .Calculation = xlCalculationAutomatic
        End If
    End With
    On Error GoTo 0
End Sub

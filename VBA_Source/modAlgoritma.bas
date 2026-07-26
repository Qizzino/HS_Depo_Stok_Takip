Attribute VB_Name = "modAlgoritma"
Option Explicit

' Belirli bir poz numarası için net stoğu hesaplar
Public Function CalculateNetStok(ByVal PozNo As String) As Double
    Dim wsHareket As Worksheet
    Set wsHareket = modDatabase.GetSheet(modDatabase.WS_HAREKET)
    If wsHareket Is Nothing Then
        CalculateNetStok = 0
        Exit Function
    End If
    
    Dim lastRow As Long
    lastRow = wsHareket.Cells(wsHareket.Rows.Count, "A").End(xlUp).Row
    If lastRow < 2 Then
        CalculateNetStok = 0
        Exit Function
    End If
    
    Dim arr As Variant
    arr = wsHareket.Range("A2:N" & lastRow).Value
    
    Dim i As Long
    Dim net As Double
    net = 0
    
    ' 3: İşlem Türü, 4: Poz No, 6: Miktar
    For i = 1 To UBound(arr, 1)
        If CStr(arr(i, 4)) = CStr(PozNo) Then
            Dim IslemTuru As String
            IslemTuru = Trim(UCase(CStr(arr(i, 3))))
            
            Dim Miktar As Double
            Miktar = 0
            If IsNumeric(arr(i, 6)) Then Miktar = CDbl(arr(i, 6))
            
            Select Case IslemTuru
                Case "GİRİŞ", "GIRIŞ", "İADE GİRİŞİ", "IADE GIRISI"
                    net = net + Miktar
                Case "ÇIKIŞ", "CIKIS", "İADE ÇIKIŞI", "IADE CIKISI"
                    net = net - Miktar
            End Select
        End If
    Next i
    
    CalculateNetStok = net
End Function

' Malzemeler sayfasındaki anlık stok hücresini günceller
Public Sub UpdateStok(ByVal PozNo As String)
    Dim wsMalzeme As Worksheet
    Set wsMalzeme = modDatabase.GetSheet(modDatabase.WS_MALZEME)
    If wsMalzeme Is Nothing Then Exit Sub
    
    Dim lastRow As Long
    lastRow = wsMalzeme.Cells(wsMalzeme.Rows.Count, "A").End(xlUp).Row
    If lastRow < 2 Then Exit Sub
    
    Dim arr As Variant
    arr = wsMalzeme.Range("A2:E" & lastRow).Value
    
    Dim i As Long
    Dim targetRow As Long
    targetRow = 0
    
    ' 1: Poz No
    For i = 1 To UBound(arr, 1)
        If CStr(arr(i, 1)) = CStr(PozNo) Then
            targetRow = i + 1
            Exit For
        End If
    Next i
    
    If targetRow > 0 Then
        Dim currentStok As Double
        currentStok = CalculateNetStok(PozNo)
        wsMalzeme.Cells(targetRow, 5).Value = currentStok
    End If
End Sub

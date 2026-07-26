Attribute VB_Name = "modDatabase"
Option Explicit

' Genel veritabanı sayfa isimleri
Public Const WS_MALZEME As String = "S_Malzemeler"
Public Const WS_HAREKET As String = "S_Hareketler"
Public Const WS_PARAMETRE As String = "S_Parametreler"

' Sheet referanslarını güvenli almak için
Public Function GetSheet(ByVal SheetName As String) As Worksheet
    On Error Resume Next
    Set GetSheet = ThisWorkbook.Worksheets(SheetName)
    On Error GoTo 0
End Function

' Yeni Sayfa oluşturma ve başlıkları ayarlama
Public Sub CheckAndCreateSheets()
    Dim ws As Worksheet
    
    ' Malzemeler Sayfası
    If GetSheet(WS_MALZEME) Is Nothing Then
        Set ws = ThisWorkbook.Worksheets.Add(After:=ThisWorkbook.Worksheets(ThisWorkbook.Worksheets.Count))
        ws.Name = WS_MALZEME
        ws.Range("A1:E1").Value = Array("Poz No", "Malzeme Adı", "Birim", "Birim Fiyat", "Anlık Stok")
        ws.Range("A1:E1").Font.Bold = True
        ws.Columns.AutoFit
    End If
    
    ' Hareketler Sayfası
    If GetSheet(WS_HAREKET) Is Nothing Then
        Set ws = ThisWorkbook.Worksheets.Add(After:=ThisWorkbook.Worksheets(ThisWorkbook.Worksheets.Count))
        ws.Name = WS_HAREKET
        ws.Range("A1:N1").Value = Array("Hareket ID", "İşlem Tarihi", "İşlem Türü", "Poz No", "Malzeme Adı", "Miktar", "Birim", "Ana Depo", "İşlem Depo", "Proje Adı", "İhale Grubu", "İşlem Yapan/Teslim Alan", "Belge No", "İrsaliye Dosya Yolu")
        ws.Range("A1:N1").Font.Bold = True
        ws.Columns.AutoFit
    End If
    
    ' Parametreler Sayfası
    If GetSheet(WS_PARAMETRE) Is Nothing Then
        Set ws = ThisWorkbook.Worksheets.Add(After:=ThisWorkbook.Worksheets(ThisWorkbook.Worksheets.Count))
        ws.Name = WS_PARAMETRE
        ws.Range("A1:D1").Value = Array("İşlem Türleri", "Depolar", "Projeler", "İhale Grupları")
        ws.Range("A1:D1").Font.Bold = True
        
        ' Varsayılan işlem türleri
        ws.Range("A2:A6").Value = Application.Transpose(Array("Giriş", "Çıkış", "İade Girişi", "İade Çıkışı", "Ters Kayıt"))
        ws.Columns.AutoFit
    End If
End Sub

' Veritabanına yeni hareket ekler (Dizi ile çok hızlı çalışır)
Public Sub AddHareket(ByVal IslemTarihi As String, ByVal IslemTuru As String, ByVal PozNo As String, ByVal MalzemeAdi As String, ByVal Miktar As Double, ByVal Birim As String, ByVal AnaDepo As String, ByVal IslemDepo As String, ByVal ProjeAdi As String, ByVal IhaleGrubu As String, ByVal IslemYapan As String, ByVal BelgeNo As String, ByVal IrsaliyeYolu As String)
    Dim ws As Worksheet
    Set ws = GetSheet(WS_HAREKET)
    If ws Is Nothing Then Exit Sub
    
    Dim lastRow As Long
    lastRow = ws.Cells(ws.Rows.Count, "A").End(xlUp).Row + 1
    
    Dim ID As String
    ID = Format(Now, "YYYYMMDDHHNNSS") & "-" & Int((999 - 100 + 1) * Rnd + 100)
    
    Dim arr(1 To 1, 1 To 14) As Variant
    arr(1, 1) = ID
    arr(1, 2) = IslemTarihi
    arr(1, 3) = IslemTuru
    arr(1, 4) = PozNo
    arr(1, 5) = MalzemeAdi
    arr(1, 6) = Miktar
    arr(1, 7) = Birim
    arr(1, 8) = AnaDepo
    arr(1, 9) = IslemDepo
    arr(1, 10) = ProjeAdi
    arr(1, 11) = IhaleGrubu
    arr(1, 12) = IslemYapan
    arr(1, 13) = BelgeNo
    
    If IrsaliyeYolu <> "" Then
        arr(1, 14) = "=HYPERLINK(""" & IrsaliyeYolu & """, ""Görüntüle"")"
    Else
        arr(1, 14) = ""
    End If
    
    ws.Range("A" & lastRow & ":N" & lastRow).Formula = arr
    
    ' Stok miktarını da Malzemeler sayfasında güncelle
    Call modAlgoritma.UpdateStok(PozNo)
End Sub

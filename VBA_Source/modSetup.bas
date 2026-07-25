Attribute VB_Name = "modSetup"
Option Explicit

' Sistemi ilk defa kurmak ve gerekli sayfaları Excel'e entegre etmek için
Public Sub SistemiKur()
    ' Sayfaları oluştur (Yoksa)
    Call modDatabase.CheckAndCreateSheets
    
    ' Başarı mesajı
    MsgBox "Veritabanı sayfaları başarıyla oluşturuldu/kontrol edildi." & vbCrLf & _
           "S_Malzemeler, S_Hareketler ve S_Parametreler sayfalarını kullanabilirsiniz.", vbInformation, "Kurulum Tamamlandı"
End Sub

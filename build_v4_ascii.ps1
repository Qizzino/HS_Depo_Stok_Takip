$ErrorActionPreference = "Stop"

# 1. Enable VBA Trust
$regPath = "HKCU:\Software\Microsoft\Office\16.0\Excel\Security"
if (-not (Test-Path $regPath)) { New-Item -Path $regPath -Force | Out-Null }
Set-ItemProperty -Path $regPath -Name "AccessVBOM" -Value 1 -Type DWord

$excel = New-Object -ComObject Excel.Application
$excel.Visible = $false
$excel.DisplayAlerts = $false

try {
    $wb = $excel.Workbooks.Add()
    while ($wb.Worksheets.Count -lt 3) { $wb.Worksheets.Add() | Out-Null }
    
    # 3. Rename sheets and set headers (ONLY ASCII CHARACTERS!)
    $ws1 = $wb.Worksheets.Item(1)
    $ws1.Name = "S_Malzemeler"
    $ws1.Range("A1:E1").Value2 = @("Poz No", "Malzeme Adi", "Birim", "Birim Fiyat", "Anlik Stok")
    $ws1.Range("A1:E1").Font.Bold = $true
    
    $ws2 = $wb.Worksheets.Item(2)
    $ws2.Name = "S_Hareketler"
    $ws2.Range("A1:N1").Value2 = @("Hareket ID", "Islem Tarihi", "Islem Turu", "Poz No", "Malzeme Adi", "Miktar", "Birim", "Ana Depo", "Islem Depo", "Proje Adi", "Ihale Grubu", "Islem Yapan", "Belge No", "Irsaliye Dosya Yolu")
    $ws2.Range("A1:N1").Font.Bold = $true
    
    $ws3 = $wb.Worksheets.Item(3)
    $ws3.Name = "S_Parametreler"
    $ws3.Range("A1:D1").Value2 = @("Islem Turleri", "Depolar", "Projeler", "Ihale Gruplari")
    $ws3.Range("A1:D1").Font.Bold = $true
    
    $paramVals = @("Giris", "Cikis", "Iade Girisi", "Iade Cikisi", "Ters Kayit")
    for ($i = 0; $i -lt $paramVals.Length; $i++) {
        $ws3.Cells.Item($i + 2, 1).Value2 = $paramVals[$i]
    }
    
    # 4. Import modules
    $vbaFolder = "C:\Users\LENOVO\.gemini\antigravity-ide\scratch\MSY_StokTakip\VBA_Source"
    $modules = @("modCore.bas", "modDatabase.bas", "modAlgoritma.bas")
    $vbproj = $wb.VBProject
    
    foreach ($mod in $modules) {
        $fullPath = Join-Path $vbaFolder $mod
        if (Test-Path $fullPath) {
            $vbproj.VBComponents.Import($fullPath) | Out-Null
        }
    }
    
    # 5. Dynamically Create UserForm
    $frm = $vbproj.VBComponents.Add(3)
    $frm.Name = "frmHareket"
    $frm.Properties.Item("Caption").Value = "Hizli Stok Hareketi (UYARISIZ)"
    $frm.Properties.Item("Width").Value = 350
    $frm.Properties.Item("Height").Value = 300
    
    # Controls
    $cbIslem = $frm.Designer.Controls.Add("Forms.ComboBox.1", "cbIslem", $true)
    $cbIslem.Top = 15; $cbIslem.Left = 100; $cbIslem.Width = 200
    
    $lbl1 = $frm.Designer.Controls.Add("Forms.Label.1", "lbl1", $true)
    $lbl1.Caption = "Islem Turu:"; $lbl1.Top = 18; $lbl1.Left = 10
    
    $txtPoz = $frm.Designer.Controls.Add("Forms.TextBox.1", "txtPoz", $true)
    $txtPoz.Top = 45; $txtPoz.Left = 100; $txtPoz.Width = 200
    
    $lbl2 = $frm.Designer.Controls.Add("Forms.Label.1", "lbl2", $true)
    $lbl2.Caption = "Poz No:"; $lbl2.Top = 48; $lbl2.Left = 10
    
    $txtMiktar = $frm.Designer.Controls.Add("Forms.TextBox.1", "txtMiktar", $true)
    $txtMiktar.Top = 75; $txtMiktar.Left = 100; $txtMiktar.Width = 200
    
    $lbl3 = $frm.Designer.Controls.Add("Forms.Label.1", "lbl3", $true)
    $lbl3.Caption = "Miktar:"; $lbl3.Top = 78; $lbl3.Left = 10
    
    $btnSave = $frm.Designer.Controls.Add("Forms.CommandButton.1", "cmdKaydet", $true)
    $btnSave.Caption = "KAYDET (Onaysiz Hizli Kayit)"
    $btnSave.Top = 120; $btnSave.Left = 100; $btnSave.Width = 200; $btnSave.Height = 40
    $btnSave.BackColor = 65280
    
    # Add Code
    $code = @"
Private Sub UserForm_Initialize()
    Dim ws As Worksheet
    On Error Resume Next
    Set ws = ThisWorkbook.Worksheets("S_Parametreler")
    If Not ws Is Nothing Then
        Dim i As Integer
        i = 2
        While ws.Cells(i, 1).Value <> ""
            Me.cbIslem.AddItem ws.Cells(i, 1).Value
            i = i + 1
        Wend
    End If
End Sub

Private Sub cmdKaydet_Click()
    If Me.txtPoz.Text = "" Or Me.txtMiktar.Text = "" Or Me.cbIslem.Text = "" Then Exit Sub
    
    Dim Tarih As String
    Tarih = Format(Now, "DD.MM.YYYY HH:NN:SS")
    
    Call modDatabase.AddHareket(Tarih, Me.cbIslem.Text, Me.txtPoz.Text, "Tanimlanmamis", Val(Me.txtMiktar.Text), "Adet", "", "", "", "", "Admin", "", "")
    
    Me.txtPoz.Text = ""
    Me.txtMiktar.Text = ""
    Me.txtPoz.SetFocus
End Sub
"@
    $frm.CodeModule.AddFromString($code) | Out-Null
    
    $mainMod = $vbproj.VBComponents.Add(1)
    $mainMod.Name = "modGiris"
    $mainCode = @"
Public Sub FormuAc()
    frmHareket.Show
End Sub
"@
    $mainMod.CodeModule.AddFromString($mainCode) | Out-Null
    
    $savePath = "C:\Users\LENOVO\Desktop\MSY_Stok_Takip_V3.xlsm"
    if (Test-Path $savePath) { Remove-Item $savePath -Force }
    $wb.SaveAs($savePath, 52)
    Write-Output "Excel file built successfully at $savePath"
    
} catch {
    Write-Output "Error: $_"
} finally {
    if ($wb) { $wb.Close($false) }
    $excel.Quit()
    [System.Runtime.Interopservices.Marshal]::ReleaseComObject($excel) | Out-Null
}

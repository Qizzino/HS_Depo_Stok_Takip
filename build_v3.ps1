$ErrorActionPreference = "Stop"

function B64ToUTF8($b64) {
    return [System.Text.Encoding]::UTF8.GetString([System.Convert]::FromBase64String($b64))
}

$sMalz = B64ToUTF8 "U19NYWx6ZW1lbGVy"
$sHar = B64ToUTF8 "U19IYXJla2V0bGVy"
$sPar = B64ToUTF8 "U19QYXJhbWV0cmVsZXI="
$sDash = B64ToUTF8 "QU5BX0VLUkFO"
$sGiris = B64ToUTF8 "WUVOSV9JU0xFTQ=="

$hMalz = @("Poz No", "Malzeme Adi", "Birim", "Birim Fiyat", (B64ToUTF8 "QW5sxLFrIFN0b2s="))
$hHar = @((B64ToUTF8 "SGFyZWtldCBJRA=="), (B64ToUTF8 "xLDFn2xlbSBUYXJpaGk="), (B64ToUTF8 "xLDFn2xlbSBUw7xyw7w="), "Poz No", "Malzeme Adi", "Miktar", "Birim", "Ana Depo", (B64ToUTF8 "xLDFn2xlbSBEZXBv"), "Proje", (B64ToUTF8 "xLBoYWxlIEdydWJ1"), (B64ToUTF8 "xLDFn2xlbSBZYXBhbg=="), "Belge No", (B64ToUTF8 "xLByc2FsaXllIFlvbHU="))
$hPar = @((B64ToUTF8 "xLDFn2xlbSBUw7xybGVyaQ=="), "Depolar", "Projeler", (B64ToUTF8 "xLBoYWxlIEdydXBsYXLEsQ=="))
$paramVals = @((B64ToUTF8 "R2lyacWf"), (B64ToUTF8 "w4fEsWvEscWf"), (B64ToUTF8 "xLBCYWRlIEdpcmnFn2k="), (B64ToUTF8 "xLBCYWRlIMOHxLFrxLHFn8LEsQ=="), (B64ToUTF8 "VGVycyBLYXnEsXQ="))

# 1. Enable VBA Trust
$regPath = "HKCU:\Software\Microsoft\Office\16.0\Excel\Security"
if (-not (Test-Path $regPath)) { New-Item -Path $regPath -Force | Out-Null }
Set-ItemProperty -Path $regPath -Name "AccessVBOM" -Value 1 -Type DWord

$excel = New-Object -ComObject Excel.Application
$excel.Visible = $false
$excel.DisplayAlerts = $false

try {
    $wb = $excel.Workbooks.Add()
    while ($wb.Worksheets.Count -lt 5) { $wb.Worksheets.Add() | Out-Null }
    
    # 1. Ana Ekran (Dashboard)
    $wsDash = $wb.Worksheets.Item(1)
    $wsDash.Name = $sDash
    $wsDash.Cells.Interior.Color = 14395790 # Koyu Lacivert arka plan
    
    $wsDash.Range("C3:H5").Merge()
    $title = $wsDash.Range("C3")
    $title.Value2 = "MSY STOK TAKIP SISTEMI"
    $title.Font.Size = 28
    $title.Font.Bold = $true
    $title.Font.Color = 16777215 # Beyaz
    $title.HorizontalAlignment = -4108 # xlCenter
    $title.VerticalAlignment = -4108
    
    $shp1 = $wsDash.Shapes.AddShape(1, 100, 150, 200, 50)
    $shp1.TextFrame.Characters().Text = (B64ToUTF8 "WUVOxLAgxLDFnsxMRU0gR8SwUsSwxZ4vw4dJS0nFng==")
    $shp1.TextFrame.Characters().Font.Size = 14
    $shp1.TextFrame.Characters().Font.Bold = $true
    $shp1.OnAction = "GitYeniIslem"
    
    $shp2 = $wsDash.Shapes.AddShape(1, 100, 220, 200, 50)
    $shp2.TextFrame.Characters().Text = "MALZEMELERI GORUNTULE"
    $shp2.TextFrame.Characters().Font.Size = 14
    $shp2.TextFrame.Characters().Font.Bold = $true
    $shp2.OnAction = "GitMalzemeler"
    
    $shp3 = $wsDash.Shapes.AddShape(1, 100, 290, 200, 50)
    $shp3.TextFrame.Characters().Text = (B64ToUTF8 "SEFSRUtFVExFUsSwIEdPUlVOVFVMRQ==")
    $shp3.TextFrame.Characters().Font.Size = 14
    $shp3.TextFrame.Characters().Font.Bold = $true
    $shp3.OnAction = "GitHareketler"

    # 2. Yeni Islem
    $wsGiris = $wb.Worksheets.Item(2)
    $wsGiris.Name = $sGiris
    $wsGiris.Cells.Interior.Color = 15790320
    
    $wsGiris.Range("B2:D2").Merge()
    $wsGiris.Range("B2").Value2 = (B64ToUTF8 "SElaTEkgU1RPSyBIQVJFbEVUxLAgR8SwUsSwxZ5J")
    $wsGiris.Range("B2").Font.Size = 18
    $wsGiris.Range("B2").Font.Bold = $true
    
    $wsGiris.Range("B5").Value2 = (B64ToUTF8 "xLDFn2xlbSBUw7xyw7w=")
    $wsGiris.Range("B7").Value2 = "Poz No"
    $wsGiris.Range("B9").Value2 = "Miktar"
    
    $wsGiris.Range("B5:B9").Font.Size = 14
    $wsGiris.Range("B5:B9").Font.Bold = $true
    
    $wsGiris.Range("C5,C7,C9").Interior.Color = 16777215
    $wsGiris.Range("C5,C7,C9").Borders.LineStyle = 1
    $wsGiris.Range("C5,C7,C9").Font.Size = 14
    $wsGiris.Columns.Item("C").ColumnWidth = 25
    
    $dv = $wsGiris.Range("C5").Validation
    $dv.Add(3, 1, 1, "=$sPar!`$A`$2:`$A`$6") | Out-Null
    
    $btnSave = $wsGiris.Shapes.AddShape(1, 150, 250, 150, 40)
    $btnSave.TextFrame.Characters().Text = (B64ToUTF8 "S0FZREVUIChPbmF5c8Sxeik=")
    $btnSave.TextFrame.Characters().Font.Size = 14
    $btnSave.TextFrame.Characters().Font.Bold = $true
    $btnSave.Fill.ForeColor.RGB = 5287936
    $btnSave.OnAction = "KaydetHizli"
    
    $btnBack = $wsGiris.Shapes.AddShape(1, 10, 10, 100, 30)
    $btnBack.TextFrame.Characters().Text = (B64ToUTF8 "PC0gQW5hIEVrcmFu")
    $btnBack.OnAction = "GitAnaEkran"
    
    # 3. Malzemeler
    $wsMalz = $wb.Worksheets.Item(3)
    $wsMalz.Name = $sMalz
    $wsMalz.Range("A1:E1").Value2 = $hMalz
    $wsMalz.Range("A1:E1").Font.Bold = $true
    $wsMalz.Range("A1:E1").Interior.Color = 14395790
    $wsMalz.Range("A1:E1").Font.Color = 16777215
    $btnBack2 = $wsMalz.Shapes.AddShape(1, 400, 10, 100, 30)
    $btnBack2.TextFrame.Characters().Text = (B64ToUTF8 "PC0gQW5hIEVrcmFu")
    $btnBack2.OnAction = "GitAnaEkran"
    
    # 4. Hareketler
    $wsHar = $wb.Worksheets.Item(4)
    $wsHar.Name = $sHar
    $wsHar.Range("A1:N1").Value2 = $hHar
    $wsHar.Range("A1:N1").Font.Bold = $true
    $wsHar.Range("A1:N1").Interior.Color = 14395790
    $wsHar.Range("A1:N1").Font.Color = 16777215
    $btnBack3 = $wsHar.Shapes.AddShape(1, 900, 10, 100, 30)
    $btnBack3.TextFrame.Characters().Text = (B64ToUTF8 "PC0gQW5hIEVrcmFu")
    $btnBack3.OnAction = "GitAnaEkran"
    
    # 5. Parametreler
    $wsPar = $wb.Worksheets.Item(5)
    $wsPar.Name = $sPar
    $wsPar.Range("A1:D1").Value2 = $hPar
    $wsPar.Range("A1:D1").Font.Bold = $true
    for ($i = 0; $i -lt $paramVals.Length; $i++) {
        $wsPar.Cells.Item($i + 2, 1).Value2 = $paramVals[$i]
    }
    
    # Add VBA Module
    $vbaCodeBase64 = "T3B0aW9uIEV4cGxpY2l0DQoNClB1YmxpYyBTdWIgR2l0QW5hRWtyYW4oKQ0KICAgIFRoaXNXb3JrYm9vay5TaGVldHMoIkFOQV9FS1JBTiIpLkFjdGl2YXRlDQpFbmQgU3ViDQoNClB1YmxpYyBTdWIgR2l0WWVuaUlzbGVtKCkNCiAgICBUaGlzV29ya2Jvb2suU2hlZXRzKCJZRU5JX0lTTEVNIikuQWN0aXZhdGUNCkVuZCBTdWINCg0KUHVibGljIFN1YiBHaXRNYWx6ZW1lbGVyKCkNCiAgICBUaGlzV29ya2Jvb2suU2hlZXRzKCJTX01hbHplbWVsZXIiKS5BY3RpdmF0ZQ0KRW5kIFN1Yg0KDQpQdWJsaWMgU3ViIEdpdEhhcmVrZXRsZXIoKQ0KICAgIFRoaXNXb3JrYm9vay5TaGVldHMoIlNfSGFyZWtldGxlciIpLkFjdGl2YXRlDQpFbmQgU3ViDQoNClB1YmxpYyBTdWIgS2F5ZGV0SGl6bGkoKQ0KICAgIERpbSB3c0dpcmlzIEFzIFdvcmtzaGVldA0KICAgIFNldCB3c0dpcmlzID0gVGhpc1dvcmtib29rLlNoZWV0cygiWUVOSV9JU0xFTSIpDQogICAgDQogICAgRGltIGlzbGVtIFR1cnUgQXMgU3RyaW5nDQogICAgRGltIHBveiBBcyBTdHJpbmcNCiAgICBEaW0gbWlrdGFyIEFzIFZhcmlhbnQNCiAgICANCiAgICBpc2xlbVR1cnUgPSB3c0dpcmlzLlJhbmdlKCJDNSIpLlZhbHVlDQogICAgcG96ID0gd3NHaXJpcy5SYW5nZSgiQzciKS5WYWx1ZQ0KICAgIG1pa3RhciA9IHdzR2lyaXMuUmFuZ2UoIkM5IikuVmFsdWUgJ2dpcmlzaW4gYm9zIG9sdXAgb2xtYWRpZ2luaSBrb250cm9sIGVkaXlvcnV6DQogICAgDQogICAgSWYgaXNsZW1UdXJ1ID0gIiIgT3IgcG96ID0gIiIgT3IgSXNFbXB0eShtaWt0YXIpIFRoZW4NCiAgICAgICAgTXNnQm94ICJMdXRmZW4gdHVtIGFsYW5sYXJpIGRvbGR1cnVuISIsIHZiRXhjbGFtYXRpb24NCiAgICAgICAgRXhpdCBTdWINCiAgICBFbmQgSWYNCiAgICANCiAgICBEaW0gd3NIYXIgQXMgV29ya3NoZWV0DQogICAgU2V0IHdzSGFyID0gVGhpc1dvcmtib29rLlNoZWV0cygiU19IYXJla2V0bGVyIikNCiAgICBEaW0gbGFzdFJvdyBBcyBMb25nDQogICAgbGFzdFJvdyA9IHdzSGFyLkNlbGxzKHdzSGFyLlJvd3MuQ291bnQsICJBIikuRW5kKHhsVXApLlJvdyArIDENCiAgICANCiAgICB3c0hhci5DZWxscyhsYXN0Um93LCAxKS5WYWx1ZSA9IEZvcm1hdChOb3csICJZWVlZTU1ERC1ISE5OU1MiKQ0KICAgIHdzSGFyLkNlbGxzKGxhc3RSb3csIDIpLkZhbHVlID0gRm9ybWF0KE5vdywgImRkLm1tLnl5eXkgaGg6bm4iKQ0KICAgIHdzSGFyLkNlbGxzKGxhc3RSb3csIDMpLkZhbHVlID0gaXNsZW1UdXJ1DQogICAgd3NIYXIuQ2VsbHMobGFzdFJvdywgNCkuVmFsdWUgPSBwb3oNCiAgICB3c0hhci5DZWxscyhsYXN0Um93LCA2KS5WYWx1ZSA9IENEYmwobWlrdGFyKQ0KICAgIA0KICAgICd0ZW1pemxlDQogICAgd3NHaXJpcy5SYW5nZSgiQzciKS5WYWx1ZSA9ICIiDQogICAgd3NHaXJpcy5SYW5nZSgiQzkiKS5WYWx1ZSA9ICIiDQogICAgd3NHaXJpcy5SYW5nZSgiQzciKS5BY3RpdmF0ZQ0KRW5kIFN1Yg=="
    
    $vbaCode = B64ToUTF8 $vbaCodeBase64
    $vbproj = $wb.VBProject
    $mainMod = $vbproj.VBComponents.Add(1)
    $mainMod.Name = "modApp"
    $mainMod.CodeModule.AddFromString($vbaCode) | Out-Null
    
    # Save As .xlsm (52)
    $savePath = "C:\Users\LENOVO\Desktop\MSY_Stok_Takip_V2.xlsm"
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

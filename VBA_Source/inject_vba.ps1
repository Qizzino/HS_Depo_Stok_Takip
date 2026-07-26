$excel = [System.Runtime.InteropServices.Marshal]::GetActiveObject("Excel.Application")
$target_wb_name = "2026.07.17_MSY_AFYON_DEPO_TAKİPV2.3 (1).xlsm"
$vba_folder = "C:\Users\LENOVO\.gemini\antigravity-ide\scratch\MSY_StokTakip\VBA_Source"
$modules = @("modCore.bas", "modDatabase.bas", "modAlgoritma.bas")

$wb = $excel.Workbooks | Where-Object { $_.Name -match "MSY_AFYON_DEPO" }

if (-not $wb) {
    Write-Host "Excel dosyası açık değil. Lütfen dosyayı Excel'de açın ve scripti tekrar çalıştırın."
    exit
}

Write-Host "Dosya bulundu: $($wb.Name)"

try {
    $vbproj = $wb.VBProject
    
    foreach ($mod_file in $modules) {
        $mod_name = $mod_file.Replace(".bas", "")
        $existing = $vbproj.VBComponents | Where-Object { $_.Name -eq $mod_name }
        if ($existing) {
            Write-Host "Eski modül siliniyor: $mod_name"
            $vbproj.VBComponents.Remove($existing)
        }
        
        $full_path = Join-Path $vba_folder $mod_file
        Write-Host "İçe aktarılıyor: $full_path"
        $vbproj.VBComponents.Import($full_path)
    }
    
    Write-Host "VBA kodları başarıyla dosyaya aktarıldı! Lütfen Excel üzerinden kaydedin."
}
catch {
    Write-Host "Hata oluştu! Muhtemelen VBA projesine erişim izniniz yok."
    Write-Host "Lütfen Excel'de şu ayarı açın:"
    Write-Host "Dosya -> Seçenekler -> Güven Merkezi -> Güven Merkezi Ayarları -> Makro Ayarları -> 'VBA projesi nesne modeline güven' seçeneğini İŞARETLEYİN."
    Write-Host "Hata detayı: $_"
}

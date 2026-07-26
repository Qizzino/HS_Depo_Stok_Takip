import win32com.client
import os
import winreg
import sys

def enable_vba_trust():
    try:
        key = winreg.CreateKey(winreg.HKEY_CURRENT_USER, r"Software\Microsoft\Office\16.0\Excel\Security")
        winreg.SetValueEx(key, "AccessVBOM", 0, winreg.REG_DWORD, 1)
        winreg.CloseKey(key)
        return True
    except Exception as e:
        print("Failed to set registry:", e)
        return False

def build_excel():
    if not enable_vba_trust():
        return
        
    excel = win32com.client.Dispatch("Excel.Application")
    excel.Visible = False
    excel.DisplayAlerts = False
    
    try:
        wb = excel.Workbooks.Add()
        
        # 1. Create Sheets
        sheet_names = ["S_Malzemeler", "S_Hareketler", "S_Parametreler"]
        while wb.Worksheets.Count < 3:
            wb.Worksheets.Add()
            
        # Rename sheets and set headers
        ws_malz = wb.Worksheets(1)
        ws_malz.Name = sheet_names[0]
        ws_malz.Range("A1:E1").Value = ["Poz No", "Malzeme Adı", "Birim", "Birim Fiyat", "Anlık Stok"]
        ws_malz.Range("A1:E1").Font.Bold = True
        
        ws_har = wb.Worksheets(2)
        ws_har.Name = sheet_names[1]
        ws_har.Range("A1:N1").Value = ["Hareket ID", "İşlem Tarihi", "İşlem Türü", "Poz No", "Malzeme Adı", "Miktar", "Birim", "Ana Depo", "İşlem Depo", "Proje Adı", "İhale Grubu", "İşlem Yapan/Teslim Alan", "Belge No", "İrsaliye Dosya Yolu"]
        ws_har.Range("A1:N1").Font.Bold = True
        
        ws_par = wb.Worksheets(3)
        ws_par.Name = sheet_names[2]
        ws_par.Range("A1:D1").Value = ["İşlem Türleri", "Depolar", "Projeler", "İhale Grupları"]
        ws_par.Range("A1:D1").Font.Bold = True
        ws_par.Range("A2:A6").Value = [[x] for x in ["Giriş", "Çıkış", "İade Girişi", "İade Çıkışı", "Ters Kayıt"]]
        
        # 2. Add VBA Modules
        vba_folder = r"C:\Users\LENOVO\.gemini\antigravity-ide\scratch\MSY_StokTakip\VBA_Source"
        modules = ["modCore.bas", "modDatabase.bas", "modAlgoritma.bas"]
        
        vbproj = wb.VBProject
        for m in modules:
            full_path = os.path.join(vba_folder, m)
            if os.path.exists(full_path):
                vbproj.VBComponents.Import(full_path)
                
        # 3. Dynamically create UserForm 'frmHareket'
        # 3 = vbext_ct_MSForm
        frm = vbproj.VBComponents.Add(3)
        frm.Name = "frmHareket"
        frm.Properties("Caption").Value = "Hızlı Stok Hareketi (UYARISIZ)"
        frm.Properties("Width").Value = 350
        frm.Properties("Height").Value = 300
        
        # Add ComboBox for Islem Turu
        cbIslem = frm.Designer.Controls.Add("Forms.ComboBox.1", "cbIslem", True)
        cbIslem.Top = 15; cbIslem.Left = 100; cbIslem.Width = 200
        
        lbl1 = frm.Designer.Controls.Add("Forms.Label.1", "lbl1", True)
        lbl1.Caption = "İşlem Türü:"; lbl1.Top = 18; lbl1.Left = 10
        
        # Add TextBox for PozNo
        txtPoz = frm.Designer.Controls.Add("Forms.TextBox.1", "txtPoz", True)
        txtPoz.Top = 45; txtPoz.Left = 100; txtPoz.Width = 200
        
        lbl2 = frm.Designer.Controls.Add("Forms.Label.1", "lbl2", True)
        lbl2.Caption = "Poz No:"; lbl2.Top = 48; lbl2.Left = 10
        
        # Add TextBox for Miktar
        txtMiktar = frm.Designer.Controls.Add("Forms.TextBox.1", "txtMiktar", True)
        txtMiktar.Top = 75; txtMiktar.Left = 100; txtMiktar.Width = 200
        
        lbl3 = frm.Designer.Controls.Add("Forms.Label.1", "lbl3", True)
        lbl3.Caption = "Miktar:"; lbl3.Top = 78; lbl3.Left = 10
        
        # Save Button
        btnSave = frm.Designer.Controls.Add("Forms.CommandButton.1", "cmdKaydet", True)
        btnSave.Caption = "KAYDET (Onaysız Hızlı Kayıt)"
        btnSave.Top = 120; btnSave.Left = 100; btnSave.Width = 200; btnSave.Height = 40
        btnSave.BackColor = 0x00FF00
        
        # Add Code to UserForm
        code = """
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
    
    ' modCore.FastMode True
    
    Dim Tarih As String
    Tarih = Format(Now, "DD.MM.YYYY HH:NN:SS")
    
    Call modDatabase.AddHareket(Tarih, Me.cbIslem.Text, Me.txtPoz.Text, "Tanımlanmamış", Val(Me.txtMiktar.Text), "Adet", "", "", "", "", "Admin", "", "")
    
    ' modCore.FastMode False
    
    ' Hızlı temizleme (Uyarı yok)
    Me.txtPoz.Text = ""
    Me.txtMiktar.Text = ""
    Me.txtPoz.SetFocus
End Sub
"""
        frm.CodeModule.AddFromString(code.strip())
        
        # Create a button on S_Malzemeler to launch the form
        # We can just add a simple macro
        main_mod = vbproj.VBComponents.Add(1) # vbext_ct_StdModule
        main_mod.Name = "modGiris"
        main_code = """
Public Sub FormuAc()
    frmHareket.Show
End Sub
"""
        main_mod.CodeModule.AddFromString(main_code.strip())
        
        save_path = r"C:\Users\LENOVO\Desktop\MSY_Stok_Takip_Sistemi.xlsm"
        if os.path.exists(save_path):
            os.remove(save_path)
            
        # 52 = xlOpenXMLWorkbookMacroEnabled
        wb.SaveAs(save_path, FileFormat=52)
        print(f"Excel file created successfully at: {save_path}")
        
    except Exception as e:
        print("Error during build:", e)
    finally:
        excel.Quit()

if __name__ == '__main__':
    build_excel()

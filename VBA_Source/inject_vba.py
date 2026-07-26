import win32com.client
import os
import sys

def inject_vba():
    # Excel path
    target_wb_name = "2026.07.17_MSY_AFYON_DEPO_TAKİPV2.3 (1).xlsm"
    vba_folder = r"C:\Users\LENOVO\.gemini\antigravity-ide\scratch\MSY_StokTakip\VBA_Source"
    
    try:
        excel = win32com.client.GetActiveObject("Excel.Application")
        print("Connected to active Excel instance.")
    except Exception as e:
        print("Failed to get active Excel. Trying to create new instance and open file...")
        try:
            excel = win32com.client.Dispatch("Excel.Application")
            excel.Visible = True
        except Exception as e2:
            print("Could not start Excel:", e2)
            return

    target_wb = None
    # Check if open
    for wb in excel.Workbooks:
        if target_wb_name.lower() in wb.Name.lower():
            target_wb = wb
            break
            
    if not target_wb:
        print(f"{target_wb_name} is not open. Opening it...")
        try:
            wb_path = os.path.join(r"C:\++OEDAS\DEPO_STOK_TAKİP", target_wb_name)
            target_wb = excel.Workbooks.Open(wb_path)
        except Exception as e:
            print(f"Failed to open workbook: {e}")
            return
            
    print(f"Workbook {target_wb.Name} found! Attempting to inject VBA modules...")
    
    modules = ["modCore.bas", "modDatabase.bas", "modAlgoritma.bas"]
    
    try:
        vb_project = target_wb.VBProject
        
        # Remove existing if any
        existing_names = [comp.Name for comp in vb_project.VBComponents]
        for mod in ["modCore", "modDatabase", "modAlgoritma"]:
            if mod in existing_names:
                print(f"Removing existing module: {mod}")
                vb_project.VBComponents.Remove(vb_project.VBComponents(mod))
        
        # Import new
        for mod_file in modules:
            full_path = os.path.join(vba_folder, mod_file)
            print(f"Importing {full_path}...")
            vb_project.VBComponents.Import(full_path)
            
        print("Injection successful! Please save the workbook in Excel.")
        
    except Exception as e:
        print(f"Injection failed! Error: {e}")
        print("\nNOTE: This usually happens if 'Trust access to the VBA project object model' is disabled in Excel.")
        print("To fix: Excel -> File -> Options -> Trust Center -> Trust Center Settings -> Macro Settings -> Check 'Trust access to the VBA project object model'.")

if __name__ == '__main__':
    inject_vba()

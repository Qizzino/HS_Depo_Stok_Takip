const { app, BrowserWindow, Tray, Menu, nativeImage, ipcMain, dialog, shell } = require('electron');
const { autoUpdater } = require('electron-updater');
const path = require('path');
const fs = require('fs');

// Donanım ivmelendirmesi AÇIK (Kasma ve UI takılmalarını önler)
// app.disableHardwareAcceleration();

// Single Instance Lock (Tekil Çalışma Kilidi)
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
    app.quit();
} else {
    // Writable path for SQLite and Uploads
    process.env.USER_DATA_PATH = app.getPath('userData');

    // Uploads klasörünü oluştur
    const uploadsDir = path.join(process.env.USER_DATA_PATH, 'uploads');
    if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
    }

    // Arka uç sunucusunu başlat
    require('./server/server.js');

    let mainWindow = null;
    let tray = null;
    let isQuitting = false;

    function createWindow() {
        mainWindow = new BrowserWindow({
            width: 1280,
            height: 800,
            title: "HŞ_Stok Takip",
            webPreferences: {
                nodeIntegration: true,
                contextIsolation: false
            }
        });

        mainWindow.setMenuBarVisibility(false);
        mainWindow.setMenu(null); // Menüyü tamamen kaldır, Alt tuşunun odak çalmasını engeller
        mainWindow.loadFile(path.join(__dirname, 'client', 'dist', 'index.html'));

        // Başladığında pencereye kesin odaklan
        mainWindow.once('ready-to-show', () => {
            mainWindow.show();
            mainWindow.focus();
        });

        // Çarpıya basılınca kapatma, gizle
        mainWindow.on('close', function (event) {
            if (!isQuitting) {
                event.preventDefault();
                mainWindow.hide();
            }
            return false;
        });

        // PDF ve diğer indirmeleri Downloads altındaki Depo_Çıkış_Tutanakları klasörüne yönlendir
        mainWindow.webContents.session.on('will-download', (event, item, webContents) => {
            const fileName = item.getFilename();
            // Sadece Tutanak veya İrsaliye PDF'lerini klasöre atalım (veya hepsini)
            if (fileName.endsWith('.pdf') || fileName.endsWith('.doc')) {
                const downloadsPath = app.getPath('downloads');
                const targetFolder = path.join(downloadsPath, 'Depo_Çıkış_Tutanakları');
                
                if (!fs.existsSync(targetFolder)) {
                    fs.mkdirSync(targetFolder, { recursive: true });
                }
                
                const filePath = path.join(targetFolder, fileName);
                item.setSavePath(filePath);
                
                item.once('done', (event, state) => {
                    if (state === 'completed') {
                        // İndirme bitince klasörü açıp dosyayı seçili göster
                        shell.showItemInFolder(filePath);
                    }
                });
            }
        });
    }

    app.on('second-instance', (event, commandLine, workingDirectory) => {
        // Kullanıcı ikinci kez açmaya çalışırsa, açık olan pencereyi öne getir
        if (mainWindow) {
            if (mainWindow.isMinimized() || !mainWindow.isVisible()) {
                mainWindow.show();
            }
            mainWindow.focus();
        }
    });

    app.whenReady().then(() => {
        createWindow();

        // Otomatik Güncelleme Sistemi
        autoUpdater.checkForUpdatesAndNotify();

        autoUpdater.on('update-available', () => {
            dialog.showMessageBox({
                type: 'info',
                title: 'Güncelleme Mevcut',
                message: 'Uygulamanın yeni bir sürümü bulundu. Arka planda indiriliyor...',
                buttons: ['Tamam']
            });
        });

        autoUpdater.on('update-downloaded', () => {
            dialog.showMessageBox({
                type: 'info',
                title: 'Güncelleme Hazır',
                message: 'Yeni sürüm başarıyla indirildi. Yüklemek için uygulama şimdi yeniden başlatılacak.',
                buttons: ['Yeniden Başlat ve Yükle']
            }).then(() => {
                isQuitting = true;
                autoUpdater.quitAndInstall();
            });
        });

        autoUpdater.on('error', (err) => {
            console.error('Güncelleme hatası:', err);
        });

        // Tray (Sistem Tepsisi) oluştur
        let iconPath = path.join(__dirname, 'icon.png');
        let icon = nativeImage.createFromPath(iconPath);
        if (icon.isEmpty()) {
            icon = nativeImage.createEmpty();
        }
        
        tray = new Tray(icon);
        const contextMenu = Menu.buildFromTemplate([
            { label: 'Uygulamayı Aç', click: () => mainWindow.show() },
            { type: 'separator' },
            { label: 'Çıkış Yap', click: () => {
                isQuitting = true;
                app.quit();
            }}
        ]);
        tray.setToolTip('HŞ Stok Takip Sistemi');
        tray.setContextMenu(contextMenu);
        
        // Çift tıklayınca aç
        tray.on('double-click', () => {
            mainWindow.show();
        });

        app.on('activate', function () {
            if (BrowserWindow.getAllWindows().length === 0) createWindow();
        });
    });

    // React'ten gelen tamamen çıkış komutu
    ipcMain.on('quit-app', () => {
        isQuitting = true;
        app.quit();
    });

    ipcMain.handle('save-and-open-excel', async (event, { fileName, buffer }) => {
        const defaultPath = path.join(app.getPath('downloads'), fileName);
        const { filePath } = await dialog.showSaveDialog(mainWindow, {
            title: 'Excel Dosyasını Kaydet',
            defaultPath: defaultPath,
            filters: [{ name: 'Excel Files', extensions: ['xlsx'] }]
        });
        
        if (filePath) {
            fs.writeFileSync(filePath, Buffer.from(buffer, 'base64'));
            shell.showItemInFolder(filePath);
            return true;
        }
        return false;
    });

    app.on('window-all-closed', function () {
        if (process.platform !== 'darwin') app.quit();
    });
}

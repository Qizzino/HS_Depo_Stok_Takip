import { useRef } from 'react'
import html2pdf from 'html2pdf.js'
import * as XLSX from 'xlsx'

export default function PrintLayout({ data, ayarlar, saveAction, onSaveComplete, onPrintComplete }) {
  const contentRef = useRef(null)

  if (!data) return null

  const isIrsaliye = data.yazdirmaSecenegi === 'İrsaliye'
  const dateObj = new Date()
  const dateStr = dateObj.toLocaleDateString('tr-TR')
  const timeStr = dateObj.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
  
  const generateUUID = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16).toUpperCase();
    });
  }

  const tutanakRows = Array.from({ length: 19 }, (_, i) => i + 1)
  
  // Hem sepet (items dizisi) hem de geçmişteki tekli kayıtlarla uyumlu çalışabilmesi için:
  const itemsToPrint = data.items && data.items.length > 0 
    ? data.items 
    : [{ pozNo: data.pozNo, malzemeAdi: data.malzemeAdi, miktar: data.miktar, birim: data.birim }];

  // Dosya isimlendirmesi için tarih öneki (YYYY-MM-DD)
  const dateStrFileName = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`
  const title = isIrsaliye 
    ? `${dateStrFileName}_Irsaliye_${data.irsaliyeNo}` 
    : `${dateStrFileName}_Tutanak_${(data.projeAdi || data.ihaleGrubu || 'Cikis').replace(/\s+/g, '_')}`

  // PDF İndirme İşlemi
  const handleDownloadPDF = () => {
    const element = contentRef.current;
    
    // Geçici olarak yazdırıldığını göstermek için dış stili kaldırıyoruz
    element.classList.add('pdf-generating');

    const opt = {
      margin:       10,
      filename:     `${title}.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true },
      jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    html2pdf().set(opt).from(element).save().then(() => {
      element.classList.remove('pdf-generating');
    });
  }

  // Word İndirme İşlemi
  const handleDownloadWord = () => {
    const element = contentRef.current;
    const header = "<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'><title>Tutanak</title></head><body>";
    const footer = "</body></html>";
    const sourceHTML = header + element.innerHTML + footer;
    
    const source = 'data:application/vnd.ms-word;charset=utf-8,' + encodeURIComponent(sourceHTML);
    const fileDownload = document.createElement("a");
    document.body.appendChild(fileDownload);
    fileDownload.href = source;
    fileDownload.download = `${title}.doc`;
    fileDownload.click();
    document.body.removeChild(fileDownload);
  }

  // Yazıcıya Gönder İşlemi
  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="preview-modal-overlay">
      <div className="preview-modal-container">
        
        {/* Modal Araç Çubuğu */}
        <div className="preview-modal-header no-print">
          <div style={{ fontWeight: 'bold', fontSize: '1.2rem', color: 'var(--text-primary)' }}>
            📄 Belge Önizleme {saveAction && <span style={{color: '#d97706', fontSize: '0.9rem', marginLeft: '10px'}}>(Kaydedilmedi, Onay Bekliyor)</span>}
          </div>
          <div className="preview-modal-actions">
            
            {saveAction ? (
              <>
                <button className="btn-secondary" onClick={onPrintComplete} style={{ backgroundColor: '#6c757d', color: 'white', border: 'none' }}>
                  🔙 Geri Dön
                </button>
                <button className="btn-primary" onClick={async () => {
                  const result = await saveAction();
                  if (result && result.success) {
                    if (onSaveComplete) onSaveComplete();
                  }
                }} style={{ backgroundColor: '#28a745', border: 'none', fontWeight: 'bold', padding: '10px 20px' }}>
                  ✅ ONAYLA VE KAYDET
                </button>
              </>
            ) : (
              <>
                <button className="btn-secondary" onClick={handleDownloadWord} style={{ backgroundColor: '#2b579a', color: 'white', border: 'none' }}>
                  📝 Word İndir
                </button>
                <button className="btn-primary" onClick={handleDownloadPDF} style={{ backgroundColor: '#d32f2f', border: 'none' }}>
                  📥 PDF İndir
                </button>
                <button className="btn-primary" onClick={handlePrint} style={{ backgroundColor: 'var(--primary-color)' }}>
                  🖨️ Yazdır
                </button>
                <button className="btn-secondary" onClick={onPrintComplete}>
                  ❌ Kapat
                </button>
              </>
            )}

          </div>
        </div>

        {/* Belgenin Kendisi */}
        <div className="preview-modal-content">
          <div className="print-page" ref={contentRef} style={{ padding: '0', background: 'white', color: 'black', fontFamily: 'Calibri, Arial, sans-serif' }}>
            
            {!isIrsaliye && (
              <div style={{ padding: '20px' }}>
                <table id="tutanak-table" style={{ width: '100%', borderCollapse: 'collapse', border: '2px solid black', borderSpacing: 0 }}>
                  <tbody>
                    {/* SATIR 1-5: ÜST BAŞLIK BÖLÜMÜ */}
                    <tr>
                      <td colSpan="2" rowSpan="5" style={{ width: '20%', border: '2px solid black', padding: '5px', textAlign: 'center', verticalAlign: 'middle' }}>
                        {ayarlar.logo_url ? <img src={ayarlar.logo_url} alt="Logo" style={{ maxWidth: '100%', maxHeight: '80px' }} crossOrigin="anonymous" /> : <strong style={{ fontSize: '28px' }}>{ayarlar.firma_adi?.substring(0,3)}</strong>}
                      </td>
                      
                      <td colSpan="5" rowSpan="5" style={{ width: '55%', border: '2px solid black', textAlign: 'center', verticalAlign: 'middle' }}>
                        <h2 style={{ margin: '0', fontSize: '20px', fontWeight: 'bold' }}>{ayarlar.firma_adi}</h2>
                        <h3 style={{ margin: '5px 0 0 0', fontSize: '18px', fontWeight: 'bold' }}>DEPO MALZEME ÇIKIŞ TUTANAĞI</h3>
                      </td>
                      
                      <td colSpan="1" style={{ width: '12%', border: '1px solid black', borderTop: '2px solid black', fontSize: '10px', padding: '2px 5px' }}>DOKÜMAN NO</td>
                      <td colSpan="2" style={{ width: '13%', border: '1px solid black', borderTop: '2px solid black', borderRight: '2px solid black', fontSize: '10px', padding: '2px 5px' }}>C.T.S.01</td>
                    </tr>
                    <tr>
                      <td colSpan="1" style={{ border: '1px solid black', fontSize: '10px', padding: '2px 5px' }}>İLK YAYIN TARİHİ</td>
                      <td colSpan="2" style={{ border: '1px solid black', borderRight: '2px solid black', fontSize: '10px', padding: '2px 5px' }}>{dateStr}</td>
                    </tr>
                    <tr>
                      <td colSpan="1" style={{ border: '1px solid black', fontSize: '10px', padding: '2px 5px' }}>REVİZYON TARİHİ</td>
                      <td colSpan="2" style={{ border: '1px solid black', borderRight: '2px solid black', fontSize: '10px', padding: '2px 5px' }}>{dateStr}</td>
                    </tr>
                    <tr>
                      <td colSpan="1" style={{ border: '1px solid black', fontSize: '10px', padding: '2px 5px' }}>REVİZYON NO</td>
                      <td colSpan="2" style={{ border: '1px solid black', borderRight: '2px solid black', fontSize: '10px', padding: '2px 5px' }}>01</td>
                    </tr>
                    <tr>
                      <td colSpan="1" style={{ border: '1px solid black', borderBottom: '2px solid black', fontSize: '10px', padding: '2px 5px' }}>SAYFA NO</td>
                      <td colSpan="2" style={{ border: '1px solid black', borderBottom: '2px solid black', borderRight: '2px solid black', fontSize: '10px', padding: '2px 5px' }}>1</td>
                    </tr>

                    {/* SATIR 7-8: PROJE VE TARİH */}
                    <tr>
                      <td colSpan="2" style={{ border: '1px solid black', borderLeft: '2px solid black', padding: '5px', fontWeight: 'bold', fontSize: '12px' }}>Çıkış Yapılan Proje :</td>
                      <td colSpan="4" style={{ border: '1px solid black', padding: '5px', fontSize: '12px', fontWeight: 'bold' }}>{data.projeAdi || data.ihaleGrubu}</td>
                      <td colSpan="1" style={{ border: '1px solid black', padding: '5px', fontWeight: 'bold', fontSize: '12px', textAlign: 'center' }}>TARİH</td>
                      <td colSpan="3" style={{ border: '1px solid black', borderRight: '2px solid black', padding: '5px', fontSize: '12px', textAlign: 'center' }}>{dateStr}</td>
                    </tr>

                    {/* SATIR 9: FİRMA ADI */}
                    <tr>
                      <td colSpan="10" style={{ border: '1px solid black', borderLeft: '2px solid black', borderRight: '2px solid black', padding: '5px', backgroundColor: '#fff', color: 'black', fontWeight: 'bold', fontSize: '14px', textAlign: 'center' }}>
                        {ayarlar.firma_adi}
                      </td>
                    </tr>

                    {/* SATIR 10-11: DEPO ADI VE ÇIKIŞ YAPILAN */}
                    <tr>
                      <td colSpan="2" rowSpan="2" style={{ border: '1px solid black', borderLeft: '2px solid black', padding: '5px', fontWeight: 'bold', fontSize: '12px', verticalAlign: 'middle', textAlign: 'center' }}>DEPO ADI:</td>
                      <td colSpan="3" rowSpan="2" style={{ border: '1px solid black', padding: '5px', fontSize: '12px', verticalAlign: 'middle' }}>{data.depoAdi}</td>
                      <td colSpan="1" rowSpan="2" style={{ border: '1px solid black', padding: '5px', fontWeight: 'bold', fontSize: '12px', textAlign: 'center', verticalAlign: 'middle' }}>ÇIKIŞ<br/>YAPILAN</td>
                      <td colSpan="4" rowSpan="2" style={{ border: '1px solid black', borderRight: '2px solid black', padding: '5px', fontSize: '12px', verticalAlign: 'middle' }}>{data.ihaleGrubu || data.projeAdi}</td>
                    </tr>
                    <tr></tr> {/* rowSpan için boş satır */}

                    {/* SATIR 12: TESLİM EDİLEN MALZEME BİLGİLERİ BAŞLIK */}
                    <tr>
                      <td colSpan="10" style={{ border: '1px solid black', borderLeft: '2px solid black', borderRight: '2px solid black', padding: '5px', backgroundColor: '#fff', fontWeight: 'bold', fontSize: '12px', textAlign: 'center' }}>
                        TESLİM EDİLEN MALZEME BİLGİLERİ
                      </td>
                    </tr>

                    {/* SÜTUN BAŞLIKLARI */}
                    <tr>
                      <td colSpan="1" style={{ width: '5%', border: '1px solid black', borderLeft: '2px solid black', padding: '5px', backgroundColor: '#fff', fontWeight: 'bold', fontSize: '11px', textAlign: 'center' }}>SIRA</td>
                      <td colSpan="2" style={{ width: '20%', border: '1px solid black', padding: '5px', backgroundColor: '#fff', fontWeight: 'bold', fontSize: '11px', textAlign: 'center' }}>MALZEME KODU</td>
                      <td colSpan="4" style={{ width: '45%', border: '1px solid black', padding: '5px', backgroundColor: '#fff', fontWeight: 'bold', fontSize: '11px', textAlign: 'center' }}>MALZEME ADI</td>
                      <td colSpan="1" style={{ width: '15%', border: '1px solid black', padding: '5px', backgroundColor: '#fff', fontWeight: 'bold', fontSize: '11px', textAlign: 'center' }}>MİKTARI</td>
                      <td colSpan="2" style={{ width: '15%', border: '1px solid black', borderRight: '2px solid black', padding: '5px', backgroundColor: '#fff', fontWeight: 'bold', fontSize: '11px', textAlign: 'center' }}>BİRİM<br/>(ADET/PKT/KG/TAKIM)</td>
                    </tr>

                    {/* KALEMLER 1-19 */}
                    {tutanakRows.map(rowNum => {
                      const item = itemsToPrint[rowNum - 1];
                      return (
                        <tr key={rowNum}>
                          <td colSpan="1" style={{ border: '1px solid #777', borderLeft: '2px solid black', padding: '5px', fontWeight: 'bold', fontSize: '12px', textAlign: 'center', height: '25px' }}>{rowNum}</td>
                          <td colSpan="2" style={{ border: '1px solid #777', padding: '5px', fontSize: '12px', textAlign: 'center' }}>{item ? item.pozNo : ''}</td>
                          <td colSpan="4" style={{ border: '1px solid #777', padding: '5px', fontSize: '12px', textAlign: 'left' }}>{item ? item.malzemeAdi : ''}</td>
                          <td colSpan="1" style={{ border: '1px solid #777', padding: '5px', fontSize: '12px', textAlign: 'center' }}>{item ? item.miktar : ''}</td>
                          <td colSpan="2" style={{ border: '1px solid #777', borderRight: '2px solid black', padding: '5px', fontSize: '12px', textAlign: 'center' }}>{item ? item.birim : ''}</td>
                        </tr>
                      )
                    })}

                    {/* ONAY YAZISI */}
                    <tr>
                      <td colSpan="10" style={{ border: '1px solid black', borderLeft: '2px solid black', borderRight: '2px solid black', padding: '5px', fontSize: '11px', textAlign: 'center', borderBottom: '2px solid black' }}>
                        Yukarıda yazılı olan ........{itemsToPrint.length}........ Kalem malzemeleri eksiksiz ve sağlam teslim aldım.
                      </td>
                    </tr>

                  </tbody>
                </table>

                {/* İMZALAR BÖLÜMÜ */}
                <div style={{ display: 'flex', marginTop: '10px', justifyContent: 'space-between', padding: '0' }}>
                  {/* Sol İmza Kutusu */}
                  <div style={{ width: '40%', border: '2px solid black' }}>
                    <div style={{ backgroundColor: '#fff', textAlign: 'center', padding: '5px', fontWeight: 'bold', borderBottom: '1px solid black', fontSize: '12px' }}>TESLİM EDEN</div>
                    <div style={{ padding: '30px 10px', textAlign: 'center', fontWeight: 'bold', fontSize: '12px', minHeight: '80px' }}></div>
                  </div>
                  
                  {/* Sağ İmza Kutusu */}
                  <div style={{ width: '40%', border: '2px solid black' }}>
                    <div style={{ backgroundColor: '#fff', textAlign: 'center', padding: '5px', fontWeight: 'bold', borderBottom: '1px solid black', fontSize: '12px' }}>TESLİM ALAN</div>
                    <div style={{ padding: '30px 10px', display: 'flex', flexDirection: 'column', gap: '20px', minHeight: '80px' }}>
                      <div style={{ fontSize: '12px', display: 'flex' }}><span style={{ width: '80px', fontWeight: 'bold' }}>İsim:</span> <span></span></div>
                      <div style={{ fontSize: '12px', display: 'flex' }}><span style={{ width: '80px', fontWeight: 'bold' }}>İmza:</span> <span></span></div>
                    </div>
                  </div>
                </div>

              </div>
            )}

            {isIrsaliye && (
              <div style={{ margin: '20px', padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                  <div style={{ width: '40%', fontSize: '12px' }}>
                    <h4 style={{ margin: '0 0 5px 0', color: '#555' }}>Sevk Eden</h4>
                    <h3 style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#333' }}>{ayarlar.firma_adi}</h3>
                    <p style={{ margin: '2px 0', color: '#666' }}>{ayarlar.adres}</p>
                    <p style={{ margin: '2px 0', color: '#666' }}>Tel: {ayarlar.telefon}</p>
                    <p style={{ margin: '2px 0', color: '#666' }}>Web Sitesi: {ayarlar.web_sitesi}</p>
                    <p style={{ margin: '2px 0', color: '#666' }}>E-Posta: {ayarlar.eposta}</p>
                    <p style={{ margin: '2px 0', color: '#666' }}>Vergi Dairesi: {ayarlar.vergi_dairesi}</p>
                    <p style={{ margin: '2px 0', color: '#666' }}>VKN: {ayarlar.vkn}</p>
                    
                    <div style={{ borderTop: '2px solid #5b9bd5', marginTop: '15px', paddingTop: '15px' }}>
                      <h4 style={{ margin: '0 0 5px 0', color: '#555' }}>Sayın</h4>
                      <p style={{ margin: '2px 0' }}>{data.projeAdi || data.ihaleGrubu}</p>
                      <p style={{ margin: '2px 0' }}>{data.depoAdi}</p>
                      <p style={{ margin: '2px 0', marginTop: '10px' }}>Teslim Alan: {data.teslimAlan}</p>
                    </div>
                  </div>

                  <div style={{ width: '20%', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{ width: '80px', height: '80px', border: '2px solid #ccc', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '40px', fontWeight: 'bold', color: '#555' }}>G</div>
                    <h3 style={{ marginTop: '10px', color: '#555' }}>e-İRSALİYE</h3>
                  </div>

                  <div style={{ width: '35%', display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                    <div style={{ width: '120px', height: '120px', border: '1px solid #ccc', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '10px' }}>
                      <img src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=IrsaliyeNo:${data.irsaliyeNo}`} alt="QR" style={{ width: '100%', height: '100%' }} crossOrigin="anonymous" />
                    </div>
                    <h2 style={{ margin: '0 0 5px 0', fontSize: '20px', width: '100%', textAlign: 'left', color: '#333' }}>{ayarlar.firma_adi}</h2>
                    <table id="irsaliye-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                      <tbody>
                        <tr><td style={{ border: '1px solid black', padding: '3px 5px', backgroundColor: '#f0f0f0', width: '40%' }}>Özelleştirme No:</td><td style={{ border: '1px solid black', padding: '3px 5px' }}>TR1.2</td></tr>
                        <tr><td style={{ border: '1px solid black', padding: '3px 5px', backgroundColor: '#f0f0f0' }}>Senaryo:</td><td style={{ border: '1px solid black', padding: '3px 5px' }}>TEMELİRSALİYE</td></tr>
                        <tr><td style={{ border: '1px solid black', padding: '3px 5px', backgroundColor: '#f0f0f0' }}>İrsaliye Tipi:</td><td style={{ border: '1px solid black', padding: '3px 5px' }}>SEVK</td></tr>
                        <tr><td style={{ border: '1px solid black', padding: '3px 5px', backgroundColor: '#f0f0f0' }}>İrsaliye No:</td><td style={{ border: '1px solid black', padding: '3px 5px', fontWeight: 'bold' }}>{data.irsaliyeNo}</td></tr>
                        <tr><td style={{ border: '1px solid black', padding: '3px 5px', backgroundColor: '#f0f0f0' }}>İrsaliye Tarihi:</td><td style={{ border: '1px solid black', padding: '3px 5px' }}>{dateStr}</td></tr>
                        <tr><td style={{ border: '1px solid black', padding: '3px 5px', backgroundColor: '#f0f0f0' }}>İrsaliye Zamanı:</td><td style={{ border: '1px solid black', padding: '3px 5px' }}>{timeStr}</td></tr>
                        <tr><td style={{ border: '1px solid black', padding: '3px 5px', backgroundColor: '#f0f0f0' }}>Sevk Tarihi:</td><td style={{ border: '1px solid black', padding: '3px 5px' }}>{dateStr}</td></tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <div style={{ fontSize: '12px', color: '#555', marginBottom: '5px' }}>ETTN: {generateUUID()}</div>

                <table id="irsaliye-items" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', marginBottom: '20px' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#e2e2e2' }}>
                      <th style={{ border: '1px solid black', padding: '5px' }}>Sıra No</th>
                      <th style={{ border: '1px solid black', padding: '5px' }}>Satıcı ürün kodu</th>
                      <th style={{ border: '1px solid black', padding: '5px', textAlign: 'left' }}>Malzeme/Tanım</th>
                      <th style={{ border: '1px solid black', padding: '5px', textAlign: 'right' }}>Miktar</th>
                    </tr>
                  </thead>
                  <tbody>
                    {itemsToPrint.map((item, index) => (
                      <tr key={index}>
                        <td style={{ border: '1px solid black', padding: '5px', textAlign: 'center' }}>{index + 1}</td>
                        <td style={{ border: '1px solid black', padding: '5px', textAlign: 'center' }}>{item.pozNo}</td>
                        <td style={{ border: '1px solid black', padding: '5px' }}>{item.malzemeAdi}</td>
                        <td style={{ border: '1px solid black', padding: '5px', textAlign: 'right' }}>{item.miktar} {item.birim}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div style={{ border: '1px solid black', fontSize: '11px', padding: '10px' }}>
                  <h4 style={{ margin: '0 0 5px 0' }}>Taşıyıcı Bilgileri</h4>
                  <p style={{ margin: '2px 0' }}>Araç plaka numarası: __________________</p>
                  <p style={{ margin: '2px 0' }}>Şoför: __________________, TCKN: __________________</p>
                  
                  <h4 style={{ margin: '10px 0 5px 0' }}>Açıklamalar</h4>
                  <p style={{ margin: '2px 0' }}>Not: SEVK AMAÇLIDIR. SATIŞ AMAÇLI İRSALİYE AYRICA KESİLECEKTİR.</p>
                  <p style={{ margin: '2px 0' }}>Asıl Satıcı VKN: {ayarlar.vkn}</p>
                  <p style={{ margin: '2px 0' }}>Asıl Satıcı Unvan: {ayarlar.firma_adi}</p>

                  <div style={{ display: 'flex', marginTop: '20px', borderTop: '1px solid #ccc', paddingTop: '10px' }}>
                    <div style={{ width: '50%', paddingRight: '10px' }}>
                      <strong>Teslim Eden:</strong>
                      <br/><br/><br/><br/>
                    </div>
                    <div style={{ width: '50%', paddingLeft: '10px', borderLeft: '1px solid #ccc' }}>
                      <strong>Teslim Alan:</strong>
                      <br/><br/><br/><br/>
                    </div>
                  </div>
                  
                  <div style={{ marginTop: '10px', borderTop: '1px solid #ccc', paddingTop: '5px', fontSize: '10px', color: '#555' }}>
                    Yukarıda dökümü yapılan malları sağlam ve eksiksiz teslim aldım.
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}

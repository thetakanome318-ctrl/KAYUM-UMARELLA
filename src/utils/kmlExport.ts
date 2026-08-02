import JSZip from 'jszip';
import { ROWRecord } from '../types';
import { getRecordCoordinates } from '../components/MapView';

/**
 * Escapes XML special characters for safe inclusion in KML strings
 */
function escapeXml(unsafe: string): string {
  return (unsafe || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Generates KML XML string from an array of records and individual map points
 */
export function generateKmlContent(records: ROWRecord[]): string {
  let placemarksXml = '';

  records.forEach((record) => {
    // If record has individual treeDetails with coords
    if (record.treeDetails && record.treeDetails.length > 0) {
      record.treeDetails.forEach((tree, idx) => {
        let lat = Number(tree.latitude);
        let lng = Number(tree.longitude);

        if (isNaN(lat) || isNaN(lng) || lat === 0 || lng === 0) {
          const fallback = getRecordCoordinates(record);
          lat = fallback.lat;
          lng = fallback.lng;
        }

        const title = `${record.penyulang || 'Penyulang'} - ${record.section || 'Section'} (Pohon #${idx + 1})`;
        const treeName = tree.namaPohon || tree.keterangan || record.namaPohon || 'Pohon ROW';
        const isPadam = tree.perluPadam || record.perluPadam;
        const isIzin = tree.belumIzin || record.tidakAdaIzin;
        const isBesar = tree.pohonBesar || record.pohonBesar;

        let styleId = 'style-normal';
        if (isPadam) styleId = 'style-padam';
        else if (isIzin) styleId = 'style-izin';
        else if (isBesar) styleId = 'style-besar';

        placemarksXml += `
    <Placemark>
      <name>${escapeXml(title)}</name>
      <styleUrl>#${styleId}</styleUrl>
      <description><![CDATA[
        <div style="font-family: Arial, sans-serif; font-size: 12px; color: #1e293b; padding: 6px;">
          <h3 style="margin: 0 0 6px 0; color: #0f172a; font-size: 14px;">${escapeXml(title)}</h3>
          <p style="margin: 3px 0;"><b>Penyulang:</b> ${escapeXml(record.penyulang || '-')}</p>
          <p style="margin: 3px 0;"><b>Section:</b> ${escapeXml(record.section || '-')}</p>
          <p style="margin: 3px 0;"><b>Jenis Pohon:</b> ${escapeXml(treeName)}</p>
          <p style="margin: 3px 0;"><b>Status Padam:</b> ${isPadam ? '<span style="color: red; font-weight: bold;">Perlu Padam</span>' : 'Aman'}</p>
          <p style="margin: 3px 0;"><b>Status Izin:</b> ${isIzin ? '<span style="color: orange; font-weight: bold;">Belum Izin</span>' : 'Ada Izin'}</p>
          <p style="margin: 3px 0;"><b>Status Ukuran:</b> ${isBesar ? '<span style="color: purple; font-weight: bold;">Pohon Besar</span>' : 'Normal'}</p>
          <p style="margin: 3px 0;"><b>Tanggal:</b> ${escapeXml(record.tanggal || '-')}</p>
          ${record.catatan ? `<p style="margin: 6px 0; font-style: italic; background: #f8fafc; padding: 4px; border: 1px solid #e2e8f0;">"${escapeXml(record.catatan)}"</p>` : ''}
          <p style="margin-top: 8px; font-size: 10px; color: #64748b;">Koordinat: ${lat.toFixed(6)}, ${lng.toFixed(6)}</p>
        </div>
      ]]></description>
      <Point>
        <coordinates>${lng},${lat},0</coordinates>
      </Point>
    </Placemark>`;
      });
    } else {
      // Standard Record Placemark
      const coords = getRecordCoordinates(record);
      const isPadam = record.perluPadam;
      const isIzin = record.tidakAdaIzin;
      const isBesar = record.pohonBesar;

      let styleId = 'style-normal';
      if (isPadam) styleId = 'style-padam';
      else if (isIzin) styleId = 'style-izin';
      else if (isBesar) styleId = 'style-besar';

      const typeLabel = record.inspectionType ? `[Inspeksi ${record.inspectionType}] ` : record.gangguan ? '[Gangguan] ' : '';

      placemarksXml += `
    <Placemark>
      <name>${escapeXml(typeLabel + (record.section || 'Lokasi ROW'))}</name>
      <styleUrl>#${styleId}</styleUrl>
      <description><![CDATA[
        <div style="font-family: Arial, sans-serif; font-size: 12px; color: #1e293b; padding: 6px;">
          <h3 style="margin: 0 0 6px 0; color: #0f172a; font-size: 14px;">${escapeXml(record.section || 'Detail Lokasi')}</h3>
          <p style="margin: 3px 0;"><b>Penyulang:</b> ${escapeXml(record.penyulang || '-')}</p>
          <p style="margin: 3px 0;"><b>Jumlah Temuan Pohon:</b> ${record.jumlahTemuan || 0} Pohon</p>
          <p style="margin: 3px 0;"><b>Realisasi Pangkas:</b> ${record.realisasiTemuan || 0} Pohon</p>
          <p style="margin: 3px 0;"><b>Realisasi KMS:</b> ${record.realisasiKms || 0} KMS</p>
          <p style="margin: 3px 0;"><b>Realisasi Span/Gawang:</b> ${record.realisasiGawang || 0} Span</p>
          <p style="margin: 3px 0;"><b>Petugas/Tim:</b> ${escapeXml((record as Record<string, any>).petugas || (record as Record<string, any>).timEksekusi || '-')}</p>
          <p style="margin: 3px 0;"><b>Tanggal:</b> ${escapeXml(record.tanggal || '-')}</p>
          ${record.catatan ? `<p style="margin: 6px 0; font-style: italic; background: #f8fafc; padding: 4px; border: 1px solid #e2e8f0;">"${escapeXml(record.catatan)}"</p>` : ''}
          <p style="margin-top: 8px; font-size: 10px; color: #64748b;">Koordinat: ${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)}</p>
        </div>
      ]]></description>
      <Point>
        <coordinates>${coords.lng},${coords.lat},0</coordinates>
      </Point>
    </Placemark>`;
    }
  });

  return `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>Peta Sebaran Monitoring ROW &amp; Pengukuran PLN ULP Baguala</name>
    <description>Laporan Peta Sebaran Geografis Temuan Pohon, Inspeksi, Gangguan, dan Gardu</description>
    
    <!-- Styles for Placemarks -->
    <Style id="style-normal">
      <IconStyle>
        <scale>1.1</scale>
        <Icon>
          <href>http://maps.google.com/mapfiles/kml/paddle/grn-circle.png</href>
        </Icon>
      </IconStyle>
    </Style>
    <Style id="style-padam">
      <IconStyle>
        <scale>1.2</scale>
        <Icon>
          <href>http://maps.google.com/mapfiles/kml/paddle/red-circle.png</href>
        </Icon>
      </IconStyle>
    </Style>
    <Style id="style-izin">
      <IconStyle>
        <scale>1.1</scale>
        <Icon>
          <href>http://maps.google.com/mapfiles/kml/paddle/ylw-circle.png</href>
        </Icon>
      </IconStyle>
    </Style>
    <Style id="style-besar">
      <IconStyle>
        <scale>1.1</scale>
        <Icon>
          <href>http://maps.google.com/mapfiles/kml/paddle/purple-circle.png</href>
        </Icon>
      </IconStyle>
    </Style>

    ${placemarksXml}
  </Document>
</kml>`;
}

/**
 * Downloads .kml file to browser
 */
export function exportToKml(records: ROWRecord[], filename: string = 'peta_sebaran_pln.kml') {
  const xmlString = generateKmlContent(records);
  const blob = new Blob([xmlString], { type: 'application/vnd.google-earth.kml+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Downloads .kmz file (zipped KML) to browser
 */
export async function exportToKmz(records: ROWRecord[], filename: string = 'peta_sebaran_pln.kmz') {
  const xmlString = generateKmlContent(records);
  const zip = new JSZip();
  zip.file('doc.kml', xmlString);
  const blob = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

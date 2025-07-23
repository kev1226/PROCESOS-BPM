import * as fs from 'fs';
import * as path from 'path';
import * as vision from '@google-cloud/vision';
import { extraerDatosDesdePDF } from './pdf-to-image';

// Cliente OCR de Google
const client = new vision.ImageAnnotatorClient({
  keyFilename: path.resolve(process.cwd(), 'credentials.json'),
});

export async function detectOCR(ruta: string) {
  const extension = path.extname(ruta).toLowerCase();
  const rutaAbsoluta = path.resolve(process.cwd(), ruta);
  console.log(' Buscando archivo en:', rutaAbsoluta);

  if (!fs.existsSync(rutaAbsoluta)) {
    throw new Error(`⚠️ Archivo no encontrado: ${rutaAbsoluta}`);
  }

  if (extension === '.pdf') {
    const texto = await extraerDatosDesdePDF(rutaAbsoluta); // ahora devuelve texto crudo
    return extraerCampos(texto); // y lo analiza como las imágenes
  }

  const imageBuffer = fs.readFileSync(rutaAbsoluta);

  const [result] = await client.documentTextDetection({
    image: { content: imageBuffer },
  });

  const texto = result.fullTextAnnotation?.text ?? '';

  return extraerCampos(texto);
}

function extraerCampos(texto: string) {
  const textoPlano = texto.replace(/\n/g, ' ');

  // 🧾 Número de factura: detecta SERIE + número separado
  let factura: string | null = null;

  const serie = textoPlano.match(/serie\s+(\d{3}-\d{3})/i)?.[1];
  const secuencia = textoPlano.match(/\b(\d{6,9})\b/)?.[1];

  if (serie && secuencia) {
    factura = `${serie}-${secuencia}`;
  } else {
    factura =
      textoPlano.match(/\b\d{3}-\d{3}-\d{6,9}\b/)?.[0] ??
      textoPlano.match(/factura\s*[nº°#:\s]*([\d\-]+)/i)?.[1] ??
      textoPlano.match(/comprobante\s*[nº°#:\s]*([\d\-]+)/i)?.[1] ??
      null;
  }

  // 🔢 RUC de 10 a 13 dígitos
  const ruc = textoPlano.match(/\b\d{10,13}\b/)?.[0] ?? null;

  // 📅 Fecha: formatos comunes, raros, y con mes en letras
  let fecha =
    textoPlano.match(/\b\d{2}\/\d{2}\/\d{4}\b/)?.[0] ??
    textoPlano.match(/\b\d{4}-\d{2}-\d{2}\b/)?.[0] ??
    null;
  if (!fecha) {
    const fechasRaras = [...textoPlano.matchAll(/\b\d{8}\b/g)];
    for (const match of fechasRaras.reverse()) {
      const f = match[0];
      const dd = f.slice(0, 2);
      const mm = f.slice(2, 4);
      const yy = f.slice(6, 8); // ← 👈 solo los dos últimos dígitos
      const dia = parseInt(dd);
      const mes = parseInt(mm);
      const anio = 2000 + parseInt(yy); // ← 👈 fuerza 22 a 2022

      if (
        dia > 0 &&
        dia <= 31 &&
        mes > 0 &&
        mes <= 12 &&
        anio >= 2000 &&
        anio <= 2099
      ) {
        fecha = `${dd}/${mm}/${anio}`;
        break;
      }
    }
  }

  // 📆 Fechas como “29 DICIEMBRE 2021”
  if (!fecha) {
    const mesMap: { [key: string]: string } = {
      enero: '01',
      febrero: '02',
      marzo: '03',
      abril: '04',
      mayo: '05',
      junio: '06',
      julio: '07',
      agosto: '08',
      septiembre: '09',
      octubre: '10',
      noviembre: '11',
      diciembre: '12',
    };

    const matchFechaMes = textoPlano.match(
      /\b(\d{1,2})\s+(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)\s+(\d{4})\b/i,
    );
    if (matchFechaMes) {
      const dia = matchFechaMes[1].padStart(2, '0');
      const mes = mesMap[matchFechaMes[2].toLowerCase()];
      const anio = matchFechaMes[3];
      fecha = `${dia}/${mes}/${anio}`;
    }
  }

  // 💲 Buscar todos los montos posibles con etiquetas de total, pero excluir subtotales
  const montoMatches = [
    ...textoPlano.matchAll(
      /\b(?:valor\s+total|valor\s+a\s+pagar|total\s+a\s+pagar|importe\s+total|total)[^\d]{0,20}(\d+(?:[.,]\d{2})?)/gi,
    ),
  ];

  // Filtrar montos no deseados
  const montoMatch = montoMatches.reverse().find((match) => {
    const contexto = match[0].toLowerCase();
    return (
      !contexto.includes('v. total') &&
      !contexto.includes('v.total') &&
      !contexto.includes('v.unit') &&
      !contexto.includes('subtotal') &&
      !contexto.includes('descuento') &&
      !contexto.includes('iva')
    );
  });

  const rawMonto = montoMatch?.[1] ?? null;

  const total = rawMonto
    ? parseFloat(
        rawMonto.includes(',')
          ? rawMonto.replace(/\./g, '').replace(',', '.')
          : rawMonto.replace(/[^0-9.]/g, ''),
      )
    : null;

  return {
    numero_factura: factura,
    ruc,
    fecha_emision: fecha,
    valor_total: total,
    texto_completo: textoPlano.slice(0, 5000),
  };
}

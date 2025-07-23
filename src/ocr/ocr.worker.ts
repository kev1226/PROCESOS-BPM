import { Camunda8 } from '@camunda8/sdk';
import { OcrService } from './ocr.service';

export async function iniciarOCRWorker(ocrService: OcrService) {
  const camunda = new Camunda8({
    CAMUNDA_AUTH_STRATEGY: 'OAUTH',
    ZEEBE_ADDRESS: process.env.ZEEBE_ADDRESS,
    ZEEBE_CLIENT_ID: process.env.ZEEBE_CLIENT_ID,
    ZEEBE_CLIENT_SECRET: process.env.ZEEBE_CLIENT_SECRET,
    CAMUNDA_OAUTH_URL: process.env.CAMUNDA_OAUTH_URL,
  });

  const zeebe = camunda.getZeebeGrpcApiClient();

  zeebe.createWorker({
    taskType: 'ocr_factura',
    taskHandler: async (job) => {
      const archivo_ruta: string =
        job.variables.archivo_ruta?.toString?.() ?? '';

      const resultado = await ocrService.procesarOCRDesdeArchivo(archivo_ruta);

      function convertirFechaDMYaYMD(fecha: string): string {
        const [dia, mes, anio] = fecha.split('/');
        return `${anio}-${mes}-${dia}`;
      }

      // ✅ Limpiar nulos para que job.complete no falle
      const limpio = {
        texto_completo: resultado.texto_completo ?? '',
        numero_factura_ocr: resultado.numero_factura ?? '',
        ruc_ocr: resultado.ruc ?? '',
        fecha_factura_ocr: resultado.fecha_emision
          ? convertirFechaDMYaYMD(resultado.fecha_emision)
          : '',

        monto_ocr: resultado.valor_total ? Number(resultado.valor_total) : 0,
      };

      console.log('📦 Enviando a Camunda:', limpio);

      return job.complete(limpio);
    },
  });

  console.log('✅ Worker OCR conectado y escuchando tareas "ocr_factura"');
}

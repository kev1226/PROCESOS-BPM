import { Camunda8 } from '@camunda8/sdk';
import { createConnection } from 'mysql2/promise';
export async function iniciarWorkerVerificarPresupuesto() {
  const camunda = new Camunda8({
    CAMUNDA_AUTH_STRATEGY: 'OAUTH',
    ZEEBE_ADDRESS: process.env.ZEEBE_ADDRESS,
    ZEEBE_CLIENT_ID: process.env.ZEEBE_CLIENT_ID,
    ZEEBE_CLIENT_SECRET: process.env.ZEEBE_CLIENT_SECRET,
    CAMUNDA_OAUTH_URL: process.env.CAMUNDA_OAUTH_URL,
  });

  const zeebe = camunda.getZeebeGrpcApiClient();

  const conn = await createConnection({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  zeebe.createWorker({
    taskType: 'verificar_presupuesto',
    taskHandler: async (job) => {
      const vars = job.variables;

      const cedula = String(vars.cedula ?? '').trim();
      const numero_factura = String(vars.numero_factura ?? '').trim();
      const monto = Number(vars.monto ?? 0);
      const fecha_factura = String(vars.fecha_factura ?? '').trim();
      const area = String(vars.area ?? '').trim();

      try {
        const [rows]: any = await conn.query(
          'SELECT * FROM presupuestos_area WHERE area = ?',
          [area],
        );

        if (!Array.isArray(rows) || rows.length === 0) {
          console.log(`⛔ Área no encontrada: ${area}`);
          return job.complete({ presupuesto: false });
        }

        const presupuesto = rows[0];
        if (presupuesto.saldo < monto) {
          console.log(`❌ Presupuesto insuficiente para el área ${area}`);
          return job.complete({ presupuesto: false });
        }

        await conn.query(
          'INSERT INTO asientos_contables (cedula, numero_factura, monto, fecha_factura, descripcion, estado) VALUES (?, ?, ?, ?, ?, ?)',
          [
            cedula,
            numero_factura,
            monto,
            fecha_factura,
            `Reembolso pendiente aprobado por Finanzas - área ${area}`,
            'pendiente',
          ],
        );

        console.log(
          `✅ Presupuesto aprobado y asiento contable registrado para el área ${area}`,
        );
        return job.complete({ presupuesto: true });
      } catch (error) {
        console.error('🔥 Error en worker verificar_presupuesto:', error);
        return job.fail('Error interno al verificar presupuesto');
      }
    },
  });

  console.log('✅ Worker verificar_presupuesto listo.');
}

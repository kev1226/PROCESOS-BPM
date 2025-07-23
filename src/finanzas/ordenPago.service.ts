// ✅ Worker 2: procesar_pago (flujo profesional)
// 1. Genera la orden de pago (estado: pendiente)
// 2. Descuenta el presupuesto del área
// 3. Actualiza el asiento contable a 'ejecutado'

import { Camunda8 } from '@camunda8/sdk';
import { createConnection } from 'mysql2/promise';

export async function iniciarWorkerProcesarPago() {
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
    taskType: 'procesar_pago',
    taskHandler: async (job) => {
      const vars = job.variables;

      const numero_factura = String(vars.numero_factura ?? '').trim();
      const monto = Number(vars.monto ?? 0);
      const area = String(vars.area ?? '').trim();
      const banco = String(vars.banco ?? '').trim();
      const cuenta_bancaria = String(vars.cuenta_bancaria ?? '').trim();

      try {
        // 1. Insertar orden de pago (estado: pendiente)
        const [ordenResult]: any = await conn.query(
          'INSERT INTO ordenes_pago (numero_factura, monto, banco, cuenta_bancaria, estadoPago) VALUES (?, ?, ?, ?, ?)',
          [numero_factura, monto, banco, cuenta_bancaria, 'pendiente'],
        );

        const ordenId = ordenResult.insertId;
        console.log(`✅ Orden de pago generada con ID #${ordenId}`);

        // 2. Descontar presupuesto del área
        await conn.query(
          'UPDATE presupuestos_area SET saldo = saldo - ? WHERE area = ?',
          [monto, area],
        );

        // 3. Actualizar asiento contable a 'ejecutado'
        await conn.query(
          'UPDATE asientos_contables SET estado = ? WHERE numero_factura = ?',
          ['ejecutado', numero_factura],
        );

        // 4. Actualizar estado de la orden a 'completado'
        await conn.query(
          'UPDATE ordenes_pago SET estadoPago = ? WHERE id = ?',
          ['completado', ordenId],
        );

        return job.complete({
          estadoAprobado: true,
          orden_generada: true,
          orden_pago_id: ordenId,
        });
      } catch (error) {
        console.error('🔥 Error en worker procesar_pago:', error);
        return job.fail('Error al procesar el pago');
      }
    },
  });

  console.log('✅ Worker procesar_pago listo.');
}

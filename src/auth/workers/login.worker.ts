import { Camunda8 } from '@camunda8/sdk';
import axios from 'axios';

export async function iniciarWorkerLoginInterno() {
  const camunda = new Camunda8({
    CAMUNDA_AUTH_STRATEGY: 'OAUTH',
    ZEEBE_ADDRESS: process.env.ZEEBE_ADDRESS,
    ZEEBE_CLIENT_ID: process.env.ZEEBE_CLIENT_ID,
    ZEEBE_CLIENT_SECRET: process.env.ZEEBE_CLIENT_SECRET,
    CAMUNDA_OAUTH_URL: process.env.CAMUNDA_OAUTH_URL,
  });

  const zeebe = camunda.getZeebeGrpcApiClient();

  zeebe.createWorker({
    taskType: 'validar_login_interno',
    taskHandler: async (job) => {
      const { correo, password } = job.variables;

      console.log('📨 Variables recibidas:', job.variables);

      try {
        const response = await axios.post('http://localhost:3003/auth/login', {
          correo,
          password,
        });

        const usuario = response.data.usuario;

        console.log(`✅ Login interno exitoso para: ${correo}`);

        return job.complete({
          ...usuario,
          login_exitoso: true,
        });
      } catch (error) {
        console.error('⛔ Error en login interno:');
        console.error('Mensaje:', error.message);
        console.error('Stack:', error.stack);
        console.error('Response:', error.response?.data);
        return job.fail('Credenciales incorrectas', 0);
      }
    },
  });

  console.log('✅ Worker validar_login_interno levantado.');
}

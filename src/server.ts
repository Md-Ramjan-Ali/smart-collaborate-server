import app from './app';
import config from './app/config';

async function main() {
  try {
    app.listen(config.port, () => {
      console.log(`⚡️ [Server]: Server is running at http://localhost:${config.port}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
  }
}

main();

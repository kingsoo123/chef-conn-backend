require('../dist/database/run-migrations')
  .runDatabaseMigrations()
  .then(() => {
    console.log('Database migrations applied.');
  })
  .catch((error) => {
    console.error(error.message ?? error);
    process.exit(1);
  });

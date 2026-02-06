// Set environment variables for mongodb-memory-server
// Prevent automatic downloads during test runs
process.env.MONGOMS_DISABLE_POSTINSTALL = '1';
// Use a specific version
process.env.MONGOMS_VERSION = '7.0.14';
// Set download directory to a persistent location
process.env.MONGOMS_DOWNLOAD_DIR = `${__dirname}/../../../.mongodb-binaries`;

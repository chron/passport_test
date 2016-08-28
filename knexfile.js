// Update with your config settings.

module.exports = {

  development: {
    client: 'postgresql',
    connection: 'postgres://localhost:5432/hudson',
    pool: {
      min: 1,
      max: 10
    }
  }
}

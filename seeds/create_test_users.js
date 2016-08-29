var bcrypt = require('bcrypt-nodejs')

exports.seed = function(knex, Promise) {
  return knex('users').del()
    .then(function () {
      return Promise.all([
        knex('users').insert({username: 'hudson', password: bcrypt.hashSync('sweet')})
      ])
    })
}

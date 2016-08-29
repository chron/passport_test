var express = require('express')
var passport = require('passport')
var LocalStrategy = require('passport-local').Strategy
var exphbs = require('express-handlebars')
var cookieParser = require('cookie-parser')
var session = require('express-session')
var bodyParser = require('body-parser')
var morgan = require('morgan')
var flash = require('connect-flash')
var bcrypt = require('bcrypt-nodejs')

var config = require('./knexfile')
var knex = require('knex')(config.development)

passport.serializeUser(function(user, cb) {
  cb(null, user.id)
})

passport.deserializeUser(function(id, cb) {
  knex('users').where('id', id).first().then(function(user) {
    cb(null, user)
  })
})

var isAuthenticated = function(req, res, next) {
  if (req.isAuthenticated())
    return next()

  req.flash('error', 'You must be logged in to access that page.')
  res.redirect('/login')
}

var app = express()

app.engine('handlebars', exphbs({defaultLayout: 'main'}));
app.set('view engine', 'handlebars');

passport.use('login', new LocalStrategy(
  function(username, password, done) {
    knex('users').where('username', username).first().then(function(user){
      if(user) {
        if(bcrypt.compareSync(password, user.password)) {
          return done(null, user)
        } else {
          return done(null, false, { message: 'Invalid password.' })
        }
      } else {
        return done(null, false, { message: 'Incorrect details.' })
      }
    })
  }
))

passport.use('signup', new LocalStrategy(
  function(username, password, done) {
    if (username != '' && password != '') {
      knex('users').where('username', username).then(function(users){
        if(users.length > 0) {
          return done(null, false, { message: 'Username is already taken.' })
        } else {
          knex('users').returning('id').insert({
            username: username,
            password: bcrypt.hashSync(password)
          }).then(function(newIds){
            knex('users').where('id', newIds[0]).first().then(function(user){
              return done(null, user)
            })
          })
        }
      })
    } else {
      return done(null, false, { message: 'Username and password must be provided details.' })
    }
  }
))

app.use(express.static('public'))
app.use(morgan('dev'))
app.use(cookieParser())
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({ cookie: { maxAge: 60000 }, secret: 'bodyparseristheworstthing', resave: false, saveUninitialized: false }))
app.use(passport.initialize())
app.use(passport.session())
app.use(flash())

app.get('/', function(req, res) {
  res.render('index', { user: req.user });
})

app.get('/secret', isAuthenticated, function(req, res) {
  res.render('secret', { user: req.user })
})

app.get('/login', function(req, res) {
  res.render('login', { messages: req.flash() })
})

app.post('/login',
  passport.authenticate('login', { failureRedirect: '/login', failureFlash: true } ),
  function(req, res) {
    res.redirect('/')
  }
)

app.get('/signup', function(req, res) {
  res.render('signup', { messages: req.flash() })
})

app.post('/signup',
  passport.authenticate('signup', { failureRedirect: '/signup', failureFlash: true } ),
  function(req, res) {
    res.redirect('/')
  }
)

app.get('/logout',
  function(req, res){
    req.logout()
    res.redirect('/')
  }
)

app.listen(3001)

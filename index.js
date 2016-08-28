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
  knex('users').where('id', id).then(function(users) {
    cb(null, users[0])
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
    knex('users').where('username', username).then(function(users){
      if(users.length > 0) {
        var user = users[0]
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
  res.render('secret')
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

app.get('/logout',
  function(req, res){
    req.logout()
    res.redirect('/')
  }
)

app.listen(3001)

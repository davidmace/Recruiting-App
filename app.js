/*
 * Module dependencies
 */
var express = require('express')
  , stylus = require('stylus')
  , nib = require('nib')
  , fs = require("fs")
  , url = require('url')
  , Parse = require('parse').Parse;


var app = express()
function compile(str, path) {
  return stylus(str)
    .set('filename', path)
    .use(nib())
}
app.set('views', __dirname + '/views')
app.set('view engine', 'jade')
app.use(express.logger('dev'))
app.use(stylus.middleware(
  { src: __dirname + '/public'
  , compile: compile
  }
))
app.use(express.static(__dirname + '/public'))

// main page
app.get('/', function (req, res) {
  res.render('index',
  { title : 'Home' }
  )
})

// testing page
app.get('/test', function (req, res) {
  res.render('test.html',
  { title : 'Home' }
  )
})

//API for sending interview request push notification to student
app.get('/interviewRequest', function (req, res) {
  var url_parts = url.parse(req.url, true);
  var query = url_parts.query;
  var pid = query['id'] // pid is the company's id
  var cid = "000001" //TEMP
  Parse.initialize("TOKENS");
  Parse.Push.send({
    channels: [ "user_"+pid ],
    data: {
      alert: "Company "+cid+" would like to interview you!", data: cid
    }
  }, {
    success: function() {
      res.writeHead(200, {'content-type':'text/html'});
      res.write('<p>GOOOOD</p>');
      res.end();
    },
    error: function(error) {
      res.writeHead(200, {'content-type':'text/html'});
      res.write("Error: " + error.code + " " + error.message);
      res.end();
    }
  });
})

//API for sending sendgrid email intro
app.get('/emailIntro', function (req, res) {
  var url_parts = url.parse(req.url, true);
  var query = url_parts.query;
  var pid = query['pid']
  var cid = query['cid']
  var sendgrid  = require('sendgrid')("ACCOUNT INFO");
  var payload   = {
    to      : 'davidcalvermace@gmail.com', // TODO this is my test email
    from    : 'dmace@caltech.edu',
    subject : 'Saying Hi',
    text    : 'This is my first email through SendGrid'
  }
  sendgrid.send(payload, function(err, json) {
  if (err) { console.error(err); }
    console.log(json);
  });
  res.writeHead(200, {'content-type':'text/html'});
      res.write('<p>GOOOOD</p>');
      res.end();
})


//API for sending sendgrid resume request
app.get('/studentSwiped', function (req, res) {
  var url_parts = url.parse(req.url, true);
  var query = url_parts.query;
  var student = query['student']
  var company = query['company']
  var interest = query['interest']
  var date = Math.floor(new Date()/8.64e7);

  //save user creds to parse
  Parse.initialize("TOKENS"); 
  var ParseObject = Parse.Object.extend("Match");
  var match = new ParseObject();
  match.set("student", student);
  match.set("company", company);
  match.set("date", date);
  match.set("level",interest)
  match.save(null, {
    success: function(gameScore) {
      console.log('New object created with objectId: ' + match.id);
    },
    error: function(gameScore, error) {
      console.log('Failed to create new object, with error code: ' + error.message);
    }
  });
  res.writeHead(200, {'content-type':'text/html'});
  res.write('<p>GOOOOD</p>');
  res.end();
})

//API for sending sendgrid resume request
app.get('/getNextCompany', function (req, res) {
  var url_parts = url.parse(req.url, true);
  var query = url_parts.query;
  var student = query['student']

  //save user creds to parse
  Parse.initialize("TOKENS"); 
  companies=["www.lyft.com", "www.lob.com", "www.uber.com", "www.side.cr", "www.pertino.com", "www.wearableintelligence.com", "www.zerocater.com", "www.onradpad.com", "www.enplug.com", "www.nimblestorage.com"]
  company=companies[ Math.floor(Math.random()*10) ]
  res.writeHead(200, {'content-type':'text/html'});
  res.write(company);
  res.end();
})


//API for sending sendgrid resume request
app.get('/signup', function (req, res) {
  var url_parts = url.parse(req.url, true);
  var query = url_parts.query;
  var email = query['email']
  var name = query['name']

  //save user creds to parse
  Parse.initialize("TOKENS"); 
  var Student = Parse.Object.extend("Student");
  var student = new Student();
  student.set("email", email);
  student.set("name", name);
  student.set("ability", 0);
  for (var i=1; i<=4; i++) { 
    student.set("s"+i, 0);
    student.set("t"+i, 0);
    student.set("l"+i, 0);
  }
  student.save(null, {
    success: function(gameScore) {
      console.log('New object created with objectId: ' + student.id);
    },
    error: function(gameScore, error) {
      console.log('Failed to create new object, with error code: ' + error.message);
    }
  });
  var id = student.id
  
  //send email requesting resume
  var sendgrid  = require('sendgrid')('ACCOUNT INFO');
  var payload   = {
    to      : email,
    from    : 'hackerships@gmail.com',
    subject : 'Resume Drop',
    text    : 'Please respond with your resume attached.'
  }
  sendgrid.send(payload, function(err, json) {
    if (err) { console.error(err); }
    console.log(json);
  });
  res.writeHead(200, {'content-type':'text/html'});
  res.write('<p>GOOOOD</p>');
  res.end();
})
  

//Display student view
app.get('/student', function (req, res) {
  var url_parts = url.parse(req.url, true);
  var query = url_parts.query;
  var id = query['id']
  res.render('student',
  { id : id }
  )
})

//Embedded resume API
app.get('/resume', function(request, response){
  var url_parts = url.parse(request.url, true);
  var query = url_parts.query;
  var id = query['id']
  console.log(id);
  var tempFile="resumes/"+id+".pdf";
  fs.readFile(tempFile, function (err,data){
     response.contentType("application/pdf");
     response.send(data);
  });
});


//API call for getting matches between students and companies
app.get('/getMatches', function(request, response){
  var url_parts = url.parse(request.url, true);
  var query = url_parts.query;
  var id = query['cid']
  console.log(id);
  Parse.initialize("TOKENS"); 
  
  //Called when all of the data is loaded (TODO cache, intersect with previously seen candidates)
  dataLoaded=0; company=null; students=null;
  function onDataLoaded() {
    dataLoaded+=1;
    if (dataLoaded==2) {
      t=company.get('t'); l=company.get('l'); s=company.get('s'); diff=company.get('difficulty');
      ratings=[]
      for (var i = 0; i < students.length; i++) { 
        var student = students[i];
        pid=student.get('pid');
        st=student.get('t'+t); sl=student.get('l'+l);
        ss=student.get('s'+s); sa=student.get('ability');
        rating=st*ss*sl;
        ratings.push([pid,rating]);
      }
      ratings.sort(function(a, b){return b[1]-a[1]});
      matchedStudents=[];
      for (var i=0; i<ratings.length; i++) {
        matchedStudents.push(ratings[i][0]);
      }
      response.writeHead(200, { 'Content-Type': 'application/json' });
      response.end(JSON.stringify({ students: matchedStudents }));
    }
  }

  //Get all students
  var Student = Parse.Object.extend("Student");
  var query = new Parse.Query(Student);
  query.find({
    success: function(results) {
      students=results;
      onDataLoaded();
    },
    error: function(error) {
      console.log("Error: " + error.code + " " + error.message);
    }
  });

  //Get this company
  var Company = Parse.Object.extend("Company");
  var query2 = new Parse.Query(Company);
  query2.equalTo("cid", id);
  query2.find({
    success: function(results) {
      company=results[0];
      onDataLoaded();
    },
    error: function(error) {
      console.log("Error: " + error.code + " " + error.message);
    }
  });



});
app.listen(3000)
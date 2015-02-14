
// http get util
function httpGet(theUrl)
{
    var xmlHttp = null;

    xmlHttp = new XMLHttpRequest();
    xmlHttp.open( 'GET', theUrl, false );
    xmlHttp.send( null );
    return xmlHttp.responseText;
}
studentsString=httpGet('/getMatches?cid=000001')
students=JSON.parse( studentsString ).students;
container=document.getElementsByName('student_container');

// async call to add all of the student matches for a specific company
for (var i=0; i<students.length; i++) {
	console.log(students[i])
	var element = document.createElement('div');
	element.appendChild(document.createTextNode(students[i]));
	$( '#main' ).append("<a href='/student?pid="+students[i]+"'>"+students[i]+"</a><br/>");
}



// http get util
function httpGet(theUrl)
{
  var xmlHttp = null;
  xmlHttp = new XMLHttpRequest();
  xmlHttp.open( 'GET', theUrl, false );
  xmlHttp.send( null );
  return xmlHttp.responseText;
}

// async API request for user requesting interview
function requestInterview(id) {
  studentsString=httpGet('/interviewRequest?id='+id);
}
//function sendRequest(url,callback,postData) {
//	var req = createXMLHTTPObject();
//	if (!req) return;
//	var method = (postData) ? "POST" : "GET";
//	req.open(method,url,true);
//	req.setRequestHeader('User-Agent','XMLHTTP/1.0');
//	if (postData)
//		req.setRequestHeader('Content-type','application/x-www-form-urlencoded');
//	req.onreadystatechange = function () {
//		if (req.readyState != 4) return;
//		if (req.status != 200 && req.status != 304) {
////			alert('HTTP error ' + req.status);
//			return;
//		}
//		callback(req);
//	}
//	if (req.readyState == 4) return;
//	req.send(postData);
//}

baseUrl = '';
   //	baseUrl = 'http://192.168.1.105:8080/francesGo2-portal/mobile/';
   //	baseUrl =  'https://bbvawebqa.bancofrances.com.ar/francesGo2-portal/mobile/';
  		baseUrl = 'http://m.francesgo.com.ar/francesGo2-Portal/mobile/';


function sendRequest(url,callback,postData) {
	try{
	var req = createXMLHTTPObject();
	
	if (!req) return;
	
	var method = (postData) ? "POST" : "GET";
	
	req.overrideMimeType('application/json');

	req.open(method,url,true);
	
	//req.setRequestHeader('User-Agent','XMLHTTP/1.0');

	if (postData){
		req.setRequestHeader('Content-type','application/x-www-form-urlencoded');
	}
	req.onreadystatechange = function () {
		if (req.readyState == 4 && (req.status == 200 || window.location.href.indexOf ("http") == - 1)){
			
		//	console.log('datos: ' + JSON.parse(req.responseText));
			
			callback(req);
		}
	}
	
	req.send(postData);
	}catch(e){
		alert('error ' + e)
		console.log('error ' + e);
	}
		
}

var XMLHttpFactories = [
	function () {return new XMLHttpRequest()},
	function () {return new ActiveXObject("Msxml2.XMLHTTP")},
	function () {return new ActiveXObject("Msxml3.XMLHTTP")},
	function () {return new ActiveXObject("Microsoft.XMLHTTP")}
];

function createXMLHTTPObject() {
	var xmlhttp = false;
	for (var i=0;i<XMLHttpFactories.length;i++) {
		try {
			xmlhttp = XMLHttpFactories[i]();
		}
		catch (e) {
			continue;
		}
		break;
	}
	return xmlhttp;
}
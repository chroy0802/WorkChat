/* eval2 Web Worker based eval alternative  [CCBY4.0] - (c)2015, by dandavis

Goal:	safely evaluate JS expressions in-browser without XSS or CSRF risks, cookie or localStorage leaks, and without the complixity of a custom parser.
M.O. : 	uses a new Web Worker context to execute the code to stop global reach,  black-listing interfaces which leak data, and preventing arbitrary code execution.
usage:	given a string of code and a callback function, eval()uates the code, and passes the result (or "tail") to the callback.
	given a function,  the function will be run in the worker, and the return passed to the callback, avoiding all use of "eval"
	you can also avoid eval by 
	the result passed to the callback can be a primitive, object, array, function, as well as some newer constructs like typed Arrays.
config:	null
needs:	null

*/

function eval2(strCode, cb, blnExecOnly) {


	function work() { // this code runs in the worker, providing a safe one-time custom JS enviroment
		delete Function.prototype.constructor; 	// blocks Function access via any.constructor
		delete Object.getOwnPropertyNames; 	// prevents environment sniffing

        	// black-list (potentially) unsafe globals to prevent access from user-provided code via formal parameters on a wrapper function:
		function privacy(self, XMLHttpRequest, importScripts, Function, Worker, WebSocket, MessageChannel, __proto__, __defineGetter__,
				  IDBDatabase, setTimeout, setInterval, EventSource, onmessage, onerror, console) {
			"use strict"; // makes "eval" keyword even safer by keeping this from execution aliases

			postMessage(/0/);

		} /* end privacy() */

		setTimeout(privacy.bind(null),0); // block 'this' in user-provided code and execute

	} /* end work() */

	if (typeof strCode === "function") {
		strCode = " (" + strCode + ").call()";
	} else {
		if(blnExecOnly){
			strCode="true);"+strCode+";void(0";  
		}else{ 
			strCode = "eval(" + JSON.stringify(strCode.trim()) + ")";
		}
	}

	

	var code = String(work).trim().split("{").slice(1).join("{").slice(0, - 1).trim().replace("/0/", strCode ), // inline the user code
	worker = new Worker(URL.createObjectURL(new Blob([code]))); // create a new worker loaded with the user-provided code in the wrapper

	worker.onmessage = function(e) { // code evaluated, results arriving
		cb(e.data, e, code, worker); // invoke callback with result and some extra arguments for routing 
		worker.terminate();
	};

	worker.onerror = function(e) { // code evaluated, results arriving
		var m=e.message; 
		e={toString:function(){return m+"\n"+Object.keys(e.e).map(function(a){
			if(this[a]==null || typeof this[a]==="object")return;
 		  return a+": \t"+this[a]
                },e.e).filter(Boolean).join("\n");}, e:e};
		cb(e, null, code, worker); // invoke callback with result, null as the event object to indicate errror, and some extra arguments for routing 
		worker.terminate();
	};

  return worker;

} /* end eval2() */



/*  EXAMPLES:

// simple string code example:
eval2(" 'Hello' + ' ' + {a:'world'}['a']  ", function(rez) {
	alert(rez); // shows: Hello world
});


// simple function code example:
eval2(function(){ return 123 / 456 ; }, function(rez) {
	alert(rez); // shows: 0.26973684210526316
});


// rich error example (ajax)  - blacklisted globals like XMLHttpRequest cannot be used
eval2(" x=new XMLHttpRequest(); x.open('GET', '//google.com'); x.send(); x.resultText;  ", function(rez) {
	alert(JSON.stringify(rez, null, "\t")); // shows: a rich error object including "Uncaught TypeError: undefined is not a function"
});


// rich error example (runtime):
eval2("escape(asdf(123))", function(rez) {
	alert(JSON.stringify(rez, null, "\t")); // shows: a rich error object including "Uncaught ReferenceError: asdf is not defined"
});


// rich error example (syntax):
eval2("car a=1, b=3; a+b", function(rez) {
	alert(JSON.stringify(rez, null, "\t")); // shows: a rich error object including "Uncaught SyntaxError: Unexpected identifier" and line+col of problem
});


// advanced function example, custom blacklist to block additional globals (future-proofing):
eval2(function(XMLHttpRequest2, execScript, setImmediate ){ return execScript("123 / 456") ; }, function(rez) {
	alert(JSON.stringify(rez, null, "\t")); // shows: a rich error object including "Uncaught TypeError: undefined is not a function"
});

*/

// advanced function example, custom blacklist to block additional globals (future-proofing):
// eval2( "3453;\n\n\n4ds235/fsd", function(rez) {
// 	alert(rez); // shows: a rich error object including "Uncaught TypeError: undefined is not a function"
// });

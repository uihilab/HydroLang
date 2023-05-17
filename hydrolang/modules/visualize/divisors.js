/***************************/
/*** Supporting functions **/
/***************************/

/**
 * Module for visualization of charts and tables.
 * @class divisors
 */

/**
 * Function for verifying if a div has already been added into the document.
 * @method isdivAdded
 * @memberof divisors
 * @param {Object} params - Contains: id (specific name for the divisor).
 * @returns {Boolean} True of a div with the given id is found in the document.
 * @example
 * hydro.visualize.isdivAdded({params: {id: 'someDivName'}})
 */

function isdivAdded({ params, args, data } = {}) {
  const element = document.getElementById(params.id);
  return Boolean(element && element.nodeName === 'DIV');
}

/**
 * Function for verifying if a script has been added to the header of the webpage.
 * @method isScriptAdded
 * @memberof divisors
 * @param {Object} params - Contains: name (script on screen, or not)
 * @returns {Boolean} True if the script has been appended to the header.
 * @example
 * hydro.visualize.isScriptAdded ({params: {name: 'someName'}})
 */

function isScriptAdded({ params, args, data } = {}) {
  //Select a name passed as an attribute instead of source for selection purposes.
  return Boolean(document.querySelector(`script[name=${params.name}`));
}

/**
 * Creates a script given a source, JS text and name to be appended to the header.
 * @function createScript
 * @memberof divisors
 * @param {Object} params - Contains: name (script name), src (CDN source)
 * @returns {Element} If found, returns the the script library to add listeners and handlers once loaded.
 * @example
 * hydro.visualize.createScript({params: {name: "someName", src: "somrCDNurl"}})
 */

function createScript({ params, args, data } = {}) {
  //Add any external script into the DOM for external library usage.
  if (isScriptAdded({ params: { name: params.name } }) === false) {
    var sr = document.createElement("script");
    sr.type = "text/javascript";
    sr.src = params.src;
    sr.setAttribute("name", params.name);
    document.head.appendChild(sr);
    //If the user wants to add functionality coming from the script, do after.
  }
  if (isScriptAdded({ params: { name: params.name } })) {
    var sc = document.querySelector(`script[name=${params.name}]`);
    return sc;
  }
}

/**
 * Creates a form appended to the DOM with a button attached to it.
 * @function createForm
 * @memberof divisor
 * @param {Object} params - Contains: className (name of class to create for from)
 * @returns {Element} Form appended to the DOM.
 * @example
 * hydro.visualize.createForm({params: {className: 'some class'}})
 */

function createForm({ params, args, data } = {}) {
  var fr = document.createElement("form");
  fr.className = params.class;
  document.body.appendChild(fr);
}

/**
 * Creates a div space for rendering all sorts of required divisors.
 * @function createDiv
 * @memberof divisors
 * @param {Object} params - Contains: id, title, class, style
 * @returns {Element} Div space appended to DOM.
 * @example
 * hydro.visualize.createDiv({params: {id: 'someid', title: 'sometitle', className: 'someclass'}})
 */

function createDiv({ params, args, data } = {}) {
  if (isdivAdded({params: params.id})) {
    return;
  } else {
    var dv = document.createElement('div');
    dv.id = params.id;
    dv.title = params.title;
    dv.className = params.class;
    dv.style = params.style;
    
    // Append style to head of document
    var style = document.createElement('style');
    style.type = 'text/css';
    style.appendChild(document.createTextNode(params.style));
    document.head.appendChild(style);
    
    params.maindiv !== undefined
      ? document.getElementById(params.maindiv).appendChild(dv)
      : document.body.appendChild(dv);
  }
}


/**********************************/
/*** End of Supporting functions **/
/**********************************/

export { createDiv, createForm, createScript, isScriptAdded, isdivAdded };

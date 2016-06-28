import ace from 'ace';
ace.config.set('basePath', System.normalizeSync('ace/', __moduleName).split('/').slice(0, -1).join('/'));

document.body.style.margin = '0';
document.body.style.width = '50%';

var eContainer = document.createElement('div');
eContainer.style.width = '60%';
eContainer.style.height = '100%';
eContainer.style.position = 'fixed';
eContainer.style.right = '0';
eContainer.style.top = '0';
eContainer.style.zIndex = 1000;

var errWrapper = document.createElement('div');
errWrapper.style.top = '0';
errWrapper.style.left = '0';
errWrapper.style.width = '40%';
errWrapper.style.display = 'none';
errWrapper.style.overflow = 'scroll';
errWrapper.style.padding = '10px';
var errContainer = document.createElement('div');
errContainer.style.fontSize = '11px';
errContainer.style.fontFamily = 'courier';
errContainer.style.color = 'red';
errContainer.style.backgroundColor = 'white';
errContainer.style.margin = '0';
errWrapper.appendChild(errContainer);

document.head.style.display = 'block';
document.head.appendChild(eContainer);
document.head.appendChild(errWrapper);

var editor = ace.edit(eContainer);

editor.setTheme('ace/theme/monokai');
editor.getSession().setMode('ace/mode/javascript');
editor.getSession().setTabSize(2);
editor.getSession().setUseSoftTabs(true);
editor.$blockScrolling = Infinity;

var moduleName = System.decanonicalize('sandbox');

editor.getSession().on('change', () => {
  var code = editor.getSession().getValue();
  localStorage.systemjs_sandbox_code = code;
  stale = true;
  refresh(code);
});

var lastConfigRefresh = new Date().getTime();
var refreshing = false;
var stale = false;
function refresh(code) {
  if (refreshing)
    return;
  if (new Date().getTime() - lastConfigRefresh > 1000 && jspmConfigFile) {
    lastConfigRefresh = new Date().getTime();
    System.import(jspmConfigFile + '?' + new Date().getTime());
  }

  refreshing = true;
  stale = false;
  System.delete(moduleName);
  document.body.innerHTML = '';
  var container = document.createElement('div');
  container.id = 'container';
  document.body.appendChild(container);
  System.define(moduleName, 'export let __module = true;' + code).then(() => {
    errWrapper.style.display = 'none'
  })
  .catch((e) => {
    errContainer.innerHTML = e.toString().replace(/\n/g, '<br/>&nbsp;&nbsp;');
    errWrapper.style.display = 'block';
  })
  .then(() => {
    refreshing = false;
    if (stale)
      refresh(editor.getSession().getValue());
  });
}

// look for a script called "jspm.config.js" and if present, reload the configuration file every second
var jspmConfigFile;
Array.prototype.forEach.call(document.head.querySelectorAll('script'), (script) => {
  if (script.src.endsWith('jspm.config.js'))
    jspmConfigFile = script.src;
});

editor.getSession().setValue(localStorage.systemjs_sandbox_code || '');
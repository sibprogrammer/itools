Object.extend(Event, {
  _domReady : function() {
    if (arguments.callee.done) return;
    arguments.callee.done = true;

    if (Event._timer)  clearInterval(Event._timer);
    
    Event._readyCallbacks.each(function(f) { f() });
    Event._readyCallbacks = null;
    
  },
  onReady : function(f) {
    if (!this._readyCallbacks) {
      var domReady = this._domReady;
      
      if (domReady.done) return f();
      
      if (document.addEventListener)
        document.addEventListener("DOMContentLoaded", domReady, false);
        
        /*@cc_on @*/
        /*@if (@_win32)
            document.write("<script id=__ie_onload defer src=javascript:void(0)><\/script>");
            document.getElementById("__ie_onload").onreadystatechange = function() {
                if (this.readyState == "complete") { domReady(); }
            };
        /*@end @*/
        
        if (/WebKit/i.test(navigator.userAgent)) { 
          this._timer = setInterval(function() {
            if (/loaded|complete/.test(document.readyState)) domReady(); 
          }, 10);
        }
        
        Event.observe(window, 'load', domReady);
        Event._readyCallbacks =  [];
    }
    Event._readyCallbacks.push(f);
  }
});

Event.onReady(function() {

  function selectPage(pageId) {
    $$('#navigation li').each(function(menuItem) {
      menuItem.removeClassName('selected');
    });
    
    $('link-' + pageId).up('li').addClassName('selected');
    
    $$('.tab').each(function(tab) {
      tab.addClassName('hidden');
    });
    
    var tabId = 'tab-' + pageId;
    $(tabId).removeClassName('hidden');
    $(tabId).down('form').focusFirstElement();
    
    Cookies.save('selected_page', pageId);
  }

  $$('#header a').each(function(currentLink) {
    $(currentLink).observe('click', function() {
      var pageId = currentLink.id.replace('link-', '');
      selectPage(pageId);
    });
  });
  
  var selectedPage = Cookies.read('selected_page')
  selectPage(selectedPage ? selectedPage : 'php');
  
  $$('textarea').each(function(textarea) {
    $(textarea).observe('keydown', function(event) {
      if (event.ctrlKey && (13 == event.keyCode)) {
        Tools.formHandler(textarea.up('form'));
      }
      
      if (9 == event.keyCode) {
        var tab = "    ";
        var target = event.target;
        var ss = target.selectionStart;
        var se = target.selectionEnd;
        
        event.preventDefault();
        
        target.value = target.value.slice(0,ss).concat(tab).concat(target.value.slice(ss,target.value.length));
        
        if (ss == se) {
          target.selectionStart = target.selectionEnd = ss + tab.length;
        } else {
          target.selectionStart = ss + tab.length;
          target.selectionEnd = se + tab.length;
        }
      }
    });
  });
  
});


Cookies = {
  
  save: function(name, value, days) {
    if (days) {
      var date = new Date();
      date.setTime(date.getTime()+(days*24*60*60*1000));
      var expires = "; expires="+date.toGMTString();
    }
    else var expires = "";
    document.cookie = name+"="+value+expires+"; path=/";
  },
  
  read: function(name) {
    var nameEQ = name + "=";
    var ca = document.cookie.split(';');
    for(var i=0;i < ca.length;i++) {
      var c = ca[i];
      while (c.charAt(0)==' ') c = c.substring(1,c.length);
      if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length,c.length);
    }
    return null;
  },
  
  erase: function(name) {
    createCookie(name,"",-1);
  }
  
}

Tools = {

  formHandler: function(form) {
    $(form).down('div.output-wrapper').update('');
    
    var contentElement = $(form).down('div.output-wrapper');
    contentElement.update('');
    var submitButton = $(form).down('input[type="submit"]');
    submitButton.disable();
    submitButton.addClassName("loading");
    submitButton.value = 'Please, wait...';
    
    $(form).select('input', 'textarea').each(function(field) {
      field.removeClassName('error');
      field.title = '';
    });
    
    new Ajax.Request(form.action, {
      method: 'post',
      parameters: Form.serialize(form),
      onSuccess: function(transport) {
        var response = transport.responseText.evalJSON();
        
        if ('undefined' != typeof response.errors) {
          var errors = response.errors;
          errors.each(function(error) {
            var field = $(form).down('input[name="' + error.field + '"]');
            
            if (!field) {
              field = $(form).down('textarea[name="' + error.field + '"]');
            }
            
            field.addClassName('error');
            field.title = error.text;
          });
        } else {
          response.output = response.output.escapeHTML();
          
          if (!response.status) {
            response.output = '<div class="error">Error</div>' + response.output;
          }
          
          contentElement.update('<pre class="output" style="display: none">' + response.output + '</pre>');
          new Effect.Appear(contentElement.down('pre'));
        }
        
        submitButton.enable();
        submitButton.removeClassName("loading");
        submitButton.value = 'Execute';
      }
    });
  }
  
}
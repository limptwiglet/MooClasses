// Formalize class
// Replaces form elements so you can style them
var Formalize = new Class({
        Implements: [Options, Events],

        options: {},

	initialize: function  (form, opts) {
		 this.setOptions(opts);

	        this.form = $(form);
	        this.isReady = false;

	        this.form.addEvent('submit', function (e) {
	                if (!this.isReady) {
	                        //e.stop();
	                        //this.fireEvent('submit');
	        this.form.submit();
	                } else {
	                        this.form.submit();
	                }
	        }.bind(this));
	        
	        var elements = this.form.getElements('input, textarea, select');

	        elements.each(function (el) {
	                var type = (el.get('type')) ? el.get('type') : el.get('tag'),
	                label = form.getElement('label[for='+el.get('id')+']'),
	                name = el.get('name');

	                if (type === 'checkbox') {
	                    this.prepCheckbox(el, label);
	                } else if (type === 'select-one') {
	                    this.prepSelect(el);
	                } else if (type === 'file') {
	                       this.prepFile(el);
	                } else if (type === 'radio') {
	                	this.prepCheckbox(el, label);
	                } else if (type !== 'image') {
	                    this.prepText(el);
	                }
	        }, this);
	

	},
	
	prepCheckbox: function (el, label) {
        var newEl = new Element('span', {
                'class': ((el.get('type') === 'radio') ? 'radio' : 'checkbox')+((el.get('checked')) ? ' checked' : '')
        });
        newEl.inject(el, 'before');
        el.store('formalizeElement', newEl);

        var check = function () {
        	if (el.get('type') === 'checkbox') {
	            if (!el.get('checked')) {
	                newEl.addClass('checked');
	                el.set('checked', true);
	            } else {
	                newEl.removeClass('checked');
	                el.set('checked', false);
	            }
		        } else if (el.get('type') === 'radio') {
		        	var inputs = this.form.getElements('input[name='+el.get('name')+']');
		        	
		        	inputs.each(function (el, i) {
		        		if (el.get('checked')) {
		        			el.retrieve('formalizeElement').removeClass('checked');
		        			el.set('checked', false);
		        		}
		        	});
		        	el.retrieve('formalizeElement').addClass('checked');
		        	el.set('checked', true);
		        }
        }.bind(this);

        if (label) {
            label.addEvent('click', function (e) {
                    
            });
            label.addEvents({
                click: function (e) {
                    e.stop();
                    check();
                },
                mouseover: function () {newEl.addClass('over');},
                mouseout: function () {newEl.removeClass('over');}
            });
        }

        newEl.addEvents({
            click: check,
            mouseover: function () {newEl.addClass('over');},
            mouseout: function () {newEl.removeClass('over');}
        });

        el.setStyle('display', 'none');
	}
});

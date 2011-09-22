var FormStyle = new Class({
	initialize: function (form) {
		this.form = $(form);

		this.selects = this.form.getElements('select');

		this.runDOM();
	},

	runDOM: function () {
		this.runSelects();
	},

	runSelects: function () {
		var self = this;
		var zIndex = 200;
		this.selects.each(function (select) {
			zIndex--;
			var menuOpen = false;
			
			select.addClass('formStyle hide');

			var cont = new Element('span', {
				'class': 'fSs'+' id'+select.get('id'),
				id: select.get('id'),
				styles: {
					zIndex: zIndex
				},
				events: {
					click: function () {
						select.fireEvent((menuOpen) ? 'blur': 'focus');
					}
				}
			});

			var text = new Element('span', {
				text: select.getSelected().get('text')
			});

			text.inject(cont);

			var optList = new Element('ul', {styles: {display: 'none'}, 'class': 'fSsMenu'});
			optList.addEvents({
				mouseover: function (e) {
					e.target.addClass('hover');
				},
				mouseout: function (e) {
					e.target.removeClass('hover');
				}
			});

			select.getElements('option[class!=blankOpt]').each(function (option) {
				var li = new Element('li', {
					text: option.get('text'),
					events: {
						click: function () {
							var current = select.getElement('option.selected');
							if (current) {
								optList.getElement('.selected').removeClass('selected');
								current.removeClass('selected');
								current.set('selected', false);
							}

							option.set('selected', true);
							option.addClass('selected');
							li.addClass('selected');

							text.set('text', option.get('text'));
						}
					}
				}).inject(optList);
			});

			select.addEvents({
				'blur': function () {
					optList.setStyle('display', 'none');
					menuOpen = false;
				},
				'focus': function () {
					optList.setStyles({
						display: 'block'
					});
					menuOpen = true;
				}
			});

			optList.inject(cont, 'bottom');
			cont.inject(select, 'before');
		});
	},


	closeSelect: function () {

	}
});
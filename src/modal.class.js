var Modal = new Class({
	Implements: [Events, Options],

	options: {
		width: 100,
		height: 100,
		overlay: true
	},

	initialize: function (options) {
		this.setOptions(options);

		this.isOpen = false;

		this.DOM = {}; //Object to contain our dom elements
		this.FX = {};
		this.prepDOM();

		window.addEvent('scroll', this.resize.bind(this));
		window.addEvent('resize', this.resize.bind(this));

		window.addEvent('keydown', function (e) {
			if (this.isOpen) {
				if (e.key === 'esc') {
					this.close();		
				}
			}
		}.bind(this));
	},

	prepDOM: function () {
		this.DOM.overlay = new Element('div.modalOverlay');
		this.FX.overlay = new Fx.Morph(this.DOM.overlay, {duration: 250});

		this.DOM.modal = new Element('div.modalContainer');
		this.FX.modal = new Fx.Morph(this.DOM.modal, {duration: 250});
		this.DOM.content = new Element('div.modalContent');

		this.DOM.content.inject(this.DOM.modal);

		this.DOM.overlay.addEvent('click', this.close.bind(this));
	},

	resize: function () {
		var winScrollSize = window.getScrollSize(),
			winScroll = window.getScroll(),
			winSize = window.getSize(),
			width = this.options.width,
			height = this.DOM.content.getSize().y;

		this.DOM.overlay.setStyles({width: winScrollSize.x, height: winScrollSize.y});
		this.DOM.modal.setStyles({
			width: width,
			height: height,
			left: winSize.x/2 - width / 2,
			top: Math.floor((winSize.y/2 - height / 2) + winScroll.y)
		});
	},

	render: function () {
		var template = this.options.template.render();
		this.DOM.content.empty();
		template.inject(this.DOM.content);

		this.DOM.overlay.setStyle('display', 'none');
		this.DOM.modal.setStyles({left: -10000});

		this.DOM.overlay.inject(document.body, 'bottom');
		this.DOM.modal.inject(this.DOM.overlay, 'before');

		this.resize();
	},

	open: function () {
		this.render();
		this.DOM.overlay.setStyles({
			display: 'block',
			opacity: 0
		});

		this.DOM.modal.setStyle('opacity', 0);

		this.FX.overlay.start({
			opacity: 1
		}).chain(function () {
			this.FX.modal.start({opacity: 1});
		}.bind(this));

		this.isOpen = true;
	},

	close: function () {
		this.FX.modal.start({opacity: 0}).chain(function () {
			this.FX.overlay.start({
				opacity: 0
			}).chain(function () {
				this.DOM.overlay.dispose();
				this.DOM.modal.dispose();
				this.isOpen = false;
			}.bind(this));
		}.bind(this));
	}
});

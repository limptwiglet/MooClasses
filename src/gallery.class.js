var Gallery = new Class({
	Implements: [Options, Events],

	options: {
		auto: 4000, // Delay between automatic image switch, set to false to disable auto
		
		// Navigation options
		navText: true, // Injects text into navigation items
		showNext: true, // Show the next button
		showPrev: true, // Show the previous button
		
		loops: false,
		
		endJump: true, // If the end of the slide show is reach then jump back to start

		targEl: 'img',

		fx: {
			duration: 600,
			transition: Fx.Transitions.Expo.easeInOut
		}
	},

	initialize: function (cont, options) {
		this.setOptions(options);
		this.cont = cont;
		this.imgs = this.cont.getElements(this.options.targEl);

		this.current = 0;
		this.currentPos = 0;

		this.prepShow();
	},

	prepShow: function () {
		var that = this,
		o = that.options,
		loadCount = 0,
		innerWidth = 0;

		this.inner = new Element('div', {
			'class': 'inner',
			styles: {left: 0}
		});
		this.inner.inject(this.cont);

		this.innerFx = new Fx.Morph(this.inner, o.fx);
		
		if (o.showNext) {
			this.nextBtn = new Element('a', {
				href: '#',
				'class': 'next',
				text: o.navText ? 'Next' : ''
			}).inject(this.cont, 'top');
			this.nextBtn.addEvent('click', this.next.bind(this));
		}

		if (o.showPrev) {
			this.prevBtn = new Element('a', {
				href: '#',
				'class': 'prev',
				text: o.navText ? 'Previous' : ''
			}).inject(this.cont, 'top');
			this.prevBtn.addEvent('click', this.prev.bind(this));
		}

		this.imgs.each(function (img, i) {
			var tid = null;
			that.inner.grab(img);
			
			var handleLoad = function () {
				loadCount++;

				var imgSize = img.getSize();
				
				innerWidth+= imgSize.x;

				if (i === 0) {
					
				}

				if (loadCount === that.imgs.length) {
					that.inner.setStyle('width', innerWidth);

					if (that.options.auto) {
						that.setupAuto();
					}
				}
			};
			
			if (img.complete) {
				handleLoad();
			} else if (img.get('tag') === 'img') {
				img.addEvent('load', handleLoad);
			} else {
				handleLoad();
			}
		});

		this.checkNav();
	},

	// Setsup the auto slide show events and starts the timer going
	setupAuto: function() {
		var that = this;
		this.cont.addEvents({
			mouseover: function() {
				clearTimeout(that.tid);
			},

			mouseleave: function() {
				that.startAuto();
			}
		});

		this.startAuto();
	},

	// Starts the auto timer
	startAuto: function() {
		var that = this,
		dir = 1;
		clearTimeout(this.tid);

		this.tid = (function() {
			if (dir > 0) {
				if (that.current < that.imgs.length-1) {
					that.next();
				} else {
					if (that.options.endJump) {
						that.next();
					}
					dir = -1;
				}
			}

			if (dir < 0) {
				if (that.current > 0) {
					that.prev();
				} else {
					dir = 1;
				}
			}
		}).periodical(this.options.auto+this.options.fx.duration);
	},

	next: function () {
		if (!this.fxRunning && this.current < this.imgs.length-1) {
			var imgSize = this.imgs[this.current].getSize();
			this.currentPos+= imgSize.x;

			this.current++;
			this.move(-(this.currentPos));
		} else if (!this.fxRunning && this.options.endJump) {
			this.currentPos = 0;
			this.current = 0;
			this.move(this.currentPos);
		}
		return false;
	},

	prev: function () {
		if (!this.fxRunning && this.current !== 0) {
			var imgSize = this.imgs[this.current].getSize();
			this.currentPos-= imgSize.x;

			this.current--;
			this.move(-(this.currentPos));
		}
		return false;
	},

	move: function (pos) {
		this.fxRunning = true;
		this.innerFx.start({
			left: pos
		}).chain(function (){
			this.fxRunning = false;
		}.bind(this));

		this.checkNav();
	},


	checkNav: function () {
		if (this.nextBtn)
			this.nextBtn[((this.current >= this.imgs.length-1) ? 'add' : 'remove')+'Class']('hidden');
		
		if (this.prevBtn)
			this.prevBtn[(((this.current === 0)) ? 'add' : 'remove')+'Class']('hidden');
	}
});

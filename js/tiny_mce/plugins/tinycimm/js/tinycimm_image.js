/*
 *
 * image.js
 * Copyright (c) 2009 Richard Willis & Liam Gooding
 * MIT license  : http://www.opensource.org/licenses/mit-license.php
 * Project      : http://tinycimm.googlecode.com/
 * Contact      : willis.rh@gmail.com
 *
 */

function ImageDialog(){}
ImageDialog.prototype = new TinyCIMM('image');
ImageDialog.prototype.constructor = ImageDialog;

ImageDialog.prototype.getImage = function(imageid, callback) {
	this.get(imageid, callback);
};

ImageDialog.prototype.fileBrowser = function(folder, offset, load, el){
	if (typeof el == 'object') {
		tinyMCE.activeEditor.dom.select('img', el)[0].src = 'img/ajax-loader.gif';
	}
	this.getBrowser(folder, offset, load, function(){
		// bind hover event to thumbnail
		var thumb_images = tinyMCEPopup.dom.select('.thumb_wrapper');
		for(var image in thumb_images) {
			thumb_images[image].onmouseover = function(e){
				tinyMCE.activeEditor.dom.addClass(this, 'show');
				tinyMCE.activeEditor.dom.addClass(this, 'thumb_wrapper_over');
			}
			thumb_images[image].onmouseout = function(e){
				tinyMCE.activeEditor.dom.removeClass(this, 'show');
				tinyMCE.activeEditor.dom.removeClass(this, 'thumb_wrapper_over');
				tinyMCE.activeEditor.dom.addClass(this, 'thumb_wrapper');
			};
		}
	});
}

// inserts an image into the editor
ImageDialog.prototype.insertAndClose = function(image) {
	var ed = tinyMCEPopup.editor, f = document.forms[0], nl = f.elements, v, args = {}, el;

	tinyMCEPopup.restoreSelection();

	// Fixes crash in Safari
	(tinymce.isWebKit) && ed.getWin().focus();

	args = {
		src : this.baseURL(this.settings.tinycimm_assets_path+image.filename),
		alt : image.description,
		title : image.description
	};

	el = ed.selection.getNode();

	if (el && el.nodeName == 'IMG') {
		ed.dom.setAttribs(el, args);
	} else {
		ed.execCommand('mceInsertContent', false, '<img id="__mce_tmp" />', {skip_undo : 1});
		ed.dom.setAttribs('__mce_tmp', args);
		ed.dom.setAttrib('__mce_tmp', 'id', '');
		ed.undoManager.add();
	}

	tinyMCEPopup.close();
}
	
// either inserts the image into the image dialog, or into the editor	
ImageDialog.prototype.insertImage = function(thumbspan, imgsrc, alttext) {
	// show loading spinner and hide the controls
	tinyMCE.activeEditor.dom.addClass(thumbspan, 'showloader');
	var controls = tinyMCEPopup.dom.select('.controls, .controls-bg');
	for(var i in controls) { controls[i].style.display = 'none'; }

	var win = tinyMCEPopup.getWindowArg("window");
	var URL = this.baseURL(this.settings.tinycimm_assets_path+imgsrc);

	if (win != undefined) {
		// insert into image dialog
		win.document.getElementById(tinyMCEPopup.getWindowArg("input")).value = URL;
		if (typeof(win.ImageDialog) != "undefined") {
			if (win.ImageDialog.getImageData) {
				win.ImageDialog.getImageData();
			}
			if (win.ImageDialog.showPreviewImage) {
				win.ImageDialog.showPreviewImage(URL);
			}
			win.document.getElementById('alt').value = alttext;
		}
 		tinyMCEPopup.close();
	} else {
		// insert into editor
		this.insert(imgsrc.toId());
	}
	return;
}
	
	
ImageDialog.prototype.loadUploader = function() {
	// load the uploader form
	if (!tinyMCEPopup.dom.get('upload_target_ajax').src) {
		tinyMCEPopup.dom.get('upload_target_ajax').src = 'image_uploadform.htm';
	} 
	this.loadSelect();
	tinyMCEPopup.resizeToInnerSize();
};
	
// prepare the resizer panel
ImageDialog.prototype.loadresizer = function(imagesrc) {
	var path = /^http/.test(imagesrc) ? imagesrc : this.settings.tinycimm_assets_path+imagesrc;
	// reset the resizer
	tinyMCEPopup.dom.get('slider_img').src = '';
	tinyMCEPopup.dom.get('slider_img').width = tinyMCEPopup.dom.get('slider_img').height = '0';
	// ensure image is cached before loading the resizer
	this.loadImage(this.baseURL(path));
}

// pre-cache an image
ImageDialog.prototype.loadImage = function(img) { 
	var preImage = new Image(), _this = this;
	preImage.src = img;
	setTimeout(function(){
		_this.checkImgLoad(preImage);
	},10);	// ie
}

// show loading text if image not already cached
ImageDialog.prototype.checkImgLoad = function(preImage) {
	if (!preImage.complete) {
		mcTabs.displayTab('resize_tab','resize_panel');
		tinyMCEPopup.dom.setHTML('image-info-dimensions', '<img style="float:left;margin-right:4px" src="img/ajax-loader.gif"/> caching image..');
	}
	this.checkLoad(preImage);
}	

ImageDialog.prototype.checkLoad = function(preImage) {
	var _this = this;
	if (preImage.complete) { 
		this.showResizeImage(preImage);
		return;
	}
 	setTimeout(function(){
		_this.checkLoad(preImage)
	}, 10);
}
	
// show resizer image
ImageDialog.prototype.showResizeImage = function(preImage) {
	this.getImage(preImage.src.toId(), function(image){
		// load image 
		tinyMCEPopup.dom.get('slider_img').src = preImage.src;
		tinyMCEPopup.dom.get('slider_img').width = max_w = image.width; 
		tinyMCEPopup.dom.get('slider_img').height = max_h = image.height;
		// display panel
		mcTabs.displayTab('resize_tab','resize_panel');
		tinyMCEPopup.dom.get('resize_tab').style.display = 'block';
		// image dimensions overlay layer
		tinyMCEPopup.dom.setHTML('image-info-dimensions', '<span id="slider_width_val"></span> x <span id="slider_height_val"></span>');
			
		new ScrollSlider(tinyMCEPopup.dom.get('image-slider'), {
			min : 0,
			max : max_w,
			value : max_w,
			size : 400,
			scroll : function(new_w) {
				var slider_width = tinyMCEPopup.dom.get('slider_width_val'), slider_height = tinyMCEPopup.dom.get('slider_height_val');
				if (slider_width && slider_height) {
					slider_width.innerHTML = (tinyMCEPopup.dom.get('slider_img').width=new_w);
					slider_height.innerHTML = (tinyMCEPopup.dom.get('slider_img').height=Math.round((parseInt(new_w)/parseInt(max_w))*max_h))+'px';
				}
			}
		});
	});
}
	
ImageDialog.prototype.saveImgSize = function() {
	var width = tinyMCEPopup.dom.get('slider_img').width, height = tinyMCEPopup.dom.get('slider_img').height, _this = this;

	// show loading animation
	tinyMCEPopup.dom.get('saveimg').src = tinyMCEPopup.dom.get('saveimg').src.replace('save.gif', 'ajax-loader.gif');
		
	// prepare request url
	var imgsrc_arr = tinyMCEPopup.editor.documentBaseURI.toRelative(tinyMCEPopup.dom.get('slider_img').src).split('/');
	var requesturl = this.baseURL(this.settings.tinycimm_controller+'image/save_image_size/'+imgsrc_arr[imgsrc_arr.length-1].toId()+'/'+width+'/'+height+'/90');
	// send request
	tinymce.util.XHR.send({
		url : requesturl,
		error : function(response) {
			tinyMCEPopup.editor.windowManager.alert('There was an error processing the request: '+response+"\nPlease try again.");
			tinyMCEPopup.dom.get('saveimg').src = tinyMCEPopup.dom.get('saveimg').src.replace('ajax-loader.gif', 'save.gif');
		},
		success : function(response) {
			tinyMCEPopup.dom.get('saveimg').src = tinyMCEPopup.dom.get('saveimg').src.replace('ajax-loader.gif', 'save.gif');
			var obj = tinymce.util.JSON.parse(response);
			if (!obj.outcome) {
				tinyMCEPopup.editor.windowManager.alert(obj.message); 
			} else { 
				tinyMCEPopup.editor.windowManager.confirm(
				'Image size successfully saved.\n\n\nClick OK to insert image or cancel to return.', function(s) {
					if (!s) {
						_this.showBrowser();
						return false;
					}
					_this.insertImage(null, obj.filename, obj.description);
				});
			}
		}
	});
}

ImageDialog.prototype.deleteImage = function(imageid) {
	this.deleteAsset(imageid);
}	
	

var TinyCIMMImage = new ImageDialog();
tinyMCEPopup.onInit.add(TinyCIMMImage.init, TinyCIMMImage);
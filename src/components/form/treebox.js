import '../tree';

import BaseForm from './form-base';
import _ from '../../utils/util';
import Popper from 'popper.js/dist/umd/popper.js';
import { Log } from '../../libs/log';

class Treebox extends BaseForm {
  constructor(el, options) {
    super(el, options, Treebox.DEFAULTS);
    this.className = 'Treebox';
    this.randomString = _.randomString();
    this.derection = '';
    this.inited = false;
    this.titleVal = '';
    this._initForm();
  }
  _setTreebox(item, newVal, val) {
    let $input = this.$input,
      $treebox = this.$treebox,
      $tree = this.$tree,
      $placeholder = this.$placeholder,
      $dropdown = this.$dropdown,
      $treeValue = this.$treeValue,
      $clear = this.$clear;
    if (!$input) {
      let _input = this.create('input'),
        _treebox = this.create('div'),
        _tree = this.create('div'),
        _placeholder = this.create('div'),
        _tagArea = this.create('div'),
        _dropdown = this.create('div'),
        _treeValue = this.create('div'),
        _treeIcon = this.create('i'),
        _clear = this.create('i'),
        _ul = this.create('ul'),
        _loading = this.create('div'),
        _loadingIcon = this.create('i');
      $input = $(_input);
      $treebox = $(_treebox);
      $tree = $(_tree);
      $placeholder = $(_placeholder);
      $dropdown = $(_dropdown);
      $treeValue = $(_treeValue);
      let $loading = $(_loading);
      let $treeUl = $(_ul);
      let $treeIcon = $(_treeIcon);
      let $tagArea = $(_tagArea);
      $clear = $(_clear);
      $input.attr('type','hidden');
      $placeholder.addClass('si-placeholder');
      $treeValue.addClass('si-treebox-value').hide();
      $treeIcon.addClass(`${this.lastOptions.icon} si-form-control-icon`);
      $clear.addClass(`${this.lastOptions.clearIcon} si-form-control-icon`);
      $tree.addClass('form-control si-treebox-tree has-icon-right').append(_treeValue).append(_placeholder).append(_treeIcon).append(_clear);
      $treeUl.addClass('ztree').attr('id',this.randomString);
      $(_loadingIcon).addClass(`${this.lastOptions.loadingIcon}`);
      $loading.addClass('si-treebox-loading').append(_loadingIcon).append('<br>').append('加载中...');
      $dropdown.addClass('si-dropdown si-treebox-dropdown').hide().append(_ul).append(_loading);
      $tagArea.addClass('si-tagarea').hide();
      $tree.append(_tagArea);
      $treebox.addClass('si-treebox').append(_input).append(_tree);
      if(this.lastOptions.transfer){
        $dropdown.addClass('si-dropdown-transfer');
        $('body').append(_dropdown);
      }else{
        $treebox.append(_dropdown);
      }
      this.$formBlock.append(_treebox);
      this.$input = $input;
      this.$treebox = $treebox,
      this.$tree = $tree,
      this.$placeholder = $placeholder,
      this.$tagArea = $tagArea,
      this.$dropdown = $dropdown,
      this.$treeValue = $treeValue,
      this.$clear = $clear;
      this.$treeUl = $treeUl;
      this.$loading = $loading;
      this._initEvent();
    }
    switch (item) {
      case 'id':
      case 'name':
        $input.attr(item, newVal);
        break;
      case 'placeholder':
        $placeholder.text(newVal);
        break;
      case 'readonly':
        this._setReadonly(newVal);
        break;
      case 'disabled':
        this._setDisabled(newVal);
        break;
      case 'data':
        this._initTree();
        break;
      case 'value':
        this._setValue(newVal,val);
        break;
      case 'width':
        $tree.css('width', newVal);
        break;
      case 'expandAll':
        this._toogleExpand(newVal);
        break;
    }
  }
  _initEvent(){
    let op = this.options;
    this._addEvent();
    this.$clear.on('click', (e) => {
      op.value = '';
      document.all ? e.cancelBubble=true : e.stopPropagation();
    });
    this.$dropdown.on('click',(e)=>{
      document.all ? e.cancelBubble=true : e.stopPropagation();
    });
  }
  _addEvent(){
    $(document).on(`click.si.treebox.${this.randomString}`, this._close.bind(this));
    this.$tree.on('click.si.treebox', this._toogle.bind(this));
  }
  _removeEvent(){
    $(document).off(`click.si.treebox.${this.randomString}`);
    this.$tree.off('click.si.treebox');
  }
  _initPopper() {
    if (this.popper) {
      this.popper.update();
    } else {
      this.popper = new Popper(this.$tree, this.$dropdown, {
        modifiers: {
          computeStyle:{
            gpuAcceleration: false
          },
          preventOverflow :{
            boundariesElement: 'window'
          }
        },
        onCreate: () => {
          this.derection = this.popper.popper.getAttribute('x-placement');
        },
        onUpdate: () => {
          if (!this.popper) return;
          this.derection = this.popper.popper.getAttribute('x-placement');
        }
      });
    }
  }
  _toogle(){
    if (this.opened) {
      setTimeout(() => {
        this._close();
      });
    } else {
      setTimeout(() => {
        this._open();
      });
    }
  }
  _initTree(){
    let op = this.options, setting = {
      method: 'post',
      chkStyle:'',
      chkboxType:'',
      valueField:'',
      idField: '',
      pIdField: '',
      pIdValue: '',
      expandAll: false,
      data: null,
      callback: {}
    };
    if(this.inited){
      this.$treeUl.tree('destroy');
      this.inited = false;
    }
    this.$loading.hide();
    Object.keys(setting).forEach((currentValue)=>{
      if(op.hasOwnProperty(currentValue)){
        setting[currentValue] = op[currentValue];
      }
    });
    if(op.chkStyle){
      Object.assign(setting.callback,{
        beforeClick: this._beforeClick.bind(this),
        onCheck: this._onCheck.bind(this)
      });
    }else{
      Object.assign(setting.callback,{
        beforeClick: this._beforeSingleClick.bind(this)
      });
    }
    this.$treeUl.tree(setting);
    this.inited = true;
    op.value&&this._setValue(op.value);
    this._toogleExpand(op.expandAll);
  }
  _setValue(newVal,val){
    let op = this.options;
    if(this.inited && !this.dataReloading){
      let $treeValue = this.$treeValue,
        $placeholder = this.$placeholder,
        $tree = this.$tree,
        $tagArea = this.$tagArea;
      newVal = this.$treeUl.tree('load',newVal);
      this.titleVal = this.$treeUl.tree('getTitle', String(newVal));
      if (op.chkStyle) {
        let nva = newVal !== '' ? String(newVal).split(',') : [],
          va = val && val !== '' ? String(val).split(',') : [];
        let titleArr = this.titleVal ? this.titleVal.split(',') : [];
        let arr1 = _.compare(nva, va);
        let arr2 = _.compare(va, nva);
        if (this.titleVal && val === '') {
          this._addTagEvent();
        }
        //未找到节点，作空处理
        this.titleVal&&$placeholder.hide()&&$tagArea.show();
        arr1.forEach((key) => {
          this._addTag(key, titleArr[nva.findIndex(k=>k===key)]);
        });
        arr2.forEach(key => {
          if(!this.tagsDom[key])return true;
          this.tagsDom[key].remove();
          delete this.tagsDom[key];
        });
        !newVal&&$tagArea.hide()&&$placeholder.show()&&op.clearable&&val!==''&&$tree.removeClass('si-show-clear')&&this._removeTagEvent();
        op.clearable&&val===''&&$tree.addClass('si-show-clear');
      }else{
        if(this.titleVal===''){
          //未找到节点，作空处理
          $treeValue.text('').hide();
          $placeholder.show();
          op.clearable&&val!==''&&$tree.removeClass('si-show-clear');
        }else{
          $placeholder.hide();
          $treeValue.text(this.titleVal).show();
          op.clearable&&val===''&&$tree.addClass('si-show-clear');
        }
      }
    }
    
    val!==undefined && this.$input.val(newVal);
    if (this.firstVal) {
      this.firstVal = false;
    } else {
      try {
        val!==undefined && this.$input.trigger('valid.change').trigger('change');
      } catch (error) {
        Log.error(error);
      }
    }
  }
  _toogleExpand(newVal){
    this.inited&&this.$treeUl.tree('expandAll',newVal);
  }
  _setReadonly(val){
    val&&this.$treebox.addClass('si-form-readonly')&&this._removeEvent();
    !val&&this.$treebox.removeClass('si-form-readonly')&&this._addEvent();
  }
  _setDisabled(val){
    val&&this.$treebox.addClass('si-form-disabled')&&this._removeEvent();
    !val&&this.$treebox.removeClass('si-form-disabled')&&this._addEvent();
  }
  _beforeClick(treeId, treeNode){
    this.$treeUl.tree('checkNode',treeNode, !treeNode.checked,true, true);
    return false;
  }
  _onCheck(){
    let obj = this.$treeUl.tree('data');
    this.options.value = obj.value;
  }
  _beforeSingleClick(treeId, treeNode){
    let nodes = this.$treeUl.tree('getSelected'),op = this.options;
    if(nodes.length>0 && nodes[0][op.idField]===treeNode[op.idField]){
      this.$treeUl.tree('cancelSelectedNode',treeNode);
      this.titleVal = '';
      op.value = '';
    }else{
      this.$treeUl.tree('selectNode',treeNode);
      this.titleVal = treeNode[op.valueField];
      setTimeout(()=>{
        op.value = treeNode[op.idField];
      });
    }
    return false;
  }
  _addTag(val, text) {
    this.tagsDom = this.tagsDom || {};
    let _tag = document.createElement('div');
    let _tagText = document.createElement('span');
    let _tagClose = document.createElement('i');
    $(_tagClose).addClass('fa fa-close si-tag-close').data('tag.value', val);
    $(_tagText).addClass('si-tag-text').text(text);
    let $tag = $(_tag);
    $tag.addClass('si-tag si-tag-checked').append(_tagText).append(_tagClose);
    this.$tagArea.append(_tag);
    this.tagsDom[val] = $tag;
  }
  _addTagEvent() {
    let op = this.options;
    this.$tagArea.on('click', '.si-tag-close', function(e) {
      let val = $(this).data('tag.value');
      let valueArr = op.value.split(',');
      for (let i = 0, len = valueArr.length; i < len; i++) {
        if (valueArr[i] === val) {
          valueArr.splice(i, 1);
          break;
        }
      }
      op.value = valueArr.join(',');
      document.all ? e.cancelBubble=true : e.stopPropagation();
    });
  }
  _removeTagEvent() {
    this.$tagArea.off('click');
  }
  _open(){
    if (this.opened) return;
    if(!this.inited){
      this._initTree();
    }
    this.opened = true;
    let $treebox = this.$treebox,
      $dropdown = this.$dropdown,
      $tree = this.$tree;
    $treebox.addClass('si-treebox-visible');
    $dropdown.width($tree.outerWidth());
    this._initPopper();
    let className = this.derection === 'top'? 'slide-up-in' : 'slide-down-in';
    $dropdown.show().addClass(className);
    setTimeout(() => {
      $dropdown.removeClass(className);
    }, Number.parseFloat($dropdown.css('animation-duration')) * 1000);
  }
  _close(){
    if (!this.opened) return;
    this.opened = false;
    let $treebox = this.$treebox,
      $dropdown = this.$dropdown;
    $treebox.removeClass('si-treebox-visible');
    let className = this.derection === 'top'? 'slide-up-out' : 'slide-down-out';
    $dropdown.addClass(className);
    setTimeout(() => {
      $dropdown.hide().removeClass(className);
    }, Number.parseFloat($dropdown.css('animation-duration')) * 1000);
  }
  getKey(){
    return this.titleVal;
  }
  getData() {
    return this.options.data;
  }
  getTree(){
    return this.$treeUl;
  }
  refresh(){
    let op = this.options;
    this._getDataByUrl(op.url,{},re=>{
      op.data = op.dataField?re[op.dataField]:re;
    });
  }
  destroy(){
    this._removeEvent();
    this.$treeUl.tree('destroy');
    this.options.transfer&&this.$dropdown.remove();
    this.popper && this.popper.destroy();
  }
}

function Plugin(option) {
  try {
    let value, args = Array.prototype.slice.call(arguments, 1);
    
    this.each(function(){
      let $this = $(this),
        dataSet = $this.data(),
        data = dataSet['si.treebox'];
        
      if (typeof option === 'string') {
        if (!data) {
          return;
        }
        value = data[option].apply(data, args);
        if (option === 'destroy') {
          $this.removeData('si.treebox');
        }
      }
      if(typeof option === 'object'&& data){
        data.set(option);
      }
      if (!data) {
        let options = $.extend( {} , Treebox.DEFAULTS, typeof option === 'object' && option);
        let datakeys = Object.keys(dataSet);
        let defaultkeys = Object.keys(options);
        defaultkeys.forEach((key) => {
          let lowkey = key.toLocaleLowerCase();
          if (datakeys.includes(lowkey)) {
            options[key] = dataSet[lowkey];
          }
        });
        data = new Treebox(this, options);
        data.$input.data('si.treebox', data);
      }
    });
    return typeof value === 'undefined' ? this : value;
  } catch (error) {
    throw new Error(error);
  }
}

Treebox.DEFAULTS = {
  multiline: false,
  hasSurface: false,
  label: '',
  id: '',
  name: '',
  labelWidth: '',
  inputWidth: '',
  labelAlign: 'right',
  readonly: false,
  disabled: false,
  value: '',
  clearable: false,
  placeholder: '',
  size: '',
  helpText: '',
  width: '',
  valid: false,
  icon:'fa fa-code-fork fa-fw',
  clearIcon:'fa fa-times-circle fa-fw',
  loadingIcon: 'fa fa-spinner fa-fw fa-pulse',
  method:'get',
  chkStyle:'',
  chkboxType:'',
  valueField:'listname',
  idField: 'id',
  pIdField: 'parentid',
  pIdValue: -1,
  expandAll: false,
  data: null,
  dataField: null,
  url :'',
  transfer: false
};

let old = $.fn.treebox;

$.fn.treebox = Plugin;
$.fn.treebox.defaults = Treebox.DEFAULTS;
$.fn.treebox.Constructor = Treebox;

$.fn.treebox.noConflict = function() {
  $.fn.treebox = old;
  return this;
};
/**
 *  jQuery Plugin textgrad, version 0.1
 *  (c) 2007 Guillaume Andrieu, sub-tenante@gmail.com (remove hyphen)
 *  http://github.com/subtenante/TextGrad
 *  Licensed GPL licenses:
 *   http://www.gnu.org/licenses/gpl.html
 *
 * v0.1:
 *  Compatible with jQuery 1.4.2 thanks to alexn's fix.
 */
(function($){

/**
 * SPANIZE routine
 */
$.spanizeText = function(obj,spanClass,maxGroup){
  var text=$(obj).html();
  var res = "";
  var tag="";
  var spanlength=1;
  var reg = new RegExp ("^([^\\s<&]|&[a-z]*;){1,"+maxGroup+"}");
  while (text.length>0){
    if (tag=text.match(/^(\s|(<[^>]*>))+\s*/)){
      if (tag.length>0){
      text = text.substr(tag[0].length);
      res+=tag[0];}}
    if (tag=text.match(reg)){spanlength=tag[0].length;}
    else spanlength=1;
    res+="<span"+(spanClass==''?'':' class="'+spanClass+'"')+">"+text.substring(0,spanlength)+"</span>";
    text=text.substring(spanlength);
  }
  $(obj).html(res);
};

/**
 * spanize jquery function
 */
$.fn.spanize = function(spanClass,maxGroup){
  $(this).each(function(){$.spanizeText(this,spanClass,maxGroup);});
};

/**
 * UNSPANIZE routine
 */
$.unspanize = function(obj,spanClass){
  var text=$(obj).html();
  var reg = new RegExp ("<(?:span|SPAN)[^>]*"+(spanClass==''?'':' class=(?:"|\')?'+spanClass+'(?:"|\')?')+">([^<\\s]+)</(?:span|SPAN)>",'g');
  text=text.replace(reg,"$1");
  //alert($(obj).html()+"\n\n"+text);
  $(obj).html(text);
};

/**
 * unspanize jquery function
 */
$.fn.unspanize = function(spanClass){
  $(this).each(function(){$.unspanize(this,spanClass);});
}



$.str2color = function(str){
  if (str && str.constructor == Array && str.length == 3) return str;
  var res;
  if (str.match(/rgb\([0-9]{1,3},[0-9]{1,3},[0-9]{1,3}\)/)){
    str.replace("rgb(","");str.replace(")","");
    res=str.split(",");
    for(i=0;i<3;i++){if (res[i]>255) res[i]=255;}
    return res;}
  else if (str.match(/#?[0-9a-fA-F]{6}/)){
    if (str.length==7) str=str.substring(1);
    res = [parseInt(str.substring(0,2),16),
           parseInt(str.substring(2,4),16),
           parseInt(str.substring(4,6),16)];}
  else if(str.match(/#?[0-9a-fA-F]{3}/)){
    if (str.length==4) str=str.substring(1);
    res =  [parseInt(str.substring(0,1)+str.substring(0,1),16),
            parseInt(str.substring(1,2)+str.substring(1,2),16),
            parseInt(str.substring(2,3)+str.substring(2,3),16)];}
  else res = [0,0,0];
  return res;};

/**
 * DEFAULTS for textgrad
 */
$.textGrad = {};
$.textGrad.defaults = {
debut:'F00',
fin:'0FF',
maxGroup:3,
type:'',
spanClass:''
};

/**
 * textgrad jquery function
 */
$.fn.textgrad=function(settings){

  //+++++ FUNCTIONS
  var abspos = function(jobj){
    var curleft = 0;
    var curtop = 0;
    if (jobj.offsetParent) {
      curleft += jobj.offsetLeft;
      curtop += jobj.offsetTop;
      var obj=jobj;
      while (obj = obj.offsetParent) {
        curleft += obj.offsetLeft;
        curtop += obj.offsetTop;}}
    return [curleft,curtop];};

  var pos = function(jobj){
    var res=abspos(jobj);
    return [res[0]-0.5*jobj.offsetWidth,res[1]+0.5*jobj.offsetHeight];};

  var boxpos = function(jobj){
    var tpos = abspos(jobj);
    $(jobj).prepend('<span class="test">p</span>');
    var res = [tpos[0]+0.5*$('span.test',jobj).get(0).offsetWidth,
    tpos[1]+0.5*$('span.test',jobj).get(0).offsetHeight,
    jobj.offsetWidth-0.5*$('span.test',jobj).get(0).offsetWidth,
    jobj.offsetHeight-0.5*$('span.test',jobj).get(0).offsetHeight];
    // thanks to alexn
    $('span.test:lt(1)',jobj).remove();
    return res;};

  var spandim = function(span){
    var tpos = pos(span);
    var res = [tpos[0],tpos[1],0.5*span.offsetWidth,0.5*span.offsetHeight];
    return res;};

  var pickingrad = function(point){
    if (grad.length==0) return [0,0,0];
    if (grad.length==1) return grad[0]['col'];

    point=100*point;
    if (point<=grad[0]['pc']) {
      //alert(point+" "+grad[0]['col']);
      return grad[0]['col'];}
    if (point>=grad[grad.length-1]['pc']) {
      //alert(point+" "+grad[0]['col']);
      return grad[grad.length-1]['col'];}

    var mins=0;var maxs=100;var minc=[0,0,0];var maxc=[0,0,0];
    var i=0;
    while(point>=grad[i]['pc'] && i<grad.length){mins=grad[i]['pc'];minc=grad[i]['col'];i++;}
    i=grad.length-1;
    while(point<=grad[i]['pc'] && i>=0){maxs=grad[i]['pc'];maxc=grad[i]['col'];i--;}
    var res=[0,0,0];
    var mult = (point-mins)/(maxs-mins);
    for(i=0;i<3;i++){res[i]=minc[i]+(maxc[i]-minc[i])*mult;}
    //alert(minc+"\n"+maxc+"\n"+point+"\n"+mult+"\n"+res);
    return res;
  };

  var getcolor = function(span,bp){
    var sp=spandim(span);
    var res=[0,0,0];
    if (type=='|'){
      var delta=(sp[1]-bp[1])/bp[3];
    }
    else if (type=='o'){
      Cx=bp[0]+bp[2]/2;Cy=bp[1]+bp[3]/2;
      r=Math.sqrt((Cx-sp[0])*(Cx-sp[0])+(Cy-sp[1])*(Cy-sp[1]));
      R=Math.sqrt((bp[2])*(bp[2])/4+(bp[3])*(bp[3])/4);
      var delta =r/R;
    }
    else if (type=='_' || 2.5*sp[3]>bp[3]){
      var delta=(sp[0]-bp[0])/bp[2];
    }
    else if (type=='/'){
      multx=(sp[0]-bp[0])/bp[2];
      multy=(bp[3]-sp[1]+bp[1])/bp[3];
      var delta = (multx+multy)/2;
    }
    else{
      multx=(sp[0]-bp[0])/bp[2];
      multy=(sp[1]-bp[1])/bp[3];
      var delta = (multx+multy)/2;
    }
    var res = pickingrad(delta);
    res = "rgb("+Math.round(res[0])+","+Math.round(res[1])+","+Math.round(res[2])+")";
    //alert(sp+"\n"+bp+"\n"+$(span).text()+"\n"+res);
    return res;
  };

  var treatgrad=function(){
    for(i=0;i<opt['colgrad'].length;i++){
      opt['colgrad'][i]['col']=$.str2color(opt['colgrad'][i]['col']);}
    return opt['colgrad'];
  };
  //----- FUNCTIONS

  //+++++ PARAMS
  var opt = settings||{};
  var d = $.textGrad.defaults;
  var coldeb=$.str2color(opt['debut']||opt['begin']||d['debut']);
  var colfin=$.str2color(opt['fin']||opt['end']||d['fin']);
  var grad=opt['colgrad']?treatgrad():[{pc:0,col:coldeb},{pc:100,col:colfin}];
  var maxGroup = opt['maxGroup']||d['maxGroup'];
  var type = opt['type']||d['type'];
  var spanize = opt['spanize']||1;
  var spanClass = opt['spanClass']||d['spanClass'];
  //----- PARAMS

  $(this).each(function(){

    if (spanize>0) $.spanizeText(this,spanClass,maxGroup);

    var blockpos=boxpos(this);

    $("span"+(spanClass==''?'':'.'+spanClass),this).each(function(){$(this).css('color',getcolor(this,blockpos))});

    if (opt['cb'] && opt['cb'].constructor == Function) opt['cb'].call(this);

  });//EO $(this).each(...);
};//EO $.fn.textgrad

/**
 * textscan jquery function
 */
$.fn.textscan = function(settings){

  var opt = settings||{};
  var initColor = $.str2color(opt['initColor']||"000");
  var endColor  = $.str2color(opt['endColor']||"F00");
  var transColor= $.str2color(opt['transColor']||"FFF");
  var spcl = opt['spanClass']||'animgradsp';
  var direction = opt['direction']||'->';
  var mg = opt['maxGroup']||2;
  var spnz = opt['spanize']||1;
  var unspnz = opt['unspanize']||1;
  var amplitude = opt['amplitude']||20;
  var step = opt['step']||5;

  $(this).each(function(){
    var timer;
    var steps = 100+2*amplitude;
    var currStep=(direction=='->'?0:100);
    var grad;
    var obj=this;
    $(this).textgrad({spanize:spnz,maxGroup:mg,spanClass:spcl,debut:initColor,fin:initColor});
    timer = window.setInterval(function() {
      if(direction=='->'){
      currStep+=step;
      grad=[{pc:currStep-2*amplitude,col:endColor}
           ,{pc:currStep-amplitude,col:transColor}
           ,{pc:currStep,col:initColor}];}
      else{
      currStep-=step;
      grad=[{pc:currStep,col:initColor}
           ,{pc:currStep+amplitude,col:transColor}
           ,{pc:currStep+2*amplitude,col:endColor}];}
      $(obj).textgrad({spanize:-1,spanClass:spcl,colgrad:grad});
      // End the process
      if (currStep >= steps+1 || currStep<=-2*amplitude-1) {
        if (unspnz>0){
          $.unspanize(obj,spcl);}
        window.clearInterval(timer);timer=null;
        if (opt['cb'] && opt['cb'].constructor == Function) opt['cb'].call(obj);
      }
    },50);
  });//EO each
};//EO textscan*/


/*EOP*/
})(jQuery);

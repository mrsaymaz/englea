/* The deployed runner is entered through the authenticated tally results view. */
(function(root){
  'use strict';
  let bridge=null,context=null;
  try{if(root.parent!==root){bridge=root.parent.LeagueIslandRun;context=bridge?.connect(root)||null;}}catch{}
  if(context)document.documentElement.classList.add('tally-runner-connected');
  root.RunnerHost=Object.freeze({context:context?Object.freeze(context):null,
    studio(options){if(context)try{return bridge.studioFrom?.(root,context.token,options)||false;}catch{}return false;},
    progress(value){if(context)try{bridge.progressFrom(root,context.token,value);}catch{}},
    report(state){if(context)try{bridge.report(root,context.token,state);}catch{}},
    // v9.3.0: answer log, review list and the listening/picture switches live on the board page.
    answers(rows){if(context)try{return bridge.answersFrom?.(root,context.token,rows)||0;}catch{}return 0;},
    review(grade){if(context)try{return bridge.reviewFor?.(root,context.token,grade)||[];}catch{}return [];},
    clearReview(){if(context)try{return bridge.clearReviewFrom?.(root,context.token)||false;}catch{}return false;},
    options(){if(context)try{return bridge.optionsFor?.(root,context.token)||null;}catch{}return null;},
    setOptions(value){if(context)try{return bridge.optionsFrom?.(root,context.token,value)||null;}catch{}return null;},
    back(){if(context)try{bridge.returnFrom(root,context.token);}catch{}},
    async fullscreen(){
      if(!context)return;
      const doc=root.parent.document;
      if(doc.fullscreenElement)await doc.exitFullscreen();else await doc.documentElement.requestFullscreen?.();
    }
  });
})(window);

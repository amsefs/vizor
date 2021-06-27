import twitter from 'twitter-text';
import PDFJSAnnotate from '../';
import initColorPicker from './shared/initColorPicker';

const { UI } = PDFJSAnnotate;
const documentId = 'example.pdf';
let PAGE_HEIGHT;
let RENDER_OPTIONS = {
  documentId,
  pdfDocument: null,
  scale: parseFloat(localStorage.getItem(`${documentId}/scale`), 10) || 1.33,
  rotate: parseInt(localStorage.getItem(`${documentId}/rotate`), 10) || 0,
  seeComments: true
};

PDFJSAnnotate.setStoreAdapter(new PDFJSAnnotate.LocalStoreAdapter());
PDFJS.workerSrc = './shared/pdf.worker.js';

// Render stuff
let renderedPages = [];
let okToRender = false;
var pageactual = 1;
let NUM_PAGES = 0;
document.getElementById('content-wrapper').addEventListener('scroll', function (e) {
  let visiblePageNum = Math.round(e.target.scrollTop / PAGE_HEIGHT) + 1;
  pageactual = visiblePageNum;
  let visiblePage = document.querySelector(`.page[data-page-number="${visiblePageNum}"][data-loaded="false"]`);
  if (renderedPages.indexOf(visiblePageNum) === -1) {
    okToRender = true;
    renderedPages.push(visiblePageNum);
  }
  else {
    okToRender = false;
  }
  if (visiblePage && okToRender) {
    //setTimeout(function () {
    UI.renderPage(visiblePageNum, RENDER_OPTIONS);
    //});
  }
});


function obtTodasAnotaciones(documentId) {
  let todasAnotaciones = JSON.parse(localStorage.getItem(`${documentId}/annotations`)) || [];

  let filtrarSoloAnnotations = todasAnotaciones.filter((i) => {
    return i.class === 'Annotation' //&& i.type === 'point'
  });
  let index = -1;
  let arrayAnotionsClassPoint = [];
  for (let i = 0, l = filtrarSoloAnnotations.length; i < l; i++) {

    let filtrarCommentsDeAnnotations = todasAnotaciones.filter((j) => {
      return j.annotation === filtrarSoloAnnotations[i].uuid && j.class === 'Comment';
    });
    if (filtrarCommentsDeAnnotations.length > 0) {
      console.log("posicio:" + i + "::");
      console.log("longitud::" + filtrarCommentsDeAnnotations.length);
      console.log(filtrarCommentsDeAnnotations[filtrarCommentsDeAnnotations.length - 1].content);
      let objComment = {
        comment: filtrarCommentsDeAnnotations[filtrarCommentsDeAnnotations.length - 1].content,
        page: filtrarSoloAnnotations[i].page,
        posx: filtrarSoloAnnotations[i].x,
        posy: filtrarSoloAnnotations[i].y,
      };
      arrayAnotionsClassPoint.push(objComment);
    }
  }
  return arrayAnotionsClassPoint;
}


// List all annotations in the document
function listAnnotations() {
  console.log("Ingresando a funcion listAnnotations");
  //let annotations = JSON.parse(localStorage.getItem(`${RENDER_OPTIONS.documentId}/annotations`)) || [];
  let commentList = document.querySelector('#comment-wrapper .comment-list-container');
  commentList.innerHTML = '';
  /*function groupComments(comments) {
    let result = [];
    comments.map(item => {
      if (item.type) {
        let pibote = item;
        pibote.content = '';
        comments.map(itemComent => {
          if (itemComent.annotation && itemComent.class == 'Comment' && itemComent.annotation == pibote.uuid) {
            pibote.content = pibote.content + ' ' + itemComent.content;
          }
        });
        result.push(pibote);
      }
    });
    return result;
  }*/

  /*function goToPage(x, y, pageNumber) { // e?
    console.log('sata', x, y, pageNumber)
    if (pageNumber && pageNumber > 0) {
      // render2(pageNumber, x, y);
      showPage(pageNumber);
    }
  }*/

  function insertCommentWithLink(comment) {
    let child = document.createElement('div');
    child.className = 'comment-list-item';
    // child.innerHTML = twitter.autoLink(twitter.htmlEscape(comment.content || ''));
    // child.addEventListener('click', function() { goToPage(comment.x || '0', comment.y || '0', comment.page || '0') }); //        //saltar);

    var createA = document.createElement('a');
    var createAText = document.createTextNode(comment.comment);
    //var createAText = document.createTextNode(comment.content);
    createA.setAttribute('href', "#pageContainer" + comment.page);
    createA.appendChild(createAText);
    child.appendChild(createA);

    commentList.appendChild(child);
  }

  //let sortedComments = groupComments(annotations);
  let sortedComments = obtTodasAnotaciones(documentId)
  console.log(sortedComments);

  //let nested = document.querySelector(".comment-list-container");
  //nested.innerHTML = '';
  sortedComments.map(elem => {
    // annotations.map(elem => {
    //console.log('elem ', elem)
    return insertCommentWithLink(elem)
  })
}

function render() {

  listAnnotations()

  PDFJS.getDocument(RENDER_OPTIONS.documentId).then((pdf) => {
    RENDER_OPTIONS.pdfDocument = pdf;

    let viewer = document.getElementById('viewer');
    viewer.innerHTML = '';
    NUM_PAGES = pdf.pdfInfo.numPages;
    for (let i = 0; i < NUM_PAGES; i++) {
      let page = UI.createPage(i + 1);
      viewer.appendChild(page);
    }

    UI.renderPage(1, RENDER_OPTIONS).then(([pdfPage, annotations]) => {
      let viewport = pdfPage.getViewport(RENDER_OPTIONS.scale, RENDER_OPTIONS.rotate);
      PAGE_HEIGHT = viewport.height;
    });
  });



}
render();



// Text stuff
(function () {
  let textSize;
  let textColor;

  function initText() {
    let size = document.querySelector('.toolbar .text-size');
    [8, 9, 10, 11, 12, 14, 18, 24].forEach((s) => {
      size.appendChild(new Option(s, s));
    });

    setText(
      localStorage.getItem(`${RENDER_OPTIONS.documentId}/text/size`) || 10,
      localStorage.getItem(`${RENDER_OPTIONS.documentId}/text/color`) || '#000000'
    );

    initColorPicker(document.querySelector('.text-color'), textColor, function (value) {
      setText(textSize, value);
    });
  }

  function setText(size, color) {
    let modified = false;

    if (textSize !== size) {
      modified = true;
      textSize = size;
      localStorage.setItem(`${RENDER_OPTIONS.documentId}/text/size`, textSize);
      document.querySelector('.toolbar .text-size').value = textSize;
    }

    if (textColor !== color) {
      modified = true;
      textColor = color;
      localStorage.setItem(`${RENDER_OPTIONS.documentId}/text/color`, textColor);

      let selected = document.querySelector('.toolbar .text-color.color-selected');
      if (selected) {
        selected.classList.remove('color-selected');
        selected.removeAttribute('aria-selected');
      }

      selected = document.querySelector(`.toolbar .text-color[data-color="${color}"]`);
      if (selected) {
        selected.classList.add('color-selected');
        selected.setAttribute('aria-selected', true);
      }

    }

    if (modified) {
      UI.setText(textSize, textColor);
    }
  }

  function handleTextSizeChange(e) {
    setText(e.target.value, textColor);
  }

  document.querySelector('.toolbar .text-size').addEventListener('change', handleTextSizeChange);

  initText();
})();

// Pen stuff
(function () {
  let penSize;
  let penColor;

  function initPen() {
    let size = document.querySelector('.toolbar .pen-size');
    for (let i = 0; i < 0; i++) {
      size.appendChild(new Option(i + 1, i + 1));
    }

    setPen(
      localStorage.getItem(`${RENDER_OPTIONS.documentId}/pen/size`) || 1,
      localStorage.getItem(`${RENDER_OPTIONS.documentId}/pen/color`) || '#000000'
    );

    initColorPicker(document.querySelector('.pen-color'), penColor, function (value) {
      setPen(penSize, value);
    });
  }

  function setPen(size, color) {
    let modified = false;

    if (penSize !== size) {
      modified = true;
      penSize = size;
      localStorage.setItem(`${RENDER_OPTIONS.documentId}/pen/size`, penSize);
      document.querySelector('.toolbar .pen-size').value = penSize;
    }

    if (penColor !== color) {
      modified = true;
      penColor = color;
      localStorage.setItem(`${RENDER_OPTIONS.documentId}/pen/color`, penColor);

      let selected = document.querySelector('.toolbar .pen-color.color-selected');
      if (selected) {
        selected.classList.remove('color-selected');
        selected.removeAttribute('aria-selected');
      }

      selected = document.querySelector(`.toolbar .pen-color[data-color="${color}"]`);
      if (selected) {
        selected.classList.add('color-selected');
        selected.setAttribute('aria-selected', true);
      }
    }

    if (modified) {
      UI.setPen(penSize, penColor);
    }
  }

  function handlePenSizeChange(e) {
    setPen(e.target.value, penColor);
  }

  document.querySelector('.toolbar .pen-size').addEventListener('change', handlePenSizeChange);

  initPen();
})();

// Toolbar buttons
(function () {
  let tooltype = localStorage.getItem(`${RENDER_OPTIONS.documentId}/tooltype`) || 'cursor';
  if (tooltype) {
    setActiveToolbarItem(tooltype, document.querySelector(`.toolbar button[data-tooltype=${tooltype}]`));
  }

  function setActiveToolbarItem(type, button) {
    let active = document.querySelector('.toolbar button.active');
    if (active) {
      active.classList.remove('active');

      switch (tooltype) {
        case 'cursor':
          UI.disableEdit();
          break;
        case 'draw':
          UI.disablePen();
          break;
        case 'text':
          UI.disableText();
          break;
        case 'point':
          UI.disablePoint();
          break;
        case 'area':
        case 'highlight':
        case 'strikeout':
          UI.disableRect();
          break;
      }
    }

    if (button) {
      button.classList.add('active');
    }
    if (tooltype !== type) {
      localStorage.setItem(`${RENDER_OPTIONS.documentId}/tooltype`, type);
    }
    tooltype = type;

    switch (type) {
      case 'cursor':
        UI.enableEdit();
        break;
      case 'draw':
        UI.enablePen();
        break;
      case 'text':
        UI.enableText();
        break;
      case 'point':
        UI.enablePoint();
        break;
      case 'area':
      case 'highlight':
      case 'strikeout':
        UI.enableRect(type);
        break;
    }
  }

  function handleToolbarClick(e) {
    if (e.target.nodeName === 'BUTTON') {
      setActiveToolbarItem(e.target.getAttribute('data-tooltype'), e.target);
    }
  }

  document.querySelector('.toolbar').addEventListener('click', handleToolbarClick);
})();

// Scale/rotate
(function () {
  function setScaleRotate(scale, rotate) {
    scale = parseFloat(scale, 10);
    rotate = parseInt(rotate, 10);

    if (RENDER_OPTIONS.scale !== scale || RENDER_OPTIONS.rotate !== rotate) {
      RENDER_OPTIONS.scale = scale;
      RENDER_OPTIONS.rotate = rotate;

      localStorage.setItem(`${RENDER_OPTIONS.documentId}/scale`, RENDER_OPTIONS.scale);
      localStorage.setItem(`${RENDER_OPTIONS.documentId}/rotate`, RENDER_OPTIONS.rotate % 360);

      render();
    }
  }

  function handleScaleChange(e) {
    setScaleRotate(e.target.value, RENDER_OPTIONS.rotate);
  }

  function handleRotateCWClick() {
    setScaleRotate(RENDER_OPTIONS.scale, RENDER_OPTIONS.rotate + 90);
  }

  function handleRotateCCWClick() {
    setScaleRotate(RENDER_OPTIONS.scale, RENDER_OPTIONS.rotate - 90);
  }

  document.querySelector('.toolbar select.scale').value = RENDER_OPTIONS.scale;
  document.querySelector('.toolbar select.scale').addEventListener('change', handleScaleChange);
  document.querySelector('.toolbar .rotate-ccw').addEventListener('click', handleRotateCCWClick);
  document.querySelector('.toolbar .rotate-cw').addEventListener('click', handleRotateCWClick);
})();

// Clear toolbar button
(function () {
  function handleClearClick(e) {
    if (confirm('Desea borrar todas las anotaciones?')) {
      for (let i = 0; i < NUM_PAGES; i++) {
        document.querySelector(`div#pageContainer${i + 1} svg.annotationLayer`).innerHTML = '';
      }

      localStorage.removeItem(`${RENDER_OPTIONS.documentId}/annotations`);
    }
  }
  document.querySelector('a.clear').addEventListener('click', handleClearClick);
})();


// see or not the comments
(function () {

  function setComments(see) {

    if (RENDER_OPTIONS.seeComments !== see) {
      RENDER_OPTIONS.seeComments = see;
      localStorage.setItem(RENDER_OPTIONS.documentId + '/seecomments', RENDER_OPTIONS.seeComments);
      render();
    }
  }

  function handleCommentsChange(e) {
    setComments(e.target.checked);
  }
  document.querySelector('.toolbar input[type="checkbox"]').addEventListener('change', handleCommentsChange);
  })();

// list all comments
(function () {
  function handleListCommentsClick(e) {
    //  render();
    listAnnotations();
  }
  document.querySelector('.toolbar .listComments').addEventListener('click', handleListCommentsClick);
})();

// Comment stuff
(function (window, document) {
  let commentList = document.querySelector('#comment-wrapper .comment-list-container');
  let commentForm = document.querySelector('#comment-wrapper .comment-list-form');
  let commentText = commentForm.querySelector('input[type="text"]');

  function supportsComments(target) {
    let type = target.getAttribute('data-pdf-annotate-type');
    return ['point', 'highlight', 'area'].indexOf(type) > -1;
  }

  function insertComment(comment) {
    commentText.value = comment.content;
    let child = document.createElement('div');
    child.className = 'comment-list-item';
    child.innerHTML = twitter.autoLink(twitter.htmlEscape(comment.content));

    commentList.appendChild(child);
  }

  function handleAnnotationClick(target) {
    if (supportsComments(target)) {
      let documentId = target.parentNode.getAttribute('data-pdf-annotate-document');
      let annotationId = target.getAttribute('data-pdf-annotate-id');

      PDFJSAnnotate.getStoreAdapter().getComments(documentId, annotationId).then((comments) => {
        commentList.innerHTML = '';
        commentForm.style.display = '';
        commentText.focus();

        commentForm.onsubmit = function () {
          PDFJSAnnotate.getStoreAdapter().addComment(documentId, annotationId, commentText.value.trim())
            .then(insertComment)
            .then(() => {
              commentText.value = '';
              commentText.focus();
            });

          return false;
        };

        comments.forEach(insertComment);
      });
    }
  }

  function handleAnnotationBlur(target) {
    if (supportsComments(target)) {
      commentList.innerHTML = '';
      commentForm.style.display = 'none';
      commentForm.onsubmit = null;

      insertComment({ content: 'Sin Comentario' });
    }
  }

  UI.addEventListener('annotation:click', handleAnnotationClick);
  UI.addEventListener('annotation:blur', handleAnnotationBlur);
})(window, document);

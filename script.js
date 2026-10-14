(() => {
  'use strict';
  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => [...document.querySelectorAll(selector)];

  // Menú móvil y barra de progreso de lectura.
  const menuToggle = $('#menu-toggle');
  const menu = $('#main-nav');
  function closeMenu() {
    menu.classList.remove('open');
    menuToggle.setAttribute('aria-expanded', 'false');
    menuToggle.setAttribute('aria-label', 'Abrir menú');
    menuToggle.innerHTML = '<svg class="icon"><use href="#icon-menu"/></svg>';
  }
  menuToggle.addEventListener('click', () => {
    const opening = !menu.classList.contains('open');
    if (opening) {
      menu.classList.add('open');
      menuToggle.setAttribute('aria-expanded', 'true');
      menuToggle.setAttribute('aria-label', 'Cerrar menú');
      menuToggle.innerHTML = '<svg class="icon"><use href="#icon-close"/></svg>';
    } else closeMenu();
  });
  $$('#main-nav a').forEach(link => link.addEventListener('click', closeMenu));
  window.addEventListener('resize', () => { if (window.innerWidth > 880) closeMenu(); });
  let framePending = false;
  window.addEventListener('scroll', () => {
    if (framePending) return;
    framePending = true;
    requestAnimationFrame(() => {
      const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      $('#reading-progress').style.width = `${Math.min(100, (window.scrollY / max) * 100)}%`;
      framePending = false;
    });
  }, {passive: true});

  // Triángulo del fuego, definido a partir del documento de origen.
  const triangleData = {
    combustible: {label:'01 · COMBUSTIBLE',title:'Carbón, madera y metano.',text:'Materiales que pueden arder y alimentar el fuego.'},
    comburente: {label:'02 · COMBURENTE',title:'Oxígeno del aire.',text:'Elemento que permite que la combustión tenga lugar.'},
    calor: {label:'03 · FUENTE DE CALOR',title:'Chispas, fricción y equipo eléctrico.',text:'Fuentes que pueden iniciar el fuego.'}
  };
  $$('.triangle-point').forEach(button => button.addEventListener('click', () => {
    $$('.triangle-point').forEach(b => {b.classList.toggle('active', b === button); b.setAttribute('aria-pressed', String(b === button));});
    const t = triangleData[button.dataset.triangle];
    $('#triangle-info').innerHTML = `<span class="small-pill">${t.label}</span><h4>${t.title}</h4><p>${t.text}</p>`;
  }));

  // Las marcas guardan solamente el progreso de lectura local.
  const storageKey = 'ufps-folleto-revisado-v1';
  let reviewed = [];
  try { const prev = JSON.parse(localStorage.getItem(storageKey) || '[]'); if (Array.isArray(prev)) reviewed = prev; } catch (_) {}
  const inputs = $$('[data-review]');
  function updateReviewed() {
    inputs.forEach(input => {
      input.checked = reviewed.includes(input.dataset.review);
      input.closest('.measure-card').classList.toggle('reviewed', input.checked);
    });
    $('#review-progress-label').textContent = `${reviewed.length} de ${inputs.length} revisadas`;
    $('#review-progress-fill').style.width = `${reviewed.length / inputs.length * 100}%`;
  }
  inputs.forEach(input => input.addEventListener('change', () => {
    if (input.checked && !reviewed.includes(input.dataset.review)) reviewed.push(input.dataset.review);
    if (!input.checked) reviewed = reviewed.filter(id => id !== input.dataset.review);
    try { localStorage.setItem(storageKey, JSON.stringify(reviewed)); } catch (_) {}
    updateReviewed();
  }));
  reviewed = reviewed.filter(id => inputs.some(input => input.dataset.review === id));
  updateReviewed();
  $$('.filter-btn').forEach(button => button.addEventListener('click', () => {
    $$('.filter-btn').forEach(b => {b.classList.toggle('active', b === button); b.setAttribute('aria-pressed',String(b === button));});
    $$('.measure-card').forEach(card => {card.hidden = button.dataset.filter !== 'todos' && card.dataset.category !== button.dataset.filter;});
  }));

  // Protocolo de incendio: texto de los 7 pasos conservado del folleto.
  const steps = [
    {title:'Mantenga la calma y active la alarma.',description:'Mantenga la calma y active la alarma para alertar a las personas cercanas.'},
    {title:'Avise de inmediato al supervisor o jefe de turno.',description:'Notifique la situación al supervisor o al jefe de turno de forma inmediata.'},
    {title:'Si el fuego es pequeño y sabe usar el extintor, intente controlarlo.',description:'Intente controlar el fuego únicamente si es pequeño y sabe manejar el extintor.'},
    {title:'Si no es controlable, evacúe por la ruta de escape señalizada.',description:'Si el incendio no se puede controlar, siga la ruta de escape señalizada.'},
    {title:'Use el autorrescatador y avance agachado si hay humo.',description:'Si hay humo, utilice el autorrescatador y avance agachado.'},
    {title:'No regrese por objetos personales.',description:'No interrumpa la evacuación para recuperar pertenencias.'},
    {title:'Diríjase al punto de reunión o cámara de refugio y espere instrucciones.',description:'Una vez en el punto de reunión o cámara de refugio, espere las instrucciones correspondientes.'}
  ];
  let currentStep = 0;
  function showStep(index) {
    currentStep = Math.max(0, Math.min(steps.length - 1, index));
    $$('.emergency-step').forEach((b,i) => {b.classList.toggle('active',i === currentStep);b.setAttribute('aria-expanded',String(i === currentStep));});
    const s = steps[currentStep];
    $('#detail-watermark').textContent = String(currentStep + 1).padStart(2,'0');
    $('#step-detail .micro-label').textContent = `PASO ${String(currentStep+1).padStart(2,'0')} DE 07`;
    $('#step-detail h3').textContent = s.title;
    $('#step-detail p').textContent = s.description;
    $('#prev-step').disabled = currentStep === 0;
    $('#next-step').disabled = currentStep === steps.length - 1;
    $('#next-step').innerHTML = currentStep === steps.length - 1 ? 'Último paso <svg class="icon"><use href="#icon-check"/></svg>' : 'Siguiente paso <svg class="icon"><use href="#icon-arrow"/></svg>';
  }
  $$('.emergency-step').forEach(button => button.addEventListener('click', () => showStep(Number(button.dataset.step))));
  $('#prev-step').addEventListener('click', () => showStep(currentStep - 1));
  $('#next-step').addEventListener('click', () => showStep(currentStep + 1));

  // Clases de fuego. No se añaden correspondencias con agentes extintores no presentes en el documento.
  const fireClasses = {
    A: ['Sólidos comunes','Carbón, madera y papel.'],
    B: ['Líquidos inflamables y gases','Aceites y combustibles.'],
    C: ['Equipos eléctricos energizados','Equipos eléctricos energizados.'],
    D: ['Metales combustibles','Metales combustibles.'],
    K: ['Aceites de cocina','Aceites de cocina.']
  };
  $$('.fire-class-btn').forEach(button => button.addEventListener('click', () => {
    $$('.fire-class-btn').forEach(b => {b.classList.toggle('active',b===button);b.setAttribute('aria-pressed',String(b===button));});
    const [heading,desc] = fireClasses[button.dataset.fire];
    $('#fire-class-detail').innerHTML = `<span class="micro-label">CLASE ${button.dataset.fire}</span><h3>${heading}</h3><p>${desc}</p>`;
  }));

  // Repaso académico basado únicamente en lo explicado en el folleto.
  const quiz = [
    {q:'¿Qué tres elementos forman el triángulo del fuego?',options:['Carbón, aire y agua','Combustible, comburente y fuente de calor','Metano, polvo y ventilación','Oxígeno, agua y tierra'],correct:1,why:'Los tres elementos son combustible, comburente (oxígeno) y fuente de calor.'},
    {q:'¿Qué gases deben monitorearse con detectores calibrados?',options:['Hidrógeno y helio','Oxígeno y nitrógeno','Metano (CH₄) y monóxido de carbono (CO)','Argón y vapor de agua'],correct:2,why:'La medida «Monitorear» indica detectores de metano y CO calibrados.'},
    {q:'¿Cuál es el primer paso ante un incendio?',options:['Regresar por objetos personales','Mantener la calma y activar la alarma','Intentar apagar cualquier fuego','Salir sin avisar a nadie'],correct:1,why:'El primer paso es mantener la calma y activar la alarma.'},
    {q:'¿Qué se debe hacer si hay humo durante la evacuación?',options:['Avanzar erguido y rápido','Esperar junto al fuego','Usar el autorrescatador y avanzar agachado','Volver a buscar objetos'],correct:2,why:'El paso cinco indica usar el autorrescatador y avanzar agachado si hay humo.'},
    {q:'¿A qué corresponde la clase C de fuego?',options:['Equipos eléctricos energizados','Aceites de cocina','Sólidos comunes','Metales combustibles'],correct:0,why:'La clase C corresponde a equipos eléctricos energizados.'}
  ];
  let questionIndex = 0, score = 0, answered = false;
  const quizArea = $('#quiz-area');
  function renderQuestion(){
    answered = false;
    const q = quiz[questionIndex];
    $('#quiz-counter').textContent = `PREGUNTA ${String(questionIndex+1).padStart(2,'0')} / ${String(quiz.length).padStart(2,'0')}`;
    $('#quiz-fill').style.width = `${(questionIndex+1)/quiz.length*100}%`;
    quizArea.innerHTML = `<h3 class="quiz-question">${q.q}</h3><div class="quiz-options">${q.options.map((option,index) => `<button type="button" class="quiz-option" data-answer="${index}"><span class="option-letter">${'ABCD'[index]}</span><span>${option}</span></button>`).join('')}</div><div id="quiz-feedback" aria-live="polite"></div><div class="quiz-footer"><button type="button" class="quiz-next" id="quiz-next" disabled>${questionIndex===quiz.length-1?'Ver resultado':'Siguiente pregunta'} <svg class="icon"><use href="#icon-arrow"/></svg></button></div>`;
    $$('.quiz-option').forEach(button => button.addEventListener('click',()=>{
      if(answered)return;
      answered=true;
      const selected=Number(button.dataset.answer),correct=selected===q.correct;
      if(correct)score++;
      $$('.quiz-option').forEach(b=>{b.disabled=true;const n=Number(b.dataset.answer);if(n===q.correct)b.classList.add('correct');if(n===selected&&!correct)b.classList.add('wrong');});
      $('#quiz-feedback').innerHTML=`<div class="quiz-feedback ${correct?'success':''}"><strong>${correct?'¡Correcto!':'Respuesta incorrecta.'}</strong> ${q.why}</div>`;
      $('#quiz-next').disabled=false;
    }));
    $('#quiz-next').addEventListener('click',()=>{if(!answered)return;if(questionIndex===quiz.length-1)renderResult();else{questionIndex++;renderQuestion();}});
  }
  function renderResult(){
    $('#quiz-counter').textContent='RESULTADO FINAL';
    $('#quiz-fill').style.width='100%';
    const message=score===5?'¡Excelente! Dominas los conceptos de seguridad.':score>=3?'¡Buen avance! Puedes repasar los temas que fallaste.':'Sigue estudiando y vuelve a intentarlo.';
    quizArea.innerHTML=`<div class="quiz-result"><div class="result-number">${score}<span style="font-size:.38em;color:#87919b;letter-spacing:0">/5</span></div><h3>${message.split('!')[0]}${message.includes('!')?'!':''}</h3><p>${message.includes('!')?message.split('!').slice(1).join('!').trim():message}</p><button class="quiz-next" id="quiz-restart"><svg class="icon"><use href="#icon-reset"/></svg> Repetir cuestionario</button></div>`;
    $('#quiz-restart').addEventListener('click',()=>{questionIndex=0;score=0;renderQuestion();});
  }
  renderQuestion();
})();

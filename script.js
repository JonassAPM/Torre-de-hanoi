class _StackNode {
  constructor(value, next) {
    this.value = value;
    this.next = next;
  }
}

class Stack {
  constructor() {
    this.top = null;
    this.size = 0;
  }

  push(value) {
    const newNode = new _StackNode(value, this.top);
    this.top = newNode;
    this.size++;
  }

  pop() {
    if (this.isEmpty()) {
      return undefined;
    }
    const value = this.top.value;
    this.top = this.top.next;
    this.size--;
    return value;
  }

  peek() {
    if (this.isEmpty()) {
      return undefined;
    }
    return this.top.value;
  }

  isEmpty() {
    return this.size === 0;
  }

  getLength() {
    return this.size;
  }

  getValuesForRender() {
    const values = [];
    let current = this.top;

    while (current) {
      values.push(current.value);
      current = current.next;
    }

    return values.reverse();
  }
}

const numDiscosInput = document.getElementById('numDiscos');
const colorControls = document.getElementById('colorControls');
const generarBtn = document.getElementById('generarBtn');
const randomColorsBtn = document.getElementById('randomColorsBtn');

const stackEls = [
  document.getElementById('stack0'),
  document.getElementById('stack1'),
  document.getElementById('stack2')
];

const solveBtn = document.getElementById('solveBtn');
const pauseBtn = document.getElementById('pauseBtn');
const resumeBtn = document.getElementById('resumeBtn');
const resetBtn = document.getElementById('resetBtn');
const speedRange = document.getElementById('speedRange');
const speedValue = document.getElementById('speedValue');
const boardEl = document.getElementById('tablero'); ;
const mensajeEl = document.getElementById('mensaje');
const moveCountEl = document.getElementById('moveCount');
const minMoveCountEl = document.getElementById('minMoveCount');
const timerEl = document.getElementById('timer');
const modalVictoriaEl = document.getElementById('modalVictoria');
const modalAceptarBtn = document.getElementById('modalAceptarBtn');
const modalMoveCountEl = document.getElementById('modalMoveCount');
const modalTimeEl = document.getElementById('modalTime');

let numDiscos = parseInt(numDiscosInput.value, 10) || 3;

let pilas = [new Stack(), new Stack(), new Stack()];
let colores = [];
let dragSourceIndex = null;

let moves = [];
let autoplayTimer = null;
let autoplayIndex = 0;
let autoplayPaused = false;

let moveCount = 0;
let isGameWon = false;

let timerInterval = null;
let secondsElapsed = 0;
let isTimerRunning = false;
let isTimerDisabled = false;

function crearControlesColor(n) {
  colorControls.innerHTML = '';
  colores = new Array(n + 1).fill('#ffffffff');
  for (let i = 1; i <= n; i++) {
    const wrapper = document.createElement('label');
    wrapper.style.display = 'flex';
    wrapper.style.flexDirection = 'column';
    wrapper.style.alignItems = 'center';
    wrapper.style.fontSize = '12px';
    wrapper.style.minWidth = '60px';

    const span = document.createElement('span');
    span.textContent = `D${i}`;
    span.style.marginBottom = '4px';

    const input = document.createElement('input');
    input.type = 'color';
    const t = (i - 1) / Math.max(1, n - 1);
    const defaultColor = hslToHex(220 - 120 * t, 70, 50);
    input.value = defaultColor;
    colores[i] = defaultColor;

    input.addEventListener('input', (e) => {
      colores[i] = e.target.value;
      renderPilas();
    });

    wrapper.appendChild(span);
    wrapper.appendChild(input);
    colorControls.appendChild(wrapper);
  }
}

function updateTimerDisplay() {
  if (isTimerDisabled) {
    timerEl.textContent = "--:--";
    return;
  }
  const minutes = Math.floor(secondsElapsed / 60);
  const seconds = secondsElapsed % 60;
  timerEl.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

function startTimer() {
  if (isTimerRunning || isTimerDisabled) return;
  isTimerRunning = true;
  timerInterval = setInterval(() => {
    secondsElapsed++;
    updateTimerDisplay();
  }, 1000);
}

function stopTimer() {
  clearInterval(timerInterval);
  timerInterval = null;
  isTimerRunning = false;
}

function resetTimer() {
  stopTimer();
  secondsElapsed = 0;
  isTimerRunning = false;
  isTimerDisabled = false;
  updateTimerDisplay();
}

function hslToHex(h, s, l) {
  l /= 100;
  const a = s * Math.min(l, 1 - l) / 100;
  const f = (n) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

function coloresAleatorios(){
  const h_start = Math.floor(Math.random() * 360);
  const h_shift_amount = 90 + Math.random() * 60; 
  const h_shift_direction = (Math.random() > 0.5 ? 1 : -1);
  const h_shift = h_shift_amount * h_shift_direction;

  const s = 70 + Math.random() * 10;
  const l = 55 + Math.random() * 10;

  for (let i = 1; i <= numDiscos; i++) {
    const t = (i - 1) / Math.max(1, numDiscos - 1);
    let current_h = (h_start + h_shift * t) % 360;

    if (current_h < 0) {
      current_h += 360;
    }

    const randomHex = hslToHex(current_h, s, l); 
    colores[i] = randomHex;
  }
  const colorInputs = colorControls.querySelectorAll('input[type="color"]');
  colorInputs.forEach((input, idx)=> {
    if (colores[idx+1]) {
      input.value = colores[idx+1];
    }
  });
  renderPilas();
}

function inicializarPilas() {
  clearAutoplay();
  pilas = [new Stack(), new Stack(), new Stack()];
  for (let i = numDiscos; i >= 1; i--) {
    pilas[0].push(i);
  }
  moves = [];
  autoplayIndex = 0;
  autoplayPaused = false;
  dragSourceIndex = null;
  mensajeEl.textContent = '';

  moveCount = 0;
  moveCountEl.textContent = moveCount;
  const minMoves = Math.pow(2, numDiscos) - 1;
  minMoveCountEl.textContent = minMoves;
  isGameWon = false;

  resetTimer();

  if (boardEl) {
    boardEl.style.height = 'auto'; 
  }

  updateControlButtons(true);
  renderPilas();

  setTimeout(() => {
    if (boardEl) {
      const newHeight = boardEl.offsetHeight;
      boardEl.style.height = `${newHeight}px`;
    }
  }, 0);
}

function renderPilas() {
  for (let p = 0; p < 3; p++) {
    stackEls[p].innerHTML = '';
    const pilaArray = pilas[p].getValuesForRender();
    for (let i = 0; i < pilaArray.length; i++) {
      const size = pilaArray[i];
      const diskEl = document.createElement('div');
      diskEl.className = 'disk';
      diskEl.dataset.size = size;
      diskEl.textContent = size;
      const maxWidthPercent = 90;
      const minWidthPercent = 30;
      const ratio = (size - 1) / Math.max(1, numDiscos - 1);
      const widthPercent = minWidthPercent + (maxWidthPercent - minWidthPercent) * ratio;
      diskEl.style.width = `${widthPercent}%`;

      diskEl.style.background = colores[size] || '#888';

      const isTop = (i === pilaArray.length - 1);
      if (isTop) {
        diskEl.style.cursor = 'grab';
        diskEl.draggable = true;
        diskEl.addEventListener('dragstart', (e) => {
          if (autoplayTimer !== null && !autoplayPaused) {
            e.preventDefault();
            return;
          }
          dragSourceIndex = p;
          e.target.classList.add('dragging');
          e.dataTransfer.effectAllowed = 'move';
        });

        diskEl.addEventListener('dragend', (e) => {
          e.target.classList.remove('dragging');
          stackEls.forEach(el => el.parentElement.classList.remove('drag-over', 'invalid-over'));
          dragSourceIndex = null;
        });
      } else {
        diskEl.style.opacity = '0.85';
      }

      stackEls[p].appendChild(diskEl);
    }
  }
}

function intentarMover(fromIndex, toIndex, isUserMove = false) {
  if (isUserMove) {
    // Si el usuario mueve, el juego es "legal" de nuevo
    isTimerDisabled = false;
    
    if (isUserMove && (autoplayTimer !== null || autoplayPaused)) {
      if (autoplayTimer !== null) {
        clearTimeout(autoplayTimer);
        autoplayTimer = null; 
      }
    autoplayPaused = true;
    moves = [];
    autoplayIndex = 0;

    updateControlButtons(); 
    }
  }

  if (pilas[fromIndex].isEmpty()) { 
    return false;
  }
  const disco = pilas[fromIndex].peek(); 
  const destTop = pilas[toIndex].peek(); 

  if (destTop !== undefined && destTop < disco) {
    return false;
  }

  if (isUserMove && !isTimerRunning && secondsElapsed === 0 && !isTimerDisabled) {
      startTimer();
  }

  pilas[fromIndex].pop();
  pilas[toIndex].push(disco);

  moveCount++;
  moveCountEl.textContent = moveCount;

  mensajeEl.textContent = '';
  renderPilas();
  comprobarVictoria();
  return true;
}

stackEls.forEach((stackEl, pegIndex) => {
  const pegEl = stackEl.parentElement;

    pegEl.addEventListener('dragover', (e) => {
    e.preventDefault();

    if (dragSourceIndex === null || dragSourceIndex === pegIndex) {
      return; 
    }

    // Usa .peek() para ver los discos
    const disco = pilas[dragSourceIndex].peek();
    const destTop = pilas[pegIndex].peek();

    if (destTop === undefined || destTop > disco) {
      pegEl.classList.add('drag-over');
      pegEl.classList.remove('invalid-over');
      e.dataTransfer.dropEffect = 'move';
    } else {
      pegEl.classList.add('invalid-over');
      pegEl.classList.remove('drag-over');
      e.dataTransfer.dropEffect = 'none';
    }
  });

  pegEl.addEventListener('dragleave', (e) => {
    pegEl.classList.remove('drag-over', 'invalid-over');
  });

  pegEl.addEventListener('drop', (e) => {
    e.preventDefault();
    pegEl.classList.remove('drag-over', 'invalid-over');

    if (dragSourceIndex === null || dragSourceIndex === pegIndex) {
      return;
      }
    intentarMover(dragSourceIndex, pegIndex, true);
    });
});

function generarMovimientos(n, from, to, aux, outMoves) {
  if (n === 0) return;
  generarMovimientos(n - 1, from, aux, to, outMoves);
  outMoves.push({ from, to });
  generarMovimientos(n - 1, aux, to, from, outMoves);
}

function updateControlButtons(isInitial = false) {
  if (isGameWon) {
    solveBtn.disabled = true;
    pauseBtn.disabled = true;
    resumeBtn.disabled = true;
    resetBtn.disabled = false;

  } else if (autoplayPaused) {
    solveBtn.disabled = true;
    pauseBtn.disabled = true;
    resumeBtn.disabled = false;
    resetBtn.disabled = false;

  } else if (autoplayTimer !== null && !autoplayPaused) {
    solveBtn.disabled = true;
    pauseBtn.disabled = false;
    resumeBtn.disabled = true;
    resetBtn.disabled = false;

  } else {
    solveBtn.disabled = false;
    pauseBtn.disabled = true;
    resumeBtn.disabled = true;
    resetBtn.disabled = isInitial ? false : false;
  }
}

function iniciarAutoplay() {
  if (autoplayTimer !== null && !autoplayPaused) return;

  inicializarPilas();

  moves = [];
  generarMovimientos(numDiscos, 0, 2, 1, moves);
  autoplayIndex = 0;
  autoplayPaused = false;
  runAutoplayStep();
  updateControlButtons();
}

function runAutoplayStep() {
  if (autoplayIndex >= moves.length) {
    clearAutoplay();
    updateControlButtons();
    return;
  }
  const ms = parseInt(speedRange.value, 10);
  autoplayTimer = setTimeout(() => {
    const mv = moves[autoplayIndex];
    intentarMover(mv.from, mv.to, false);
    autoplayIndex++;
    if (!autoplayPaused) runAutoplayStep(); 
  }, ms);
}

let movesQueue = [];

function pausarAutoplay() {
  if (autoplayTimer !== null) {
    clearTimeout(autoplayTimer);
  }
  autoplayPaused = true;
  stopTimer();
  updateControlButtons();
}

function reanudarAutoplay() {
  if (!autoplayPaused) return;
  autoplayPaused = false;
  startTimer();
  updateControlButtons();
  runAutoplayStep();
}

function clearAutoplay() {
  if (autoplayTimer !== null) {
    clearTimeout(autoplayTimer);
    autoplayTimer = null;
  }
  autoplayPaused = false;
  autoplayIndex = 0;
  moves = [];
  updateControlButtons();
}

function comprobarVictoria() {
  if (!isGameWon && (pilas[1].getLength() === numDiscos || pilas[2].getLength() === numDiscos)) {
    isGameWon = true;
    clearAutoplay();
    stopTimer();

    modalMoveCountEl.textContent = moveCount;

    if (isTimerDisabled) {
      modalTimeEl.textContent = "--:-- (Solución Auto.)";
    } else {
      const minutes = Math.floor(secondsElapsed / 60);
      const seconds = secondsElapsed % 60;
      modalTimeEl.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    modalVictoriaEl.classList.add('visible');
  }
}

function updateSliderFill() {
  const value = parseInt(speedRange.value, 10);
  const min = parseInt(speedRange.min, 10);
  const max = parseInt(speedRange.max, 10);
  
  const percent = ((value - min) / (max - min)) * 100;
  
  speedRange.style.setProperty('--slider-fill-percent', `${percent}%`);
}

function findDisk(diskNum) {

    for (let i = 0; i < pilas.length; i++) {
        let valoresEnPila = pilas[i].getValuesForRender(); 

        if (valoresEnPila.includes(diskNum)) {
            return i;
        }
    }
    
    console.error(`Error: No se pudo encontrar el disco ${diskNum} en la variable 'pilas'`);
    return -1;
}

function generarMovimientosDesdeEstado(n, targetPeg) {
  if (n === 0) {
    return;
  }
  let sourcePeg = findDisk(n);
  if (sourcePeg === targetPeg) {
    generarMovimientosDesdeEstado(n - 1, targetPeg);
  } else {
    let auxPeg = 3 - sourcePeg - targetPeg; 
    generarMovimientosDesdeEstado(n - 1, auxPeg);
    movesQueue.push({ from: sourcePeg, to: targetPeg });
    generarMovimientos(n - 1, auxPeg, targetPeg, sourcePeg, movesQueue);
    }
}

generarBtn.addEventListener('click', () => {
  const val = parseInt(numDiscosInput.value, 10);
  if (isNaN(val) || val < 3 || val > 10) {
    mensajeEl.textContent = '*Ingresa un número de discos entre 3 y 10.*';
    return;
  }
  numDiscos = val;
  crearControlesColor(numDiscos);
  inicializarPilas();
});

numDiscosInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {

    e.preventDefault(); 
    generarBtn.click(); 
  }
});

randomColorsBtn.addEventListener('click', () => {
  coloresAleatorios();
});

solveBtn.addEventListener('click', () => {
    pausarAutoplay(); 
    
    stopTimer();
    isTimerDisabled = true;
    updateTimerDisplay();

    movesQueue = [];
    let numDiscos = parseInt(document.getElementById('numDiscos').value);
    let targetPeg = 2;

    generarMovimientosDesdeEstado(numDiscos, targetPeg); 

    moves = movesQueue; 
    autoplayIndex = 0;
    autoplayPaused = false;

    runAutoplayStep();
    updateControlButtons();
});

pauseBtn.addEventListener('click', () => {
  pausarAutoplay();
});

resumeBtn.addEventListener('click', () => {
    pausarAutoplay(); 

    stopTimer();
    isTimerDisabled = true;
    updateTimerDisplay();
    
    movesQueue = []; 
    let numDiscos = parseInt(document.getElementById('numDiscos').value);
    let targetPeg = 2; 

    generarMovimientosDesdeEstado(numDiscos, targetPeg); 
    
    moves = movesQueue;
    autoplayIndex = 0;
    autoplayPaused = false;
    
    runAutoplayStep();
    updateControlButtons();
});

resetBtn.addEventListener('click', () => {
  clearAutoplay();
  inicializarPilas();
});

speedRange.addEventListener('input', () => {
  speedValue.textContent = speedRange.value;
  updateSliderFill();
});

modalAceptarBtn.addEventListener('click', () => {
  modalVictoriaEl.classList.remove('visible');
});

window.addEventListener('load', () => {
  crearControlesColor(numDiscos);
  inicializarPilas();
  updateSliderFill();
});

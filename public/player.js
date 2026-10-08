const $ = (id) => document.getElementById(id);
let flow;
let cursor = 0;
let timer;
let packet;
let animation;
const nodes = new Map();
function pause() {
  clearTimeout(timer);
  timer = undefined;
  $('play').textContent = 'Play';
}
function render() {
  animation?.cancel();
  packet?.remove();
  for (const node of nodes.values()) node.classList.remove('active');
  $('timeline').value = cursor;
  $('progress').textContent = cursor + ' / ' + flow.steps.length;
  $('previous').disabled = cursor === 0;
  $('next').disabled = cursor === flow.steps.length;
  $('status').textContent =
    cursor === flow.steps.length ? 'Replay complete.' : '';
  if (!cursor) {
    $('packet-title').textContent = 'Select a step';
    $('route').textContent = '';
    $('fields').textContent = '{}';
    return;
  }
  const step = flow.steps[cursor - 1];
  $('packet-title').textContent = step.dtoName;
  $('route').textContent = step.from + ' → ' + step.to;
  $('fields').textContent = JSON.stringify(step.dtoFields, null, 2);
  const from = nodes.get(step.from);
  const to = nodes.get(step.to);
  from.classList.add('active');
  to.classList.add('active');
  packet = document.createElement('div');
  packet.className = 'packet';
  packet.textContent = step.dtoName;
  const canvas = $('canvas');
  canvas.append(packet);
  to.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  const x = (node) => node.offsetLeft + node.offsetWidth / 2 - 60;
  packet.style.left = x(to) + 'px';
  if (!matchMedia('(prefers-reduced-motion: reduce)').matches)
    animation = packet.animate(
      [{ left: x(from) + 'px' }, { left: x(to) + 'px' }],
      { duration: Number($('speed').value) * 0.7, easing: 'ease-in-out' },
    );
}
function next() {
  if (cursor < flow.steps.length) {
    cursor++;
    render();
  }
}
function tick() {
  next();
  if (cursor < flow.steps.length)
    timer = setTimeout(tick, Number($('speed').value));
  else pause();
}
$('play').onclick = () => {
  if (!flow) return;
  if (timer) {
    pause();
    return;
  }
  if (cursor === flow.steps.length) cursor = 0;
  $('play').textContent = 'Pause';
  timer = setTimeout(tick, 0);
};
$('next').onclick = () => {
  pause();
  next();
};
$('previous').onclick = () => {
  pause();
  cursor = Math.max(0, cursor - 1);
  render();
};
$('restart').onclick = () => {
  pause();
  cursor = 0;
  render();
};
$('timeline').oninput = () => {
  pause();
  cursor = Number($('timeline').value);
  render();
};
async function load() {
  try {
    const id = location.pathname.split('/').at(-1);
    const response = await fetch('/api/flow/' + id);
    if (!response.ok) throw new Error((await response.json()).error);
    flow = await response.json();
    $('title').textContent = flow.endpoint;
    for (const step of flow.steps)
      for (const name of [step.from, step.to]) {
        if (nodes.has(name)) continue;
        const node = document.createElement('div');
        node.className = 'node';
        node.textContent = name;
        nodes.set(name, node);
        $('canvas').append(node);
      }
    $('timeline').max = flow.steps.length;
    render();
  } catch (error) {
    $('title').textContent = 'Flow unavailable';
    $('status').textContent = error.message;
    for (const control of document.querySelectorAll('button, input, select'))
      control.disabled = true;
  }
}
void load();

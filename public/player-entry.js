import { mountPlayer } from './player.js';
import { createDiagram } from './diagram/diagram.js';

const stylesheet = document.createElement('link');
stylesheet.rel = 'stylesheet';
stylesheet.href = '/diagram/diagram.css';
document.head.append(stylesheet);
mountPlayer(document, createDiagram);

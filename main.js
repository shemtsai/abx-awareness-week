// Entry point: loads the styles, lists the games on the menu, and starts the arcade.
// To add a game: make a file in src/games/, import it here, add it to the list, and add its code word in core.js.
import './style.css';
import { GAMES, menu } from './core.js';
import { quiz, MYTHS, DASH, DUR } from './games/quiz.js';
import { match } from './games/match.js';
import { scramble } from './games/scramble.js';
import { wheel } from './games/wheel.js';
import { blaster } from './games/blaster.js';
import { whack } from './games/whack.js';
import { catcher } from './games/catch.js';
import { clock } from './games/clock.js';

// f:1 = featured (highlighted tile). id must match a key in CODES (core.js).
GAMES.push(
  {ic:'🎡',name:'Stewardship Wheel',d:'Spin, guess letters, solve the stewardship puzzle.',fn:wheel,f:1,id:'wheel'},
  {ic:'💥',name:'Bug Blaster',d:'Treat the falling bugs with the narrowest drug, before they escape.',fn:blaster,f:1,id:'blast'},
  {ic:'🔨',name:'Order Whack',d:'Whack the inappropriate antibiotic orders. Leave the good ones alone!',fn:whack,f:1,id:'whack'},
  {ic:'🛡️',name:'Stewardship Catch',d:'Catch good stewardship practices and dodge the bad ones.',fn:catcher,f:1,id:'catch'},
  {ic:'⏱️',name:'Stop the Clock',d:'Stop the moving marker on the right treatment duration.',fn:clock,f:1,id:'clock'},
  {ic:'🧠',name:'Myth or Fact',d:'Bust common antibiotic myths.',fn:function(){quiz('Myth or Fact',MYTHS,'myth')},id:'myth'},
  {ic:'🎯',name:'Bug–Drug Match',d:'Pair each organism with its go-to targeted therapy.',fn:match,id:'match'},
  {ic:'📉',name:'De-escalation Dash',d:'Cultures are back. Pick the narrowest effective option.',fn:function(){quiz('De-escalation Dash',DASH,'dash')},id:'dash'},
  {ic:'⏱️',name:'Duration Station',d:'How short can you go? Evidence-based durations.',fn:function(){quiz('Duration Station',DUR,'dur')},id:'dur'},
  {ic:'🔤',name:'Stewardship Scramble',d:'Unscramble key stewardship terms.',fn:scramble,id:'scr'}
);

menu();

import { Display, draw } from './display/index.js';


const context = document.querySelector('canvas').getContext('2d');
const display = Display();

display.flipPixel(1, 1);
display.flipPixel(1, 2);
display.flipPixel(1, 3);
display.flipPixel(1, 4);
display.flipPixel(1, 5);
display.flipPixel(2, 3);
display.flipPixel(3, 1);
display.flipPixel(3, 2);
display.flipPixel(3, 3);
display.flipPixel(3, 4);
display.flipPixel(3, 5);

display.flipPixel(5, 1);
display.flipPixel(5, 2);
display.flipPixel(5, 3);
display.flipPixel(5, 4);
display.flipPixel(5, 5);
display.flipPixel(6, 1);
display.flipPixel(6, 3);
display.flipPixel(6, 5);
display.flipPixel(7, 1);
display.flipPixel(7, 3);
display.flipPixel(7, 5);

display.flipPixel(9, 1);
display.flipPixel(9, 2);
display.flipPixel(9, 3);
display.flipPixel(9, 4);
display.flipPixel(9, 5);
display.flipPixel(10, 5);
display.flipPixel(11, 5);

display.flipPixel(13, 1);
display.flipPixel(13, 2);
display.flipPixel(13, 3);
display.flipPixel(13, 4);
display.flipPixel(13, 5);
display.flipPixel(14, 5);
display.flipPixel(15, 5);

display.flipPixel(17, 1);
display.flipPixel(17, 2);
display.flipPixel(17, 3);
display.flipPixel(17, 4);
display.flipPixel(17, 5);
display.flipPixel(18, 1);
display.flipPixel(18, 5);
display.flipPixel(19, 1);
display.flipPixel(19, 2);
display.flipPixel(19, 3);
display.flipPixel(19, 4);
display.flipPixel(19, 5);

draw(display, context);

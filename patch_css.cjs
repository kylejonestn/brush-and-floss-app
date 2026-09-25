const fs = require('fs');
let file = fs.readFileSync('src/index.css', 'utf8');

const newCSS = \`
@keyframes shimmer-bg {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}
.bg-shimmer-gold {
  background: linear-gradient(270deg, #fef08a, #fde047, #fef08a);
  background-size: 200% 200%;
  animation: shimmer-bg 3s ease infinite;
  color: #854d0e; /* text-yellow-800 */
}
.bg-shimmer-emerald {
  background: linear-gradient(270deg, #a7f3d0, #6ee7b7, #a7f3d0);
  background-size: 200% 200%;
  animation: shimmer-bg 3s ease infinite;
  color: #065f46; /* text-emerald-800 */
}
@keyframes float {
  0% { transform: translateY(0px) rotate(0deg); }
  50% { transform: translateY(-2px) rotate(10deg); }
  100% { transform: translateY(0px) rotate(0deg); }
}
.animate-float {
  animation: float 2s ease-in-out infinite;
}
@keyframes float-delay {
  0% { transform: translateY(0px) rotate(0deg); }
  50% { transform: translateY(-2px) rotate(-10deg); }
  100% { transform: translateY(0px) rotate(0deg); }
}
.animate-float-delay {
  animation: float-delay 2.5s ease-in-out infinite;
}
\`;

file = file + '\\n' + newCSS;
fs.writeFileSync('src/index.css', file);

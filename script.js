// --- 1. COUNTDOWN LOGIC ---
const TET_DATE = new Date("February 17, 2026 00:00:00").getTime();

// *** CHẾ ĐỘ TEST ***
// Để xem ngay hiệu ứng 3s cuối và pháo hoa, hãy bỏ comment dòng dưới đây:
// const TET_DATE = new Date().getTime() + 10000; // Đếm ngược 10 giây từ bây giờ

let isFinalMode = false;
let isCelebrated = false;

// Tạo phần tử chứa lời chúc (ẩn sẵn)
const hnyContainer = document.createElement('div');
hnyContainer.className = 'hny-message';
hnyContainer.innerHTML = `
    <div class="hny-title">Chúc Mừng<br>Năm Mới</div>
    <div class="hny-subtitle">Xuân Bính Ngọ 2026</div>
`;
document.body.appendChild(hnyContainer);


function updateCountdown() {
    const now = new Date().getTime();
    const distance = TET_DATE - now;

    // 1. GIAI ĐOẠN CHÚC MỪNG (<= 0)
    if (distance <= 0) {
        if (!isCelebrated) {
            celebrateNewYear();
            isCelebrated = true;
        }
        return;
    }

    // 2. GIAI ĐOẠN 3 GIÂY CUỐI (<= 3000ms)
    if (distance <= 3900 && !isFinalMode) {
        enterFinalCountdown();
        isFinalMode = true;
    }

    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);

    const pad = (n) => n < 10 ? `0${n}` : n;

    document.getElementById("d").innerText = pad(days);
    document.getElementById("h").innerText = pad(hours);
    document.getElementById("m").innerText = pad(minutes);
    document.getElementById("s").innerText = seconds; // Không cần pad số 0 ở 3s cuối cho đẹp
}

// Chuyển sang chế độ 3 giây cuối
function enterFinalCountdown() {
    document.body.classList.add('final-mode');
    
    // Play sound tick tock (nếu có audio)
    // const audio = new Audio('tick.mp3'); audio.play();
}

// Chúc mừng năm mới & Pháo hoa
function celebrateNewYear() {
    document.body.classList.remove('final-mode');
    document.body.classList.add('celebrate');
    
    // Bắn pháo hoa liên tục
    const duration = 15 * 1000; // 15 giây
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 999 };

    function randomInRange(min, max) {
      return Math.random() * (max - min) + min;
    }

    const interval = setInterval(function() {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
      
      // Pháo hoa ngẫu nhiên từ 2 bên hoặc ở giữa
      confetti(Object.assign({}, defaults, { 
          particleCount, 
          origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } 
      }));
      confetti(Object.assign({}, defaults, { 
          particleCount, 
          origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } 
      }));
    }, 250);
}

setInterval(updateCountdown, 1000);
updateCountdown();


// --- 2. TEXT REVEAL ANIMATION (GSAP) ---

// Helper: Split text into spans
function splitText(selector) {
    const elements = document.querySelectorAll(selector);
    elements.forEach(el => {
        const text = el.innerText;
        el.innerHTML = text.split('').map(char => {
            return char === ' ' ? '&nbsp;' : `<span class="char">${char}</span>`;
        }).join('');
    });
}

// Split titles
splitText('.text-reveal-char');

// Timeline
const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

tl.from(".main-stage", { 
    duration: 1.5, 
    y: 50, 
    opacity: 0, 
    delay: 0.5 
})
.from(".border-line", {
    duration: 1,
    scaleX: 0,
    stagger: 0.2
}, "-=1")
.from(".corner", {
    duration: 0.8,
    scale: 0,
    rotation: 45,
    stagger: 0.1
}, "-=1.5")
.from(".text-reveal", {
    duration: 1.2,
    y: 100,
    opacity: 0,
    stagger: 0.2,
    ease: "power4.out"
}, "-=0.5")
.from(".char", {
    duration: 1,
    y: 100,
    opacity: 0,
    stagger: 0.03, // Hiệu ứng lượn sóng từng chữ cái
    rotationX: -90,
    transformOrigin: "0% 50% -50"
}, "-=1")
.from(".countdown-container", {
    duration: 1.5,
    opacity: 0,
    y: 30
}, "-=0.5")
.from(".lantern-container", {
    duration: 2,
    marginTop: -200, 
    opacity: 0,
    stagger: 0.3,
    ease: "bounce.out"
}, "-=2");


// --- 3. WEBGL SHADER RENDERER ---
const canvas = document.getElementById("gl-canvas");
const gl = canvas.getContext("webgl");

if (!gl) {
    console.error("WebGL not supported");
}

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    gl.viewport(0, 0, canvas.width, canvas.height);
}
window.addEventListener("resize", resizeCanvas);
resizeCanvas();

// Compile Shader
function createShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error(gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
    }
    return shader;
}

const vertexSrc = document.getElementById("vertexShader").textContent;
const fragmentSrc = document.getElementById("fragmentShader").textContent;

const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexSrc);
const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentSrc);

const program = gl.createProgram();
gl.attachShader(program, vertexShader);
gl.attachShader(program, fragmentShader);
gl.linkProgram(program);
gl.useProgram(program);

// Setup Geometry (Full quad)
const positionBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
    -1, -1,
     1, -1,
    -1,  1,
    -1,  1,
     1, -1,
     1,  1,
]), gl.STATIC_DRAW);

const positionLocation = gl.getAttribLocation(program, "a_position");
gl.enableVertexAttribArray(positionLocation);
gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

// Uniforms
const resolutionLocation = gl.getUniformLocation(program, "u_resolution");
const timeLocation = gl.getUniformLocation(program, "u_time");

// Render Loop
function render(time) {
    time *= 0.001; // Convert to seconds

    gl.uniform2f(resolutionLocation, canvas.width, canvas.height);
    gl.uniform1f(timeLocation, time);

    gl.drawArrays(gl.TRIANGLES, 0, 6);

    requestAnimationFrame(render);
}
requestAnimationFrame(render);
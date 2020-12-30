// Adapted from https://codepen.io/nw/pen/zvQVWM
<template>
  <div class="countdownContainer">
    <div class="countdown countdown--wide" id="countdown">
      <div class="countdown__fill" id="ticker"></div>
      <div class="countdown__digit" id="seconds">00</div>
    </div>
  </div>
</template>

<script>
function Timer(duration, element) {
  this.duration = duration;
  this.element = element;
  this.running = false;

  this.els = {
    ticker: document.getElementById('ticker'),
    seconds: document.getElementById('seconds'),
  };
}

Timer.prototype.start = function _() {
  const self = this;
  let start;
  let diff;
  let newSeconds;
  let remainingSeconds;
  this.running = true;
  this.els.seconds.textContent = this.duration / 1000;
  remainingSeconds = this.els.seconds.textContent;

  function draw(now) {
    if (!start) start = now;
    diff = now - start;
    newSeconds = Math.ceil((self.duration - diff) / 1000);

    if (diff <= self.duration) {
      self.els.ticker.style.height = `${100 - ((diff / self.duration) * 100)}%`;

      if (newSeconds !== remainingSeconds) {
        self.els.seconds.textContent = newSeconds;
        remainingSeconds = newSeconds;
      }

      self.frameReq = window.requestAnimationFrame(draw);
    } else {
      self.running = false;
      self.els.seconds.textContent = 'GO';
      self.els.ticker.style.height = '0%';
      self.element.classList.add('countdown--ended');
    }
  }

  self.frameReq = window.requestAnimationFrame(draw);
};

Timer.prototype.reset = function _() {
  this.running = false;
  window.cancelAnimationFrame(this.frameReq);
  this.els.seconds.textContent = this.duration / 1000;
  this.els.ticker.style.height = null;
  this.element.classList.remove('countdown--ended');
};

Timer.prototype.setDuration = function _(duration) {
  this.duration = duration;
  this.els.seconds.textContent = this.duration / 1000;
};

export default {
  data: () => ({
    timer: null,
  }),
  methods: {
    startCountdown() {
      this.timer = new Timer(this.$store.state.countdownDuration, document.getElementById('countdown'));
      this.timer.start();
    },
    resetCountdown() {
      this.timer.reset();
    },
  },
};
</script>

<style scoped>
  .countdownContainer {
    background-color: black;
    position: fixed;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    z-index: 9999999;
    justify-content: center;
    align-items: center;
    overflow: hidden;
  }
  .countdown {
    display: block;
    width: 66vmin;
    height: 66vmin;
    position: relative;
    display: flex;
    justify-content: center;
    align-items: center;
    font-family: "Oswald", sans-serif;
    font-weight: 400;
    font-size: 25vmin;
    border-radius: 50%;
    overflow: hidden;
    cursor: pointer;
    transition: width, height, border-radius, font-size;
    transition-duration: 0.2s;
  }
  .countdown--ended {
    -webkit-animation: buzz 0.5s;
            animation: buzz 0.5s;
  }
  .countdown:active {
    transform: scale(1.02);
  }
  @-webkit-keyframes buzz {
    0% {
      transform: rotate(0);
    }
    10%, 30%, 50%, 70%, 90% {
      transform: rotate(6deg);
    }
    20%, 40%, 60%, 80% {
      transform: rotate(-6deg);
    }
    100% {
      transform: rotate(0);
    }
  }
  @keyframes buzz {
    0% {
      transform: rotate(0);
    }
    10%, 30%, 50%, 70%, 90% {
      transform: rotate(6deg);
    }
    20%, 40%, 60%, 80% {
      transform: rotate(-6deg);
    }
    100% {
      transform: rotate(0);
    }
  }
  .countdown--wide {
    width: 100%;
    height: 100%;
    font-size: 50vmin;
    border-radius: 0;
  }
  .countdown__fill {
    display: block;
    width: 100%;
    height: 100%;
    position: absolute;
    left: 0;
    bottom: 0;
    background: #FF5722;
    opacity: 1;
  }
  .countdown__digit {
    width: 100%;
    color: #FF5722;
    text-align: center;
    mix-blend-mode: difference;
    pointer-events: none;
    -webkit-user-select: none;
       -moz-user-select: none;
        -ms-user-select: none;
            user-select: none;
  }
  .countdown__buttons {
    position: absolute;
    right: 50px;
    top: 50%;
    height: 200px;
    margin-top: -100px;
    color: white;
    z-index: 1;
  }
  .countdown__button {
    height: 50%;
  }
  .full-button {
    position: absolute;
    right: 10px;
    bottom: 10px;
    padding: 1em 0.5em 0.5em 2em;
    font-family: "Oswald", sans-serif;
    text-transform: uppercase;
    color: white;
    cursor: pointer;
  }
</style>

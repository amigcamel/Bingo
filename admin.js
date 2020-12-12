const API_HOST = 'http://127.0.0.1:8000';

function getRandom(arr, n) {
  // How to get a number of random elements from an array?
  // https://stackoverflow.com/a/19270021/1105489
  var result = new Array(n),
    len = arr.length,
    taken = new Array(len);
  if (n > len)
    throw new RangeError('getRandom: more elements taken than available');
  while (n--) {
    var x = Math.floor(Math.random() * len);
    result[n] = arr[x in taken ? taken[x] : x];
    taken[x] = --len in taken ? taken[len] : len;
  }
  return result;
}

var app = new Vue({
  el: '#app',
  data: {
    hsdic: hsdic,
    sids: Object.keys(hsdic),
    winners: [],
    targetSids: [],
    defaultCountdown: 10,
    countdown: 10,
    isCounting: false,
    isPause: false,
    target: {},
    timeouts: [],
    beepSound: new Audio('./beep.mp3'),
    // applauseSound: new Audio('./applause.mp3'),
  },
  mounted: function() {
    // check winners
    this.getWinners();

    // randomly display images
    this.randomDisplay();
  },
  methods: {
    getWinners: function() {
      const intv = setInterval(() => {
        axios
          .get(`${API_HOST}/winners`)
          .then((response) => {
            if (response.data.winners) {
              this.winners = response.data.winners.slice().reverse();
            } else {
              this.winners = [];
            }
          })
          .catch((error) => {
            Swal.fire({title: 'Critical', text: error});
          });
      }, 1000);
    },
    getRandomSid: function() {
      const sid = getRandom(this.sids, 1)[0];
      return sid;
    },
    randomDisplay: function() {
      const intv = setInterval(() => {
        if (!Object.keys(this.targetSids).length && !this.isCounting) {
          const sid = this.getRandomSid();
          this.target = this.composeTarget(sid);
        } else {
          clearInterval(intv);
        }
      }, 1000);
    },
    composeTarget: function(sid) {
      const name = this.hsdic[sid].name;
      const url = `https://lh3.googleusercontent.com/a-/${this.hsdic[sid].uri}=s500`;
      return {sid: sid, name: name, url: url};
    },
    removeOneSid: function() {
      // pop a sid from this.sids and set target
      const sid = this.getRandomSid();
      const idx = this.sids.indexOf(sid);
      this.sids.splice(idx, 1);
      this.target = this.composeTarget(sid);
      this.targetSids.unshift(sid);
      axios
        .put(`${API_HOST}/targetsids`, {
          sid: sid
        })
      .then((response) => {
        console.log(response);
      })
      .catch((error) => {
        Swal.fire({title: 'Critical', text: error});
        this.pause();
      });
    },
    start: function() {
      this.isCounting = true;
      this.target = {};
      this.removeOneSid();
      setTimeout(() => {
        this.countdown--;
      }, 1000);
    },
    resume: function() {
      this.isCounting = true;
      this.isPause = false;
      setTimeout(() => {
        this.countdown--;
      }, 1000);
    },
    pause: function() {
      this.isCounting = false;
      this.isPause = true;
    },
    reset: function() {
      this.pause();
      Swal.fire({
        title: 'Reset',
        text: 'Are you sure?',
        showCancelButton: true
      }).then((result) => {
        if (result.value) {
          this.isCounting = false;
          this.isPause = false;
          this.countdown = this.defaultCountdown;
          this.sids = Object.keys(hsdic);
          this.target = {};
          this.targetSids = [];
          axios 
            .delete(`${API_HOST}/targetsids`)
            .then((response) => {
              console.log(response);
            })
            .catch((error) => {
              Swal.fire({title: 'Critical', text: error});
            });
          this.randomDisplay();
        } else {
          this.resume();
        }
      });
    },
  },
  watch: {
    defaultCountdown: function(val) {
      console.log(val);
      this.countdown = val;
    },
    countdown: function(val) {
      // play beep sound
      if (val <= 5){
        this.beepSound.play();
      } 
      if (val > 0) {
        setTimeout(() => {
          if (this.isCounting) {
            if (val === 1) {
              this.countdown = this.defaultCountdown + 1;
              if (this.sids.length === 0) {
                this.isCounting = false;
                this.isPause = false;
                Swal.fire('END!');
                return;
              }
              this.removeOneSid();
            }
            this.countdown--;
          }
        }, 1000);
      }
    },
    // winners: function() {
    //   console.log(this.winners)
    //   this.applauseSound.play();
    // }
  },
});
